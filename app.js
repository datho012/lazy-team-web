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

  document.addEventListener("DOMContentLoaded", () => {
    const spinButton = document.getElementById("spin-btn");
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Tham chiếu đến các phần tử
  const spinButton = document.getElementById("spin-btn");
  const videoContainer = document.getElementById("video-container");
  const gachaVideo = document.getElementById("gacha-video");
  const resultDiv = document.getElementById("result");
  const spinCountSpan = document.getElementById("spin-count");

  if (!spinButton) return; // Nếu không có nút quay thì thoát

  // Đảm bảo video đã tải trước
  if (gachaVideo) {
    gachaVideo.load();

    // Xử lý sự kiện khi video kết thúc
    gachaVideo.addEventListener("ended", function () {
      console.log("Video ended");
      videoContainer.style.display = "none";

      // Hiển thị kết quả (giả lập)
      if (resultDiv) {
        resultDiv.textContent = "🎉 Chúc mừng bạn đã trúng giải!";
        resultDiv.style.display = "block";
      } else {
        resultDiv.textContent = "lần sau nhé bạn ơi!";
        resultDiv.style.display = "block";
      }

      // Giảm số lượt quay
      if (spinCountSpan) {
        const currentSpins = parseInt(spinCountSpan.textContent);
        if (currentSpins > 0) {
          spinCountSpan.textContent = currentSpins - 1;
        }

        // Vô hiệu hóa nút nếu hết lượt
        if (currentSpins - 1 <= 0) {
          spinButton.disabled = true;
          spinButton.textContent = "Hết lượt quay";
        } else {
          spinButton.disabled = false;
        }
      }
    });
  }

  // Xử lý sự kiện khi nhấn nút quay
  spinButton.addEventListener("click", function () {
    console.log("Spin button clicked");
    // Ẩn kết quả nếu đang hiển thị
    if (resultDiv) resultDiv.style.display = "none";

    // Hiển thị video
    if (videoContainer) videoContainer.style.display = "block";

    // Phát video
    if (gachaVideo) {
      console.log("Playing video");

      // Đặt lại video về đầu
      gachaVideo.currentTime = 0;

      // Promise để xử lý lỗi khi gọi play()
      const playPromise = gachaVideo.play();

      if (playPromise !== undefined) {
        playPromise
          .then((_) => {
            console.log("Video playing successfully");
          })
          .catch((error) => {
            console.error("Error playing video:", error);
            // Fallback: hiển thị kết quả nếu video không chạy
            if (videoContainer) videoContainer.style.display = "none";
            if (resultDiv) {
              resultDiv.textContent = "🎉 Chúc mừng bạn đã trúng giải!";
              resultDiv.style.display = "block";
            }
          });
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const spinButton = document.getElementById("spin-btn");
  const videoContainer = document.getElementById("video-container");
  const gachaVideo = document.getElementById("gacha-video");
  const resultDiv = document.getElementById("result");
  const spinCountSpan = document.getElementById("spin-count");

  if (!spinButton) return;

  // Đảm bảo xóa mọi event listener cũ
  const newSpinBtn = spinButton.cloneNode(true);
  spinButton.parentNode.replaceChild(newSpinBtn, spinButton);

  if (gachaVideo) {
    gachaVideo.load();
  }

  // Handler MỚI kết hợp cả hai chức năng
  newSpinBtn.addEventListener("click", async function () {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return alert("Bạn chưa đăng nhập!");

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const data = userSnap.data();
    const remainingSpins = data.spins;

    if (remainingSpins <= 0) {
      return alert("Bạn đã hết lượt quay hôm nay!");
    }

    // Vô hiệu hóa nút trong quá trình quay
    newSpinBtn.disabled = true;

    // LẤY GIẢI THƯỞNG TRƯỚC, để chuẩn bị hiển thị sau khi video kết thúc
    const prize = await getPrizeFromInventory();
    console.log("Prize from inventory:", prize);

    // Ẩn kết quả cũ nếu đang hiển thị
    if (resultDiv) resultDiv.style.display = "none";

    // Hiển thị video
    if (videoContainer) videoContainer.style.display = "block";

    // Phát video
    if (gachaVideo) {
      // Đặt lại video từ đầu
      gachaVideo.currentTime = 0;

      // Xử lý sự kiện khi video kết thúc
      gachaVideo.onended = async function () {
        videoContainer.style.display = "none";

        // HIỂN THỊ KẾT QUẢ THỰC TẾ từ giải thưởng đã lấy
        if (resultDiv) {
          resultDiv.textContent =
            prize !== "Trượt"
              ? `🎉 Chúc mừng bạn đã trúng: ${prize}!`
              : "😢 Chúc bạn may mắn lần sau!";
          resultDiv.style.color = prize !== "Trượt" ? "green" : "red";
          resultDiv.style.display = "block";
        }

        // Giảm số lượt quay trong DB
        await updateDoc(userRef, {
          spins: remainingSpins - 1,
        });

        // Cập nhật số lượt hiển thị
        spinCountSpan.textContent = remainingSpins - 1;

        // Kiểm tra và cập nhật trạng thái nút
        if (remainingSpins - 1 <= 0) {
          newSpinBtn.disabled = true;
          newSpinBtn.textContent = "Hết lượt quay";
        } else {
          newSpinBtn.disabled = false;
        }
      };

      try {
        await gachaVideo.play();
      } catch (error) {
        console.error("Lỗi phát video:", error);
        // Fallback nếu video không chạy
        videoContainer.style.display = "none";

        // Hiển thị kết quả thực tế ngay
        if (resultDiv) {
          resultDiv.textContent =
            prize !== "Trượt"
              ? `🎉 Chúc mừng bạn đã trúng: ${prize}!`
              : "😢 Chúc bạn may mắn lần sau!";
          resultDiv.style.color = prize !== "Trượt" ? "green" : "red";
          resultDiv.style.display = "block";
        }

        // Vẫn giảm lượt quay trong DB
        await updateDoc(userRef, {
          spins: remainingSpins - 1,
        });

        spinCountSpan.textContent = remainingSpins - 1;

        if (remainingSpins - 1 <= 0) {
          newSpinBtn.disabled = true;
          newSpinBtn.textContent = "Hết lượt quay";
        } else {
          newSpinBtn.disabled = false;
        }
      }
    }
  });
});

console.clear();

class musicPlayer {
  constructor() {
    this.audio = document.getElementById("new-audio-element");
    this.play = this.play.bind(this);
    this.playBtn = document.getElementById("play");
    this.playBtn.addEventListener("click", this.play);
    this.controlPanel = document.getElementById("control-panel");
    this.infoBar = document.getElementById("info");
  }

  play() {
    let controlPanelObj = this.controlPanel,
      infoBarObj = this.infoBar;
    Array.from(controlPanelObj.classList).find(function (element) {
      return element !== "active"
        ? controlPanelObj.classList.add("active")
        : controlPanelObj.classList.remove("active");
    });

    Array.from(infoBarObj.classList).find(function (element) {
      return element !== "active"
        ? infoBarObj.classList.add("active")
        : infoBarObj.classList.remove("active");
    });

    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }
}

const newMusicplayer = new musicPlayer();
