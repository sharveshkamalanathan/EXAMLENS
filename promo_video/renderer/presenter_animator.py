import os
import wave
import math
import numpy as np
from PIL import Image

_presenter_frames = {}
_speech_envelope = None

def get_speech_envelope():
    global _speech_envelope
    if _speech_envelope is not None:
        return _speech_envelope
        
    total_frames = 1800
    envelope = np.zeros(total_frames, dtype=np.float32)
    
    # Dialogue tracks and their start timestamps in seconds
    dialogues = [
        ("promo_video/assets/audio/master/scene1.wav", 0.8),
        ("promo_video/assets/audio/master/scene2.wav", 8.8),
        ("promo_video/assets/audio/master/scene3.wav", 17.8),
        ("promo_video/assets/audio/master/scene4.wav", 27.8),
        ("promo_video/assets/audio/master/scene5.wav", 39.8),
        ("promo_video/assets/audio/master/scene6.wav", 52.0),
    ]
    
    for wav_path, start_sec in dialogues:
        if not os.path.exists(wav_path):
            continue
        with wave.open(wav_path, 'rb') as wf:
            n_frames = wf.getnframes()
            rate = wf.getframerate()
            data = wf.readframes(n_frames)
            samples = np.frombuffer(data, dtype=np.int16).astype(np.float32)
            if wf.getnchannels() == 2:
                samples = samples.reshape(-1, 2).mean(axis=1)
                
            samples_per_frame = rate // 30
            num_video_frames = n_frames // samples_per_frame
            start_frame = int(start_sec * 30)
            
            for f in range(num_video_frames):
                vf_idx = start_frame + f
                if vf_idx >= total_frames:
                    break
                s_start = f * samples_per_frame
                s_end = min(len(samples), s_start + samples_per_frame)
                chunk = samples[s_start:s_end]
                if len(chunk) > 0:
                    rms = np.sqrt(np.mean(chunk**2))
                    envelope[vf_idx] = rms
                    
    # Normalize envelope between 0.0 and 1.0 with noise gate
    max_val = np.max(envelope) if np.max(envelope) > 0 else 1.0
    gate = max_val * 0.12
    norm_env = np.clip((envelope - gate) / (max_val - gate), 0.0, 1.0)
    
    # Smooth envelope slightly for natural vocal articulation
    kernel = np.array([0.2, 0.6, 0.2])
    smoothed = np.convolve(norm_env, kernel, mode='same')
    _speech_envelope = np.clip(smoothed, 0.0, 1.0)
    return _speech_envelope

def init_presenter_visemes():
    global _presenter_frames
    if len(_presenter_frames) > 0:
        return
        
    cutout_path = "promo_video/assets/presenter/presenter_cutout.png"
    if not os.path.exists(cutout_path):
        cutout_path = "promo_video/assets/presenter/presenter_hero_studio_1795682171312.jpg"
    base = Image.open(cutout_path).convert("RGBA")
    arr = np.array(base)
    
    # Build 4 viseme stages
    for level in [0, 1, 2, 3]:
        factor = level / 3.0
        if level == 0:
            _presenter_frames[0] = base
            continue
            
        cur = arr.copy()
        shift_px = int(8 * factor)
        jaw_y_start = 385
        jaw_y_end = 470
        jaw_x_start = 635
        jaw_x_end = 765
        
        for y in range(jaw_y_end, jaw_y_start, -1):
            w = np.sin((jaw_y_end - y) / (jaw_y_end - jaw_y_start) * np.pi)
            dy = int(shift_px * w)
            if dy > 0 and y - dy >= jaw_y_start:
                cur[y, jaw_x_start:jaw_x_end] = arr[y - dy, jaw_x_start:jaw_x_end]
                
        # Inner mouth cavity
        open_h = int(6 * factor)
        if open_h > 1:
            cur[380:380+open_h, 665:725, 0] = 30
            cur[380:380+open_h, 665:725, 1] = 20
            cur[380:380+open_h, 665:725, 2] = 25
            teeth_h = max(1, open_h // 2)
            cur[380:380+teeth_h, 672:718, 0] = 210
            cur[380:380+teeth_h, 672:718, 1] = 205
            cur[380:380+teeth_h, 672:718, 2] = 210
            
        _presenter_frames[level] = Image.fromarray(cur)
        
    # Build blinking eye frame (eyes around y=240-265, x=640-750)
    blink = arr.copy()
    # Left eye: x=650-685, y=245-260; Right eye: x=710-745, y=245-260
    skin_col = arr[235, 668][:3]
    for ey in range(247, 258):
        blink[ey, 652:682, :3] = skin_col
        blink[ey, 715:745, :3] = skin_col
    # Closed eyelid crease
    blink[252, 650:684, :3] = (skin_col.astype(int) * 0.75).astype(np.uint8)
    blink[252, 713:747, :3] = (skin_col.astype(int) * 0.75).astype(np.uint8)
    _presenter_frames['blink'] = Image.fromarray(blink)

def get_talking_presenter_image(global_frame, height=1080):
    init_presenter_visemes()
    env = get_speech_envelope()
    
    # Determine speech level
    speech_val = env[min(len(env)-1, global_frame)]
    
    # Eye blink every ~110 frames for 3 frames
    is_blinking = (global_frame % 110 in [0, 1, 2]) and (speech_val < 0.6)
    
    if is_blinking:
        base_img = _presenter_frames['blink']
    else:
        # Syllable phonetic modulation: add micro oscillation while speaking
        syllable = 0.5 + 0.5 * math.sin(global_frame * 1.8)
        talk_score = speech_val * (0.6 + 0.4 * syllable)
        if talk_score < 0.15:
            level = 0
        elif talk_score < 0.45:
            level = 1
        elif talk_score < 0.75:
            level = 2
        else:
            level = 3
        base_img = _presenter_frames[level]
        
    # Micro head nod and breathing sway
    t_sec = global_frame / 30.0
    sway_y = int(2.5 * math.sin(t_sec * 2.4)) if speech_val > 0.2 else int(1.5 * math.sin(t_sec * 1.5))
    sway_x = int(1.2 * math.cos(t_sec * 1.3))
    
    # Scale to requested height preserving aspect ratio
    orig_w, orig_h = base_img.size
    aspect = orig_w / float(orig_h)
    target_w = int(height * aspect)
    scaled = base_img.resize((target_w, height), Image.Resampling.LANCZOS)
    return scaled, sway_x, sway_y
