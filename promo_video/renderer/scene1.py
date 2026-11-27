import os
import math
from PIL import Image, ImageDraw, ImageFilter
from .common import (
    COLOR_NAVY_DARK, COLOR_NAVY, COLOR_INDIGO, COLOR_INDIGO_LIGHT,
    COLOR_CYAN, COLOR_LAVENDER, COLOR_WHITE, get_font,
    ease_out_cubic, ParticleField, create_radial_gradient
)

_presenter_cache = None
_paper_cache = None
_bg_cache = None
_particles = ParticleField(count=45)

def get_presenter():
    global _presenter_cache
    if _presenter_cache is None:
        path = "promo_video/assets/presenter/presenter_hero_studio_1795682171312.jpg"
        img = Image.open(path).convert("RGBA")
        # Upscale to 2016 x 1134 (1.05x) for ultra-fast zero-resize zoom cropping
        img = img.resize((2016, 1134), Image.Resampling.LANCZOS)
        _presenter_cache = img
    return _presenter_cache

def get_floating_papers():
    global _paper_cache
    if _paper_cache is None:
        paths = [
            "promo_video/assets/exam_papers/scan_STU-1024.jpg",
            "promo_video/assets/exam_papers/scan_STU-1025.jpg"
        ]
        _paper_cache = []
        for p in paths:
            if os.path.exists(p):
                im = Image.open(p).convert("RGBA")
                # Resize to card size with a clean border
                card = im.resize((360, 480), Image.Resampling.LANCZOS)
                # Add subtle white border and rounded corners
                border = Image.new("RGBA", (370, 490), (255, 255, 255, 180))
                border.paste(card, (5, 5))
                _paper_cache.append(border)
    return _paper_cache

def render_scene1(frame_idx, total_frames=240):
    t_sec = frame_idx / 30.0
    progress = frame_idx / float(total_frames)
    
    # Base background
    bg = create_radial_gradient(
        width=1920, height=1080,
        center=(960, 480), radius=900,
        color_center=(28, 32, 70), color_edge=(8, 11, 20)
    ).convert("RGBA")
    
    # Presenter layer with ultra-fast zero-resize zoom cropping
    pres = get_presenter()
    # Interpolate crop size from (2016, 1134) down to (1920, 1080)
    zoom_t = ease_out_cubic(progress)
    cw = int(2016 - 96 * zoom_t)
    ch = int(1134 - 54 * zoom_t)
    
    # Slight breathing sway
    breathing_offset_y = int(3.0 * math.sin(t_sec * 2.2))
    breathing_offset_x = int(1.5 * math.cos(t_sec * 1.5))
    
    cx = (2016 - cw) // 2 + breathing_offset_x
    cy = (1134 - ch) // 2 + breathing_offset_y
    pres_cropped = pres.crop((cx, cy, cx + cw, cy + ch)).resize((1920, 1080), Image.Resampling.BILINEAR)
    
    # Fade in presenter over first 20 frames
    alpha_reveal = min(1.0, frame_idx / 20.0)
    if alpha_reveal < 1.0:
        enhancer = Image.new("RGBA", (1920, 1080), (0, 0, 0, int(255 * (1.0 - alpha_reveal))))
        pres_cropped.alpha_composite(enhancer)
        
    bg.alpha_composite(pres_cropped)
    
    # Floating examination papers entering from 2.5s (frame 75)
    papers = get_floating_papers()
    if frame_idx >= 60 and len(papers) >= 2:
        paper_prog = min(1.0, (frame_idx - 60) / 45.0)
        ease_p = ease_out_cubic(paper_prog)
        
        # Left foreground paper (drifting in from left-bottom)
        p1 = papers[0].rotate(12.0 + math.sin(t_sec * 1.2) * 2.5, expand=True, resample=Image.Resampling.BILINEAR)
        p1_x = int(-120 + 260 * ease_p + math.sin(t_sec * 1.4) * 8)
        p1_y = int(580 - 140 * ease_p + math.cos(t_sec * 1.2) * 8)
        # Apply gentle transparency
        p1.putalpha(int(220 * ease_p))
        bg.alpha_composite(p1, (p1_x, p1_y))
        
        # Right background paper (drifting in from right-middle)
        p2 = papers[1].rotate(-14.0 - math.cos(t_sec * 1.1) * 2.0, expand=True, resample=Image.Resampling.BILINEAR)
        p2_x = int(1920 - 450 * ease_p + math.cos(t_sec * 1.5) * 8)
        p2_y = int(220 + 80 * ease_p + math.sin(t_sec * 1.3) * 8)
        p2.putalpha(int(190 * ease_p))
        bg.alpha_composite(p2, (p2_x, p2_y))
        
    # Floating ambient dust particles
    _particles.draw(bg, frame_idx)
    
    # Kinetic Typography
    draw = ImageDraw.Draw(bg)
    
    # Top Innovation Pill Badge (Frame 20+)
    if frame_idx >= 20:
        b_alpha = min(1.0, (frame_idx - 20) / 25.0)
        pill_w, pill_h = 320, 42
        pill_x = (1920 - pill_w) // 2
        pill_y = 65
        
        # Pill glow and box
        draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=21, fill=(20, 27, 55, int(200 * b_alpha)), outline=(81, 69, 229, int(220 * b_alpha)), width=2)
        badge_font = get_font(16, bold=True)
        draw.text((pill_x + 38, pill_y + 10), "⚡  EXAMLENS  ACADEMIC  AI", fill=(238, 242, 255, int(240 * b_alpha)), font=badge_font)
        
    # Dramatic Kinetic Headline: "THE FUTURE OF EXAMINATION EVALUATION." (Frame 110+)
    if frame_idx >= 100:
        text_prog = min(1.0, (frame_idx - 100) / 30.0)
        text_y = int(930 - 30 * ease_out_cubic(text_prog))
        alpha_text = int(255 * text_prog)
        
        # Glass backing bar
        bar_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
        bdraw = ImageDraw.Draw(bar_overlay)
        bdraw.rounded_rectangle([260, text_y - 20, 1660, text_y + 65], radius=16, fill=(11, 15, 23, int(190 * text_prog)), outline=(81, 69, 229, int(160 * text_prog)), width=2)
        bg.alpha_composite(bar_overlay)
        
        # Typography
        headline_font = get_font(38, bold=True)
        text = "THE FUTURE OF EXAMINATION EVALUATION."
        # Center text
        bbox = headline_font.getbbox(text)
        tw = bbox[2] - bbox[0]
        tx = (1920 - tw) // 2
        
        # Drop shadow & text
        draw.text((tx + 2, text_y + 2), text, fill=(15, 23, 42, alpha_text), font=headline_font)
        draw.text((tx, text_y), text, fill=(255, 255, 255, alpha_text), font=headline_font)
        
    # Transition out (Frames 225-240): Smooth speed ramp motion blur into Scene 2
    if frame_idx >= 225:
        blur_prog = (frame_idx - 225) / 15.0
        fade_overlay = Image.new("RGBA", (1920, 1080), (11, 15, 23, int(255 * blur_prog)))
        bg.alpha_composite(fade_overlay)
        
    return bg
