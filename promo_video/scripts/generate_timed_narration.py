import os
import asyncio
import edge_tts
import subprocess

FFMPEG = r"C:\Users\sharv\AppData\Local\Python\pythoncore-3.14-64\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg.exe"

# We use en-US-ChristopherNeural (or en-IN-PrabhatNeural) - Christopher has that world-class Silicon Valley / Apple keynote crisp cadence.
VOICE = "en-US-ChristopherNeural"

# Target timings:
# Scene 1: (0 to 8s, 8s slot) -> 5.8s
# Scene 2: (8 to 17s, 9s slot) -> 6.8s
# Scene 3: (17 to 27s, 10s slot) -> 8.0s
# Scene 4: (27 to 39s, 12s slot) -> 10.2s
# Scene 5: (39 to 52s, 13s slot) -> 10.8s
# Scene 6: (52 to 60s, 8s slot) -> 6.2s

SCENE_CONFIGS = {
    "scene1": {
        "text": "What if evaluating hundreds of handwritten exam papers didn't have to consume hours of a teacher's valuable time?",
        "rate": "+12%",
        "pitch": "+0Hz"
    },
    "scene2": {
        "text": "Traditional examination evaluation is time-consuming, repetitive, and demands tremendous effort from educators.",
        "rate": "+10%",
        "pitch": "+0Hz"
    },
    "scene3": {
        "text": "Meet ExamLens. An AI-assisted examination evaluation platform designed to transform the way academic assessments are conducted.",
        "rate": "+14%",
        "pitch": "+0Hz"
    },
    "scene4": {
        "text": "With universal handwriting OCR and semantic AI, ExamLens understands handwritten responses and evaluates conceptual understanding against custom rubrics, not just matching words.",
        "rate": "+15%",
        "pitch": "+0Hz"
    },
    "scene5": {
        "text": "Teachers remain in complete control. Verify AI evaluations, review grading decisions, approve answer scripts, publish results, and gain meaningful academic insights.",
        "rate": "+15%",
        "pitch": "+0Hz"
    },
    "scene6": {
        "text": "Less manual effort. Smarter evaluation. More time for education. ExamLens. See beyond the answer.",
        "rate": "+18%",
        "pitch": "+0Hz"
    }
}

async def generate_timed_narration():
    out_dir = "promo_video/assets/audio/master"
    os.makedirs(out_dir, exist_ok=True)
    
    for sc_name, cfg in SCENE_CONFIGS.items():
        out_mp3 = f"{out_dir}/{sc_name}.mp3"
        out_wav = f"{out_dir}/{sc_name}.wav"
        comm = edge_tts.Communicate(cfg["text"], VOICE, rate=cfg["rate"], pitch=cfg["pitch"])
        await comm.save(out_mp3)
        # Convert to standard 48kHz stereo WAV for clean mixing
        subprocess.run([FFMPEG, "-y", "-i", out_mp3, "-ar", "48000", "-ac", "2", out_wav], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Check duration
        probe = subprocess.run([FFMPEG, "-i", out_wav], stderr=subprocess.PIPE, text=True)
        dur = 0.0
        for line in probe.stderr.split("\n"):
            if "Duration:" in line:
                dur_str = line.split("Duration:")[1].split(",")[0].strip()
                h, m, s = dur_str.split(":")
                dur = float(h)*3600 + float(m)*60 + float(s)
                print(f"{sc_name}: duration {dur:.2f}s (target fits slot)")

if __name__ == "__main__":
    asyncio.run(generate_timed_narration())
