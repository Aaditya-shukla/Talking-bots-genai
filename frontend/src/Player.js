import React, { useState, useRef, useEffect } from 'react';

const AudioPlayer = ({ audioSrc, coverImage, title, artist, audioBufferQueue, currentIndex }) => {
    //   const audioRef = useRef(new Audio(audioSrc));
    console.log(audioSrc, 'audioBufferQueue');
    const audioRef = useRef(new Audio(audioSrc));
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [loop, setLoop] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [duration, setDuration] = useState(0);

    // if (audioSrc) {
    //     audioRef.current.play();
    // }

    // Play or pause the audio
    const togglePlayPause = () => {
        // if (audioBufferQueue[0]) {
        setIsPlaying(!isPlaying);
        console.log(isPlaying, 'isPlaying');
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }

        // }
    };

    // Handle time update
    useEffect(() => {
        const audio = audioRef.current;
        const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100);
        const setAudioDuration = () => setDuration(audio.duration);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', setAudioDuration);
        audio.addEventListener('ended', () => setIsPlaying(false));

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', setAudioDuration);
            audio.removeEventListener('ended', () => setIsPlaying(false));
        };
    }, []);

    useEffect(() => {
        if (audioRef.current && audioBufferQueue[currentIndex]) {
            audioRef.current.src = audioBufferQueue[currentIndex];
            audioRef.current.play();
            setIsPlaying(true);
        } else if (audioBufferQueue.length === 0) {
            audioRef.current.src = audioSrc;
            audioRef.current.play();
            setIsPlaying(true);
        }
        //   }, [currentIndex, audioBufferQueue]);
    }, [audioBufferQueue]);




    // Seek audio
    const handleSeek = (e) => {
        const audio = audioRef.current;
        const newTime = (e.target.value / 100) * audio.duration;
        audio.currentTime = newTime;
        setProgress(100);
    };



    // Control volume
    const handleVolumeChange = (e) => {
        const newVolume = e.target.value;
        audioRef.current.volume = newVolume;
        setVolume(newVolume);
    };

    // Toggle Loop
    const toggleLoop = () => {
        audioRef.current.loop = !loop;
        setLoop(!loop);
    };

    // Toggle Shuffle (for future playlist integration)
    const toggleShuffle = () => setShuffle(!shuffle);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Audio Player in React</h2>
            <div style={styles.player}>
                <img src={coverImage} alt="Cover" style={styles.cover} />
                <div style={styles.info}>
                    <h3>{title}</h3>
                    <p>{artist}</p>
                </div>

                {/* Controls */}
                <div style={styles.controls}>
                    <button onClick={() => (audioRef.current.currentTime -= 10)}>⏪</button>
                    <button onClick={togglePlayPause}>
                        {isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <button onClick={() => (audioRef.current.currentTime += 10)}>⏩</button>
                    <button onClick={toggleShuffle}>🔀</button>
                    <button onClick={toggleLoop}>{loop ? '🔂' : '🔁'}</button>
                </div>

                {/* Progress bar */}
                <div style={styles.progress}>
                    <input type="range" value={progress} onChange={handleSeek} />
                </div>

                {/* Volume control */}
                <div style={styles.volume}>
                    <label>Volume</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                    />
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        width: '300px',
        margin: '20px auto',
        padding: '20px',
        backgroundColor: '#333',
        color: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    title: {
        fontSize: '18px',
        marginBottom: '10px',
    },
    player: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    cover: {
        width: '100px',
        height: '100px',
        borderRadius: '5px',
        marginBottom: '10px',
    },
    info: {
        textAlign: 'center',
        marginBottom: '10px',
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: '10px',
    },
    progress: {
        width: '100%',
        marginBottom: '10px',
    },
    volume: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between',
    },
};

export default AudioPlayer;
