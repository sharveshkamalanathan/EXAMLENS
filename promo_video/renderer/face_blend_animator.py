import os
import cv2
import numpy as np
from PIL import Image

def find_eyes(img_bgr):
    """
    Finds left and right eye centers.
    On our presenter image (1376x768):
    Left eye (viewer's left): approx x=670, y=250
    Right eye (viewer's right): approx x=730, y=250
    """
    # Use template matching or intensity minimum around expected eye regions
    h, w, _ = img_bgr.shape
    # Search in head region
    left_crop = img_bgr[230:270, 650:690]
    right_crop = img_bgr[230:270, 710:750]
    
    # Darkest pupil center
    l_gray = cv2.cvtColor(left_crop, cv2.COLOR_BGR2GRAY)
    r_gray = cv2.cvtColor(right_crop, cv2.COLOR_BGR2GRAY)
    
    l_min_y, l_min_x = np.unravel_index(np.argmin(l_gray), l_gray.shape)
    r_min_y, r_min_x = np.unravel_index(np.argmin(r_gray), r_gray.shape)
    
    left_eye = (650 + l_min_x, 230 + l_min_y)
    right_eye = (710 + r_min_x, 230 + r_min_y)
    return left_eye, right_eye

def align_and_blend_speaking_frames(base_img_path, speaking_img_path, output_dir="promo_video/assets/presenter/visemes"):
    os.makedirs(output_dir, exist_ok=True)
    base = cv2.imread(base_img_path, cv2.IMREAD_UNCHANGED)
    speaking = cv2.imread(speaking_img_path, cv2.IMREAD_UNCHANGED)
    
    if speaking is None:
        raise ValueError(f"Could not load speaking image from {speaking_img_path}")
        
    # Resize speaking image to base if dimensions differ
    if speaking.shape[:2] != base.shape[:2]:
        speaking = cv2.resize(speaking, (base.shape[1], base.shape[0]), interpolation=cv2.INTER_LANCZOS4)
        
    # Build feathered mouth mask
    # Mouth region on 1376x768 presenter: x: 620..770, y: 310..460
    h, w = base.shape[:2]
    mask = np.zeros((h, w), dtype=np.float32)
    
    # Elliptical soft mask centered at mouth (x=695, y=365)
    cv2.ellipse(mask, (695, 365), (55, 45), 0, 0, 360, 1.0, -1)
    # Gaussian blur to create seamless feathering
    mask = cv2.GaussianBlur(mask, (31, 31), 11.0)
    mask = np.clip(mask, 0.0, 1.0)
    mask_3c = np.stack([mask]*3, axis=-1)
    
    # Extract base and speaking in BGR
    b_bgr = base[:, :, :3].astype(np.float32)
    s_bgr = speaking[:, :, :3].astype(np.float32)
    
    # Generate 5 viseme stages: 0 (closed/rest), 1 (slight open), 2 (mid open), 3 (speaking open), 4 (wide open)
    viseme_images = {}
    for stage, weight in enumerate([0.0, 0.25, 0.55, 0.85, 1.0]):
        # Blend mouth region
        current_mask = mask_3c * weight
        blended = b_bgr * (1.0 - current_mask) + s_bgr * current_mask
        blended = np.clip(blended, 0, 255).astype(np.uint8)
        
        # Preserve alpha channel from base if RGBA
        if base.shape[2] == 4:
            blended_rgba = np.dstack([blended, base[:, :, 3]])
        else:
            blended_rgba = cv2.cvtColor(blended, cv2.COLOR_BGR2BGRA)
            
        save_path = os.path.join(output_dir, f"viseme_{stage}.png")
        cv2.imwrite(save_path, blended_rgba)
        viseme_images[stage] = save_path
        print(f"Generated viseme stage {stage} (weight={weight:.2f}) -> {save_path}")
        
    return viseme_images

if __name__ == "__main__":
    print("face_blend_animator ready")
