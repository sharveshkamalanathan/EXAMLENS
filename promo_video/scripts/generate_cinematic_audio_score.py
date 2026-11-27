import os
import math
import wave
import struct
import numpy as np

SAMPLE_RATE = 48000
TOTAL_DURATION = 60.0
TOTAL_SAMPLES = int(SAMPLE_RATE * TOTAL_DURATION)

def generate_cinematic_audio_score():
    os.makedirs("promo_video/assets/audio/master", exist_ok=True)
    out_path = "promo_video/assets/audio/master/background_music_sfx.wav"
    
    t = np.linspace(0, TOTAL_DURATION, TOTAL_SAMPLES, endpoint=False)
    
    # Master channels
    left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    # 1. AMBIENT SYNTH PAD CHORD PROGRESSION (Indigo & Navy Tech mood: Dm - Bb - F - C)
    # Frequencies: D3 (146.83), F3 (174.61), A3 (220.0), C4 (261.63), D4 (293.66), E4 (329.63), F4 (349.23), G4 (392.0)
    chord_times = [
        (0.0, 8.0, [146.83, 220.00, 293.66, 349.23]),   # Dm9 (Mysterious, hook)
        (8.0, 17.0, [116.54, 174.61, 233.08, 293.66]),  # Bbmaj7 (Problem, tension)
        (17.0, 27.0, [130.81, 196.00, 261.63, 329.63]), # C add9 -> Dm (Solution, revelation)
        (27.0, 39.0, [146.83, 220.00, 293.66, 440.00]), # Dm / Tech pulse (AI Evaluation)
        (39.0, 51.5, [116.54, 174.61, 261.63, 349.23]), # Bb / F (Empowering, control)
        (51.5, 60.0, [146.83, 220.00, 293.66, 440.00, 587.33]) # Dm add9 resolve (Grand inspirational finale)
    ]
    
    for start, end, freqs in chord_times:
        idx_start = int(start * SAMPLE_RATE)
        idx_end = int(end * SAMPLE_RATE)
        seg_t = t[idx_start:idx_end] - start
        seg_dur = end - start
        
        # Smooth envelope
        attack = 1.2
        release = 1.2
        env = np.ones_like(seg_t)
        att_idx = int(attack * SAMPLE_RATE)
        rel_idx = int(release * SAMPLE_RATE)
        if att_idx > 0 and att_idx < len(env):
            env[:att_idx] = 0.5 - 0.5 * np.cos(np.pi * np.linspace(0, 1, att_idx))
        if rel_idx > 0 and rel_idx < len(env):
            env[-rel_idx:] = 0.5 + 0.5 * np.cos(np.pi * np.linspace(0, 1, rel_idx))
            
        pad_signal = np.zeros_like(seg_t)
        for i, f in enumerate(freqs):
            # Rich analog saw/sine blend with slight detune and chorus
            detune = 1.0 + 0.0015 * (i % 2 * 2 - 1)
            osc1 = np.sin(2 * np.pi * f * seg_t)
            osc2 = 0.4 * np.sin(2 * np.pi * f * detune * seg_t + 0.5)
            osc3 = 0.2 * np.sin(4 * np.pi * f * seg_t) # soft octave
            pad_signal += (osc1 + osc2 + osc3) / len(freqs)
            
        left[idx_start:idx_end] += 0.16 * pad_signal * env
        right[idx_start:idx_end] += 0.16 * pad_signal * env * 0.95
        
    # 2. SUB-BASS PULSE & DRUM KICK (Apple keynote style minimal tech beat)
    # Starts entering from Scene 2 (8s) and picks up energy in Scene 3 (17s) through 51s
    beat_bpm = 110.0
    beat_interval = 60.0 / beat_bpm # ~0.545 sec per beat
    current_beat = 8.0
    while current_beat < 58.0:
        idx = int(current_beat * SAMPLE_RATE)
        # Kick sound: pitch bend 120Hz -> 45Hz over 0.2s
        kick_dur = 0.25
        k_len = int(kick_dur * SAMPLE_RATE)
        if idx + k_len < TOTAL_SAMPLES:
            kt = np.linspace(0, kick_dur, k_len, endpoint=False)
            k_freq = 45.0 + 80.0 * np.exp(-18.0 * kt)
            k_phase = 2 * np.pi * np.cumsum(k_freq) / SAMPLE_RATE
            k_env = np.exp(-12.0 * kt)
            kick_amp = 0.22 if current_beat >= 17.0 else 0.14
            left[idx:idx+k_len] += kick_amp * np.sin(k_phase) * k_env
            right[idx:idx+k_len] += kick_amp * np.sin(k_phase) * k_env
            
        # Subtle hi-hat / tick on off-beats from 17s to 50s
        if current_beat >= 17.0 and current_beat < 51.0:
            hat_idx = idx + int(beat_interval * 0.5 * SAMPLE_RATE)
            hat_dur = 0.05
            h_len = int(hat_dur * SAMPLE_RATE)
            if hat_idx + h_len < TOTAL_SAMPLES:
                ht = np.linspace(0, hat_dur, h_len, endpoint=False)
                noise = np.random.normal(0, 1, h_len)
                hat_env = np.exp(-60.0 * ht)
                left[hat_idx:hat_idx+h_len] += 0.04 * noise * hat_env
                right[hat_idx:hat_idx+h_len] += 0.04 * noise * hat_env
                
        current_beat += beat_interval

    # 3. SOUND EFFECTS (SFX)
    # (a) Opening Sub-Bass Drop & Impact at 0.1s
    def add_cinematic_impact(time_sec, amp=0.35):
        idx = int(time_sec * SAMPLE_RATE)
        dur = 2.5
        length = int(dur * SAMPLE_RATE)
        if idx + length < TOTAL_SAMPLES:
            it = np.linspace(0, dur, length, endpoint=False)
            freq = 38.0 + 85.0 * np.exp(-5.0 * it)
            phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
            sub = np.sin(phase) * np.exp(-2.2 * it)
            noise_burst = np.random.normal(0, 1, length) * np.exp(-15.0 * it) * 0.2
            sig = (sub + noise_burst) * amp
            left[idx:idx+length] += sig
            right[idx:idx+length] += sig
            
    # (b) Transition Whooshes at scene cuts (7.5s, 16.5s, 26.5s, 38.5s, 51.0s)
    def add_whoosh(time_sec, amp=0.15):
        idx = int((time_sec - 0.5) * SAMPLE_RATE)
        dur = 1.0
        length = int(dur * SAMPLE_RATE)
        if idx >= 0 and idx + length < TOTAL_SAMPLES:
            wt = np.linspace(-1, 1, length)
            noise = np.random.normal(0, 1, length)
            # Bandpass filter sweep simulated by amplitude modulation of sine octaves
            env = np.exp(-3.5 * wt**2)
            whoosh = noise * env * amp
            # Stereo pan sweep from left to right
            pan = (wt + 1) / 2.0
            left[idx:idx+length] += whoosh * (1.0 - pan)
            right[idx:idx+length] += whoosh * pan
            
    # (c) High-tech scanning sound / digital chirps for OCR (Scene 4: 28s - 38s)
    def add_tech_beeps(start_sec, count=8):
        for b in range(count):
            t_beep = start_sec + b * 1.1 + 0.2
            idx = int(t_beep * SAMPLE_RATE)
            dur = 0.08
            length = int(dur * SAMPLE_RATE)
            if idx + length < TOTAL_SAMPLES:
                bt = np.linspace(0, dur, length, endpoint=False)
                f_beep = 1800.0 + (b % 3) * 450.0
                tone = np.sin(2 * np.pi * f_beep * bt) * np.exp(-35.0 * bt) * 0.05
                left[idx:idx+length] += tone
                right[idx:idx+length] += tone

    add_cinematic_impact(0.1, 0.40) # Scene 1 intro hook
    add_whoosh(7.5)                # Transition to Scene 2
    add_whoosh(16.5)               # Transition to Scene 3
    add_cinematic_impact(17.0, 0.35) # ExamLens Logo reveal impact
    add_whoosh(26.5)               # Transition to Scene 4
    add_tech_beeps(28.0, 9)        # AI Handwriting OCR scanning beeps
    add_whoosh(38.5)               # Transition to Scene 5
    add_tech_beeps(41.0, 5)        # Dashboard data telemetry
    add_whoosh(51.0)               # Transition to Scene 6
    add_cinematic_impact(56.5, 0.40) # Final Brand Reveal impact

    # Master Limiter / Normalization
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-4)
    if peak > 0.95:
        left = left / peak * 0.95
        right = right / peak * 0.95

    # Write 16-bit 48kHz stereo WAV
    left_int16 = (np.clip(left, -1.0, 1.0) * 32767).astype(np.int16)
    right_int16 = (np.clip(right, -1.0, 1.0) * 32767).astype(np.int16)
    
    stereo_interleaved = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    stereo_interleaved[0::2] = left_int16
    stereo_interleaved[1::2] = right_int16
    
    with wave.open(out_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(stereo_interleaved.tobytes())
        
    print(f"Generated master cinematic score: {out_path} ({os.path.getsize(out_path)} bytes, 60.0s)")

if __name__ == "__main__":
    generate_cinematic_audio_score()
