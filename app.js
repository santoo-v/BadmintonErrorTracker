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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM refs & tabs
document.getElementById('recordTabBtn').addEventListener('click', () => switchTab('record'));
document.getElementById('dataTabBtn').addEventListener('click', () => switchTab('data'));
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

function switchTab(tab) {
  document.getElementById('recordTab').style.display = tab === 'record' ? '' : 'none';
  document.getElementById('dataTab').style.display = tab === 'data' ? '' : 'none';
  document.getElementById('recordTabBtn').classList.toggle('active', tab === 'record');
  document.getElementById('dataTabBtn').classList.toggle('active', tab === 'data');
  if(tab==='record') redraw();
}

// Draw court (same as before)
function drawCourt() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='#333'; ctx.lineWidth=2;
  ctx.strokeRect(0,0,W,H);
  const sidemargin=(W-W*(5.18/6.1))/2;
  ctx.beginPath(); ctx.moveTo(sidemargin,0); ctx.lineTo(sidemargin,H);
  ctx.moveTo(W-sidemargin,0); ctx.lineTo(W-sidemargin,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
  const short=H*(1.98/13.4);
  ctx.beginPath(); ctx.moveTo(0,short); ctx.lineTo(W,short);
  ctx.moveTo(0,H-short); ctx.lineTo(W,H-short);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2,short); ctx.lineTo(W/2,H-short); ctx.stroke();
  ctx.fillStyle='#000'; ctx.font='12px sans-serif';
  const labels={ 'forehand-front':[W*0.75,short/2,'Forehand Front'], 'backhand-front':[W*0.25,short/2,'Backhand Front'], 'forehand-middle':[W*0.75,H/2,'Forehand Middle'], 'backhand-middle':[W*0.25,H/2,'Backhand Middle'], 'forehand-back':[W*0.75,H-short/2,'Forehand Rear'], 'backhand-back':[W*0.25,H-short/2,'Backhand Rear'] };
  for(const k in labels){const [x,y,t]=labels[k]; ctx.fillText(t,x-ctx.measureText(t).width/2,y);}
}
const zoneCoords={ 'forehand-front':[canvas.width*0.75,canvas.height*0.2],'backhand-front':[canvas.width*0.25,canvas.height*0.2],'forehand-middle':[canvas.width*0.75,canvas.height*0.5],'backhand-middle':[canvas.width*0.25,canvas.height*0.5],'forehand-back':[canvas.width*0.75,canvas.height*0.8],'backhand-back':[canvas.width*0.25,canvas.height*0.8]};
function redraw(){ drawCourt(); entries.forEach(e=>{const[x,y]=zoneCoords[e.zone];ctx.fillStyle='rgba(255,0,0,0.7)';ctx.beginPath();ctx.arc(x,y,10,0,2*Math.PI);ctx.fill();}); }

drawCourt();

// Firestore load
async function loadEntries(){ const q=query(collection(db,'errors'),orderBy('timestamp')); const snap=await getDocs(q); entries=snap.docs.map(d=>d.data()); tableBody.innerHTML=''; entries.forEach(e=>{ const row=document.createElement('tr'); ['date','match','player','set','rally','errorType','zone'].forEach(k=>{const td=document.createElement('td'); td.textContent=e[k]; row.appendChild(td);} ); tableBody.appendChild(row);} ); redraw(); }

// Session start
sessionForm.addEventListener('submit',e=>{ e.preventDefault(); sessionDate=document.getElementById('sessionDate').value; sessionMatch=document.getElementById('sessionMatch').value; sessionPlayer=document.getElementById('sessionPlayer').value; currentSession.textContent=`${sessionDate} | ${sessionMatch} | ${sessionPlayer}`; sessionForm.style.display='none'; recordingSection.style.display=''; });
// Finish session
finishBtn.addEventListener('click',()=>{ sessionDate=null; sessionMatch=null; sessionPlayer=null; sessionForm.reset(); sessionForm.style.display=''; recordingSection.style.display='none'; });
// Add error
errorForm.addEventListener('submit',async e=>{ e.preventDefault(); if(!sessionDate||!sessionMatch||!sessionPlayer) return alert('Start a session first'); const entry={ date:sessionDate, match:sessionMatch, player:sessionPlayer, set:document.getElementById('set').value, rally:document.getElementById('rally').value, errorType:document.getElementById('errorType').value, zone:document.getElementById('zone').value, timestamp:serverTimestamp() }; await addDoc(collection(db,'errors'),entry); errorForm.reset(); loadEntries(); });

// Initial load
loadEntries();
