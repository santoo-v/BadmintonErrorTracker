# app.js
// Firebase initialization
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const form = document.getElementById('errorForm');
const tableBody = document.querySelector('#errorTable tbody');
const canvas = document.getElementById('courtCanvas');
const ctx = canvas.getContext('2d');
let entries = [];

// Draw court
function drawCourt() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#e5e5e5';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(0,0,canvas.width,canvas.height);
  ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();
}

const zoneCoords = {
  'front-left': [canvas.width * 0.25, canvas.height * 0.25],
  'front-right':[canvas.width * 0.75, canvas.height * 0.25],
  'mid-left':  [canvas.width * 0.25, canvas.height * 0.5],
  'mid-right': [canvas.width * 0.75, canvas.height * 0.5],
  'back-left': [canvas.width * 0.25, canvas.height * 0.75],
  'back-right':[canvas.width * 0.75, canvas.height * 0.75],
};

function redraw() {
  drawCourt();
  entries.forEach(e => {
    const [x,y] = zoneCoords[e.zone];
    ctx.fillStyle = 'rgba(255,0,0,0.7)';
    ctx.beginPath(); ctx.arc(x,y,10,0,2*Math.PI); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif';
    ctx.fillText(e.errorType.charAt(0), x-4, y+4);
  });
}

drawCourt();

// Load from Firestore
function loadEntries() {
  db.collection('errors').orderBy('timestamp').get().then(snapshot => {
    entries = snapshot.docs.map(doc => doc.data());
    tableBody.innerHTML = '';
    entries.forEach(addRow);
    redraw();
  });
}

function addRow(entry) {
  const row = document.createElement('tr');
  ['date','match','set','rally','errorType','zone'].forEach(k => {
    const td = document.createElement('td'); td.textContent = entry[k]; row.appendChild(td);
  });
  tableBody.appendChild(row);
}

// Form submit
form.addEventListener('submit', e => {
  e.preventDefault();
  const entry = {
    date: form.date.value,
    match: form.match.value,
    set: form.set.value,
    rally: form.rally.value,
    errorType: form.errorType.value,
    zone: form.zone.value,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  // save to Firestore
  db.collection('errors').add(entry).then(() => loadEntries());
  form.reset();
});

loadEntries();
