// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Your Firebase config (same as in app.js)
const firebaseConfig = {
  apiKey: "AIzaSyBWmf_VuollXXwIsgDjofi9ToTkfvDJc0M",
  authDomain: "bmatchtracker.firebaseapp.com",
  projectId: "bmatchtracker",
  storageBucket: "bmatchtracker.appspot.com",
  messagingSenderId: "188991740256",
  appId: "1:188991740256:web:6b5b9d0c7804766266a605"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const mainApp = document.getElementById("mainApp");

loginBtn.onclick = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("Logged in as", user.displayName);
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
};

logoutBtn.onclick = () => {
  signOut(auth).then(() => {
    console.log("Logged out");
  });
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    userInfo.textContent = `👤 ${user.displayName}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    mainApp.style.display = "block";
    window.currentUser = user;
  } else {
    userInfo.textContent = "Not logged in";
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    mainApp.style.display = "none";
    window.currentUser = null;
  }
});
