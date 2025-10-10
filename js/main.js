import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
import { components } from "./component-data.js";
// --- AWAL PERUBAHAN ---
import {
  createLandingPage,
  createMenuPage,
  createViewerPage,
  clearUI,
  clearViewerUI,
  updateUIGroupPosition,
  createHelpPanel,
  createQuizScreen,
  createMiniQuizPage,
  createQuizResultScreen,
  createMiniQuizResultPage,
  createQuizReportScreen,
  createCompletionScreen,
  createPostQuizChoiceScreen,
  createCreditsScreen,
  createModeSelectionPage,
  createAvatarGreetingPage,
  updateAvatar,
  toggleAvatarVisibility,
  preloadAvatar,
  activeTypingAnimation,
  uiGroup,
  GREETING_DATA,
  navButtons, // Impor data sapaan
} from "./ui-creator.js";
// --- AKHIR PERUBAHAN ---
import {
  loader,
  loadComponentModel,
  unloadComponentModel,
  updateModelRotation,
  setupDRACOLoader,
  setupKTX2Loader,
  isDragging,
  modelCache,
  startModelAnimation, // <-- IMPOR BARU
  updateModelTransition, // <-- IMPOR BARU
} from "./model-loader.js";
import {
  setupInteraction,
  handleVRHover,
  handleVRDrag,
  setButtonEnabled,
} from "./interaction-manager.js";
import { setupVR, startVRSession, isVRMode } from "./vr-manager.js";
import { loadingManager } from "./loading-manager.js";
import { quizData } from "./quiz-data.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { creditsData } from "./credits-data.js";
import { debugGroup, createFpsLabel, updateFpsLabel } from "./ui-creator.js";

// --- AWAL PERUBAHAN ---
let audioListener, sound, backgroundSound, completionSound, greetingSound; // Tambahkan objek audio baru
let shuffledQuizData = [];

const audioLoader = new THREE.AudioLoader(loadingManager);
let playerName = "";
let currentQuestionIndex = 0;
let quizScore = 0;
let hasAttemptedQuiz = false;
let highestComponentUnlocked = 0;
let currentCreditIndex = 0;
let isChangingComponent = false;
let stats;
const CHANGE_DEBOUNCE_TIME = 500;
const clock = new THREE.Clock();
let confettiEffect = null;
let fps = 0;
let isFadingInUI = false;
let frameCount = 0;
let lastFpsUpdate = 0;
let fpsLabel = null;
let currentGreetingIndex = 0;
const audioCache = {};
let isDebugVisible = false;
const STORAGE_KEY = "webxr_learning_progress";

function saveProgress() {
  const progress = {
    playerName: playerName,
    highestComponentUnlocked: highestComponentUnlocked,
    quizScore: quizScore,
    hasAttemptedQuiz: hasAttemptedQuiz,
  };
  // Simpan objek progres sebagai string JSON di localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  console.log("Progres disimpan:", progress);
}

function loadProgress() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const progress = JSON.parse(savedData);
    playerName = progress.playerName || "";
    highestComponentUnlocked = progress.highestComponentUnlocked || 0;
    quizScore = progress.quizScore || 0;
    hasAttemptedQuiz = progress.hasAttemptedQuiz || false;

    // Terapkan progres yang sudah terbuka ke data komponen
    for (let i = 0; i <= highestComponentUnlocked; i++) {
      if (components[i]) {
        components[i].unlocked = true;
      }
    }
    console.log("Progres dimuat:", progress);
    return true; // Kembalikan true jika ada data yang dimuat
  }
  return false; // Kembalikan false jika tidak ada data
}

function resetProgress() {
  // Hapus data dari localStorage
  localStorage.removeItem(STORAGE_KEY);

  // Reset variabel global ke nilai default
  playerName = "";
  highestComponentUnlocked = 0;
  quizScore = 0;
  hasAttemptedQuiz = false;

  // Reset status 'unlocked' pada semua komponen (kecuali yang pertama)
  components.forEach((comp, index) => {
    comp.unlocked = index === 0;
  });

  console.log("Progres telah direset.");
}

const AppState = {
  MODE_SELECTION: "MODE_SELECTION",
  AVATAR_GREETING: "AVATAR_GREETING",
  LANDING: "LANDING",
  MENU: "MENU",
  VIEWER: "VIEWER",
  HELP: "HELP",
  MINI_QUIZ: "MINI_QUIZ",
  MINI_QUIZ_RESULT: "MINI_QUIZ_RESULT",
  QUIZ: "QUIZ",
  QUIZ_RESULT: "QUIZ_RESULT",
  QUIZ_REPORT: "QUIZ_REPORT",
  QUIZ_POST_COMPLETION_REPORT: "QUIZ_POST_COMPLETION_REPORT",
  POST_QUIZ_CHOICE: "POST_QUIZ_CHOICE",
  COMPLETION: "COMPLETION",
  CREDITS: "CREDITS",
};
let wasAnswerCorrect = false;
let wasMiniQuizCorrect = false;
let currentState = null;
let currentComponentIndex = -1;
let currentDescriptionIndex = 0;
let activeTextPanel = null;
let activeCreditsPanel = null;

function onVRSessionEnded() {
  // Hentikan model 3D yang sedang ditampilkan
  unloadComponentModel();

  // Aktifkan kembali kontrol orbit di mode desktop
  controls.enabled = true;

  // Kembali ke halaman pemilihan mode untuk alur yang konsisten
  changeState(AppState.MODE_SELECTION);
  console.log("Sesi VR berakhir, kembali ke pemilihan mode.");
}

function refreshUI(options = {}) {
  clearUI();
  switch (currentState) {
    case AppState.MODE_SELECTION:
      createModeSelectionPage();
      break;
    case AppState.AVATAR_GREETING:
      createAvatarGreetingPage(playerName, currentGreetingIndex);
      playCurrentGreetingAudio();
      break;
    case AppState.LANDING:
      createLandingPage(playerName);
      break;
    case AppState.MENU:
      const allUnlocked = highestComponentUnlocked >= components.length - 1;
      createMenuPage(allUnlocked, hasAttemptedQuiz);
      break;
    case AppState.VIEWER:
      if (currentComponentIndex !== -1) {
        showViewer(currentComponentIndex, options);
      }
      break;
    case AppState.MINI_QUIZ:
      createMiniQuizPage(components[currentComponentIndex]);
      break;
    case AppState.MINI_QUIZ_RESULT:
      createMiniQuizResultPage(
        components[currentComponentIndex],
        wasMiniQuizCorrect
      );
      break;
    case AppState.HELP:
      createHelpPanel();
      break;
    case AppState.QUIZ:
      // Kirim objek soal yang sudah diacak, bukan hanya indeks
      createQuizScreen(
        shuffledQuizData[currentQuestionIndex],
        currentQuestionIndex
      );
      break;
    case AppState.QUIZ_RESULT:
      // Kirim objek soal, indeks saat ini, dan total soal
      createQuizResultScreen(
        wasAnswerCorrect,
        shuffledQuizData[currentQuestionIndex],
        currentQuestionIndex, // <-- TAMBAHKAN INI
        shuffledQuizData.length // <-- DAN TAMBAHKAN INI
      );
      break;
    case AppState.QUIZ_REPORT:
      createQuizReportScreen(quizScore, hasAttemptedQuiz);
      break;
    case AppState.QUIZ_POST_COMPLETION_REPORT:
      createQuizReportScreen(quizScore, hasAttemptedQuiz, true);
      break;
    case AppState.POST_QUIZ_CHOICE:
      createPostQuizChoiceScreen();
      break;
    case AppState.COMPLETION:
      confettiEffect = createCompletionScreen(playerName);
      break;
    case AppState.CREDITS:
      createCreditsScreen(creditsData, currentCreditIndex);
      break;
  }
}

// ... (Fungsi showViewer tidak berubah)
function showViewer(index, options = {}) {
  const { isTransitioning = false } = options;
  const component = components[index];
  if (!component) return;

  currentComponentIndex = index;
  currentDescriptionIndex = 0;

  clearUI();

  if (component.modelFile) {
    const onModelReady = () => {
      // Callback ini akan dipanggil saat model selesai dianimasikan
      if (isTransitioning) {
        isChangingComponent = false;
        navButtons.forEach((btn) => setButtonEnabled(btn, true));
      }
    };

    if (isTransitioning) {
      loadComponentModel(component.modelFile, -1.5, onModelReady);
    } else {
      loadComponentModel(component.modelFile, 0);
    }
  } else {
    // Jika komponen tidak punya model (misal: Introduction), pastikan flag transisi di-reset
    if (isTransitioning) {
      setTimeout(() => {
        isChangingComponent = false;
        navButtons.forEach((btn) => setButtonEnabled(btn, true));
      }, CHANGE_DEBOUNCE_TIME);
    }
  }

  createViewerPage(
    component,
    currentComponentIndex,
    currentDescriptionIndex,
    highestComponentUnlocked
  );
  activeTextPanel = scene.getObjectByProperty("isScrollableText", true);
}
function checkOrientation() {
  // Cek apakah ini perangkat mobile (memiliki touch screen)
  const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Jika bukan mobile, jangan lakukan apa-apa
  if (!isMobile) {
    return;
  }

  const overlay = document.getElementById("orientation-overlay");
  const container = document.getElementById("container"); // Container utama aplikasi

  // Cek apakah layar dalam mode potret (tinggi > lebar)
  if (window.innerHeight > window.innerWidth) {
    // Tampilkan overlay dan sembunyikan aplikasi
    overlay.classList.remove("hidden");
    container.classList.add("hidden");
  } else {
    // Sembunyikan overlay dan tampilkan aplikasi
    overlay.classList.add("hidden");
    container.classList.remove("hidden");
  }
}
// main.js

async function init() {
  checkOrientation();
  window.addEventListener("resize", checkOrientation);

  stats = new Stats();
  document.body.appendChild(stats.dom);
  stats.dom.style.display = "none";

  // === Audio setup ===
  audioListener = new THREE.AudioListener();
  backgroundSound = new THREE.Audio(audioListener);
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);
  sound.userData = {};
  completionSound = new THREE.Audio(audioListener);
  greetingSound = new THREE.Audio(audioListener);

  // === Loader setup ===
  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("assets/basis/")
    .detectSupport(renderer);
  setupKTX2Loader(ktx2Loader);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("assets/draco/");
  setupDRACOLoader(dracoLoader);

  setupVR();

  renderer.xr.addEventListener("sessionstart", () => {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMappingExposure = 1.2;
    changeState(AppState.AVATAR_GREETING);
  });

  renderer.xr.addEventListener("sessionend", () => {
    changeState(AppState.MENU);
  });

  setupInteraction(handleInteraction);
  setupHTMLEvents();

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "q") {
      isDebugVisible = !isDebugVisible;
      stats.dom.style.display = isDebugVisible ? "block" : "none";
    }
  });

  // === 💾 AWAL LOGIKA PEMUATAN PROGRES ===
  const hasSavedProgress = loadProgress();

  await Promise.all([preloadAvatar(), preloadAssets()]);

  // === 🔁 Setelah preload selesai ===
  const splashScreen = document.getElementById("splash-screen");
  if (splashScreen) {
    splashScreen.classList.add("fade-out");
    const vrButton = document.getElementById("VRButton");
    if (vrButton) vrButton.classList.add("visible");
    setTimeout(() => splashScreen.remove(), 500);
  }

  if (hasSavedProgress && playerName) {
    // Jika ada progres, tampilkan layar pilihan
    document
      .getElementById("progress-choice-overlay")
      .classList.remove("hidden");
  } else {
    // Jika tidak ada, mulai dari layar selamat datang
    showWelcomeScreen();
  }

  // === Debug group & FPS label ===
  fpsLabel = createFpsLabel();
  fpsLabel.position.set(-0.4, 0.3, -0.7);
  debugGroup.add(fpsLabel);
  debugGroup.visible = false;
  scene.add(debugGroup);

  animate();
}

function updateActiveTextPanelTarget() {
  // Temukan panel teks di dalam scene
  activeTextPanel = scene.getObjectByProperty("isScrollableText", true);
  if (activeTextPanel) {
    const totalPages = activeTextPanel.userData.totalPages;
    // Hitung offset Y baru yang menjadi target animasi
    activeTextPanel.userData.targetOffsetY =
      (totalPages - 1 - currentDescriptionIndex) / totalPages;
    activeTextPanel.userData.currentPage = currentDescriptionIndex;
  }
}

// Fungsi ini hanya akan membuat ulang tombol dan indikator halaman, bukan panel teks utama
function reloadViewerNavigation() {
  const component = components[currentComponentIndex];
  if (!component) return;

  // Hapus UI yang ada (ini cepat karena hanya beberapa tombol)
  clearViewerUI();

  // Buat ulang halaman viewer. Karena panel teks sudah ada,
  // ini hanya akan membuat ulang tombol dan elemen lain di sekitarnya.
  createViewerPage(
    component,
    currentComponentIndex,
    currentDescriptionIndex,
    highestComponentUnlocked
  );

  // PENTING: Setelah UI dibuat ulang, kita harus mencari lagi panel teksnya.
  updateActiveTextPanelTarget();
}

// main.js

function updateActiveCreditsPanelTarget() {
  if (activeCreditsPanel) {
    const totalPages = activeCreditsPanel.userData.totalPages;
    activeCreditsPanel.userData.targetOffsetY =
      (totalPages - 1 - currentCreditIndex) / totalPages;
    activeCreditsPanel.userData.currentPage = currentCreditIndex;
  }
}

function reloadCreditsNavigation() {
  clearViewerUI();
  createCreditsScreen(creditsData, currentCreditIndex);
  // Tetapkan kembali panel aktif setelah UI digambar ulang
  activeCreditsPanel = scene.getObjectByProperty("isCreditsPanel", true);
}

// ... (Fungsi setupHTMLEvents sampai playSoundFromCache tidak berubah)
function setupHTMLEvents() {
  const welcomeNextBtn = document.getElementById("welcome-next-button");
  const nameContinueBtn = document.getElementById("continue-button");

  const continueProgressBtn = document.getElementById(
    "continue-progress-button"
  );
  const startNewBtn = document.getElementById("start-new-button");

  continueProgressBtn.addEventListener("click", () => {
    document.getElementById("progress-choice-overlay").classList.add("hidden");
    document.getElementById("container").classList.remove("hidden"); // <-- TAMBAHKAN INI
    startBackgroundMusic();
    shuffledQuizData = [...quizData];
    for (let i = shuffledQuizData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuizData[i], shuffledQuizData[j]] = [
        shuffledQuizData[j],
        shuffledQuizData[i],
      ];
    }

    // 2. Reset the quiz state variables
    currentQuestionIndex = 0;
    changeState(AppState.MODE_SELECTION);
  });

  startNewBtn.addEventListener("click", () => {
    // Reset progres, sembunyikan overlay, dan mulai dari layar selamat datang
    resetProgress();
    document.getElementById("progress-choice-overlay").classList.add("hidden");
    showWelcomeScreen();
  });

  welcomeNextBtn.addEventListener("click", () => {
    document.getElementById("welcome-overlay").classList.add("hidden");
    showNameInputScreen();
    startBackgroundMusic();
  });

  // --- AWAL MODIFIKASI ---
  // Logika diubah untuk menambahkan efek fade-out
  nameContinueBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("player-name-input");
    const nameValue = nameInput.value.trim(); // Ambil nilai dan hapus spasi

    if (nameValue === "") {
      // Jika nama kosong, tampilkan peringatan dan hentikan proses
      alert("Nama tidak boleh kosong!");
      return; // Hentikan eksekusi fungsi
    }

    playerName = nameInput.value.trim() || "Tamu";
    saveProgress();
    const nameOverlay = document.getElementById("name-input-overlay");
    const fadeOutDuration = 500; // Durasi dalam milidetik (0.5s)

    // 1. Tambahkan class fade-out untuk memulai animasi
    if (nameOverlay) {
      nameOverlay.classList.add("fade-out");
    }

    // 2. Tunggu animasi selesai sebelum mengubah state aplikasi
    setTimeout(() => {
      if (nameOverlay) {
        // 3. Sembunyikan elemen sepenuhnya setelah transisi
        nameOverlay.classList.add("hidden");
      }

      const vrButton = document.getElementById("VRButton");
      if (vrButton) {
        vrButton.remove();
      }
      document.getElementById("container").classList.remove("hidden");
      // 4. Ubah state ke pemilihan mode setelah overlay tidak terlihat
      changeState(AppState.MODE_SELECTION);
    }, fadeOutDuration);
  });
  // --- AKHIR MODIFIKASI ---
}
function showWelcomeScreen() {
  document.getElementById("welcome-overlay").classList.remove("hidden");
}

function showNameInputScreen() {
  const nameInput = document.getElementById("player-name-input");
  document.getElementById("name-input-overlay").classList.remove("hidden");
  nameInput.focus();
}
function preloadAssets() {
  return new Promise((resolve, reject) => {
    console.log("Preloading assets...");

    const tempTextureLoader = new THREE.TextureLoader(loadingManager);

    // 2. Buat promise untuk memuat tekstur logo
    const texturePromise = new Promise((res) => {
      // Cukup panggil .load(). Three.js akan otomatis menyimpan hasilnya di cache internal.
      // Ketika UI nanti meminta gambar yang sama, gambar akan diambil dari cache.
      tempTextureLoader.load(
        "assets/images/logo-kampus.png",
        () => {
          console.log("Logo texture preloaded and cached.");
          res(); // Selesaikan promise setelah gambar dimuat
        },
        undefined,
        (err) => {
          console.error("Failed to preload logo texture:", err);
          res(); // Tetap selesaikan promise agar aplikasi tidak macet jika logo gagal dimuat
        }
      );
    });

    // --- Preload model ---
    const modelPromises = components
      .filter((c) => c.modelFile && !modelCache[c.modelFile])
      .map(
        (c) =>
          new Promise((res, rej) => {
            loader.load(
              c.modelFile,
              (gltf) => {
                modelCache[c.modelFile] = gltf.scene;
                console.log(`Model di-cache: ${c.modelFile}`);
                res();
              },
              undefined,
              (err) => {
                console.error(`Failed to load model: ${c.modelFile}`, err);
                res(); // tetap resolve agar tidak stuck
              }
            );
          })
      );
    const greetingAudioFiles = GREETING_DATA("").map((g) => g.audioFile);
    // --- Preload audio ---
    const audioFilesToPreload = [
      "assets/audio/button_press.mp3",
      "assets/audio/button_confirm.mp3",
      "assets/audio/completion.mp3",
      "assets/audio/background_music.mp3",
      ...components.filter((c) => c.audioFile).map((c) => c.audioFile),
      ...greetingAudioFiles,
    ];
    const uniqueAudioFiles = [...new Set(audioFilesToPreload)];

    const audioPromises = uniqueAudioFiles.map(
      (file) =>
        new Promise((res, rej) => {
          audioLoader.load(
            file,
            (buffer) => {
              audioCache[file] = buffer;
              console.log(`Audio di-cache: ${file}`);
              res();
            },
            undefined,
            (err) => {
              console.error(`Failed to load audio: ${file}`, err);
              res(); // tetap resolve agar tidak stuck
            }
          );
        })
    );

    // Tunggu semua model + audio selesai
    Promise.all([...modelPromises, ...audioPromises, texturePromise]).then(
      () => {
        console.log("All assets including audio are loaded and cached!");
        resolve();
      }
    );
  });
}

function playSoundFromCache(audioObject, path, options = {}) {
  const { loop = false, volume = 1 } = options;

  if (audioObject && audioObject.isPlaying) {
    audioObject.stop();
  }

  const buffer = audioCache[path];
  if (buffer) {
    audioObject.setBuffer(buffer);
    audioObject.setLoop(loop);
    audioObject.setVolume(volume);
    audioObject.play();
  } else {
    // Fallback jika audio belum ter-cache
    audioLoader.load(path, (buf) => {
      audioCache[path] = buf;
      audioObject.setBuffer(buf);
      audioObject.setLoop(loop);
      audioObject.setVolume(volume);
      audioObject.play();
    });
  }
}

function playControlledSound(audioObject, path, options = {}) {
  const { loop = false, volume = 1 } = options;

  if (audioObject && audioObject.isPlaying) {
    audioObject.stop();
  }

  const buffer = audioCache[path];
  if (buffer) {
    audioObject.setBuffer(buffer);
    audioObject.setLoop(loop);
    audioObject.setVolume(volume);
    audioObject.play();
  }
}

function playOneShotSound(path, volume = 1) {
  const buffer = audioCache[path];
  if (buffer) {
    // Buat instance Audio baru setiap kali dipanggil
    const oneShotSound = new THREE.Audio(audioListener);
    oneShotSound.setBuffer(buffer);
    oneShotSound.setVolume(volume);
    oneShotSound.play();
  }
}
function playComponentAudio(audioFile) {
  if (!audioFile) return;
  if (sound.isPlaying && sound.userData.path === audioFile) {
    sound.stop();
    sound.userData.path = null;
  } else {
    playControlledSound(sound, audioFile, { volume: 0.5 });
    sound.userData.path = audioFile;
  }
}

function playButtonPressAudio() {
  playOneShotSound("assets/audio/button_press.mp3", 0.5);
}

function playButtonConfirmAudio() {
  playOneShotSound("assets/audio/button_confirm.mp3", 0.5);
}

// --- AWAL PERUBAHAN ---
// Fungsi baru untuk memutar audio sapaan saat ini
function playCurrentGreetingAudio() {
  const greetingData = GREETING_DATA(playerName)[currentGreetingIndex];
  if (greetingData && greetingData.audioFile) {
    // Menggunakan objek greetingSound yang didedikasikan
    playControlledSound(greetingSound, greetingData.audioFile, { volume: 1 });
  }
}
// --- AKHIR PERUBAHAN ---

function startBackgroundMusic() {
  // ... (kode fungsi ini tidak berubah)
  if (audioListener.context.state === "suspended") {
    audioListener.context.resume();
  }
  if (backgroundSound.isPlaying) return;
  playControlledSound(backgroundSound, "assets/audio/background_music.mp3", {
    loop: true,
    volume: 0.1,
  });
}
function playCompletionAudio() {
  playControlledSound(completionSound, "assets/audio/completion.mp3", {
    volume: 0.5,
  });
}
function stopAudio() {
  if (sound && sound.isPlaying) {
    sound.stop();
    sound.userData.path = null;
  }
  // --- PERUBAHAN BARU ---
  // Pastikan audio sapaan juga berhenti saat berpindah state
  if (greetingSound && greetingSound.isPlaying) {
    greetingSound.stop();
  }
  // --- AKHIR PERUBAHAN ---
}

// ... (Sisa kode sampai akhir file tetap sama)
function reloadViewer() {
  const component = components[currentComponentIndex];
  if (!component) return;

  clearViewerUI();
  createViewerPage(
    component,
    currentComponentIndex,
    currentDescriptionIndex,
    highestComponentUnlocked
  );
}
function updateScrollAnimation(panel, deltaTime) {
  if (panel && panel.userData.isScrollableText) {
    const texture = panel.material.map;
    const currentOffsetY = texture.offset.y;
    const targetOffsetY = panel.userData.targetOffsetY;

    if (Math.abs(currentOffsetY - targetOffsetY) > 0.001) {
      texture.offset.y = THREE.MathUtils.lerp(
        currentOffsetY,
        targetOffsetY,
        deltaTime * 10
      );
    } else {
      texture.offset.y = targetOffsetY;
    }
  }
}
function reloadCreditsScreen() {
  clearViewerUI();
  createCreditsScreen(creditsData, currentCreditIndex);
}
function changeState(newState, options = {}) {
  activeTextPanel = null;
  activeCreditsPanel = null;
  if (currentState === newState && newState !== AppState.VIEWER) {
    return;
  }
  if (currentState === AppState.COMPLETION) {
    stopConfettiEffect();
    if (completionSound && completionSound.isPlaying) {
      completionSound.stop();
    }
  }
  stopAudio();
  isFadingInUI = false;
  if (newState === AppState.MODE_SELECTION) {
    isFadingInUI = true;
  }
  const viewerContextStates = new Set([
    AppState.VIEWER,
    AppState.MINI_QUIZ,
    AppState.MINI_QUIZ_RESULT,
  ]);

  const isTransitioningWithinViewer =
    viewerContextStates.has(currentState) && viewerContextStates.has(newState);

  if (!isTransitioningWithinViewer) {
    unloadComponentModel();
  }

  currentState = newState;

  if (newState === AppState.AVATAR_GREETING) {
    currentGreetingIndex = 0;
  }

  if (newState === AppState.COMPLETION) {
    playCompletionAudio();
  }

  // --- AWAL PERUBAHAN ---
  // Tambahkan AppState.VIEWER agar avatar terlihat di halaman viewer
  if (
    newState === AppState.LANDING ||
    newState === AppState.QUIZ_REPORT ||
    newState === AppState.AVATAR_GREETING ||
    newState === AppState.VIEWER ||
    newState === AppState.MINI_QUIZ || // <-- TAMBAHKAN INI
    newState === AppState.MINI_QUIZ_RESULT // <-- TAMBAHKAN INI
  ) {
    toggleAvatarVisibility(true);
  } else {
    toggleAvatarVisibility(false);
  }

  refreshUI(options);
  if (!isDragging && !isTransitioningWithinViewer) {
    switch (newState) {
      case AppState.MODE_SELECTION:
      case AppState.AVATAR_GREETING:
      case AppState.LANDING:
      case AppState.MENU:
      case AppState.HELP:
      case AppState.QUIZ:
      case AppState.QUIZ_RESULT:
      case AppState.QUIZ_REPORT:
      case AppState.QUIZ_POST_COMPLETION_REPORT:
      case AppState.POST_QUIZ_CHOICE:
      case AppState.COMPLETION:
      case AppState.CREDITS:
        controls.enabled = true;
        camera.position.set(0, 1.6, 0.5);
        controls.target.set(0, 1.6, 0);
        break;

      case AppState.VIEWER:
      case AppState.MINI_QUIZ:
      case AppState.MINI_QUIZ_RESULT:
        controls.enabled = true;
        camera.position.set(0, 1.6, 0.5);
        controls.target.set(-0.2, 1.6, 0);
        break;
    }
  }
}

function handleInteraction(action) {
  const confirmActions = [
    "start_browser",
    "start_vr",
    "continue_to_landing",
    "next_greeting", // Aksi baru
    "start_learning",
    "help",
    "close_help",
    "show_quiz",
    "show_quiz_report",
    "answer_correct",
    "answer_incorrect",
    "next_question",
    "show_credits",
    "prev_description",
    "next_description",
    "next_component",
    "mini_quiz_correct",
    "mini_quiz_incorrect",
    "continue_after_mini_quiz",
    "prev_component",
  ];

  if (confirmActions.includes(action) || action.startsWith("select_")) {
    playButtonConfirmAudio();
  } else if (action !== "play_audio" && action !== "locked") {
    playButtonPressAudio();
  }

  switch (action) {
    case "start_browser":
      changeState(AppState.AVATAR_GREETING);
      break;
    case "start_vr":
      startVRSession(onVRSessionEnded);
      break;
    // --- PERUBAHAN BARU ---
    case "next_greeting":
      currentGreetingIndex++;
      refreshUI();
      break;
    // --- AKHIR PERUBAHAN ---
    case "continue_to_landing":
      changeState(AppState.LANDING);
      break;
    case "start_learning":
      changeState(AppState.MENU);
      break;
    case "help":
      changeState(AppState.HELP);
      break;
    case "close_help":
      changeState(AppState.LANDING);
      break;
    case "back_to_menu":
      // 1. Tambahkan guard clause dan kunci interaksi
      if (isChangingComponent) return;
      isChangingComponent = true;

      // 2. Buat callback yang akan dijalankan setelah animasi selesai
      const onAnimationMidpointBackToMenu = () => {
        // Model sudah tersembunyi, sekarang aman untuk mengubah state
        changeState(AppState.MENU);

        // Setelah state diubah, transisi selesai dan interaksi dibuka kembali
        isChangingComponent = false;
      };

      // 3. Mulai animasi untuk menyembunyikan model yang ada
      // Jika tidak ada model (misal di halaman Introduction), callback akan langsung dijalankan
      startModelAnimation(true, onAnimationMidpointBackToMenu);
      break;
    case "back_to_landing":
      changeState(AppState.LANDING);
      break;
    case "show_quiz":
      shuffledQuizData = [...quizData];
      for (let i = shuffledQuizData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQuizData[i], shuffledQuizData[j]] = [
          shuffledQuizData[j],
          shuffledQuizData[i],
        ];
      }

      currentQuestionIndex = 0;
      quizScore = 0;
      changeState(AppState.QUIZ);
      break;
    case "show_quiz_report":
      changeState(AppState.QUIZ_REPORT);
      break;
    case "answer_correct":
      wasAnswerCorrect = true;
      quizScore++;
      changeState(AppState.QUIZ_RESULT);
      break;
    case "answer_incorrect":
      wasAnswerCorrect = false;
      changeState(AppState.QUIZ_RESULT);
      break;
    case "next_question":
      currentQuestionIndex++;
      if (currentQuestionIndex >= shuffledQuizData.length) {
        hasAttemptedQuiz = true;
        saveProgress();
        changeState(AppState.QUIZ_POST_COMPLETION_REPORT);
      } else {
        changeState(AppState.QUIZ);
      }
      break;
    case "show_post_quiz_choice":
      changeState(AppState.POST_QUIZ_CHOICE);
      break;
    case "show_credits":
      currentCreditIndex = 0;
      changeState(AppState.CREDITS);
      // Setelah UI dibuat, cari dan atur panel aktif
      setTimeout(() => {
        activeCreditsPanel = scene.getObjectByProperty("isCreditsPanel", true);
      }, 0);
      break;
    case "prev_credit":
      if (currentCreditIndex > 0) {
        currentCreditIndex--;
        updateActiveCreditsPanelTarget(); // Panggil helper baru
        reloadCreditsNavigation(); // Panggil helper baru
      }
      break;

    case "next_credit":
      if (currentCreditIndex < creditsData.length - 1) {
        currentCreditIndex++;
        updateActiveCreditsPanelTarget(); // Panggil helper baru
        reloadCreditsNavigation(); // Panggil helper baru
      }
      break;
    case "prev_description":
      if (currentDescriptionIndex > 0) {
        currentDescriptionIndex--;
        // --- GANTI reloadViewer() DENGAN LOGIKA BARU ---
        updateActiveTextPanelTarget();
        reloadViewerNavigation(); // Fungsi baru untuk update tombol & indikator
      }
      break;
    case "next_description":
      const currentComp = components[currentComponentIndex];
      if (
        currentComp &&
        currentDescriptionIndex < currentComp.description.length - 1
      ) {
        currentDescriptionIndex++;
        // --- GANTI reloadViewer() DENGAN LOGIKA BARU ---
        updateActiveTextPanelTarget();
        reloadViewerNavigation(); // Fungsi baru untuk update tombol & indikator
      }
      break;

    case "next_component":
      if (isChangingComponent) return;
      isChangingComponent = true;

      navButtons.forEach((btn) => setButtonEnabled(btn, false, "..."));

      const onAnimationMidpointNext = () => {
        // --- PERBAIKAN DI SINI ---
        // Hapus variabel 'allComponentsUnlocked' yang tidak akurat.
        // Kondisi '!allComponentsUnlocked' juga dihapus.
        // Kuis sekarang akan muncul setiap kali pengguna berada di materi terjauh yang telah mereka buka.
        if (currentComponentIndex === highestComponentUnlocked) {
          changeState(AppState.MINI_QUIZ);
          isChangingComponent = false;
        }
        // Logika selanjutnya tidak berubah dan akan bekerja dengan benar setelah perbaikan di atas.
        else if (currentComponentIndex < components.length - 1) {
          currentComponentIndex++;
          changeState(AppState.VIEWER, { isTransitioning: true });
        } else {
          changeState(AppState.MENU);
          isChangingComponent = false;
        }
      };
      startModelAnimation(true, onAnimationMidpointNext);
      break;

    case "mini_quiz_correct":
      wasMiniQuizCorrect = true;
      changeState(AppState.MINI_QUIZ_RESULT);
      break;
    case "mini_quiz_incorrect":
      wasMiniQuizCorrect = false;
      changeState(AppState.MINI_QUIZ_RESULT);
      break;
    case "continue_after_mini_quiz":
      if (wasMiniQuizCorrect) {
        if (currentComponentIndex >= components.length - 1) {
          if (highestComponentUnlocked < components.length) {
            highestComponentUnlocked = components.length;
          }
          changeState(AppState.COMPLETION);
        } else {
          // --- AWAL PERBAIKAN ---
          // Logika lama yang menyebabkan bug telah dihapus.
          // Sekarang kita hanya perlu memajukan indeks dan memanggil
          // changeState dengan opsi transisi.
          const unlockedIndex = currentComponentIndex + 1;
          if (unlockedIndex < components.length) {
            components[unlockedIndex].unlocked = true;
            if (unlockedIndex > highestComponentUnlocked) {
              highestComponentUnlocked = unlockedIndex;
              saveProgress();
            }
          }

          // Tidak perlu menganimasikan model lama turun karena kita
          // datang dari layar non-model (hasil mini-kuis).
          // Cukup panggil changeState untuk memuat model baru dengan animasi naik.
          currentComponentIndex++;
          changeState(AppState.VIEWER, { isTransitioning: true });
          // --- AKHIR PERBAIKAN ---
        }
      } else {
        // Jika salah, kembali ke viewer untuk mencoba lagi (tanpa animasi)
        changeState(AppState.VIEWER);
      }
      break;
    case "prev_component":
      if (isChangingComponent) return;
      isChangingComponent = true;

      navButtons.forEach((btn) => setButtonEnabled(btn, false, "..."));

      const onAnimationMidpointPrev = () => {
        if (currentComponentIndex > 0) {
          currentComponentIndex--;
          changeState(AppState.VIEWER, { isTransitioning: true });
        } else {
          isChangingComponent = false; // Jika sudah di awal, batalkan
          navButtons.forEach((btn) => setButtonEnabled(btn, true));
        }
      };
      startModelAnimation(true, onAnimationMidpointPrev);
      break;
    case "play_audio":
      if (currentComponentIndex > -1) {
        playComponentAudio(components[currentComponentIndex].audioFile);
      }
      break;
    default:
      if (action.startsWith("select_")) {
        if (isChangingComponent) return;
        isChangingComponent = true;

        const index = parseInt(action.split("_")[1], 10);
        if (!isNaN(index) && index >= 0 && index < components.length) {
          currentComponentIndex = index;
          changeState(AppState.VIEWER, { isTransitioning: true });
        } else {
          isChangingComponent = false;
        }
      }
      break;
  }
}
function stopConfettiEffect() {
  if (confettiEffect) {
    confettiEffect.destroy();
    confettiEffect = null;
  }
}
function animate() {
  renderer.setAnimationLoop(render);
}
function render() {
  stats.update();
  const deltaTime = clock.getDelta();
  frameCount++;
  const now = performance.now();
  if (now - lastFpsUpdate >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = now;
  }
  if (isFadingInUI) {
    let allFadedIn = true;
    // Elemen mode selection ada di 'uiGroup'
    uiGroup.children.forEach((child) => {
      if (child.material && child.material.opacity < 1) {
        // Kecepatan fade-in (misal: selesai dalam 0.5 detik)
        child.material.opacity += deltaTime * 2.0;
        allFadedIn = false;
      } else if (child.material && child.material.opacity > 1) {
        // Pastikan tidak melebihi 1
        child.material.opacity = 1;
      }
    });

    // Jika semua elemen sudah muncul, hentikan animasi
    if (allFadedIn) {
      isFadingInUI = false;
    }
  }
  updateModelTransition(deltaTime);
  updateScrollAnimation(activeTextPanel, deltaTime);
  updateScrollAnimation(activeCreditsPanel, deltaTime);

  if (activeTypingAnimation) {
    activeTypingAnimation.update(deltaTime);
  }

  if (isDebugVisible) {
    // Posisikan panel debug mengikuti kamera di mode apapun
    debugGroup.position.copy(camera.position);
    debugGroup.quaternion.copy(camera.quaternion);
    updateFpsLabel(fpsLabel, fps);
  }
  // --- AKHIR LOGIKA DEBUG BARU ---

  if (isVRMode()) {
    handleVRHover();
    handleVRDrag();
    if (currentState !== AppState.MENU) {
      updateUIGroupPosition();
    }
  } else {
    controls.update();
  }

  if (currentState === AppState.VIEWER) {
    updateModelRotation();
  }

  if (confettiEffect) {
    confettiEffect.update(deltaTime);
  }
  updateAvatar(deltaTime, clock.getElapsedTime());

  renderer.render(scene, camera);
}

init();
