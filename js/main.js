import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
import { components } from "./component-data.js";
import {
  createLandingPage,
  createMenuPage,
  createViewerPage,
  clearUI,
  clearViewerUI,
  // updateViewerUIPosition,
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
} from "./ui-creator.js";
import {
  loader,
  loadComponentModel,
  unloadComponentModel,
  updateModelRotation,
} from "./model-loader.js";
import { setupInteraction, handleVRHover } from "./interaction-manager.js";
import { setupVR, startVRSession, isVRMode } from "./vr-manager.js";
import { loadingManager } from "./loading-manager.js";
import { quizData } from "./quiz-data.js";

let audioListener, sound;
const audioLoader = new THREE.AudioLoader(loadingManager);
let playerName = "";
let currentQuestionIndex = 0;
let quizScore = 0;
let hasAttemptedQuiz = false;
let highestComponentUnlocked = 0;
let isChangingComponent = false;
const CHANGE_DEBOUNCE_TIME = 500;

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
      createCompletionScreen(playerName);
      break;
    case AppState.CREDITS:
      createCreditsScreen();
      break;
  }
}
function showViewer(index) {
  const component = components[index];
  if (!component) return;

  currentComponentIndex = index;
  currentDescriptionIndex = 0; // Selalu reset ke halaman pertama saat ganti komponen

  clearUI(); // Bersihkan UI dari state sebelumnya (misal: menu)
  loadComponentModel(component.modelFile);
  createViewerPage(component, currentComponentIndex, currentDescriptionIndex);
}
function init() {
  audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);

  setupVR();
  renderer.xr.addEventListener("sessionstart", () => {
    refreshUI();
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

  preloadAssets();

  animate();
}
function setupHTMLEvents() {
  const welcomeNextBtn = document.getElementById("welcome-next-button");
  const nameContinueBtn = document.getElementById("continue-button");

  welcomeNextBtn.addEventListener("click", () => {
    document.getElementById("welcome-overlay").classList.add("hidden");
    showNameInputScreen();
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
    loader.load(component.modelFile, () => {});
  }

  for (const component of components) {
    if (component.audioFile) {
      audioLoader.load(component.audioFile, () => {});
    }
  }
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
    sound.setVolume(0.5);
    sound.play();
  });
}

function reloadViewer() {
  const component = components[currentComponentIndex];
  if (!component) return;

  clearViewerUI(); // Hanya bersihkan UI di viewer group, bukan semuanya
  createViewerPage(component, currentComponentIndex, currentDescriptionIndex);
}

function changeState(newState) {
  if (currentState === newState) return;
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
  refreshUI();

  switch (newState) {
    case AppState.MODE_SELECTION:
      controls.enabled = true;
      camera.position.set(0, 1.6, 5);
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
      controls.target.set(0, 1, 0);
      break;
  }
}

function handleInteraction(action) {
  switch (action) {
    case "start_browser":
      changeState(AppState.LANDING);
      break;
    case "start_vr":
      startVRSession(() => {
        changeState(AppState.MENU);
      }).then(() => {
        changeState(AppState.LANDING);
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
      changeState(AppState.CREDITS);
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
      reloadViewer();
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

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  if (isVRMode()) {
    handleVRHover();
    // PERBAIKAN: UI tidak akan mengikuti headset saat berada di menu utama
    if (currentState !== AppState.MENU) {
      updateUIGroupPosition();
    }
    // updateViewerUIPosition(); // Komentar ini tetap ada
  } else {
    controls.update();
    // Dalam mode non-VR, hanya UI viewer yang perlu mengikuti pergerakan kamera
    if (currentState === AppState.VIEWER || currentState === AppState.HELP) {
      // updateViewerUIPosition();
    }
  }

  if (currentState === AppState.VIEWER) {
    updateModelRotation();
  }

  renderer.render(scene, camera);
}

init();
