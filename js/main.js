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
} from "./ui-creator.js";
import {
  loadComponentModel,
  unloadComponentModel,
  updateModelRotation,
} from "./model-loader.js";
import { setupInteraction } from "./interaction-manager.js";
import { initVR, isVRMode } from "./vr-manager.js";

let audioListener, sound;
const audioLoader = new THREE.AudioLoader();

const AppState = {
  LANDING: "LANDING",
  MENU: "MENU",
  VIEWER: "VIEWER",
  HELP: "HELP",
};
let currentState = null;
let currentComponentIndex = -1;

function refreshUI() {
  clearUI();
  switch (currentState) {
    case AppState.LANDING:
      createLandingPage();
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
  }
}

function init() {
  audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  sound = new THREE.Audio(audioListener);

  initVR(refreshUI);
  setupInteraction(handleInteraction);
  changeState(AppState.LANDING);
  animate();
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
    case "next_component":
      currentComponentIndex++;
      reloadViewer();
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
