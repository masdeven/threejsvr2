import * as THREE from "three";

const splashScreen = document.getElementById("splash-screen");
const progressBar = document.getElementById("progress-bar");
const loadingText = document.getElementById("loading-text");

export const loadingManager = new THREE.LoadingManager();

// Tracking system untuk loading
let loadingTimeout;
const LOADING_TIMEOUT = 30000; // 30 detik

// Fase loading yang terstruktur
export const LoadingPhases = {
  INITIALIZING: "initializing",
  LOADING_HIGH: "loading_high",
  LOADING_MEDIUM: "loading_medium",
  COMPLETE: "complete",
};

let currentLoadingPhase = LoadingPhases.INITIALIZING;

export function setLoadingPhase(phase) {
  currentLoadingPhase = phase;
  updateLoadingPhaseText();
}

function updateLoadingPhaseText() {
  if (!loadingText) return;

  const phaseMessages = {
    [LoadingPhases.INITIALIZING]: "Initializing application...",
    [LoadingPhases.LOADING_HIGH]: "Loading 3D models...",
    [LoadingPhases.LOADING_MEDIUM]: "Loading additional content...",
    [LoadingPhases.COMPLETE]: "Ready!",
  };

  loadingText.textContent = phaseMessages[currentLoadingPhase] || "Loading...";
}

loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log(
    `[${currentLoadingPhase}] Loading: ${url} (${itemsLoaded}/${itemsTotal})`
  );

  // Reset timeout setiap file baru
  clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    console.error("Loading timeout exceeded!");
    if (loadingText) {
      loadingText.innerText = "Loading timeout. Silakan refresh halaman.";
    }

    const spinner = document.querySelector(".spinner");
    if (spinner) spinner.style.display = "none";
  }, LOADING_TIMEOUT);
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = (itemsLoaded / itemsTotal) * 100;
  if (progressBar) {
    progressBar.style.width = progress + "%";
  }

  if (loadingText) {
    loadingText.textContent = `${currentLoadingPhase} ${itemsLoaded} / ${itemsTotal}...`;
  }

  console.log(`Progress: ${progress.toFixed(1)}% - ${url}`);
};

loadingManager.onLoad = function () {
  clearTimeout(loadingTimeout);
  console.log("✓ All assets in current phase loaded successfully!");

  if (currentLoadingPhase !== LoadingPhases.COMPLETE) {
    console.log(`Phase ${currentLoadingPhase} complete`);
  }
};

loadingManager.onError = function (url) {
  clearTimeout(loadingTimeout);
  console.error("✗ Error loading: " + url);

  if (loadingText) {
    loadingText.innerText = `Gagal memuat: ${url}\nCoba muat ulang halaman.`;
  }

  if (progressBar) progressBar.style.display = "none";

  const spinner = document.querySelector(".spinner");
  if (spinner) spinner.style.display = "none";
};

// Helper untuk tracking manual progress per fase
export function updateManualProgress(loaded, total, message = "") {
  const progress = (loaded / total) * 100;

  if (progressBar) {
    progressBar.style.width = progress + "%";
  }

  if (loadingText) {
    const baseMessage = message || currentLoadingPhase;
    loadingText.textContent = `${baseMessage} ${loaded}/${total}`;
  }
}
