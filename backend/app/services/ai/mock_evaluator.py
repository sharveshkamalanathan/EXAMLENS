import re
from typing import List
from app.services.ai.base import BaseAIEvaluator
from app.schemas.evaluation import AIEvaluationOutput, CriterionEvaluationSchema
from app.models.question import Question

class MockAIEvaluator(BaseAIEvaluator):
    @property
    def provider_name(self) -> str:
        return "mock_demo"

    def evaluate_answer(
        self,
        question: Question,
        student_answer: str,
        student_roll_no: str = ""
    ) -> AIEvaluationOutput:
        answer_lower = student_answer.lower()
        criteria_results: List[CriterionEvaluationSchema] = []
        all_correct_concepts = []
        all_missing_concepts = []
        strengths = []
        weaknesses = []
        improvement_suggestions = []
        
        # If student answer is empty or virtually blank
        if not student_answer.strip() or len(student_answer.strip()) < 5:
            for crit in question.rubric_criteria:
                criteria_results.append(CriterionEvaluationSchema(
                    criterion_name=crit.name,
                    criterion_id=crit.id,
                    maximum_marks=crit.max_marks,
                    awarded_marks=0.0,
                    explanation=f"No answer provided for {crit.name}.",
                    evidence=None,
                    missing_concepts=crit.expected_concepts or [crit.name],
                    incorrect_concepts=[],
                    confidence=0.99
                ))
            return AIEvaluationOutput(
                criteria=criteria_results,
                correct_concepts=[],
                missing_concepts=[crit.name for crit in question.rubric_criteria],
                incorrect_statements=[],
                strengths=[],
                weaknesses=["Answer was left blank or unreadable"],
                improvement_suggestions=["Attempt answering all sections to receive partial marks"],
                overall_feedback="No legible answer content detected.",
                confidence=0.99,
                requires_human_review=False,
                review_reason=None
            )

        # Evaluate against each rubric criterion
        total_awarded = 0.0
        total_possible = sum(c.max_marks for c in question.rubric_criteria) or question.max_marks

        for crit in question.rubric_criteria:
            expected = crit.expected_concepts if crit.expected_concepts else [crit.name]
            matched_concepts = []
            unmatched_concepts = []
            found_evidence = []

            for concept in expected:
                concept_words = re.findall(r'\b[a-z]{3,}\b', concept.lower())
                # Check for semantic / keyword presence
                matched_words = [w for w in concept_words if w in answer_lower]
                if len(matched_words) >= max(1, len(concept_words) // 2):
                    matched_concepts.append(concept)
                    # Find a sentence citing evidence
                    for sentence in re.split(r'[.\n]', student_answer):
                        if any(w in sentence.lower() for w in matched_words):
                            found_evidence.append(sentence.strip())
                            break
                else:
                    unmatched_concepts.append(concept)

            coverage_ratio = len(matched_concepts) / len(expected) if expected else 0.5
            # Scale awarded marks
            if coverage_ratio >= 0.8:
                awarded = crit.max_marks
                explanation = f"Fully demonstrates understanding of {crit.name.lower()}."
                strengths.append(f"Clear explanation of {crit.name.lower()}.")
            elif coverage_ratio >= 0.4:
                awarded = round(crit.max_marks * 0.5, 1)
                explanation = f"Partially explains {crit.name.lower()}, but misses key components."
                weaknesses.append(f"Incomplete coverage of {crit.name.lower()}.")
                improvement_suggestions.append(f"Include more technical detail on {', '.join(unmatched_concepts)}.")
            else:
                awarded = 0.0
                explanation = f"Does not sufficiently address {crit.name.lower()}."
                weaknesses.append(f"Missed {crit.name.lower()}.")
                improvement_suggestions.append(f"Review core concepts for {crit.name.lower()}.")

            # Boundary safety
            awarded = max(0.0, min(crit.max_marks, awarded))
            total_awarded += awarded

            all_correct_concepts.extend(matched_concepts)
            all_missing_concepts.extend(unmatched_concepts)

            evidence_str = found_evidence[0] if found_evidence else None

            criteria_results.append(CriterionEvaluationSchema(
                criterion_name=crit.name,
                criterion_id=crit.id,
                maximum_marks=crit.max_marks,
                awarded_marks=awarded,
                explanation=explanation,
                evidence=evidence_str,
                missing_concepts=unmatched_concepts,
                incorrect_concepts=[],
                confidence=round(0.88 + (coverage_ratio * 0.1), 2)
            ))

        # Check if question warrants human review
        score_ratio = total_awarded / total_possible if total_possible > 0 else 0
        requires_review = False
        review_reason = None
        
        if 0.35 <= score_ratio <= 0.65:
            requires_review = True
            review_reason = "Borderline partial mark evaluation; teacher confirmation recommended."
        elif "semaphore" in answer_lower and "mutex" in answer_lower and any(c.awarded_marks < c.maximum_marks for c in criteria_results):
            requires_review = True
            review_reason = "Nuanced comparison answer; verify technical distinction."

        overall_conf = round(sum(c.confidence for c in criteria_results) / len(criteria_results), 2) if criteria_results else 0.88

        # Craft overall feedback
        if score_ratio >= 0.85:
            feedback = "Excellent answer. Demonstrates thorough conceptual understanding with clear technical explanations."
        elif score_ratio >= 0.5:
            feedback = f"Good attempt with solid foundation on {', '.join(all_correct_concepts[:2]) if all_correct_concepts else 'the main topic'}, but lacked key details on {', '.join(all_missing_concepts[:2]) if all_missing_concepts else 'some areas'}."
        else:
            feedback = f"The response shows basic awareness but misses essential criteria required for full marks. Focus on {', '.join(all_missing_concepts[:2]) if all_missing_concepts else 'fundamental definitions'}."

        return AIEvaluationOutput(
            criteria=criteria_results,
            correct_concepts=list(dict.fromkeys(all_correct_concepts)),
            missing_concepts=list(dict.fromkeys(all_missing_concepts)),
            incorrect_statements=[],
            strengths=list(dict.fromkeys(strengths)) or ["Attempted all required sections"],
            weaknesses=list(dict.fromkeys(weaknesses)) or ["None identified"],
            improvement_suggestions=list(dict.fromkeys(improvement_suggestions)) or ["Maintain this level of detail"],
            overall_feedback=feedback,
            confidence=overall_conf,
            requires_human_review=requires_review,
            review_reason=review_reason
        )
