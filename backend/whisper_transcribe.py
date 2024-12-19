# whisper_transcribe.py

import whisper
import sys

def transcribe_audio(file_path):
    model = whisper.load_model("base")  # You can change "base" to other model sizes like "small", "medium", etc.
    result = model.transcribe(file_path)
    return result["text"]

if __name__ == "__main__":
    # The first argument passed from Node.js will be the audio file path
    file_path = sys.argv[1]
    transcription = transcribe_audio(file_path)
    print(transcription)
