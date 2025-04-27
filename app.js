import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = { apiKey: "AIzaSyBWmf_VuollXXwIsgDjofi9ToTkfvDJc0M", authDomain: "bmatchtracker.firebaseapp.com", projectId: "bmatchtracker", storageBucket: "bmatchtracker.appspot.com", messagingSenderId: "188991740256", appId: "1:188991740256:web:6b5b9d0c7804766266a605" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM refs & event listeners
const recordTabBtn = document.getElementById('recordTabBtn');
const dataTabBtn = document.getElementById('dataTabBtn');
recordTabBtn.addEventListener('click', () => switchTab('record'));
dataTabBtn.addEventListener('click', () => switchTab('data'));
const sessionForm = document.getElementById('sessionForm');
const recordingSection = document.getElementById('recordingSection');
const currentSession = document.getElementById('currentSession');
const finishBtn = document.getElementById('finishBtn');
const errorForm = document.getElementById('errorForm');
const tableBody = document.querySelector('#errorTable tbody');
const canvas = document.getElementById('courtCanvas');
const ctx = canvas.getContext('2d');
let entries = [], sessionDate, sessionMatch, sessionPlayer;

function switchTab(tab) {
  document.getElementById('recordTab').style.display = tab==='record'?'':'none';
  document.getElementById('dataTab').style.display = tab==='data'?'':'none';
  recordTabBtn.classList.toggle('active', tab==='record');
  dataTabBtn.classList.toggle('active', tab==='data');
  if(tab==='record') redraw();
}

// Draw court with realistic 13.4m x 6.1m proportions
function drawCourt() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='#333'; ctx.lineWidth=2;
  // Outer boundary
  ctx.strokeRect(0,0,W,H);
  // Singles sidelines
  const sidemargin = (W - (W * (5.18/6.1))) / 2;
  ctx.beginPath();
  ctx.moveTo(sidemargin,0); ctx.lineTo(sidemargin,H);
  ctx.moveTo(W - sidemargin,0); ctx.lineTo(W - sidemargin,H);
  ctx.stroke();
  // Net line
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
  // Short service lines (1.98m from net each side)
  const short = (1.98/13.4) * H;
  ctx.beginPath();
  ctx.moveTo(0, H/2 - short); ctx.lineTo(W, H/2 - short);
  ctx.moveTo(0, H/2 + short); ctx.lineTo(W, H/2 + short);
  ctx.stroke();
  // Center service line
  ctx.beginPath(); ctx.moveTo(W/2, H/2 - short); ctx.lineTo(W/2, H/2 + short); ctx.stroke();
  // Zone labels
  ctx.fillStyle='#000'; ctx.font='12px sans-serif';
  const labels = {
    'forehand-front':[W*0.75, H/2 - short/2, 'Forehand Front'],
    'backhand-front':[W*0.25, H/2 - short/2, 'Backhand Front'],
    'forehand-middle':[W*0.75, H/2, 'Forehand Middle'],
    'backhand-middle':[W*0.25, H/2, 'Backhand Middle'],
    'forehand-back':[W*0.75, H/2 + short/2, 'Forehand Rear'],
    'backhand-back':[W*0.25, H/2 + short/2, 'Backhand Rear']
  };
  for(const key in labels){
    const [x,y,text] = labels[key];
    ctx.fillText(text, x - ctx.measureText(text).width/2, y);
  }
}

// Zone plotting coordinates
const zoneCoords = {
  'forehand-front':[canvas.width*0.75, canvas.height*0.35],
  'backhand-front':[canvas.width*0.25, canvas.height*0.35],
  'forehand-middle':[canvas.width*0.75, canvas.height*0.5],
  'backhand-middle':[canvas.width*0.25, canvas.height*0.5],
  'forehand-back':[canvas.width*0.75, canvas.height*0.65],
  'backhand-back':[canvas.width*0.25, canvas.height*0.65]
};

function redraw(){ drawCourt(); entries.forEach(e=>{
  const [x,y] = zoneCoords[e.zone];
  ctx.fillStyle='rgba(255,0,0,0.7)';
  ctx.beginPath(); ctx.arc(x,y,8,0,2*Math.PI); ctx.fill();
}); }

// Load and render Firestore data
async function loadEntries(){
  const q = query(collection(db,'errors'), orderBy('timestamp'));
  const snap = await getDocs(q);
  entries = snap.docs.map(d=>d.data());
  tableBody.innerHTML = '';
  entries.forEach(e=>{
    const row = document.createElement('tr');
    ['date','match','player','set','rally','errorType','zone'].forEach(k=>{
      const td = document.createElement('td'); td.textContent = e[k]; row.appendChild(td);
    });
    tableBody.appendChild(row);
  });
  redraw();
}

// Session logic
document.getElementById('sessionForm').addEventListener('submit',e=>{
  e.preventDefault();
  sessionDate = document.getElementById('sessionDate').value;
  sessionMatch = document.getElementById('sessionMatch').value;
  sessionPlayer = document.getElementById('sessionPlayer').value;
  currentSession.textContent = `${sessionDate} | ${sessionMatch} | ${sessionPlayer}`;
  sessionForm.style.display = 'none';
  recordingSection.style.display = '';
});
finishBtn.addEventListener('click',()=>{
  sessionDate = sessionMatch = sessionPlayer = null;
  sessionForm.reset(); sessionForm.style.display=''; recordingSection.style.display='none';
});

// Record error entries
errorForm.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!sessionDate) return alert('Start a session first');
  const entry = {
    date: sessionDate, match: sessionMatch, player: sessionPlayer,
    set: document.getElementById('set').value,
    rally: document.getElementById('rally').value,
    errorType: document.getElementById('errorType').value,
    zone: document.getElementById('zone').value,
    timestamp: serverTimestamp()
  };
  await addDoc(collection(db,'errors'), entry);
  errorForm.reset(); loadEntries();
});

// Initial load
loadEntries();
