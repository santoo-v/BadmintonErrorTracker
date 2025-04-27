# app.js
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

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBWmf_VuollXXwIsgDjofi9ToTkfvDJc0M",
  authDomain: "bmatchtracker.firebaseapp.com",
  projectId: "bmatchtracker",
  storageBucket: "bmatchtracker.appspot.com",
  messagingSenderId: "188991740256",
  appId: "1:188991740256:web:6b5b9d0c7804766266a605",
  measurementId: "G-Y1RLX4BRT7"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM references
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

// Draw court lines
function drawCourt() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#e5e5e5'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.strokeRect(0,0,canvas.width,canvas.height);
  ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();
}
drawCourt();

// Zone mapping
const zoneCoords = {
  'front-left': [canvas.width*0.25,canvas.height*0.25],
  'front-right':[canvas.width*0.75,canvas.height*0.25],
  'mid-left':   [canvas.width*0.25,canvas.height*0.5],
  'mid-right':  [canvas.width*0.75,canvas.height*0.5],
  'back-left':  [canvas.width*0.25,canvas.height*0.75],
  'back-right': [canvas.width*0.75,canvas.height*0.75]
};

// Plot errors
function redraw() {
  drawCourt();
  entries.forEach(e => {
    const [x,y] = zoneCoords[e.zone];
    ctx.fillStyle = 'rgba(255,0,0,0.7)'; ctx.beginPath(); ctx.arc(x,y,10,0,2*Math.PI); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif';
    ctx.fillText(e.errorType.charAt(0), x-4, y+4);
  });
}

// Load existing errors
async function loadEntries() {
  const q = query(collection(db,'errors'), orderBy('timestamp'));
  const snap = await getDocs(q);
  entries = snap.docs.map(d=>d.data());
  tableBody.innerHTML = '';
  entries.forEach(e=>{
    const row=document.createElement('tr');
    ['date','match','set','rally','errorType','zone'].forEach(k=>{
      const td=document.createElement('td'); td.textContent=e[k]; row.appendChild(td);
    });
    tableBody.appendChild(row);
  });
  redraw();
}

// Start session handler
sessionForm.addEventListener('submit', e => {
  e.preventDefault();
  sessionDate = document.getElementById('sessionDate').value;
  sessionMatch = document.getElementById('sessionMatch').value;
  currentSession.textContent = `${sessionDate} | ${sessionMatch}`;
  sessionForm.style.display = 'none';
  recordingSection.style.display = '';
});

// Finish session handler
finishBtn.addEventListener('click', ()=>{
  sessionDate = null; sessionMatch = null;
  sessionForm.reset();
  sessionForm.style.display = '';
  recordingSection.style.display = 'none';
});

// Error form handler
errorForm.addEventListener('submit', async e=>{
  e.preventDefault();
  if(!sessionDate||!sessionMatch) return alert('Start a session first');
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

// Initial load of previous data
loadEntries();
