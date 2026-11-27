import math
import os
from PIL import Image, ImageDraw, ImageFilter
from .common import (
    COLOR_NAVY_DARK, COLOR_NAVY, COLOR_INDIGO, COLOR_INDIGO_LIGHT,
    COLOR_CYAN, COLOR_EMERALD, COLOR_LAVENDER, COLOR_WHITE,
    get_font, ease_out_cubic, ease_in_out_cubic, ParticleField,
    create_radial_gradient
)
from .presenter_animator import get_talking_presenter_image

_particles = ParticleField(count=55)

def render_scene6(frame_idx, total_frames=255):
    t_sec = frame_idx / 30.0
    progress = frame_idx / float(total_frames)
    
    # Midnight Navy Radial Gradient
    bg = create_radial_gradient(
        width=1920, height=1080,
        center=(960, 480), radius=1000,
        color_center=(30, 36, 85), color_edge=(8, 11, 20)
    ).convert("RGBA")
    
    draw = ImageDraw.Draw(bg)
    
    # PART A: PRESENTER WRAP-UP (Frames 0 to 125)
    if frame_idx < 125:
        # Smooth camera pullback (scale 1.06 -> 1.00)
        pullback_p = min(1.0, frame_idx / 110.0)
        e_p = ease_out_cubic(pullback_p)
        
        global_f = 1545 + frame_idx
        pres_h = int(1080 * (1.06 - 0.06 * e_p))
        pres_img, sx, sy = get_talking_presenter_image(global_f, height=pres_h)
        
        px = (1920 - pres_img.width) // 2 + sx
        py = (1080 - pres_h) // 2 + sy
        
        # Presenter fade-out towards transition to final brand screen
        if frame_idx >= 100:
            fade_out = min(1.0, (frame_idx - 100) / 25.0)
            pres_img.putalpha(int(255 * (1.0 - fade_out)))
            
        bg.alpha_composite(pres_img, (px, py))
        _particles.draw(bg, frame_idx)
        
        # Sequential Kinetic Slogans
        slogans = [
            (10, "LESS MANUAL EFFORT.", COLOR_CYAN),
            (40, "SMARTER EVALUATION.", COLOR_INDIGO_LIGHT),
            (70, "MORE TIME FOR EDUCATION.", COLOR_EMERALD)
        ]
        
        slogan_y = 920
        for trigger_f, s_text, s_col in slogans:
            if frame_idx >= trigger_f and frame_idx < trigger_f + 45:
                s_prog = min(1.0, (frame_idx - trigger_f) / 12.0)
                e_s = ease_out_cubic(s_prog)
                
                # Floating glass bar
                s_font = get_font(38, bold=True)
                sb = s_font.getbbox(s_text)
                sw = sb[2] - sb[0]
                sx = (1920 - sw) // 2
                
                s_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
                sdraw = ImageDraw.Draw(s_overlay)
                sdraw.rounded_rectangle([sx - 40, slogan_y - 12, sx + sw + 40, slogan_y + 60], radius=16, fill=(11, 15, 23, int(210 * e_s)), outline=(s_col[0], s_col[1], s_col[2], int(220 * e_s)), width=2)
                bg.alpha_composite(s_overlay)
                
                draw.text((sx, slogan_y), s_text, fill=(255, 255, 255, int(255 * e_s)), font=s_font)
                
    # PART B: GRAND FINAL BRAND REVEAL (Frames 110 to 255)
    if frame_idx >= 110:
        brand_prog = min(1.0, (frame_idx - 110) / 35.0)
        e_b = ease_out_cubic(brand_prog)
        
        b_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
        bdraw = ImageDraw.Draw(b_overlay)
        
        center_y = int(430 - 30 * (1.0 - e_b))
        alpha = int(255 * e_b)
        
        # 1. Iconic Lens Aperture Logo with glowing concentric rings
        logo_r = 68
        for gr in range(logo_r + 28, logo_r, -4):
            ga = int(40 * e_b * (1.0 - (gr - logo_r) / 28.0))
            bdraw.ellipse([960 - gr, center_y - 130 - gr, 960 + gr, center_y - 130 + gr], outline=(81, 69, 229, ga), width=3)
        bdraw.ellipse([960 - logo_r, center_y - 130 - logo_r, 960 + logo_r, center_y - 130 + logo_r], outline=(6, 182, 212, alpha), width=5)
        bdraw.ellipse([960 - 32, center_y - 130 - 32, 960 + 32, center_y - 130 + 32], fill=(81, 69, 229, alpha))
        
        # 2. Hero Headline: EXAMLENS
        h_font = get_font(84, bold=True)
        h_text = "EXAMLENS"
        hb = h_font.getbbox(h_text)
        hw = hb[2] - hb[0]
        hx = (1920 - hw) // 2
        
        bdraw.text((hx + 4, center_y - 20), h_text, fill=(8, 12, 24, alpha), font=h_font)
        bdraw.text((hx, center_y - 24), h_text, fill=(255, 255, 255, alpha), font=h_font)
        
        # 3. Subtitle Tagline: "See beyond the answer."
        tag_font = get_font(34, regular=True)
        tag_text = "See beyond the answer."
        tb = tag_font.getbbox(tag_text)
        tw = tb[2] - tb[0]
        tx = (1920 - tw) // 2
        bdraw.text((tx, center_y + 85), tag_text, fill=(199, 210, 254, int(alpha * 0.95)), font=tag_font)
        
        # 4. Triple Pillar Badge: AI Evaluates • Teacher Verifies • Student Learns
        if frame_idx >= 135:
            p_prog = min(1.0, (frame_idx - 135) / 25.0)
            p_alpha = int(255 * p_prog)
            
            p_text = "AI Evaluates  •  Teacher Verifies  •  Student Learns"
            p_font = get_font(22, bold=True)
            pb = p_font.getbbox(p_text)
            pw = pb[2] - pb[0]
            px = (1920 - pw) // 2
            
            bdraw.rounded_rectangle([px - 36, center_y + 160, px + pw + 36, center_y + 215], radius=27, fill=(20, 28, 52, int(220 * p_prog)), outline=(81, 69, 229, p_alpha), width=2)
            bdraw.text((px, center_y + 175), p_text, fill=(238, 242, 255, p_alpha), font=p_font)
            
        # 5. Website URL Box: examlens-m4ji.onrender.com
        if frame_idx >= 155:
            u_prog = min(1.0, (frame_idx - 155) / 25.0)
            u_alpha = int(255 * u_prog)
            
            u_text = "🌐  examlens-m4ji.onrender.com"
            u_font = get_font(22, bold=True)
            ub = u_font.getbbox(u_text)
            uw = ub[2] - ub[0]
            ux = (1920 - uw) // 2
            
            bdraw.rounded_rectangle([ux - 36, center_y + 245, ux + uw + 36, center_y + 298], radius=26, fill=(15, 20, 36, int(240 * u_prog)), outline=(6, 182, 212, u_alpha), width=2)
            bdraw.text((ux, center_y + 258), u_text, fill=(6, 182, 212, u_alpha), font=u_font)
            
        bg.alpha_composite(b_overlay)
        _particles.draw(bg, frame_idx)
        
    # Fade out to black on final 15 frames (Frames 240 to 255)
    if frame_idx >= 240:
        f_end = (frame_idx - 240) / 15.0
        fade_end = Image.new("RGBA", (1920, 1080), (8, 11, 20, int(255 * f_end)))
        bg.alpha_composite(fade_end)
        
    return bg
