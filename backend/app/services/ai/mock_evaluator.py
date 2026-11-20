import re
from typing import List, Dict, Set
from difflib import SequenceMatcher
from app.services.ai.base import BaseAIEvaluator
from app.schemas.evaluation import AIEvaluationOutput, CriterionEvaluationSchema
from app.models.question import Question

# Academic thesaurus: maps core technical terms to conceptual synonyms & alternative phrasings
ACADEMIC_SYNONYMS: Dict[str, Set[str]] = {
    'operating': {'os', 'system', 'software', 'platform', 'kernel'},
    'system': {'os', 'software', 'program', 'platform'},
    'interface': {'gui', 'cli', 'bridge', 'intermediary', 'interaction', 'user', 'hardware', 'abstraction', 'layer'},
    'manager': {'manages', 'managing', 'management', 'controls', 'coordinates', 'allocation', 'allocates', 'handling', 'supervises'},
    'resource': {'hardware', 'cpu', 'memory', 'devices', 'files', 'storage', 'ram', 'peripherals'},
    'process': {'task', 'program', 'execution', 'thread', 'job', 'active', 'instance'},
    'states': {'state', 'new', 'ready', 'running', 'waiting', 'blocked', 'terminated', 'exit', 'suspended'},
    'diagram': {'chart', 'transition', 'model', 'flow', 'figure', 'neat', 'graph'},
    'deadlock': {'circular', 'lock', 'starvation', 'blocked', 'coffman', 'resource', 'prevention', 'stalemate'},
    'conditions': {'condition', 'criteria', 'rules', 'factors', 'necessary', 'requirements'},
    'mutual': {'mutex', 'exclusion', 'exclusive', 'shared', 'nonshareable'},
    'preemption': {'preempt', 'interrupt', 'nonpreemptive', 'forceful', 'release'},
    'paging': {'page', 'pages', 'frame', 'frames', 'mmu', 'virtual', 'physical', 'address', 'translation'},
    'fragmentation': {'internal', 'external', 'wasted', 'overhead', 'unused'},
    'segmentation': {'segments', 'logical', 'variable', 'partition', 'chunks'},
    'thread': {'threads', 'lightweight', 'multithreading', 'concurrency'},
    'synchronization': {'sync', 'race', 'condition', 'atomic', 'semaphore', 'critical', 'locks'},
}

def concept_is_satisfied(concept: str, text: str) -> bool:
    """
    Intelligently checks whether an academic concept is satisfied.
    Accepts:
    1. Direct word or substring matches
    2. Academic synonyms (e.g. 'os' for 'operating system', 'controls' for 'manages')
    3. Root stems (e.g. 'differ' for 'differentiate', 'manag' for 'management')
    4. Fuzzy token similarity >= 75% for OCR handwriting typos
    """
    concept_lower = concept.lower()
    text_lower = text.lower()
    
    if concept_lower in text_lower:
        return True
        
    words = re.findall(r'\b[a-z]{3,}\b', concept_lower)
    if not words:
        return False
        
    matched = 0
    text_tokens = re.findall(r'\b[a-z]{3,}\b', text_lower)

    for w in words:
        if w in text_lower:
            matched += 1
            continue
        # Synonym check
        syns = ACADEMIC_SYNONYMS.get(w, set())
        if any(s in text_lower for s in syns):
            matched += 1
            continue
        # Stem prefix check (e.g. 'manag' for 'management')
        if len(w) >= 5 and any(tok.startswith(w[:4]) for tok in text_tokens):
            matched += 1
            continue
        # Fuzzy character similarity for handwriting OCR variance
        if any(SequenceMatcher(None, w, tok).ratio() >= 0.75 for tok in text_tokens):
            matched += 1
            continue
            
    return matched >= max(1, len(words) // 2)

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
        
        # 1. Unattempted / Blank Detection
        is_blank = (
            not student_answer.strip() 
            or len(student_answer.strip()) < 5 
            or "[not attempted" in answer_lower 
            or "[blank" in answer_lower
        )
        if is_blank:
            for crit in question.rubric_criteria:
                criteria_results.append(CriterionEvaluationSchema(
                    criterion_name=crit.name,
                    criterion_id=crit.id,
                    maximum_marks=crit.max_marks,
                    awarded_marks=0.0,
                    explanation=f"Question was not attempted by student.",
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
                weaknesses=["Question was not attempted"],
                improvement_suggestions=["Attempt answering all sections to receive partial marks"],
                overall_feedback="Question was left blank or unattempted. Zero marks awarded.",
                confidence=0.99,
                requires_human_review=False,
                review_reason=None
            )

        # 2. Topic Relevance Gate
        stop_words = {
            'what', 'explain', 'different', 'four', 'major', 'define', 'briefly', 
            'state', 'write', 'between', 'with', 'their', 'each', 'describe', 
            'following', 'definition', 'mechanism', 'technical', 'core'
        }
        topic_sources = []
        if question.text:
            topic_sources.extend(re.findall(r'\b[a-z]{4,}\b', question.text.lower()))
        if question.topic:
            topic_sources.extend(re.findall(r'\b[a-z]{4,}\b', question.topic.lower()))
        if question.important_concepts:
            for ic in question.important_concepts:
                topic_sources.extend(re.findall(r'\b[a-z]{4,}\b', ic.lower()))

        topic_keywords = [w for w in set(topic_sources) if w not in stop_words]

        # Check if any topic keywords, synonyms, or related terms appear in the student's answer
        has_relevance = True
        if topic_keywords:
            matched_topic_words = []
            for kw in topic_keywords:
                if kw in answer_lower:
                    matched_topic_words.append(kw)
                elif any(s in answer_lower for s in ACADEMIC_SYNONYMS.get(kw, set())):
                    matched_topic_words.append(kw)
            if len(matched_topic_words) == 0:
                has_relevance = False

        if not has_relevance:
            for crit in question.rubric_criteria:
                criteria_results.append(CriterionEvaluationSchema(
                    criterion_name=crit.name,
                    criterion_id=crit.id,
                    maximum_marks=crit.max_marks,
                    awarded_marks=0.0,
                    explanation=f"Irrelevant to {question.question_number}: Content does not address the required topic ({', '.join(topic_keywords[:3])}).",
                    evidence=None,
                    missing_concepts=crit.expected_concepts or [crit.name],
                    incorrect_concepts=[],
                    confidence=0.95
                ))
            return AIEvaluationOutput(
                criteria=criteria_results,
                correct_concepts=[],
                missing_concepts=[crit.name for crit in question.rubric_criteria],
                incorrect_statements=["Submitted content does not match the question topic."],
                strengths=[],
                weaknesses=[f"Answer is completely irrelevant to {question.question_number} ({question.text[:40]}...)."],
                improvement_suggestions=[f"Ensure answers are written under the correct question number: {question.text[:50]}"],
                overall_feedback=f"Irrelevant response. The answer does not address {question.question_number} and receives zero marks.",
                confidence=0.95,
                requires_human_review=True,
                review_reason=f"Flagged: Answer appears completely irrelevant or off-topic for {question.question_number}."
            )

        # 3. Wise Semantic Rubric Evaluation (Non-verbatim conceptual scoring)
        total_awarded = 0.0
        total_possible = sum(c.max_marks for c in question.rubric_criteria) or question.max_marks

        for crit in question.rubric_criteria:
            expected = crit.expected_concepts if crit.expected_concepts else [crit.name]
            matched_concepts = []
            unmatched_concepts = []
            found_evidence = []

            for concept in expected:
                if concept_is_satisfied(concept, student_answer):
                    matched_concepts.append(concept)
                    # Find a sentence citing evidence
                    for sentence in re.split(r'[.\n]', student_answer):
                        if any(w in sentence.lower() for w in re.findall(r'\b[a-z]{3,}\b', concept.lower())):
                            found_evidence.append(sentence.strip())
                            break
                        elif any(s in sentence.lower() for w in re.findall(r'\b[a-z]{3,}\b', concept.lower()) for s in ACADEMIC_SYNONYMS.get(w, [])):
                            found_evidence.append(sentence.strip())
                            break
                else:
                    unmatched_concepts.append(concept)

            coverage_ratio = len(matched_concepts) / len(expected) if expected else 0.5

            # Semantic cognitive grading sliding scale (does NOT demand exact verbatim words)
            if coverage_ratio >= 0.5:
                awarded = crit.max_marks
                explanation = f"Demonstrates solid conceptual understanding of {crit.name.lower()}."
                strengths.append(f"Clear explanation of {crit.name.lower()}.")
            elif coverage_ratio >= 0.2:
                awarded = round(crit.max_marks * 0.75, 1)
                explanation = f"Partially conveys core ideas of {crit.name.lower()} with valid explanation."
                strengths.append(f"Basic grasp of {crit.name.lower()}.")
                if unmatched_concepts:
                    improvement_suggestions.append(f"Consider elaborating on {', '.join(unmatched_concepts)}.")
            elif len(student_answer.split()) >= 15:
                # Substantive student writing related to topic - award partial credit
                awarded = round(crit.max_marks * 0.5, 1)
                explanation = f"Shows relevant contextual understanding of {crit.name.lower()}."
                weaknesses.append(f"Could be more technically precise on {crit.name.lower()}.")
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
                confidence=round(0.90 + (coverage_ratio * 0.08), 2)
            ))

        # 4. Check if question warrants human review
        score_ratio = total_awarded / total_possible if total_possible > 0 else 0
        requires_review = False
        review_reason = None
        
        if 0.35 <= score_ratio <= 0.60:
            requires_review = True
            review_reason = "Borderline partial mark evaluation; teacher confirmation recommended."
        elif "semaphore" in answer_lower and "mutex" in answer_lower and any(c.awarded_marks < c.maximum_marks for c in criteria_results):
            requires_review = True
            review_reason = "Nuanced comparison answer; verify technical distinction."

        overall_conf = round(sum(c.confidence for c in criteria_results) / len(criteria_results), 2) if criteria_results else 0.90

        # Craft overall feedback
        if score_ratio >= 0.80:
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
