import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0iGL_ea7_o2FXD-Gz_MiPSUAKDvX7gbY",
  authDomain: "lazy-team-gacha.firebaseapp.com",
  projectId: "lazy-team-gacha",
  storageBucket: "lazy-team-gacha.appspot.com",
  messagingSenderId: "145160460470",
  appId: "1:145160460470:web:1bdf93042b30c02ed4ee17",
};

const app = initializeApp(firebaseConfig);

const loginButton = document.getElementById("login-btn");
const gachaBox = document.getElementById("gacha-box");

loginButton.addEventListener("click", async () => {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Đăng nhập thành công! Xin chào, ${user.displayName}`);
    gachaBox.style.display = "block";
    loginButton.style.display = "none";
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    alert("Đăng nhập thất bại. Vui lòng thử lại!");
  }
});
