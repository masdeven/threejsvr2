import * as THREE from "three";

const splashScreen = document.getElementById("splash-screen");
const progressBar = document.getElementById("progress-bar");
const loadingText = document.getElementById("loading-text");

export const loadingManager = new THREE.LoadingManager();

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
};

loadingManager.onLoad = function () {
  console.log("Loading complete!");
  splashScreen.classList.add("fade-out");
  setTimeout(() => {
    if (splashScreen.parentNode) {
      splashScreen.parentNode.removeChild(splashScreen);
    }
  }, 500);
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = (itemsLoaded / itemsTotal) * 100;
  progressBar.style.width = progress + "%";
  loadingText.textContent = `Memuat ${itemsLoaded} / ${itemsTotal}...`;
};

loadingManager.onError = function (url) {
  console.error("There was an error loading " + url);
  const loadingText = document.getElementById("loading-text");
  if (loadingText) {
    loadingText.innerText = "Gagal memuat aset. Coba muat ulang halaman.";
  }
  const progressBar = document.getElementById("progress-bar");
  if (progressBar) progressBar.style.display = "none";
  const spinner = document.querySelector(".spinner");
  if (spinner) spinner.style.display = "none";
};
