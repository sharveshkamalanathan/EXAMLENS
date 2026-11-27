import math
import os
from PIL import Image, ImageDraw, ImageFilter
from .common import (
    COLOR_NAVY_DARK, COLOR_NAVY, COLOR_INDIGO, COLOR_INDIGO_LIGHT,
    COLOR_CYAN, COLOR_EMERALD, COLOR_AMBER, COLOR_LAVENDER,
    COLOR_WHITE, get_font, ease_out_cubic, ease_in_out_cubic,
    create_radial_gradient
)
from .presenter_animator import get_talking_presenter_image

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
    
    # 2. LEFT SIDE: 6 WORKFLOW MODULES (580 wide)
    mod_panel_x = 40
    mod_panel_y = 100
    mod_panel_w = 580
    mod_panel_h = 830
    
    panel_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(panel_overlay)
    
    pdraw.rounded_rectangle([mod_panel_x, mod_panel_y, mod_panel_x + mod_panel_w, mod_panel_y + mod_panel_h], radius=16, fill=(16, 22, 38, 225), outline=(81, 69, 229, 180), width=2)
    pdraw.text((mod_panel_x + 25, mod_panel_y + 20), "FACULTY WORKFLOW", fill=(129, 140, 248, 255), font=get_font(15, bold=True))
    pdraw.text((mod_panel_x + 25, mod_panel_y + 44), "100% Educator Authority", fill=(255, 255, 255, 255), font=get_font(22, bold=True))
    
    workflow_steps = [
        ("1. Script Upload", "45 Papers ingested & indexed", "DONE", COLOR_EMERALD),
        ("2. OCR Verification", "Multi-handwriting matched", "VERIFIED", COLOR_CYAN),
        ("3. AI Evaluation Queue", "Automated rubric scoring", "SCORED", COLOR_INDIGO_LIGHT),
        ("4. Teacher Review", "Faculty adjusts any mark", "EDITABLE", COLOR_AMBER),
        ("5. Official Approval", "Professor signs & locks", "APPROVED", COLOR_EMERALD),
        ("6. Result Publishing", "Push to student portal", "READY", COLOR_CYAN)
    ]
    
    wy = mod_panel_y + 85
    for i, (w_title, w_sub, w_badge, w_col) in enumerate(workflow_steps):
        trigger_f = i * 22
        w_active = frame_idx >= trigger_f
        
        box_y = wy
        box_h = 84
        
        is_current = (frame_idx >= trigger_f and frame_idx < trigger_f + 30)
        border_c = w_col if is_current else (60, 75, 110, 150)
        bg_c = (26, 36, 62, 240) if is_current else (20, 28, 48, 190)
        
        pdraw.rounded_rectangle([mod_panel_x + 20, box_y, mod_panel_x + mod_panel_w - 20, box_y + box_h], radius=10, fill=bg_c, outline=border_c, width=2 if is_current else 1)
        
        circle_col = w_col if w_active else (50, 60, 85, 255)
        pdraw.ellipse([mod_panel_x + 35, box_y + 22, mod_panel_x + 75, box_y + 62], fill=circle_col)
        check_symbol = "✓" if w_active else str(i+1)
        pdraw.text((mod_panel_x + 48, box_y + 30), check_symbol, fill=(255, 255, 255, 255), font=get_font(16, bold=True))
        
        pdraw.text((mod_panel_x + 90, box_y + 16), w_title, fill=(255, 255, 255, 255), font=get_font(17, bold=True))
        pdraw.text((mod_panel_x + 90, box_y + 44), w_sub, fill=(185, 195, 215, 240), font=get_font(13, regular=True))
        
        if w_active:
            pill_w = 95
            pill_x = mod_panel_x + mod_panel_w - 120
            pdraw.rounded_rectangle([pill_x, box_y + 24, pill_x + pill_w, box_y + 54], radius=15, fill=(w_col[0]//4, w_col[1]//4, w_col[2]//4, 255), outline=w_col, width=1)
            pdraw.text((pill_x + 12, box_y + 31), w_badge, fill=w_col, font=get_font(11, bold=True))
            
        wy += 100
        
    bg.alpha_composite(panel_overlay)
    
    # 3. CENTER PANEL: ACADEMIC ANALYTICS & GRADE DISTRIBUTION (580 wide)
    stat_panel_x = 640
    stat_panel_y = 100
    stat_panel_w = 580
    stat_panel_h = 830
    
    stat_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stat_overlay)
    
    sdraw.rounded_rectangle([stat_panel_x, stat_panel_y, stat_panel_x + stat_panel_w, stat_panel_y + stat_panel_h], radius=16, fill=(16, 22, 38, 225), outline=(81, 69, 229, 180), width=2)
    sdraw.text((stat_panel_x + 25, stat_panel_y + 20), "PERFORMANCE ANALYTICS", fill=(129, 140, 248, 255), font=get_font(15, bold=True))
    sdraw.text((stat_panel_x + 25, stat_panel_y + 44), "Class Mastery Insights", fill=(255, 255, 255, 255), font=get_font(22, bold=True))
    
    metrics = [
        ("Class Average", "84.6%", "+12.4%", COLOR_CYAN),
        ("Time Saved", "78%", "18.5 hrs", COLOR_EMERALD),
        ("Consistency", "99.8%", "Calibrated", COLOR_INDIGO_LIGHT)
    ]
    
    card_x = stat_panel_x + 25
    card_w = (stat_panel_w - 70) // 3
    for m_label, m_val, m_sub, m_col in metrics:
        sdraw.rounded_rectangle([card_x, stat_panel_y + 85, card_x + card_w, stat_panel_y + 185], radius=12, fill=(22, 30, 52, 230), outline=(m_col[0], m_col[1], m_col[2], 160), width=2)
        sdraw.text((card_x + 12, stat_panel_y + 98), m_label, fill=(180, 190, 215, 255), font=get_font(13, bold=False))
        sdraw.text((card_x + 12, stat_panel_y + 120), m_val, fill=m_col, font=get_font(26, bold=True))
        sdraw.text((card_x + 12, stat_panel_y + 158), m_sub, fill=(16, 185, 129, 255), font=get_font(12, bold=True))
        card_x += card_w + 10
        
    chart_y = stat_panel_y + 205
    sdraw.text((stat_panel_x + 25, chart_y), "Grade Distribution (Class of 45)", fill=(238, 242, 255, 255), font=get_font(17, bold=True))
    sdraw.rounded_rectangle([stat_panel_x + 25, chart_y + 30, stat_panel_x + stat_panel_w - 25, chart_y + 310], radius=12, fill=(20, 27, 48, 220), outline=(60, 75, 110, 140), width=1)
    
    grades = [
        ("Grade A", 19, 42.2, COLOR_EMERALD),
        ("Grade B", 17, 37.8, COLOR_CYAN),
        ("Grade C", 7, 15.6, COLOR_INDIGO_LIGHT),
        ("Grade D", 2, 4.4, COLOR_AMBER)
    ]
    
    bar_anim = ease_out_cubic(min(1.0, frame_idx / 90.0))
    bar_start_x = stat_panel_x + 50
    bar_width = (stat_panel_w - 180) // 4
    max_h = 160
    
    for i, (g_name, g_count, g_pct, g_col) in enumerate(grades):
        b_x = bar_start_x + i * (bar_width + 25)
        curr_bar_h = int((g_pct / 50.0) * max_h * bar_anim)
        b_y = chart_y + 270 - curr_bar_h
        
        if curr_bar_h > 0:
            sdraw.rounded_rectangle([b_x, b_y, b_x + bar_width, chart_y + 270], radius=6, fill=g_col)
            sdraw.text((b_x + bar_width//2 - 14, b_y - 24), f"{g_count}", fill=(255, 255, 255, 255), font=get_font(15, bold=True))
            
        sdraw.text((b_x, chart_y + 276), g_name, fill=(200, 210, 230, 255), font=get_font(13, bold=True))
        sdraw.text((b_x, chart_y + 292), f"{g_pct:.1f}%", fill=g_col, font=get_font(12, bold=True))
        
    stamp_y = chart_y + 335
    sdraw.rounded_rectangle([stat_panel_x + 25, stamp_y, stat_panel_x + stat_panel_w - 25, stamp_y + 90], radius=12, fill=(16, 28, 45, 240), outline=(16, 185, 129, 230), width=2)
    sdraw.ellipse([stat_panel_x + 45, stamp_y + 18, stat_panel_x + 95, stamp_y + 68], fill=(16, 185, 129, 255))
    sdraw.text((stat_panel_x + 60, stamp_y + 28), "✓", fill=(255, 255, 255, 255), font=get_font(26, bold=True))
    sdraw.text((stat_panel_x + 110, stamp_y + 18), "FACULTY APPROVAL CERTIFIED", fill=(16, 185, 129, 255), font=get_font(16, bold=True))
    sdraw.text((stat_panel_x + 110, stamp_y + 44), "Verified by Prof. Sharma • Marks locked", fill=(200, 215, 235, 240), font=get_font(13, regular=True))
    
    bg.alpha_composite(stat_overlay)
    
    # 4. FOREGROUND TALKING PRESENTER (Right Side, with Faculty Dashboard running behind him!)
    global_f = 1170 + frame_idx
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
    
    # 5. HIGHLIGHT BANNER: "AI EVALUATES. TEACHER VERIFIES." (Bottom full-width)
    ban_prog = min(1.0, frame_idx / 40.0)
    ban_y = 960
    
    ban_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(ban_overlay)
    bdraw.rounded_rectangle([120, ban_y, 1800, ban_y + 75], radius=16, fill=(81, 69, 229, int(230 * ban_prog)), outline=(6, 182, 212, int(255 * ban_prog)), width=2)
    
    h_font = get_font(32, bold=True)
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
