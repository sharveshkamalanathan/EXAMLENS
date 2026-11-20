import os
import json
from datetime import datetime, timezone, timedelta
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.exam import Exam, ExamEnrollment
from app.models.question import Question, RubricCriterion
from app.models.script import UploadBatch, AnswerScript, ScriptPage, OCRResult, ExtractedAnswer, Submission
from app.models.evaluation import Evaluation, CriterionEvaluation, TeacherReview, ResultPublication
from app.models.audit import AuditLog
from app.models.contact import ContactMessage

def generate_handwritten_sheet_image(
    output_path: str,
    student_name: str,
    roll_no: str,
    exam_title: str,
    answers_text: list[tuple[str, list[str]]]
):
    """
    Renders a realistic scanned examination answer sheet with student handwriting,
    ruled lines, margin, stamp, and question headers.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 1200 x 1700 standard A4 document resolution
    width, height = 1200, 1700
    img = Image.new('RGB', (width, height), color=(253, 252, 248))  # slight off-white paper
    draw = ImageDraw.Draw(img)

    # Ruled paper lines
    line_spacing = 38
    margin_x = 140
    
    # Red left margin line
    draw.line([(margin_x, 180), (margin_x, height - 80)], fill=(235, 130, 130), width=2)
    # Header horizontal line
    draw.line([(60, 180), (width - 60, 180)], fill=(200, 200, 210), width=2)

    # Blue horizontal ruled lines
    for y in range(220, height - 80, line_spacing):
        draw.line([(60, y), (width - 60, y)], fill=(225, 235, 245), width=1)

    # Document Header info
    try:
        font_header = ImageFont.load_default()
    except Exception:
        font_header = None

    draw.text((80, 40), f"NATIONAL INSTITUTE OF TECHNOLOGY — EXAMINATION ANSWER SCRIPT", fill=(40, 50, 70))
    draw.text((80, 75), f"EXAM: {exam_title.upper()}", fill=(60, 70, 90))
    draw.text((80, 110), f"STUDENT: {student_name} ({roll_no})", fill=(60, 70, 90))
    draw.text((850, 110), f"DATE: 18-NOV-2026", fill=(60, 70, 90))

    # Teacher Scanned Watermark Stamp
    draw.rectangle([(width - 240, 40), (width - 60, 100)], outline=(30, 130, 60), width=2)
    draw.text((width - 225, 60), "DIGITIZED — EXAMLENS", fill=(30, 130, 60))

    # Draw answers with simulated blue pen ink
    cur_y = 210
    ink_color = (25, 45, 115)  # Ballpoint royal blue ink
    header_color = (15, 25, 75)

    for q_num, paragraphs in answers_text:
        # Question header in margin
        draw.text((70, cur_y - 2), q_num, fill=header_color)
        
        for p in paragraphs:
            # Word wrap simulation
            words = p.split(' ')
            line = ""
            for word in words:
                if len(line + " " + word) > 65:
                    draw.text((margin_x + 15, cur_y - 4), line, fill=ink_color)
                    cur_y += line_spacing
                    line = word
                else:
                    line = line + (" " if line else "") + word
            if line:
                draw.text((margin_x + 15, cur_y - 4), line, fill=ink_color)
                cur_y += line_spacing
        cur_y += 15  # space between questions

    img.save(output_path, "JPEG", quality=90)
    return output_path

def restore_cia_data(db: Session):
    """
    Guarantees restoration of CIA 1 and CIA 2 examinations, rubrics, and answer scripts
    from the bundled data package so they exist seamlessly across all environments.
    """
    data_paths = [
        os.path.join(os.path.dirname(__file__), "data", "cia_exams_account_backup.json"),
        os.path.abspath("backups/cia_exams_account_backup.json"),
        os.path.abspath("../backups/cia_exams_account_backup.json")
    ]
    data_path = next((p for p in data_paths if os.path.exists(p)), None)
    if not data_path:
        return

    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        acc = data.get("account", {})
        creator_email = acc.get("email", "sharveshofficalmicro@gmail.com")
        user = db.query(User).filter_by(email=creator_email).first()
        if not user:
            user = User(
                id=acc.get("id", "f56c16fa-ce59-401f-94e2-76e07be8c9d8"),
                full_name=acc.get("full_name") or "Sharveshwaran (Faculty)",
                email=creator_email,
                hashed_password=get_password_hash("94865"),
                role=UserRole.TEACHER,
                institution=acc.get("institution") or "Sri Krishna College of Engineering and Technology",
                department=acc.get("department") or "Computer Science & Engineering"
            )
            db.add(user)
            db.commit()
        else:
            user.hashed_password = get_password_hash("94865")
            db.commit()

        # Restore Exams
        for e_data in data.get("exams", []):
            exam = db.query(Exam).filter_by(id=e_data["id"]).first()
            if not exam:
                exam = Exam(
                    id=e_data["id"],
                    teacher_id=user.id,
                    title=e_data["title"],
                    subject=e_data["subject"],
                    department=e_data.get("department", "Computer Science"),
                    class_name=e_data.get("class_name", "B.Tech CS"),
                    section=e_data.get("section", "Section A"),
                    academic_year=e_data.get("academic_year", "2026-2027"),
                    exam_type=e_data.get("exam_type", "CIA"),
                    total_marks=e_data["total_marks"],
                    passing_marks=e_data.get("passing_marks", 20.0),
                    status=e_data.get("status", "published"),
                    is_published=True,
                    published_at=datetime.now(timezone.utc)
                )
                db.add(exam)
                db.commit()

            # Questions & Rubrics
            for q_data in e_data.get("questions", []):
                q = db.query(Question).filter_by(id=q_data["id"]).first()
                if not q:
                    q = Question(
                        id=q_data["id"],
                        exam_id=exam.id,
                        question_number=q_data["question_number"],
                        text=q_data["text"],
                        question_type=q_data.get("question_type", "theory"),
                        max_marks=q_data["max_marks"],
                        topic=q_data.get("topic"),
                        difficulty=q_data.get("difficulty", "medium"),
                        reference_answer=q_data.get("reference_answer"),
                        important_concepts_json=q_data.get("important_concepts_json", "[]"),
                        display_order=q_data.get("display_order", 1)
                    )
                    db.add(q)
                    db.commit()

                for r_data in q_data.get("rubrics", []):
                    r = db.query(RubricCriterion).filter_by(id=r_data["id"]).first()
                    if not r:
                        r = RubricCriterion(
                            id=r_data["id"],
                            question_id=q.id,
                            name=r_data["name"],
                            description=r_data.get("description"),
                            max_marks=r_data["max_marks"],
                            scoring_instructions=r_data.get("scoring_instructions"),
                            display_order=r_data.get("display_order", 1)
                        )
                        db.add(r)
                        db.commit()

            # Answer Scripts
            for s_data in e_data.get("scripts", []):
                s = db.query(AnswerScript).filter_by(id=s_data["id"]).first()
                if not s:
                    s = AnswerScript(
                        id=s_data["id"],
                        exam_id=exam.id,
                        student_id=s_data.get("student_id"),
                        student_roll_no=s_data.get("student_roll_no") or "STU-1030",
                        student_name=s_data.get("student_name") or "Student",
                        original_file_name=s_data.get("original_file_name") or "uploaded_script.pdf",
                        stored_file_path=s_data.get("stored_file_path") or "/storage/uploads/script.pdf",
                        file_type=s_data.get("file_type") or "application/pdf",
                        page_count=s_data.get("page_count", 1),
                        total_score=s_data.get("total_score"),
                        upload_status="processed",
                        processing_status="evaluated"
                    )
                    db.add(s)
                    db.commit()
    except Exception as exc:
        print(f"Warning: could not complete CIA exams restore: {exc}")

def seed_database(db: Session):
    # 1. Lead Administrator: sharveshofficialmicro@gmail.com
    admin_lead = db.query(User).filter(User.email == "sharveshofficialmicro@gmail.com").first()
    if admin_lead:
        admin_lead.hashed_password = get_password_hash("94865")
        admin_lead.role = UserRole.ADMIN
        admin_lead.full_name = "Sharveshwaran (Lead Administrator)"
        db.commit()
    else:
        admin_lead = User(
            full_name="Sharveshwaran (Lead Administrator)",
            email="sharveshofficialmicro@gmail.com",
            hashed_password=get_password_hash("94865"),
            role=UserRole.ADMIN,
            institution="National Institute of Technology",
            department="Central Examination Administration"
        )
        db.add(admin_lead)
        db.commit()

    # 2. Creator of CIA 1 & CIA 2: sharveshofficalmicro@gmail.com
    cia_creator = db.query(User).filter(User.email == "sharveshofficalmicro@gmail.com").first()
    if cia_creator:
        cia_creator.hashed_password = get_password_hash("94865")
        cia_creator.role = UserRole.TEACHER
        cia_creator.full_name = "Sharveshwaran (Faculty)"
        db.commit()
    else:
        cia_creator = User(
            id="f56c16fa-ce59-401f-94e2-76e07be8c9d8",
            full_name="Sharveshwaran (Faculty)",
            email="sharveshofficalmicro@gmail.com",
            hashed_password=get_password_hash("94865"),
            role=UserRole.TEACHER,
            institution="Sri Krishna College of Engineering and Technology",
            department="Computer Science & Engineering"
        )
        db.add(cia_creator)
        db.commit()

    # 3. Jake: jake@examlens.edu
    jake = db.query(User).filter(User.email == "jake@examlens.edu").first()
    if jake:
        jake.hashed_password = get_password_hash("94865")
        jake.role = UserRole.TEACHER
        db.commit()
    else:
        jake = User(
            full_name="Jake",
            email="jake@examlens.edu",
            hashed_password=get_password_hash("94865"),
            role=UserRole.TEACHER,
            institution="National Institute of Technology",
            department="Computer Science & Engineering"
        )
        db.add(jake)
        db.commit()

    # 4. SKCET: 25cs804@skcet.ac.in
    skcet = db.query(User).filter(User.email == "25cs804@skcet.ac.in").first()
    if skcet:
        skcet.hashed_password = get_password_hash("94865")
        skcet.role = UserRole.TEACHER
        db.commit()
    else:
        skcet = User(
            full_name="Sharvesh (SKCET Student/Faculty)",
            email="25cs804@skcet.ac.in",
            hashed_password=get_password_hash("94865"),
            role=UserRole.TEACHER,
            institution="Sri Krishna College of Engineering and Technology",
            department="Computer Science & Engineering"
        )
        db.add(skcet)
        db.commit()

    # 5. Restore CIA 1 & CIA 2 examinations & papers
    restore_cia_data(db)

    # Check if demo data already seeded
    existing_teacher = db.query(User).filter(User.email == "teacher@examlens.edu").first()
    if existing_teacher:
        return

    print("Seeding ExamLens demo database...")

    # 1. Create Users
    default_pw = get_password_hash("examlens123")
    teacher = User(
        full_name="Prof. Rajesh Sharma",
        email="teacher@examlens.edu",
        hashed_password=default_pw,
        role=UserRole.TEACHER,
        institution="National Institute of Technology",
        department="Computer Science & Engineering"
    )
    db.add(teacher)

    admin = User(
        full_name="Exam Admin NIT",
        email="admin@examlens.edu",
        hashed_password=default_pw,
        role=UserRole.ADMIN,
        institution="National Institute of Technology",
        department="Examination Cell"
    )
    db.add(admin)

    students_data = [
        ("STU-1024", "Aarav Sharma", "stu101@examlens.edu"),
        ("STU-1025", "Priya Nair", "stu102@examlens.edu"),
        ("STU-1026", "Rohan Mehta", "stu103@examlens.edu"),
        ("STU-1027", "Ananya Verma", "stu104@examlens.edu"),
    ]

    student_users = []
    for roll, name, email in students_data:
        stu = User(
            full_name=name,
            email=email,
            hashed_password=default_pw,
            role=UserRole.STUDENT,
            roll_number=roll,
            institution="National Institute of Technology",
            department="Computer Science & Engineering"
        )
        db.add(stu)
        student_users.append(stu)
    
    db.commit()
    db.refresh(teacher)

    # 2. Create Exams
    # Exam 1: Operating Systems Internal Assessment 2 (Published with evaluations)
    exam_os = Exam(
        teacher_id=teacher.id,
        title="Operating Systems — Internal Assessment 2",
        subject="CS302: Operating Systems",
        department="Computer Science & Engineering",
        class_name="B.Tech CS 3rd Year",
        section="Section A",
        academic_year="2026-2027",
        exam_type="Internal Assessment",
        exam_date="2026-11-10",
        duration_minutes=90,
        total_marks=15.0,
        passing_marks=6.0,
        instructions="Answer all questions. Show step-by-step reasoning. Highlight key terms.",
        status="published",
        is_published=True,
        published_at=datetime.now(timezone.utc) - timedelta(days=2)
    )
    db.add(exam_os)

    # Exam 2: Database Management Systems Midterm (Ready for evaluation queue demo)
    exam_dbms = Exam(
        teacher_id=teacher.id,
        title="Database Systems — Midterm Assessment",
        subject="CS304: Database Management Systems",
        department="Computer Science & Engineering",
        class_name="B.Tech CS 3rd Year",
        section="Section A",
        academic_year="2026-2027",
        exam_type="Midterm Examination",
        exam_date="2026-11-15",
        duration_minutes=120,
        total_marks=20.0,
        passing_marks=8.0,
        instructions="All questions carry equal marks. Reference ER diagrams and SQL statements clearly.",
        status="review_pending",
        is_published=False
    )
    db.add(exam_dbms)
    db.commit()
    db.refresh(exam_os)
    db.refresh(exam_dbms)

    # 3. Create Questions & Rubrics for Exam OS
    q1 = Question(
        exam_id=exam_os.id,
        question_number="Q1",
        text="Explain paging in an operating system. How does address translation work?",
        question_type="explain",
        max_marks=5.0,
        topic="Memory Management",
        difficulty="medium",
        reference_answer=(
            "Paging is a memory management scheme that eliminates the need for contiguous allocation of physical memory. "
            "The logical address space is divided into fixed-size blocks called pages, and physical memory is divided into fixed-size blocks called frames. "
            "The page table maps logical pages to physical frames. Address translation splits logical address into page number (p) and page offset (d). "
            "The CPU uses 'p' as an index into the page table to get the frame number (f), combining with offset (d) to produce physical address (f, d). "
            "Paging prevents external fragmentation."
        ),
        important_concepts_json=json.dumps(["Non-contiguous allocation", "Pages and frames", "Page table mapping", "Logical to physical translation", "No external fragmentation"]),
        alternative_explanations_json=json.dumps(["Virtual pages mapping to physical frame numbers using MMU"]),
        optional_keywords_json=json.dumps(["MMU", "page table base register", "PTBR", "offset"]),
        display_order=1
    )
    db.add(q1)
    db.commit()
    db.refresh(q1)

    r1_criteria = [
        ("Definition & Need", "Clear definition of non-contiguous allocation", ["non-contiguous physical memory", "logical vs physical"], 1.0, 1),
        ("Pages and Frames", "Explanation of fixed-size pages and frames", ["pages", "frames", "fixed size"], 1.0, 2),
        ("Page Table Structure", "Role of page table in translation", ["page table", "mapping"], 1.0, 3),
        ("Address Translation Mechanism", "Logical address (p, d) to physical address (f, d)", ["page number p", "offset d", "frame number f"], 1.0, 4),
        ("Advantages & Fragmentation", "Impact on internal vs external fragmentation", ["eliminates external fragmentation", "internal fragmentation remains"], 1.0, 5),
    ]
    for name, desc, concepts, marks, order in r1_criteria:
        db.add(RubricCriterion(
            question_id=q1.id,
            name=name,
            description=desc,
            expected_concepts_json=json.dumps(concepts),
            max_marks=marks,
            display_order=order
        ))

    # Q2: Semaphore vs Mutex
    q2 = Question(
        exam_id=exam_os.id,
        question_number="Q2",
        text="Compare and contrast a Semaphore and a Mutex with practical use cases.",
        question_type="compare",
        max_marks=5.0,
        topic="Process Synchronization",
        difficulty="medium",
        reference_answer=(
            "A Mutex is a locking mechanism designed for mutual exclusion; only the thread that acquired the lock can release it (strict ownership). "
            "A Semaphore is a signaling mechanism (wait/signal or P/V) that can be binary or counting. Any thread can signal a semaphore (no ownership). "
            "Mutex is typically used to protect a single critical section resource, whereas semaphores are used for signaling events such as Producer-Consumer buffer synchronization."
        ),
        important_concepts_json=json.dumps(["Locking vs signaling", "Ownership concept", "Binary vs counting", "Critical section vs coordination"]),
        display_order=2
    )
    db.add(q2)
    db.commit()
    db.refresh(q2)

    r2_criteria = [
        ("Core Mechanism Distinction", "Locking mechanism vs signaling mechanism", ["locking vs signaling", "wait and signal"], 1.0, 1),
        ("Ownership Property", "Mutex has ownership; Semaphore does not", ["thread ownership", "can be signaled by any thread"], 1.5, 2),
        ("Types & Capacity", "Binary mutex vs Counting/binary semaphore", ["integer counter", "binary lock"], 1.0, 3),
        ("Practical Use Cases", "Resource lock vs Producer-Consumer synchronization", ["critical section protection", "producer-consumer coordination"], 1.5, 4),
    ]
    for name, desc, concepts, marks, order in r2_criteria:
        db.add(RubricCriterion(
            question_id=q2.id,
            name=name,
            description=desc,
            expected_concepts_json=json.dumps(concepts),
            max_marks=marks,
            display_order=order
        ))

    # Q3: Deadlock Coffman Conditions
    q3 = Question(
        exam_id=exam_os.id,
        question_number="Q3",
        text="Explain the four Coffman conditions necessary for a system deadlock to occur.",
        question_type="descriptive",
        max_marks=5.0,
        topic="Deadlocks",
        difficulty="easy",
        reference_answer=(
            "Deadlock can occur if and only if all four conditions hold simultaneously: "
            "1. Mutual Exclusion: At least one resource must be held in non-shareable mode. "
            "2. Hold and Wait: A process holds at least one resource and is waiting to acquire additional resources held by others. "
            "3. No Preemption: Resources cannot be forcibly preempted; they are released only voluntarily. "
            "4. Circular Wait: A closed chain of processes exists where each process holds resources needed by the next."
        ),
        important_concepts_json=json.dumps(["Mutual Exclusion", "Hold and Wait", "No Preemption", "Circular Wait"]),
        display_order=3
    )
    db.add(q3)
    db.commit()
    db.refresh(q3)

    r3_criteria = [
        ("Mutual Exclusion", "Non-shareable resource allocation", ["non-shareable mode", "exclusive access"], 1.25, 1),
        ("Hold and Wait", "Holding one resource while requesting another", ["holding resources", "waiting for others"], 1.25, 2),
        ("No Preemption", "Resources cannot be forcibly revoked", ["no forcible release", "voluntary release"], 1.25, 3),
        ("Circular Wait", "Closed cycle of dependency among processes", ["circular chain", "cyclic waiting"], 1.25, 4),
    ]
    for name, desc, concepts, marks, order in r3_criteria:
        db.add(RubricCriterion(
            question_id=q3.id,
            name=name,
            description=desc,
            expected_concepts_json=json.dumps(concepts),
            max_marks=marks,
            display_order=order
        ))

    # Questions for Exam DBMS
    q_dbms_1 = Question(
        exam_id=exam_dbms.id,
        question_number="Q1",
        text="Explain the ACID properties of a database transaction with practical banking examples.",
        question_type="explain",
        max_marks=10.0,
        topic="Transaction Processing",
        difficulty="medium",
        reference_answer="Atomicity, Consistency, Isolation, Durability with rollback, transfer invariants, isolation levels, and write-ahead logging.",
        important_concepts_json=json.dumps(["Atomicity", "Consistency", "Isolation", "Durability"]),
        display_order=1
    )
    db.add(q_dbms_1)
    db.commit()
    db.refresh(q_dbms_1)

    for name, desc, concepts, marks, order in [
        ("Atomicity (All or Nothing)", "Complete execution or rollback", ["all or nothing", "rollback"], 2.5, 1),
        ("Consistency Preservation", "Maintaining integrity constraints", ["valid database state", "invariants"], 2.5, 2),
        ("Isolation Levels", "Concurrent execution without interference", ["serializability", "concurrency control"], 2.5, 3),
        ("Durability (Permanence)", "Committed updates survive crashes", ["WAL log", "non-volatile persistence"], 2.5, 4),
    ]:
        db.add(RubricCriterion(
            question_id=q_dbms_1.id,
            name=name,
            description=desc,
            expected_concepts_json=json.dumps(concepts),
            max_marks=marks,
            display_order=order
        ))

    # 4. Enrollments
    for stu in student_users:
        db.add(ExamEnrollment(exam_id=exam_os.id, student_id=stu.id, student_roll_no=stu.roll_number or ""))
        db.add(ExamEnrollment(exam_id=exam_dbms.id, student_id=stu.id, student_roll_no=stu.roll_number or ""))
    db.commit()

    # 5. Create Realistic Scanned Answer Scripts and Evaluations for Exam OS
    student_answers_payloads = [
        # Student 1: Aarav Sharma (Top Performer: 14 / 15)
        (
            student_users[0],
            "STU-1024",
            "Aarav Sharma",
            [
                ("Q1.", [
                    "Paging is a memory management scheme that allows the physical address space of a process to be non-contiguous.",
                    "Logical memory is divided into fixed-size blocks called pages, and physical memory is divided into blocks called frames.",
                    "The page table maps each logical page to a physical frame. In address translation, the CPU divides logical address into page number (p) and offset (d).",
                    "Page number p is used as an index into the page table to find frame number f. The physical address is formed by combining f and d.",
                    "This completely prevents external fragmentation, although small internal fragmentation can exist on the last page."
                ]),
                ("Q2.", [
                    "1. Mutex is a locking mechanism while Semaphore is a signaling mechanism.",
                    "2. Ownership: Only the thread that locked the mutex can unlock it. In a semaphore, any thread can call signal/post.",
                    "3. Capacity: Mutex is binary (0 or 1). Semaphore can be counting (integer N >= 0) to manage a pool of resources.",
                    "4. Use Case: Mutex is used to guard critical sections. Semaphores are used for coordinating tasks like Producer-Consumer buffers."
                ]),
                ("Q3.", [
                    "The four Coffman conditions for deadlock are:",
                    "1. Mutual Exclusion: At least one resource must be held in non-shareable mode.",
                    "2. Hold and Wait: A process holds one resource and waits for another resource held by someone else.",
                    "3. No Preemption: Resources cannot be forcibly taken away; they must be released voluntarily by the holding process.",
                    "4. Circular Wait: A set of processes {P0, P1, ... Pn} such that P0 waits for resource held by P1, and Pn waits for P0."
                ])
            ],
            14.0,  # Score
            True   # Approved
        ),
        # Student 2: Priya Nair (Good Performer: 12 / 15)
        (
            student_users[1],
            "STU-1025",
            "Priya Nair",
            [
                ("Q1.", [
                    "Paging is used in operating systems for non-contiguous memory management.",
                    "It divides logical address into pages and main memory into frames.",
                    "The page table contains the frame address for every page. Hardware translation splits address into page number and offset.",
                    "The offset stays identical in both logical and physical addresses. Paging prevents external fragmentation."
                ]),
                ("Q2.", [
                    "Mutex means mutual exclusion lock. Semaphore is used for synchronization between concurrent threads.",
                    "Mutex has ownership because the acquiring thread must release it. Semaphore does not have ownership.",
                    "Counting semaphores maintain a positive counter. For example, database connection pools use counting semaphores."
                ]),
                ("Q3.", [
                    "Deadlock conditions:",
                    "1. Mutual exclusion: resource cannot be shared.",
                    "2. Hold & Wait: process holds a lock while waiting for another.",
                    "3. No preemption: resources cannot be preempted forcibly.",
                    "4. Circular wait: cyclic dependency among waiting processes."
                ])
            ],
            12.0,
            True
        ),
        # Student 3: Rohan Mehta (Average Performer with Teacher Override: 9.5 -> 10.5)
        (
            student_users[2],
            "STU-1026",
            "Rohan Mehta",
            [
                ("Q1.", [
                    "Paging breaks logical memory into pages and physical memory into frames.",
                    "A page table translates page number into frame number.",
                    "The offset is combined with frame number to access the actual word in memory.",
                    "It avoids external fragmentation."
                ]),
                ("Q2.", [
                    "Mutex is a binary lock for mutual exclusion. Semaphore has a counter.",
                    "A thread locks a mutex before entering critical section.",
                    "Semaphores signal using wait() and signal() calls."
                ]),
                ("Q3.", [
                    "Deadlock happens when:",
                    "1. Mutual exclusion: one process at a time.",
                    "2. Hold and wait: holding while waiting.",
                    "3. No preemption: resource cannot be taken back.",
                    "4. Circular wait: ring of processes waiting for each other."
                ])
            ],
            10.5,
            True
        ),
        # Student 4: Ananya Verma (Requires Teacher Review - Borderline: 7.5 / 15)
        (
            student_users[3],
            "STU-1027",
            "Ananya Verma",
            [
                ("Q1.", [
                    "Paging maps virtual memory pages into physical RAM frames.",
                    "The MMU uses page table to look up addresses.",
                    "It helps reduce memory waste."
                ]),
                ("Q2.", [
                    "Mutex is used to avoid race conditions. Semaphore is used when multiple resources exist.",
                    "Mutex is binary lock. Semaphore can be counting."
                ]),
                ("Q3.", [
                    "Deadlock conditions are mutual exclusion, hold and wait, no preemption and circular wait."
                ])
            ],
            7.5,
            False
        ),
    ]

    batch = UploadBatch(
        exam_id=exam_os.id,
        teacher_id=teacher.id,
        batch_name="Batch A — Physical Scripts Digitize Nov 10",
        total_files=len(student_answers_payloads),
        status="completed"
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # Questions map
    os_questions = [q1, q2, q3]

    for stu_user, roll_no, stu_name, answers_data, target_score, is_approved in student_answers_payloads:
        # Generate simulated scanned image
        img_filename = f"scan_{roll_no}.jpg"
        img_rel_path = f"/storage/processed/{img_filename}"
        img_disk_path = os.path.join(settings.PROCESSED_DIR, img_filename)
        
        generate_handwritten_sheet_image(
            output_path=img_disk_path,
            student_name=stu_name,
            roll_no=roll_no,
            exam_title=exam_os.title,
            answers_text=answers_data
        )

        script = AnswerScript(
            exam_id=exam_os.id,
            student_id=stu_user.id,
            batch_id=batch.id,
            student_roll_no=roll_no,
            student_name=stu_name,
            original_file_name=f"{roll_no}_OS_Answers.pdf",
            stored_file_path=img_rel_path,
            file_type="application/pdf",
            page_count=1,
            upload_status="uploaded",
            processing_status="published" if is_approved else "review_required",
            total_score=target_score,
            is_approved=is_approved,
            uploaded_at=datetime.now(timezone.utc) - timedelta(days=3)
        )
        db.add(script)
        db.commit()
        db.refresh(script)

        page = ScriptPage(
            answer_script_id=script.id,
            page_number=1,
            original_image_path=img_rel_path,
            processed_image_path=img_rel_path,
            preprocessing_status="enhanced"
        )
        db.add(page)
        db.commit()
        db.refresh(page)

        # Full combined text for OCR
        full_ocr_lines = []
        for q_lbl, paras in answers_data:
            full_ocr_lines.append(f"{q_lbl} Answer:")
            full_ocr_lines.extend(paras)
            full_ocr_lines.append("")
        full_ocr_str = "\n".join(full_ocr_lines)

        ocr_rec = OCRResult(
            script_page_id=page.id,
            provider="mock_demo",
            extracted_text=full_ocr_str,
            structured_output_json=json.dumps({"lines": len(full_ocr_lines), "confidence": 0.94}),
            confidence=0.94,
            status="completed"
        )
        db.add(ocr_rec)

        # Extracted answers & Submissions for each of the 3 questions
        for idx, (q_lbl, paras) in enumerate(answers_data):
            matched_q = os_questions[idx]
            ans_text = "\n".join(paras)

            ext_ans = ExtractedAnswer(
                answer_script_id=script.id,
                question_id=matched_q.id,
                original_ocr_text=ans_text,
                corrected_text=ans_text,
                segmentation_confidence=0.96,
                verification_status="verified",
                verified_by=teacher.id,
                verified_at=datetime.now(timezone.utc) - timedelta(days=2)
            )
            db.add(ext_ans)

            sub = Submission(
                answer_script_id=script.id,
                question_id=matched_q.id,
                student_answer=ans_text,
                verification_status="verified"
            )
            db.add(sub)
            db.commit()
            db.refresh(sub)

            # Evaluation & Criteria breakdown
            q_score = round(target_score / 3.0, 1)
            if idx == 0 and roll_no == "STU-1024":
                q_score = 5.0
            elif idx == 1 and roll_no == "STU-1024":
                q_score = 4.5
            elif idx == 2 and roll_no == "STU-1024":
                q_score = 4.5

            eval_rec = Evaluation(
                submission_id=sub.id,
                original_ai_marks=q_score if roll_no != "STU-1026" else round(q_score - 1.0, 1),
                maximum_marks=matched_q.max_marks,
                ai_feedback=f"Comprehensive response with clear conceptual understanding of {matched_q.topic}.",
                confidence=0.92,
                requires_human_review=(not is_approved and idx == 1),
                review_reason="Borderline partial mark evaluation; teacher confirmation recommended." if (not is_approved and idx == 1) else None,
                provider="mock_demo",
                status="completed",
                evaluated_at=datetime.now(timezone.utc) - timedelta(days=2),
                execution_time_ms=180
            )
            db.add(eval_rec)
            db.commit()
            db.refresh(eval_rec)

            # Add criterion evaluations
            for crit in matched_q.rubric_criteria:
                awarded = round(crit.max_marks * (q_score / matched_q.max_marks), 2)
                db.add(CriterionEvaluation(
                    evaluation_id=eval_rec.id,
                    criterion_id=crit.id,
                    maximum_marks=crit.max_marks,
                    awarded_marks=min(crit.max_marks, awarded),
                    explanation=f"Demonstrates clear grasp of {crit.name}.",
                    evidence=paras[0] if paras else "See extracted answer",
                    missing_concepts_json=json.dumps([] if awarded >= crit.max_marks else ["Edge cases"]),
                    incorrect_concepts_json=json.dumps([]),
                    confidence=0.93
                ))

            # Sample Teacher Override for STU-1026 (Rohan Mehta) to show audit history
            if roll_no == "STU-1026" and idx == 0:
                review_rec = TeacherReview(
                    evaluation_id=eval_rec.id,
                    teacher_id=teacher.id,
                    original_ai_marks=eval_rec.original_ai_marks,
                    final_marks=q_score,
                    override_reason="Student included the key offset formula which AI underweighted.",
                    teacher_comments="Good derivation of logical address offset; awarded full marks for criterion 4.",
                    status="overridden",
                    reviewed_at=datetime.now(timezone.utc) - timedelta(days=1)
                )
                db.add(review_rec)
                
                # Audit log entry
                db.add(AuditLog(
                    user_id=teacher.id,
                    entity_type="evaluation",
                    entity_id=eval_rec.id,
                    action="score_override",
                    previous_data_json=json.dumps({"marks": eval_rec.original_ai_marks}),
                    new_data_json=json.dumps({"marks": q_score, "reason": "Student included key offset formula"})
                ))

    # Result Publication record for Exam OS
    pub = ResultPublication(
        exam_id=exam_os.id,
        teacher_id=teacher.id,
        published_at=datetime.now(timezone.utc) - timedelta(days=2),
        status="published",
        summary_stats_json=json.dumps({
            "total_students": 4,
            "evaluated_students": 4,
            "average_score": 11.0,
            "pass_percentage": 100.0
        })
    )
    db.add(pub)

    # Seed sample contact inquiries for admin dashboard inbox
    sample_msgs = [
        ContactMessage(
            name="Dr. Arvind Swaminathan",
            email="arvind.swami@iitm.ac.in",
            subject="Institution-wide Deployment & OCR Benchmark Inquiries",
            message="Hello Sharveshwaran, our department is interested in adopting ExamLens for semester examinations across 1,200 students. Could we schedule a technical walkthrough of your handwriting segmentation and rubric engine?",
            status="unread",
            created_at=datetime.now(timezone.utc) - timedelta(hours=3)
        ),
        ContactMessage(
            name="Prof. Kavitha Raman",
            email="kavitha.r@annauniv.edu",
            subject="Word document (.docx) submission compatibility",
            message="Hi ExamLens team, great job on the interactive script preview. We often receive supplementary assignments in DOCX format alongside scanned papers. Excited to test the new DOCX upload feature!",
            status="unread",
            created_at=datetime.now(timezone.utc) - timedelta(hours=8)
        ),
        ContactMessage(
            name="Siddharth Rao",
            email="siddharth.rao@student.nit.edu",
            subject="Query regarding partial marking for diagrammatic questions",
            message="Dear Team, I noticed my evaluation cited specific rubric lines for Question 3. The feedback was very fair and helped me understand where I lost half a mark. Thank you!",
            status="read",
            created_at=datetime.now(timezone.utc) - timedelta(days=1)
        )
    ]
    for msg in sample_msgs:
        db.add(msg)

    db.commit()

    print("Demo database successfully seeded!")
