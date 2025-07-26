let db;
let currentFolder = null;
let folders = [];

const folderListEl = document.getElementById('folderList');
const folderView = document.getElementById('folderView');
const videoView = document.getElementById('videoView');
const backBtn = document.getElementById('backBtn');
const folderTitle = document.getElementById('folderTitle');
const videoInput = document.getElementById('videoInput');
const videoList = document.getElementById('videoList');
const newFolderInput = document.getElementById('newFolderName');
const createBtn = document.getElementById('createBtn');

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('videoDB', 2);

    request.onupgradeneeded = event => {
      db = event.target.result;

      // Store folder names
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'name' });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => reject('Error opening DB');
  });
};

async function saveFolder(name) {
  const tx = db.transaction('folders', 'readwrite');
  const store = tx.objectStore('folders');
  await store.put({ name });
  await tx.done;
}

async function loadFolders() {
  const tx = db.transaction('folders', 'readonly');
  const store = tx.objectStore('folders');
  const request = store.getAll();

  return new Promise((resolve) => {
    request.onsuccess = () => {
      folders = request.result.map(f => f.name);
      renderFolders();
      resolve();
    };
  });
}

function renderFolders() {
  folderListEl.innerHTML = '';
  folders.forEach(folder => {
    const div = document.createElement('div');
    div.className = 'folder';
    div.innerHTML = `<div class="folder-icon">📁</div><div>${folder}</div>`;
    div.onclick = () => openFolder(folder);
    folderListEl.appendChild(div);
  });
}

async function createFolder(name) {
  name = name.trim();
  if (!name || folders.includes(name)) return;

  folders.push(name);
  await saveFolder(name);

  // Trick: To add a new object store to IndexedDB, we need to reopen it with a new version
  const newVersion = db.version + 1;
  db.close();

  const req = indexedDB.open('videoDB', newVersion);
  req.onupgradeneeded = e => {
    const upgradeDb = e.target.result;
    if (!upgradeDb.objectStoreNames.contains(name)) {
      upgradeDb.createObjectStore(name, { keyPath: 'name' });
    }
  };
  req.onsuccess = async () => {
    db = req.result;
    renderFolders();
  };
}

async function openFolder(folder) {
  currentFolder = folder;
  folderTitle.textContent = folder;
  folderView.style.display = 'none';
  videoView.style.display = 'block';
  videoList.innerHTML = '';
  await loadVideos(folder);
}

function goBack() {
  folderView.style.display = 'block';
  videoView.style.display = 'none';
  currentFolder = null;
}

async function saveVideo(file) {
  const tx = db.transaction(currentFolder, 'readwrite');
  const store = tx.objectStore(currentFolder);
  await store.put({ name: file.name, blob: file });
}

async function loadVideos(folder) {
  const tx = db.transaction(folder, 'readonly');
  const store = tx.objectStore(folder);
  const request = store.getAll();

  request.onsuccess = () => {
    request.result.forEach(videoObj => {
      displayVideo(videoObj.blob, videoObj.name);
    });
  };
}

function displayVideo(blob, name) {
  const container = document.createElement('div');
  container.className = 'video-container';

  const video = document.createElement('video');
  video.controls = true;
  video.src = URL.createObjectURL(blob);

  const title = document.createElement('div');
  title.textContent = name;

  container.appendChild(video);
  container.appendChild(title);
  videoList.appendChild(container);
}

videoInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  for (let file of files) {
    await saveVideo(file);
    displayVideo(file, file.name);
  }
});

backBtn.addEventListener('click', goBack);
createBtn.addEventListener('click', () => {
  const name = newFolderInput.value;
  createFolder(name);
  newFolderInput.value = '';
});

// Initialize app
(async () => {
  await openDB();
  await loadFolders();
})();

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => {
      console.log('Service Worker registered');
    });
  });
}
