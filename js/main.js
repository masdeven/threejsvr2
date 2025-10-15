import * as THREE from "three";
import { scene, camera, renderer, controls, loadRoom } from "./scene-setup.js";
import { components } from "./component-data.js";
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
  // Jika ada fungsi sanitasi, tambahkan di sini
  // sanitizeHtml
} from "./ui-creator.js";
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
import {
  setupInteraction,
  handleVRHover,
  handleVRDrag,
  setButtonEnabled,
} from "./interaction-manager.js";
import { setupVR, startVRSession, isVRMode } from "./vr-manager.js";
import {
  loadingManager,
  setLoadingPhase,
  LoadingPhases,
  updateManualProgress,
} from "./loading-manager.js";

import { quizData } from "./quiz-data.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { creditsData } from "./credits-data.js";
import { debugGroup, createFpsLabel, updateFpsLabel } from "./ui-creator.js";

// --- Konstanta ---
const STORAGE_KEY = "webxr_learning_progress";
const CHANGE_DEBOUNCE_TIME = 500;
const LOADING_TIMEOUT = 60000; // 60 detik untuk koneksi lambat

// --- State ---
let audioListener, sound, backgroundSound, completionSound, greetingSound;
let shuffledQuizData = [];
const audioLoader = new THREE.AudioLoader();
let playerName = "";
let currentQuestionIndex = 0;
let quizScore = 0;
let hasAttemptedQuiz = false;
let highestComponentUnlocked = 0;
let currentCreditIndex = 0;
let isChangingComponent = false;
let stats;
let isChangingDescription = false;
let descriptionChangeTimeout = null;
const clock = new THREE.Clock();
let confettiEffect = null;
let fps = 0;
let isFadingInUI = false;
let frameCount = 0;
let lastFpsUpdate = 0;
let fpsLabel = null;
let currentGreetingIndex = 0;
const audioCache = {};
let animationFrameId = null;
let isDebugVisible = false;
const loadingTimeouts = new Map();
const audioTimeouts = new Map();

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

// --- Fungsi Utilitas ---
function sanitizeInput(str) {
  // Basic sanitization untuk input pengguna
  if (typeof str !== "string") return "";
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.textContent || temp.innerText || "";
}

function logError(message, error) {
  console.error(message, error);
  // Kirim ke server jika perlu
  // sendErrorToServer(message, error);
}

function clearAllTimeouts() {
  if (descriptionChangeTimeout) {
    clearTimeout(descriptionChangeTimeout);
    descriptionChangeTimeout = null;
  }
  // Clear semua loading timeouts yang mungkin masih berjalan
  loadingTimeouts.forEach((id) => clearTimeout(id));
  loadingTimeouts.clear();
  audioTimeouts.forEach((id) => clearTimeout(id));
  audioTimeouts.clear();
}

// --- Manajemen Progres ---
function saveProgress() {
  try {
    const progress = {
      playerName: playerName,
      highestComponentUnlocked: highestComponentUnlocked,
      quizScore: quizScore,
      hasAttemptedQuiz: hasAttemptedQuiz,
    };
    // Enkripsi sederhana bisa ditambahkan di sini jika diperlukan
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    console.log("Progres disimpan:", progress);
  } catch (error) {
    logError("Gagal menyimpan progress:", error);
  }
}

function loadProgress() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const progress = JSON.parse(savedData);
      playerName = progress.playerName || "";
      highestComponentUnlocked = progress.highestComponentUnlocked || 0;
      quizScore = progress.quizScore || 0;
      hasAttemptedQuiz = progress.hasAttemptedQuiz || false;

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

function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);

  playerName = "";
  highestComponentUnlocked = 0;
  quizScore = 0;
  hasAttemptedQuiz = false;

  components.forEach((comp, index) => {
    comp.unlocked = index === 0;
  });

  console.log("Progres telah direset.");
}

// --- Fungsi UI ---
function onVRSessionEnded() {
  unloadComponentModel();
  controls.enabled = true;
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

window.playCurrentGreetingAudioCallback = function () {
  playCurrentGreetingAudio();
};

function showViewer(index, options = {}) {
  const { isTransitioning = false } = options;
  const component = components[index];
  if (!component) return;

  currentComponentIndex = index;
  currentDescriptionIndex = 0;

  clearUI();

  if (component.modelFile) {
    const onModelReady = () => {
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
  const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (!isMobile) {
    return;
  }

  const overlay = document.getElementById("orientation-overlay");
  const container = document.getElementById("container");

  if (window.innerHeight > window.innerWidth) {
    overlay.classList.remove("hidden");
    container.classList.add("hidden");
  } else {
    overlay.classList.add("hidden");
    container.classList.remove("hidden");
  }
}

// --- Inisialisasi ---
async function init() {
  checkOrientation();
  window.addEventListener("resize", checkOrientation);

  stats = new Stats();
  document.body.appendChild(stats.dom);
  stats.dom.style.display = "none";

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

  audioListener = new THREE.AudioListener();
  backgroundSound = new THREE.Audio(audioListener);
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);
  sound.userData = {};
  completionSound = new THREE.Audio(audioListener);
  greetingSound = new THREE.Audio(audioListener);

  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("assets/basis/")
    .detectSupport(renderer);
  setupKTX2Loader(ktx2Loader);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("assets/draco/");
  setupDRACOLoader(dracoLoader);

  setRendererForCompilation(renderer, camera);

  loadRoom(loader);

  setupVR();

  renderer.xr.addEventListener("sessionstart", () => {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMappingExposure = 1.2;
    changeState(AppState.AVATAR_GREETING);
  });

  renderer.xr.addEventListener("sessionend", () => {
    stopAudio();
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

  const hasSavedProgress = loadProgress();

  await preloadAvatar();
  await preloadModels();
  await preloadOtherAssets();

  const splashScreen = document.getElementById("splash-screen");
  if (splashScreen) {
    splashScreen.classList.add("fade-out");
    const vrButton = document.getElementById("VRButton");
    if (vrButton) vrButton.classList.add("visible");
    setTimeout(() => splashScreen.remove(), 500);
  }

  if (hasSavedProgress && playerName) {
    document
      .getElementById("progress-choice-overlay")
      .classList.remove("hidden");
  } else {
    showWelcomeScreen();
  }

  fpsLabel = createFpsLabel();
  fpsLabel.position.set(-0.4, 0.3, -0.7);
  debugGroup.add(fpsLabel);
  debugGroup.visible = false;
  scene.add(debugGroup);

  animate();
}

// --- Update UI ---
function updateActiveTextPanelTarget() {
  activeTextPanel = scene.getObjectByProperty("isScrollableText", true);
  if (activeTextPanel) {
    const totalPages = activeTextPanel.userData.totalPages;
    activeTextPanel.userData.targetOffsetY =
      (totalPages - 1 - currentDescriptionIndex) / totalPages;
    activeTextPanel.userData.currentPage = currentDescriptionIndex;
  }
}

function reloadViewerNavigation() {
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
  activeCreditsPanel = scene.getObjectByProperty("isCreditsPanel", true);
}

// --- Event Listener HTML ---
function setupHTMLEvents() {
  const welcomeNextBtn = document.getElementById("welcome-next-button");
  const nameContinueBtn = document.getElementById("continue-button");

  const continueProgressBtn = document.getElementById(
    "continue-progress-button"
  );
  const startNewBtn = document.getElementById("start-new-button");

  continueProgressBtn.addEventListener("click", () => {
    document.getElementById("progress-choice-overlay").classList.add("hidden");
    document.getElementById("container").classList.remove("hidden");
    startBackgroundMusic();
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

  startNewBtn.addEventListener("click", () => {
    resetProgress();
    document.getElementById("progress-choice-overlay").classList.add("hidden");
    showWelcomeScreen();
  });

  welcomeNextBtn.addEventListener("click", () => {
    document.getElementById("welcome-overlay").classList.add("hidden");
    showNameInputScreen();
    startBackgroundMusic();
  });

  nameContinueBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("player-name-input");
    let nameValue = nameInput.value.trim();

    // Sanitasi input nama
    nameValue = sanitizeInput(nameValue);

    const nameOverlay = document.getElementById("name-input-overlay");

    if (nameValue === "") {
      nameInput.classList.add("shake");

      setTimeout(() => {
        nameInput.classList.remove("shake");
      }, 500);

      return;
    }

    playerName = nameValue || "Tamu";
    saveProgress();
    const fadeOutDuration = 500;

    if (nameOverlay) {
      nameOverlay.classList.add("fade-out");
    }

    setTimeout(() => {
      if (nameOverlay) {
        nameOverlay.classList.add("hidden");
      }

      const vrButton = document.getElementById("VRButton");
      if (vrButton) {
        vrButton.remove();
      }
      document.getElementById("container").classList.remove("hidden");
      changeState(AppState.MODE_SELECTION);
    }, fadeOutDuration);
  });
}

function showWelcomeScreen() {
  document.getElementById("welcome-overlay").classList.remove("hidden");
}

function showNameInputScreen() {
  const nameInput = document.getElementById("player-name-input");
  document.getElementById("name-input-overlay").classList.remove("hidden");
  nameInput.focus();
}

function updateLoadingText(message) {
  const loadingTextElement = document.getElementById("loading-text");
  if (loadingTextElement) {
    loadingTextElement.textContent = message;
  }
}

// --- Preload Asset ---
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

      // ✅ GUNAKAN preloadLoader yang TIDAK terhubung ke loadingManager
      preloadLoader.load(
        file,
        (gltf) => {
          const tid = loadingTimeouts.get(file);
          if (tid) {
            clearTimeout(tid);
            loadingTimeouts.delete(file);
          }
          convertModelMaterials(gltf.scene);
          preCompileModel(gltf.scene);
          modelCache[file] = gltf.scene;
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

function preloadOtherAssets() {
  return new Promise((resolve) => {
    setLoadingPhase(LoadingPhases.LOADING_MEDIUM);
    updateLoadingText("Loading textures and audio...");

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
          res();
        }
      );
    });

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
              audioCache[file] = buffer;
              audioLoaded++;
              console.log(
                `✓ Audio loaded: ${file} (${audioLoaded}/${totalAudio})`
              );

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

    Promise.all([texturePromise, ...audioPromises]).then(() => {
      console.log(`✓ All assets loaded. Audio: ${audioLoaded}/${totalAudio}`);
      setLoadingPhase(LoadingPhases.COMPLETE);
      resolve();
    });
  });
}

// --- Audio ---
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
    const oneShotSound = new THREE.Audio(audioListener);
    oneShotSound.setBuffer(buffer);
    oneShotSound.setVolume(volume);

    oneShotSound.onEnded = () => {
      oneShotSound.disconnect();
      camera.remove(oneShotSound);
    };

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
  playOneShotSound("assets/audio/sfx/button_press.ogg", 0.5);
}

function playButtonConfirmAudio() {
  playOneShotSound("assets/audio/sfx/button_confirm.ogg", 0.5);
}

function playCurrentGreetingAudio() {
  const greetingData = GREETING_DATA(playerName)[currentGreetingIndex];
  if (greetingData && greetingData.audioFile) {
    playControlledSound(greetingSound, greetingData.audioFile, { volume: 1 });
  }
}

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

function playCompletionAudio() {
  playControlledSound(completionSound, "assets/audio/sfx/completion.ogg", {
    volume: 0.5,
  });
}

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

// --- Manajemen State ---
function changeState(newState, options = {}) {
  requestAnimationFrame(() => {
    activeTextPanel = null;
    activeCreditsPanel = null;
    if (currentState === newState && newState !== AppState.VIEWER) {
      return;
    }
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
    const viewerContextStates = new Set([
      AppState.VIEWER,
      AppState.MINI_QUIZ,
      AppState.MINI_QUIZ_RESULT,
    ]);

    const isTransitioningWithinViewer =
      viewerContextStates.has(currentState) &&
      viewerContextStates.has(newState);

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
  });
}

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
      return;
    }
  } else if (direction === "next") {
    if (currentDescriptionIndex < component.description.length - 1) {
      newIndex = currentDescriptionIndex + 1;
    } else {
      return;
    }
  }

  isChangingDescription = true;
  currentDescriptionIndex = newIndex;

  navButtons.forEach((btn) => {
    const action = btn.userData.action;
    if (action === "prev_description" || action === "next_description") {
      setButtonEnabled(btn, false);
    }
  });

  if (descriptionChangeTimeout) {
    clearTimeout(descriptionChangeTimeout);
  }

  updateActiveTextPanelTarget();

  descriptionChangeTimeout = setTimeout(() => {
    reloadViewerNavigation();

    isChangingDescription = false;

    const comp = components[currentComponentIndex];
    if (comp) {
      navButtons.forEach((btn) => {
        const action = btn.userData.action;

        if (action === "prev_description") {
          const canGoPrev = currentDescriptionIndex > 0;
          setButtonEnabled(btn, canGoPrev);
        } else if (action === "next_description") {
          const canGoNext =
            currentDescriptionIndex < comp.description.length - 1;
          setButtonEnabled(btn, canGoNext);
        }
      });
    }

    descriptionChangeTimeout = null;
  }, 150);
}

// --- Interaksi ---
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

      const onAnimationMidpointBackToMenu = () => {
        changeState(AppState.MENU);
        isChangingComponent = false;
      };

      startModelAnimation(true, onAnimationMidpointBackToMenu);
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

function stopConfettiEffect() {
  if (confettiEffect) {
    if (typeof confettiEffect.destroy === "function") {
      confettiEffect.destroy();
    }
    confettiEffect = null;
  }
}

// --- Loop Render ---
function animate() {
  animationFrameId = renderer.setAnimationLoop(render);
}
function stopAnimation() {
  if (animationFrameId !== null) {
    renderer.setAnimationLoop(null);
    animationFrameId = null;
  }
}

function render() {
  stats.update();
  const deltaTime = clock.getDelta();

  const currentModel = getCurrentModel();

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

    if (allFadedIn) {
      isFadingInUI = false;
    }
  }
  updateModelTransition(deltaTime);
  updateScrollAnimation(activeTextPanel, deltaTime);
  updateScrollAnimation(activeCreditsPanel, deltaTime);

  const typingAnim = getActiveTypingAnimation();
  if (typingAnim) {
    typingAnim.update(deltaTime);
  }

  if (isDebugVisible) {
    debugGroup.position.copy(camera.position);
    debugGroup.quaternion.copy(camera.quaternion);
    updateFpsLabel(fpsLabel, fps);
  }

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
