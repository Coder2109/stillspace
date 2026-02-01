// MusicSpace Audio Engine - Core playback logic with cross-page persistence

class AudioEngine {
  constructor() {
    if (AudioEngine.instance) {
      return AudioEngine.instance;
    }
    AudioEngine.instance = this;
    
    this.audio = null;
    this.state = this.loadState();
    this.listeners = new Set();
    this.fadeInterval = null;
    this.sleepTimerTimeout = null;
    this.shuffledPlaylist = [];
    this.shuffleIndex = 0;
    
    this.init();
  }
  
  init() {
    // Create audio element if it doesn't exist
    if (typeof window !== 'undefined') {
      this.audio = document.getElementById('global-audio') || this.createAudioElement();
      this.setupEventListeners();
      this.restorePlaybackState();
    }
  }
  
  createAudioElement() {
    const audio = document.createElement('audio');
    audio.id = 'global-audio';
    audio.preload = 'auto';
    document.body.appendChild(audio);
    return audio;
  }
  
  setupEventListeners() {
    if (!this.audio) return;
    
    this.audio.addEventListener('timeupdate', () => {
      this.state.currentTime = this.audio.currentTime;
      this.state.duration = this.audio.duration || 0;
      this.notifyListeners();
    });
    
    this.audio.addEventListener('ended', () => {
      this.handleTrackEnd();
    });
    
    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.saveState();
      this.notifyListeners();
    });
    
    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.saveState();
      this.notifyListeners();
    });
    
    this.audio.addEventListener('loadedmetadata', () => {
      this.state.duration = this.audio.duration;
      this.notifyListeners();
    });
    
    // Handle page visibility for mobile
    document.addEventListener('visibilitychange', () => {
      this.saveState();
    });
    
    // Save state before page unload
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });
  }
  
  // State Management
  loadState() {
    const defaultState = {
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.7,
      playlist: [],
      currentIndex: 0,
      queue: [],
      shuffle: false,
      repeat: 'none',
      favorites: [],
      recentlyPlayed: [],
      sleepTimer: null,
      currentCategory: null,
      currentSubcategory: null
    };
    
    if (typeof localStorage === 'undefined') return defaultState;
    
    try {
      const saved = localStorage.getItem('musicspace-state');
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch (e) {
      return defaultState;
    }
  }
  
  saveState() {
    if (typeof localStorage === 'undefined') return;
    
    const stateToSave = {
      currentTrack: this.state.currentTrack,
      currentTime: this.state.currentTime,
      volume: this.state.volume,
      playlist: this.state.playlist,
      currentIndex: this.state.currentIndex,
      shuffle: this.state.shuffle,
      repeat: this.state.repeat,
      favorites: this.state.favorites,
      recentlyPlayed: this.state.recentlyPlayed.slice(0, 20),
      currentCategory: this.state.currentCategory,
      currentSubcategory: this.state.currentSubcategory
    };
    
    localStorage.setItem('musicspace-state', JSON.stringify(stateToSave));
  }
  
  restorePlaybackState() {
    if (this.state.currentTrack && this.audio) {
      this.audio.src = this.state.currentTrack.src;
      this.audio.currentTime = this.state.currentTime || 0;
      this.audio.volume = this.state.volume;
    }
  }
  
  // Playback Controls
  play(track = null) {
    if (!this.audio) return;
    
    if (track) {
      this.state.currentTrack = track;
      this.audio.src = track.src;
      this.addToRecentlyPlayed(track);
    }
    
    this.audio.volume = this.state.volume;
    // Don't set isPlaying here - let the 'play' event handle it
    this.audio.play().catch(e => console.warn('Playback failed:', e));
    this.saveState();
    this.dispatchGlobalEvent('musicspace-play', { track: this.state.currentTrack });
  }
  
  pause() {
    if (!this.audio) return;
    this.audio.pause();
    // Don't set isPlaying here - let the 'pause' event handle it
    this.saveState();
    this.dispatchGlobalEvent('musicspace-pause');
  }
  
  toggle() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.saveState();
    this.notifyListeners();
    this.dispatchGlobalEvent('musicspace-stop');
  }
  
  seek(time) {
    if (!this.audio) return;
    this.audio.currentTime = Math.max(0, Math.min(time, this.state.duration));
    this.state.currentTime = this.audio.currentTime;
    this.saveState();
    this.notifyListeners();
  }
  
  setVolume(volume) {
    if (!this.audio) return;
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.state.volume;
    this.saveState();
    this.notifyListeners();
  }
  
  // Playlist Controls
  playPlaylist(tracks, startIndex = 0) {
    this.state.playlist = tracks;
    this.state.currentIndex = startIndex;
    
    if (this.state.shuffle) {
      this.generateShuffledPlaylist();
    }
    
    if (tracks.length > 0) {
      this.play(tracks[startIndex]);
    }
  }
  
  next() {
    if (this.state.playlist.length === 0) return;
    
    let nextIndex;
    if (this.state.shuffle) {
      // Use shuffled playlist
      this.shuffleIndex = (this.shuffleIndex + 1) % this.shuffledPlaylist.length;
      const nextTrack = this.shuffledPlaylist[this.shuffleIndex];
      
      // Find this track in the original playlist
      nextIndex = this.state.playlist.findIndex(track => track.id === nextTrack.id);
      
      // Reshuffle if we've been through the entire shuffled playlist
      if (this.shuffleIndex === 0) {
        this.generateShuffledPlaylist();
      }
    } else {
      nextIndex = (this.state.currentIndex + 1) % this.state.playlist.length;
    }
    
    this.state.currentIndex = nextIndex;
    this.play(this.state.playlist[nextIndex]);
  }
  
  previous() {
    if (this.state.playlist.length === 0) return;
    
    // If more than 3 seconds into track, restart it
    if (this.state.currentTime > 3) {
      this.seek(0);
      return;
    }
    
    let prevIndex;
    if (this.state.shuffle) {
      // Use shuffled playlist
      this.shuffleIndex = (this.shuffleIndex - 1 + this.shuffledPlaylist.length) % this.shuffledPlaylist.length;
      const prevTrack = this.shuffledPlaylist[this.shuffleIndex];
      
      // Find this track in the original playlist
      prevIndex = this.state.playlist.findIndex(track => track.id === prevTrack.id);
    } else {
      prevIndex = (this.state.currentIndex - 1 + this.state.playlist.length) % this.state.playlist.length;
    }
    
    this.state.currentIndex = prevIndex;
    this.play(this.state.playlist[prevIndex]);
  }
  
  handleTrackEnd() {
    if (this.state.repeat === 'one') {
      this.seek(0);
      this.play();
    } else if (this.state.playlist.length > 0) {
      if (this.state.repeat === 'all' || this.state.currentIndex < this.state.playlist.length - 1) {
        this.next();
      } else {
        this.state.isPlaying = false;
        this.notifyListeners();
      }
    }
  }
  
  toggleShuffle() {
    this.state.shuffle = !this.state.shuffle;
    
    if (this.state.shuffle) {
      this.generateShuffledPlaylist();
    } else {
      this.shuffledPlaylist = [];
      this.shuffleIndex = 0;
    }
    
    this.saveState();
    this.notifyListeners();
  }
  
  generateShuffledPlaylist() {
    if (this.state.playlist.length === 0) return;
    
    // Create a copy of the current playlist
    const playlistCopy = [...this.state.playlist];
    
    // Fisher-Yates shuffle algorithm
    for (let i = playlistCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playlistCopy[i], playlistCopy[j]] = [playlistCopy[j], playlistCopy[i]];
    }
    
    // Ensure current track isn't first in shuffled order
    const currentTrack = this.state.playlist[this.state.currentIndex];
    if (playlistCopy[0].id === currentTrack.id && playlistCopy.length > 1) {
      // Swap with another position
      const swapIndex = Math.floor(Math.random() * (playlistCopy.length - 1)) + 1;
      [playlistCopy[0], playlistCopy[swapIndex]] = [playlistCopy[swapIndex], playlistCopy[0]];
    }
    
    this.shuffledPlaylist = playlistCopy;
    this.shuffleIndex = 0;
    
    // Find current track in shuffled playlist
    const currentIndexInShuffled = this.shuffledPlaylist.findIndex(track => track.id === currentTrack.id);
    if (currentIndexInShuffled !== -1) {
      this.shuffleIndex = currentIndexInShuffled;
    }
  }
  
  toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(this.state.repeat);
    this.state.repeat = modes[(currentIndex + 1) % modes.length];
    this.saveState();
    this.notifyListeners();
  }
  
  // Favorites
  toggleFavorite(track) {
    const index = this.state.favorites.findIndex(f => f.id === track.id);
    if (index === -1) {
      this.state.favorites.push(track);
    } else {
      this.state.favorites.splice(index, 1);
    }
    this.saveState();
    this.notifyListeners();
  }
  
  isFavorite(trackId) {
    return this.state.favorites.some(f => f.id === trackId);
  }
  
  addToRecentlyPlayed(track) {
    this.state.recentlyPlayed = this.state.recentlyPlayed.filter(t => t.id !== track.id);
    this.state.recentlyPlayed.unshift(track);
    this.state.recentlyPlayed = this.state.recentlyPlayed.slice(0, 20);
    this.saveState();
  }
  
  // Sleep Timer
  setSleepTimer(minutes) {
    this.clearSleepTimer();
    
    if (minutes <= 0) return;
    
    this.state.sleepTimer = Date.now() + minutes * 60 * 1000;
    this.saveState();
    
    // Start fade-out 30 seconds before end
    const fadeTime = Math.max(0, (minutes * 60 - 30) * 1000);
    
    this.sleepTimerTimeout = setTimeout(() => {
      this.fadeOut(30000);
    }, fadeTime);
    
    this.notifyListeners();
  }
  
  clearSleepTimer() {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    this.state.sleepTimer = null;
    this.saveState();
    this.notifyListeners();
  }
  
  fadeOut(duration) {
    const startVolume = this.state.volume;
    const steps = 30;
    const stepTime = duration / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;
    
    this.fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = startVolume - (volumeStep * currentStep);
      this.setVolume(Math.max(0, newVolume));
      
      if (currentStep >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.pause();
        this.setVolume(startVolume); // Restore volume for next play
        this.clearSleepTimer();
      }
    }, stepTime);
  }
  
  // Category Management
  setCategory(category, subcategory = null) {
    this.state.currentCategory = category;
    this.state.currentSubcategory = subcategory;
    this.saveState();
    this.notifyListeners();
  }
  
  // Event System
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.state));
  }
  
  dispatchGlobalEvent(eventName, detail = {}) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }
  
  // Getters
  getState() {
    return { ...this.state };
  }
  
  getCurrentTrack() {
    return this.state.currentTrack;
  }
  
  isPlaying() {
    return this.state.isPlaying;
  }
  
  getProgress() {
    if (!this.state.duration) return 0;
    return (this.state.currentTime / this.state.duration) * 100;
  }
  
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Singleton instance
export function getAudioEngine() {
  if (typeof window === 'undefined') return null;
  const key = '__musicspaceAudioEngine';
  if (!window[key]) {
    window[key] = new AudioEngine();
  }
  return window[key];
}

export default AudioEngine;
