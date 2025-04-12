// Firebase imports
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

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0iGL_ea7_o2FXD-Gz_MiPSUAKDvX7gbY",
  authDomain: "lazy-team-gacha.firebaseapp.com",
  projectId: "lazy-team-gacha",
  storageBucket: "lazy-team-gacha.appspot.com",
  messagingSenderId: "145160460470",
  appId: "1:145160460470:web:1bdf93042b30c02ed4ee17",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Prizes from Excel
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

// Create daily inventory if not exists
async function initializeDailyInventory() {
  const today = new Date().toISOString().split("T")[0];
  const inventoryRef = doc(db, "inventory", today);
  const inventorySnap = await getDoc(inventoryRef);

  if (!inventorySnap.exists()) {
    await setDoc(inventoryRef, {
      prizes: [...prizes],
    });
  }
}

// Select prize by weighted random
async function getPrizeFromInventory() {
  const today = new Date().toISOString().split("T")[0];
  const inventoryRef = doc(db, "inventory", today);
  const inventorySnap = await getDoc(inventoryRef);

  if (!inventorySnap.exists()) {
    alert("Inventory not initialized. Please try again later.");
    return "Error";
  }

  const data = inventorySnap.data();
  const currentPrizes = data?.prizes || [];

  if (currentPrizes.length === 0) {
    alert("No prizes available.");
    return "Error";
  }

  const totalRate = currentPrizes.reduce((sum, prize) => sum + prize.rate, 0);
  const random = Math.random() * totalRate;
  let cumulative = 0;

  for (let i = 0; i < currentPrizes.length; i++) {
    const prize = currentPrizes[i];
    cumulative += prize.rate;

    if (random < cumulative) {
      if (prize.name !== "Trượt") {
        currentPrizes.splice(i, 1);
        await updateDoc(inventoryRef, { prizes: currentPrizes });
      }
      return prize.name;
    }
  }

  return "Trượt";
}

// DOM elements
const loginButton = document.getElementById("login-btn");
const gachaBox = document.getElementById("gacha-box");
const spinButton = document.getElementById("spin-btn");
const resultDiv = document.getElementById("result");
const spinCountSpan = document.getElementById("spin-count");

// Login + setup
loginButton.addEventListener("click", async () => {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    alert(`Đăng nhập thành công! Xin chào, ${user.displayName}`);
    gachaBox.style.display = "block";
    loginButton.style.display = "none";

    await initializeDailyInventory();

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
  } catch (error) {
    console.error("Error during login:", error);
    alert("Đăng nhập thất bại. Vui lòng thử lại.");
  }
});

// Handle spin
spinButton.addEventListener("click", async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return alert("Bạn chưa đăng nhập!");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data();
  const remainingSpins = data.spins;

  if (remainingSpins > 0) {
    const prize = await getPrizeFromInventory();

    resultDiv.textContent =
      prize !== "Trượt"
        ? `🎉 Chúc mừng bạn đã trúng: ${prize}!`
        : "😢 Chúc bạn may mắn lần sau!";
    resultDiv.style.color = prize !== "Trượt" ? "green" : "red";

    // Giảm số lượt quay
    await updateDoc(userRef, {
      spins: remainingSpins - 1,
    });

    // Hiển thị số lượt quay còn lại
    spinCountSpan.textContent = remainingSpins - 1;

    // Vô hiệu hóa nút nếu hết lượt quay
    if (remainingSpins - 1 === 0) {
      spinButton.disabled = true;
      spinButton.textContent = "Hết lượt quay";
    }
  } else {
    alert("Bạn đã hết lượt quay hôm nay!");
  }
});

// phat nhac
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("background-music");

  // Phát nhạc sau khi người dùng nhấp chuột
  document.body.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
    }
  });

  const loadingScreen = document.getElementById("loading-screen");
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 2000); // Ẩn sau 2 giây

  const background = document.createElement("div");
  background.id = "background-stars";
  document.body.appendChild(background);

  // Tạo sao băng
  for (let i = 0; i < 5; i++) {
    const star = document.createElement("div");
    star.className = "shooting-star";
    star.style.top = `${Math.random() * 100}vh`;
    star.style.left = `${Math.random() * 100}vw`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    background.appendChild(star);
  }

  // Tạo các ngôi sao nhỏ
  for (let i = 0; i < 50; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.top = `${Math.random() * 100}vh`;
    star.style.left = `${Math.random() * 100}vw`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    background.appendChild(star);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const spinButton = document.getElementById("spin-btn");

  // Hàm tạo pháo hoa
  function launchFireworks() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  // Kích hoạt pháo hoa khi nhấn nút quay gacha
  spinButton.addEventListener("click", () => {
    launchFireworks();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Hàm tạo pháo hoa
  function launchFireworks() {
    const duration = 5 * 1000; // Thời gian pháo hoa (5 giây)
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: Math.random() * 360,
        spread: 55,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2,
        },
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  // Kích hoạt pháo hoa khi người dùng truy cập
  launchFireworks();
});

document.addEventListener("DOMContentLoaded", () => {
  const headerImg = document.querySelector(".header-img");
  const music = document.getElementById("background-music");

  // Điều chỉnh tốc độ lắc lư theo nhịp nhạc
  music.addEventListener("play", () => {
    headerImg.style.animationDuration = "0.8s"; // Tăng tốc độ lắc lư
  });

  music.addEventListener("pause", () => {
    headerImg.style.animationDuration = "1.5s"; // Giảm tốc độ lắc lư
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".slider");
  const slides = document.querySelectorAll(".slide");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");
  const indicators = document.querySelectorAll(".indicator");

  let currentIndex = 0;

  function updateSlider() {
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === currentIndex);
    });
  }

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlider();
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider();
  });

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      currentIndex = index;
      updateSlider();
    });
  });

  // Auto-slide every 5 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider();
  }, 5000);
});
