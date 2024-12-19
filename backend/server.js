require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { execSync } = require('child_process');
const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const util = require('util');
const processAudio = require('./server3');
const extractTextFromWebsite = require('./webScraper');

AWS.config.update({
    region: "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
AWS.config.apiVersions = {
    polly: '2016-06-10',
};

const polly = new AWS.Polly();
const app = express();
app.use(cors());
app.use(express.json());

const timer = ms => new Promise(res => setTimeout(res, ms));

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


// Helper function to split text into chunks
function splitText(text, limit = 200) {
    const chunks = [];
    let current = "";

    text.split(" ").forEach((word) => {
        if ((current + word).length > limit) {
            chunks.push(current.trim());
            current = "";
        }
        current += word + " ";
    });

    if (current.trim()) {
        chunks.push(current.trim());
    }

    return chunks;
}

async function generateDialogue(topic, req, res) {
    const discussion = [
        // { role: "system", content: `You are a helpful assistant discussing the topic: ${topic}` },
        { role: "system", content: `You are two podcasters having a conversation. Each response should be conversational, as if speaking to an audience.You are discussing the topic: ${topic}` },
        { role: "user", content: "Hello! This is Matthew. Let's start our podcast." },
        // this is added for testing
        { role: "user", content: `Let's discuss the topic: ${topic}. Joanna, please start.` },
    ];
    const audioFiles = [];

    for (let i = 0; i < 2; i++) {

        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: discussion,
            max_tokens: 50,
        });

        const aiMessage = response.data.choices[0].message.content;
        const speaker = i % 2 === 0 ? 'Joanna' : 'Matthew';

        // Log the response to simulate the dialogue in text
        console.log(`${speaker}: ${aiMessage}\n`);

        let voiceId = i % 2 === 0 ? "Joanna" : "Matthew";

        const audioStream = await synthesizeText(aiMessage, voiceId);
        if (audioStream instanceof Buffer) {
            console.log("audioStream---------", audioStream);
            res.write(`data: ${audioStream.toString("base64")}\n\n`);
        }



        discussion.push({ role: "assistant", content: aiMessage });
        discussion.push({ role: "user", content: `Thank you, ${speaker}. Let's hear from the other side.` });
    }

    res.write('data: END\n\n');
    res.end(); // Close the connection

    return audioFiles;
}

// Combine audio files into one podcast file
function combineAudioFiles(audioFiles, outputFile) {
    const filesList = audioFiles.map((file) => `file '${path.resolve(file)}'`).join('\n');
    fs.writeFileSync('./output/files.txt', filesList);

    execSync(`ffmpeg -f concat -safe 0 -i ./output/files.txt -c copy ${outputFile}`);
    console.log(`Podcast created: ${outputFile}`);
}


// Helper function to synthesize audio from text
async function synthesizeText(text, voiceId) {
    const params = {
        Text: text,
        OutputFormat: "mp3",
        VoiceId: voiceId,
        Engine: "generative"

    };
    console.log("params", params)
    const data = await polly.synthesizeSpeech(params).promise();
    return data.AudioStream;
}



// SSE Endpoint to stream synthesized audio to the client
app.get("/stream", async (req, res) => {


    console.log("streaming", req.query.topic)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Add the topic to the conversation
    generateDialogue(req.query.topic, req, res);

    let index = 0;

});

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    try {
        // Step 1: Read the file
        const filePath = req.file.path;
        console.log("filePath", req.file);
        if (req.file.mimetype === "audio/mp3" || req.file.mimetype === "audio/mpeg") {
            console.log("Audio file uploaded");
            const transcript = await processAudio(filePath);
            console.log("Transcription:", transcript);
        } else {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            console.log("filePath", req.file);
            console.log("fileContent", fileContent);
        }

    } catch (error) {
        console.error("Error creating podcast:", error);
        res.status(500).send("Error creating podcast");
    }
});

// Generate a podcast script based on text content
async function generatePodcastScript(content) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are an AI that generates engaging podcast scripts." },
                { role: "user", content: `Create a podcast discussion based on this content:\n\n${content}` }
            ],
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data.choices[0].message.content;
}

app.post('/scrap-website', async (req, res) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log("req.body", req.body);
    let url = req.body.url, summary = "", title = "";
    if (req.body.url) {
        [summary, title] = await extractTextFromWebsite(url);
    } else {
        summary = "Continue elaborating on this. Provide more in-depth analysis or examples if possible."
    }
    const scriptText = await generatePodcastScript(summary.slice(0, 500));

    console.log("Summary", scriptText);

    const audioSegments = await createPodcastScript(scriptText, title, res);

});


// Function to create a conversation audio from OpenAI generated script
async function createPodcastScript(scriptText, title = "", res) {
    const lines = scriptText.split('\n').filter(line => line.trim() !== '');
    const audioSegments = [];

    const array = [];
    for (let i = 0; i < lines.length; i++) {
        let str = lines[i].split(":");
        if (str.length > 1) {
            str = str[str.length - 1];
        }
        console.log("str111111111111111", str);

        function removeExtraQuotes(text) {
            // Trim starting and ending spaces and handle primary or smart quotes around text
            if(typeof text == "string"){  // check if the string variable is some type other than string
                // do something here
                return text.trim().replace(/^[“"']+|[”"']+$/g, '');

              }
        }
        str = removeExtraQuotes(str);
        if(!str){
            continue;
        }

        console.log("str222222222222222", str);
        const voiceId = i % 2 === 0 ? 'Joanna' : 'Matthew'; // Alternate voices
        const outputFile = path.join(__dirname, `output-${i}.mp3`);

        const audioPath = await synthesizeSpeech(str, voiceId, outputFile);
        if (audioPath.AudioStream instanceof Buffer) {
            // data.AudioStream = audioPath.AudioStream;
            console.log("audioStream---------", audioPath.AudioStream);
            array.push(audioPath.AudioStream);
            res.write(audioPath.AudioStream); // Send each audio chunk immediately
            // res.write(JSON.stringify(data));
        }
        console.log("audioPath", audioPath);

    }
    console.log("array==============================", array);
    res.end(); // End the stream after all lines are sent
}

// Function to synthesize speech for each line
async function synthesizeSpeech(text, voiceId, outputPath) {
    const params = {
        Text: text,
        OutputFormat: "mp3",
        VoiceId: voiceId,
    };

    const AudioStream = await polly.synthesizeSpeech(params).promise();

    return AudioStream;
}


// Function to merge audio segments into a single audio file
async function mergeAudioFiles(audioSegments, finalOutputPath) {
    const writeStream = fs.createWriteStream(finalOutputPath);

    for (const filePath of audioSegments) {
        const data = fs.readFileSync(filePath);
        writeStream.write(data);
    }

    writeStream.end();
    return finalOutputPath;
}

// Main function to handle everything
async function generatePodcastFromText(scriptText) {
    const audioSegments = await createPodcastScript(scriptText);
    const finalAudioPath = path.join(__dirname, 'finalPodcast.mp3');

    await mergeAudioFiles(audioSegments, finalAudioPath);
    console.log(`Podcast saved at ${finalAudioPath}`);
}


app.post("/getWebsiteTitle", async (req, res) => {
    const { url } = req.body;
    console.log("url", url);
    const [summary, title] = await extractTextFromWebsite(url);
    console.log("Title", title);
    res.json({ title: title });
});


app.listen(3000, () => console.log("Server running on http://localhost:3005"));