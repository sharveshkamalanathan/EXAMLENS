import math
import os
from PIL import Image, ImageDraw, ImageFilter
from .common import (
    COLOR_NAVY_DARK, COLOR_NAVY, COLOR_INDIGO, COLOR_INDIGO_LIGHT,
    COLOR_CYAN, COLOR_LAVENDER, COLOR_WHITE, get_font,
    ease_out_cubic, ease_in_out_cubic, create_radial_gradient
)
from .presenter_animator import get_talking_presenter_image

_home_screen_cache = None

def get_home_screenshot():
    global _home_screen_cache
    if _home_screen_cache is None:
        # Load user-provided landing page screenshot
        paths = [
            "promo_video/assets/screens/media_1795679454746_722c7439.png",
            "promo_video/assets/screens/media_1795425397726_d6ea2b37.jpg"
        ]
        chosen = paths[0] if os.path.exists(paths[0]) else paths[1]
        im = Image.open(chosen).convert("RGBA")
        
        # Build a sleek Browser Mockup Window (1360 x 780)
        win_w, win_h = 1360, 780
        browser_win = Image.new("RGBA", (win_w, win_h), (18, 24, 38, 255))
        bdraw = ImageDraw.Draw(browser_win)
        
        # Browser title bar
        bdraw.rectangle([0, 0, win_w, 42], fill=(24, 31, 48, 255))
        # Window controls (macOS / Chrome style red, yellow, green dots)
        bdraw.ellipse([18, 14, 30, 26], fill=(239, 68, 68, 255))
        bdraw.ellipse([38, 14, 50, 26], fill=(245, 158, 11, 255))
        bdraw.ellipse([58, 14, 70, 26], fill=(16, 185, 129, 255))
        
        # Address bar pill
        bdraw.rounded_rectangle([280, 8, win_w - 280, 34], radius=13, fill=(13, 17, 28, 255))
        bdraw.text((320, 12), "🔒  https://examlens-m4ji.onrender.com", fill=(160, 175, 205, 230), font=get_font(14, bold=False))
        
        # Web content body
        body_im = im.resize((win_w, win_h - 42), Image.Resampling.LANCZOS)
        browser_win.paste(body_im, (0, 42))
        
        # Outer border
        bdraw.rounded_rectangle([0, 0, win_w-1, win_h-1], radius=14, outline=(81, 69, 229, 180), width=2)
        _home_screen_cache = browser_win
        
    return _home_screen_cache

def render_scene3(frame_idx, total_frames=300):
    t_sec = frame_idx / 30.0
    progress = frame_idx / float(total_frames)
    
    # Premium Deep Indigo & Midnight Gradient Background
    bg = create_radial_gradient(
        width=1920, height=1080,
        center=(960, 480), radius=1100,
        color_center=(32, 38, 92), color_edge=(10, 14, 24)
    ).convert("RGBA")
    
    draw = ImageDraw.Draw(bg)
    
    # PART A: Cinematic Logo Reveal & Light Sweep (Frames 0 to 90)
    if frame_idx < 100:
        logo_prog = min(1.0, frame_idx / 40.0)
        ease_l = ease_out_cubic(logo_prog)
        
        logo_cy = int(480 - 40 * (1.0 - ease_l))
        logo_alpha = int(255 * ease_l)
        
        # Aperture / Lens Glowing Ring Icon
        ring_r = 54
        # Glowing outer halo
        for glow_r in range(ring_r + 20, ring_r, -4):
            glow_a = int(35 * ease_l * (1.0 - (glow_r - ring_r) / 20.0))
            draw.ellipse([960 - glow_r, logo_cy - 100 - glow_r, 960 + glow_r, logo_cy - 100 + glow_r], outline=(81, 69, 229, glow_a), width=3)
        draw.ellipse([960 - ring_r, logo_cy - 100 - ring_r, 960 + ring_r, logo_cy - 100 + ring_r], outline=(6, 182, 212, logo_alpha), width=4)
        draw.ellipse([960 - 24, logo_cy - 100 - 24, 960 + 24, logo_cy - 100 + 24], fill=(81, 69, 229, logo_alpha))
        
        # EXAMLENS Logo Typography
        title_font = get_font(68, bold=True)
        title_text = "EXAMLENS"
        t_bbox = title_font.getbbox(title_text)
        t_w = t_bbox[2] - t_bbox[0]
        t_x = (1920 - t_w) // 2
        
        # Shadow & Text
        draw.text((t_x + 3, logo_cy - 15), title_text, fill=(10, 14, 28, logo_alpha), font=title_font)
        draw.text((t_x, logo_cy - 18), title_text, fill=(255, 255, 255, logo_alpha), font=title_font)
        
        # Tagline: "See beyond the answer."
        tag_font = get_font(30, regular=True)
        tag_text = "See beyond the answer."
        tb_box = tag_font.getbbox(tag_text)
        tb_w = tb_box[2] - tb_box[0]
        tb_x = (1920 - tb_w) // 2
        draw.text((tb_x, logo_cy + 75), tag_text, fill=(199, 210, 254, int(logo_alpha * 0.95)), font=tag_font)
        
        # Electric Indigo Light Sweep across logo
        sweep_x = int(-200 + 2320 * (frame_idx / 80.0))
        sweep_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(sweep_overlay)
        sdraw.polygon([(sweep_x, 0), (sweep_x + 90, 0), (sweep_x + 30, 1080), (sweep_x - 60, 1080)], fill=(255, 255, 255, 45))
        bg.alpha_composite(sweep_overlay)
        
    # PART B: 3D Perspective Showcase of ExamLens Website with Talking Presenter (Frames 70 to 300)
    if frame_idx >= 70:
        ui_prog = min(1.0, (frame_idx - 70) / 35.0)
        ease_ui = ease_out_cubic(ui_prog)
        
        browser = get_home_screenshot()
        
        # Floating window positioned on left-center (1200 x 720)
        scale_b = 0.90
        bw = int(browser.width * scale_b)
        bh = int(browser.height * scale_b)
        b_scaled = browser.resize((bw, bh), Image.Resampling.LANCZOS)
        
        win_y = int(580 - 400 * ease_ui + math.sin(t_sec * 1.5) * 5)
        win_x = int(60 + 40 * ease_ui)
        
        # Window Drop Shadow
        shadow_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shadow_overlay)
        sdraw.rounded_rectangle([win_x - 14, win_y - 10, win_x + bw + 14, win_y + bh + 25], radius=20, fill=(5, 8, 16, int(190 * ease_ui)))
        bg.alpha_composite(shadow_overlay)
        
        # Paste browser mockup as the presenter's background
        bg.alpha_composite(b_scaled, (win_x, win_y))
        
        # Floating Top Banner: "AI-ASSISTED EXAMINATION EVALUATION"
        if frame_idx >= 95:
            b_prog = min(1.0, (frame_idx - 95) / 20.0)
            banner_alpha = int(255 * b_prog)
            
            ban_w, ban_h = 640, 50
            ban_x = 80
            ban_y = 60
            
            draw.rounded_rectangle([ban_x, ban_y, ban_x + ban_w, ban_y + ban_h], radius=14, fill=(18, 24, 45, int(220 * b_prog)), outline=(81, 69, 229, banner_alpha), width=2)
            ban_font = get_font(20, bold=True)
            draw.text((ban_x + 35, ban_y + 12), "TRANSFORMING ACADEMIC ASSESSMENTS", fill=(238, 242, 255, banner_alpha), font=ban_font)
            
        # Floating Feature Badges (Left Column)
        badges = [
            (115, 80, 780, "⚡ UNIVERSAL OCR", "Any Handwriting Style"),
            (150, 440, 780, "🎯 CONCEPT MARKING", "Semantic Rubric Grading"),
            (185, 800, 780, "🛡️ FACULTY VERIFIED", "100% Educator Control")
        ]
        for trigger_f, bx, by, b_title, b_sub in badges:
            if frame_idx >= trigger_f:
                b_p = min(1.0, (frame_idx - trigger_f) / 18.0)
                e_bp = ease_out_cubic(b_p)
                b_alpha = int(255 * e_bp)
                
                bw_box, bh_box = 320, 68
                b_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
                bdraw = ImageDraw.Draw(b_overlay)
                bdraw.rounded_rectangle([bx, by, bx + bw_box, by + bh_box], radius=12, fill=(15, 20, 36, int(230 * e_bp)), outline=(6, 182, 212, int(190 * e_bp)), width=2)
                bg.alpha_composite(b_overlay)
                
                draw.text((bx + 16, by + 10), b_title, fill=(6, 182, 212, b_alpha), font=get_font(16, bold=True))
                draw.text((bx + 16, by + 34), b_sub, fill=(225, 230, 245, int(b_alpha * 0.9)), font=get_font(14, regular=True))

        # FOREGROUND TALKING PRESENTER (Right Side, explaining the website!)
        global_f = 510 + frame_idx
        pres_p = min(1.0, (frame_idx - 70) / 25.0)
        e_pres = ease_out_cubic(pres_p)
        
        pres_h = 980
        pres_img, sx, sy = get_talking_presenter_image(global_f, height=pres_h)
        
        px = int(980 + 70 * (1.0 - e_pres) + sx)
        py = int(100 + sy)
        
        # Soft ambient rim light
        glow = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow)
        gdraw.ellipse([px + 80, py + 40, px + pres_img.width - 80, py + pres_h - 80], fill=(81, 69, 229, int(35 * e_pres)))
        bg.alpha_composite(glow)
        
        # Paste talking presenter
        bg.alpha_composite(pres_img, (px, py))
                
    # Transition to Scene 4 (Frames 285-300): Cyan laser wipe
    if frame_idx >= 285:
        trans_p = (frame_idx - 285) / 15.0
        wipe = Image.new("RGBA", (1920, 1080), (8, 11, 20, int(255 * trans_p)))
        bg.alpha_composite(wipe)
        
    return bg
