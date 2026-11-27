import math
import os
from PIL import Image, ImageDraw, ImageFilter
from .common import (
    COLOR_NAVY_DARK, COLOR_NAVY, COLOR_INDIGO, COLOR_INDIGO_LIGHT,
    COLOR_CYAN, COLOR_EMERALD, COLOR_AMBER, COLOR_LAVENDER,
    COLOR_WHITE, get_font, ease_out_cubic, ease_in_out_cubic,
    create_radial_gradient
)

def render_scene5(frame_idx, total_frames=375):
    t_sec = frame_idx / 30.0
    progress = frame_idx / float(total_frames)
    
    # Premium Faculty Dashboard Gradient Background
    bg = create_radial_gradient(
        width=1920, height=1080,
        center=(960, 500), radius=1200,
        color_center=(25, 34, 72), color_edge=(9, 13, 23)
    ).convert("RGBA")
    
    draw = ImageDraw.Draw(bg)
    
    # 1. TOP DASHBOARD NAVIGATION BAR
    nav_h = 75
    draw.rectangle([0, 0, 1920, nav_h], fill=(16, 22, 38, 255), outline=(81, 69, 229, 120), width=1)
    
    # Logo & Exam Title
    draw.ellipse([36, 18, 74, 56], fill=(81, 69, 229, 255))
    draw.text((48, 24), "EL", fill=(255, 255, 255, 255), font=get_font(20, bold=True))
    draw.text((88, 16), "ExamLens Faculty Portal", fill=(255, 255, 255, 255), font=get_font(20, bold=True))
    draw.text((88, 42), "Academic Session 2026 • Evaluation Workspace", fill=(160, 175, 205, 240), font=get_font(14, regular=True))
    
    # Faculty Profile Pill on right
    draw.rounded_rectangle([1580, 16, 1880, 58], radius=21, fill=(24, 32, 54, 255), outline=(129, 140, 248, 160), width=1)
    draw.ellipse([1590, 22, 1622, 54], fill=(81, 69, 229, 255))
    draw.text((1600, 26), "PS", fill=(255, 255, 255, 255), font=get_font(14, bold=True))
    draw.text((1635, 26), "Prof. Sharma (Admin)", fill=(238, 242, 255, 255), font=get_font(15, bold=True))
    
    # 2. LEFT SIDE: 6 WORKFLOW MODULES
    mod_panel_x = 70
    mod_panel_y = 110
    mod_panel_w = 880
    mod_panel_h = 810
    
    panel_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(panel_overlay)
    
    pdraw.rounded_rectangle([mod_panel_x, mod_panel_y, mod_panel_x + mod_panel_w, mod_panel_y + mod_panel_h], radius=18, fill=(16, 22, 38, 225), outline=(81, 69, 229, 180), width=2)
    pdraw.text((mod_panel_x + 35, mod_panel_y + 25), "FACULTY EVALUATION WORKFLOW", fill=(129, 140, 248, 255), font=get_font(16, bold=True))
    pdraw.text((mod_panel_x + 35, mod_panel_y + 50), "Complete Educator Control & Verification", fill=(255, 255, 255, 255), font=get_font(26, bold=True))
    
    # Workflow Steps
    workflow_steps = [
        ("1. Script Upload Center", "45 Physical answer scripts ingested & indexed", "COMPLETED", COLOR_EMERALD),
        ("2. OCR Verification", "Multi-handwriting recognition matched to questions", "VERIFIED", COLOR_CYAN),
        ("3. AI Evaluation Queue", "Automated rubric scoring across all scripts", "EVALUATED", COLOR_INDIGO_LIGHT),
        ("4. Teacher Review & Override", "Faculty adjusts marks, adds custom remarks", "EDITABLE", COLOR_AMBER),
        ("5. Official Teacher Approval", "Signed & stamped by Professor: Final grading lock", "APPROVED", COLOR_EMERALD),
        ("6. Result Publishing", "Instantly push grades & rubrics to student portal", "READY", COLOR_CYAN)
    ]
    
    wy = mod_panel_y + 100
    for i, (w_title, w_sub, w_badge, w_col) in enumerate(workflow_steps):
        trigger_f = i * 25
        w_active = frame_idx >= trigger_f
        w_prog = min(1.0, (frame_idx - trigger_f) / 18.0) if w_active else 0.0
        e_wp = ease_out_cubic(w_prog)
        
        box_y = wy
        box_h = 95
        
        # Highlight active row
        is_current = (frame_idx >= trigger_f and frame_idx < trigger_f + 35)
        border_c = w_col if is_current else (60, 75, 110, 150)
        bg_c = (26, 36, 62, 240) if is_current else (20, 28, 48, 190)
        
        pdraw.rounded_rectangle([mod_panel_x + 30, box_y, mod_panel_x + mod_panel_w - 30, box_y + box_h], radius=12, fill=bg_c, outline=border_c, width=2 if is_current else 1)
        
        # Checkmark or step index circle
        circle_col = w_col if w_active else (50, 60, 85, 255)
        pdraw.ellipse([mod_panel_x + 50, box_y + 28, mod_panel_x + 90, box_y + 68], fill=circle_col)
        check_symbol = "✓" if w_active else str(i+1)
        pdraw.text((mod_panel_x + 63, box_y + 36), check_symbol, fill=(255, 255, 255, 255), font=get_font(18, bold=True))
        
        # Text
        pdraw.text((mod_panel_x + 110, box_y + 22), w_title, fill=(255, 255, 255, 255), font=get_font(19, bold=True))
        pdraw.text((mod_panel_x + 110, box_y + 54), w_sub, fill=(185, 195, 215, 240), font=get_font(15, regular=True))
        
        # Status Pill Badge on right
        if w_active:
            pill_w = 120
            pill_x = mod_panel_x + mod_panel_w - 170
            pdraw.rounded_rectangle([pill_x, box_y + 30, pill_x + pill_w, box_y + 64], radius=17, fill=(w_col[0]//4, w_col[1]//4, w_col[2]//4, 255), outline=w_col, width=1)
            pdraw.text((pill_x + 16, box_y + 38), w_badge, fill=w_col, font=get_font(13, bold=True))
            
        wy += 112
        
    bg.alpha_composite(panel_overlay)
    
    # 3. RIGHT SIDE: ACADEMIC ANALYTICS & GRADE DISTRIBUTION
    stat_panel_x = 980
    stat_panel_y = 110
    stat_panel_w = 870
    stat_panel_h = 810
    
    stat_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stat_overlay)
    
    sdraw.rounded_rectangle([stat_panel_x, stat_panel_y, stat_panel_x + stat_panel_w, stat_panel_y + stat_panel_h], radius=18, fill=(16, 22, 38, 225), outline=(81, 69, 229, 180), width=2)
    sdraw.text((stat_panel_x + 35, stat_panel_y + 25), "ACADEMIC PERFORMANCE ANALYTICS", fill=(129, 140, 248, 255), font=get_font(16, bold=True))
    sdraw.text((stat_panel_x + 35, stat_panel_y + 50), "Class Mastery & Evaluation Metrics", fill=(255, 255, 255, 255), font=get_font(26, bold=True))
    
    # Summary Metric Cards (Top row)
    metrics = [
        ("Class Average", "84.6%", "+12.4% vs Term 1", COLOR_CYAN),
        ("Evaluation Speed", "78% Saved", "18.5 hrs reduction", COLOR_EMERALD),
        ("Grading Consistency", "99.8%", "Rubric calibrated", COLOR_INDIGO_LIGHT)
    ]
    
    card_x = stat_panel_x + 35
    card_w = (stat_panel_w - 110) // 3
    for m_label, m_val, m_sub, m_col in metrics:
        sdraw.rounded_rectangle([card_x, stat_panel_y + 105, card_x + card_w, stat_panel_y + 225], radius=14, fill=(22, 30, 52, 230), outline=(m_col[0], m_col[1], m_col[2], 160), width=2)
        sdraw.text((card_x + 18, stat_panel_y + 120), m_label, fill=(180, 190, 215, 255), font=get_font(15, bold=False))
        sdraw.text((card_x + 18, stat_panel_y + 148), m_val, fill=m_col, font=get_font(32, bold=True))
        sdraw.text((card_x + 18, stat_panel_y + 192), m_sub, fill=(16, 185, 129, 255), font=get_font(13, bold=True))
        card_x += card_w + 20
        
    # Grade Distribution Bar Chart
    chart_y = stat_panel_y + 260
    sdraw.text((stat_panel_x + 35, chart_y), "Grade Distribution (Class of 45 Students)", fill=(238, 242, 255, 255), font=get_font(20, bold=True))
    
    # Chart background box
    sdraw.rounded_rectangle([stat_panel_x + 35, chart_y + 40, stat_panel_x + stat_panel_w - 35, chart_y + 360], radius=14, fill=(20, 27, 48, 220), outline=(60, 75, 110, 140), width=1)
    
    # 4 Animated Bars (Grade A, Grade B, Grade C, Grade D)
    grades = [
        ("Grade A (90-100)", 19, 42.2, COLOR_EMERALD),
        ("Grade B (80-89)", 17, 37.8, COLOR_CYAN),
        ("Grade C (70-79)", 7, 15.6, COLOR_INDIGO_LIGHT),
        ("Grade D (<70)", 2, 4.4, COLOR_AMBER)
    ]
    
    bar_anim = ease_out_cubic(min(1.0, frame_idx / 90.0))
    bar_start_x = stat_panel_x + 75
    bar_width = (stat_panel_w - 220) // 4
    max_h = 200
    
    for i, (g_name, g_count, g_pct, g_col) in enumerate(grades):
        b_x = bar_start_x + i * (bar_width + 30)
        curr_bar_h = int((g_pct / 50.0) * max_h * bar_anim)
        b_y = chart_y + 320 - curr_bar_h
        
        # Bar shadow and fill
        if curr_bar_h > 0:
            sdraw.rounded_rectangle([b_x, b_y, b_x + bar_width, chart_y + 320], radius=8, fill=g_col)
            # Count label on top of bar
            sdraw.text((b_x + bar_width//2 - 18, b_y - 28), f"{g_count}", fill=(255, 255, 255, 255), font=get_font(18, bold=True))
            
        # Grade name below
        sdraw.text((b_x, chart_y + 328), g_name[:7], fill=(200, 210, 230, 255), font=get_font(14, bold=True))
        sdraw.text((b_x, chart_y + 346), f"{g_pct:.1f}%", fill=g_col, font=get_font(13, bold=True))
        
    # Faculty Approval Stamp
    stamp_y = chart_y + 400
    sdraw.rounded_rectangle([stat_panel_x + 35, stamp_y, stat_panel_x + stat_panel_w - 35, stamp_y + 110], radius=14, fill=(16, 28, 45, 240), outline=(16, 185, 129, 230), width=2)
    sdraw.ellipse([stat_panel_x + 60, stamp_y + 25, stat_panel_x + 120, stamp_y + 85], fill=(16, 185, 129, 255))
    sdraw.text((stat_panel_x + 80, stamp_y + 38), "✓", fill=(255, 255, 255, 255), font=get_font(32, bold=True))
    sdraw.text((stat_panel_x + 140, stamp_y + 24), "FACULTY APPROVAL CERTIFIED", fill=(16, 185, 129, 255), font=get_font(20, bold=True))
    sdraw.text((stat_panel_x + 140, stamp_y + 56), "Verified by Prof. Sharma • Final marks securely locked & ready to publish", fill=(200, 215, 235, 240), font=get_font(15, regular=True))
    
    bg.alpha_composite(stat_overlay)
    
    # 4. HIGHLIGHT BANNER: "AI EVALUATES. TEACHER VERIFIES." (Bottom full-width)
    ban_prog = min(1.0, frame_idx / 45.0)
    ban_y = 960
    
    ban_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(ban_overlay)
    bdraw.rounded_rectangle([180, ban_y, 1740, ban_y + 80], radius=18, fill=(81, 69, 229, int(230 * ban_prog)), outline=(6, 182, 212, int(255 * ban_prog)), width=3)
    
    h_font = get_font(36, bold=True)
    h_text = "AI EVALUATES.  TEACHER VERIFIES."
    hb = h_font.getbbox(h_text)
    hw = hb[2] - hb[0]
    hx = (1920 - hw) // 2
    bdraw.text((hx, ban_y + 18), h_text, fill=(255, 255, 255, int(255 * ban_prog)), font=h_font)
    bg.alpha_composite(ban_overlay)
    
    # Transition to Scene 6 (Frames 360-375)
    if frame_idx >= 360:
        f_p = (frame_idx - 360) / 15.0
        overlay = Image.new("RGBA", (1920, 1080), (11, 15, 23, int(255 * f_p)))
        bg.alpha_composite(overlay)
        
    return bg
