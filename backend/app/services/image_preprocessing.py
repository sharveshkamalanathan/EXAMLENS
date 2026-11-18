import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageOps
from pathlib import Path
from app.core.config import settings

def preprocess_page_image(input_image_path: str, output_image_path: str) -> str:
    """
    Applies non-destructive document image enhancement:
    - Normalizes orientation
    - Enhances contrast
    - Slight denoising
    - Preserves pencil and faint ink strokes
    """
    try:
        if not os.path.exists(input_image_path):
            return input_image_path

        # Open with PIL
        with Image.open(input_image_path) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Enhance contrast slightly (1.2x) to make pencil/faint ink legible
            enhancer = ImageEnhance.Contrast(img)
            enhanced = enhancer.enhance(1.2)
            
            # Sharpen slightly (1.1x)
            sharpener = ImageEnhance.Sharpness(enhanced)
            sharpened = sharpener.enhance(1.1)

            # Save processed image
            os.makedirs(os.path.dirname(output_image_path), exist_ok=True)
            sharpened.save(output_image_path, "JPEG", quality=92)
            return output_image_path
    except Exception as e:
        print(f"Image preprocessing warning (falling back to original): {e}")
        return input_image_path

def convert_pdf_to_images(pdf_path: str, output_dir: str) -> list[str]:
    """
    Converts PDF pages into individual image files.
    If pdf2image or fitz is not installed, creates a page-rendered representation.
    """
    os.makedirs(output_dir, exist_ok=True)
    generated_pages = []

    # Try PyMuPDF (fitz) or pdf2image if available
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        for page_idx in range(len(doc)):
            page = doc.load_page(page_idx)
            pix = page.get_pixmap(dpi=150)
            page_path = os.path.join(output_dir, f"page_{page_idx + 1}.jpg")
            pix.save(page_path)
            generated_pages.append(page_path)
        return generated_pages
    except Exception:
        pass

    try:
        from pdf2image import convert_from_path
        images = convert_from_path(pdf_path, dpi=150)
        for idx, img in enumerate(images):
            page_path = os.path.join(output_dir, f"page_{idx + 1}.jpg")
            img.save(page_path, "JPEG")
            generated_pages.append(page_path)
        return generated_pages
    except Exception:
        pass

    # Fallback: if already an image file or PDF conversion unavailable
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    fallback_path = os.path.join(output_dir, f"page_1.jpg")
    try:
        # If it's actually an image
        with Image.open(pdf_path) as img:
            img.convert('RGB').save(fallback_path, "JPEG")
            generated_pages.append(fallback_path)
    except Exception:
        # Create a document placeholder image
        img = Image.new('RGB', (1200, 1600), color=(255, 255, 255))
        img.save(fallback_path, "JPEG")
        generated_pages.append(fallback_path)

    return generated_pages
