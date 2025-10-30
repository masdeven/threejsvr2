import * as THREE from "three";

const LOADING_TIMEOUT = 30000;

export const LoadingPhases = {
  INITIALIZING: "initializing",
  LOADING_HIGH: "loading_high",
  LOADING_MEDIUM: "loading_medium",
  COMPLETE: "complete",
};

const splashScreen = document.getElementById("splash-screen");
const progressBar = document.getElementById("progress-bar");
const loadingText = document.getElementById("loading-text");
const spinner = document.querySelector(".spinner");

let loadingTimeout;
let currentLoadingPhase = LoadingPhases.INITIALIZING;

export const loadingManager = new THREE.LoadingManager();

/**
 * Dipanggil saat file baru mulai dimuat.
 * Mereset timeout loading.
 */
loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log(
    `[${currentLoadingPhase}] Loading: ${url} (${itemsLoaded}/${itemsTotal})`
  );

  clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    console.error("Loading timeout exceeded!");
    if (loadingText) {
      loadingText.innerText = "Loading timeout. Please refresh the page.";
    }
    if (spinner) {
      spinner.style.display = "none";
    }
  }, LOADING_TIMEOUT);
};

/**
 * Dipanggil setiap kali ada progres pemuatan file.
 * Mengupdate progress bar dan teks.
 */
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

/**
 * Dipanggil saat semua file dalam antrian manajer selesai dimuat.
 */
loadingManager.onLoad = function () {
  clearTimeout(loadingTimeout);
  console.log("✓ All assets in current phase loaded successfully!");

  if (currentLoadingPhase !== LoadingPhases.COMPLETE) {
    console.log(`Phase ${currentLoadingPhase} complete`);
  }
};

/**
 * Dipanggil jika terjadi error saat memuat file.
 * Menampilkan pesan error di UI.
 */
loadingManager.onError = function (url) {
  clearTimeout(loadingTimeout);
  console.error("✗ Error loading: " + url);

  if (loadingText) {
    loadingText.innerText = `Failed to load: ${url}\nPlease refresh the page.`;
  }

  if (progressBar) {
    progressBar.style.display = "none";
  }
  if (spinner) {
    spinner.style.display = "none";
  }
};

/**
 * Mengatur fase loading saat ini dan memperbarui teks UI.
 * @param {string} phase - Nilai dari enum LoadingPhases.
 */
export function setLoadingPhase(phase) {
  currentLoadingPhase = phase;
  updateLoadingPhaseText();
}

/**
 * Mengupdate progress bar secara manual.
 * Berguna untuk proses loading yang tidak menggunakan THREE.LoadingManager (mis: preload audio).
 * @param {number} loaded - Jumlah item yang sudah dimuat.
 * @param {number} total - Total item yang harus dimuat.
 * @param {string} [message=""] - Pesan kustom untuk ditampilkan.
 */
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

/**
 * Memperbarui teks di splash screen berdasarkan fase loading saat ini.
 */
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
