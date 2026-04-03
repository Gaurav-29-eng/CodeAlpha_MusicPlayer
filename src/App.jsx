import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

const playlist = [
  { id: 1, title: "Aashiq Tera", artist: "Bollywood Hits", cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop", src: "/Aashiq Tera.mp3", duration: "3:45" },
  { id: 2, title: "Arz Kiya Hai", artist: "Bollywood Hits", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop", src: "/Arz Kiya Hai.mp3", duration: "4:12" },
  { id: 3, title: "Tere Hawaale", artist: "Bollywood Hits", cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop", src: "/Tere Hawaale.mp3", duration: "3:58" },
  { id: 4, title: "Hawayein", artist: "Bollywood Hits", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop", src: "/Hawayein.mp3", duration: "3:33" },
  { id: 5, title: "Soch Na Sake", artist: "Bollywood Hits", cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop", src: "/Soch Na Sake.mp3", duration: "3:28" },
  { id: 6, title: "Tera Yaar Hoon Main", artist: "Bollywood Hits", cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop", src: "/Tera Yaar Hoon Main.mp3", duration: "4:05" },
  { id: 7, title: "Sau Rabwaan", artist: "Bollywood Hits", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop", src: "/Sau Rabwaan.mp3", duration: "3:50" },
  { id: 8, title: "Ve Kamleya", artist: "Bollywood Hits", cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop", src: "/Ve Kamleya.mp3", duration: "3:15" }
]

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Helper to parse hardcoded duration string to seconds (fallback)
function parseDuration(durationStr) {
  if (!durationStr) return 0
  const [mins, secs] = durationStr.split(':').map(Number)
  return (mins || 0) * 60 + (secs || 0)
}

// Custom hook for audio player logic
function useAudioPlayer() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [songDurations, setSongDurations] = useState({})
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [shuffledIndices, setShuffledIndices] = useState([])
  
  const audioRef = useRef(null)
  const currentSong = playlist[currentSongIndex]

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  // Toggle shuffle mode
  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
      const newShuffle = !prev
      if (newShuffle) {
        // Create shuffled array excluding current song
        const indices = playlist.map((_, i) => i).filter(i => i !== currentSongIndex)
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]]
        }
        setShuffledIndices(indices)
      }
      return newShuffle
    })
  }, [currentSongIndex])

  // Toggle repeat mode
  const toggleRepeat = useCallback(() => {
    setIsRepeat(prev => !prev)
  }, [])

  // Navigate to next song
  const playNext = useCallback(() => {
    if (isShuffle && shuffledIndices.length > 0) {
      const nextIndex = shuffledIndices[0]
      setShuffledIndices(prev => prev.slice(1))
      setCurrentSongIndex(nextIndex)
    } else {
      setCurrentSongIndex(prev => (prev + 1) % playlist.length)
    }
  }, [isShuffle, shuffledIndices])

  // Navigate to previous song
  const playPrevious = useCallback(() => {
    setCurrentSongIndex(prev => (prev - 1 + playlist.length) % playlist.length)
  }, [])

  // Select specific song
  const selectSong = useCallback((index) => {
    setCurrentSongIndex(index)
    setIsPlaying(true)
    if (isShuffle) {
      // Reshuffle when manually selecting a song
      const indices = playlist.map((_, i) => i).filter(i => i !== index)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]
      }
      setShuffledIndices(indices)
    }
  }, [isShuffle])

  // Seek to specific time
  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  // Handle volume change
  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  // Handle time update from audio element
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [])

  // Handle metadata loaded - get real duration
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration
      if (audioDuration && !isNaN(audioDuration)) {
        setDuration(audioDuration)
        // Store duration for this song
        setSongDurations(prev => ({
          ...prev,
          [currentSong.id]: audioDuration
        }))
      }
    }
  }, [currentSong.id])

  // Handle song end - respect repeat and shuffle modes
  const handleEnded = useCallback(() => {
    if (isRepeat) {
      // Loop current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
    } else if (isShuffle && shuffledIndices.length > 0) {
      const nextIndex = shuffledIndices[0]
      setShuffledIndices(prev => prev.slice(1))
      setCurrentSongIndex(nextIndex)
      setIsPlaying(true)
    } else {
      setCurrentSongIndex(prev => (prev + 1) % playlist.length)
      setIsPlaying(true)
    }
  }, [isRepeat, isShuffle, shuffledIndices])

  // Sync audio playback with isPlaying state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false))
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSongIndex])

  // Reset time when song changes
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
  }, [currentSongIndex])

  // Set initial volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [])

  // Get formatted duration for current song
  const getSongDuration = useCallback((songId) => {
    return songDurations[songId] || 0
  }, [songDurations])

  return {
    audioRef,
    currentSong,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    isRepeat,
    songDurations,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrevious,
    selectSong,
    seek,
    changeVolume,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    getSongDuration,
    playlist
  }
}

function App() {
  const {
    audioRef,
    currentSong,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    isRepeat,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrevious,
    selectSong,
    seek,
    changeVolume,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    getSongDuration,
    playlist
  } = useAudioPlayer()

  const [isHovered, setIsHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displaySong, setDisplaySong] = useState(currentSong)
  const [isMiniMode, setIsMiniMode] = useState(false)

  // Handle smooth transitions between songs
  useEffect(() => {
    if (currentSong.id !== displaySong.id) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplaySong(currentSong)
        setIsTransitioning(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentSong, displaySong.id])

  // Dynamic background component
  const DynamicBackground = () => (
    <div className="dynamic-background">
      <div 
        className={`background-layer ${isTransitioning ? 'fade-out' : 'fade-in'}`}
        style={{ backgroundImage: `url(${displaySong.cover})` }}
      />
      <div className="background-overlay" />
    </div>
  )

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  // Audio Visualizer Component
  const AudioVisualizer = () => (
    <div className={`audio-visualizer ${isPlaying ? 'playing' : ''}`}>
      {[...Array(12)].map((_, i) => (
        <span 
          key={i} 
          className="visualizer-bar"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )

  const toggleMiniMode = () => {
    setIsMiniMode(prev => !prev)
  }

  const expandPlayer = () => {
    setIsMiniMode(false)
  }

  // Mini Player Component
  const MiniPlayer = () => (
    <div className="mini-player" onClick={expandPlayer}>
      <div className="mini-player-content">
        <div className="mini-cover">
          <img 
            src={displaySong.cover} 
            alt={displaySong.title}
            className={isPlaying ? 'playing' : ''}
          />
        </div>
        <div className="mini-info">
          <span className="mini-title">{displaySong.title}</span>
          <span className="mini-artist">{displaySong.artist}</span>
        </div>
        <div className="mini-controls">
          <button 
            className="mini-play-btn" 
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button 
            className="mini-next-btn"
            onClick={(e) => {
              e.stopPropagation()
              playNext()
            }}
            aria-label="Next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
        <button className="mini-expand-btn" aria-label="Expand player">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z" />
          </svg>
        </button>
      </div>
      <div className="mini-progress">
        <div 
          className="mini-progress-fill" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )

  return (
    <>
      <DynamicBackground />
      {isMiniMode ? (
        <MiniPlayer />
      ) : (
        <div className="music-player-container">
          <button className="collapse-btn" onClick={toggleMiniMode} aria-label="Collapse to mini player">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          <div className="glass-card">
        {/* Header */}
        <div className="header">
          <h1 className="title">
            <span className="title-icon">♪</span>
            Music Player
          </h1>
          <div className="now-playing">
            <span className="live-indicator"></span>
            Now Playing
          </div>
        </div>

        {/* Album Cover */}
        <div 
          className="album-cover-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className={`album-cover-wrapper ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
            <img 
              src={displaySong.cover} 
              alt={`${displaySong.title} cover`}
              className={`album-cover ${isPlaying ? 'playing' : ''}`}
            />
          </div>
          <div className={`album-overlay ${isHovered ? 'visible' : ''}`}>
            <button className="overlay-play-btn" onClick={togglePlay}>
              {isPlaying ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Song Info */}
        <div className={`song-info ${isTransitioning ? 'text-fade-out' : 'text-fade-in'}`}>
          <h2 className="song-title">{displaySong.title}</h2>
          <p className="artist-name">{displaySong.artist}</p>
        </div>

        {/* Audio Visualizer */}
        <AudioVisualizer />

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-container">
            <span className="time-label">{formatTime(currentTime)}</span>
            <div className="progress-bar-wrapper">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="progress-slider"
              />
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercent}%` }}
                />
                <div 
                  className="progress-glow" 
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="time-label">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="controls">
          <button 
            className={`control-btn secondary ${isShuffle ? 'active' : ''}`} 
            onClick={toggleShuffle} 
            aria-label="Shuffle"
            title="Shuffle"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>

          <button className="control-btn" onClick={playPrevious} aria-label="Previous">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          
          <button className="play-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          <button className="control-btn" onClick={playNext} aria-label="Next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          <button 
            className={`control-btn secondary ${isRepeat ? 'active' : ''}`} 
            onClick={toggleRepeat} 
            aria-label="Repeat"
            title="Repeat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
          </button>
        </div>

        {/* Volume Control */}
        <div className="volume-section">
          <div className="volume-container">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="volume-icon">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <div className="volume-bar-wrapper">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="volume-slider"
              />
              <div className="volume-track">
                <div 
                  className="volume-fill" 
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist */}
      <div className="playlist-card">
        <h3 className="playlist-title">
          <span>Playlist</span>
          <span className="playlist-count">{playlist.length} songs</span>
        </h3>
        <ul className="playlist">
          {playlist.map((song, index) => (
            <li
              key={song.id}
              className={`playlist-item ${index === currentSongIndex ? 'active' : ''}`}
              onClick={() => selectSong(index)}
            >
              <div className="song-number">
                {index === currentSongIndex ? (
                  isPlaying ? (
                    <div className="playing-animation">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <span className="active-indicator">♪</span>
                  )
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <img src={song.cover} alt="" className="playlist-cover" />
              <div className="playlist-song-info">
                <span className="playlist-song-title">{song.title}</span>
                <span className="playlist-artist">{song.artist}</span>
              </div>
              <span className="song-duration">
                {formatTime(getSongDuration(song.id) || parseDuration(song.duration))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      </div>
      )}

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentSong.src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />
    </>
  )
}

export default App
