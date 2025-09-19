import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
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
  createCreditsScreen,
  createModeSelectionPage,
  updateAvatar, // Tambahkan ini
  toggleAvatarVisibility,
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
} from "./model-loader.js";
import {
  setupInteraction,
  handleVRHover,
  handleVRDrag,
} from "./interaction-manager.js";
import { setupVR, startVRSession, isVRMode } from "./vr-manager.js";
import { loadingManager } from "./loading-manager.js";
import { quizData } from "./quiz-data.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { creditsData } from "./credits-data.js";
import { debugGroup, createFpsLabel, updateFpsLabel } from "./ui-creator.js";

let audioListener, sound, backgroundSound, completionSound;
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
const clock = new THREE.Clock(); // Tambahkan ini
let confettiEffect = null;
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let fpsLabel = null;

const AppState = {
  MODE_SELECTION: "MODE_SELECTION",
  LANDING: "LANDING",
  MENU: "MENU",
  VIEWER: "VIEWER",
  HELP: "HELP",
  MINI_QUIZ: "MINI_QUIZ",
  MINI_QUIZ_RESULT: "MINI_QUIZ_RESULT",
  QUIZ: "QUIZ",
  QUIZ_RESULT: "QUIZ_RESULT",
  QUIZ_REPORT: "QUIZ_REPORT",
  COMPLETION: "COMPLETION",
  CREDITS: "CREDITS",
};
let wasAnswerCorrect = false;
let wasMiniQuizCorrect = false;
let currentState = null;
let currentComponentIndex = -1;
let currentDescriptionIndex = 0;

function refreshUI() {
  clearUI();
  switch (currentState) {
    case AppState.MODE_SELECTION:
      createModeSelectionPage();
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
        showViewer(currentComponentIndex);
      }
      break;
    case AppState.MINI_QUIZ:
      createMiniQuizPage(components[currentComponentIndex]);
      break;
    case AppState.MINI_QUIZ_RESULT:
      createMiniQuizResultPage(wasMiniQuizCorrect);
      break;
    case AppState.HELP:
      createHelpPanel();
      break;
    case AppState.QUIZ:
      createQuizScreen(currentQuestionIndex);
      break;
    case AppState.QUIZ_RESULT:
      createQuizResultScreen(wasAnswerCorrect, currentQuestionIndex);
      break;
    case AppState.QUIZ_REPORT:
      createQuizReportScreen(quizScore, hasAttemptedQuiz);
      break;
    case AppState.COMPLETION:
      confettiEffect = createCompletionScreen(playerName);
      break;
    case AppState.CREDITS:
      createCreditsScreen(creditsData, currentCreditIndex);
      break;
  }
}
function showViewer(index) {
  const component = components[index];
  if (!component) return;

  currentComponentIndex = index;
  currentDescriptionIndex = 0; // Selalu reset ke halaman pertama saat ganti komponen

  clearUI(); // Bersihkan UI dari state sebelumnya (misal: menu)
  if (component.modelFile) {
    loadComponentModel(component.modelFile);
  }
  createViewerPage(component, currentComponentIndex, currentDescriptionIndex);
}
function init() {
  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
  audioListener = new THREE.AudioListener();
  backgroundSound = new THREE.Audio(audioListener);
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);
  completionSound = new THREE.Audio(audioListener);

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
    // 2. Atur ulang Encoding Output
    renderer.outputEncoding = THREE.sRGBEncoding;
    // 3. Pastikan exposure konsisten (opsional, tapi bagus)
    renderer.toneMappingExposure = 1.2;
    changeState(AppState.LANDING);
  });
  renderer.xr.addEventListener("sessionend", () => {
    changeState(AppState.MENU);
  });
  setupInteraction(handleInteraction);

  setupHTMLEvents();

  loadingManager.onLoad = function () {
    console.log("Loading complete! Starting the app.");
    const splashScreen = document.getElementById("splash-screen");

    if (splashScreen) {
      splashScreen.classList.add("fade-out");

      const vrButton = document.getElementById("VRButton");
      if (vrButton) {
        vrButton.classList.add("visible");
      }

      setTimeout(() => {
        if (splashScreen.parentNode) {
          splashScreen.parentNode.removeChild(splashScreen);
        }
      }, 500);
    }

    if (currentState === null) {
      showWelcomeScreen();
    }

    loadingManager.onLoad = () => {};
  };
  fpsLabel = createFpsLabel();
  fpsLabel.position.set(0.7, 0.5, -1); // Posisi relatif terhadap kamera
  debugGroup.add(fpsLabel);
  debugGroup.visible = false;
  scene.add(debugGroup);

  preloadAssets();

  animate();
}
function setupHTMLEvents() {
  const welcomeNextBtn = document.getElementById("welcome-next-button");
  const nameContinueBtn = document.getElementById("continue-button");

  welcomeNextBtn.addEventListener("click", () => {
    document.getElementById("welcome-overlay").classList.add("hidden");
    showNameInputScreen();
    startBackgroundMusic();
  });

  nameContinueBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("player-name-input");
    playerName = nameInput.value.trim() || "Tamu";
    document.getElementById("name-input-overlay").classList.add("hidden");

    const vrButton = document.getElementById("VRButton");
    if (vrButton) {
      vrButton.remove();
    }

    changeState(AppState.MODE_SELECTION);
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
function preloadAssets() {
  console.log("Preloading assets...");
  for (const component of components) {
    if (component.modelFile && !modelCache[component.modelFile]) {
      loader.load(component.modelFile, (gltf) => {
        console.log(`Model di-cache saat pre-loading: ${component.modelFile}`);
        modelCache[component.modelFile] = gltf.scene;
      });
    }
  }

  for (const component of components) {
    if (component.audioFile) {
      audioLoader.load(component.audioFile, () => {});
    }
  }

  // Preload audio untuk interaksi tombol
  audioLoader.load("assets/audio/button_press.mp3", () => {});
  audioLoader.load("assets/audio/button_confirm.mp3", () => {});
  audioLoader.load("assets/audio/completion.mp3", () => {});
}

function stopAudio() {
  if (sound && sound.isPlaying) sound.stop();
}

function playComponentAudio(audioFile) {
  stopAudio();
  if (!audioFile) {
    return;
  }
  audioLoader.load(audioFile, (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(1);
    sound.play();
  });
}

// Fungsi untuk memainkan audio tombol navigasi/kembali
function playButtonPressAudio() {
  stopAudio();
  audioLoader.load("assets/audio/button_press.mp3", (buffer) => {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sound.play();
  });
}

// Fungsi untuk memainkan audio tombol konfirmasi/lanjut
function playButtonConfirmAudio() {
  stopAudio();
  audioLoader.load("assets/audio/button_confirm.mp3", (buffer) => {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sound.play();
  });
}
function startBackgroundMusic() {
  if (backgroundSound.isPlaying) return;
  audioLoader.load("assets/audio/background_music.mp3", (buffer) => {
    backgroundSound.setBuffer(buffer);
    backgroundSound.setLoop(true);
    backgroundSound.setVolume(0.2); // Atur volume sesuai keinginan
    backgroundSound.play();
  });
}
function playCompletionAudio() {
  stopAudio();
  audioLoader.load("assets/audio/completion.mp3", (buffer) => {
    completionSound.setBuffer(buffer);
    completionSound.setVolume(0.5); // Volume bisa disesuaikan
    completionSound.play();
  });
}

function reloadViewer() {
  const component = components[currentComponentIndex];
  if (!component) return;

  clearViewerUI(); // Hanya bersihkan UI di viewer group, bukan semuanya
  createViewerPage(component, currentComponentIndex, currentDescriptionIndex);
}

function reloadCreditsScreen() {
  clearViewerUI(); // Kita gunakan UI group yang sama agar posisinya tetap
  createCreditsScreen(creditsData, currentCreditIndex);
}
function changeState(newState) {
  if (currentState === newState) return;
  if (currentState === AppState.COMPLETION) {
    stopConfettiEffect();
    if (completionSound && completionSound.isPlaying) {
      completionSound.stop();
    }
  }
  stopAudio();

  // Cegah model hilang saat transisi antara viewer, mini quiz, dan hasilnya
  const isTransitioningWithinViewer =
    (currentState === AppState.VIEWER &&
      (newState === AppState.MINI_QUIZ ||
        newState === AppState.MINI_QUIZ_RESULT)) ||
    (currentState === AppState.MINI_QUIZ &&
      newState === AppState.MINI_QUIZ_RESULT) ||
    (currentState === AppState.MINI_QUIZ_RESULT &&
      newState === AppState.VIEWER);

  if (!isTransitioningWithinViewer) {
    unloadComponentModel();
  }

  currentState = newState;

  if (newState === AppState.COMPLETION) {
    playCompletionAudio();
  }
  if (newState === AppState.LANDING || newState === AppState.QUIZ_REPORT) {
    toggleAvatarVisibility(true);
  } else {
    toggleAvatarVisibility(false);
  }
  refreshUI();
  if (!isDragging) {
    switch (newState) {
      case AppState.MODE_SELECTION:
        controls.enabled = true;
        // Posisikan panel mode seleksi agak di depan kamera
        camera.position.set(0, 1.6, 2);
        controls.target.set(0, 1.6, 0);
        break;

      // SEMUA STATE LAINNYA DIJADIKAN SATU DENGAN KONTROL VIEWER
      case AppState.MENU:
      case AppState.QUIZ:
      case AppState.QUIZ_RESULT:
      case AppState.QUIZ_REPORT:
      case AppState.COMPLETION:
      case AppState.HELP:
      case AppState.LANDING:
      case AppState.CREDITS:
      case AppState.MINI_QUIZ:
      case AppState.MINI_QUIZ_RESULT:
      case AppState.VIEWER:
        controls.enabled = true;
        // Sesuaikan target agar lebih sejajar dengan pandangan
        controls.target.set(0, 1.6, 0);
        break;
    }
  }
}

function handleInteraction(action) {
  // Panggil fungsi audio yang sesuai berdasarkan aksi
  const confirmActions = [
    "start_browser",
    "start_vr",
    "start",
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
      changeState(AppState.LANDING);
      break;
    case "start_vr":
      startVRSession(() => {
        // Callback ini dijalankan saat sesi VR berakhir.
        changeState(AppState.MENU);
      });
      break;
    case "start":
      changeState(AppState.MENU);
      break;
    case "help":
      changeState(AppState.HELP);
      break;
    case "close_help":
      changeState(AppState.LANDING);
      break;
    case "back_to_menu":
      changeState(AppState.MENU);
      break;
    case "back_to_landing":
      changeState(AppState.LANDING);
      break;
    case "show_quiz":
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
      if (currentQuestionIndex >= quizData.length) {
        hasAttemptedQuiz = true;
        changeState(AppState.QUIZ_REPORT);
      } else {
        changeState(AppState.QUIZ);
      }
      break;
    case "show_credits":
      currentCreditIndex = 0; // Selalu mulai dari halaman pertama
      changeState(AppState.CREDITS);
      break;
    case "prev_credit":
      if (currentCreditIndex > 0) {
        currentCreditIndex--;
        reloadCreditsScreen();
      }
      break;
    case "next_credit":
      if (currentCreditIndex < creditsData.length - 1) {
        currentCreditIndex++;
        reloadCreditsScreen();
      }
      break;
    case "prev_description":
      if (currentDescriptionIndex > 0) {
        currentDescriptionIndex--;
        reloadViewer();
      }
      break;
    case "next_description":
      const currentComp = components[currentComponentIndex];
      if (
        currentComp &&
        currentDescriptionIndex < currentComp.description.length - 1
      ) {
        currentDescriptionIndex++;
        reloadViewer();
      }
      break;

    case "next_component":
      if (isChangingComponent) return;
      isChangingComponent = true;

      // Jika komponen saat ini adalah yang terakhir belum terbuka
      if (currentComponentIndex === highestComponentUnlocked) {
        // Lanjut ke kuis singkat sebelum membuka komponen berikutnya
        changeState(AppState.MINI_QUIZ);
      } else if (currentComponentIndex < components.length - 1) {
        // Jika komponen berikutnya sudah terbuka, langsung pindah
        showViewer(currentComponentIndex + 1);
      } else {
        // Jika ini adalah komponen terakhir
        changeState(AppState.COMPLETION);
      }
      setTimeout(() => {
        isChangingComponent = false;
      }, CHANGE_DEBOUNCE_TIME);
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
        const unlockedIndex = currentComponentIndex + 1;
        if (unlockedIndex < components.length) {
          components[unlockedIndex].unlocked = true;
          if (unlockedIndex > highestComponentUnlocked) {
            highestComponentUnlocked = unlockedIndex;
          }
        }
        if (currentComponentIndex >= components.length - 1) {
          changeState(AppState.COMPLETION);
        } else {
          isChangingComponent = true;
          currentComponentIndex++;
          changeState(AppState.VIEWER);
          setTimeout(() => {
            isChangingComponent = false;
          }, CHANGE_DEBOUNCE_TIME);
        }
      } else {
        changeState(AppState.VIEWER);
      }
      break;
    case "prev_component":
      if (isChangingComponent) return;
      isChangingComponent = true;

      currentComponentIndex--;
      showViewer(currentComponentIndex);
      setTimeout(() => {
        isChangingComponent = false;
      }, CHANGE_DEBOUNCE_TIME);
      break;
    case "play_audio":
      if (currentComponentIndex > -1) {
        playComponentAudio(components[currentComponentIndex].audioFile);
      }
      break;
    default:
      if (action.startsWith("select_")) {
        const index = parseInt(action.split("_")[1], 10);
        if (!isNaN(index) && index >= 0 && index < components.length) {
          // --- MODIFIKASI --- Memanggil showViewer saat memilih komponen
          showViewer(index);
          currentState = AppState.VIEWER; // Set state secara manual
        }
      }
      break;
  }
}
function stopConfettiEffect() {
  if (confettiEffect) {
    confettiEffect.destroy(); // Panggil metode destroy yang akan kita buat
    confettiEffect = null; // Reset variabel
  }
}
function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  stats.update();
  const deltaTime = clock.getDelta(); // Tambahkan ini
  frameCount++;
  const now = performance.now();
  if (now - lastFpsUpdate >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = now;
  }

  if (isVRMode()) {
    debugGroup.visible = true;
    debugGroup.position.copy(camera.position);
    debugGroup.quaternion.copy(camera.quaternion);
    updateFpsLabel(fpsLabel, fps);
    handleVRHover();
    handleVRDrag();
    // PERBAIKAN: UI tidak akan mengikuti headset saat berada di menu utama
    if (currentState !== AppState.MENU) {
      updateUIGroupPosition();
    }
    // updateViewerUIPosition(); // Komentar ini tetap ada
  } else {
    debugGroup.visible = false;
    controls.update();
    // Dalam mode non-VR, hanya UI viewer yang perlu mengikuti pergerakan kamera
    if (currentState === AppState.VIEWER || currentState === AppState.HELP) {
      // updateViewerUIPosition();
    }
  }

  if (currentState === AppState.VIEWER) {
    updateModelRotation();
  }

  if (confettiEffect) {
    confettiEffect.update(deltaTime);
  }
  updateAvatar(deltaTime); // Tambahkan ini

  renderer.render(scene, camera);
}

init();
