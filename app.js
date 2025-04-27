import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase config – replace with your values
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

// DOM refs
const sessionForm = document.getElementById('sessionForm');
const recordingSection = document.getElementById('recordingSection');
const currentSession = document.getElementById('currentSession');
const finishBtn = document.getElementById('finishBtn');
const errorForm = document.getElementById('errorForm');
const tableBody = document.querySelector('#errorTable tbody');
const canvas = document.getElementById('courtCanvas');
const ctx = canvas.getContext('2d');
let entries = [];
let sessionDate = null;
let sessionMatch = null;

// Court drawing with full boundaries and service lines
function drawCourt() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  // Outer boundary (doubles)
  ctx.strokeRect(0, 0, W, H);
  // Singles sidelines
  ctx.beginPath(); ctx.moveTo((W - W * (5.18/6.1)) / 2, 0);
  ctx.lineTo((W - W * (5.18/6.1)) / 2, H);
  ctx.moveTo(W - (W - W * (5.18/6.1)) / 2, 0);
  ctx.lineTo(W - (W - W * (5.18/6.1)) / 2, H);
  ctx.stroke();
  // Net line
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2);
  ctx.stroke();
  // Short service lines
  const s = H * 0.2, s2 = H * 0.8;
  ctx.beginPath(); ctx.moveTo(0, s); ctx.lineTo(W, s);
  ctx.moveTo(0, s2); ctx.lineTo(W, s2);
  ctx.stroke();
  // Center service line between s and s2
  ctx.beginPath(); ctx.moveTo(W/2, s); ctx.lineTo(W/2, s2);
  ctx.stroke();
  // Zone labels
  ctx.fillStyle = '#000'; ctx.font = '12px sans-serif';
  const labels = {
    'forehand-front': [W*0.75, H*0.1, 'FF'],
    'backhand-front': [W*0.25, H*0.1, 'BF'],
    'forehand-middle':[W*0.75, H*0.5, 'FM'],
    'backhand-middle':[W*0.25, H*0.5, 'BM'],
    'forehand-back': [W*0.75, H*0.9, 'FB'],
    'backhand-back': [W*0.25, H*0.9, 'BB']
  };
  for (const key in labels) {
    const [x,y,text] = labels[key];
    ctx.fillText(text, x-10, y);
  }
}

// Zone coordinate mapping for plotting
const zoneCoords = {
  'forehand-front': [canvas.width*0.75, canvas.height*0.25],
  'backhand-front': [canvas.width*0.25, canvas.height*0.25],
  'forehand-middle':[canvas.width*0.75, canvas.height*0.5],
  'backhand-middle':[canvas.width*0.25, canvas.height*0.5],
  'forehand-back': [canvas.width*0.75, canvas.height*0.75],
  'backhand-back': [canvas.width*0.25, canvas.height*0.75]
};

// Redraw with errors
function redraw() {
  drawCourt();
  entries.forEach(e => {
    const [x,y] = zoneCoords[e.zone];
    ctx.fillStyle = 'rgba(255,0,0,0.7)'; ctx.beginPath(); ctx.arc(x,y,10,0,2*Math.PI); ctx.fill();
  });
}

drawCourt();

// Load errors from Firestore
async function loadEntries() {
  const q = query(collection(db,'errors'), orderBy('timestamp'));
  const snap = await getDocs(q);
  entries = snap.docs.map(d => d.data());
  tableBody.innerHTML = '';
  entries.forEach(e => {
    const row = document.createElement('tr');
    ['date','match','set','rally','errorType','zone'].forEach(k => {
      const td = document.createElement('td'); td.textContent = e[k]; row.appendChild(td);
    });
    tableBody.appendChild(row);
  });
  redraw();
}

// Session start
sessionForm.addEventListener('submit', e => {
  e.preventDefault();
  sessionDate = document.getElementById('sessionDate').value;
  sessionMatch = document.getElementById('sessionMatch').value;
  currentSession.textContent = `${sessionDate} | ${sessionMatch}`;
  sessionForm.style.display = 'none';
  recordingSection.style.display = '';
});
// Finish match
finishBtn.addEventListener('click', () => {
  sessionDate = null; sessionMatch = null;
  sessionForm.reset();
  sessionForm.style.display = '';
  recordingSection.style.display = 'none';
});

// Record error
errorForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!sessionDate || !sessionMatch) return alert('Start a session first');
  const entry = {
    date: sessionDate,
    match: sessionMatch,
    set: document.getElementById('set').value,
    rally: document.getElementById('rally').value,
    errorType: document.getElementById('errorType').value,
    zone: document.getElementById('zone').value,
    timestamp: serverTimestamp()
  };
  await addDoc(collection(db,'errors'), entry);
  errorForm.reset();
  loadEntries();
});

// Initial load
loadEntries();
