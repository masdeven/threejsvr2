import * as THREE from "three";

const splashScreen = document.getElementById("splash-screen");
const progressBar = document.getElementById("progress-bar");
const loadingText = document.getElementById("loading-text");

export const loadingManager = new THREE.LoadingManager();

// ✅ TAMBAHKAN: Variable untuk timeout
let loadingTimeout;
const LOADING_TIMEOUT = 30000; // 30 detik

// ✅ UPDATE: onStart dengan timeout
loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log(
    "Started loading file: " +
      url +
      ".\nLoaded " +
      itemsLoaded +
      " of " +
      itemsTotal +
      " files."
  );

  // Set timeout - reset setiap kali ada file baru dimuat
  clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    console.error("Loading timeout exceeded!");
    if (loadingText) {
      loadingText.innerText = "Loading timeout. Silakan refresh halaman.";
    }
    // Sembunyikan spinner
    const spinner = document.querySelector(".spinner");
    if (spinner) spinner.style.display = "none";
  }, LOADING_TIMEOUT);
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = (itemsLoaded / itemsTotal) * 100;
  progressBar.style.width = progress + "%";
  loadingText.textContent = `Initializing ${itemsLoaded} / ${itemsTotal}...`;
};

// ✅ TAMBAHKAN: onLoad untuk clear timeout saat semua asset berhasil dimuat
loadingManager.onLoad = function () {
  clearTimeout(loadingTimeout);
  console.log("All assets loaded successfully!");
};

// ✅ UPDATE: onError dengan clear timeout
loadingManager.onError = function (url) {
  clearTimeout(loadingTimeout); // Clear timeout saat ada error
  console.error("There was an error loading " + url);

  const loadingText = document.getElementById("loading-text");
  if (loadingText) {
    loadingText.innerText = `Gagal memuat: ${url}\nCoba muat ulang halaman.`;
  }

  const progressBar = document.getElementById("progress-bar");
  if (progressBar) progressBar.style.display = "none";

  const spinner = document.querySelector(".spinner");
  if (spinner) spinner.style.display = "none";
};
