import * as THREE from "three";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import Stats from "three/addons/libs/stats.module.js";

import {
  scene,
  camera,
  renderer,
  controls,
  loadRoom,
  loadEnvironmentMap,
} from "./scene-setup.js";

import { components } from "./component-data.js";
import { quizData } from "./quiz-data.js";
import { creditsData } from "./credits-data.js";
import { guideData } from "./guide-data.js";

import {
  createLandingPage,
  createMenuPage,
  createViewerPage,
  clearUI,
  clearViewerUI,
  updateUIGroupPosition,
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
  startAvatarFlyUpAnimation,
  debugGroup,
  createFpsLabel,
  updateFpsLabel,
  createQuickGuideScreen,
  createFinalTestConfirmationPage,
  viewerUIGroup,
} from "./ui-creator.js";

import {
  loader,
  loadComponentModel,
  unloadComponentModel,
  updateModelRotation,
  setupDRACOLoader,
  setupKTX2Loader,
  isUserInteracting,
  modelCache,
  startModelAnimation,
  updateModelTransition,
  getCurrentModel,
  setRendererForCompilation,
  convertModelMaterials,
  preCompileModel,
  preloadLoader,
  transitionState,
  currentModel,
  stopModelAnimation,
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

const STORAGE_KEY = "webxr_learning_progress";
const CHANGE_DEBOUNCE_TIME = 50;
const LOADING_TIMEOUT = 60000;
// #test
const SAMPLE_TEST_MODE = true; // set ke false untuk mematikan
const SAMPLE_START_INDEX = 10; // indeks awal sample (0-based)
const TESTING_MODE = true; // set ke false untuk mematikan (atau reuse flag sample mode Anda)
const TESTING_ALERT_KEY = "testing_alert_dismissed_v1";
// #endtest
let audioListener,
  sound,
  backgroundSound,
  completionSound,
  greetingSound,
  completionCongratsSound;
const audioLoader = new THREE.AudioLoader();
const audioCache = {};

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
let current_guide_index = 0;

let isTransitioningModel = false;
let isChangingDescription = false;
let descriptionChangeTimeout = null;
let confettiEffect = null;
let isFadingInUI = false;
let activeTextPanel = null;
let activeCreditsPanel = null;
let active_guide_panel = null;
let isSidebarOpen = false;

let stats;
const clock = new THREE.Clock();
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = performance.now();
let fpsLabel = null;
let animationFrameId = null;
let isDebugVisible = false;

const loadingTimeouts = new Map();
const audioTimeouts = new Map();

let currentState = null;
let currentComponentIndex = -1;
let currentDescriptionIndex = 0;

const AppState = {
  MODE_SELECTION: "MODE_SELECTION",
  AVATAR_GREETING: "AVATAR_GREETING",
  LANDING: "LANDING",
  MENU: "MENU",
  VIEWER: "VIEWER",
  HELP: "HELP",
  MINI_QUIZ: "MINI_QUIZ",
  MINI_QUIZ_RESULT: "MINI_QUIZ_RESULT",
  CONFIRM_FINAL_TEST: "CONFIRM_FINAL_TEST",
  QUIZ: "QUIZ",
  QUIZ_RESULT: "QUIZ_RESULT",
  QUIZ_REPORT: "QUIZ_REPORT",
  QUIZ_POST_COMPLETION_REPORT: "QUIZ_POST_COMPLETION_REPORT",
  POST_QUIZ_CHOICE: "POST_QUIZ_CHOICE",
  COMPLETION: "COMPLETION",
  CREDITS: "CREDITS",
  QUICK_GUIDE: "QUICK_GUIDE",
};

if (debugGroup.parent === camera) {
  camera.remove(debugGroup);
}
if (!debugGroup.parent) {
  scene.add(debugGroup);
}

/**
 * Inisialisasi seluruh aplikasi.
 * Memuat aset, mengatur environment, dan memulai state awal.
 */
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
    clearAllTimeouts();
    console.log("✓ Cleanup complete");
  });

  audioListener = new THREE.AudioListener();
  backgroundSound = new THREE.Audio(audioListener);
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);
  sound.userData = {};
  completionSound = new THREE.Audio(audioListener);
  greetingSound = new THREE.Audio(audioListener);
  completionCongratsSound = new THREE.Audio(audioListener);

  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("assets/basis/")
    .detectSupport(renderer);
  setupKTX2Loader(ktx2Loader);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("assets/draco/");
  setupDRACOLoader(dracoLoader);

  setRendererForCompilation(renderer, camera);
  await new Promise((resolve) => {
    loadEnvironmentMap(resolve);
  });
  loadRoom(loader);

  setupVR();
  renderer.xr.addEventListener("sessionstart", onVRSessionStarted);
  renderer.xr.addEventListener("sessionend", onVRSessionEnded);

  setupInteraction(handleInteraction);
  setupHTMLEvents();

  window.addEventListener("keydown", (event) => {
    if (event.key === "q" || event.key === "Q") {
      isDebugVisible = !isDebugVisible;
      debugGroup.visible = isDebugVisible;
      console.log("Debug panel:", isDebugVisible ? "visible" : "hidden");
    }
  });

  const hasSavedProgress = loadProgress();

  await preloadAvatar();
  await preloadModels();
  await preloadOtherAssets();

  setLoadingPhase(LoadingPhases.LOADING_MEDIUM);
  updateLoadingText("Finalizing assets...");
  console.log("🚀 Starting final render pass for cached models...");

  if (scene.environment) {
    let finalizedCount = 0;
    const totalModelsToFinalize = Object.keys(modelCache).length;

    for (const url in modelCache) {
      if (modelCache.hasOwnProperty(url)) {
        const originalScene = modelCache[url];
        if (originalScene) {
          const tempModel = originalScene.clone();
          tempModel.position.set(0, -1000, 0);
          scene.add(tempModel);
          try {
            renderer.render(scene, camera);
            console.log(`   ✓ Finalized: ${url}`);
          } catch (compileError) {
            console.warn(
              `   ⚠️ Finalizing render error for ${url}:`,
              compileError
            );
          }
          scene.remove(tempModel);
          finalizedCount++;
          updateManualProgress(
            finalizedCount,
            totalModelsToFinalize,
            "Finalizing..."
          );
        } else {
          console.warn(
            `   Skipping finalization for ${url}, cache entry invalid.`
          );
          totalModelsToFinalize--;
        }
      }
    }
    console.log(
      `🏁 Final render pass complete (${finalizedCount}/${totalModelsToFinalize}).`
    );
  } else {
    console.warn(
      "⚠️ Cannot perform final render pass: scene.environment is not ready."
    );
  }

  const splashScreen = document.getElementById("splash-screen");
  if (splashScreen) {
    splashScreen.classList.add("fade-out");
    const vrButton = document.getElementById("VRButton");
    if (vrButton) vrButton.classList.add("visible");
    setTimeout(() => splashScreen.remove(), 500);
  }
  if (TESTING_MODE && !localStorage.getItem(TESTING_ALERT_KEY)) {
    showTestingModeAlert();
  }

  if (hasSavedProgress && playerName) {
    document
      .getElementById("progress-choice-overlay")
      .classList.remove("hidden");
  } else {
    showWelcomeScreen();
  }

  fpsLabel = createFpsLabel();
  debugGroup.visible = false;
  fpsLabel.position.set(-0.4, 0.3, -0.7);
  debugGroup.add(fpsLabel);
  scene.add(debugGroup);

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
    if (allFadedIn) isFadingInUI = false;
  }

  updateModelTransition(deltaTime);
  updateScrollAnimation(activeTextPanel, deltaTime);
  updateScrollAnimation(activeCreditsPanel, deltaTime);
  updateScrollAnimation(active_guide_panel, deltaTime);

  const typingAnim = getActiveTypingAnimation();
  if (typingAnim) {
    typingAnim.update(deltaTime);
  }

  if (isDebugVisible) {
    const tablePosition = new THREE.Vector3(-0.5, 0.8, -2.0);
    debugGroup.position.copy(tablePosition);
    debugGroup.lookAt(camera.position);
    updateFpsLabel(fpsLabel, fps);
  }

  if (isVRMode()) {
    handleVRHover();
    handleVRDrag(deltaTime);
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
  updateAvatar(deltaTime, elapsedTime);

  renderer.render(scene, camera);
}

/**
 * Mengganti state aplikasi dan memuat ulang UI.
 * @param {string} newState - State baru dari enum AppState.
 * @param {object} options - Opsi tambahan (mis: isTransitioning).
 */
function changeState(newState, options = {}) {
  if (newState === AppState.LANDING) {
    if (currentState === AppState.AVATAR_GREETING) {
      options.skipAvatarDrop = true;
    }
  }

  activeTextPanel = null;
  activeCreditsPanel = null;
  active_guide_panel = null;

  if (
    currentState === newState &&
    newState !== AppState.VIEWER &&
    !options.isTextUpdateOnly
  ) {
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
    if (completionCongratsSound && completionCongratsSound.isPlaying) {
      completionCongratsSound.stop();
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

  if (newState === AppState.AVATAR_GREETING && !options.isTextUpdateOnly) {
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

  if (!isVRMode() && !isUserInteracting && !isTransitioningWithinViewer) {
    // switch (newState) {
    //   case AppState.MODE_SELECTION:
    //   case AppState.AVATAR_GREETING:
    //   case AppState.LANDING:
    //   case AppState.MENU:
    //   case AppState.HELP:
    //   case AppState.QUIZ:
    //   case AppState.QUIZ_RESULT:
    //   case AppState.QUIZ_REPORT:
    //   case AppState.QUIZ_POST_COMPLETION_REPORT:
    //   case AppState.POST_QUIZ_CHOICE:
    //   case AppState.COMPLETION:
    //   case AppState.CREDITS:
    //   case AppState.VIEWER:
    //   case AppState.MINI_QUIZ:
    //   case AppState.MINI_QUIZ_RESULT:
    controls.enabled = true;
    //     camera.position.set(-0.35, 1.2, -0.3);
    //     controls.target.set(-0.35, 1.2, -0.5);
    //     break;
    // }
  }
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
      startVRSession(onVRSessionEnded, onVRSessionStarted);
      break;
    case "next_greeting":
      stopAudio();
      currentGreetingIndex++;
      changeState(AppState.AVATAR_GREETING, { isTextUpdateOnly: true });
      break;
    case "continue_to_landing":
      stopAudio();
      clearActiveTypingAnimation();
      stopAvatarDropAnimation();
      startAvatarFlyUpAnimation(() => {
        changeState(AppState.LANDING);
      });
      break;
    case "start_learning":
      if (currentState === AppState.LANDING) {
        startAvatarFlyUpAnimation(() => {
          changeState(AppState.MENU);
        });
      } else {
        changeState(AppState.MENU);
      }
      break;
    case "help":
      changeState(AppState.HELP);
      break;
    case "close_help":
      changeState(AppState.LANDING);
      break;
    case "back_to_menu":
      if (isTransitioningModel && currentState === AppState.VIEWER) {
        console.warn(
          "Back to menu clicked during transition. Forcing unload and state change."
        );
        stopModelAnimation();
        unloadComponentModel();
        isTransitioningModel = false;
      } else if (isTransitioningModel) {
        console.warn(
          "Back to menu clicked with active lock from non-viewer state? Forcing release."
        );
        isTransitioningModel = false;
      } else if (currentState === AppState.VIEWER) {
        isTransitioningModel = true;
        navButtons.forEach((btn) => setButtonEnabled(btn, false));
        startModelAnimation(true, () => {
          isTransitioningModel = false;
          changeState(AppState.MENU);
        });
        return;
      }
      changeState(AppState.MENU);
      break;
    case "back_to_landing":
      if (isTransitioningModel) {
        console.warn(
          "Back to landing clicked with active transition lock? Forcing release."
        );
        isTransitioningModel = false;
      }
      if (currentState === AppState.AVATAR_GREETING) {
        stopAudio();
        clearActiveTypingAnimation();
        stopAvatarDropAnimation();
        startAvatarFlyUpAnimation(() => {
          changeState(AppState.LANDING);
        });
        break;
      }
      changeState(AppState.LANDING);
      break;
    case "show_quiz":
      changeState(AppState.CONFIRM_FINAL_TEST);
      break;
    case "confirm_start_quiz":
      console.log("Final Test confirmed. Starting quiz...");
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
      if (currentState === AppState.LANDING) {
        startAvatarFlyUpAnimation(() => {
          changeState(AppState.QUIZ_REPORT);
        });
      } else {
        changeState(AppState.QUIZ_REPORT);
      }
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
      if (isTransitioningModel) {
        console.log("Blocked: Model transition already in progress.");
        return;
      }
      console.log("Next clicked: Setting lock, forcing unload.");
      isTransitioningModel = true;
      unloadComponentModel();
      transitionState.isAnimating = false;
      transitionState.onComplete = null;
      transitionState.onMidpoint = null;
      navButtons.forEach((btn) => setButtonEnabled(btn, false));

      const onAnimationMidpointNext = () => {
        console.log("OUT Midpoint: Triggering next state.");
        const shouldGoToMiniQuiz =
          currentComponentIndex === highestComponentUnlocked &&
          currentComponentIndex < components.length;

        if (shouldGoToMiniQuiz) {
          changeState(AppState.MINI_QUIZ);
        } else if (currentComponentIndex < components.length - 1) {
          currentComponentIndex++;
          changeState(AppState.VIEWER, { isTransitioning: true });
        } else {
          changeState(AppState.MENU);
          isTransitioningModel = false;
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
      if (isTransitioningModel) {
        console.log("Blocked: Model transition already in progress.");
        return;
      }
      console.log("Prev clicked: Setting lock, forcing unload.");
      isTransitioningModel = true;
      unloadComponentModel();
      transitionState.isAnimating = false;
      transitionState.onComplete = null;
      transitionState.onMidpoint = null;
      navButtons.forEach((btn) => setButtonEnabled(btn, false));

      const onAnimationMidpointPrev = () => {
        console.log("OUT Midpoint: Triggering previous state.");
        if (currentComponentIndex > 0) {
          currentComponentIndex--;
          changeState(AppState.VIEWER, { isTransitioning: true });
        } else {
          isTransitioningModel = false;
          reloadViewerNavigation();
        }
      };

      startModelAnimation(true, onAnimationMidpointPrev);
      break;
    case "play_audio":
      if (currentComponentIndex > -1 && components[currentComponentIndex]) {
        playComponentAudio(components[currentComponentIndex].audioFile);
      }
      break;
    case "show_quick_guide":
      current_guide_index = 0;
      if (currentState === AppState.LANDING) {
        startAvatarFlyUpAnimation(() => {
          changeState(AppState.QUICK_GUIDE);
          setTimeout(() => {
            active_guide_panel = scene.getObjectByProperty(
              "isGuidePanel",
              true
            );
          }, 0);
        });
      } else {
        changeState(AppState.QUICK_GUIDE);
        setTimeout(() => {
          active_guide_panel = scene.getObjectByProperty("isGuidePanel", true);
        }, 0);
      }
      break;
    case "prev_guide":
      if (current_guide_index > 0) {
        current_guide_index--;
        updateActiveGuidePanelTarget();
        reloadGuideNavigation();
      }
      break;
    case "next_guide":
      if (current_guide_index < guideData.length - 1) {
        current_guide_index++;
        updateActiveGuidePanelTarget();
        reloadGuideNavigation();
      }
      break;
    default:
      if (action.startsWith("select_")) {
        if (isTransitioningModel) {
          console.log(
            "Blocked: Model transition in progress, cannot select topic yet."
          );
          return;
        }
        isTransitioningModel = true;
        console.log("Select topic: Setting lock.");
        const index = parseInt(action.split("_")[1], 10);
        if (!isNaN(index) && index >= 0 && index < components.length) {
          currentComponentIndex = index;
          changeState(AppState.VIEWER, { isTransitioning: true });
        } else {
          console.warn("Invalid topic index, releasing lock.");
          isTransitioningModel = false;
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
  if (isTransitioningModel || isChangingDescription) {
    console.log(
      "Blocked: Model transition or description change already in progress."
    );
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

  console.log(`Changing description to index: ${newIndex}`);
  isChangingDescription = true;
  currentDescriptionIndex = newIndex;

  if (descriptionChangeTimeout) {
    clearTimeout(descriptionChangeTimeout);
  }

  updateActiveTextPanelTarget();

  descriptionChangeTimeout = setTimeout(() => {
    reloadViewerNavigation();
    isChangingDescription = false;
    descriptionChangeTimeout = null;
    console.log("Description change complete, UI reloaded.");
  }, CHANGE_DEBOUNCE_TIME);
}

/**
 * Memuat ulang UI berdasarkan state aplikasi saat ini.
 * @param {object} options - Opsi tambahan untuk diteruskan ke `create...` functions.
 */
function refreshUI(options = {}) {
  clearUI(options);
  switch (currentState) {
    case AppState.MODE_SELECTION:
      createModeSelectionPage();
      break;
    case AppState.AVATAR_GREETING:
      createAvatarGreetingPage(playerName, currentGreetingIndex, options);
      break;
    case AppState.LANDING:
      createLandingPage(playerName, options);
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
    case AppState.CONFIRM_FINAL_TEST:
      createFinalTestConfirmationPage();
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
      const continueBtn = viewerUIGroup.getObjectByName(
        "quizResultContinueButton"
      );
      if (continueBtn) {
        setButtonEnabled(continueBtn, false, "...");
        const activationDelay = 750;
        setTimeout(() => {
          const btnAgain = viewerUIGroup.getObjectByName(
            "quizResultContinueButton"
          );
          if (currentState === AppState.QUIZ_RESULT && btnAgain) {
            console.log("Activating Quiz Result continue button after delay.");
            setButtonEnabled(btnAgain, true);
          } else {
            console.log(
              "State changed before Quiz Result button activation timeout."
            );
          }
        }, activationDelay);
      }
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
    case AppState.QUICK_GUIDE:
      createQuickGuideScreen(guideData, current_guide_index);
      break;
  }
}
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

  createViewerPage(
    component,
    currentComponentIndex,
    currentDescriptionIndex,
    highestComponentUnlocked,
    hasAttemptedQuiz
  );
  activeTextPanel = scene.getObjectByProperty("isScrollableText", true);

  const releaseTransitionLockAndEnableUI = () => {
    console.log(
      `Model ${component.label} IN animation complete. Releasing lock.`
    );
    isTransitioningModel = false;
    reloadViewerNavigation();
  };

  if (component.modelFile) {
    loadComponentModel(
      component.modelFile,
      -0.5,
      releaseTransitionLockAndEnableUI
    );
  } else {
    setTimeout(() => {
      console.log("No model to load, releasing lock immediately.");
      isTransitioningModel = false;
      reloadViewerNavigation();
    }, 50);
  }
}

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
  activeTextPanel = scene.getObjectByProperty("isScrollableText", true);

  if (!isTransitioningModel) {
    console.log("Reloading nav, transition lock OFF, enabling buttons.");
    navButtons.forEach((btn) => {
      const action = btn.userData.action;
      if (action === "prev_description") {
        setButtonEnabled(btn, currentDescriptionIndex > 0);
      } else if (action === "next_description") {
        setButtonEnabled(
          btn,
          currentDescriptionIndex < component.description.length - 1
        );
      } else if (action !== "locked") {
        setButtonEnabled(btn, true);
      }
    });
  } else {
    console.log("Reloading nav, transition lock ON, buttons remain disabled.");
    navButtons.forEach((btn) => setButtonEnabled(btn, false));
  }
}

/**
 * Menggambar ulang navigasi pada halaman credits (tombol, page indicator).
 */
function reloadCreditsNavigation() {
  clearViewerUI();
  createCreditsScreen(creditsData, currentCreditIndex);
  activeCreditsPanel = scene.getObjectByProperty("isCreditsPanel", true);
}
function reloadGuideNavigation() {
  clearViewerUI();
  createQuickGuideScreen(guideData, current_guide_index);
  active_guide_panel = scene.getObjectByProperty("isGuidePanel", true);
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
function updateActiveGuidePanelTarget() {
  if (active_guide_panel) {
    const totalPages = active_guide_panel.userData.totalPages;
    active_guide_panel.userData.targetOffsetY =
      (totalPages - 1 - current_guide_index) / totalPages;
    active_guide_panel.userData.currentPage = current_guide_index;
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
  controls.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMappingExposure = 1;
  renderer.xr.setFramebufferScaleFactor(1.2);
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
 * Menjalankan animasi interpolasi (lerp) untuk scroll panel.
 * @param {THREE.Mesh} panel - Panel yang memiliki tekstur scrollable.
 * @param {number} deltaTime - Waktu delta dari render loop.
 */
function updateScrollAnimation(panel, deltaTime) {
  if (
    panel &&
    (panel.userData.isScrollableText ||
      panel.userData.isCreditsPanel ||
      panel.userData.isGuidePanel)
  ) {
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
// function loadProgress() {
//   try {
//     const savedData = localStorage.getItem(STORAGE_KEY);
//     if (savedData) {
//       const progress = JSON.parse(savedData);
//       playerName = progress.playerName || "";
//       highestComponentUnlocked = progress.highestComponentUnlocked || 0;
//       quizScore = progress.quizScore || 0;
//       hasAttemptedQuiz = progress.hasAttemptedQuiz || false;

//       for (let i = 0; i <= highestComponentUnlocked; i++) {
//         if (components[i]) {
//           components[i].unlocked = true;
//         }
//       }
//       console.log("Progres dimuat:", progress);
//       return true;
//     }
//     return false;
//   } catch (error) {
//     logError("Gagal memuat progress:", error);
//     return false;
//   }
// }

// test
function loadProgress() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const progress = JSON.parse(savedData);
      playerName = progress.playerName;
      highestComponentUnlocked = progress.highestComponentUnlocked || 0;
      quizScore = progress.quizScore || 0;
      hasAttemptedQuiz = progress.hasAttemptedQuiz || false;

      for (let i = 0; i <= highestComponentUnlocked; i++) {
        if (components[i]) components[i].unlocked = true;
      }

      if (SAMPLE_TEST_MODE) {
        applySampleTestUnlock();
      }
      return true;
    }
    return false;
  } catch (error) {
    logError("Gagal memuat progress", error);
    return false;
  }
}
// #endtest

/**
 * Menghapus progres pengguna dari LocalStorage dan me-reset state.
 */
// function resetProgress() {
//   localStorage.removeItem(STORAGE_KEY);

//   playerName = "";
//   highestComponentUnlocked = 0;
//   quizScore = 0;
//   hasAttemptedQuiz = false;

//   components.forEach((comp, index) => {
//     comp.unlocked = index === 0;
//   });

//   console.log("Progres telah direset.");
// }

// #test
function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
  playerName = "";
  highestComponentUnlocked = 0;
  quizScore = 0;
  hasAttemptedQuiz = false;
  components.forEach((comp, index) => {
    comp.unlocked = index === 0;
  });

  if (SAMPLE_TEST_MODE) {
    applySampleTestUnlock();
    saveProgress();
  }
  console.log("Progres telah direset.");
}
// #endtest
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
/**
 * Memuat aset lain seperti tekstur dan file audio.
 * @returns {Promise<void>}
 */
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
      "assets/audio/narration/completion_congrats.ogg",
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
                audioTimeouts.delete(tid);
              }
              audioCache[file] = buffer;
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

    Promise.all([texturePromise, ...audioPromises]).then(() => {
      console.log(`✓ All assets loaded. Audio: ${audioLoaded}/${totalAudio}`);
      setLoadingPhase(LoadingPhases.COMPLETE);
      resolve();
    });
  });
}

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
      camera.remove(oneShotSound);
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
  if (completionSound.isPlaying) {
    completionSound.stop();
  }
  if (completionCongratsSound && completionCongratsSound.isPlaying) {
    completionCongratsSound.stop();
  }

  completionSound.onEnded = () => {
    completionSound.onEnded = null;
    playControlledSound(
      completionCongratsSound,
      "assets/audio/narration/completion_congrats.ogg",
      { volume: 1 }
    );
  };

  const buffer = audioCache["assets/audio/sfx/completion.ogg"];
  if (buffer) {
    completionSound.setBuffer(buffer);
    completionSound.setLoop(false);
    completionSound.setVolume(0.5);
    completionSound.play();
  } else {
    console.error("Audio buffer untuk 'completion.ogg' tidak ditemukan.");
  }
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

  const aboutButton = document.getElementById("about-button");
  const sidebar = document.getElementById("about-sidebar");
  const closeSidebarButton = document.getElementById("close-sidebar-button");

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
    if (SAMPLE_TEST_MODE) {
      applySampleTestUnlock();
      saveProgress();
    }
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
  });

  nameContinueBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("player-name-input");
    let nameValue = nameInput.value.trim();
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
    // #test
    if (SAMPLE_TEST_MODE) {
      applySampleTestUnlock();
    }
    // #endtest
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
      if (vrButton) vrButton.remove();
      document.getElementById("container").classList.remove("hidden");
      startBackgroundMusic();
      changeState(AppState.MODE_SELECTION);
    }, fadeOutDuration);
  });

  if (aboutButton && sidebar && closeSidebarButton) {
    aboutButton.addEventListener("click", () => {
      sidebar.classList.remove("hidden");
      requestAnimationFrame(() => {
        sidebar.classList.add("visible");
      });
      isSidebarOpen = true;
    });

    closeSidebarButton.addEventListener("click", () => {
      sidebar.classList.remove("visible");
      sidebar.addEventListener("transitionend", function handler() {
        sidebar.classList.add("hidden");
        sidebar.removeEventListener("transitionend", handler);
      });
      isSidebarOpen = false;
    });

    document.addEventListener("click", (event) => {
      if (
        isSidebarOpen &&
        !sidebar.contains(event.target) &&
        !aboutButton.contains(event.target)
      ) {
        closeSidebarButton.click();
      }
    });
  } else {
    console.error("Sidebar elements not found!");
  }
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
    overlay.classList.remove("hidden");
    container.classList.add("hidden");
  } else {
    overlay.classList.add("hidden");
    container.classList.remove("hidden");
  }
}

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

init();
// #test
function applySampleTestUnlock() {
  const target = Math.min(SAMPLE_START_INDEX, components.length - 1);
  if (highestComponentUnlocked < target) highestComponentUnlocked = target;
  for (let i = 0; i <= target; i++) {
    if (components[i]) components[i].unlocked = true;
  }
}
// #endtest
function showTestingModeAlert() {
  const bar = document.createElement("div");
  bar.id = "testing-mode-alert";
  bar.style.cssText = `
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: #1E293B;
    color: #E2E8F0;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 10px 14px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.35);
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.35;
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: auto;
  `;
  bar.innerHTML = `
    <span style="white-space: pre-wrap">
      Testing Mode aktif — 11 materi terbuka dan soal final tes menjadi 5 dari 24 soal (khusus uji coba).
    </span>
    <button id="testing-alert-ok" style="
      margin-left: 8px; background:#10B981; color:white; border:none; border-radius:6px; padding:6px 10px; cursor:pointer;
    ">OK</button>
  `;
  document.body.appendChild(bar);

  const ok = document.getElementById("testing-alert-ok");
  ok.addEventListener("click", () => {
    localStorage.setItem(TESTING_ALERT_KEY, "1"); // “jangan tampil lagi” sampai cache dibersihkan
    bar.remove();
  });
}
