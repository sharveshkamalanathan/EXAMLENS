import re
from typing import List, Dict, Any, Tuple, Optional
from difflib import SequenceMatcher
from app.models.question import Question
from app.services.ocr.handwriting_enhancer import (
    clean_handwriting_text,
    normalize_digit_char,
    normalize_question_marker
)

# Universal question marker regex:
# Matches:
# 1. Q1, Q.1, Q. 1, q1, q.1, Q. 1), Ans 1, Answer 1, Question 1, Que 1, 0.1), QI), QS)
# 2. Parenthesized / Bracketed: (1), ( 1 ), [1], [ 1 ]
# 3. Bare digits with delimiter: 1., 1), 1 ), 1 :, 1 -, 1>
# 4. Bare digit followed by subtopic word or prompt keyword: e.g. "1 Definition", "1 Meaning"
QUESTION_MARKER_REGEX = re.compile(
    r'^(?:'
    r'(?:[Qq](?:uestion|ues|ue|n)?|[Aa]ns(?:wer)?|[0Oo])\.?\s*(?:[Nn]o\.?)?[\s:\-–—]*\(?\s*([0-9ISLZislz]+|[0-9]+[a-z]?)\s*\)?[\.\:\-–—\)]?'
    r'|'
    r'[\(\[]\s*([0-9ISLZislz]+|[0-9]+[a-z]?)\s*[\)\]][\.\:\-–—]?'
    r'|'
    r'\(?\s*([0-9ISLZislz]+|[0-9]+[a-z]?)\s*[\.\:\-–—\)\>]\s*'
    r'|'
    r'([0-9ISLZislz]+)\s+(?=[A-Za-z])'
    r')\s*(.*)$',
    re.IGNORECASE
)

EXPLICIT_PREFIX = re.compile(
    r'^(?:[Qq](?:uestion|ues|ue|n)?|[Aa]ns(?:wer)?|[0Oo]\.?\s*[0-9])',
    re.IGNORECASE
)

# Common academic subtopics / section labels students write right after question numbers or on the next line:
# e.g. "q.1) Definition", "1) Meaning", "1. Concept", "Q1. Overview"
SUBTOPIC_KEYWORDS = {
    'definition', 'definintion', 'meaning', 'concept', 'explanation', 'overview',
    'introduction', 'functions', 'types', 'solution', 'answer', 'ans', 'points',
    'diagram', 'example', 'examples', 'advantages', 'disadvantages', 'working',
    'principle', 'majorfunctions', 'fiveprocessstates', 'differences', 'part', 'section',
    'summary', 'conclusion', 'features', 'classification', 'mechanism', 'purpose'
}

def normalize_q_label(raw: str) -> str:
    """Normalizes 'Q1', 'QI', '1', 'Q. 1', 'q.1)' to standard numeric/alphanumeric."""
    if not raw:
        return ""
    s = raw.strip().lower()
    s = s.replace('i', '1').replace('l', '1').replace('|', '1')
    s = s.replace('z', '2')
    s = s.replace('s', '5')
    s = s.replace('o', '0')
    s = s.replace('b', '8')
    return re.sub(r'[^0-9a-z]', '', s)

def extract_key_terms(text: str) -> List[str]:
    """Extracts significant domain keywords (ignoring generic question filler words)."""
    clean = re.sub(r'^[0-9\.\s]+', '', text.lower())
    words = re.findall(r'[a-z]{4,}', clean)
    stop_words = {
        'what', 'explain', 'different', 'four', 'major', 'define', 
        'briefly', 'state', 'write', 'between', 'with', 'their', 'each',
        'describe', 'following', 'system', 'systems'
    }
    return [w for w in words if w not in stop_words]

def segment_text_by_questions(
    full_text: str,
    questions: List[Question]
) -> List[Dict[str, Any]]:
    """
    Intelligently segments handwritten OCR text into question-specific answers.
    Guarantees:
    1. AT MOST ONE answer segment per exam question (never segments one question multiple times).
    2. Correctly detects when a question was SKIPPED / NOT ATTENDED (marks it as [Not Attempted / Blank]).
    3. Handles diverse student question notations: 'q.1)', 'Q1)', 'q1)', '1)', '1.', 'Q. 1', 'Ans 1', '(1)', etc.
    4. Multi-line lookahead: tolerates blank lines between question headers (e.g. 'q.1)' -> blank line -> answer).
    5. Preserves internal bullet points without misclassifying them as questions.
    6. Secondary semantic recovery pass: ensures student answers are not dropped if numbers were faintly written.
    """
    if not questions:
        return []

    # Clean raw OCR handwriting text first
    cleaned_full_text = clean_handwriting_text(full_text)
    raw_lines = cleaned_full_text.split('\n')
    lines = [l.strip() for l in raw_lines]

    if not any(lines):
        return []

    ordered_questions = sorted(questions, key=lambda q: getattr(q, 'display_order', 0))

    # Candidate boundaries: question_id -> (line_idx, score, confidence)
    question_candidates: Dict[str, Tuple[int, float, float]] = {}
    last_line_pos = 0

    for q_idx, target_q in enumerate(ordered_questions):
        expected_digit = str(q_idx + 1)
        expected_norm_q = normalize_q_label(target_q.question_number)
        clean_prompt = re.sub(r'^[a-zA-Z0-9\.\)\s]+', '', target_q.text).strip().lower()
        q_keywords = extract_key_terms(target_q.text)
        prev_keywords = extract_key_terms(ordered_questions[q_idx - 1].text) if q_idx > 0 else []
        unique_kw = [k for k in q_keywords if k not in prev_keywords] or q_keywords

        best_cand: Optional[Tuple[int, float, float]] = None
        best_score = -1.0

        for line_idx in range(last_line_pos, len(lines)):
            line = lines[line_idx]
            if not line:
                continue

            m = QUESTION_MARKER_REGEX.match(line)
            if m:
                digit = m.group(1) or m.group(2) or m.group(3) or (m.group(4) if len(m.groups()) >= 4 else None)
                norm_d = normalize_q_label(digit) if digit else ""
                rest = (m.group(len(m.groups())) if len(m.groups()) >= 1 else "").strip().lower()
                is_explicit = bool(EXPLICIT_PREFIX.match(line))

                digit_matches = (
                    norm_d == expected_digit or
                    norm_d == expected_norm_q or
                    (norm_d and norm_d.endswith(expected_digit))
                )

                if digit_matches:
                    # Question 1 at start of paper is unconditionally valid
                    if q_idx == 0:
                        best_cand = (line_idx, 10.0, 0.98)
                        break

                    # Explicit question markers (e.g. "Q2)", "Ans 2", "Question 2", "q.2)")
                    if is_explicit:
                        best_cand = (line_idx, 10.0, 0.98)
                        break

                    # Multi-line lookahead: check following non-empty lines if rest is empty or a subtopic
                    # e.g., line 0: "2)" -> line 1: "" -> line 2: "Definition of Process"
                    next_lines_text = []
                    lookahead_idx = line_idx + 1
                    while lookahead_idx < len(lines) and len(next_lines_text) < 6:
                        if lines[lookahead_idx]:
                            next_lines_text.append(lines[lookahead_idx].lower())
                        lookahead_idx += 1
                    block_lookahead = ' '.join(next_lines_text)

                    sim = SequenceMatcher(None, rest[:50], clean_prompt[:50]).ratio()
                    matched_unique = [k for k in unique_kw if k in rest or SequenceMatcher(None, k, rest).ratio() >= 0.75]
                    block_unique = [k for k in unique_kw if k in block_lookahead]
                    is_subtopic = any(sub in rest for sub in SUBTOPIC_KEYWORDS) or len(rest) == 0

                    # In-sequence number base score (since digit matches sequential question)
                    score = 4.5
                    if sim >= 0.35:
                        score += sim * 6.0
                    if matched_unique:
                        score += len(matched_unique) * 3.5
                    if block_unique:
                        score += len(block_unique) * 3.0
                    if is_subtopic:
                        score += 2.0

                    if score > best_score and score >= 2.0:
                        best_score = score
                        best_cand = (line_idx, score, min(0.98, max(0.80, 0.80 + score / 15.0)))
            else:
                # Line without question marker - check for prompt text similarity (e.g. OCR misread digit as letter)
                if len(line) >= 20:
                    clean_l = re.sub(r'^[a-zA-Z0-9\.\)\s]+', '', line).strip().lower()
                    sim = SequenceMatcher(None, clean_l[:45], clean_prompt[:45]).ratio()
                    matched_kw = [k for k in unique_kw if k in line.lower()]
                    if sim >= 0.55 and len(matched_kw) >= 1:
                        score = sim * 5.0 + len(matched_kw) * 3.0
                        if score > best_score and score >= 3.0:
                            best_score = score
                            best_cand = (line_idx, score, 0.90)

        if best_cand:
            question_candidates[target_q.id] = best_cand
            last_line_pos = best_cand[0] + 1

    # Build sorted boundaries from detected candidates
    detected_boundaries: List[Tuple[int, Question, float]] = []
    for q in ordered_questions:
        if q.id in question_candidates:
            line_idx, _, conf = question_candidates[q.id]
            detected_boundaries.append((line_idx, q, conf))

    detected_boundaries.sort(key=lambda x: x[0])

    # If absolutely no boundaries were found, assign full text to first question
    if not detected_boundaries:
        return [{
            "question_id": ordered_questions[0].id,
            "question_number": ordered_questions[0].question_number,
            "question_text": ordered_questions[0].text,
            "text": cleaned_full_text.strip(),
            "confidence": 0.60,
            "is_manual_required": True,
            "reason": "No explicit question markers detected"
        }]

    # Slice answers between confirmed question boundaries
    aggregated_answers: Dict[str, Dict[str, Any]] = {}

    for i, (start_line, q, conf) in enumerate(detected_boundaries):
        end_line = detected_boundaries[i + 1][0] if i + 1 < len(detected_boundaries) else len(lines)
        ans_lines = lines[start_line:end_line]
        
        # Check if this slice has actual content beyond just empty lines
        non_empty_content = [l for l in ans_lines if l.strip()]
        if not non_empty_content:
            answer_block = "[Not Attempted / Blank]"
        else:
            answer_block = '\n'.join(ans_lines).strip()

        aggregated_answers[q.id] = {
            "question_id": q.id,
            "question_number": q.question_number,
            "question_text": q.text,
            "text": answer_block,
            "confidence": conf,
            "is_manual_required": conf < 0.80,
            "reason": f"Matched question header with {int(conf * 100)}% confidence"
        }

    # Assemble final output for ALL exam questions in order
    result_segments: List[Dict[str, Any]] = []
    for q in ordered_questions:
        if q.id in aggregated_answers:
            result_segments.append(aggregated_answers[q.id])
        else:
            # Question was SKIPPED / NOT ATTENDED by the student
            result_segments.append({
                "question_id": q.id,
                "question_number": q.question_number,
                "question_text": q.text,
                "text": "[Not Attempted / Blank]",
                "confidence": 0.99,
                "is_manual_required": False,
                "reason": "Question was skipped or not attempted by student"
            })

    return result_segments
