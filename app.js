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
  appId: "1:188991740256:web:6b5b9d0c7804766266a605"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM references
const recordTabBtn = document.getElementById('recordTabBtn');
const dataTabBtn = document.getElementById('dataTabBtn');
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
let sessionPlayer = null;

// Tab switching
function switchTab(tab) {
  document.getElementById('recordTab').style.display = tab === 'record' ? '' : 'none';
  document.getElementById('dataTab').style.display = tab === 'data' ? '' : 'none';
  recordTabBtn.classList.toggle('active', tab === 'record');
  dataTabBtn.classList.toggle('active', tab === 'data');
  if (tab === 'record') {
    redraw();
  }
}
recordTabBtn.addEventListener('click', () => switchTab('record'));
dataTabBtn.addEventListener('click', () => switchTab('data'));

// Draw badminton court (13.4m x 6.1m)
function drawCourt() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  // Outer boundary
  ctx.strokeRect(0, 0, W, H);
  // Singles sidelines
  const sidemargin = (W - (W * (5.18 / 6.1))) / 2;
  ctx.beginPath();
  ctx.moveTo(sidemargin, 0);
  ctx.lineTo(sidemargin, H);
  ctx.moveTo(W - sidemargin, 0);
  ctx.lineTo(W - sidemargin, H);
  ctx.stroke();
  // Net line
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  // Short service lines (1.98m from net each side)
  const short = (1.98 / 13.4) * H;
  ctx.beginPath();
  ctx.moveTo(0, H / 2 - short);
  ctx.lineTo(W, H / 2 - short);
  ctx.moveTo(0, H / 2 + short);
  ctx.lineTo(W, H / 2 + short);
  ctx.stroke();
  // Center service line
  ctx.beginPath();
  ctx.moveTo(W / 2, H / 2 - short);
  ctx.lineTo(W / 2, H / 2 + short);
  ctx.stroke();
  // Zone labels
  ctx.fillStyle = '#000';
