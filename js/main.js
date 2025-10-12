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
  navButtons,
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

let audioListener, sound, backgroundSound, completionSound, greetingSound;
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
let isChangingDescription = false; // ✅ Tambahkan ini
let descriptionChangeTimeout = null; // ✅ Tambahkan ini
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

    for (let i = 0; i <= highestComponentUnlocked; i++) {
      if (components[i]) {
        components[i].unlocked = true;
      }
    }
    console.log("Progres dimuat:", progress);
    return true;
  }
  return false;
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

async function init() {
  checkOrientation();
  window.addEventListener("resize", checkOrientation);

  stats = new Stats();
  document.body.appendChild(stats.dom);
  stats.dom.style.display = "none";

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
    const nameValue = nameInput.value.trim();
    const nameOverlay = document.getElementById("name-input-overlay");

    if (nameValue === "") {
      nameInput.classList.add("shake");

      setTimeout(() => {
        nameInput.classList.remove("shake");
      }, 500);

      return;
    }

    playerName = nameInput.value.trim() || "Tamu";
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

function preloadModels() {
  return new Promise((resolve) => {
    updateLoadingText("Loading 3D models...");

    const modelFiles = components
      .filter((c) => c.modelFile)
      .map((c) => c.modelFile);

    if (modelFiles.length === 0) {
      console.log("No 3D models to preload.");
      resolve();
      return;
    }

    let modelsLoaded = 0;
    let modelsWithErrors = 0;
    const totalModels = modelFiles.length;

    const checkComplete = () => {
      if (modelsLoaded + modelsWithErrors === totalModels) {
        if (modelsWithErrors > 0) {
          console.warn(`${modelsWithErrors} model(s) failed to load.`);
        }
        console.log(
          `${modelsLoaded}/${totalModels} models loaded successfully.`
        );
        resolve();
      }
    };

    modelFiles.forEach((file) => {
      loader.load(
        file,
        (gltf) => {
          modelCache[file] = gltf.scene;
          modelsLoaded++;
          console.log(`✓ Loaded: ${file} (${modelsLoaded}/${totalModels})`);

          // Update progress bar
          const progress =
            ((modelsLoaded + modelsWithErrors) / totalModels) * 100;
          const progressBar = document.getElementById("progress-bar");
          const loadingText = document.getElementById("loading-text");

          if (progressBar) {
            progressBar.style.width = progress + "%";
          }
          if (loadingText) {
            loadingText.textContent = `Loading models... ${modelsLoaded}/${totalModels}`;
          }

          checkComplete();
        },
        undefined,
        (error) => {
          console.error(`✗ Failed to load: ${file}`, error);
          modelsWithErrors++;
          checkComplete();
        }
      );
    });
  });
}

function preloadOtherAssets() {
  return new Promise((resolve) => {
    updateLoadingText("Loading audio and textures...");

    const tempTextureLoader = new THREE.TextureLoader(loadingManager);
    const texturePromise = new Promise((res) => {
      tempTextureLoader.load(
        "assets/images/logo-kampus.png",
        () => res(),
        undefined,
        () => res()
      );
    });

    const greetingAudioFiles = GREETING_DATA("").map((g) => g.audioFile);
    const audioFilesToPreload = [
      "assets/audio/sfx/button_press.ogg",
      "assets/audio/sfx/button_confirm.ogg",
      "assets/audio/sfx/completion.ogg",
      "assets/audio/music/background_music.ogg",
      ...components.filter((c) => c.audioFile).map((c) => c.audioFile),
      ...greetingAudioFiles,
    ];
    const uniqueAudioFiles = [...new Set(audioFilesToPreload)];

    const audioPromises = uniqueAudioFiles.map(
      (file) =>
        new Promise((res) => {
          audioLoader.load(
            file,
            (buffer) => {
              audioCache[file] = buffer;
              res();
            },
            undefined,
            () => res()
          );
        })
    );

    Promise.all([texturePromise, ...audioPromises]).then(() => {
      console.log("All other assets are loaded.");
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

function changeState(newState, options = {}) {
  requestAnimationFrame(() => {
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
  // Guard: prevent multiple simultaneous changes
  if (isChangingComponent || isChangingDescription) {
    return;
  }

  const component = components[currentComponentIndex];
  if (!component) return;

  // Calculate new index based on direction
  let newIndex = currentDescriptionIndex;

  if (direction === "prev") {
    if (currentDescriptionIndex > 0) {
      newIndex = currentDescriptionIndex - 1;
    } else {
      return; // Already at first page
    }
  } else if (direction === "next") {
    if (currentDescriptionIndex < component.description.length - 1) {
      newIndex = currentDescriptionIndex + 1;
    } else {
      return; // Already at last page
    }
  }

  // Set flag to prevent concurrent changes
  isChangingDescription = true;
  currentDescriptionIndex = newIndex;

  // Disable description navigation buttons immediately
  navButtons.forEach((btn) => {
    const action = btn.userData.action;
    if (action === "prev_description" || action === "next_description") {
      setButtonEnabled(btn, false);
    }
  });

  // Clear any existing timeout (debouncing)
  if (descriptionChangeTimeout) {
    clearTimeout(descriptionChangeTimeout);
  }

  // Update scroll animation target immediately for smooth transition
  updateActiveTextPanelTarget();

  // Debounce the UI reload to prevent rapid consecutive calls
  descriptionChangeTimeout = setTimeout(() => {
    reloadViewerNavigation();

    // Reset flag
    isChangingDescription = false;

    // Re-enable buttons based on new position
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
  }, 150); // 150ms debounce delay
}

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
      changeDescription("prev"); // ✅ Gunakan fungsi debounced
      break;

    case "next_description":
      changeDescription("next"); // ✅ Gunakan fungsi debounced
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

  const currentModel = getCurrentModel();

  if (currentModel) {
    currentModel.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = true; // Pastikan aktif
      }
    });
  }

  frameCount++;
  const now = performance.now();
  if (now - lastFpsUpdate >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = now;
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

  if (activeTypingAnimation) {
    activeTypingAnimation.update(deltaTime);
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
