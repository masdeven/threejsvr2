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
  createAvatarGreetingPage,
  updateAvatar,
  toggleAvatarVisibility,
  preloadAvatar,
  activeTypingAnimation,
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
const clock = new THREE.Clock();
let confettiEffect = null;
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let fpsLabel = null;
let currentGreetingIndex = 0; // Melacak indeks teks sapaan
const audioCache = {};

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
    case AppState.AVATAR_GREETING:
      // --- PERUBAHAN BARU ---
      createAvatarGreetingPage(playerName, currentGreetingIndex);
      // --- AKHIR PERUBAHAN ---
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
// ... (kode dari `showViewer` sampai `changeState` tetap sama)
function showViewer(index) {
  const component = components[index];
  if (!component) return;

  currentComponentIndex = index;
  currentDescriptionIndex = 0;

  clearUI();
  if (component.modelFile) {
    loadComponentModel(component.modelFile);
  }
  createViewerPage(component, currentComponentIndex, currentDescriptionIndex);
}
async function init() {
  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  audioListener = new THREE.AudioListener();
  backgroundSound = new THREE.Audio(audioListener);
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);
  sound.userData = {};
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
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMappingExposure = 1.2;
    changeState(AppState.AVATAR_GREETING);
  });
  renderer.xr.addEventListener("sessionend", () => {
    changeState(AppState.MENU);
  });
  setupInteraction(handleInteraction);

  setupHTMLEvents();

  const assetPromises = [
    preloadAvatar(), // avatar juga sudah mengembalikan promise
    preloadAssets(), // versi baru yang menunggu semua model & audio
  ];

  await Promise.all(assetPromises);

  // Setelah preload selesai, splash screen bisa fade out
  const splashScreen = document.getElementById("splash-screen");
  if (splashScreen) {
    splashScreen.classList.add("fade-out");
    const vrButton = document.getElementById("VRButton");
    if (vrButton) vrButton.classList.add("visible");
    setTimeout(() => splashScreen.remove(), 500);
  }

  if (currentState === null) {
    showWelcomeScreen();
  }

  fpsLabel = createFpsLabel();
  debugGroup.add(fpsLabel);
  scene.add(debugGroup);

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
  return new Promise((resolve, reject) => {
    console.log("Preloading assets...");

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

    // --- Preload audio ---
    const audioFilesToPreload = [
      "assets/audio/button_press.mp3",
      "assets/audio/button_confirm.mp3",
      "assets/audio/completion.mp3",
      "assets/audio/background_music.mp3",
      ...components.filter((c) => c.audioFile).map((c) => c.audioFile),
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
    Promise.all([...modelPromises, ...audioPromises]).then(() => {
      console.log("All assets including audio are loaded and cached!");
      resolve();
    });
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

// Fungsi BARU untuk suara pendek (efek tombol)
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
    playControlledSound(sound, audioFile, { volume: 1 });
    sound.userData.path = audioFile;
  }
}

function playButtonPressAudio() {
  playOneShotSound("assets/audio/button_press.mp3", 0.5);
}

function playButtonConfirmAudio() {
  playOneShotSound("assets/audio/button_confirm.mp3", 0.5);
}
function startBackgroundMusic() {
  if (audioListener.context.state === "suspended") {
    audioListener.context.resume();
  }
  if (backgroundSound.isPlaying) return;
  playControlledSound(backgroundSound, "assets/audio/background_music.mp3", {
    loop: true,
    volume: 0.2,
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
}

function reloadViewer() {
  const component = components[currentComponentIndex];
  if (!component) return;

  clearViewerUI();
  createViewerPage(component, currentComponentIndex, currentDescriptionIndex);
}

function reloadCreditsScreen() {
  clearViewerUI();
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

  // --- PERUBAHAN BARU ---
  // Reset indeks sapaan saat masuk ke state AVATAR_GREETING
  if (newState === AppState.AVATAR_GREETING) {
    currentGreetingIndex = 0;
  }
  // --- AKHIR PERUBAHAN ---

  if (newState === AppState.COMPLETION) {
    playCompletionAudio();
  }
  if (
    newState === AppState.LANDING ||
    newState === AppState.QUIZ_REPORT ||
    newState === AppState.AVATAR_GREETING
  ) {
    toggleAvatarVisibility(true);
  } else {
    toggleAvatarVisibility(false);
  }
  refreshUI();
  if (!isDragging) {
    switch (newState) {
      case AppState.MODE_SELECTION:
        controls.enabled = true;
        camera.position.set(0, 1.6, 2);
        controls.target.set(0, 1.6, 0);
        break;

      case AppState.MENU:
      case AppState.QUIZ:
      case AppState.QUIZ_RESULT:
      case AppState.QUIZ_REPORT:
      case AppState.COMPLETION:
      case AppState.HELP:
      case AppState.LANDING:
      case AppState.AVATAR_GREETING:
      case AppState.CREDITS:
      case AppState.MINI_QUIZ:
      case AppState.MINI_QUIZ_RESULT:
      case AppState.VIEWER:
        controls.enabled = true;
        controls.target.set(0, 1.6, 0);
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
      startVRSession(() => {
        changeState(AppState.AVATAR_GREETING);
      });
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
      currentCreditIndex = 0;
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

      if (currentComponentIndex === highestComponentUnlocked) {
        changeState(AppState.MINI_QUIZ);
      } else if (currentComponentIndex < components.length - 1) {
        showViewer(currentComponentIndex + 1);
      } else {
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
          showViewer(index);
          currentState = AppState.VIEWER;
        }
      }
      break;
  }
}

// ... (kode dari `stopConfettiEffect` sampai `render` tetap sama)
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

  if (activeTypingAnimation) {
    activeTypingAnimation.update(deltaTime);
  }

  if (isVRMode()) {
    debugGroup.visible = true;
    debugGroup.position.copy(camera.position);
    debugGroup.quaternion.copy(camera.quaternion);
    updateFpsLabel(fpsLabel, fps);
    handleVRHover();
    handleVRDrag();
    if (currentState !== AppState.MENU) {
      updateUIGroupPosition();
    }
  } else {
    debugGroup.visible = false;
    controls.update();
    if (currentState === AppState.VIEWER || currentState === AppState.HELP) {
    }
  }

  if (currentState === AppState.VIEWER) {
    updateModelRotation();
  }

  if (confettiEffect) {
    confettiEffect.update(deltaTime);
  }
  updateAvatar(deltaTime);

  renderer.render(scene, camera);
}

init();
