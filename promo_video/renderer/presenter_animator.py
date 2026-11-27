import os
import wave
import math
import numpy as np
from PIL import Image

_presenter_cutouts = {}
_presenter_studio = {}
_speech_envelope = None

def get_speech_envelope():
    global _speech_envelope
    if _speech_envelope is not None:
        return _speech_envelope
        
    total_frames = 1800
    envelope = np.zeros(total_frames, dtype=np.float32)
    viseme_timeline = np.zeros(total_frames, dtype=int)
    
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
            
            # 5-frame moving average of RMS to track natural word pacing
            rms = np.zeros(num_video_frames, dtype=np.float32)
            for f in range(num_video_frames):
                s_start = f * samples_per_frame
                s_end = min(len(samples), s_start + samples_per_frame)
                chunk = samples[s_start:s_end]
                if len(chunk) > 0:
                    rms[f] = np.sqrt(np.mean(chunk**2))
                    
            kernel = np.ones(5) / 5.0
            smoothed = np.convolve(rms, kernel, mode='same')
            max_s = smoothed.max() if smoothed.max() > 0 else 1.0
            norm_s = smoothed / max_s
            
            # Map into envelope
            for f in range(num_video_frames):
                vf_idx = start_frame + f
                if vf_idx < total_frames:
                    envelope[vf_idx] = norm_s[f]
                    
    # Generate stable visemes with minimum 5-frame hold time (eliminates rapid flapping)
    current_v = 0
    hold_count = 0
    for vf in range(total_frames):
        e = envelope[vf]
        if e < 0.18:
            target = 0  # Closed resting smile
        elif e < 0.50:
            target = 1  # Rounded / mid-speech phoneme
        else:
            target = 2  # Wide open speech vowel
            
        if target == current_v:
            hold_count += 1
        else:
            # Hold for at least 5 frames (~160ms) for natural, relaxed articulation
            if hold_count >= 5 or (target == 2 and e > 0.65):
                current_v = target
                hold_count = 0
            else:
                hold_count += 1
        viseme_timeline[vf] = current_v
        
    _speech_envelope = (envelope, viseme_timeline)
    return _speech_envelope

def init_presenter_visemes():
    global _presenter_cutouts, _presenter_studio
    if len(_presenter_cutouts) > 0:
        return
        
    visemes_dir = "promo_video/assets/presenter/visemes_2d"
    
    # 2D Character Visemes (Option A: Modern 2D Vector Tech Educator)
    # Load pixel-perfect transparent cutouts
    _presenter_cutouts[0] = Image.open(os.path.join(visemes_dir, "cutout_0.png")).convert("RGBA")
    _presenter_cutouts[1] = Image.open(os.path.join(visemes_dir, "cutout_1.png")).convert("RGBA")
    _presenter_cutouts[2] = Image.open(os.path.join(visemes_dir, "cutout_2.png")).convert("RGBA")
    _presenter_cutouts['blink'] = Image.open(os.path.join(visemes_dir, "cutout_blink.png")).convert("RGBA")
    
    _presenter_studio = _presenter_cutouts

def get_talking_presenter_image(global_frame, height=1080, cutout=True):
    """
    Returns (image, sway_x, sway_y) with photorealistic lip movement,
    viseme modulation, micro head bobbing, and eye blinking.
    """
    init_presenter_visemes()
    envelope, viseme_timeline = get_speech_envelope()
    
    idx = min(len(envelope)-1, global_frame)
    speech_val = envelope[idx]
    viseme_idx = viseme_timeline[idx]
    
    # Eye blink every ~115 frames for 3 frames if paused or low volume
    is_blinking = (global_frame % 115 in [0, 1, 2]) and (speech_val < 0.25)
    
    frames_dict = _presenter_cutouts
    
    if is_blinking:
        base_img = frames_dict['blink']
    else:
        base_img = frames_dict[viseme_idx]
            
    # Micro head nod on speech syllables
    nod_y = int(2.5 * math.sin(global_frame * 0.25)) if speech_val > 0.15 else 0
    sway_x = int(1.2 * math.cos(global_frame * 0.05))
    
    # Scale to requested height preserving aspect ratio
    orig_w, orig_h = base_img.size
    aspect = orig_w / float(orig_h)
    target_w = int(height * aspect)
    scaled = base_img.resize((target_w, height), Image.Resampling.LANCZOS)
    return scaled, sway_x, nod_y
