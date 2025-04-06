import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0iGL_ea7_o2FXD-Gz_MiPSUAKDvX7gbY",
  authDomain: "lazy-team-gacha.firebaseapp.com",
  projectId: "lazy-team-gacha",
  storageBucket: "lazy-team-gacha.appspot.com",
  messagingSenderId: "145160460470",
  appId: "1:145160460470:web:1bdf93042b30c02ed4ee17",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const prizes = [
  { name: "Clear file Ageha - Jinginaki Mukotori", rate: 4 },
  { name: "Coffee & Vanilla clear file", rate: 4 },
  { name: "Clear file Setsu - Chocolate Vampire", rate: 4 },
  { name: "Clear file Kira - Jinginaki Mukotori", rate: 4 },
  { name: "Lót tay Chocolate Vampire", rate: 4 },
  { name: "Sổ bưu thiếp - Jinginaki Mukotori", rate: 4 },
  { name: "Choco illustration note", rate: 4 },
  { name: "Bì thư Chocolate Vampire", rate: 4 },
  { name: "Khăn tay Chocolate Vampire", rate: 4 },
  { name: "Sticky Poster - Jinginaki Mukotori", rate: 4 },
  { name: "Bọc truyện - Jinginaki Mukotori", rate: 4 },
  { name: "Set 6 cheki - Jinginaki Mukotori", rate: 4 },
  { name: "Bookmark - Jinginaki Mukotori", rate: 4 },
  { name: "Messenger Card - Jinginaki Mukotori", rate: 4 },
  { name: "Lịch Shocomi 2023", rate: 4 },
  { name: "Trượt", rate: 40 },
];

function getPrize() {
  const random = Math.random() * 100;
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += prize.rate;
    if (random < cumulative) return prize.name;
  }
  return null;
}

const loginButton = document.getElementById("login-btn");
const gachaBox = document.getElementById("gacha-box");
const spinButton = document.getElementById("spin-btn");
const resultDiv = document.getElementById("result");
const spinCountSpan = document.getElementById("spin-count");

loginButton.addEventListener("click", async () => {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Đăng nhập thành công! Xin chào, ${user.displayName}`);

    gachaBox.style.display = "block";
    loginButton.style.display = "none";

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const today = new Date().toISOString().split("T")[0];

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName,
        spins: 5,
        lastSpinDate: today,
      });
    } else {
      const data = userSnap.data();
      if (data.lastSpinDate !== today) {
        await updateDoc(userRef, {
          spins: 5,
          lastSpinDate: today,
        });
      }
    }

    const finalSnap = await getDoc(userRef);
    spinCountSpan.textContent = finalSnap.data().spins;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    alert("Đăng nhập thất bại. Vui lòng thử lại!");
  }
});

spinButton.addEventListener("click", async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return alert("Bạn chưa đăng nhập!");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data();
  const remainingSpins = data.spins;

  if (remainingSpins > 0) {
    const prize = getPrize();

    resultDiv.textContent = prize
      ? `🎉 Chúc mừng bạn đã trúng: ${prize}!`
      : "😢 Chúc bạn may mắn lần sau!";
    resultDiv.style.color = prize ? "green" : "red";

    await updateDoc(userRef, {
      spins: remainingSpins - 1,
    });

    await setDoc(doc(db, "users", user.uid, "spins", `${Date.now()}`), {
      prize: prize || "Trượt",
      time: serverTimestamp(),
    });

    spinCountSpan.textContent = remainingSpins - 1;

    if (remainingSpins - 1 === 0) {
      spinButton.disabled = true;
      spinButton.textContent = "Hết lượt quay";
    }
  } else {
    alert("Bạn đã hết lượt quay hôm nay!");
  }
});
