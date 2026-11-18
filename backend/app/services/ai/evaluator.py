import json
import time
import httpx
from typing import Optional
from app.core.config import settings
from app.services.ai.base import BaseAIEvaluator
from app.schemas.evaluation import AIEvaluationOutput, CriterionEvaluationSchema
from app.models.question import Question

class RealAIEvaluator(BaseAIEvaluator):
    @property
    def provider_name(self) -> str:
        return settings.AI_PROVIDER

    def is_configured(self) -> bool:
        return bool(settings.AI_API_KEY)

    def evaluate_answer(
        self,
        question: Question,
        student_answer: str,
        student_roll_no: str = ""
    ) -> AIEvaluationOutput:
        if not self.is_configured():
            raise ValueError(
                "AI Provider is not configured. Please set AI_API_KEY in environment variables."
            )

        # Build rubric criteria string
        rubric_lines = []
        for crit in question.rubric_criteria:
            expected = ", ".join(crit.expected_concepts) if crit.expected_concepts else "None specified"
            rubric_lines.append(
                f"- ID: {crit.id} | Name: {crit.name} | Max Marks: {crit.max_marks}\n"
                f"  Expected Concepts: {expected}\n"
                f"  Scoring Instructions: {crit.scoring_instructions or 'Award marks proportionately based on understanding.'}"
            )
        rubric_text = "\n".join(rubric_lines)

        prompt = f"""You are ExamLens AI, an expert academic evaluation system for college examinations.
Evaluate the student's handwritten examination answer against the reference answer and the teacher's configured marking rubric.

FAIRNESS & EVALUATION RULES:
1. Understand the semantic meaning of the student's answer. Accept scientifically/technically correct alternative explanations. Do NOT require exact keyword matching.
2. Evaluate each rubric criterion independently and award fair partial marks (between 0.0 and criterion maximum).
3. Total awarded marks must NEVER exceed the question's maximum marks ({question.max_marks}).
4. Cite actual verbatim evidence from the student's answer whenever awarding marks. Do NOT fabricate evidence.
5. Identify correct concepts, missing concepts, strengths, weaknesses, and improvement suggestions.
6. Provide an honest confidence score (between 0.0 and 1.0). If the answer is ambiguous or borderline, set requires_human_review = true with an explicit review_reason.

QUESTION DETAILS:
Question Number: {question.question_number}
Question Text: {question.text}
Maximum Marks: {question.max_marks}
Reference Answer:
{question.reference_answer}

MARKING RUBRIC CRITERIA:
{rubric_text}

STUDENT HANDWRITTEN EXTRACTED ANSWER:
{student_answer}

Respond ONLY with a valid JSON object matching this schema:
{{
  "criteria": [
    {{
      "criterion_name": "Criterion name",
      "criterion_id": "exact_criterion_id",
      "maximum_marks": 1.0,
      "awarded_marks": 1.0,
      "explanation": "Why marks were awarded or deducted",
      "evidence": "Actual phrase/sentence from student answer",
      "missing_concepts": ["concept1"],
      "incorrect_concepts": [],
      "confidence": 0.95
    }}
  ],
  "correct_concepts": ["concept1"],
  "missing_concepts": ["concept2"],
  "incorrect_statements": [],
  "strengths": ["Clear explanation of X"],
  "weaknesses": ["Missed aspect Y"],
  "improvement_suggestions": ["Include details on Z"],
  "overall_feedback": "Summary of performance",
  "confidence": 0.90,
  "requires_human_review": false,
  "review_reason": null
}}
"""

        headers = {
            "Authorization": f"Bearer {settings.AI_API_KEY}",
            "Content-Type": "application/json"
        }

        base_url = settings.AI_BASE_URL.rstrip('/')
        url = f"{base_url}/chat/completions"

        payload = {
            "model": settings.AI_MODEL,
            "messages": [
                {"role": "system", "content": "You are a precise, fair academic grading assistant that outputs only strict JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        # Make API request with retry
        max_retries = 3
        last_error = None
        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=45.0) as client:
                    resp = client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_content = data["choices"][0]["message"]["content"]
                        parsed = json.loads(raw_content)
                        
                        # Validate with Pydantic
                        eval_output = AIEvaluationOutput(**parsed)
                        
                        # Backend Boundary Enforcement
                        total_score = 0.0
                        for c in eval_output.criteria:
                            c.awarded_marks = max(0.0, min(c.maximum_marks, c.awarded_marks))
                            total_score += c.awarded_marks
                        
                        if total_score > question.max_marks:
                            scale = question.max_marks / total_score
                            for c in eval_output.criteria:
                                c.awarded_marks = round(c.awarded_marks * scale, 2)
                        
                        return eval_output
                    else:
                        last_error = f"AI API HTTP {resp.status_code}: {resp.text}"
            except Exception as e:
                last_error = str(e)
                time.sleep(1.0)

        raise RuntimeError(f"AI evaluation failed after {max_retries} attempts: {last_error}")
