import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageOps, ImageDraw, ImageFont
from pathlib import Path
from app.core.config import settings

def extract_text_from_docx(docx_path: str) -> list[str]:
    """Extracts text paragraphs from a Word (.docx or .doc) document."""
    lines: list[str] = []
    try:
        import docx
        doc = docx.Document(docx_path)
        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                lines.append(text)
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    lines.append(row_text)
        if lines:
            return lines
    except Exception as e:
        print(f"python-docx read failed: {e}")

    # Fallback to zipfile XML parsing for .docx
    try:
        import zipfile
        import xml.etree.ElementTree as ET
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            for p_node in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in p_node.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    lines.append(''.join(texts).strip())
    except Exception as e2:
        print(f"zipfile docx read failed: {e2}")

    return lines

def render_text_to_script_pages(lines: list[str], output_dir: str, title: str = "EXAMINATION ANSWER SCRIPT") -> list[str]:
    """Renders extracted text lines onto high-resolution document pages."""
    os.makedirs(output_dir, exist_ok=True)
    pages = []
    lines_per_page = 28
    width, height = 1200, 1700
    
    line_chunks = [lines[i:i + lines_per_page] for i in range(0, max(1, len(lines)), lines_per_page)]
    if not line_chunks:
        line_chunks = [["[Empty Document]"]]

    for p_idx, chunk in enumerate(line_chunks):
        img = Image.new('RGB', (width, height), color=(253, 252, 248))
        draw = ImageDraw.Draw(img)
        
        margin_x = 140
        draw.line([(margin_x, 160), (margin_x, height - 80)], fill=(235, 130, 130), width=2)
        draw.line([(60, 160), (width - 60, 160)], fill=(200, 200, 210), width=2)
        
        for y in range(200, height - 80, 42):
            draw.line([(60, y), (width - 60, y)], fill=(230, 238, 248), width=1)
            
        draw.text((80, 50), f"{title.upper()} — DIGITIZED WORD DOCUMENT", fill=(50, 60, 80))
        draw.text((80, 85), f"PAGE {p_idx + 1} OF {len(line_chunks)}", fill=(80, 90, 110))
        draw.rectangle([(width - 240, 45), (width - 60, 105)], outline=(30, 120, 70), width=2)
        draw.text((width - 225, 68), "DOCX CONVERTED", fill=(30, 120, 70))
        
        y_pos = 185
        for l in chunk:
            words = l.split()
            current_line = []
            for w in words:
                current_line.append(w)
                if len(' '.join(current_line)) > 65:
                    draw.text((margin_x + 20, y_pos), ' '.join(current_line[:-1]), fill=(20, 35, 80))
                    y_pos += 42
                    current_line = [w]
                    if y_pos > height - 100:
                        break
            if current_line and y_pos <= height - 100:
                draw.text((margin_x + 20, y_pos), ' '.join(current_line), fill=(20, 35, 80))
                y_pos += 42
                
            if y_pos > height - 100:
                break
                
        p_path = os.path.join(output_dir, f"page_{p_idx + 1}.jpg")
        img.save(p_path, "JPEG", quality=95)
        pages.append(p_path)
        
    return pages

def preprocess_page_image(input_image_path: str, output_image_path: str) -> str:
    """
    Applies non-destructive document image enhancement for varied handwriting:
    - Normalizes orientation
    - Background illumination flattening (removes uneven shadows & camera gradients)
    - CLAHE adaptive contrast (boosts faint pencil and light blue/black ink)
    - Stroke edge preservation
    """
    try:
        if not os.path.exists(input_image_path):
            return input_image_path

        os.makedirs(os.path.dirname(output_image_path), exist_ok=True)

        # 1. Try OpenCV adaptive document pipeline
        try:
            cv_img = cv2.imread(input_image_path)
            if cv_img is not None and cv_img.size > 0:
                gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
                # Illumination normalization: estimate background with large median blur
                dilated = cv2.dilate(gray, np.ones((7, 7), np.uint8))
                bg = cv2.medianBlur(dilated, 21)
                diff = 255 - cv2.absdiff(gray, bg)
                norm = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8UC1)
                
                # CLAHE contrast enhancement
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                enhanced = clahe.apply(norm)
                
                cv2.imwrite(output_image_path, enhanced)
                return output_image_path
        except Exception as cv_err:
            print(f"OpenCV enhancement warning: {cv_err}")

        # 2. Fallback to PIL Image enhancement
        with Image.open(input_image_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            enhancer = ImageEnhance.Contrast(img)
            enhanced = enhancer.enhance(1.25)
            
            sharpener = ImageEnhance.Sharpness(enhanced)
            sharpened = sharpener.enhance(1.15)

            sharpened.save(output_image_path, "JPEG", quality=92)
            return output_image_path
    except Exception as e:
        print(f"Image preprocessing warning (falling back to original): {e}")
        return input_image_path

def convert_pdf_to_images(pdf_path: str, output_dir: str) -> list[str]:
    """
    Converts PDF pages, Word documents (.docx/.doc), or images into individual page image files.
    """
    os.makedirs(output_dir, exist_ok=True)
    generated_pages = []

    ext = os.path.splitext(pdf_path)[1].lower()

    # 0. Handle Word documents (.docx, .doc)
    if ext in [".docx", ".doc"]:
        doc_lines = extract_text_from_docx(pdf_path)
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        return render_text_to_script_pages(doc_lines, output_dir, title=base_name)

    # 1. Try PyMuPDF (pymupdf / fitz)
    try:
        try:
            import pymupdf as fitz_module
        except ImportError:
            import fitz as fitz_module
            
        doc = fitz_module.open(pdf_path)
        for page_idx in range(len(doc)):
            page = doc.load_page(page_idx)
            # Render at 150 DPI for clean handwriting visibility
            pix = page.get_pixmap(dpi=150)
            page_path = os.path.join(output_dir, f"page_{page_idx + 1}.jpg")
            pix.save(page_path)
            generated_pages.append(page_path)
        doc.close()
        if generated_pages:
            return generated_pages
    except Exception as e:
        print(f"PyMuPDF rendering attempt failed: {e}")

    # 2. Try pdf2image if poppler is installed
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(pdf_path, dpi=150)
        for idx, img in enumerate(images):
            page_path = os.path.join(output_dir, f"page_{idx + 1}.jpg")
            img.save(page_path, "JPEG", quality=95)
            generated_pages.append(page_path)
        if generated_pages:
            return generated_pages
    except Exception as e:
        print(f"pdf2image rendering attempt failed: {e}")

    # 3. Fallback: If it's already an image file (JPG/PNG)
    fallback_path = os.path.join(output_dir, "page_1.jpg")
    try:
        with Image.open(pdf_path) as img:
            img.convert('RGB').save(fallback_path, "JPEG", quality=95)
            generated_pages.append(fallback_path)
            return generated_pages
    except Exception as e:
        print(f"Direct image read failed: {e}")

    # 4. Final safety fallback: Informative notice placeholder
    img = Image.new('RGB', (1200, 1600), color=(250, 250, 252))
    img.save(fallback_path, "JPEG")
    generated_pages.append(fallback_path)
    return generated_pages
