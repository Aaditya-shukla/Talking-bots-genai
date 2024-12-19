import React, { useEffect, useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { InputGroup, FormControl, Button } from "react-bootstrap";
import { FaPaperclip, FaPaperPlane } from "react-icons/fa";

import axios from "axios";
import AudioPlayer from "./Player";
// import "./App.scss";
const ConversationPlayer = () => {
  const audioQueue = useRef([]);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const isPlayingRef = useRef(false);
  const [isStarted, setIsStarted] = useState(false);
  const [topic, setTopic] = useState("");
  const [topic2, setTopic2] = useState("");

  const [isVoiceTopic, setIsVoiceTopic] = useState(false);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false)
  const [file, setFile] = useState(null)
  const [audioInfo, setAudioInfo] = useState({
    coverImage: '',
    title: '',
    artist: ''
  });
  const [audioSrc, setAudioSrc] = useState(null);
  // const [isStarted, setIsStarted] = useState(false);
  const mediaSourceRef = useRef(null);
  const audioRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const [audioBufferQueue, setAudioBufferQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [fileName, setFileName] = useState('');
  const [check, setCheck] = useState(false);
  const [type, setType] = useState("text");


  //calling only fist time issue
  const handleFileUpload = (e) => {
    console.log("File selected--------------:", e);
    const file = e.target.files[0];
    console.log("File selected:", file);
    setType("file")
    setFile(file)
    setFileName(file.name); // Set file name
    setCheck(true); // Disable input
    // Handle file upload
  };
  // Handle file removal
  const handleRemoveFile = () => {
    setFileName(''); // Clear the file name
    setCheck(false); // Enable input
  };
  const handleSendMessage = () => {
    console.log("Message sent:", topic, topic2, message);
    // Handle sending the message
    setMessage("");
  };
  // Adjust height based on content
  const handleChange = (event) => {
    setInputValue(event.target.value);
    event.target.style.height = "auto";  // Reset the height
    event.target.style.height = `${event.target.scrollHeight}px`;  // Adjust height based on scroll height
  };



  // Initialize MediaSource and Audio element for streaming
  useEffect(() => {
    mediaSourceRef.current = new MediaSource();
    mediaSourceRef.current.addEventListener("sourceopen", handleSourceOpen);
    audioRef.current = new Audio();
    audioRef.current.src = URL.createObjectURL(mediaSourceRef.current);
    // audioRef.current.play();
  }, []);


  // Handle MediaSource buffer
  const handleSourceOpen = () => {
    const mediaSource = mediaSourceRef.current;
    if (mediaSource.sourceBuffers.length > 0) return;

    const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
    sourceBufferRef.current = sourceBuffer;
  };

  // Handle incoming audio chunks
  // const handleAudioStream = async (audioChunk) => {
  //   if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
  //     sourceBufferRef.current.appendBuffer(audioChunk);
  //   }
  // };
  /*
    const handleSubmit3 = async () => {
      if (!topic) return;
      initializeAudioContext();
      setIsStarted(true);
  
      try {
        const response = await axios.post(
          "http://localhost:3000/stream-audio",
          { url: topic2 },
          { responseType: "stream" } // Enable streaming in Axios
        );
  
        // Listen to data stream
        response.data.on("data", (chunk) => {
          handleAudioMessage(chunk.toString("base64")); // Convert chunk to base64 and process
        });
  
        // Handle stream end
        response.data.on("end", () => {
          setIsStarted(false);
        });
      } catch (error) {
        console.error("Error in audio streaming:", error);
      }
    };
    */

  // Initialize AudioContext on user interaction
  // const initializeAudioContext = () => {
  //   if (!audioContextRef.current) {
  //     audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  //   }
  //   setIsStarted(true);
  // };

  // Start or stop voice recognition
  const handleVoiceInput = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setTopic(transcript); // Set transcript as topic once listening stops
      setIsVoiceTopic(true);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  // Play the next audio buffer in the queue
  const playNextInQueue = () => {
    
    if (audioQueue.current.length === 0 || isPlayingRef.current) return;

    const audioBuffer = audioQueue.current.shift();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    audioSourceRef.current = source; // Save the current source for control
    isPlayingRef.current = true;
    setIsPlaying(true);

    source.onended = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      playNextInQueue();
    };

    source.start();
    

    // const audioBlob = new Blob([audioQueue.current.shift()], { type: 'audio/mpeg' });
    // const audioUrl = URL.createObjectURL(audioBlob);
    // console.log("audioUrl", audioUrl);
    // setAudioSrc(audioUrl);
  };

  // Pause audio playback
  // const pauseAudio = () => {
  //   if (audioContextRef.current && audioContextRef.current.state === "running") {
  //     audioContextRef.current.suspend().then(() => setIsPlaying(false));
  //   }
  // };

  // Resume audio playback
  // const resumeAudio = () => {
  //   if (audioContextRef.current && audioContextRef.current.state === "suspended") {
  //     audioContextRef.current.resume().then(() => setIsPlaying(true));
  //   }
  // };

  // Stop audio playback and clear queue
  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }
    audioQueue.current = [];
    setIsPlaying(false);
    setIsStarted(false);
  };

  // Handle new audio messages
  const handleAudioMessage = async (base64AudioData) => {
    const audioData = Uint8Array.from(atob(base64AudioData), (c) => c.charCodeAt(0)).buffer;
    const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
    audioQueue.current.push(audioBuffer);
    if (!isPlayingRef.current) playNextInQueue();
  };

  // Submit topic and start streaming audio response
  const handleSubmit = () => {
    // if (!topic) return;
    initializeAudioContext();
    setIsStarted(true);

    console.log("topic-------------------->", topic, topic2);
    const eventSource = new EventSource(`http://localhost:3000/stream?topic=${encodeURIComponent(topic)}`);
    eventSource.onmessage = (event) => {
      // handleAudioMessage(event.data);
      if (event.data === 'END') {
        // setStatusMessage("Processing complete. No further messages.");
        // setIsStarted(false);
        eventSource.close();
      } else {

        // Make this to play from audio player
        handleAudioMessage(event.data);
        // setAudioSrc(event.data); // Update with the actual key from your response

      }
    };

    eventSource.onerror = (error) => {
      console.error("Error in SSE:", error);
      eventSource.close();
    };

    eventSource.onclose = () => {
      resetAfterPlayback();
    };
  };




  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    setIsStarted(true);
  };

  const toggleAudio = async () => {
    console.log("topic2", audioContextRef, topic2);
    initializeAudioContext();

    if (audioContextRef.current) {
      if (isPlaying) {
        audioContextRef.current.suspend();
      } else {
        audioContextRef.current.resume();
        await startStreamingAudio();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentIndex(currentIndex + 1);
    setTopic2("");
    startStreamingAudio();
  };

  function isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  const startStreamingAudio = async () => {
    // if (!topic2) return;
    // if (!topic2) setCurrentIndex((prevIndex) => (prevIndex + 1));
    // initializeAudioContext();
    try {
      // const processAudioChunk = async ({ done, value }) => {
      //   if (done) return;
      //   const audioBuffer = await audioContextRef.current.decodeAudioData(value.buffer);
      //   playAudioBuffer(audioBuffer);
      // };
      let webdata;
      const response = await axios.post(`http://localhost:3000/scrap-website`, { url: topic2 }, {
        responseType: "arraybuffer",
      });
      if (topic2) {
        webdata = await axios.post(`http://localhost:3000/getWebsiteTitle`, { url: topic2 })
      }
      // This is a working code
      console.log("response", topic2, "----", currentIndex);

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      // const audio = new Audio(audioUrl);
      // audio.play();
      // Make this to accept more content from the server if asked play more keeping the previos data also
      setAudioBufferQueue((prev) => {
        // if (audioBufferQueue) {
        return [...audioBufferQueue, audioUrl]
        // } else {
        //   return [audioUrl]
        // }
      });
      initializeAudioContext();

      console.log("audioBufferQueue--->", audioBufferQueue);
      setAudioSrc(audioUrl); // Update with the actual key from your response
      setFile("");

      if (topic2) {
        setAudioInfo({
          coverImage: `http://www.google.com/s2/favicons?domain=${topic2}`,
          title: webdata && webdata.data && webdata.data.title.slice(0, 20),
          // artist: "Ryan Dhal"
        });
      }
      // AudioPlayer(audioUrl, "http://www.google.com/s2/favicons?domain=https://nodejs.org/api/child_process.html&size=16","title", "artist");

      /*
      console.log("response", response);
      const reader = response.data.getReader();
      reader.read().then(processAudioChunk);
      */
      // processAudioChunk(response.data);

    } catch (error) {
      console.error("Error streaming audio:", error);
    }
  };




  // Reset player after playback completes
  const resetAfterPlayback = () => {
    setIsStarted(false);
    // setTopic("");
    setIsVoiceTopic(false);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Automatically submit when the topic is set from voice input
  useEffect(() => {
    if (isVoiceTopic && topic) {
      handleSubmit();
    }
  }, [isVoiceTopic, topic]);

  const handleFileInput = (e) => {
    const files = e.currentTarget.files
    if (files)
      setFile(files[0])
    // show success message on file upload
    setIsFileUploaded(true)
  }

  const handleFileSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    if (file) {
      formData.append('file', file)
    }

    console.log("formData", file);

    try {
      const response = await axios.post(`http://localhost:3000/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      console.log(response);

    } catch (error) {
      console.error(error);
    }
  }


  const checkInput = (e) => {
    // Code to call the function if input is a uploaded file or a text message or a website url
    console.log("e.target.value", topic, topic2, file, message);
    if (message) {
      if (isValidURL(message)) {
        startStreamingAudio()
      } else {
        setTopic(message);
        setTopic2(message);
        handleSubmit(message);

      }
    } else {
      handleFileSubmit(e);

    }

  }

  return (

    <div className="p-6" style={{
      backgroundImage:
        "url('https://backiee.com/static/wallpapers/1000x563/365247.jpg')",
      height: "100vh",
      // marginTop: "-70px",
      // fontSize: "250px",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      position: "relative",
    }} >
      <div style={{
        marginTop: "550px",
        position: "absolute", marginLeft: "550px",

      }}>
        <div className="file-upload-bar" style={styles.uploadBar}>

          <InputGroup style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
            {/* File upload icon */}
            <InputGroup.Text>
              <Button variant="light" style={styles.iconButton} >
                <label htmlFor="file-upload" style={{ margin: 0 }}>
                  <FaPaperclip style={{ fontSize: '1.5rem' }} />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  style={styles.hiddenInput}
                  onChange={(e) => { console.log("dcdcdc------>", e.target.value); setTopic(e.target.value); setTopic2(e.target.value); handleFileUpload(e); }}
                />
              </Button>
            </InputGroup.Text>
            {/* Message input field */}
            <FormControl
              placeholder="Generate Podcast"
              as="textarea"
              aria-label="Message"
              value={fileName ? fileName : message}          // Display the file name
              onChange={(e) => { console.log("dcc",fileName, message, e.target.value); setMessage(e.target.value); setTopic(message); handleChange(e) }}
              style={styles.input}
              rows={1}
              disabled={check}                   // Disable input for typing
              readOnly={check}  
              type={type}          // Make it read-only
            >
            </FormControl>
            {fileName && (
              <Button variant="outline-danger" onClick={handleRemoveFile}>
                Remove
              </Button>
            )}
            {/* Send message button */}
            <InputGroup.Text>
              <Button variant="light" style={styles.iconButton}
                // onClick={(e) => { checkInput(e); handleSendMessage(e); handleSubmit(e); handleFileSubmit(e) }}>
                onClick={(e) => { console.log("dcdcdc", e.target); setTopic(e.target.value); setTopic2(e.target.value); checkInput(e) ; }}>

                <FaPaperPlane style={{ fontSize: '1.5rem' }} />
              </Button>
            </InputGroup.Text>
          </InputGroup>

          {/* {audioSrc &&
            <>
              <AudioPlayer
                audioSrc={audioSrc}
                coverImage={audioInfo.coverImage}
                title={audioInfo.title}
                artist={audioInfo.artist}
                audioBufferQueue={audioBufferQueue}
                currentIndex={currentIndex}
              />
              </>
            } */}

            </div>

        </div>
      </div>
      );

  // working code
  // return (
  //   <div className="p-6">
  //     <h2>Conversation Player</h2>

  //     {!isStarted ? (
  //       <>
  //         <input
  //           type="text"
  //           value={topic}
  //           onChange={(e) => { setTopic(e.target.value); setTopic2(e.target.value) }}
  //           placeholder="Enter a topic or use voice input"
  //           className="border rounded p-2 mb-4 w-full"
  //         />
  //         <div className="flex gap-4">
  //           <button onClick={handleVoiceInput} className="bg-blue-500 text-white px-4 py-2 rounded">
  //             {listening ? "Stop Listening" : "Voice Input"}
  //           </button>
  //           <button onClick={handleSubmit} disabled={!topic} className="bg-green-500 text-white px-4 py-2 rounded">
  //             Submit Topic
  //           </button>
  //         </div>
  //         <form onSubmit={handleFileSubmit}>
  //           <div className='flex flex-col gap-y-4'>
  //             <div className="flex items-center justify-center w-full mt-5">
  //               <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center p-3 w-full h-36 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-[#ffffff] hover:bg-[#f9f9f9]">
  //                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
  //                   <p className="mb-2 text-sm text-[#7b7b7b] dark:text-[#9b9b9b]"><span className="font-semibold">Click to upload</span> or drag and drop</p>
  //                   <p className="text-xs text-[#7b7b7b] dark:text-[#9b9b9b]">pdf, docx, doc mp4 mp3 (MAX.14MB)</p>
  //                 </div>
  //                 <input id="dropzone-file" type="file" className="hidden" accept='.pdf, .docx, .doc, .odt, .mp3, .mp4' required onChange={handleFileInput} />
  //               </label>
  //             </div>

  //             <button className="py-3 w-full bg-[blue] text-white rounded-lg text-center">Submit</button>
  //           </div>
  //         </form>
  //         {isFileUploaded && <div className="flex flex-col gap-y-1 w-full">
  //           <p className="text-center text-blue-800 text-sm">File uploaded</p>
  //           <div className="h-1.5 w-full bg-green-500 rounded-full"></div>
  //         </div>}
  //         <input
  //           type="text"
  //           value={topic2}
  //           onChange={(e) => setTopic2(e.target.value)}
  //           placeholder="Enter a URL"
  //           className="border rounded p-2 mb-4 w-full"
  //         />
  //         <button onClick={toggleAudio} disabled={!topic2} className="bg-green-500 text-white px-4 py-2 rounded">
  //           {isPlaying ? "Pause" : "Play"}
  //         </button>
  //         {!isStarted && (<button onClick={stopAudio} className="bg-green-500 text-white px-4 py-2 rounded">
  //           {/* {isPlaying ? "Pause" : "Play"}
  //            */}
  //           Stop
  //         </button>)}
  //       </>
  //     ) :
  //       (
  //         <div>
  //           <AudioPlayer
  //             audioSrc={audioSrc}
  //             coverImage={audioInfo.coverImage}
  //             title={audioInfo.title}
  //             artist={audioInfo.artist}
  //             audioBufferQueue={audioBufferQueue}
  //             currentIndex={currentIndex}
  //           />
  //           <button onClick={handleNext} className="bg-red-500 text-white px-4 py-2 rounded mt-4"  >
  //             Listen More
  //           </button>
  //         </div>
  //       )
  //     }
  //   </div>
  // );
};

        export default ConversationPlayer;


        const styles = {
          uploadBar: {
          backgroundColor: "#f5f5f5",
        borderRadius: "30px",
        padding: "15px",
        width: "800px",
        maxWidth: "800px",
        margin: "0 auto",
        border: "none",
        outline: 'none',
        boxShadow: 'none',

  },
        iconButton: {
          backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        outline: 'none',
        boxShadow: 'none'
    // padding: "5px",
  },
        hiddenInput: {
          display: "none",
  },
        input: {
          // borderRadius: "20px",
          border: "none",
        backgroundColor: "#f5f5f5",
        width: "100%",
        outline: 'none',
        boxShadow: 'none',
        fontSize: "25px"

  },
};