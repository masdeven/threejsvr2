import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
import { components } from "./component-data.js";
import {
  createLandingPage,
  createMenuPage,
  createViewerPage,
  clearUI,
  updateViewerUIPosition,
  createHelpPanel,
  createQuizScreen,
  createQuizResultScreen,
  createQuizReportScreen,
  createCompletionScreen,
  createCreditsScreen,
} from "./ui-creator.js";
import {
  loader,
  loadComponentModel,
  unloadComponentModel,
  updateModelRotation,
} from "./model-loader.js";
import { setupInteraction } from "./interaction-manager.js";
import { initVR, isVRMode } from "./vr-manager.js";
import { loadingManager } from "./loading-manager.js";
import { quizData } from "./quiz-data.js";

let audioListener, sound;
const audioLoader = new THREE.AudioLoader(loadingManager);
let playerName = "";
let activeDescriptionPanel = null;
let currentQuestionIndex = 0;
let quizScore = 0;

const AppState = {
  LANDING: "LANDING",
  MENU: "MENU",
  VIEWER: "VIEWER",
  HELP: "HELP",
  QUIZ: "QUIZ",
  QUIZ_RESULT: "QUIZ_RESULT",
  QUIZ_REPORT: "QUIZ_REPORT",
  COMPLETION: "COMPLETION",
  CREDITS: "CREDITS",
};
let wasAnswerCorrect = false;
let currentState = null;
let currentComponentIndex = -1;

function refreshUI() {
  clearUI();
  switch (currentState) {
    case AppState.LANDING:
      createLandingPage(playerName);
      break;
    case AppState.MENU:
      createMenuPage();
      break;
    case AppState.VIEWER:
      reloadViewer();
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
      createQuizReportScreen(quizScore);
      break;
    case AppState.COMPLETION:
      createCompletionScreen(playerName);
      break;
    case AppState.CREDITS:
      createCreditsScreen();
      break;
  }
}

function init() {
  audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);

  initVR(refreshUI);
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
      vrButton.classList.add("visible");
    }

    changeState(AppState.LANDING);
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
  stopAudio();
  clearUI();
  unloadComponentModel();
  if (currentComponentIndex < 0) currentComponentIndex = components.length - 1;
  if (currentComponentIndex >= components.length) currentComponentIndex = 0;
  createViewerPage(components[currentComponentIndex]);
  loadComponentModel(components[currentComponentIndex].modelFile);
  controls.enabled = true;
  controls.target.set(0, 1, 0);
}

function changeState(newState) {
  if (currentState === newState) return;
  stopAudio();
  unloadComponentModel();
  currentState = newState;

  refreshUI();

  switch (newState) {
    case AppState.LANDING:
    case AppState.MENU:
    case AppState.QUIZ:
    case AppState.QUIZ_RESULT:
    case AppState.QUIZ_REPORT:
    case AppState.COMPLETION:
    case AppState.CREDITS:
      controls.enabled = false;
      camera.position.set(0, 1.6, 5);
      controls.target.set(0, 1.6, 0);
      break;
    case AppState.HELP:
      controls.enabled = false;
      break;
    case AppState.VIEWER:
      controls.enabled = true;
      controls.target.set(0, 1, 0);
      break;
  }
}

function handleInteraction(action) {
  switch (action) {
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
        changeState(AppState.QUIZ_REPORT);
      } else {
        changeState(AppState.QUIZ);
      }
      break;
    case "show_credits":
      changeState(AppState.CREDITS);
      break;
    case "next_component":
      if (currentComponentIndex >= components.length - 1) {
        changeState(AppState.COMPLETION);
      } else {
        currentComponentIndex++;
        reloadViewer();
      }
      break;
    case "prev_component":
      currentComponentIndex--;
      reloadViewer();
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
          currentComponentIndex = index;
          changeState(AppState.VIEWER);
        }
      }
      break;
  }
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  if (!isVRMode()) {
    controls.update();
  }
  if (currentState === AppState.VIEWER || currentState === AppState.HELP) {
    updateViewerUIPosition();
  }
  if (currentState === AppState.VIEWER) {
    updateModelRotation();
  }
  renderer.render(scene, camera);
}

init();
