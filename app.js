import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBWmf_VuollXXwIsgDjofi9ToTkfvDJc0M",
  authDomain: "bmatchtracker.firebaseapp.com",
  projectId: "bmatchtracker",
  storageBucket: "bmatchtracker.appspot.com",
  messagingSenderId: "188991740256",
  appId: "1:188991740256:web:6b5b9d0c7804766266a605"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const recordTabBtn = document.getElementById('recordTabBtn');
const dataTabBtn   = document.getElementById('dataTabBtn');
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
  document.getElementById('dataTab').style.display   = tab === 'data'   ? '' : 'none';
  recordTabBtn.classList.toggle('active', tab === 'record');
  dataTabBtn.classList.toggle('active',    tab === 'data');
  if (tab === 'record') drawGrid();
}
recordTabBtn.onclick = () => switchTab('record');
dataTabBtn.onclick   = () => switchTab('data');

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

async function loadEntries() {
  if (!window.currentUser) return;
  const q = query(collection(db, 'errors'), orderBy('timestamp'));
  const snap = await getDocs(q);
  entries = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(e => e.uid === window.currentUser.uid);
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
  sessionPlayer = document.getElementById('sessionPlayer').value;
  sessionSet    = document.getElementById('sessionSet').value;
  currSess.textContent = `${sessionDate} | ${sessionMatch} | ${sessionPlayer} | Set ${sessionSet}`;
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
  loadEntries();
};

errorForm.onsubmit = async e => {
  e.preventDefault();
  if (!sessionDate || selZone === null) return alert('Select a court cell');
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

document addEventListener('DOMContentLoaded', () => {
  const today = new.Date().toISOString.split('T')[0];
  document.getElementById('sessionDate').value = today;
})

loadEntries();