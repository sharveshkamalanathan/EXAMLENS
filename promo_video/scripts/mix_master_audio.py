import os
import subprocess

FFMPEG = r"C:\Users\sharv\AppData\Local\Python\pythoncore-3.14-64\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg.exe"

def mix_master_audio():
    music = "promo_video/assets/audio/master/background_music_sfx.wav"
    s1 = "promo_video/assets/audio/master/scene1.wav"
    s2 = "promo_video/assets/audio/master/scene2.wav"
    s3 = "promo_video/assets/audio/master/scene3.wav"
    s4 = "promo_video/assets/audio/master/scene4.wav"
    s5 = "promo_video/assets/audio/master/scene5.wav"
    s6 = "promo_video/assets/audio/master/scene6.wav"
    
    out_master = "promo_video/assets/audio/master/final_master_60s.wav"
    
    # adelay format: delay_left|delay_right
    filter_complex = (
        "[1:a]adelay=800|800,volume=1.4[d1];"
        "[2:a]adelay=8800|8800,volume=1.4[d2];"
        "[3:a]adelay=17800|17800,volume=1.4[d3];"
        "[4:a]adelay=27800|27800,volume=1.4[d4];"
        "[5:a]adelay=39800|39800,volume=1.4[d5];"
        "[6:a]adelay=52000|52000,volume=1.4[d6];"
        "[0:a]volume=0.85[music];"
        "[music][d1][d2][d3][d4][d5][d6]amix=inputs=7:duration=first:dropout_transition=2,volume=1.1[outa]"
    )
    
    cmd = [
        FFMPEG, "-y",
        "-i", music,
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
        print(f"Master 60s soundtrack rendered successfully: {out_master} ({os.path.getsize(out_master)} bytes)")

if __name__ == "__main__":
    mix_master_audio()
