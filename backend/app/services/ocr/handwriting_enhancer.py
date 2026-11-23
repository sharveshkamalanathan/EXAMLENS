import re
from typing import Dict, List, Tuple

# Domain & OCR handwriting correction patterns
# Maps common handwriting ligature & visual character errors to correct academic text
HANDWRITING_REPLACEMENTS: List[Tuple[str, str]] = [
    # Question marker normalizations
    (r'\bQ\s*I\b', 'Q1'),
    (r'\bQ\s*l\b', 'Q1'),
    (r'\bQ\s*\|\b', 'Q1'),
    (r'\bQ\s*Z\b', 'Q2'),
    (r'\bQ\s*S\b', 'Q5'),
    (r'\bAns(?:wer)?\s*[:.\-–]?\s*I\b', 'Ans 1'),
    (r'\bAns(?:wer)?\s*[:.\-–]?\s*S\b', 'Ans 5'),
    
    # Common cursive S vs f / t confusions
    (r'\bDeSine\b', 'Define'),
    (r'\bDeSinition\b', 'Definition'),
    (r'\bSunctions\b', 'functions'),
    (r'\bSunction\b', 'function'),
    (r'\binterSace\b', 'interface'),
    (r'\bIntepSace\b', 'Interface'),
    (r'\bsostware\b', 'software'),
    (r'\bdisserent\b', 'different'),
    (r'\bdisSerent\b', 'different'),
    (r'\bSiles\b', 'files'),
    (r'\bSile\b', 'file'),
    (r'\bSron\b', 'from'),
    (r'\bSor\b', 'for'),
    (r'\bSoup\s+Recessary\b', 'four necessary'),
    (r'\bDiserentiate\b', 'Differentiate'),
    (r'\bLircular\b', 'Circular'),
    (r'\bcrcular\b', 'circular'),
    (r'\besSiciently\b', 'efficiently'),
    (r'\bafsect\b', 'affect'),
    (r'\barsect\b', 'affect'),
    (r'\bclassisied\b', 'classified'),

    # Missing initial ligature in handwriting
    (r'\bhread\b', 'thread'),
    (r'\bhreads\b', 'threads'),

    # p vs r confusions at word boundaries
    (r'\bcomputerp\b', 'computer'),
    (r'\bcomputep\b', 'computer'),
    (r'\bUsep\b', 'User'),
    (r'\banothep\b', 'another'),
    (r'\bbrocess\b', 'process'),
    (r'\bFesource\b', 'resource'),
    (r'\bFesources\b', 'resources'),
    (r'\bnajop\b', 'major'),

    # g vs q confusions
    (r'\bacguire\b', 'acquire'),
    (r'\breguire\b', 'require'),
    (r'\breguires\b', 'requires'),
    (r'\beguipment\b', 'equipment'),
    (r'\bguick\b', 'quick'),

    # Common OCR abbreviations & hardware terms
    (r'\bCu\s*Time\b', 'CPU Time'),
    (r'\bCPu\b', 'CPU'),
    (r'\bCml\b', 'CPU'),
    (r'\bCLl/GUl\b', 'CLI/GUI'),
    (r'\bOaly\b', 'Only'),
    (r'\bIMutual\b', 'Mutual'),
    (r'\bSysten\b', 'System'),
    (r'\bhardare\b', 'hardware'),
    (r'\bprograns\b', 'programs'),
    (r'\borqanizes\b', 'organizes'),
    (r'\btermnation\b', 'termination'),
    (r'\bWiadows\b', 'Windows'),
    (r'\bLiaux\b', 'Linux'),
    (r'\bAadroid\b', 'Android'),
    (r'\bosOperating\b', 'of Operating'),
    (r'\bOperatiag\b', 'Operating'),
    (r'\boperatinl\b', 'operating'),
    (r'\bMulfitaskiag\b', 'Multitasking'),
    (r'\bRunniag\b', 'Running'),
    (r'\bTermiaated\b', 'Terminated'),

    # Real student handwriting OCR artifacts & subtopic normalizations
    (r'\bDefinintion\b', 'Definition'),
    (r'\bDe\s+finition\b', 'Definition'),
    (r'\bcos\)\b', '(OS)'),
    (r'\buserand\b', 'user and'),
    (r'\bsoftwareresources\b', 'software resources'),
    (r'\bcomputerresources\b', 'computer resources'),
    (r'\bMajorFunctions\b', 'Major Functions'),
    (r'\bHanages\b', 'Manages'),
    (r'\bHanagement\b', 'Management'),
    (r'\bHemory\b', 'Memory'),
    (r'\bAllws\b', 'Allows'),
    (r'\bsinqle\b', 'single'),
    (r'\btinne\b', 'time'),
    (r'\bexeeutetasks\b', 'execute tasks'),
    (r'\bexeeution\b', 'execution'),
    (r'\buuix\b', 'Unix'),
    (r'\bHarks\b', 'Marks'),
    (r'C5Marks\)', '(5 Marks)'),
    (r'5Harks\)', '(5 Marks)'),
    (r'c5\s*Marks\)', '(5 Marks)'),
    (r'\bVo\s+operation\b', 'I/O operation'),
    (r'\bComunication\b', 'Communication'),
    (r'\bFiveProcessStates\b', 'Five Process States'),
    (r'^yDifferentiate\b', '4. Differentiate'),

    # Pro-level word squishing & handwriting artifact fixes
    (r'\bme\s+mory\b', 'memory'),
    (r'\baddresspace\b', 'address space'),
    (r'\baddress\s+pace\b', 'address space'),
    (r'\bisdivided\b', 'is divided'),
    (r'\bis\s+a\b', 'is a'),
    (r'\bisa\b', 'is a'),
    (r'\bofa\b', 'of a'),
    (r'\btobe\b', 'to be'),
    (r'\bprocessto\b', 'process to'),
    (r'\blogicalmemory\b', 'logical memory'),
    (r'\bphysicalmemory\b', 'physical memory'),
    (r'\bnoncontiguous\b', 'non-contiguous'),
    (r'\bfourconditions\b', 'four conditions'),
    (r'\bmutualexclusion\b', 'mutual exclusion'),
    (r'\bholdandwait\b', 'hold and wait'),
    (r'\bnopreemption\b', 'no preemption'),
    (r'\bcircularwait\b', 'circular wait'),
]

DIGIT_MAP = {
    'I': '1',
    'L': '1',
    '|': '1',
    'l': '1',
    'Z': '2',
    'z': '2',
    'S': '5',
    's': '5',
    'O': '0',
    'o': '0',
    'B': '8'
}

def normalize_digit_char(ch: str) -> str:
    """Normalize a handwritten character to its numeric digit counterpart."""
    return DIGIT_MAP.get(ch, ch)

def normalize_question_marker(marker: str) -> str:
    """
    Normalizes handwritten question references like 'QI', 'Q. 1', 'Ans I', 'Q-S' into 'Q1', 'Q5'.
    """
    clean = marker.strip().upper()
    # Strip non-alphanumeric except dots/hyphens
    clean = re.sub(r'[^A-Z0-9]', '', clean)
    
    # Handle leading Q
    if clean.startswith('Q'):
        tail = clean[1:]
        normalized_tail = ''.join(normalize_digit_char(c) for c in tail)
        return f"Q{normalized_tail}"
        
    # Handle bare digits
    normalized = ''.join(normalize_digit_char(c) for c in clean)
    return normalized

def clean_handwriting_text(text: str) -> str:
    """
    Post-processes raw OCR extracted text to correct handwriting-specific
    character confusions, ligatures, and common student shorthand.
    """
    if not text:
        return ""
        
    cleaned = text
    for pattern, replacement in HANDWRITING_REPLACEMENTS:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
        
    # Normalize common trailing artifacts
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)
    return cleaned

# Common academic subtopics that students write in answer scripts
SUBTOPIC_HEADER_REGEX = re.compile(
    r'(?:^|\n)\s*(?:[-•*]\s*)?'
    r'(Definition|Concept|Overview|Introduction|'
    r'(?:Major\s+)?Functions(?:\s+of\s+[A-Za-z\s]+)?|'
    r'Types(?:\s+of\s+[A-Za-z\s]+)?|Classification|'
    r'Working\s+Principle|Architecture|Mechanism|'
    r'(?:Five\s+)?Process\s+States|States|'
    r'Advantages|Disadvantages|Differences|Comparison|'
    r'Key\s+Characteristics|Properties|Features|'
    r'Example|Examples|Algorithm|Steps|Procedure|'
    r'(?:Four\s+)?(?:Necessary\s+)?Conditions|Conditions|'
    r'Conclusion|Summary)'
    r'\s*[:\.\-–—]?\s*',
    re.IGNORECASE
)

def format_answer_subtopics(text: str) -> str:
    """
    Polishes extracted answer text so questions and subtopics are structured like a pro:
    - Bolds and separates distinct subtopics (e.g. **Definition:**, **Functions:**, **Process States:**).
    - Formats numbered sub-points (1) New, 2) Ready...) cleanly on their own lines.
    - Preserves academic flow without clumping text together.
    """
    if not text or text.strip() == "[Not Attempted / Blank]":
        return text

    cleaned = clean_handwriting_text(text).strip()
    raw_lines = cleaned.split('\n')
    formatted_lines: List[str] = []

    for idx, raw_line in enumerate(raw_lines):
        line = raw_line.strip()
        if not line:
            if formatted_lines and formatted_lines[-1] != "":
                formatted_lines.append("")
            continue

        # Check for subtopic heading
        m_sub = SUBTOPIC_HEADER_REGEX.match(line)
        if m_sub:
            sub_title = m_sub.group(1).title()
            rest_of_line = line[m_sub.end():].strip()
            
            # Format subtopic header
            if formatted_lines and formatted_lines[-1] != "":
                formatted_lines.append("")
            
            if rest_of_line:
                formatted_lines.append(f"**{sub_title}:**")
                formatted_lines.append(rest_of_line)
            else:
                formatted_lines.append(f"**{sub_title}:**")
            continue

        # Check for numbered sub-item: e.g. 1) New, 2. Ready, etc.
        m_item = re.match(r'^[\(\[]?\s*([0-9]{1,2})\s*[\)\]\.\:\-]\s*(.*)$', line)
        if m_item:
            num = m_item.group(1)
            body = m_item.group(2).strip()
            formatted_lines.append(f"{num}. {body}")
            continue

        # Check for bullet: e.g. - Point, * Point
        m_bullet = re.match(r'^[\-•*]\s*(.*)$', line)
        if m_bullet:
            formatted_lines.append(f"• {m_bullet.group(1).strip()}")
            continue

        formatted_lines.append(line)

    return '\n'.join(formatted_lines).strip()
