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
const recordTabBtn = document.getElementById('recordTabBtn');
const dataTabBtn   = document.getElementById('dataTabBtn');
const sessionForm  = document.getElementById('sessionForm');
const recSection   = document.getElementById('recordingSection');
const currSess     = document.getElementById('currentSession');
const finishBtn    = document.getElementById('finishBtn');
const errorForm    = document.getElementById('errorForm');
const tableBody    = document.querySelector('#errorTable tbody');
const canvas       = document.getElementById('courtCanvas');
const ctx          = canvas.getContext('2d');
const selZoneSpan  = document.getElementById('selectedZone');

let entries = [];
let sessionDate, sessionMatch, sessionPlayer, selZone = null;
const ROWS = 3, COLS = 6;

// Tab switching
function switchTab(tab) {
  document.getElementById('recordTab').style.display = tab==='record' ? '' : 'none';
  document.getElementById('dataTab').style.display   = tab==='data'   ? '' : 'none';
  recordTabBtn.classList.toggle('active', tab==='record');
  dataTabBtn.classList.toggle('active',    tab==='data');
  if(tab==='record') drawGrid();
}
recordTabBtn.addEventListener('click', () => switchTab('record'));
dataTabBtn.addEventListener('click', () => switchTab('data'));

// Draw realistic court lines
function drawCourt() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  // Outer boundary (doubles)
  ctx.strokeRect(0, 0, W, H);
  // Singles sidelines
  const singleOffset = (W - (5.18/6.1)*W) / 2;
  ctx.beginPath();
  ctx.moveTo(singleOffset, 0); ctx.lineTo(singleOffset, H);
  ctx.moveTo(W - singleOffset, 0); ctx.lineTo(W - singleOffset, H);
  ctx.stroke();
  // Net
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
  // Short service lines (1.98m from net)
  const short = (1.98/13.4)*H;
  ctx.beginPath();
  ctx.moveTo(0, H/2 - short); ctx.lineTo(W, H/2 - short);
  ctx.moveTo(0, H/2 + short); ctx.lineTo(W, H/2 + short);
  ctx.stroke();
  // Long service lines (doubles at back, singles at front?)
  const longBack = H;
  const longFront = 0;
  // Just boundaries suffice here
}

// Draw grid overlay
function drawGrid() {
  drawCourt();
  const W = canvas.width, H = canvas.height;
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  const cellW = W / COLS, cellH = H / ROWS;
  for(let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i*cellW, 0); ctx.lineTo(i*cellW, H); ctx.stroke();
  }
  for(let j = 0; j <= ROWS; j++) {
    ctx.beginPath(); ctx.moveTo(0, j*cellH); ctx.lineTo(W, j*cellH); ctx.stroke();
  }
  if(selZone != null) {
    const col = selZone % COLS, row = Math.floor(selZone / COLS);
    ctx.fillStyle = 'rgba(255,0,0,0.3)';
    ctx.fillRect(col*cellW, row*cellH, cellW, cellH);
  }
}

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const cellW = canvas.width / COLS, cellH = canvas.height / ROWS;
  const col = Math.floor(x / cellW), row = Math.floor(y / cellH);
  selZone = row * COLS + col;
  selZoneSpan.textContent = `R${row+1}C${col+1}`;
  drawGrid();
});

// Load entries from Firestore
a```js
async function loadEntries() {
  const q = query(collection(db,'errors'), orderBy('timestamp'));
  const snap = await getDocs(q);
  entries = snap.docs.map(d => d.data());
  tableBody.innerHTML = '';
  entries.forEach(e => {
    const tr = document.createElement('tr');
    ['date','match','player','set','rally','errorType','zone'].forEach(k => {
      const td = document.createElement('td'); td.textContent = e[k]; tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

// Session start
sessionForm.onsubmit = e => {
  e.preventDefault();
  sessionDate = document.getElementById('sessionDate').value;
  sessionMatch = document.getElementById('sessionMatch').value;
  sessionPlayer = document.getElementById('sessionPlayer').value;
  currSess.textContent = `${sessionDate} | ${sessionMatch} | ${sessionPlayer}`;
  sessionForm.style.display = 'none';
  recSection.style.display = 'flex';
  drawGrid();
};

finishBtn.onclick = () => {
  sessionDate = sessionMatch = sessionPlayer = selZone = null;
  sessionForm.reset(); sessionForm.style.display = 'flex'; recSection.style.display = 'none'; selZoneSpan.textContent = 'None';
  loadEntries();
};

// Add error entry
errorForm.onsubmit = async e => {
  e.preventDefault();
  if(!sessionDate || selZone === null) return alert('Select a court cell');
  const entry = {
    date: sessionDate,
    match: sessionMatch,
    player: sessionPlayer,
    set: document.getElementById('set').value,
    rally: document.getElementById('rally').value,
    errorType: document.getElementById('errorType').value,
    zone: `R${Math.floor(selZone/COLS)+1}C${selZone%COLS+1}`,
    timestamp: serverTimestamp()
  };
  await addDoc(collection(db,'errors'), entry);
  errorForm.reset(); selZone = null; selZoneSpan.textContent = 'None';
  drawGrid(); loadEntries();
};

// Initial load
loadEntries();
