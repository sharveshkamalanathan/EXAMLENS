import os
import cv2
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from .common import (
    COLOR_NAVY_DARK, COLOR_NAVY, COLOR_INDIGO, COLOR_INDIGO_LIGHT,
    COLOR_CYAN, COLOR_EMERALD, COLOR_LAVENDER, COLOR_WHITE,
    get_font, ease_out_cubic, ease_in_out_cubic
)
from .presenter_animator import get_talking_presenter_image

_user_frames_cache = None

def get_user_frames():
    global _user_frames_cache
    if _user_frames_cache is None:
        video_path = "promo_video/assets/user_clip_cleaned_1080p.mp4"
        _user_frames_cache = []
        if os.path.exists(video_path):
            cap = cv2.VideoCapture(video_path)
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                _user_frames_cache.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            cap.release()
    return _user_frames_cache

def render_scene4(frame_idx, total_frames=360):
    user_frames = get_user_frames()
    n_user = len(user_frames)
    
    # Map Scene 4 frames (0..360, 12s) to user video (0..240, 10s)
    # Frames 0..300 play the 10s video smoothly; frames 300..360 hold end with smooth fade
    if n_user > 0:
        v_idx = min(n_user - 1, int(frame_idx * (float(n_user) / 300.0)))
        base_arr = user_frames[v_idx]
        bg = Image.fromarray(base_arr).convert("RGBA")
    else:
        bg = Image.new("RGBA", (1920, 1080), (11, 15, 23, 255))
        
    # Top Innovation Banner
    draw = ImageDraw.Draw(bg)
    top_w, top_h = 800, 48
    top_x = (1920 - top_w) // 2
    top_y = 28
    draw.rounded_rectangle(
        [top_x, top_y, top_x + top_w, top_y + top_h],
        radius=24,
        fill=(12, 17, 32, 220),
        outline=(6, 182, 212, 220),
        width=2
    )
    b_font = get_font(18, bold=True)
    draw.text((top_x + 36, top_y + 12), "⚡  UNIVERSAL HANDWRITING OCR  •  SEMANTIC AI EVALUATION", fill=(255, 255, 255), font=b_font)
    
    # 2D Presenter overlay in bottom-right explaining the technology
    global_f = 810 + frame_idx
    pres_h = 700
    pres_img, sx, sy = get_talking_presenter_image(global_f, height=pres_h)
    
    # Position presenter on bottom-right
    px = 1920 - pres_img.width + 50 + sx
    py = 1080 - pres_h + sy
    
    # Soft ambient drop shadow behind presenter for clean depth separation
    shadow = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse([px - 50, py + 40, px + pres_img.width + 50, 1080 + 80], fill=(8, 12, 24, 170))
    bg.alpha_composite(shadow)
    
    # Composite talking 2D presenter
    bg.alpha_composite(pres_img, (px, py))
    
    # Smooth cross-dissolve to Scene 5 on last 15 frames
    if frame_idx >= 345:
        fade_p = (frame_idx - 345) / 15.0
        overlay = Image.new("RGBA", (1920, 1080), (11, 15, 23, int(255 * fade_p)))
        bg.alpha_composite(overlay)
        
    return bg
