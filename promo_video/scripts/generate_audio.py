import os
import asyncio
import edge_tts

VOICE = "en-IN-PrabhatNeural" # Or en-US-ChristopherNeural / en-US-GuyNeural / en-IN-PrabhatNeural

SCENES = {
    "scene1": "What if evaluating hundreds of handwritten exam papers didn't have to consume hours of a teacher's valuable time?",
    "scene2": "Traditional examination evaluation is time-consuming, repetitive, and demands tremendous effort from educators.",
    "scene3": "Meet ExamLens. An AI-assisted examination evaluation platform designed to transform the way academic assessments are conducted.",
    "scene4": "With universal handwriting OCR and semantic AI, ExamLens understands handwritten responses and evaluates conceptual understanding against custom rubrics, not just matching words.",
    "scene5": "Teachers remain in complete control. Verify AI evaluations, review grading decisions, approve answer scripts, publish results, and gain meaningful academic insights.",
    "scene6": "Less manual effort. Smarter evaluation. More time for education. ExamLens. See beyond the answer."
}

async def generate_speech():
    os.makedirs("promo_video/assets/audio", exist_ok=True)
    # List voices to check
    voices = await edge_tts.list_voices()
    male_voices = [v["ShortName"] for v in voices if ("en-IN" in v["ShortName"] or "en-US" in v["ShortName"]) and v["Gender"] == "Male"]
    print("Available top male voices:", male_voices[:10])
    
    # We will generate for en-IN-PrabhatNeural and en-US-ChristopherNeural to choose the best fit
    for v_choice, prefix in [("en-IN-PrabhatNeural", "in"), ("en-US-ChristopherNeural", "us")]:
        for sc_key, text in SCENES.items():
            out_file = f"promo_video/assets/audio/{sc_key}_{prefix}.mp3"
            communicate = edge_tts.Communicate(text, v_choice, rate="+2%", pitch="+0Hz")
            await communicate.save(out_file)
            size = os.path.getsize(out_file)
            print(f"Generated {out_file} ({size} bytes)")

if __name__ == "__main__":
    asyncio.run(generate_speech())
