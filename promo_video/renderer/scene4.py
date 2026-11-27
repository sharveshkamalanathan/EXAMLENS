import math
import os
from PIL import Image, ImageDraw, ImageFilter
from .common import (
    COLOR_NAVY_DARK, COLOR_NAVY, COLOR_INDIGO, COLOR_INDIGO_LIGHT,
    COLOR_CYAN, COLOR_EMERALD, COLOR_LAVENDER, COLOR_WHITE,
    get_font, ease_out_cubic, ease_in_out_cubic, create_radial_gradient
)
from .presenter_animator import get_talking_presenter_image

_paper_scan_cache = None

def get_answer_sheet():
    global _paper_scan_cache
    if _paper_scan_cache is None:
        p = "promo_video/assets/exam_papers/scan_STU-1024.jpg"
        im = Image.open(p).convert("RGBA")
        card = im.resize((560, 860), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (576, 876), (230, 235, 245, 255))
        frame.paste(card, (8, 8))
        _paper_scan_cache = frame
    return _paper_scan_cache

def render_scene4(frame_idx, total_frames=360):
    t_sec = frame_idx / 30.0
    progress = frame_idx / float(total_frames)
    
    # High-Tech Studio Cyber Gradient Background
    bg = create_radial_gradient(
        width=1920, height=1080,
        center=(1200, 540), radius=1200,
        color_center=(20, 32, 65), color_edge=(8, 12, 22)
    ).convert("RGBA")
    
    draw = ImageDraw.Draw(bg)
    
    # Header Banner: "UNIVERSAL HANDWRITING OCR & SEMANTIC AI EVALUATION"
    top_w, top_h = 920, 50
    top_x = (1920 - top_w) // 2
    top_y = 35
    draw.rounded_rectangle([top_x, top_y, top_x + top_w, top_y + top_h], radius=14, fill=(16, 22, 40, 210), outline=(6, 182, 212, 180), width=2)
    draw.text((top_x + 65, top_y + 12), "UNIVERSAL HANDWRITING OCR  •  SEMANTIC AI EVALUATION", fill=(238, 242, 255, 255), font=get_font(20, bold=True))
    
    # 1. LEFT SIDE: Physical Answer Script with Laser Scanning Animation
    paper = get_answer_sheet().copy()
    pdraw = ImageDraw.Draw(paper)
    
    # Laser Scan line moves down repeatedly or smoothly across the duration
    # Scan sweeps down from y=80 to y=860 every 90 frames (~3 sec cycle)
    cycle_frame = frame_idx % 120
    scan_y = int(80 + 760 * ease_in_out_cubic(cycle_frame / 120.0))
    
    # Glowing Electric-Blue Laser Bar on paper
    # Soft cyan glow around laser line
    for offset in range(-12, 13, 2):
        alpha_l = int(140 * (1.0 - abs(offset) / 12.0))
        pdraw.line([(10, scan_y + offset), (766, scan_y + offset)], fill=(6, 182, 212, alpha_l), width=2)
    # Intense central white-hot laser beam
    pdraw.line([(10, scan_y), (766, scan_y)], fill=(255, 255, 255, 255), width=3)
    
    # Bounding boxes snapping to handwritten answers
    # Box 1: Question Header (y: 120-220)
    if scan_y > 160 or frame_idx > 40:
        pdraw.rounded_rectangle([30, 110, 740, 195], radius=6, outline=(6, 182, 212, 230), width=2)
        pdraw.rounded_rectangle([30, 85, 290, 110], radius=4, fill=(6, 182, 212, 230))
        pdraw.text((38, 88), "Q3(b) DETECTED • CONF: 99.4%", fill=(11, 15, 23, 255), font=get_font(13, bold=True))
        
    # Box 2: Thermodynamic Derivation (y: 280-450)
    if scan_y > 340 or frame_idx > 80:
        pdraw.rounded_rectangle([30, 270, 740, 430], radius=6, outline=(16, 185, 129, 230), width=2)
        pdraw.rounded_rectangle([30, 245, 340, 270], radius=4, fill=(16, 185, 129, 230))
        pdraw.text((38, 248), "CONCEPT: SECOND LAW OF THERMODYNAMICS", fill=(11, 15, 23, 255), font=get_font(13, bold=True))
        
    # Box 3: Formula Proof & Steps (y: 520-720)
    if scan_y > 580 or frame_idx > 130:
        pdraw.rounded_rectangle([30, 510, 740, 690], radius=6, outline=(129, 140, 248, 230), width=2)
        pdraw.rounded_rectangle([30, 485, 330, 510], radius=4, fill=(129, 140, 248, 230))
        pdraw.text((38, 488), "FORMULA VERIFIED: dS >= dQ/T", fill=(11, 15, 23, 255), font=get_font(13, bold=True))
        
    # Drop shadow behind answer sheet
    paper_x = 50
    paper_y = 120
    shadow_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_overlay)
    sdraw.rounded_rectangle([paper_x - 12, paper_y - 10, paper_x + paper.width + 12, paper_y + paper.height + 20], radius=18, fill=(4, 8, 16, 190))
    bg.alpha_composite(shadow_overlay)
    bg.alpha_composite(paper, (paper_x, paper_y))
    
    # 2. CENTER PANEL: Floating AI Evaluation & Semantic Rubric Panel (620 wide)
    panel_x = 650
    panel_y = 120
    panel_w = 600
    panel_h = 876
    
    panel_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    pndraw = ImageDraw.Draw(panel_overlay)
    
    pndraw.rounded_rectangle([panel_x, panel_y, panel_x + panel_w, panel_y + panel_h], radius=16, fill=(16, 22, 38, 225), outline=(81, 69, 229, 190), width=2)
    
    # Top Header inside Panel
    pndraw.text((panel_x + 30, panel_y + 24), "AI EVALUATION ENGINE", fill=(129, 140, 248, 255), font=get_font(15, bold=True))
    pndraw.text((panel_x + 30, panel_y + 48), "Live Conceptual Marking", fill=(255, 255, 255, 255), font=get_font(24, bold=True))
    
    # Score Summary Card
    score_val = min(9.5, 9.5 * ease_out_cubic(frame_idx / 120.0))
    score_box_x = panel_x + 30
    score_box_y = panel_y + 95
    score_box_w = panel_w - 60
    score_box_h = 120
    
    pndraw.rounded_rectangle([score_box_x, score_box_y, score_box_x + score_box_w, score_box_y + score_box_h], radius=14, fill=(22, 30, 52, 230), outline=(16, 185, 129, 160), width=2)
    pndraw.text((score_box_x + 24, score_box_y + 20), f"{score_val:.1f}", fill=(16, 185, 129, 255), font=get_font(56, bold=True))
    pndraw.text((score_box_x + 140, score_box_y + 42), "/ 10 MARKS", fill=(160, 175, 205, 240), font=get_font(19, bold=True))
    pndraw.text((score_box_x + 24, score_box_y + 85), "GRADE: A  •  PERCENTILE: 94th", fill=(199, 210, 254, 230), font=get_font(14, bold=True))
    
    # Rubric Items Breakdown
    rubrics = [
        (35, "1. Conceptual Understanding", "4.0 / 4.0", "Clausius inequality & entropy increase.", COLOR_EMERALD),
        (75, "2. Mathematical Formulation", "3.5 / 4.0", "Partial credit (+1.5) for step logic.", COLOR_CYAN),
        (115, "3. Physical Interpretation", "2.0 / 2.0", "Reversible vs irreversible cycle.", COLOR_EMERALD)
    ]
    
    ry = score_box_y + 140
    for trigger_f, r_title, r_score, r_desc, r_col in rubrics:
        if frame_idx >= trigger_f:
            r_prog = min(1.0, (frame_idx - trigger_f) / 18.0)
            e_r = ease_out_cubic(r_prog)
            
            pndraw.rounded_rectangle([score_box_x, ry, score_box_x + score_box_w, ry + 88], radius=12, fill=(20, 28, 48, int(220 * e_r)), outline=(r_col[0], r_col[1], r_col[2], int(160 * e_r)), width=2)
            pndraw.text((score_box_x + 20, ry + 12), r_title, fill=(255, 255, 255, int(255 * e_r)), font=get_font(17, bold=True))
            pndraw.text((score_box_x + score_box_w - 120, ry + 12), r_score, fill=(r_col[0], r_col[1], r_col[2], int(255 * e_r)), font=get_font(18, bold=True))
            pndraw.text((score_box_x + 20, ry + 42), r_desc, fill=(190, 200, 220, int(230 * e_r)), font=get_font(14, regular=True))
            
        ry += 105
        
    bg.alpha_composite(panel_overlay)

    # 3. FOREGROUND TALKING PRESENTER (Right Side, with background showing the AI evaluation!)
    global_f = 810 + frame_idx
    pres_p = min(1.0, frame_idx / 25.0)
    e_pres = ease_out_cubic(pres_p)
    
    pres_h = 980
    pres_img, sx, sy = get_talking_presenter_image(global_f, height=pres_h)
    
    px = int(1050 + 60 * (1.0 - e_pres) + sx)
    py = int(100 + sy)
    
    glow = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([px + 80, py + 40, px + pres_img.width - 80, py + pres_h - 80], fill=(81, 69, 229, int(35 * e_pres)))
    bg.alpha_composite(glow)
    
    bg.alpha_composite(pres_img, (px, py))
        
    bg.alpha_composite(panel_overlay)
    
    # Transition to Scene 5 (Frames 345-360): Motion slide out
    if frame_idx >= 345:
        fade_p = (frame_idx - 345) / 15.0
        overlay = Image.new("RGBA", (1920, 1080), (10, 14, 24, int(255 * fade_p)))
        bg.alpha_composite(overlay)
        
    return bg
