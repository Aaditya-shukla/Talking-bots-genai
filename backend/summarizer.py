# summarizer.py
from transformers import pipeline
import sys
import json

def summarize_text(text, max_length=150, min_length=30):
    summarizer = pipeline("summarization")
    summary = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)
    return summary[0]['summary_text']

if __name__ == "__main__":
    # Read the large text passed as a JSON argument from Node.js
    data = json.loads(sys.argv[1])
    text = data["text"]
    
    # Summarize the text
    summary = summarize_text(text)
    
    # Print the summary in JSON format for Node.js to capture
    print(json.dumps({"summary": summary}))