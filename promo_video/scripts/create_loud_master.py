import os
import subprocess
import numpy as np
import wave

FFMPEG = r"C:\Users\sharv\AppData\Local\Python\pythoncore-3.14-64\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg.exe"
SAMPLE_RATE = 48000
TOTAL_DURATION = 60.0
TOTAL_SAMPLES = int(SAMPLE_RATE * TOTAL_DURATION)

def create_loud_master_soundtrack():
    out_master = "promo_video/assets/audio/master/final_master_60s.wav"
    music_wav = "promo_video/assets/audio/master/rich_synth_score.wav"
    
    # 1. BUILD ENERGETIC CINEMATIC TECH SCORE
    t = np.linspace(0, TOTAL_DURATION, TOTAL_SAMPLES, endpoint=False)
    left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    # Rich Synth Arp & Pad Chords (Dm - Bb - C - Dm - F - Dm)
    chord_sections = [
        (0.0, 8.0, [146.83, 220.00, 293.66, 349.23]),   # Dm9 (Hook)
        (8.0, 17.0, [116.54, 174.61, 233.08, 293.66]),  # Bbmaj7 (Problem, tension)
        (17.0, 27.0, [130.81, 196.00, 261.63, 329.63]), # C add9 (Introducing ExamLens)
        (27.0, 39.0, [146.83, 220.00, 293.66, 440.00]), # Dm Tech pulse (AI OCR)
        (39.0, 51.5, [116.54, 174.61, 261.63, 349.23]), # Bb / F (Teacher Control)
        (51.5, 60.0, [146.83, 220.00, 293.66, 440.00, 587.33]) # Grand resolve
    ]
    
    for start, end, freqs in chord_sections:
        idx_start = int(start * SAMPLE_RATE)
        idx_end = int(end * SAMPLE_RATE)
        seg_t = t[idx_start:idx_end] - start
        
        # Envelope
        env = np.ones_like(seg_t)
        att = int(0.8 * SAMPLE_RATE)
        rel = int(0.8 * SAMPLE_RATE)
        if att < len(env):
            env[:att] = np.linspace(0, 1, att)
        if rel < len(env):
            env[-rel:] = np.linspace(1, 0, rel)
            
        pad = np.zeros_like(seg_t)
        for i, f in enumerate(freqs):
            detune = 1.0 + 0.002 * (i % 2 * 2 - 1)
            osc1 = np.sin(2 * np.pi * f * seg_t)
            osc2 = 0.5 * np.sin(2 * np.pi * f * detune * seg_t + 0.4)
            osc3 = 0.25 * np.sin(4 * np.pi * f * seg_t)
            pad += (osc1 + osc2 + osc3) / len(freqs)
            
        left[idx_start:idx_end] += 0.28 * pad * env
        right[idx_start:idx_end] += 0.28 * pad * env * 0.95
        
    # Pulsing Arpeggiator (16th notes from 17s to 52s)
    arp_bpm = 116.0
    sixteenth = 60.0 / arp_bpm / 4.0 # ~0.129s
    arp_t = 17.0
    arp_notes = [293.66, 349.23, 440.00, 523.25, 587.33, 440.00, 349.23, 293.66]
    note_idx = 0
    while arp_t < 52.0:
        idx = int(arp_t * SAMPLE_RATE)
        dur = 0.09
        alen = int(dur * SAMPLE_RATE)
        if idx + alen < TOTAL_SAMPLES:
            at = np.linspace(0, dur, alen, endpoint=False)
            freq = arp_notes[note_idx % len(arp_notes)]
            note_idx += 1
            # Pluck envelope
            a_env = np.exp(-30.0 * at)
            sig = 0.12 * np.sin(2 * np.pi * freq * at) * a_env
            pan = 0.3 if note_idx % 2 == 0 else 0.7
            left[idx:idx+alen] += sig * (1.0 - pan)
            right[idx:idx+alen] += sig * pan
        arp_t += sixteenth

    # Punchy Kick & Hi-hat (8s to 52s)
    beat_interval = 60.0 / arp_bpm
    b_time = 8.0
    while b_time < 52.0:
        idx = int(b_time * SAMPLE_RATE)
        # 808 Sub Kick
        kdur = 0.35
        klen = int(kdur * SAMPLE_RATE)
        if idx + klen < TOTAL_SAMPLES:
            kt = np.linspace(0, kdur, klen, endpoint=False)
            kfreq = 48.0 + 90.0 * np.exp(-15.0 * kt)
            kphase = 2 * np.pi * np.cumsum(kfreq) / SAMPLE_RATE
            kenv = np.exp(-9.0 * kt)
            kamp = 0.38 if b_time >= 17.0 else 0.24
            left[idx:idx+klen] += kamp * np.sin(kphase) * kenv
            right[idx:idx+klen] += kamp * np.sin(kphase) * kenv
            
        # Crisp Hat
        h_idx = idx + int(beat_interval * 0.5 * SAMPLE_RATE)
        hdur = 0.06
        hlen = int(hdur * SAMPLE_RATE)
        if h_idx + hlen < TOTAL_SAMPLES:
            ht = np.linspace(0, hdur, hlen, endpoint=False)
            noise = np.random.normal(0, 1, hlen)
            henv = np.exp(-70.0 * ht)
            left[h_idx:h_idx+hlen] += 0.08 * noise * henv
            right[h_idx:h_idx+hlen] += 0.08 * noise * henv
            
        b_time += beat_interval

    # Sound Effects
    def add_sub_impact(time_sec, amp=0.55):
        idx = int(time_sec * SAMPLE_RATE)
        dur = 2.8
        length = int(dur * SAMPLE_RATE)
        if idx + length < TOTAL_SAMPLES:
            it = np.linspace(0, dur, length, endpoint=False)
            freq = 35.0 + 85.0 * np.exp(-4.5 * it)
            phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
            sub = np.sin(phase) * np.exp(-2.0 * it)
            noise = np.random.normal(0, 1, length) * np.exp(-14.0 * it) * 0.25
            sig = (sub + noise) * amp
            left[idx:idx+length] += sig
            right[idx:idx+length] += sig

    def add_whoosh(time_sec, amp=0.25):
        idx = int((time_sec - 0.4) * SAMPLE_RATE)
        dur = 0.9
        length = int(dur * SAMPLE_RATE)
        if idx >= 0 and idx + length < TOTAL_SAMPLES:
            wt = np.linspace(-1, 1, length)
            noise = np.random.normal(0, 1, length)
            env = np.exp(-4.0 * wt**2)
            whoosh = noise * env * amp
            pan = (wt + 1) / 2.0
            left[idx:idx+length] += whoosh * (1.0 - pan)
            right[idx:idx+length] += whoosh * pan

    def add_digital_pings(start_sec, count=10):
        for b in range(count):
            bt_sec = start_sec + b * 1.0 + 0.15
            idx = int(bt_sec * SAMPLE_RATE)
            dur = 0.09
            length = int(dur * SAMPLE_RATE)
            if idx + length < TOTAL_SAMPLES:
                bt = np.linspace(0, dur, length, endpoint=False)
                fb = 2100.0 + (b % 4) * 350.0
                tone = np.sin(2 * np.pi * fb * bt) * np.exp(-32.0 * bt) * 0.10
                left[idx:idx+length] += tone
                right[idx:idx+length] += tone

    add_sub_impact(0.1, 0.65)
    add_whoosh(7.5, 0.30)
    add_whoosh(16.5, 0.35)
    add_sub_impact(17.0, 0.60)
    add_whoosh(26.5, 0.35)
    add_digital_pings(27.5, 11)
    add_whoosh(38.5, 0.35)
    add_digital_pings(40.5, 6)
    add_whoosh(51.0, 0.35)
    add_sub_impact(56.5, 0.70)

    # Save music bed
    left_i16 = (np.clip(left, -1.0, 1.0) * 32767).astype(np.int16)
    right_i16 = (np.clip(right, -1.0, 1.0) * 32767).astype(np.int16)
    interleaved = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    interleaved[0::2] = left_i16
    interleaved[1::2] = right_i16
    with wave.open(music_wav, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(interleaved.tobytes())
    print("Generated rich synth score WAV.")

    # 2. COMBINE AND COMPRESS WITH HIGH LOUDNESS (-14 LUFS / -0.5 dB peak)
    s1 = "promo_video/assets/audio/master/scene1.wav"
    s2 = "promo_video/assets/audio/master/scene2.wav"
    s3 = "promo_video/assets/audio/master/scene3.wav"
    s4 = "promo_video/assets/audio/master/scene4.wav"
    s5 = "promo_video/assets/audio/master/scene5.wav"
    s6 = "promo_video/assets/audio/master/scene6.wav"

    # Loudness target filter:
    # Boost dialogue significantly (volume=3.5), duck music slightly under dialogue,
    # and run through loudnorm (I=-14, TP=-0.5, LRA=9) to match Netflix/YouTube commercial broadcast standards!
    filter_complex = (
        "[1:a]adelay=800|800,volume=3.8[d1];"
        "[2:a]adelay=8800|8800,volume=3.8[d2];"
        "[3:a]adelay=17800|17800,volume=3.8[d3];"
        "[4:a]adelay=27800|27800,volume=3.8[d4];"
        "[5:a]adelay=39800|39800,volume=3.8[d5];"
        "[6:a]adelay=52000|52000,volume=3.8[d6];"
        "[0:a]volume=1.2[music];"
        "[d1][d2][d3][d4][d5][d6]amix=inputs=6:dropout_transition=0,volume=2.2[speech];"
        "[music][speech]amix=inputs=2:duration=first:dropout_transition=2[mixed];"
        "[mixed]loudnorm=I=-14:TP=-0.5:LRA=9[outa]"
    )

    cmd = [
        FFMPEG, "-y",
        "-i", music_wav,
        "-i", s1,
        "-i", s2,
        "-i", s3,
        "-i", s4,
        "-i", s5,
        "-i", s6,
        "-filter_complex", filter_complex,
        "-map", "[outa]",
        "-t", "60.0",
        "-ar", "48000",
        out_master
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print("FFmpeg error:", res.stderr)
    else:
        print(f"Master loud soundtrack generated: {out_master}")

if __name__ == "__main__":
    create_loud_master_soundtrack()
