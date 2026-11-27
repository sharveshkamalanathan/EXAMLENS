import os
import sys

# Ensure repository root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import time
import subprocess
import numpy as np
from PIL import Image

import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

from promo_video.renderer.scene1 import render_scene1
from promo_video.renderer.scene2 import render_scene2
from promo_video.renderer.scene3 import render_scene3
from promo_video.renderer.scene4 import render_scene4
from promo_video.renderer.scene5 import render_scene5
from promo_video.renderer.scene6 import render_scene6

def render_promo_video():
    os.makedirs("promo_video/output", exist_ok=True)
    out_mp4 = "promo_video/output/examlens_promo_60s.mp4"
    audio_path = "promo_video/assets/audio/master/final_master_60s.wav"
    
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Missing master audio track at {audio_path}")
        
    print(f"🎬 Starting High-End Promo Video Render: 1920x1080 @ 30 FPS, Exactly 60.0 Seconds (1800 Frames)")
    print(f"Master Audio Track: {audio_path}")
    print(f"Output File: {out_mp4}")
    
    scenes = [
        ("Scene 1 - Cinematic Hook", render_scene1, 240),
        ("Scene 2 - The Problem", render_scene2, 270),
        ("Scene 3 - Introducing ExamLens", render_scene3, 300),
        ("Scene 4 - AI Handwriting OCR & Evaluation", render_scene4, 360),
        ("Scene 5 - Teacher Control & Analytics", render_scene5, 375),
        ("Scene 6 - Cinematic Brand Ending", render_scene6, 255)
    ]
    
    total_expected_frames = sum(count for _, _, count in scenes)
    print(f"Total Composition Frames: {total_expected_frames} (60.0s)")
    
    # Launch FFmpeg pipe process
    ffmpeg_cmd = [
        FFMPEG, "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", "1920x1080",
        "-pix_fmt", "rgb24",
        "-r", "30",
        "-i", "-",
        "-i", audio_path,
        "-c:v", "libx264",
        "-preset", "faster",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "256k",
        "-t", "60.0",
        out_mp4
    ]
    
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    start_time = time.time()
    global_frame = 0
    
    try:
        for scene_name, scene_fn, count in scenes:
            sc_start = time.time()
            print(f"▶ Rendering {scene_name} ({count} frames)...")
            for f in range(count):
                frame_img = scene_fn(f, total_frames=count)
                # Convert RGBA to RGB for FFmpeg pipe
                rgb_img = frame_img.convert("RGB")
                raw_bytes = rgb_img.tobytes()
                proc.stdin.write(raw_bytes)
                global_frame += 1
                if global_frame % 90 == 0 or global_frame == total_expected_frames:
                    elapsed = time.time() - start_time
                    fps = global_frame / max(0.001, elapsed)
                    eta = (total_expected_frames - global_frame) / max(0.001, fps)
                    print(f"  Frame {global_frame}/{total_expected_frames} ({global_frame/30.0:.1f}s) | Speed: {fps:.1f} fps | ETA: {eta:.0f}s", flush=True)
                    
            sc_dur = time.time() - sc_start
            print(f"✓ {scene_name} rendered in {sc_dur:.1f}s", flush=True)
            
        proc.stdin.close()
        proc.wait()
        
    except Exception as e:
        proc.kill()
        raise e
        
    total_elapsed = time.time() - start_time
    size_mb = os.path.getsize(out_mp4) / (1024 * 1024)
    print(f"\n🎉 VIDEO RENDER COMPLETE!")
    print(f"Output: {out_mp4}")
    print(f"File Size: {size_mb:.2f} MB")
    print(f"Total Time: {total_elapsed:.1f}s")

if __name__ == "__main__":
    render_promo_video()
