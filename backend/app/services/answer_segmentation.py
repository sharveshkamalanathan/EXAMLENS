import re
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.question import Question

QUESTION_REGEX = re.compile(
    r'(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*(\d+[a-z]?|\d+|\([a-z]\))|(\d+[\.\)]\s*[a-z]?|\d+\([a-z]\)))\s*[:.\-–]?\s*',
    re.IGNORECASE
)

def segment_text_by_questions(
    full_text: str,
    questions: List[Question]
) -> List[Dict[str, Any]]:
    """
    Segments OCR text into question-specific answers by scanning for question headers.
    Falls back gracefully to assigning remaining text or question-order heuristics.
    """
    segments: List[Dict[str, Any]] = []
    
    # Map questions by number for fast matching: "1", "q1", "2a", "2(a)"
    q_map: Dict[str, Question] = {}
    for q in questions:
        norm_no = re.sub(r'[^a-z0-9]', '', q.question_number.lower())
        q_map[norm_no] = q
        # Also map without leading 'q'
        if norm_no.startswith('q'):
            q_map[norm_no[1:]] = q

    # Find all question match locations
    matches = list(QUESTION_REGEX.finditer(full_text))
    
    if not matches:
        # If no explicit markers found, assign to the first question with lower confidence
        if questions:
            segments.append({
                "question_id": questions[0].id,
                "question_number": questions[0].question_number,
                "text": full_text.strip(),
                "confidence": 0.60,
                "is_manual_required": True,
                "reason": "No explicit question numbers detected in handwritten text"
            })
        return segments

    for i, match in enumerate(matches):
        raw_num = match.group(1) or match.group(2) or ""
        norm_num = re.sub(r'[^a-z0-9]', '', raw_num.lower())
        
        # Calculate answer slice
        start_pos = match.end()
        end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        answer_text = full_text[start_pos:end_pos].strip()

        # Match with exam question
        matched_q = q_map.get(norm_num)
        if not matched_q and norm_num.startswith('q'):
            matched_q = q_map.get(norm_num[1:])
        
        # If still not matched, pick by sequential index if valid
        if not matched_q and i < len(questions):
            matched_q = questions[i]
            confidence = 0.75
        elif matched_q:
            confidence = 0.95
        else:
            confidence = 0.50

        if matched_q:
            segments.append({
                "question_id": matched_q.id,
                "question_number": matched_q.question_number,
                "text": answer_text,
                "confidence": confidence,
                "is_manual_required": confidence < 0.80,
                "reason": "Successfully matched question marker" if confidence >= 0.80 else "Heuristic match requires verification"
            })

    return segments
