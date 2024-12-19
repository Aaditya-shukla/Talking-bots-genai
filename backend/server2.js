const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
// const SummaryTool = require('node-summary');
const SummarizerManager = require("node-summarizer").SummarizerManager;
// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Model paths

model.enableExternalScorer(SCORER_PATH);
// model.eraseHotWords();
model.setBeamWidth(9500);

// Function to convert audio to WAV format
function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .audioChannels(1) // Mono
            .audioFrequency(16000) // 16kHz
            .format('wav')
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
}

// Function to transcribe audio using DeepSpeech
function transcribeAudio(audioFilePath) {
    const buffer = fs.readFileSync(audioFilePath);
    // console.log("buffer", buffer);
    const result = model.stt(buffer);
    // console.log("result", result);
    return result;
}

// Main function to handle conversion and transcription
async function processAudio(inputFilePath) {
    try {
        const wavFilePath = path.join(__dirname, 'output.wav');
        await convertToWav(inputFilePath, wavFilePath); // Convert to WAV
        // console.log('Converted to WAV:', wavFilePath);
        const transcript = transcribeAudio(wavFilePath); // Transcribe
        // console.log('Transcription:', transcript);
        fs.unlinkSync(wavFilePath); // Clean up the temporary WAV file
        return transcript;
    } catch (error) {
        console.error('Error during processing:', error);
    }
}

// Example usage
// processAudio('./GonzaloMunoz_2024T_01_VO_Intro.mp3')
processAudio('./forYouHarklistIntro.mp3')

    .then(transcript => {
        console.log('Transcription:', transcript)
        // SummaryTool.summarize("title",transcript, function(err, summary) {
        //     if(err) {
        //       console.log("err is ", result)
        //     }
        //     else {
        //       console.log("------------------------",summary)
        //     }
        //   })
        summarizeText(transcript).then(summary => console.log("Summary:->", summary));

    })
    .catch(console.error);

async function summarizeText(text) {
    const summarizer = new SummarizerManager(text, 3); // 3 sentences summary
    const summary = await summarizer.getSummaryByRank();
    return summary.summary;
}

// https://github.com/jbrooksuk/node-summary