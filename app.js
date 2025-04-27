# app.js
// Import Firebase modules
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

// Your web app's Firebase configuration (replace with your own)
const firebaseConfig = {
  apiKey: "AIzaSyBWmf_VuollXXwIsgDjofi9ToTkfvDJc0M",
  authDomain: "bmatchtracker.firebaseapp.com",
  projectId: "bmatchtracker",
  storageBucket: "bmatchtracker.appspot.com",
  messagingSenderId: "188991740256",
  appId: "1:188991740256:web:6b5b9d0c7804766266a605",
  measurementId: "G-Y1RLX4BRT7"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const form = document.getElementById('errorForm');
const tableBody = document.querySelector('#errorTable tbody');
const canvas = document.getElementById('courtCanvas');
const ctx = canvas.getContext('2d');
let entries = [];

// Draw court function
function drawCourt() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#e5e5e5';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(0,0,canvas.width,canvas.height);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height/2);
  ctx.lineTo(canvas.width, canvas.height/2);
  ctx.stroke();
}

drawCourt();

// Zone coordinates mapping
const zoneCoords = {
  'front-left': [canvas.width * 0.25, canvas.height * 0.25],
  'front-right':[canvas.width * 0.75, canvas.height * 0.25],
  'mid-left':  [canvas.width * 0.25, canvas.height * 0.5],
  'mid-right': [canvas.width * 0.75, canvas.height * 0.5],
  'back-left': [canvas.width * 0.25, canvas.height * 0.75],
  'back-right':[canvas.width * 0.75, canvas.height * 0.75],
};

// Redraw errors on court
function redraw() {
  drawCourt();
  entries.forEach(e => {
    const [x,y] = zoneCoords[e.zone];
    ctx.fillStyle = 'rgba(255,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(x,y,10,0,2*Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText(e.errorType.charAt(0), x-4, y+4);
  });
}

// Load entries from Firestore
async function loadEntries() {
  const q = query(collection(db, 'errors'), orderBy('timestamp'));
  const snapshot = await getDocs(q);
  entries = snapshot.docs.map(doc => doc.data());
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

// Handle form submission
form.addEventListener('submit', async e => {
  e.preventDefault();
  const entry = {
    date: form.date.value,
    match: form.match.value,
    set: form.set.value,
    rally: form.rally.value,
    errorType: form.errorType.value,
    zone: form.zone.value,
    timestamp: serverTimestamp()
  };
  await addDoc(collection(db, 'errors'), entry);
  form.reset();
  loadEntries();
});

// Initial load
loadEntries();
