const { exec } = require("child_process");
const path = require("path");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

function transcribeAudio(filePath) {
    return new Promise((resolve, reject) => {
        // Run the Python script using exec
        exec(`python3 whisper_transcribe.py ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr || error.message}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}


function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .audioChannels(1) // Mono
            .audioFrequency(16000) // 16kHz
            .format('wav')
            .on('end', () => { console.log("Test"); resolve(outputPath) })
            .on('error', () => { console.log("reject"); reject })
            .run();
    });
}


// Main function to handle conversion and transcription
async function processAudio(inputFilePath) {
    try {
        const transcript = transcribeAudio(inputFilePath);
        return transcript;
    } catch (error) {
        console.error('Error during processing:', error);
    }
}


module.exports = processAudio;


function summarizeLargeText(text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ text });

        // Run the Python script with the JSON-encoded large text
        exec(`python3 summarizer.py '${data}'`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr || error.message}`);
            } else {
                try {
                    const output = JSON.parse(stdout);
                    resolve(output.summary);
                } catch (parseError) {
                    reject("Error parsing Python output: " + parseError.message);
                }
            }
        });
    });
}

