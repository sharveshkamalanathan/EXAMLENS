import math
import os
from PIL import Image, ImageDraw, ImageFilter
from .common import (
    COLOR_NAVY_DARK, COLOR_NAVY, COLOR_ROSE, COLOR_AMBER,
    COLOR_WHITE, COLOR_LAVENDER, get_font, ease_out_cubic,
    ease_in_out_cubic, create_radial_gradient
)

_paper_stack_cache = None

def get_paper_stack():
    global _paper_stack_cache
    if _paper_stack_cache is None:
        paths = [
            "promo_video/assets/exam_papers/scan_STU-1024.jpg",
            "promo_video/assets/exam_papers/scan_STU-1025.jpg",
            "promo_video/assets/exam_papers/scan_STU-1026.jpg",
            "promo_video/assets/exam_papers/scan_STU-1027.jpg"
        ]
        angles = [-8.0, 5.0, -3.0, 4.0]
        _paper_stack_cache = []
        for i, p in enumerate(paths):
            if os.path.exists(p):
                im = Image.open(p).convert("RGBA")
                card = im.resize((480, 640), Image.Resampling.LANCZOS)
                border = Image.new("RGBA", (496, 656), (240, 240, 245, 230))
                border.paste(card, (8, 8))
                # Pre-rotate
                p_rot = border.rotate(angles[i], expand=True, resample=Image.Resampling.BILINEAR)
                shadow = Image.new("RGBA", p_rot.size, (0, 0, 0, 95))
                _paper_stack_cache.append((p_rot, shadow))
    return _paper_stack_cache

def render_scene2(frame_idx, total_frames=270):
    t_sec = frame_idx / 30.0
    progress = frame_idx / float(total_frames)
    
    # Tension Background: Dark Slate / Navy with warm crimson undertones
    bg = create_radial_gradient(
        width=1920, height=1080,
        center=(700, 540), radius=1100,
        color_center=(35, 18, 28), color_edge=(10, 12, 20)
    ).convert("RGBA")
    
    draw = ImageDraw.Draw(bg)
    
    # Stack of exam papers on the left-center stage
    papers = get_paper_stack()
    stack_base_x = 380
    stack_base_y = 520
    
    # Camera slow creeping pan across the papers
    cam_pan_x = int(30 * math.sin(progress * math.pi))
    cam_pan_y = int(20 * progress)
    
    offsets_y = [70, 45, 20, 0]
    offsets_x = [-30, 20, -10, 0]
    
    for i, (p_rot, shadow) in enumerate(papers[:4]):
        p_img = p_rot.copy()
        
        # Red ink manual correction markings on top paper (i == 3)
        if i == 3:
            pdraw = ImageDraw.Draw(p_img)
            if frame_idx >= 30:
                pdraw.line([(90, 180), (450, 185)], fill=(225, 29, 72, 220), width=4)
                pdraw.text((410, 150), "- 2", fill=(225, 29, 72, 240), font=get_font(28, bold=True))
            if frame_idx >= 50:
                pdraw.line([(110, 320), (420, 325)], fill=(225, 29, 72, 220), width=4)
                pdraw.ellipse([370, 310, 460, 380], outline=(225, 29, 72, 240), width=4)
                pdraw.text((400, 330), "?", fill=(225, 29, 72, 240), font=get_font(32, bold=True))
            if frame_idx >= 70:
                pdraw.text((90, 520), "Manual Check: Incomplete Step", fill=(225, 29, 72, 240), font=get_font(22, bold=True))
                
        pos_x = stack_base_x + offsets_x[i] + cam_pan_x - p_img.width // 2
        pos_y = stack_base_y - offsets_y[i] + cam_pan_y - p_img.height // 2
        
        bg.alpha_composite(shadow, (pos_x + 12, pos_y + 16))
        bg.alpha_composite(p_img, (pos_x, pos_y))
        
    # Animated Ticking Clock (Right Top: representing precious hours slipping away)
    clock_cx = 1450
    clock_cy = 280
    clock_r = 90
    
    # Outer clock bezel with soft glow
    draw.ellipse([clock_cx - clock_r - 8, clock_cy - clock_r - 8, clock_cx + clock_r + 8, clock_cy + clock_r + 8], fill=(25, 18, 30, 180), outline=(225, 29, 72, 160), width=3)
    draw.ellipse([clock_cx - clock_r, clock_cy - clock_r, clock_cx + clock_r, clock_cy + clock_r], fill=(15, 20, 32, 220), outline=(255, 255, 255, 40), width=2)
    
    # Clock tick marks
    for deg in range(0, 360, 30):
        rad = math.radians(deg)
        x_in = clock_cx + (clock_r - 12) * math.sin(rad)
        y_in = clock_cy - (clock_r - 12) * math.cos(rad)
        x_out = clock_cx + clock_r * math.sin(rad)
        y_out = clock_cy - clock_r * math.cos(rad)
        draw.line([(x_in, y_in), (x_out, y_out)], fill=(200, 210, 230, 160), width=2)
        
    # Rapidly spinning clock hands showing exhausting time lost
    hand_angle_sec = math.radians((frame_idx * 16.0) % 360)
    hand_angle_min = math.radians((frame_idx * 2.5) % 360)
    
    # Minute hand
    draw.line([
        (clock_cx, clock_cy),
        (clock_cx + (clock_r - 25) * math.sin(hand_angle_min), clock_cy - (clock_r - 25) * math.cos(hand_angle_min))
    ], fill=(255, 255, 255, 230), width=4)
    # Second hand (Crimson)
    draw.line([
        (clock_cx, clock_cy),
        (clock_cx + (clock_r - 10) * math.sin(hand_angle_sec), clock_cy - (clock_r - 10) * math.cos(hand_angle_sec))
    ], fill=(225, 29, 72, 255), width=2)
    draw.ellipse([clock_cx - 5, clock_cy - 5, clock_cx + 5, clock_cy + 5], fill=(225, 29, 72, 255))
    
    # Problem Callout Cards (Right Column)
    callouts = [
        (35, "⚠️  THE PROBLEM", "TRADITIONAL EVALUATION BOTTLENECK", COLOR_AMBER),
        (75, "⏳  200+ HOURS WASTED", "Exhausting manual repetitive marking per term", COLOR_ROSE),
        (120, "📉  HUMAN GRADING FATIGUE", "Cognitive overload leads to marking inconsistencies", COLOR_ROSE),
        (165, "⏱️  DELAYED FEEDBACK", "Students wait weeks to discover learning gaps", COLOR_AMBER)
    ]
    
    card_base_x = 1080
    for trigger_f, title, subtitle, accent_col in callouts:
        if frame_idx >= trigger_f:
            c_prog = min(1.0, (frame_idx - trigger_f) / 20.0)
            ease_c = ease_out_cubic(c_prog)
            
            card_y = int(430 + (trigger_f - 35) * 1.7)
            card_w = 700
            card_h = 82
            
            # Slide in from right
            card_x = int(card_base_x + 80 * (1.0 - ease_c))
            alpha = int(255 * ease_c)
            
            # Card background
            card_overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
            cdraw = ImageDraw.Draw(card_overlay)
            cdraw.rounded_rectangle(
                [card_x, card_y, card_x + card_w, card_y + card_h],
                radius=14,
                fill=(18, 22, 34, int(210 * ease_c)),
                outline=(accent_col[0], accent_col[1], accent_col[2], int(180 * ease_c)),
                width=2
            )
            bg.alpha_composite(card_overlay)
            
            # Text
            draw.text((card_x + 24, card_y + 12), title, fill=(accent_col[0], accent_col[1], accent_col[2], alpha), font=get_font(20, bold=True))
            draw.text((card_x + 24, card_y + 42), subtitle, fill=(220, 225, 240, int(alpha * 0.9)), font=get_font(18, regular=True))
            
    # Transition to Scene 3 (Frames 255-270): Fade to black / indigo flash
    if frame_idx >= 255:
        fade_prog = (frame_idx - 255) / 15.0
        overlay = Image.new("RGBA", (1920, 1080), (11, 15, 23, int(255 * fade_prog)))
        bg.alpha_composite(overlay)
        
    return bg
