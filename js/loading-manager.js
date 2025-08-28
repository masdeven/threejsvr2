import * as THREE from "three";

// Ambil elemen HTML
const splashScreen = document.getElementById("splash-screen");
const progressBar = document.getElementById("progress-bar");
const loadingText = document.getElementById("loading-text");

// Buat satu instance LoadingManager
export const loadingManager = new THREE.LoadingManager();

// Definisikan callback
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
  // Tambahkan class untuk memicu animasi fade-out
  splashScreen.classList.add("fade-out");
  // Hapus elemen dari DOM setelah animasi selesai
  setTimeout(() => {
    if (splashScreen.parentNode) {
      splashScreen.parentNode.removeChild(splashScreen);
    }
  }, 500); // 500ms sesuai durasi transisi di CSS
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = (itemsLoaded / itemsTotal) * 100;
  progressBar.style.width = progress + "%";
  loadingText.textContent = `Memuat ${itemsLoaded} / ${itemsTotal}...`;
};

loadingManager.onError = function (url) {
  console.error("There was an error loading " + url);
};
