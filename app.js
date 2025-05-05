// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBWmf_VuollXXwIsgDjofi9ToTkfvDJc0M",
  authDomain: "bmatchtracker.firebaseapp.com",
  projectId: "bmatchtracker",
  storageBucket: "bmatchtracker.appspot.com",
  messagingSenderId: "188991740256",
  appId: "1:188991740256:web:6b5b9d0c7804766266a605"
};

import {auth, provider} from './auth.js';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const playerSelect = document.getElementById('playerSelect');
const createProfileBtn = document.getElementById('createProfileBtn');
const modal = document.getElementById('playerModal');
const closeModal = document.getElementById('closeModal');
const profileForm = document.getElementById('profileForm');
const profileName = document.getElementById('profileName');
const profileAge = document.getElementById('profileAge');
const profileCity = document.getElementById('profileCity');


const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const mainApp = document.getElementById("mainApp");


loginBtn.onclick = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Signed in:", result.user.displayName);
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
};

logoutBtn.onclick = () => {
  signOut(auth);
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.currentUser = user;
    userInfo.textContent = `👤 ${user.displayName}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    mainApp.style.display = "block";
    document.getElementById('createProfileBtn').style.display = 'inline-block';
    loadPlayerProfiles(); //
  } else {
    userInfo.textContent = "Not logged in";
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    mainApp.style.display = "none";
    window.currentUser = null;
    document.getElementById('createProfileBtn').style.display = 'none';
  }
});

const recordTabBtn = document.getElementById('recordTabBtn');
const dataTabBtn = document.getElementById('dataTabBtn');
const insightsTabBtn = document.getElementById('insightsTabBtn');
const playerManager = document.getElementById('playerManager');

const sessionForm  = document.getElementById('sessionForm');
const recSection   = document.getElementById('recordingSection');
const currSess     = document.getElementById('currentSession');
const finishBtn    = document.getElementById('finishBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const errorForm    = document.getElementById('errorForm');
const tableBody    = document.querySelector('#errorTable tbody');
const canvas       = document.getElementById('courtCanvas');
const ctx          = canvas.getContext('2d');
const selZoneSpan  = document.getElementById('selectedZone');
const addErrorBtn  = document.getElementById('addErrorBtn');

const courtImg = new Image();
courtImg.src = 'BadmintonCourt.png';

let entries = [];
let sessionDate, sessionMatch, sessionPlayer, sessionSet, selZone = null;
const ROWS = 8, COLS = 5;

function switchTab(tab) {
  document.getElementById('recordTab').style.display = tab === 'record' ? '' : 'none';
  document.getElementById('dataTab').style.display = tab === 'data' ? '' : 'none';
  const insightsEl = document.getElementById('insightsTab');
  if (insightsEl) insightsEl.style.display = tab === 'insights' ? '' : 'none';

  recordTabBtn.classList.toggle('active', tab === 'record');
  dataTabBtn.classList.toggle('active', tab === 'data');
  insightsTabBtn.classList.toggle('active', tab === 'insights');
  if (tab === 'record') {
    sessionForm.style.display = 'none'; // hide form during recording
    drawGrid();
  } else {
    sessionForm.style.display = 'flex'; // restore form in other tabs
  }
  }

recordTabBtn.onclick = () => switchTab('record');
dataTabBtn.onclick = () => switchTab('data');
insightsTabBtn.onclick = () => switchTab('insights');

function populatePlayers(players) {
  playerSelect.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.textContent = 'Show All';
  allOpt.value = '';
  playerSelect.appendChild(allOpt);
  players.forEach(name => {
    const opt = document.createElement('option');
    opt.textContent = name;
    opt.value = name;
    playerSelect.appendChild(opt);
  });
  sessionPlayer = '';
}

async function loadPlayerProfiles() {
  if (!window.currentUser) return;
  const docRef = doc(db, 'users', window.currentUser.uid);
  const docSnap = await getDocs(collection(docRef, 'players'));
  const names = docSnap.docs.map(d => d.id);
  populatePlayers(names);
  console.log("Loading player profiles for:", window.currentUser?.uid);
  console.log("Players found:", names);
}

playerSelect.onchange = () => {
  sessionPlayer = playerSelect.value;
};

createProfileBtn.onclick = async () => {
  if (!window.currentUser) return;
  modal.style.display = 'block';

  // Load existing player profiles into modal list
  const list = document.getElementById('existingPlayers');
  list.innerHTML = '';
  const docRef = doc(db, 'users', window.currentUser.uid);
  const docSnap = await getDocs(collection(docRef, 'players'));

  docSnap.docs.forEach(d => {
    const li = document.createElement('li');
    const data = d.data();
    li.innerHTML = `
      ${d.id}${data.city ? ' - ' + data.city : ''}${data.age ? ' (' + data.age + ')' : ''}
      <button class="delete-profile" data-name="${d.id}" title="Delete">×</button>
    `;
    list.appendChild(li);
  });

  // Add delete handler for each button
  list.querySelectorAll('.delete-profile').forEach(btn => {
    btn.onclick = async () => {
      const name = btn.dataset.name;
      if (!confirm(`Delete profile for ${name}?`)) return;
      const ref = doc(db, 'users', window.currentUser.uid, 'players', name);
      await deleteDoc(ref);
      await loadPlayerProfiles(); // refresh dropdown
      createProfileBtn.click();   // refresh modal
    };
  });
};

closeModal.onclick = () => {
  modal.style.display = 'none';
};

profileForm.onsubmit = async e => {
  e.preventDefault();
  if (!window.currentUser) return;
  const name = profileName.value.trim();
  const age = profileAge.value.trim();
  const city = profileCity.value.trim();
  if (!name) return alert('Player name is required');
  const docRef = doc(db, 'users', window.currentUser.uid, 'players', name);
  await setDoc(docRef, { age, city, created: serverTimestamp() });
  modal.style.display = 'none';
  profileForm.reset();
  loadPlayerProfiles();
};

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const cellW = canvas.width / COLS, cellH = canvas.height / ROWS;
  const col = Math.floor(x / cellW), row = Math.floor(y / cellH);
  selZone = row * COLS + col;
  selZoneSpan.textContent = `R${row+1}C${col+1}`;
  addErrorBtn.disabled = false;
  drawGrid();
});

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(courtImg, 0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const cellW = W / COLS, cellH = H / ROWS;
  ctx.strokeStyle = '#ff000080';
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, H); ctx.stroke();
  }
  for (let j = 0; j <= ROWS; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * cellH); ctx.lineTo(W, j * cellH); ctx.stroke();
  }
  if (selZone !== null) {
    const col = selZone % COLS, row = Math.floor(selZone / COLS);
    ctx.fillStyle = 'rgba(255,0,0,0.25)';
    ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
  }
}

courtImg.onload = () => drawGrid();

async function loadEntries() {
  if (!window.currentUser) return;
  const q = query(collection(db, 'errors'), orderBy('timestamp'));
  const snap = await getDocs(q);
  entries = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(e => e.uid === window.currentUser.uid && (!sessionPlayer || e.player === sessionPlayer));
  tableBody.innerHTML = '';
  entries.forEach(e => {
    const tr = document.createElement('tr');
    ['date','match','player','set','errorType','zone'].forEach(k => {
      const td = document.createElement('td'); td.textContent = e[k]; tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

deleteAllBtn.onclick = async () => {
  if (!confirm('Are you sure you want to delete ALL records?')) return;
  const q = query(collection(db, 'errors'));
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.uid === window.currentUser?.uid) {
      await deleteDoc(doc(db, 'errors', docSnap.id));
    }
  }
  loadEntries();
  alert('All your records have been deleted.');
};

sessionForm.onsubmit = e => {
  e.preventDefault();
  sessionDate   = document.getElementById('sessionDate').value;
  sessionMatch  = document.getElementById('sessionMatch').value;
  sessionSet    = document.getElementById('sessionSet').value;
  currSess.textContent = `${sessionDate} | ${sessionMatch} | ${sessionPlayer} | Set ${sessionSet}`;
  playerManager.style.display = 'none';
  sessionForm.style.display = 'none';
  recSection.style.display = 'flex';
  drawGrid();
};

finishBtn.onclick = () => {
  sessionDate = sessionMatch = sessionPlayer = sessionSet = selZone = null;
  sessionForm.reset();
  sessionForm.style.display = 'flex';
  recSection.style.display = 'none';
  selZoneSpan.textContent = 'None';
  addErrorBtn.disabled = true;
  playerManager.style.display = 'block'
  loadEntries();
};

errorForm.onsubmit = async e => {
  e.preventDefault();
  if (!sessionDate || selZone === null || !window.currentUser) return alert('You must be logged in and select a court cell.');
  const entry = {
    uid: window.currentUser.uid,
    date: sessionDate,
    match: sessionMatch,
    player: sessionPlayer,
    set: sessionSet,
    errorType: document.getElementById('errorType').value,
    zone: `R${Math.floor(selZone/COLS)+1}C${selZone%COLS+1}`,
    timestamp: serverTimestamp()
  };
  await addDoc(collection(db, 'errors'), entry);
  errorForm.reset();
  selZone = null;
  selZoneSpan.textContent = 'None';
  addErrorBtn.disabled = true;
  drawGrid();
  loadEntries();
};

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sessionDate').value = today;
  loadPlayerProfiles();
  loadEntries();
  switchTab('record');
});




