// MusicSpace Track Data - Sample tracks organized by category
// These are placeholder tracks using royalty-free audio from various sources
// In production, replace src URLs with actual audio file paths

export const musicCategories = {
  music: {
    id: 'music',
    title: 'Music',
    color: 'purple',
    subcategories: {
      piano: {
        id: 'piano',
        title: 'Piano',
        description: 'Calming piano melodies for relaxation',
        tracks: [
          {
            id: 'music-piano-1',
            title: 'Piano',
            artist: 'StillSpace',
            category: 'Music',
            subcategory: 'Piano',
            src: '/audio/musicspace/music/piano.mp3'
          }
        ]
      },
      guitar: {
        id: 'guitar',
        title: 'Acoustic Guitar',
        description: 'Gentle acoustic guitar for peaceful moments',
        tracks: [
          {
            id: 'music-guitar-1',
            title: 'Acoustic Guitar',
            artist: 'StillSpace',
            category: 'Music',
            subcategory: 'Acoustic Guitar',
            src: '/audio/musicspace/music/acoustic-guitar.mp3'
          }
        ]
      },
      lofi: {
        id: 'lofi',
        title: 'Lo-Fi Beats',
        description: 'Chill beats for studying and relaxation',
        tracks: [
          {
            id: 'music-lofi-1',
            title: 'Lo-Fi Beats',
            artist: 'StillSpace',
            category: 'Music',
            subcategory: 'Lo-Fi Beats',
            src: '/audio/musicspace/music/lofi.mp3'
          }
        ]
      },
    }
  },
  ambience: {
    id: 'ambience',
    title: 'Ambience',
    color: 'green',
    subcategories: {
      rain: {
        id: 'rain',
        title: 'Rain Sounds',
        description: 'Soothing rain for sleep and focus',
        tracks: [
          {
            id: 'ambience-rain-1',
            title: 'Rain',
            artist: 'StillSpace',
            category: 'Ambience',
            subcategory: 'Rain Sounds',
            src: '/audio/musicspace/ambience/rain.mp3'
          }
        ]
      },
      nature: {
        id: 'nature',
        title: 'Nature Sounds',
        description: 'Forest, wind, and natural environments',
        tracks: [
          {
            id: 'ambience-nature-1',
            title: 'Nature',
            artist: 'StillSpace',
            category: 'Ambience',
            subcategory: 'Nature Sounds',
            src: '/audio/musicspace/ambience/nature.mp3'
          }
        ]
      },
      city: {
        id: 'city',
        title: 'City Sounds',
        description: 'City ambience for focus and comfort',
        tracks: [
          {
            id: 'ambience-city-1',
            title: 'City',
            artist: 'StillSpace',
            category: 'Ambience',
            subcategory: 'City Sounds',
            src: '/audio/musicspace/ambience/city.mp3'
          }
        ]
      }
    }
  }
};

// Helper functions
export function getAllTracks() {
  const tracks = [];
  Object.values(musicCategories).forEach(mainCat => {
    Object.values(mainCat.subcategories).forEach(subCat => {
      tracks.push(...subCat.tracks);
    });
  });
  return tracks;
}

export function getTracksByCategory(mainCategory, subcategory = null) {
  const mainCat = musicCategories[mainCategory];
  if (!mainCat) return [];
  
  if (subcategory) {
    return mainCat.subcategories[subcategory]?.tracks || [];
  }
  
  const tracks = [];
  Object.values(mainCat.subcategories).forEach(subCat => {
    tracks.push(...subCat.tracks);
  });
  return tracks;
}

export function getSubcategories(mainCategory) {
  const mainCat = musicCategories[mainCategory];
  if (!mainCat) return [];
  return Object.values(mainCat.subcategories);
}

export function formatDuration(seconds) {
  if (seconds == null) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default musicCategories;
