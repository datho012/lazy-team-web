// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Firebase config - Import from firebase-config.js
import firebaseApp from "./firebase-config.js";
const app = firebaseApp;
const db = getFirestore(app);
const auth = getAuth(app);

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

// Create daily inventory if not exists - with improved error handling
async function initializeDailyInventory() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const inventoryRef = doc(db, "inventory", today);

    // First check if inventory exists
    const inventorySnap = await getDoc(inventoryRef);

    if (!inventorySnap.exists()) {
      console.log("Creating new inventory for today:", today);
      // Create new inventory for today
      await setDoc(inventoryRef, {
        prizes: [...prizes],
        createdAt: serverTimestamp(),
      });
      console.log("Inventory created successfully");
    } else {
      console.log("Inventory already exists for today");
    }

    return true;
  } catch (error) {
    console.error("Error initializing inventory:", error);

    // Handle specific Firestore errors
    if (error.code === "permission-denied") {
      throw new Error(
        "Không có quyền truy cập. Vui lòng liên hệ quản trị viên."
      );
    } else if (
      error.code?.includes("unavailable") ||
      error.code?.includes("network")
    ) {
      throw new Error(
        "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn."
      );
    } else {
      throw new Error("Không thể khởi tạo kho quà. Vui lòng thử lại sau.");
    }
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

// DOM elements - moved here to ensure they're accessed after DOM is ready
let loginButton, gachaBox, spinButton, resultDiv, spinCountSpan;

// Improved loading functions
function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.visibility = "hidden";
    }, 500);
  }
}

// Improved document ready function that combines all initialization
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements
  loginButton = document.getElementById("login-btn");
  gachaBox = document.getElementById("gacha-box");
  spinButton = document.getElementById("spin-btn");
  resultDiv = document.getElementById("result");
  spinCountSpan = document.getElementById("spin-count");

  // Initialize music player
  const musicPlayerInstance = new musicPlayer();

  // Set up login event handler
  if (loginButton) {
    loginButton.addEventListener("click", handleLogin);
  }

  // Add stars background
  const background = document.createElement("div");
  background.id = "background-stars";
  document.body.appendChild(background);

  // Handle spin button events
  setupSpinButton();

  // Hide loading screen after everything is initialized and start audio
  setTimeout(() => {
    hideLoadingScreen();
    // Autoplay audio when loading is complete
    if (musicPlayerInstance && musicPlayerInstance.audio) {
      // Try to play audio automatically
      musicPlayerInstance.audio
        .play()
        .then(() => {
          // Auto-play successful - update UI
          musicPlayerInstance.updatePlayerUI(true);
        })
        .catch((error) => {
          // Auto-play was prevented
          console.log("Audio autoplay prevented by browser:", error);
          // We'll rely on user click to start audio
        });
    }
  }, 1500);
});

// Login + setup with improved error handling
async function handleLogin() {
  try {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    // Start the login process
    console.log("Starting Google login flow...");
    const result = await signInWithPopup(auth, provider);

    // Check if we got a valid user
    if (!result || !result.user || !result.user.uid) {
      throw new Error("Login failed - no user data returned");
    }

    const user = result.user;
    console.log("Login successful for:", user.displayName);

    // Update UI first
    if (gachaBox) gachaBox.style.display = "block";
    if (loginButton) loginButton.style.display = "none";

    // Initialize daily inventory with error handling
    try {
      await initializeDailyInventory();
      console.log("Daily inventory initialized");
    } catch (invError) {
      console.error("Error initializing inventory:", invError);
      alert("Có lỗi khi khởi tạo kho quà. Vui lòng thử lại.");
      return; // Exit to prevent further errors
    }

    // Update user data
    const userRef = doc(db, "users", user.uid);
    let userData;

    try {
      const userSnap = await getDoc(userRef);
      const today = new Date().toISOString().split("T")[0];

      if (!userSnap.exists()) {
        // Create new user
        userData = {
          displayName: user.displayName,
          email: user.email,
          spins: 5,
          lastSpinDate: today,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, userData);
        console.log("New user created");
      } else {
        userData = userSnap.data();
        // Reset spins if it's a new day
        if (userData.lastSpinDate !== today) {
          userData = {
            ...userData,
            spins: 5,
            lastSpinDate: today,
          };
          await updateDoc(userRef, {
            spins: 5,
            lastSpinDate: today,
          });
          console.log("User spins reset for new day");
        }
      }

      // Update UI with spin count
      if (spinCountSpan && userData) {
        spinCountSpan.textContent = userData.spins;

        // Disable button if no spins left
        if (userData.spins <= 0 && spinButton) {
          spinButton.disabled = true;
          spinButton.textContent = "Hết lượt quay";
        }
      }

      // Show success message
      alert(`Đăng nhập thành công! Xin chào, ${user.displayName}`);
    } catch (userError) {
      console.error("Error updating user data:", userError);
      alert(
        "Đăng nhập thành công nhưng không thể cập nhật dữ liệu người dùng. Vui lòng thử lại."
      );

      // Reset UI state
      if (gachaBox) gachaBox.style.display = "none";
      if (loginButton) loginButton.style.display = "block";
    }
  } catch (error) {
    console.error("Login error:", error);

    // Handle different error types
    if (error.code === "auth/popup-closed-by-user") {
      alert("Đăng nhập bị hủy. Vui lòng thử lại.");
    } else if (error.code === "auth/network-request-failed") {
      alert("Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.");
    } else {
      alert("Đăng nhập thất bại: " + (error.message || "Vui lòng thử lại."));
    }

    // Ensure UI is in correct state for retry
    if (gachaBox) gachaBox.style.display = "none";
    if (loginButton) loginButton.style.display = "block";
  }
}

// Setup spin button handlers with improved gacha video functionality
function setupSpinButton() {
  // Get references to required DOM elements
  const spinBtn = document.getElementById("spin-btn");
  const videoContainer = document.getElementById("video-container");
  const gachaVideo = document.getElementById("gacha-video");
  const resultDiv = document.getElementById("result");
  const spinCountSpan = document.getElementById("spin-count");

  if (!spinBtn) {
    console.error("Spin button not found");
    return;
  }

  // Make sure we're using the properly referenced elements
  // Directly reference the DOM in case global vars aren't initialized correctly
  const gachaBox = document.getElementById("gacha-box");

  console.log(
    "Setting up spin button with video:",
    gachaVideo ? "found" : "not found"
  );
  console.log("Video container:", videoContainer ? "found" : "not found");

  // Create new button to avoid any existing event listeners
  const newSpinBtn = spinBtn.cloneNode(true);
  spinBtn.parentNode.replaceChild(newSpinBtn, spinBtn);

  // Make sure the video source is correct and preloaded
  if (gachaVideo) {
    // Check if source exists and is accessible
    const videoSource = gachaVideo.querySelector("source");
    if (videoSource) {
      // Fix path if needed - ensure it starts without slash
      const currentSrc = videoSource.getAttribute("src");
      if (currentSrc && !currentSrc.startsWith("assets/")) {
        videoSource.setAttribute("src", "assets/gacha-animation.mp4");
      }
    } else {
      // Create source if missing
      const newSource = document.createElement("source");
      newSource.setAttribute("src", "assets/gacha-animation.mp4");
      newSource.setAttribute("type", "video/mp4");
      gachaVideo.appendChild(newSource);
    }

    // Force load with console output for debugging
    gachaVideo.load();
    gachaVideo.preload = "auto";
    console.log("Gacha video preloading:", gachaVideo.src);

    // Add event listeners for video loading states
    gachaVideo.addEventListener("loadeddata", () =>
      console.log("Video data loaded successfully")
    );
    gachaVideo.addEventListener("canplay", () => console.log("Video can play"));
    gachaVideo.addEventListener("error", (e) =>
      console.error("Error loading video:", e)
    );
  }

  // Add click event handler with robust video handling
  newSpinBtn.addEventListener("click", async function () {
    console.log("Spin button clicked");

    // First check auth state
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in");
      alert("Bạn chưa đăng nhập! Vui lòng đăng nhập trước.");
      return;
    }

    try {
      // Verify user document exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error("User document not found");
        alert(
          "Lỗi hệ thống: không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
        );
        return;
      }

      const userData = userSnap.data();
      const remainingSpins = userData.spins;

      console.log(
        `User ${user.displayName} has ${remainingSpins} spins remaining`
      );

      // Check if user has spins left
      if (remainingSpins <= 0) {
        alert("Bạn đã hết lượt quay hôm nay!");
        return;
      }

      // Disable button to prevent multiple clicks
      newSpinBtn.disabled = true;
      newSpinBtn.textContent = "Đang quay...";

      try {
        // Get prize result BEFORE showing animation
        const prize = await getPrizeFromInventory();
        console.log("Prize result:", prize);

        // Hide previous results
        if (resultDiv) {
          resultDiv.style.display = "none";
        }

        // Function to show results (used for both success and fallback)
        const showResults = async () => {
          // Hide video container
          if (videoContainer) {
            videoContainer.style.display = "none";
          }

          // Show prize result
          if (resultDiv) {
            resultDiv.textContent =
              prize !== "Trượt"
                ? `🎉 Chúc mừng bạn đã trúng: ${prize}!`
                : "😢 Chúc bạn may mắn lần sau!";
            resultDiv.style.color = prize !== "Trượt" ? "green" : "red";
            resultDiv.style.display = "block";
          }

          // Update spins in database
          await updateDoc(userRef, {
            spins: remainingSpins - 1,
          });

          // Save winner record if prize is not "Trượt"
          if (prize !== "Trượt") {
            try {
              const today = new Date().toISOString().split("T")[0];
              const winnerRecord = {
                playerName: user.displayName,
                playerEmail: user.email,
                playerUID: user.uid,
                prize: prize,
                date: today,
                timestamp: serverTimestamp(),
                time: new Date().toLocaleTimeString("vi-VN"),
              };

              console.log("Saving winner record...", winnerRecord);

              // Add to winners collection
              const winnerRef = doc(
                db,
                "winners",
                `${today}_${user.uid}_${Date.now()}`
              );
              await setDoc(winnerRef, winnerRecord);
              console.log("✅ Winner record saved successfully:", winnerRecord);
            } catch (winnerError) {
              console.error("❌ Error saving winner record:", winnerError.code, winnerError.message);
              console.error("Full error:", winnerError);
            }
          } else {
            console.log("No prize won (Trượt) - not saving winner record");
          }

          // Update UI spin count
          if (spinCountSpan) {
            spinCountSpan.textContent = remainingSpins - 1;
          }

          // Update button state
          newSpinBtn.disabled = false;
          newSpinBtn.textContent = "Quay Ngay";

          if (remainingSpins - 1 <= 0) {
            newSpinBtn.disabled = true;
            newSpinBtn.textContent = "Hết lượt quay";
          }
        };

        // Try to play video if available
        if (gachaVideo && videoContainer) {
          // Make video container visible
          videoContainer.style.display = "block";

          // Create a new timeout to ensure results show even if video fails
          const fallbackTimer = setTimeout(() => {
            console.log("Fallback timer triggered");
            if (resultDiv.style.display === "none") {
              console.warn(
                "Video playback may have failed - showing results anyway"
              );
              showResults();
            }
          }, 3000); // 3 seconds fallback

          try {
            // Reset video to beginning
            gachaVideo.currentTime = 0;

            // Set up event listener for video end
            gachaVideo.addEventListener(
              "ended",
              function () {
                console.log("Video playback completed successfully");
                clearTimeout(fallbackTimer); // Clear the fallback timer
                showResults();
              },
              { once: true }
            );

            // Try to play the video
            console.log("Attempting to play gacha video");
            const playPromise = gachaVideo.play();

            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Video playing successfully");
                })
                .catch((error) => {
                  console.error("Error playing video:", error);
                  clearTimeout(fallbackTimer);
                  showResults(); // Show results immediately if video fails
                });
            }
          } catch (videoError) {
            console.error("Video playback error:", videoError);
            clearTimeout(fallbackTimer);
            showResults(); // Show results immediately if video fails
          }
        } else {
          // No video available, show results immediately
          console.warn("No video element found, skipping animation");
          showResults();
        }
      } catch (prizeError) {
        console.error("Error getting prize:", prizeError);
        alert("Có lỗi xảy ra khi quay thưởng. Vui lòng thử lại!");
        newSpinBtn.disabled = false;
        newSpinBtn.textContent = "Quay Ngay";
      }
    } catch (error) {
      console.error("Error in spin process:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại!");
      newSpinBtn.disabled = false;
      newSpinBtn.textContent = "Quay Ngay";
    }
  });
}

// Improved Music Player Class with progress bar functionality
class musicPlayer {
  constructor() {
    this.audio = document.getElementById("new-audio-element");
    this.playBtn = document.getElementById("play");
    this.controlPanel = document.getElementById("control-panel");
    this.infoBar = document.getElementById("info");
    this.progressBar = this.infoBar?.querySelector(".bar");
    this.isPlaying = false;

    // Initialize only if elements exist
    if (this.audio && this.playBtn) {
      // Bind methods to avoid context loss
      this.play = this.play.bind(this);
      this.updateProgress = this.updateProgress.bind(this);
      this.updatePlayerUI = this.updatePlayerUI.bind(this);

      // Set up event listeners
      this.playBtn.addEventListener("click", this.play);
      this.audio.addEventListener("timeupdate", this.updateProgress);
      this.audio.addEventListener("ended", () => this.updatePlayerUI(false));

      // Set up progress bar click handling
      if (this.infoBar) {
        const progressBarContainer =
          this.infoBar.querySelector(".progress-bar");
        if (progressBarContainer) {
          progressBarContainer.addEventListener("click", (e) =>
            this.seekAudio(e)
          );
        }
      }

      // Preload audio
      if (this.audio) {
        this.audio.load();
      }
    }
  }

  // Update progress bar based on audio current time
  updateProgress() {
    if (this.audio && this.progressBar) {
      const percent = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressBar.style.width = `${percent}%`;
    }
  }

  // Seek within audio when progress bar is clicked
  seekAudio(event) {
    if (!this.audio || !this.infoBar) return;

    const progressBar = this.infoBar.querySelector(".progress-bar");
    if (!progressBar) return;

    // Calculate position click relative to progress bar
    const bounds = progressBar.getBoundingClientRect();
    const clickPositionInBar = event.clientX - bounds.left;
    const barWidth = bounds.width;

    // Calculate percentage
    const percentageClicked = clickPositionInBar / barWidth;

    // Set audio position
    this.audio.currentTime = this.audio.duration * percentageClicked;
  }

  // Update UI based on play state
  updatePlayerUI(isPlaying) {
    this.isPlaying = isPlaying;

    if (this.controlPanel) {
      if (isPlaying) {
        this.controlPanel.classList.add("active");
      } else {
        this.controlPanel.classList.remove("active");
      }
    }

    if (this.infoBar) {
      if (isPlaying) {
        this.infoBar.classList.add("active");
      } else {
        this.infoBar.classList.remove("active");
      }
    }

    if (this.playBtn) {
      if (isPlaying) {
        this.playBtn.classList.add("playing");
      } else {
        this.playBtn.classList.remove("playing");
      }
    }
  }

  // Handle play/pause
  play() {
    if (!this.audio) return;

    if (this.audio.paused) {
      // Play audio
      this.audio
        .play()
        .then(() => {
          this.updatePlayerUI(true);
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    } else {
      // Pause audio
      this.audio.pause();
      this.updatePlayerUI(false);
    }
  }
}
