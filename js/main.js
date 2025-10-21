// =SIAP-IMPORT-SISTEM-DAN-LIBRARY-THREE.JS
import * as THREE from "three";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import Stats from "three/addons/libs/stats.module.js";

// ===============================================================
// IMPORT MODUL LOKAL APLIKASI
// ===============================================================

// Pengaturan Scene, Kamera, Renderer, dan Kontrol
import { scene, camera, renderer, controls, loadRoom } from "./scene-setup.js";

// Data untuk komponen dan kuis
import { components } from "./component-data.js";
import { quizData } from "./quiz-data.js";
import { creditsData } from "./credits-data.js";

// Fungsi-fungsi untuk membuat dan mengelola elemen UI
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
  uiGroup,
  GREETING_DATA,
  navButtons,
  updateAvatarDropAnimation,
  getActiveTypingAnimation,
  clearActiveTypingAnimation,
  stopAvatarDropAnimation,
  debugGroup,
  createFpsLabel,
  updateFpsLabel,
} from "./ui-creator.js";

// Fungsi untuk memuat model 3D (GLTF, DRACO, KTX2)
import {
  loader,
  loadComponentModel,
  unloadComponentModel,
  updateModelRotation,
  setupDRACOLoader,
  setupKTX2Loader,
  isDragging,
  modelCache,
  startModelAnimation,
  updateModelTransition,
  getCurrentModel,
  setRendererForCompilation,
  convertModelMaterials,
  preCompileModel,
  preloadLoader,
} from "./model-loader.js";

// Manajer untuk interaksi (mouse, VR controller)
import {
  setupInteraction,
  handleVRHover,
  handleVRDrag,
  setButtonEnabled,
} from "./interaction-manager.js";

// Manajer untuk sesi WebXR (VR)
import { setupVR, startVRSession, isVRMode } from "./vr-manager.js";

// Manajer untuk layar loading (splash screen)
import {
  loadingManager,
  setLoadingPhase,
  LoadingPhases,
  updateManualProgress,
} from "./loading-manager.js";

// ===============================================================
// KONSTANTA APLIKASI
// ===============================================================

const STORAGE_KEY = "webxr_learning_progress";
const CHANGE_DEBOUNCE_TIME = 500;
const LOADING_TIMEOUT = 60000; // 60 detik untuk koneksi lambat

// ===============================================================
// STATE APLIKASI (Variabel Global)
// ===============================================================

// --- State Audio ---
let audioListener, sound, backgroundSound, completionSound, greetingSound;
const audioLoader = new THREE.AudioLoader();
const audioCache = {};

// --- State Progres & Kuis ---
let shuffledQuizData = [];
let playerName = "";
let currentQuestionIndex = 0;
let quizScore = 0;
let hasAttemptedQuiz = false;
let highestComponentUnlocked = 0;
let currentGreetingIndex = 0;
let currentCreditIndex = 0;
let wasAnswerCorrect = false;
let wasMiniQuizCorrect = false;

// --- State UI & Transisi ---
let isChangingComponent = false;
let isChangingDescription = false;
let descriptionChangeTimeout = null;
let confettiEffect = null;
let isFadingInUI = false;
let activeTextPanel = null;
let activeCreditsPanel = null;

// --- State Core Loop & Debug ---
let stats;
const clock = new THREE.Clock();
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = performance.now();
let fpsLabel = null;
let animationFrameId = null;
let isDebugVisible = false;

// --- State Asinkron ---
const loadingTimeouts = new Map();
const audioTimeouts = new Map();

// --- State Machine Utama ---
let currentState = null;
let currentComponentIndex = -1;
let currentDescriptionIndex = 0;

// Enum untuk State Aplikasi
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

// Inisialisasi grup debug
if (debugGroup.parent === camera) {
  camera.remove(debugGroup);
}
if (!debugGroup.parent) {
  scene.add(debugGroup);
}

// ===============================================================
// --- LIFECYCLE APLIKASI UTAMA (INIT & RENDER LOOP) ---
// ===============================================================

/**
 * Inisialisasi seluruh aplikasi.
 * Memuat aset, mengatur environment, dan memulai state awal.
 */
async function init() {
  checkOrientation();
  window.addEventListener("resize", checkOrientation);

  // Setup Stats (FPS meter)
  stats = new Stats();
  document.body.appendChild(stats.dom);
  stats.dom.style.display = "none";

  // Setup listener pembersihan saat window ditutup
  window.addEventListener("beforeunload", () => {
    console.log("🧹 Cleaning up resources...");
    renderer.setAnimationLoop(null);
    stopAnimation();
    stopAudio();
    if (backgroundSound && backgroundSound.isPlaying) {
      backgroundSound.stop();
    }
    if (completionSound && completionSound.isPlaying) {
      completionSound.stop();
    }
    if (greetingSound && greetingSound.isPlaying) {
      greetingSound.stop();
    }
    if (stats && stats.dom && stats.dom.parentNode) {
      stats.dom.parentNode.removeChild(stats.dom);
    }
    if (confettiEffect && typeof confettiEffect.destroy === "function") {
      confettiEffect.destroy();
      confettiEffect = null;
    }
    clearAllTimeouts(); // Bersihkan semua timeout
    console.log("✓ Cleanup complete");
  });

  // Setup Audio
  audioListener = new THREE.AudioListener();
  backgroundSound = new THREE.Audio(audioListener);
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);
  sound.userData = {};
  completionSound = new THREE.Audio(audioListener);
  greetingSound = new THREE.Audio(audioListener);

  // Setup Loaders (KTX2 & DRACO)
  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("assets/basis/")
    .detectSupport(renderer);
  setupKTX2Loader(ktx2Loader);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("assets/draco/");
  setupDRACOLoader(dracoLoader);

  setRendererForCompilation(renderer, camera);

  // Memuat model ruangan
  loadRoom(loader);

  // Setup VR
  setupVR();
  renderer.xr.addEventListener("sessionstart", () => {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMappingExposure = 1.2;
    changeState(AppState.AVATAR_GREETING);
  });
  renderer.xr.addEventListener("sessionstart", onVRSessionStarted);
  renderer.xr.addEventListener("sessionend", onVRSessionEnded);

  // Setup Interaksi (Mouse & VR)
  setupInteraction(handleInteraction);
  setupHTMLEvents();

  // Setup Debug Toggle (Tombol 'Q')
  window.addEventListener("keydown", (event) => {
    if (event.key === "q" || event.key === "Q") {
      isDebugVisible = !isDebugVisible;
      debugGroup.visible = isDebugVisible;
      console.log("Debug panel:", isDebugVisible ? "visible" : "hidden");
    }
  });

  // Memuat progres yang tersimpan
  const hasSavedProgress = loadProgress();

  // Memuat aset penting (Avatar, Model, Audio)
  await preloadAvatar();
  await preloadModels();
  await preloadOtherAssets();

  // Sembunyikan Splash Screen
  const splashScreen = document.getElementById("splash-screen");
  if (splashScreen) {
    splashScreen.classList.add("fade-out");
    const vrButton = document.getElementById("VRButton");
    if (vrButton) vrButton.classList.add("visible");
    setTimeout(() => splashScreen.remove(), 500);
  }

  // Tampilkan pilihan progres jika ada
  if (hasSavedProgress && playerName) {
    document
      .getElementById("progress-choice-overlay")
      .classList.remove("hidden");
  } else {
    showWelcomeScreen();
  }

  // Setup label FPS untuk debug
  fpsLabel = createFpsLabel();
  debugGroup.visible = false;
  fpsLabel.position.set(-0.4, 0.3, -0.7);
  debugGroup.add(fpsLabel);
  scene.add(debugGroup);

  // Mulai render loop
  animate();
}

/**
 * Memulai render loop menggunakan setAnimationLoop.
 */
function animate() {
  animationFrameId = renderer.setAnimationLoop(render);
}

/**
 * Menghentikan render loop.
 */
function stopAnimation() {
  if (animationFrameId !== null) {
    renderer.setAnimationLoop(null);
    animationFrameId = null;
  }
}

/**
 * Fungsi render utama yang dipanggil setiap frame.
 */
function render() {
  stats.update();
  const deltaTime = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // --- Update FPS ---
  frameCount++;
  const now = performance.now();
  if (now - lastFpsUpdate >= 500) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = now;

    if (isDebugVisible) {
      updateFpsLabel(fpsLabel, fps);
    }
  }

  // --- Update Animasi UI ---
  if (isFadingInUI) {
    let allFadedIn = true;
    uiGroup.children.forEach((child) => {
      if (child.material && child.material.opacity < 1) {
        child.material.opacity += deltaTime * 2.0;
        allFadedIn = false;
      } else if (child.material && child.material.opacity > 1) {
        child.material.opacity = 1;
      }
    });
    if (allFadedIn) isFadingInUI = false;
  }

  updateModelTransition(deltaTime);
  updateScrollAnimation(activeTextPanel, deltaTime);
  updateScrollAnimation(activeCreditsPanel, deltaTime);

  const typingAnim = getActiveTypingAnimation();
  if (typingAnim) {
    typingAnim.update(deltaTime);
  }

  // --- Update Debug Panel ---
  if (isDebugVisible) {
    const tablePosition = new THREE.Vector3(1, 0.8, -1.0);
    debugGroup.position.copy(tablePosition);
    debugGroup.lookAt(camera.position);
    updateFpsLabel(fpsLabel, fps);
  }

  // --- Update Kontrol & Interaksi ---
  if (isVRMode()) {
    handleVRHover();
    handleVRDrag();
    if (currentState !== AppState.MENU) {
      updateUIGroupPosition();
    }
  } else {
    controls.update();
  }

  // --- Update Animasi Model & Efek ---
  if (currentState === AppState.VIEWER) {
    updateModelRotation();
  }
  if (confettiEffect) {
    confettiEffect.update(deltaTime);
  }
  updateAvatar(deltaTime, elapsedTime);

  // --- Render ---
  renderer.render(scene, camera);
}

// ===============================================================
// --- MANAJEMEN STATE APLIKASI ---
// ===============================================================

/**
 * Mengganti state aplikasi dan memuat ulang UI.
 * @param {string} newState - State baru dari enum AppState.
 * @param {object} options - Opsi tambahan (mis: isTransitioning).
 */
function changeState(newState, options = {}) {
  // requestAnimationFrame(() => {
  activeTextPanel = null;
  activeCreditsPanel = null;

  if (currentState === newState && newState !== AppState.VIEWER) {
    return;
  }

  // Cleanup state sebelumnya (jika perlu)
  if (
    currentState === AppState.AVATAR_GREETING &&
    newState !== AppState.AVATAR_GREETING
  ) {
    stopAudio();
    clearActiveTypingAnimation();
    stopAvatarDropAnimation();
    console.log("✓ Avatar greeting cleanup complete");
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

  // Cek apakah transisi terjadi di dalam konteks viewer
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

  // Setup state baru (jika perlu)
  if (newState === AppState.AVATAR_GREETING) {
    currentGreetingIndex = 0;
  }

  if (newState === AppState.COMPLETION) {
    playCompletionAudio();
  }

  // Atur visibilitas avatar
  if (
    newState === AppState.LANDING ||
    newState === AppState.QUIZ_REPORT ||
    newState === AppState.AVATAR_GREETING ||
    newState === AppState.VIEWER ||
    newState === AppState.MINI_QUIZ ||
    newState === AppState.MINI_QUIZ_RESULT
  ) {
    toggleAvatarVisibility(true);
  } else {
    toggleAvatarVisibility(false);
  }

  // Refresh UI
  refreshUI(options);

  // Reset posisi kamera jika tidak sedang drag/transisi
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
        camera.position.set(0, 1.6, 1.5);
        controls.target.set(0, 1.6, 1);
        break;

      case AppState.VIEWER:
      case AppState.MINI_QUIZ:
      case AppState.MINI_QUIZ_RESULT:
        controls.enabled = true;
        camera.position.set(0, 1.6, 1.5);
        controls.target.set(-0.2, 1.6, 1);
        break;
    }
  }
  // });
}

/**
 * Handler utama untuk semua interaksi UI (klik tombol).
 * @param {string} action - Nama aksi dari tombol yang diklik.
 */
function handleInteraction(action) {
  const confirmActions = [
    "start_browser",
    "start_vr",
    "continue_to_landing",
    "next_greeting",
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

  // Memainkan audio feedback tombol
  if (confirmActions.includes(action) || action.startsWith("select_")) {
    playButtonConfirmAudio();
  } else if (action !== "play_audio" && action !== "locked") {
    playButtonPressAudio();
  }

  // Switch case untuk semua aksi
  switch (action) {
    case "start_browser":
      changeState(AppState.AVATAR_GREETING);
      break;
    case "start_vr":
      startVRSession(onVRSessionEnded, onVRSessionStarted);
      break;
    case "next_greeting":
      currentGreetingIndex++;
      refreshUI();
      break;
    case "continue_to_landing":
      stopAudio();
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
      if (isChangingComponent) return;
      isChangingComponent = true;
      startModelAnimation(true, () => {
        changeState(AppState.MENU);
        isChangingComponent = false;
      });
      break;
    case "back_to_landing":
      if (currentState === AppState.AVATAR_GREETING) {
        stopAudio();
        clearActiveTypingAnimation();
        stopAvatarDropAnimation();
      }
      changeState(AppState.LANDING);
      break;
    case "show_quiz":
      // Acak data kuis
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
      setTimeout(() => {
        activeCreditsPanel = scene.getObjectByProperty("isCreditsPanel", true);
      }, 0);
      break;
    case "prev_credit":
      if (currentCreditIndex > 0) {
        currentCreditIndex--;
        updateActiveCreditsPanelTarget();
        reloadCreditsNavigation();
      }
      break;
    case "next_credit":
      if (currentCreditIndex < creditsData.length - 1) {
        currentCreditIndex++;
        updateActiveCreditsPanelTarget();
        reloadCreditsNavigation();
      }
      break;
    case "prev_description":
      changeDescription("prev");
      break;
    case "next_description":
      changeDescription("next");
      break;
    case "next_component":
      if (isChangingComponent) return;
      isChangingComponent = true;
      navButtons.forEach((btn) => setButtonEnabled(btn, false, "..."));

      const onAnimationMidpointNext = () => {
        if (currentComponentIndex === highestComponentUnlocked) {
          changeState(AppState.MINI_QUIZ);
          isChangingComponent = false;
        } else if (currentComponentIndex < components.length - 1) {
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
          const unlockedIndex = currentComponentIndex + 1;
          if (unlockedIndex < components.length) {
            components[unlockedIndex].unlocked = true;
            if (unlockedIndex > highestComponentUnlocked) {
              highestComponentUnlocked = unlockedIndex;
              saveProgress();
            }
          }
          currentComponentIndex++;
          changeState(AppState.VIEWER, { isTransitioning: true });
        }
      } else {
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
          isChangingComponent = false;
          navButtons.forEach((btn) => setButtonEnabled(btn, true));
        }
      };
      startModelAnimation(true, onAnimationMidpointPrev);
      break;
    case "play_audio":
      if (currentComponentIndex > -1 && components[currentComponentIndex]) {
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

/**
 * Mengganti deskripsi di viewer (maju atau mundur).
 * @param {string} direction - "prev" atau "next".
 */
function changeDescription(direction) {
  if (isChangingComponent || isChangingDescription) {
    return;
  }

  const component = components[currentComponentIndex];
  if (!component) return;

  let newIndex = currentDescriptionIndex;

  if (direction === "prev") {
    if (currentDescriptionIndex > 0) {
      newIndex = currentDescriptionIndex - 1;
    } else {
      return; // Sudah di halaman pertama
    }
  } else if (direction === "next") {
    if (currentDescriptionIndex < component.description.length - 1) {
      newIndex = currentDescriptionIndex + 1;
    } else {
      return; // Sudah di halaman terakhir
    }
  }

  isChangingDescription = true;
  currentDescriptionIndex = newIndex;

  // Nonaktifkan tombol navigasi deskripsi sementara
  navButtons.forEach((btn) => {
    const action = btn.userData.action;
    if (action === "prev_description" || action === "next_description") {
      setButtonEnabled(btn, false);
    }
  });

  if (descriptionChangeTimeout) {
    clearTimeout(descriptionChangeTimeout);
  }

  // Update target scroll
  updateActiveTextPanelTarget();

  // Beri jeda singkat untuk animasi scroll sebelum render ulang tombol
  descriptionChangeTimeout = setTimeout(() => {
    reloadViewerNavigation();
    isChangingDescription = false;

    // Aktifkan/Nonaktifkan tombol berdasarkan state baru
    const comp = components[currentComponentIndex];
    if (comp) {
      navButtons.forEach((btn) => {
        const action = btn.userData.action;
        if (action === "prev_description") {
          setButtonEnabled(btn, currentDescriptionIndex > 0);
        } else if (action === "next_description") {
          setButtonEnabled(
            btn,
            currentDescriptionIndex < comp.description.length - 1
          );
        }
      });
    }
    descriptionChangeTimeout = null;
  }, 150);
}

// ===============================================================
// --- MANAJEMEN UI & SCENE ---
// ===============================================================

/**
 * Memuat ulang UI berdasarkan state aplikasi saat ini.
 * @param {object} options - Opsi tambahan untuk diteruskan ke `create...` functions.
 */
function refreshUI(options = {}) {
  clearUI();
  switch (currentState) {
    case AppState.MODE_SELECTION:
      createModeSelectionPage();
      break;
    case AppState.AVATAR_GREETING:
      createAvatarGreetingPage(playerName, currentGreetingIndex);
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
      createQuizScreen(
        shuffledQuizData[currentQuestionIndex],
        currentQuestionIndex
      );
      break;
    case AppState.QUIZ_RESULT:
      createQuizResultScreen(
        wasAnswerCorrect,
        shuffledQuizData[currentQuestionIndex],
        currentQuestionIndex,
        shuffledQuizData.length
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

// ===============================================================
// START FUNGSI UTAMA `showViewer`
// ===============================================================
/**
 * Logika utama untuk menampilkan halaman viewer komponen.
 * @param {number} index - Index komponen yang akan ditampilkan.
 * @param {object} options - Opsi, terutama `isTransitioning`.
 */
function showViewer(index, options = {}) {
  const { isTransitioning = false } = options;
  const component = components[index];
  if (!component) return;

  currentComponentIndex = index;
  currentDescriptionIndex = 0;

  clearUI();

  // 1. Buat UI viewer yang baru.
  createViewerPage(
    component,
    currentComponentIndex,
    currentDescriptionIndex,
    highestComponentUnlocked,
    hasAttemptedQuiz
  );
  activeTextPanel = scene.getObjectByProperty("isScrollableText", true);

  // 2. JIKA sedang dalam mode transisi, nonaktifkan SEMUA tombol interaktif.
  if (isTransitioning) {
    navButtons.forEach((btn) => {
      setButtonEnabled(btn, false, "...");
    });
  }

  // 3. Definisikan callback yang akan dijalankan setelah model & animasi selesai.
  const onModelReady = () => {
    if (isTransitioning) {
      isChangingComponent = false;
      // Gambar ulang UI. Karena `isChangingComponent` sudah false,
      // semua tombol akan aktif kembali secara otomatis.
      reloadViewerNavigation();
    }
  };

  // 4. Mulai proses loading model.
  if (component.modelFile) {
    loadComponentModel(component.modelFile, -1.5, onModelReady);
  } else {
    // Jika tidak ada model (mis. Intro), jalankan callback setelah jeda singkat.
    setTimeout(onModelReady, CHANGE_DEBOUNCE_TIME);
  }
}
// ===============================================================
// END FUNGSI UTAMA `showViewer`
// ===============================================================

/**
 * Menggambar ulang navigasi pada halaman viewer (tombol, page indicator).
 */
function reloadViewerNavigation() {
  const component = components[currentComponentIndex];
  if (!component) return;

  clearViewerUI();
  createViewerPage(
    component,
    currentComponentIndex,
    currentDescriptionIndex,
    highestComponentUnlocked,
    hasAttemptedQuiz
  );
}

/**
 * Menggambar ulang navigasi pada halaman credits (tombol, page indicator).
 */
function reloadCreditsNavigation() {
  clearViewerUI();
  createCreditsScreen(creditsData, currentCreditIndex);
  activeCreditsPanel = scene.getObjectByProperty("isCreditsPanel", true);
}

/**
 * Mengupdate target offset Y untuk animasi scroll panel teks.
 */
function updateActiveTextPanelTarget() {
  activeTextPanel = scene.getObjectByProperty("isScrollableText", true);
  if (activeTextPanel) {
    const totalPages = activeTextPanel.userData.totalPages;
    activeTextPanel.userData.targetOffsetY =
      (totalPages - 1 - currentDescriptionIndex) / totalPages;
    activeTextPanel.userData.currentPage = currentDescriptionIndex;
  }
}

/**
 * Mengupdate target offset Y untuk animasi scroll panel credits.
 */
function updateActiveCreditsPanelTarget() {
  if (activeCreditsPanel) {
    const totalPages = activeCreditsPanel.userData.totalPages;
    activeCreditsPanel.userData.targetOffsetY =
      (totalPages - 1 - currentCreditIndex) / totalPages;
    activeCreditsPanel.userData.currentPage = currentCreditIndex;
  }
}

/**
 * Handler yang dipanggil saat sesi VR berakhir.
 */
function onVRSessionEnded() {
  unloadComponentModel();
  controls.enabled = true;
  changeState(AppState.MODE_SELECTION);
  console.log("Sesi VR berakhir, kembali ke pemilihan mode.");
}
function onVRSessionStarted() {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMappingExposure = 1.2;
  changeState(AppState.AVATAR_GREETING);
}

/**
 * Menghentikan dan membersihkan efek confetti.
 */
function stopConfettiEffect() {
  if (confettiEffect) {
    if (typeof confettiEffect.destroy === "function") {
      confettiEffect.destroy();
    }
    confettiEffect = null;
  }
}

/**
 * (Duplikat?) Menggambar ulang viewer.
 * @note `reloadViewerNavigation` tampaknya menjadi fungsi yang lebih spesifik dan digunakan.
 */
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

/**
 * Menjalankan animasi interpolasi (lerp) untuk scroll panel.
 * @param {THREE.Mesh} panel - Panel yang memiliki tekstur scrollable.
 * @param {number} deltaTime - Waktu delta dari render loop.
 */
function updateScrollAnimation(panel, deltaTime) {
  if (
    panel &&
    (panel.userData.isScrollableText || panel.userData.isCreditsPanel)
  ) {
    const texture = panel.material.map;
    const currentOffsetY = texture.offset.y;
    const targetOffsetY = panel.userData.targetOffsetY;

    if (Math.abs(currentOffsetY - targetOffsetY) > 0.001) {
      texture.offset.y = THREE.MathUtils.lerp(
        currentOffsetY,
        targetOffsetY,
        deltaTime * 10 // Kecepatan animasi scroll
      );
    } else {
      texture.offset.y = targetOffsetY;
    }
  }
}

// ===============================================================
// --- MANAJEMEN PROGRES (LOCALSTORAGE) ---
// ===============================================================

/**
 * Menyimpan progres pengguna ke LocalStorage.
 */
function saveProgress() {
  try {
    const progress = {
      playerName: playerName,
      highestComponentUnlocked: highestComponentUnlocked,
      quizScore: quizScore,
      hasAttemptedQuiz: hasAttemptedQuiz,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    console.log("Progres disimpan:", progress);
  } catch (error) {
    logError("Gagal menyimpan progress:", error);
  }
}

/**
 * Memuat progres pengguna dari LocalStorage.
 * @returns {boolean} - True jika progres berhasil dimuat.
 */
function loadProgress() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const progress = JSON.parse(savedData);
      playerName = progress.playerName || "";
      highestComponentUnlocked = progress.highestComponentUnlocked || 0;
      quizScore = progress.quizScore || 0;
      hasAttemptedQuiz = progress.hasAttemptedQuiz || false;

      // Unlock komponen berdasarkan progres
      for (let i = 0; i <= highestComponentUnlocked; i++) {
        if (components[i]) {
          components[i].unlocked = true;
        }
      }
      console.log("Progres dimuat:", progress);
      return true;
    }
    return false;
  } catch (error) {
    logError("Gagal memuat progress:", error);
    return false;
  }
}

/**
 * Menghapus progres pengguna dari LocalStorage dan me-reset state.
 */
function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);

  playerName = "";
  highestComponentUnlocked = 0;
  quizScore = 0;
  hasAttemptedQuiz = false;

  // Reset status unlock komponen (kecuali yang pertama)
  components.forEach((comp, index) => {
    comp.unlocked = index === 0;
  });

  console.log("Progres telah direset.");
}

// ===============================================================
// --- MANAJEMEN ASET (PRELOADING) ---
// ===============================================================

/**
 * Memuat semua model 3D komponen yang didefinisikan di `component-data.js`.
 * @returns {Promise<void>}
 */
function preloadModels() {
  return new Promise((resolve) => {
    setLoadingPhase(LoadingPhases.LOADING_HIGH);
    const modelFiles = components
      .filter((c) => c.modelFile)
      .map((c) => c.modelFile);

    if (modelFiles.length === 0) {
      resolve();
      return;
    }

    let modelsLoaded = 0;
    let modelsWithErrors = 0;
    const totalModels = modelFiles.length;

    const checkComplete = () => {
      if (modelsLoaded + modelsWithErrors >= totalModels) {
        resolve();
      }
    };

    modelFiles.forEach((file) => {
      const timeoutId = setTimeout(() => {
        logError(
          `Timeout memuat model: ${file}`,
          new Error("Model load timeout")
        );
        modelsWithErrors++;
        loadingTimeouts.delete(file);
        updateManualProgress(
          modelsLoaded + modelsWithErrors,
          totalModels,
          "Loading 3D models..."
        );
        checkComplete();
      }, LOADING_TIMEOUT);

      loadingTimeouts.set(file, timeoutId);

      // Gunakan preloadLoader (tanpa loading manager utama)
      preloadLoader.load(
        file,
        (gltf) => {
          const tid = loadingTimeouts.get(file);
          if (tid) {
            clearTimeout(tid);
            loadingTimeouts.delete(file);
          }
          // Konversi material dan pre-compile shader
          convertModelMaterials(gltf.scene);
          preCompileModel(gltf.scene);
          modelCache[file] = gltf.scene; // Simpan di cache
          modelsLoaded++;
          updateManualProgress(
            modelsLoaded + modelsWithErrors,
            totalModels,
            "Loading 3D models..."
          );
          checkComplete();
        },
        undefined,
        (error) => {
          const tid = loadingTimeouts.get(file);
          if (tid) {
            clearTimeout(tid);
            loadingTimeouts.delete(file);
          }
          logError(`Failed to load model ${file}`, error);
          modelsWithErrors++;
          updateManualProgress(
            modelsLoaded + modelsWithErrors,
            totalModels,
            "Loading 3D models..."
          );
          checkComplete();
        }
      );
    });
  });
}

/**
 * Memuat aset lain seperti tekstur dan file audio.
 * @returns {Promise<void>}
 */
function preloadOtherAssets() {
  return new Promise((resolve) => {
    setLoadingPhase(LoadingPhases.LOADING_MEDIUM);
    updateLoadingText("Loading textures and audio...");

    // 1. Preload Tekstur
    const tempTextureLoader = new THREE.TextureLoader();
    const texturePromise = new Promise((res) => {
      tempTextureLoader.load(
        "assets/images/logo-kampus.png",
        () => {
          console.log("✓ Texture loaded");
          res();
        },
        undefined,
        () => {
          logError(
            "Texture failed to load: assets/images/logo-kampus.png",
            new Error("Texture load error")
          );
          res(); // Tetap resolve agar loading tidak berhenti
        }
      );
    });

    // 2. Preload Audio
    const greetingAudioFiles = GREETING_DATA("").map((g) => g.audioFile);
    const allAudioFiles = [
      "assets/audio/sfx/button_press.ogg",
      "assets/audio/sfx/button_confirm.ogg",
      "assets/audio/sfx/completion.ogg",
      "assets/audio/music/background_music.ogg",
      ...components.filter((c) => c.audioFile).map((c) => c.audioFile),
      ...greetingAudioFiles,
    ];
    const uniqueAudioFiles = [...new Set(allAudioFiles)];

    let audioLoaded = 0;
    let audioErrors = 0;
    const totalAudio = uniqueAudioFiles.length;

    const audioPromises = uniqueAudioFiles.map(
      (file) =>
        new Promise((res) => {
          const timeoutId = setTimeout(() => {
            logError(
              `Timeout memuat audio: ${file}`,
              new Error("Audio load timeout")
            );
            audioTimeouts.delete(file);
            audioErrors++;
            updateManualProgress(
              audioLoaded + audioErrors,
              totalAudio,
              "Loading audio files..."
            );
            res();
          }, LOADING_TIMEOUT);

          audioTimeouts.set(file, timeoutId);

          audioLoader.load(
            file,
            (buffer) => {
              const tid = audioTimeouts.get(file);
              if (tid) {
                clearTimeout(tid);
                audioTimeouts.delete(file);
              }
              audioCache[file] = buffer; // Simpan buffer di cache
              audioLoaded++;
              updateManualProgress(
                audioLoaded + audioErrors,
                totalAudio,
                "Loading audio files..."
              );
              res();
            },
            undefined,
            () => {
              const tid = audioTimeouts.get(file);
              if (tid) {
                clearTimeout(tid);
                audioTimeouts.delete(file);
              }
              logError(`Audio failed: ${file}`, new Error("Audio load error"));
              audioErrors++;
              updateManualProgress(
                audioLoaded + audioErrors,
                totalAudio,
                "Loading audio files..."
              );
              res();
            }
          );
        })
    );

    // 3. Tunggu semua selesai
    Promise.all([texturePromise, ...audioPromises]).then(() => {
      console.log(`✓ All assets loaded. Audio: ${audioLoaded}/${totalAudio}`);
      setLoadingPhase(LoadingPhases.COMPLETE);
      resolve();
    });
  });
}

// ===============================================================
// --- MANAJEMEN AUDIO ---
// ===============================================================

/**
 * Memainkan suara yang dapat dikontrol (stop, loop).
 * @param {THREE.Audio} audioObject - Objek audio (mis: `sound`, `backgroundSound`).
 * @param {string} path - Path ke file audio (key di `audioCache`).
 * @param {object} options - Opsi (loop, volume).
 */
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

/**
 * Memainkan suara sekali jalan (fire-and-forget).
 * @param {string} path - Path ke file audio (key di `audioCache`).
 * @param {number} volume - Volume suara.
 */
function playOneShotSound(path, volume = 1) {
  const buffer = audioCache[path];
  if (buffer) {
    const oneShotSound = new THREE.Audio(audioListener);
    oneShotSound.setBuffer(buffer);
    oneShotSound.setVolume(volume);
    oneShotSound.onEnded = () => {
      oneShotSound.disconnect();
      camera.remove(oneShotSound); // Bersihkan setelah selesai
    };
    oneShotSound.play();
  }
}

/**
 * Memainkan atau menghentikan audio narasi komponen.
 * @param {string} audioFile - Path ke file audio.
 */
function playComponentAudio(audioFile) {
  if (!audioFile) return;
  // Jika audio yang sama diputar, hentikan (toggle)
  if (sound.isPlaying && sound.userData.path === audioFile) {
    sound.stop();
    sound.userData.path = null;
  } else {
    playControlledSound(sound, audioFile, { volume: 0.5 });
    sound.userData.path = audioFile;
  }
}

/** Memainkan audio feedback tombol (klik biasa). */
function playButtonPressAudio() {
  playOneShotSound("assets/audio/sfx/button_press.ogg", 0.5);
}

/** Memainkan audio feedback tombol (konfirmasi/lanjut). */
function playButtonConfirmAudio() {
  playOneShotSound("assets/audio/sfx/button_confirm.ogg", 0.5);
}

/** Memainkan audio greeting avatar saat ini. */
function playCurrentGreetingAudio() {
  const greetingData = GREETING_DATA(playerName)[currentGreetingIndex];
  if (greetingData && greetingData.audioFile) {
    playControlledSound(greetingSound, greetingData.audioFile, { volume: 1 });
  }
}

/** Memulai musik latar belakang (looping). */
function startBackgroundMusic() {
  if (audioListener.context.state === "suspended") {
    audioListener.context.resume();
  }
  if (backgroundSound.isPlaying) return;
  playControlledSound(
    backgroundSound,
    "assets/audio/music/background_music.ogg",
    {
      loop: true,
      volume: 0.1,
    }
  );
}

/** Memainkan audio saat materi selesai. */
function playCompletionAudio() {
  playControlledSound(completionSound, "assets/audio/sfx/completion.ogg", {
    volume: 0.5,
  });
}

/** Menghentikan semua audio narasi dan efek (kecuali musik latar). */
function stopAudio() {
  if (sound && sound.isPlaying) {
    sound.stop();
    sound.userData.path = null;
  }
  if (greetingSound && greetingSound.isPlaying) {
    greetingSound.stop();
    console.log("✓ Greeting audio stopped");
  }
  if (completionSound && completionSound.isPlaying) {
    completionSound.stop();
  }
}

/** Callback global untuk dipanggil oleh ui-creator.js setelah animasi avatar. */
window.playCurrentGreetingAudioCallback = function () {
  playCurrentGreetingAudio();
};

// ===============================================================
// --- MANAJEMEN EVENT HTML & DOM ---
// ===============================================================

/**
 * Mengatur semua event listener untuk elemen HTML (overlay nama, dll).
 */
function setupHTMLEvents() {
  const welcomeNextBtn = document.getElementById("welcome-next-button");
  const nameContinueBtn = document.getElementById("continue-button");
  const continueProgressBtn = document.getElementById(
    "continue-progress-button"
  );
  const startNewBtn = document.getElementById("start-new-button");

  // Tombol "Lanjutkan Progres"
  continueProgressBtn.addEventListener("click", () => {
    document.getElementById("progress-choice-overlay").classList.add("hidden");
    document.getElementById("container").classList.remove("hidden");
    startBackgroundMusic();
    // Acak kuis saat melanjutkan
    shuffledQuizData = [...quizData];
    for (let i = shuffledQuizData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuizData[i], shuffledQuizData[j]] = [
        shuffledQuizData[j],
        shuffledQuizData[i],
      ];
    }
    currentQuestionIndex = 0;
    changeState(AppState.MODE_SELECTION);
  });

  // Tombol "Mulai Baru"
  startNewBtn.addEventListener("click", () => {
    resetProgress();
    document.getElementById("progress-choice-overlay").classList.add("hidden");
    showWelcomeScreen();
  });

  // Tombol "Next" di Welcome Screen
  welcomeNextBtn.addEventListener("click", () => {
    document.getElementById("welcome-overlay").classList.add("hidden");
    showNameInputScreen();
  });

  // Tombol "Continue" di Input Nama
  nameContinueBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("player-name-input");
    let nameValue = nameInput.value.trim();
    nameValue = sanitizeInput(nameValue); // Sanitasi input

    const nameOverlay = document.getElementById("name-input-overlay");

    // Validasi nama tidak boleh kosong
    if (nameValue === "") {
      nameInput.classList.add("shake");
      setTimeout(() => {
        nameInput.classList.remove("shake");
      }, 500);
      return;
    }

    playerName = nameValue || "Tamu";
    saveProgress();

    // Transisi fade-out overlay
    const fadeOutDuration = 500;
    if (nameOverlay) {
      nameOverlay.classList.add("fade-out");
    }

    setTimeout(() => {
      if (nameOverlay) {
        nameOverlay.classList.add("hidden");
      }
      const vrButton = document.getElementById("VRButton");
      if (vrButton) vrButton.remove();
      document.getElementById("container").classList.remove("hidden");
      startBackgroundMusic();
      changeState(AppState.MODE_SELECTION);
    }, fadeOutDuration);
  });
}

/** Menampilkan overlay selamat datang. */
function showWelcomeScreen() {
  document.getElementById("welcome-overlay").classList.remove("hidden");
}

/** Menampilkan overlay input nama. */
function showNameInputScreen() {
  const nameInput = document.getElementById("player-name-input");
  document.getElementById("name-input-overlay").classList.remove("hidden");
  nameInput.focus();
}

/** Mengupdate teks pada splash screen loading. */
function updateLoadingText(message) {
  const loadingTextElement = document.getElementById("loading-text");
  if (loadingTextElement) {
    loadingTextElement.textContent = message;
  }
}

/** Memeriksa orientasi perangkat (khusus mobile) dan menampilkan overlay jika potret. */
function checkOrientation() {
  const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (!isMobile) {
    return;
  }

  const overlay = document.getElementById("orientation-overlay");
  const container = document.getElementById("container");

  if (window.innerHeight > window.innerWidth) {
    // Mode Potret
    overlay.classList.remove("hidden");
    container.classList.add("hidden");
  } else {
    // Mode Lanskap
    overlay.classList.add("hidden");
    container.classList.remove("hidden");
  }
}

// ===============================================================
// --- FUNGSI UTILITAS ---
// ===============================================================

/**
 * Membersihkan input string dari potensi XSS sederhana.
 * @param {string} str - String input.
 * @returns {string} - String yang sudah dibersihkan.
 */
function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.textContent || temp.innerText || "";
}

/**
 * Log error ke konsol.
 * @param {string} message - Pesan error.
 * @param {Error} error - Objek error.
 */
function logError(message, error) {
  console.error(message, error);
  // Di masa depan, bisa ditambahkan kirim error ke server:
  // sendErrorToServer(message, error);
}

/**
 * Membersihkan semua timeout yang sedang berjalan (loading, audio, deskripsi).
 */
function clearAllTimeouts() {
  if (descriptionChangeTimeout) {
    clearTimeout(descriptionChangeTimeout);
    descriptionChangeTimeout = null;
  }
  loadingTimeouts.forEach((id) => clearTimeout(id));
  loadingTimeouts.clear();
  audioTimeouts.forEach((id) => clearTimeout(id));
  audioTimeouts.clear();
}

// ===============================================================
// --- ENTRY POINT APLIKASI ---
// ===============================================================

// Memulai seluruh aplikasi
init();
