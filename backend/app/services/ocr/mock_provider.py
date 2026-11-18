import time
import os
from typing import List, Dict, Any
from app.services.ocr.base import BaseOCRProvider, OCRResultData, OCRLine, OCRWord

class MockOCRProvider(BaseOCRProvider):
    @property
    def provider_name(self) -> str:
        return "mock_demo"

    def is_configured(self) -> bool:
        return True

    def extract_text(self, image_path: str, page_number: int = 1) -> OCRResultData:
        start_time = time.time()
        
        # Sample realistic handwritten script recognition output
        # Depending on page number or image name, provide realistic student answers
        # with bounding boxes and realistic varying confidence levels
        lines_data = [
            ("Q1. Paging in Operating Systems", 0.98, [50, 100, 500, 35]),
            ("Paging is a memory management scheme that eliminates the need", 0.94, [50, 150, 800, 30]),
            ("for contiguous allocation of physical memory. In paging, the logical", 0.92, [50, 190, 810, 30]),
            ("address space is divided into fixed-size blocks called pages, and physical", 0.95, [50, 230, 820, 30]),
            ("memory is divided into fixed-size blocks called frames.", 0.96, [50, 270, 700, 30]),
            ("The page table is used to map logical pages to physical frames.", 0.91, [50, 310, 760, 30]),
            ("Hardware address translation splits logical address into page number (p)", 0.88, [50, 350, 830, 30]),
            ("and page offset (d). The main advantage is preventing external fragmentation.", 0.76, [50, 390, 850, 30]),
            ("", 1.0, [50, 430, 10, 10]),
            ("Q2. Difference between Semaphore and Mutex", 0.97, [50, 480, 580, 35]),
            ("1. A Mutex is a locking mechanism used to synchronize access to a resource.", 0.93, [50, 530, 840, 30]),
            ("Only one thread can hold the lock at a time (binary ownership).", 0.90, [50, 570, 780, 30]),
            ("2. A Semaphore is a signaling mechanism. It can be counting or binary.", 0.89, [50, 610, 810, 30]),
            ("Any thread can signal (V) or wait (P) on a semaphore.", 0.68, [50, 650, 650, 30]),  # Lower confidence word to demo verification!
            ("Mutex supports ownership while semaphore does not support ownership concept.", 0.85, [50, 690, 860, 30]),
            ("", 1.0, [50, 730, 10, 10]),
            ("Q3. Four Necessary Conditions for Deadlock", 0.96, [50, 780, 600, 35]),
            ("The 4 Coffman conditions for deadlock to occur are:", 0.93, [50, 830, 640, 30]),
            ("1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.", 0.91, [50, 870, 880, 30]),
            ("2. Hold and Wait: A process must be holding at least one resource and waiting", 0.89, [50, 910, 860, 30]),
            ("for another resource that is currently held by other processes.", 0.90, [50, 950, 750, 30]),
            ("3. No Preemption: Resources cannot be preempted forcibly from a process.", 0.88, [50, 990, 800, 30]),
            ("4. Circular Wait: A closed chain of processes exists such that each process holds", 0.87, [50, 1030, 870, 30]),
            ("one or more resources that are needed by the next process in the chain.", 0.86, [50, 1070, 840, 30]),
        ]

        ocr_lines: List[OCRLine] = []
        full_text_list = []
        confidences = []

        for line_idx, (text_line, line_conf, box) in enumerate(lines_data):
            words: List[OCRWord] = []
            if text_line.strip():
                full_text_list.append(text_line)
                word_tokens = text_line.split(" ")
                num_words = len(word_tokens)
                w_width = box[2] / max(num_words, 1)
                for w_idx, word_str in enumerate(word_tokens):
                    # Slightly vary word confidence around line confidence
                    word_conf = min(0.99, max(0.55, line_conf + ((w_idx % 3) - 1) * 0.04))
                    confidences.append(word_conf)
                    w_box = [box[0] + w_idx * w_width, box[1], w_width - 5, box[3]]
                    words.append(OCRWord(
                        text=word_str,
                        confidence=round(word_conf, 2),
                        bounding_box=w_box
                    ))
            
            ocr_lines.append(OCRLine(
                text=text_line,
                confidence=round(line_conf, 2),
                bounding_box=box,
                words=words
            ))

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.92
        elapsed_ms = int((time.time() - start_time) * 1000) + 120

        return OCRResultData(
            provider="mock_demo",
            extracted_text="\n".join(full_text_list),
            confidence=round(avg_conf, 2),
            processing_time_ms=elapsed_ms,
            lines=ocr_lines,
            structured_output={
                "page": page_number,
                "line_count": len([l for l in lines_data if l[0].strip()]),
                "word_count": len(confidences),
                "has_uncertain_text": any(c < 0.75 for c in confidences)
            },
            is_demo=True,
            warning="Demo Mode: Simulated OCR output for testing handwriting extraction workflows."
        )
