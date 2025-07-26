// IndexedDB setup
const dbName = 'videoDB';
let db;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject('Error opening DB');
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = event => {
      db = event.target.result;
      db.createObjectStore('videos', { keyPath: 'name' });
    };
  });
};

// Save video to DB
async function saveVideo(file) {
  const db = await openDB();
  const tx = db.transaction('videos', 'readwrite');
  const store = tx.objectStore('videos');
  await store.put({ name: file.name, blob: file });
  await tx.complete;
}

// Load videos from DB
async function loadVideos() {
  const db = await openDB();
  const tx = db.transaction('videos', 'readonly');
  const store = tx.objectStore('videos');
  const request = store.getAll();

  request.onsuccess = () => {
    request.result.forEach(videoObj => {
      displayVideo(videoObj.blob);
    });
  };
}

// Display video in DOM
function displayVideo(blob) {
  const video = document.createElement('video');
  video.controls = true;
  video.src = URL.createObjectURL(blob);
  document.getElementById('videoList').appendChild(video);
}

// Handle file input
document.getElementById('videoInput').addEventListener('change', async (e) => {
  const files = e.target.files;
  for (let file of files) {
    await saveVideo(file);
    displayVideo(file);
  }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => {
      console.log('Service Worker registered.');
    });
  });
}

// Load videos on startup
window.addEventListener('DOMContentLoaded', loadVideos);
