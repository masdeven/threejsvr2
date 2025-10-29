import * as THREE from "three";
import { scene, camera, renderer } from "./scene-setup.js";
import { components } from "./component-data.js";
import { isVRMode } from "./vr-manager.js";
import { quizData } from "./quiz-data.js";
import { loader } from "./model-loader.js";
import { TextureLoader } from "three";

// ===============================================================
// KONSTANTA & STATE MODUL
// ===============================================================

// --- Font & Warna ---
export const FONT = "bold 32px Arial, sans-serif";
export const LOGICAL_RESOLUTION = 1024; // ↑ Increased from 768
const logicalBaseFontSize = 14; // ↑ Increased from 24
// const BG_COLOR = "#000000ff";
const BG_COLOR = "#00000002";
// const BTN_COLOR_PRIMARY = "#00000088";

const BTN_COLOR_PRIMARY = "#5579bf88";
const BTN_COLOR_SECONDARY = "#4b4b4b8a";
const BTN_COLOR_HOVER = "#2727278a";
const TEXT_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#3182CE"; // Untuk skor

// --- Posisi & Jarak ---
const UI_DISTANCE = 2.5; // Jarak UI dari kamera di mode VR
const VIEWER_UI_POSITION = new THREE.Vector3(0.37, 1.2107, -0.982);
const VIEWER_UI_LOOKAT = new THREE.Vector3(0.37, 1.2107, 0);

// --- Grup Scene ---
export const uiGroup = new THREE.Group();
scene.add(uiGroup);
export const viewerUIGroup = new THREE.Group();
scene.add(viewerUIGroup);
export const debugGroup = new THREE.Group();
scene.add(debugGroup);

// --- Loader ---
const textureLoader = new TextureLoader();

// --- State Avatar ---
let isAvatarInitialized = false;
let avatarMixer;
let currentAvatar = null;
let avatarModel = null;
let avatarDropAnimation = {
  isAnimating: false,
  startY: 0,
  targetY: 0,
  currentY: 0,
  speed: 8,
  onComplete: null,
};
let avatarFlyUpAnimation = {
  isAnimating: false,
  startY: 0,
  targetY: 0,
  currentY: 0,
  speed: 8, // Lebih cepat untuk "exit"
  onComplete: null,
};

// --- State Animasi ---
let activeTypingAnimation = null;

// --- State UI ---
export let navButtons = []; // Tombol navigasi di viewer page

// ===============================================================
// DATA (GREETING)
// ===============================================================

export const GREETING_DATA = (playerName) => [
  {
    text: `Hello, I'm Aria! It's great to meet you.\nWelcome to the WebXR Computer Lab application.`,
    audioFile: "assets/audio/narration/greeting/greeting_0.ogg",
  },
  {
    text: "Here, you can explore 3D models of computer hardware, try mini-quizzes, and test your knowledge in the final test.",
    audioFile: "assets/audio/narration/greeting/greeting_1.ogg",
  },
  {
    text: "Follow the material step-by-step. Each section includes a mini-quiz to test your knowledge before unlocking the next one.",
    audioFile: "assets/audio/narration/greeting/greeting_2.ogg",
  },
  {
    text: "Once you've finished all the topics, head to the 'Select Topic' menu to take the final test and evaluate your overall understanding.",
    audioFile: "assets/audio/narration/greeting/greeting_3.ogg",
  },
  {
    text: "After taking the final test, you can view your learning report in the 'Learning Report' menu to see your achievements and progress.",
    audioFile: "assets/audio/narration/greeting/greeting_4.ogg",
  },
  {
    text: "Oh, and don't forget! You can spin the 3D models around by hand to check out all the details. 😄",
    audioFile: "assets/audio/narration/greeting/greeting_5.ogg",
  },
  {
    text: "Happy learning, and hope you have fun!",
    audioFile: "assets/audio/narration/greeting/greeting_6.ogg",
  },
];

// ===============================================================
// MANAJEMEN ANIMASI (TYPING)
// ===============================================================

export function setActiveTypingAnimation(animation) {
  activeTypingAnimation = animation;
}

export function getActiveTypingAnimation() {
  return activeTypingAnimation;
}

export function clearActiveTypingAnimation() {
  activeTypingAnimation = null;
  console.log("✓ Typing animation cleared");
}

// ===============================================================
// MANAJEMEN AVATAR
// ===============================================================

/**
 * Memuat model avatar (bot.glb) ke dalam cache (avatarModel).
 * @returns {Promise<THREE.Group>}
 */
export function preloadAvatar() {
  return new Promise((resolve, reject) => {
    if (avatarModel) {
      resolve(avatarModel);
      return;
    }
    loader.load(
      "assets/models/bot.glb",
      (gltf) => {
        avatarModel = gltf; // Simpan GLTF utuh (termasuk animasi)
        resolve(avatarModel);
      },
      undefined,
      (error) => {
        console.error("An error happened while preloading the avatar:", error);
        reject(error);
      }
    );
  });
}

/**
 * Mengatur posisi, skala, dan animasi avatar.
 * @param {THREE.Object3D} model - Instance klon dari model avatar.
 * @param {THREE.Vector3} scale - Skala avatar.
 * @param {THREE.Vector3} position - Posisi final avatar.
 * @param {boolean} shouldAnimate - Apakah avatar harus melakukan animasi jatuh (drop).
 */
function setupAvatar(model, scale, position, shouldAnimate = false) {
  currentAvatar = model;
  model.scale.copy(scale);
  model.position.copy(position);
  model.rotation.y = 0.2;
  model.userData.initialY = position.y;
  model.userData.hoverStartTime = -1;
  viewerUIGroup.add(model);

  if (shouldAnimate) {
    const dropHeight = 3; // Sekarang nilai ini akan berpengaruh

    // Koreksi: Bagi dropHeight dengan skala y dari avatar
    // untuk mendapatkan ketinggian yang benar di local space.
    model.position.y = position.y + dropHeight;

    avatarDropAnimation.isAnimating = true;
    avatarDropAnimation.startY = model.position.y;
    avatarDropAnimation.targetY = position.y;
    avatarDropAnimation.currentY = model.position.y;
  }

  // Mainkan animasi idle (jika ada)
  if (avatarModel.animations && avatarModel.animations.length) {
    avatarMixer = new THREE.AnimationMixer(model);
    const action = avatarMixer.clipAction(avatarModel.animations[0]);
    action.play();
  }
}

/**
 * Menghentikan animasi jatuh avatar secara paksa.
 */
export function stopAvatarDropAnimation() {
  if (avatarDropAnimation.isAnimating) {
    avatarDropAnimation.isAnimating = false;
    avatarDropAnimation.onComplete = null; // Hapus callback

    // Langsung pindah ke posisi final
    if (currentAvatar && currentAvatar.userData.initialY !== undefined) {
      currentAvatar.position.y = currentAvatar.userData.initialY;
    }
    console.log("✓ Avatar drop animation stopped");
  }
}

/**
 * Mengupdate animasi jatuh avatar (dipanggil di render loop).
 * @param {number} deltaTime - Waktu delta.
 */
export function updateAvatarDropAnimation(deltaTime) {
  if (!avatarDropAnimation.isAnimating || !currentAvatar) return;

  const currentY = avatarDropAnimation.currentY;
  const targetY = avatarDropAnimation.targetY;
  const speed = avatarDropAnimation.speed;

  // Lerp ke target
  avatarDropAnimation.currentY = THREE.MathUtils.lerp(
    currentY,
    targetY,
    speed * deltaTime
  );
  currentAvatar.position.y = avatarDropAnimation.currentY;

  // Cek jika sudah sampai
  if (Math.abs(currentY - targetY) < 0.001) {
    currentAvatar.position.y = targetY;
    avatarDropAnimation.isAnimating = false;
    currentAvatar.userData.hoverStartTime = -1;

    // Panggil callback jika ada
    if (avatarDropAnimation.onComplete) {
      avatarDropAnimation.onComplete();
      avatarDropAnimation.onComplete = null;
    }
  }
}

// ... (Tepat setelah fungsi updateAvatarDropAnimation)

/**
 * Mengupdate animasi terbang ke atas avatar (dipanggil di render loop).
 * @param {number} deltaTime - Waktu delta.
 */
export function updateAvatarFlyUpAnimation(deltaTime) {
  if (!avatarFlyUpAnimation.isAnimating || !currentAvatar) return;

  const currentY = avatarFlyUpAnimation.currentY;
  const targetY = avatarFlyUpAnimation.targetY;
  const speed = avatarFlyUpAnimation.speed;

  // Lerp ke target
  avatarFlyUpAnimation.currentY = THREE.MathUtils.lerp(
    currentY,
    targetY,
    speed * deltaTime
  );
  currentAvatar.position.y = avatarFlyUpAnimation.currentY;

  // Cek jika sudah sampai
  if (Math.abs(currentY - targetY) < 0.001) {
    currentAvatar.position.y = targetY;
    avatarFlyUpAnimation.isAnimating = false;

    // Panggil callback jika ada
    if (avatarFlyUpAnimation.onComplete) {
      avatarFlyUpAnimation.onComplete();
      avatarFlyUpAnimation.onComplete = null;
    }
  }
}

/**
 * Memulai animasi avatar terbang ke atas sebelum pindah state.
 * @param {Function} onCompleteCallback - Fungsi yang dipanggil setelah animasi selesai.
 */
export function startAvatarFlyUpAnimation(onCompleteCallback) {
  if (
    !currentAvatar ||
    avatarFlyUpAnimation.isAnimating ||
    avatarDropAnimation.isAnimating
  ) {
    // Jika tidak ada avatar atau sedang animasi lain, langsung jalankan callback
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  currentAvatar.userData.hoverStartTime = -1;

  const flyUpHeight = 2; // Seberapa tinggi avatar terbang
  const startY = currentAvatar.position.y;
  // Ambil initialY (posisi diam) dan tambahkan tinggi terbang
  const targetY = (currentAvatar.userData.initialY || startY) + flyUpHeight;

  avatarFlyUpAnimation.isAnimating = true;
  avatarFlyUpAnimation.startY = startY;
  avatarFlyUpAnimation.targetY = targetY;
  avatarFlyUpAnimation.currentY = startY;
  avatarFlyUpAnimation.onComplete = onCompleteCallback;
}

/**
 * Menghentikan animasi terbang avatar secara paksa.
 */
export function stopAvatarFlyUpAnimation() {
  if (avatarFlyUpAnimation.isAnimating) {
    avatarFlyUpAnimation.isAnimating = false;
    avatarFlyUpAnimation.onComplete = null; // Hapus callback
    console.log("✓ Avatar fly-up animation stopped");
  }
}

/**
 * Mengatur visibilitas avatar.
 * @param {boolean} visible - True untuk terlihat, false untuk sembunyi.
 */
export function toggleAvatarVisibility(visible) {
  if (currentAvatar) {
    currentAvatar.visible = visible;
  }
}

/**
 * Mengupdate animasi mixer dan hover avatar (dipanggil di render loop).
 * @param {number} deltaTime - Waktu delta.
 * @param {number} elapsedTime - Waktu total.
 */
export function updateAvatar(deltaTime, elapsedTime) {
  // 1. Update animasi jatuh
  updateAvatarDropAnimation(deltaTime);

  updateAvatarFlyUpAnimation(deltaTime);

  // 2. Update animasi idle
  if (avatarMixer) {
    avatarMixer.update(deltaTime);
  }

  // 3. Update animasi hover (mengambang)
  if (
    currentAvatar &&
    currentAvatar.userData.initialY !== undefined &&
    !avatarDropAnimation.isAnimating &&
    !avatarFlyUpAnimation.isAnimating
  ) {
    // === AWAL PERBAIKAN HOVER ===
    // Cek jika hover timer perlu di-reset (di-set -1 oleh drop/fly anim)
    if (currentAvatar.userData.hoverStartTime === -1) {
      currentAvatar.userData.hoverStartTime = elapsedTime;
    }

    // Gunakan waktu lokal untuk hover, bukan elapsedTime global
    const hoverTime = elapsedTime - currentAvatar.userData.hoverStartTime;
    // === AKHIR PERBAIKAN HOVER ===

    const hoverAmplitude = 0.04;
    const hoverSpeed = 1.5;

    currentAvatar.position.y =
      currentAvatar.userData.initialY +
      Math.sin(hoverTime * hoverSpeed) * hoverAmplitude; // <-- Gunakan hoverTime
  }
}

// ===============================================================
// FUNGSI UTILITAS UI (INTERNAL)
// ===============================================================

/**
 * Mendapatkan resolusi canvas target yang tinggi dan konsisten.
 * @returns {number} - Resolusi (mis: 1536).
 */
// ✅ BENAR: VR butuh resolution LEBIH TINGGI karena pixel density headset
export function getResolution() {
  if (isVRMode()) {
    // VR headset butuh 2-4x lebih tinggi untuk text clarity
    return 2048; // ↑ Increased from 1024
  } else {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const screenWidth = window.innerWidth;
    let baseResolution;
    if (screenWidth <= 1024) {
      baseResolution = 1024;
    } else if (screenWidth <= 1440) {
      baseResolution = 1536;
    } else {
      baseResolution = 2048;
    }
    return baseResolution * dpr;
  }
}

/**
 * Utility untuk menggambar teks dengan word-wrap di canvas.
 * @returns {object} - { pixelHeight, lineCount }
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, draw = true) {
  const lines = text.split("\n"); // Handle newline manual
  let currentY = y;
  let totalLines = 0;
  for (const initialLine of lines) {
    const words = initialLine.split(" ");
    let line = "";
    let lineCount = 1;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        if (draw) ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
        lineCount++;
      } else {
        line = testLine;
      }
    }
    if (draw) ctx.fillText(line, x, currentY);
    if (lines.length > 1) {
      currentY += lineHeight;
    }
    totalLines += lineCount;
  }
  return { pixelHeight: totalLines * lineHeight, lineCount: totalLines };
}

/**
 * Membuat mesh panel UI (kotak rounded) sebagai latar belakang.
 */
function createUIPanel(width, height, radius, color = BG_COLOR, opacity = 0.7) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const panelResolution = getResolution();

  canvas.width = width * panelResolution;
  canvas.height = height * panelResolution;

  const r = radius * panelResolution;
  const clampedR = Math.min(
    r,
    (width * panelResolution) / 2,
    (height * panelResolution) / 2
  );

  // Gambar rounded rectangle
  ctx.beginPath();
  ctx.moveTo(clampedR, 0);
  ctx.lineTo(canvas.width - clampedR, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, clampedR);
  ctx.lineTo(canvas.width, canvas.height - clampedR);
  ctx.quadraticCurveTo(
    canvas.width,
    canvas.height,
    canvas.width - clampedR,
    canvas.height
  );
  ctx.lineTo(clampedR, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - clampedR);
  ctx.lineTo(0, clampedR);
  ctx.quadraticCurveTo(0, 0, clampedR, 0);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    opacity: opacity,
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1; // Render di belakang elemen lain
  return mesh;
}

/**
 * Membuat mesh tombol interaktif.
 */
function createButton(
  text,
  action,
  width = 1,
  height = 0.25,
  bgColor = BTN_COLOR_PRIMARY,
  shape = "roundedRectangle"
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const buttonResolution = getResolution();

  canvas.width = width * buttonResolution;
  canvas.height = height * buttonResolution;

  ctx.fillStyle = bgColor;
  const padding = 0; // Padding 0 seperti di kode asli

  if (shape === "circle") {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - padding;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    // Rounded rectangle
    const r = 10 * (buttonResolution / getResolution()); // Radius sudut tetap 10
    const x = padding;
    const y = padding;
    const w = canvas.width - padding * 2;
    const h = canvas.height - padding * 2;
    const clampedR = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + clampedR, y);
    ctx.lineTo(x + w - clampedR, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + clampedR);
    ctx.lineTo(x + w, y + h - clampedR);
    ctx.quadraticCurveTo(x + w, y + h, x + w - clampedR, y + h);
    ctx.lineTo(x + clampedR, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - clampedR);
    ctx.lineTo(x, y + clampedR);
    ctx.quadraticCurveTo(x, y, x + clampedR, y);
    ctx.closePath();
    ctx.fill();
  }

  // Gambar Teks
  ctx.fillStyle = TEXT_COLOR;
  const vrFontScale = 1;
  const resolution = getResolution();
  const fontStyle = shape === "circle" ? "normal" : FONT.split(" ")[0];
  let baseFontSize = height * resolution * 0.5;
  if (shape === "circle") {
    baseFontSize *= 1.2;
  }
  const finalFontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  ctx.font = `${fontStyle} ${finalFontSize}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const verticalOffset = shape === "circle" ? finalFontSize * 0.05 : 0;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + verticalOffset);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = {
    isButton: true,
    action: action,
    text: text,
    colors: { default: bgColor, hover: BTN_COLOR_HOVER },
    canvasContext: ctx,
    currentState: "default",
  };

  return mesh;
}

function createTopicButton(
  text,
  action,
  width = 1,
  height = 0.25,
  bgColor = BTN_COLOR_PRIMARY
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const buttonResolution = getResolution();

  canvas.width = width * buttonResolution;
  canvas.height = height * buttonResolution;

  ctx.fillStyle = bgColor;
  const padding = 0; // Padding 0 seperti di kode asli

  // Gambar rounded rectangle (Sama seperti createButton)
  const r = 10 * (buttonResolution / getResolution()); // Radius sudut tetap 10
  const x = padding;
  const y = padding;
  const w = canvas.width - padding * 2;
  const h = canvas.height - padding * 2;
  const clampedR = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + clampedR, y);
  ctx.lineTo(x + w - clampedR, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + clampedR);
  ctx.lineTo(x + w, y + h - clampedR);
  ctx.quadraticCurveTo(x + w, y + h, x + w - clampedR, y + h);
  ctx.lineTo(x + clampedR, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - clampedR);
  ctx.lineTo(x, y + clampedR);
  ctx.quadraticCurveTo(x, y, x + clampedR, y);
  ctx.closePath();
  ctx.fill();

  // --- PERUBAHAN UTAMA DI SINI ---
  // Gambar Teks
  ctx.fillStyle = TEXT_COLOR;
  const vrFontScale = 1;
  const resolution = getResolution();
  const fontStyle = FONT.split(" ")[0]; // "bold"
  let baseFontSize = height * resolution * 0.5; // Ukuran font sama
  const finalFontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  ctx.font = `${fontStyle} ${finalFontSize}px Verdana, Geneva, sans-serif`;

  // 1. Ubah perataan teks
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // 2. Tentukan padding kiri untuk teks (disesuaikan dengan resolusi)
  const logicalTextPadding = 8; // 20px padding logis
  const textPadding =
    logicalTextPadding * (buttonResolution / LOGICAL_RESOLUTION);

  // 3. Gambar teks di posisi X yang baru
  const verticalOffset = 0; // Vertikal tetap di tengah
  ctx.fillText(text, textPadding, canvas.height / 2 + verticalOffset);
  // --- AKHIR PERUBAHAN ---

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = {
    isButton: true,
    action: action,
    text: text,
    colors: { default: bgColor, hover: BTN_COLOR_HOVER },
    canvasContext: ctx,
    currentState: "default",
    textAlign: "left",
  };

  return mesh;
}

/**
 * Membuat panel teks yang bisa di-scroll (untuk deskripsi, kuis, dll).
 */
function createTextPanel(descriptions, width, options = {}) {
  const { fixedHeight = null } = options;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const descriptionsArray = Array.isArray(descriptions)
    ? descriptions
    : [descriptions];
  // Diubah dari if/else (20, 22, 25)

  const currentResolution = getResolution(); // Akan menjadi 1536 (non-VR)
  const scaleFactor = currentResolution / LOGICAL_RESOLUTION; // 1536 / 768 = 2
  const scaledBaseFontSize = logicalBaseFontSize * scaleFactor; // 24 * 2 = 48px

  const vrFontScale = 1;
  const finalFontSize = Math.round(
    isVRMode() ? scaledBaseFontSize * vrFontScale : scaledBaseFontSize
  );
  const lineHeight = Math.round(finalFontSize * 1.1);
  const font = `600 ${finalFontSize}px Arial, Geneva, sans-serif`;
  const padding = 12.5;
  const resolution = getResolution();
  ctx.font = font;

  const canvasWidth = width * resolution;
  const maxWidth = canvasWidth - padding * 2;
  const singlePagePixelHeight = fixedHeight * resolution;

  // Buat canvas setinggi semua halaman digabungkan
  canvas.width = canvasWidth;
  canvas.height = singlePagePixelHeight * descriptionsArray.length;

  descriptionsArray.forEach((text, index) => {
    const pageOffsetY = index * singlePagePixelHeight;
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = TEXT_COLOR;

    wrapText(
      ctx,
      text,
      padding,
      pageOffsetY + padding,
      maxWidth,
      lineHeight,
      true
    );
  });

  const texture = new THREE.CanvasTexture(canvas);

  // Atur tekstur untuk tiling vertikal (scrolling)
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1 / descriptionsArray.length);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(width, fixedHeight);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = {
    isScrollableText: true,
    totalPages: descriptionsArray.length,
    currentPage: 0,
    targetOffsetY: 0,
  };

  return mesh;
}

/**
 * Membuat panel teks statis (untuk judul).
 */
function createTitleLabel(text, width, height, color = TEXT_COLOR) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();

  canvas.width = width * resolution;
  canvas.height = height * resolution;

  // Adaptive VR font scale
  const screenWidth = window.innerWidth;
  let vrFontScale;

  if (screenWidth <= 768) {
    vrFontScale = 0.8; // ← Lebih kecil untuk mobile
  } else {
    vrFontScale = 1;
  }

  const baseFontSize = height * resolution * 0.6;
  const fontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );

  ctx.font = `bold ${fontSize}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  return new THREE.Mesh(geometry, material);
}

/**
 * Membuat panel teks statis (untuk sub-judul).
 */
function createSubtitleLabel(text, width, height) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  canvas.width = width * resolution;
  canvas.height = height * resolution;

  const vrFontScale = 1;
  const baseFontSize = height * resolution * 0.7;
  const fontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );

  ctx.font = `${fontSize}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#E2E8F0"; // Warna subtitle sedikit beda
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  return new THREE.Mesh(geometry, material);
}

/**
 * Membuat panel teks statis (untuk body text, di-wrap, dan rata tengah).
 */
function createBodyText(text, width, options = {}) {
  const {
    baseFontSize: logicalBaseFontSize = 72,
    vrFontScale = 1.1,
    lineHeightScale = 1.2,
  } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false, // Performance optimization
  });

  // Enable high-quality text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Untuk text clarity maksimal
  ctx.textRendering = "optimizeLegibility";
  const resolution = getResolution();

  const currentResolution = getResolution();
  const scaleFactor = currentResolution / LOGICAL_RESOLUTION;
  const scaledBaseFontSize = logicalBaseFontSize * scaleFactor;
  // --- AKHIR PERBAIKAN ---

  const finalFontSize = Math.round(
    isVRMode() ? scaledBaseFontSize * vrFontScale : scaledBaseFontSize
  );
  const lineHeight = Math.round(finalFontSize * lineHeightScale);
  const font = `700 ${finalFontSize}px Verdana, Geneva, sans-serif`;
  ctx.font = font;

  const padding = 7.5;
  const canvasWidth = width * resolution;
  const maxWidth = canvasWidth - padding * 2;

  // Hitung tinggi yang dibutuhkan
  const textMetrics = wrapText(ctx, text, 0, 0, maxWidth, lineHeight, false);
  const totalTextPixelHeight = textMetrics.pixelHeight;

  canvas.width = canvasWidth;
  canvas.height = totalTextPixelHeight + padding;

  // Gambar teks (rata tengah)
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#E2E8F0";
  wrapText(
    ctx,
    text,
    canvas.width / 2,
    padding / 2,
    maxWidth,
    lineHeight,
    true
  );

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  // Sesuaikan geometri plane dengan tinggi teks
  const geometry = new THREE.PlaneGeometry(width, canvas.height / resolution);
  return new THREE.Mesh(geometry, material);
}

/**
 * Membuat panel teks khusus untuk skor (font besar dan tebal).
 */
function createScoreLabel(text, size, color = ACCENT_COLOR) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false, // Performance optimization
  });

  // Enable high-quality text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Untuk text clarity maksimal
  ctx.textRendering = "optimizeLegibility";
  const resolution = getResolution();

  // Hitung font size dulu
  const fontSize = Math.floor(size * resolution * 0.5);
  ctx.font = `bold ${fontSize}px "Arial Rounded MT Bold", Arial, sans-serif`;

  // Ukur lebar teks untuk kanvas yang pas
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const paddingX = textWidth * 0.2;
  const canvasWidth = Math.ceil(textWidth + paddingX * 2);

  canvas.width = canvasWidth;
  canvas.height = size * resolution; // Tinggi tetap

  // Terapkan font lagi setelah resize
  ctx.font = `bold ${fontSize}px "Arial Rounded MT Bold", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  // Sesuaikan aspek rasio plane
  const aspect = canvas.width / canvas.height;
  const planeHeight = size;
  const planeWidth = planeHeight * aspect;

  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  return new THREE.Mesh(geometry, material);
}

/**
 * Membuat mesh panel untuk gambar statis.
 */
function createImagePanel(imageUrl, width, height) {
  const texture = textureLoader.load(imageUrl);
  texture.minFilter = THREE.LinearMipMapLinearFilter; // Non-mipmapped untuk UI
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true; // Nonaktifkan mipmaps untuk UI

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

/**
 * Membuat mesh teks dengan animasi mengetik.
 */
function createTypingText(text, width, options = {}, onComplete) {
  const {
    baseFontSize: logicalBaseFontSize = 28,
    vrFontScale = 1.5,
    lineHeightScale = 1.2,
  } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false, // Performance optimization
  });

  // Enable high-quality text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Untuk text clarity maksimal
  ctx.textRendering = "optimizeLegibility";
  const resolution = getResolution();

  const currentResolution = getResolution();
  const scaleFactor = currentResolution / LOGICAL_RESOLUTION;
  const scaledBaseFontSize = logicalBaseFontSize * scaleFactor;
  // --- AKHIR PERBAIKAN ---

  const finalFontSize = Math.round(
    isVRMode() ? scaledBaseFontSize * vrFontScale : scaledBaseFontSize
  );
  const lineHeight = Math.round(finalFontSize * lineHeightScale);
  const font = `600 ${finalFontSize}px Arial, Geneva, sans-serif`;
  ctx.font = font;

  const padding = 7.5;
  const canvasWidth = width * resolution;
  const maxWidth = canvasWidth - padding * 2;

  // Hitung tinggi
  const textMetrics = wrapText(ctx, text, 0, 0, maxWidth, lineHeight, false);
  const totalTextPixelHeight = textMetrics.pixelHeight;

  canvas.width = canvasWidth;
  canvas.height = totalTextPixelHeight + padding;

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(width, canvas.height / resolution);
  const mesh = new THREE.Mesh(geometry, material);

  let currentIndex = 0;
  let timeAccumulator = 0;
  const typingSpeed = 20; // Karakter per detik

  // Pre-render setup
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#E2E8F0";

  function update(deltaTime) {
    if (currentIndex >= text.length) {
      if (getActiveTypingAnimation() === this) {
        clearActiveTypingAnimation();
        if (onComplete) onComplete();
      }
      return;
    }

    timeAccumulator += deltaTime;
    const interval = 1 / typingSpeed;
    let shouldUpdate = false;

    // Batch update
    while (timeAccumulator >= interval) {
      currentIndex++;
      timeAccumulator -= interval;
      shouldUpdate = true;
      if (currentIndex > text.length) {
        currentIndex = text.length;
        break;
      }
    }

    // Hanya render jika ada perubahan
    if (shouldUpdate) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      wrapText(
        ctx,
        text.substring(0, currentIndex),
        canvas.width / 2,
        padding / 2,
        maxWidth,
        lineHeight,
        true
      );
      texture.needsUpdate = true;
    }
  }

  // Set animasi ini sebagai yang aktif
  setActiveTypingAnimation({ update });
  return mesh;
}

/**
 * Membuat efek confetti untuk layar completion.
 */
function createConfettiEffect() {
  const particleCount = 200;
  const particles = new THREE.Group();
  scene.add(particles);

  const particleGeometry = new THREE.PlaneGeometry(0.02, 0.02);
  const colors = [0xffd700, 0xff6347, 0x4169e1, 0x32cd32, 0xffffff];
  const spawnY = 2.5;
  const despawnY = 0;
  const spawnRangeY = 2;
  const spawnRangeX = 5;
  const spawnRangeZ = 3;

  for (let i = 0; i < particleCount; i++) {
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      side: THREE.DoubleSide,
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    particle.position.set(
      (Math.random() - 0.5) * spawnRangeX,
      spawnY + Math.random() * spawnRangeY,
      (Math.random() - 0.5) * spawnRangeZ
    );

    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1, // Gerakan horizontal ringan
      -0.5 - Math.random(), // Kecepatan jatuh
      0
    );

    particle.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    particles.add(particle);
  }

  function update(deltaTime) {
    for (const particle of particles.children) {
      particle.position.addScaledVector(particle.userData.velocity, deltaTime);
      particle.rotation.x += deltaTime * 2;
      particle.rotation.y += deltaTime * 2;

      // Reset partikel jika sudah jatuh
      if (particle.position.y < despawnY) {
        particle.position.y = spawnY + spawnRangeY;
        particle.position.x = (Math.random() - 0.5) * spawnRangeX;
      }
    }
  }

  function destroy() {
    scene.remove(particles);
    particles.children.forEach((child) => {
      child.geometry.dispose();
      child.material.dispose();
    });
  }

  return { update, destroy };
}

// ===============================================================
// FUNGSI PEMBUAT HALAMAN (PUBLIK)
// ===============================================================

/**
 * Membuat UI untuk halaman pemilihan mode (Desktop/VR).
 */
export function createModeSelectionPage() {
  clearUI();
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  // Panel utama
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const titleLabel = createTitleLabel("Choose Experience Mode", 0.4, 0.03);
  titleLabel.position.set(0, 0.05, 0.01);
  viewerUIGroup.add(titleLabel);

  const buttonWidth = 0.25;
  const buttonHeight = 0.03;
  const spacing = 0.04;
  const startY = -0;

  const browserButton = createButton(
    "Mode Desktop",
    "start_browser",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  browserButton.position.set(0, startY, 0.01);
  viewerUIGroup.add(browserButton);

  const vrButton = createButton(
    "Mode VR",
    "start_vr",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_SECONDARY
  );
  vrButton.position.set(0, startY - spacing, 0.01);
  viewerUIGroup.add(vrButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createAvatarGreetingPage(
  playerName,
  greetingIndex = 0,
  options = {}
) {
  const isTextUpdateOnly = options.isTextUpdateOnly || false; // Perbaikan: Cek opsi

  // KONSISTEN dengan halaman lainnya
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  // Panel ukuran standard (chatbot style)
  const panelWidth = 0.43;
  const panelHeight = 0.327;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // === PERUBAHAN SKALA TOMBOL X ===
  // Tombol X (Exit) - Ukuran dibuat lebih kecil dan padding disesuaikan
  const exitButtonSize = 0.025; // <-- Diperkecil dari 0.09
  const exitPadding = 0.01; // <-- Diperkecil dari 0.055
  const exitButton = createButton(
    "X",
    null,
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  // Kalkulasi posisi X/Y baru berdasarkan ukuran dan padding baru
  const exitX = panelWidth / 2 - exitPadding - exitButtonSize / 2;
  const exitY = panelHeight / 2 - exitPadding - exitButtonSize / 2;
  exitButton.position.set(exitX, exitY, 0.001);
  // ================================

  exitButton.renderOrder = 2;
  exitButton.visible = false;
  exitButton.userData.isButton = false;
  viewerUIGroup.add(exitButton);

  // Data greeting
  const greetingTexts = GREETING_DATA(playerName);
  const currentGreeting = greetingTexts[greetingIndex];
  if (!currentGreeting) return;

  const isLastGreeting = greetingIndex >= greetingTexts.length - 1;

  // === PERUBAHAN SKALA TOMBOL CONTINUE ===
  // Dibuat konsisten dengan tombol di createModeSelectionPage (0.25 x 0.03)
  // Kita bisa buat sedikit lebih besar untuk penekanan.
  const primaryButtonWidth = 0.35; // <-- Diperkecil drastis dari 1.0
  const primaryButtonHeight = 0.04; // <-- Diperkecil drastis dari 0.15
  const continueButton = createButton(
    isLastGreeting ? "Start Learning" : "Continue",
    null,
    primaryButtonWidth,
    primaryButtonHeight,
    BTN_COLOR_PRIMARY
  );
  // Diposisikan di bawah teks (Y=0.05) dan di dalam panel (batas bawah -0.1635)
  continueButton.position.set(0, -0.12, 0.01); // <-- Y diubah dari -0.25
  // ======================================

  continueButton.visible = false;
  continueButton.userData.isButton = false;
  viewerUIGroup.add(continueButton);

  // Callback setelah animasi drop selesai ATAU jika avatar sudah ada
  const onAvatarReady = () => {
    exitButton.visible = true;
    exitButton.userData.action = "back_to_landing";
    exitButton.userData.isButton = true;

    // 1. Putar audio
    if (window.playCurrentGreetingAudioCallback) {
      window.playCurrentGreetingAudioCallback(); // Memanggil fungsi dari main.js
    }

    // 2. Tampilkan typing text (chatbot bubble style)
    if (currentGreeting.text) {
      const textWidth = panelWidth * 0.88; // 0.3784 (Ini sudah pas)
      const welcomeLabel = createTypingText(
        currentGreeting.text,
        textWidth,
        {
          baseFontSize: 18,
          vrFontScale: 1.1,
          lineHeightScale: 1.3,
        },
        () => {
          // 3. Tampilkan tombol setelah typing selesai
          continueButton.visible = true;
          continueButton.userData.isButton = true;
          continueButton.userData.action = isLastGreeting
            ? "continue_to_landing"
            : "next_greeting";
        }
      );
      // Posisi teks (Y=0.05) konsisten dengan title di createModeSelectionPage
      welcomeLabel.position.set(0, 0.0, 0.01);
      viewerUIGroup.add(welcomeLabel);
    }
  };

  // === Logika Setup Avatar (TIDAK BERUBAH) ===
  if (isTextUpdateOnly && currentAvatar) {
    onAvatarReady();
  } else if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    const avatarFinalPosition = new THREE.Vector3(
      -panelWidth / 2 - 0.35,
      panelHeight / 2 - 0.1,
      0.05
    );
    const shouldAnimateDrop = greetingIndex === 0;

    if (shouldAnimateDrop) {
      avatarDropAnimation.onComplete = onAvatarReady;
    }

    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.1, 0.1, 0.1),
      avatarFinalPosition,
      shouldAnimateDrop
    );

    if (!shouldAnimateDrop) {
      onAvatarReady();
    }
  }
  // === AKHIR LOGIKA AVATAR ===

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat panel teks statis untuk judul dengan wrapping otomatis.
 * @param {string} text - Teks judul.
 * @param {number} maxWidth - Lebar maksimum panel dalam satuan Three.js.
 * @param {number} maxHeight - Tinggi maksimum panel dalam satuan Three.js.
 * @param {number} baseFontSize - Ukuran font dasar sebelum scaling.
 * @param {number} vrFontScale - Faktor skala font untuk mode VR.
 * @param {number} lineHeightScale - Faktor skala untuk jarak antar baris.
 * @param {string} color - Warna teks.
 * @returns {THREE.Mesh} - Mesh panel teks dengan wrapping.
 */
function createWrappingTitleLabel(
  text,
  maxWidth,
  maxHeight,
  baseFontSize = 28,
  vrFontScale = 1.1,
  lineHeightScale = 1.2,
  color = TEXT_COLOR
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false, // Performance optimizations
  });

  // Enable high-quality text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Untuk text clarity maksimal
  ctx.textRendering = "optimizeLegibility";
  const resolution = getResolution();

  const logicalBaseFontSize = baseFontSize; // Ambil dari argumen (default 28)
  const currentResolution = getResolution();
  const scaleFactor = currentResolution / LOGICAL_RESOLUTION;
  const scaledBaseFontSize = logicalBaseFontSize * scaleFactor;
  // --- AKHIR PERBAIKAN ---

  const finalFontSize = Math.round(
    isVRMode() ? scaledBaseFontSize * vrFontScale : scaledBaseFontSize
  );
  const lineHeight = Math.round(finalFontSize * lineHeightScale);
  const font = `600 ${finalFontSize}px Arial, Geneva, sans-serif`;
  ctx.font = font;

  const padding = 15;
  const canvasMaxWidth = maxWidth * resolution;
  const canvasMaxHeight = maxHeight * resolution;
  const maxTextWidth = canvasMaxWidth - padding * 2;

  // Hitung tinggi teks yang dibutuhkan
  const { pixelHeight: textHeightNeeded } = wrapText(
    ctx,
    text,
    0,
    0,
    maxTextWidth,
    lineHeight,
    false
  );

  const finalCanvasHeight = Math.min(
    canvasMaxHeight,
    textHeightNeeded + padding * 2
  );

  canvas.width = canvasMaxWidth;
  canvas.height = finalCanvasHeight;

  // === UBAH DI SINI: Set textAlign ke "center" ===
  ctx.font = font;
  ctx.textAlign = "center"; // ← UBAH dari "left" ke "center"
  ctx.textBaseline = "top";
  ctx.fillStyle = color;

  // Hitung posisi Y untuk center vertikal teks di canvas
  const textStartY = (finalCanvasHeight - textHeightNeeded) / 2;

  // === UBAH DI SINI: Gunakan center X position ===
  const centerX = canvasMaxWidth / 2; // ← Center horizontal position

  wrapText(
    ctx,
    text,
    centerX, // ← UBAH dari padding ke centerX
    textStartY,
    maxTextWidth,
    lineHeight,
    true
  );
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const planeHeight = finalCanvasHeight / resolution;
  const geometry = new THREE.PlaneGeometry(maxWidth, planeHeight);
  return new THREE.Mesh(geometry, material);
}

/**
 * Membuat UI untuk halaman landing (menu utama).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createLandingPage(playerName, options = {}) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  // === PERUBAHAN UKURAN PANEL ===
  // Ukuran panel disamakan dengan createModeSelectionPage
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  // =============================

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0); // Radius 0 agar sama
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // === LOGO (DIHILANGKAN) ===
  // Panel terlalu kecil untuk memuat logo dengan rapi.
  // const logoWidth = 0.15; ...
  // viewerUIGroup.add(logoPanel);
  // =============================

  // === TITLE "MENU" (DIPERKECIL) ===
  // Disesuaikan seperti createModeSelectionPage
  const titleWidth = 0.4;
  const titleHeight = 0.03;
  const topPadding = 0.015;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // (0.1635 - 0.015 - 0.015) = 0.1335

  const titleLabel = createTitleLabel("Main Menu", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);
  // =============================

  // === Area konten di bawah title ===
  const contentAreaTop = titleY - titleHeight / 2; // 0.1185
  const contentAreaBottom = -panelHeight / 2; // -0.1635
  const availableHeight = contentAreaTop - contentAreaBottom; // ~0.282
  const contentCenterY = contentAreaBottom + availableHeight / 2; // ~-0.0225

  // === AVATAR & WELCOME TEXT (DISESUAIKAN) ===
  if (playerName) {
    const welcomeText = `What do you want to do next, ${playerName}?`;

    // Lebar teks disesuaikan dengan panel kecil
    const titleMaxWidth = panelWidth * 0.9; // 0.387
    const titleMaxHeight = 0.1; // Batasi tinggi

    // Font size harus jauh lebih kecil
    const welcomeLabel = createWrappingTitleLabel(
      welcomeText,
      titleMaxWidth,
      titleMaxHeight,
      18, // <-- baseFontSize diperkecil drastis (dari 42)
      1,
      1.2,
      TEXT_COLOR
    );

    // Posisikan teks di bawah judul
    const welcomeTextY = titleY - titleHeight / 2 - 0.06; // Di bawah title
    welcomeLabel.position.set(0, welcomeTextY, 0.01);
    viewerUIGroup.add(welcomeLabel);

    if (avatarModel) {
      const avatarInstance = avatarModel.scene.clone();

      // === PERUBAHAN POSISI AVATAR ===
      // Posisi X disamakan dengan createAvatarGreetingPage
      const avatarFinalPosition = new THREE.Vector3(
        -panelWidth / 2 - 0.35,
        panelHeight / 2 - 0.1,
        0.05
      );
      // =================================

      const skipDrop = options.skipAvatarDrop || false;
      const shouldAnimateDrop = !skipDrop;

      if (shouldAnimateDrop) {
        avatarDropAnimation.onComplete = () => {
          // (Callback jika perlu)
        };
      }

      setupAvatar(
        avatarInstance,
        new THREE.Vector3(0.1, 0.1, 0.1), // Skala yang sama
        avatarFinalPosition,
        shouldAnimateDrop
      );
    }
  }
  // ======================================

  // === TOMBOL-TOMBOL (DIPERKECIL & DISUSUN ULANG) ===
  // Ukuran disamakan dengan tombol "Continue" di greeting
  const buttonWidth = 0.35;
  const buttonHeight = 0.04;
  const buttonSpacingY = 0.015; // Jarak antar tombol diperkecil

  const primaryButtons = [
    {
      text: "Start Learning",
      action: "start_learning",
      color: BTN_COLOR_PRIMARY,
    },
    {
      text: "Quick Guide",
      action: "show_quick_guide",
      color: BTN_COLOR_SECONDARY,
    },
    {
      text: "Learning Report",
      action: "show_quiz_report",
      color: BTN_COLOR_SECONDARY,
    },
  ];

  const numButtons = primaryButtons.length;
  // Total tinggi = (3 * 0.04) + (2 * 0.015) = 0.12 + 0.03 = 0.15
  const totalButtonsHeight =
    numButtons * buttonHeight + (numButtons - 1) * buttonSpacingY;

  // Posisikan grup tombol di bawah
  const buttonCenterY = -0.07;
  const buttonStartY = buttonCenterY + totalButtonsHeight / 2; // -0.07 + 0.075 = 0.005

  primaryButtons.forEach((btn, index) => {
    const button = createButton(
      btn.text,
      btn.action,
      buttonWidth,
      buttonHeight,
      btn.color
    );
    const buttonY = buttonStartY - index * (buttonHeight + buttonSpacingY);
    button.position.set(0, buttonY, 0.01); // X=0 (rata tengah)
    viewerUIGroup.add(button);
  });
  // ============================================

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman menu pemilihan topik (grid melengkung).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createMenuPage(allComponentsUnlocked, quizHasBeenAttempted) {
  // 1. Setup Panel & Posisi Standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  clearViewerUI(); // Bersihkan panel sebelumnya

  // === PERUBAHAN UKURAN PANEL ===
  const totalPanelWidth = 0.43;
  const totalPanelHeight = 0.327;
  // =============================

  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0 // Radius 0 agar sama
  );
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  // === 2. JUDUL (SESUAI STANDAR BARU) ===
  const titleWidth = 0.3;
  const titleHeight = 0.03;
  const topPadding = 0.015;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding; // 0.1635 - 0.015 - 0.015 = 0.1335
  const titleLabel = createTitleLabel("Select Topic", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);
  // ============================

  // === 3. TOMBOL 'X' (SESUAI STANDAR BARU) ===
  const exitButtonSize = 0.025; // Ukuran dari greeting page
  const exitPadding = 0.01; // Padding dari greeting page
  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  const exitX = totalPanelWidth / 2 - exitPadding - exitButtonSize / 2;
  const exitY = totalPanelHeight / 2 - exitPadding - exitButtonSize / 2;
  exitButton.position.set(exitX, exitY, 0.001);
  viewerUIGroup.add(exitButton);
  // ============================

  // === 4. TOMBOL "FINAL TEST" (DIPERKECIL) ===
  // Dibuat sama besar dengan tombol "Continue" di greeting/landing
  const quizButtonWidth = 0.35; // <-- Diperkecil dari 1.23
  const quizButtonHeight = 0.04; // <-- Diperkecil dari 0.09
  const bottomPadding = 0.015;
  const quizButtonY =
    -totalPanelHeight / 2 + quizButtonHeight / 2 + bottomPadding; // -0.1635 + 0.02 + 0.015 = -0.1285

  // Logika label tidak berubah
  let quizButtonLabel, quizButtonAction, quizButtonColor;
  if (!allComponentsUnlocked) {
    quizButtonLabel = "Final Test (Locked)";
    quizButtonAction = "locked";
    quizButtonColor = BTN_COLOR_SECONDARY;
  } else if (allComponentsUnlocked && !quizHasBeenAttempted) {
    quizButtonLabel = "Start Final Test";
    quizButtonAction = "show_quiz";
    quizButtonColor = BTN_COLOR_PRIMARY;
  } else {
    quizButtonLabel = "View Learning Report";
    quizButtonAction = "show_quiz_report";
    quizButtonColor = BTN_COLOR_PRIMARY;
  }

  const quizButton = createButton(
    quizButtonLabel,
    quizButtonAction,
    quizButtonWidth,
    quizButtonHeight,
    quizButtonColor
  );
  if (quizButtonAction === "locked") {
    quizButton.userData.colors = null;
  }
  quizButton.position.set(0, quizButtonY, 0.01);
  viewerUIGroup.add(quizButton);
  // ============================

  // === 5. GRID TOMBOL TOPIK (DIPERKECIL DRASITIS) ===
  const itemsPerRow = 2;
  const numRows = Math.ceil(components.length / itemsPerRow); // 6

  const paddingX = 0.01; // Jarak horizontal antar tombol
  const paddingY = 0.008; // Jarak vertikal SANGAT kecil

  // Lebar tombol baru: (Panel 0.43 - 0.04 padding - 0.01 jarak) / 2
  const buttonWidth = (totalPanelWidth * 0.9 - paddingX) / itemsPerRow; // ~0.188

  // Tentukan area vertikal untuk grid
  const gridTopBoundary = titleY - titleHeight / 2 - 0.01; // 0.1335 - 0.015 - 0.01 = 0.1085
  const gridBottomBoundary = quizButtonY + quizButtonHeight / 2 + 0.01; // -0.1285 + 0.02 + 0.01 = -0.0985
  const availableGridHeight = gridTopBoundary - gridBottomBoundary; // ~0.207

  // Tinggi tombol baru
  const buttonHeight =
    (availableGridHeight - (numRows - 1) * paddingY) / numRows; // (0.207 - (5*0.005)) / 6 = 0.182 / 6 = ~0.03

  // Hitung Y tengah dari area tersebut
  const gridCenterY = (gridTopBoundary + gridBottomBoundary) / 2; // ~0.005

  // Hitung total tinggi grid (untuk centering)
  const gridTotalHeight = numRows * buttonHeight + (numRows - 1) * paddingY;

  // Hitung Y untuk baris pertama
  const gridTopY = gridCenterY + gridTotalHeight / 2 - buttonHeight / 2;

  const col1X = -(buttonWidth / 2) - paddingX / 2;
  const col2X = buttonWidth / 2 + paddingX / 2;

  components.forEach((comp, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const isUnlocked = comp.unlocked;

    const buttonLabel = isUnlocked ? `${index + 1}. ${comp.label}` : "Locked";
    const buttonColor = isUnlocked ? BTN_COLOR_PRIMARY : BTN_COLOR_SECONDARY;

    const button = createTopicButton(
      buttonLabel,
      isUnlocked ? `select_${index}` : "locked",
      buttonWidth, // <-- lebar baru
      buttonHeight, // <-- tinggi baru
      buttonColor
    );

    if (!isUnlocked) {
      button.userData.colors = null;
    }

    const x = col === 0 ? col1X : col2X;
    const y = gridTopY - row * (buttonHeight + paddingY);
    button.position.set(x, y, 0.01);
    viewerUIGroup.add(button);
  });
  // ============================

  // 6. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman viewer komponen (deskripsi, navigasi).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createViewerPage(
  component,
  index,
  descriptionIndex = 0,
  highestComponentUnlocked = 0,
  hasAttemptedQuiz = false
) {
  // Posisi UI standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  clearViewerUI();
  navButtons = [];

  // === 1. PERUBAHAN UKURAN PANEL ===
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  // Radius 0 dan warna BG_COLOR agar sama dengan halaman modal
  const backgroundPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);
  // =============================

  // === 2. JUDUL (SESUAI STANDAR BARU) ===
  // Menggunakan createWrappingTitleLabel agar judul panjang bisa wrap
  const titleMaxWidth = panelWidth * 0.5; // Lebar sedikit lebih kecil dari panel
  const titleMaxHeight = 0.06; // Tinggi maks 2 baris
  const topPadding = 0.015;
  const titleBaseY = panelHeight / 2 - topPadding; // Posisi dasar Y di atas

  const titleLabel = createWrappingTitleLabel(
    component.label,
    titleMaxWidth,
    titleMaxHeight,
    18, // baseFontSize kecil
    1,
    1.2
  );
  // Ambil tinggi aktual plane judul setelah wrapping
  const actualTitleHeight = titleLabel.geometry.parameters.height;
  const titleY = titleBaseY - actualTitleHeight / 2; // Hitung Y tengah aktual
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);
  // =============================

  // === 3. TOMBOL AKSI (Close 'X' & Audio '🔊') (SESUAI STANDAR BARU) ===
  // Diposisikan di pojok kanan atas, di dalam panel
  const actionButtonSize = 0.025; // Ukuran kecil standar
  const actionPadding = 0.01; // Padding kecil standar
  const actionButtonY = panelHeight / 2 - actionPadding - actionButtonSize / 2; // Y di atas

  // Tombol Close 'X' (Paling Kanan)
  const closeButton = createButton(
    "X",
    "back_to_menu", // Kembali ke menu pilih topik
    actionButtonSize,
    actionButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  const closeX = panelWidth / 2 - actionPadding - actionButtonSize / 2;
  closeButton.position.set(closeX, actionButtonY, 0.001); // Z sedikit di depan
  closeButton.renderOrder = 3; // Paling depan
  viewerUIGroup.add(closeButton);
  navButtons.push(closeButton);

  // Tombol Audio '🔊' (Sebelah Kiri Close)
  let lastButtonX = closeX;
  if (component.audioFile) {
    const audioButton = createButton(
      "🔊",
      "play_audio",
      actionButtonSize,
      actionButtonSize,
      BTN_COLOR_SECONDARY, // Warna sekunder agar tidak terlalu menonjol
      "circle"
    );
    // Posisi X di sebelah kiri tombol sebelumnya
    const audioX = lastButtonX - actionButtonSize - actionPadding;
    audioButton.position.set(audioX, actionButtonY, 0.001);
    audioButton.renderOrder = 3;
    viewerUIGroup.add(audioButton);
    navButtons.push(audioButton);
    lastButtonX = audioX; // Update X terakhir
  }
  // =============================

  // === 4. NAVIGASI KOMPONEN BAWAH ('Back', 'Next') ===
  // Dibuat lebih kecil dan diletakkan paling bawah
  const navCompButtonWidth = 0.18; // <-- Diperkecil drastis
  const navCompButtonHeight = 0.035; // <-- Diperkecil drastis
  const bottomPadding = 0.015;
  const navCompY = -panelHeight / 2 + navCompButtonHeight / 2 + bottomPadding; // Y paling bawah
  const navCompZ = 0.01;
  const navCompSpacing = 0.02; // Jarak antar tombol

  let hasLeftButton = false;
  // Tombol "< Back" (Kiri)
  if (index > 0) {
    hasLeftButton = true;
    const prevButton = createButton(
      "< Back",
      "prev_component",
      navCompButtonWidth,
      navCompButtonHeight,
      BTN_COLOR_SECONDARY // Warna sekunder
    );
    const prevX = -navCompSpacing / 2 - navCompButtonWidth / 2;
    prevButton.position.set(prevX, navCompY, navCompZ);
    prevButton.renderOrder = 1;
    viewerUIGroup.add(prevButton);
    navButtons.push(prevButton);
  }

  // Tombol "Next >" (Kanan)
  const isLastComponent = index >= components.length - 1;
  // ... (Logika shouldShowNextButton tidak berubah)
  const shouldShowNextButton =
    !isLastComponent ||
    (index === highestComponentUnlocked &&
      !hasAttemptedQuiz &&
      highestComponentUnlocked < components.length);

  if (shouldShowNextButton) {
    const nextButton = createButton(
      "Next >",
      "next_component",
      navCompButtonWidth,
      navCompButtonHeight,
      BTN_COLOR_PRIMARY // Warna primer jika bisa lanjut
    );
    // Posisi X tergantung ada tombol kiri atau tidak
    const nextX = hasLeftButton
      ? navCompSpacing / 2 + navCompButtonWidth / 2 // Kanan dari tengah
      : 0; // Tengah jika hanya tombol next
    nextButton.position.set(nextX, navCompY, navCompZ);
    nextButton.renderOrder = 1;
    viewerUIGroup.add(nextButton);
    navButtons.push(nextButton);
  }
  // =============================

  // === 5. NAVIGASI DESKRIPSI ('<', 'page/total', '>') ===
  // Diletakkan di atas navigasi komponen, ukuran sangat kecil
  const descNavY = navCompY + navCompButtonHeight / 2 + 0.03; // Y di atas nav komponen
  const descNavButtonWidth = 0.03; // <-- Sangat kecil
  const descNavButtonHeight = 0.031; // <-- Sangat kecil
  const descIndicatorWidth = 0.05; // <-- Sangat kecil
  const descIndicatorHeight = 0.02; // <-- Sangat kecil
  const descNavPadding = 0.02;

  let pageIndicator = null; // Deklarasi di sini

  if (component.description.length > 1) {
    const totalNavWidth =
      descNavButtonWidth * 2 + descIndicatorWidth + descNavPadding * 2;
    const startX = -totalNavWidth / 2;

    // Tombol Prev "<"
    const isFirstPage = descriptionIndex <= 0;
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_description",
      descNavButtonWidth,
      descNavButtonHeight, // Persegi
      isFirstPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isFirstPage) {
      prevDescButton.userData.colors = null;
      prevDescButton.userData.currentState = "disabled";
    }
    prevDescButton.position.set(
      startX + descNavButtonWidth / 2,
      descNavY,
      0.021
    );
    prevDescButton.renderOrder = 1;
    viewerUIGroup.add(prevDescButton);
    navButtons.push(prevDescButton);

    // Indikator Halaman "1 / 3"
    const pageIndicatorText = `${descriptionIndex + 1} / ${
      component.description.length
    }`;
    pageIndicator = createTitleLabel(
      // Assign ke variabel pageIndicator
      pageIndicatorText,
      descIndicatorWidth,
      descIndicatorHeight
    );
    pageIndicator.name = "page_indicator";
    pageIndicator.position.set(
      startX + descNavButtonWidth + descNavPadding + descIndicatorWidth / 2,
      descNavY,
      0.02
    );
    pageIndicator.renderOrder = 2;
    pageIndicator.material.depthWrite = false;
    viewerUIGroup.add(pageIndicator);

    // Tombol Next ">"
    const isLastPage = descriptionIndex >= component.description.length - 1;
    const nextDescButton = createButton(
      ">",
      isLastPage ? "locked" : "next_description",
      descNavButtonWidth,
      descNavButtonHeight, // Persegi
      isLastPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isLastPage) {
      nextDescButton.userData.colors = null;
      nextDescButton.userData.currentState = "disabled";
    }
    nextDescButton.position.set(
      startX +
        descNavButtonWidth +
        descNavPadding +
        descIndicatorWidth +
        descNavPadding +
        descNavButtonWidth / 2,
      descNavY,
      0.021
    );
    nextDescButton.renderOrder = 1;
    viewerUIGroup.add(nextDescButton);
    navButtons.push(nextDescButton);
  }
  // =============================

  // === 6. PANEL DESKRIPSI (MENYESUAIKAN RUANG SISA) ===
  const DESC_PANEL_WIDTH = panelWidth * 0.9; // Lebar hampir penuh panel

  // Hitung Batas
  const textPanelTop = titleY - actualTitleHeight / 2 - 0.01; // Di bawah judul
  // Batas bawah adalah Y navigasi deskripsi ATAU (jika tidak ada) Y navigasi komponen
  const textPanelBottom =
    (component.description.length > 1 ? descNavY : navCompY) -
    descNavButtonHeight / 2 -
    0.01;

  // Hitung tinggi & posisi Y
  const DESC_PANEL_FIXED_HEIGHT = Math.max(
    0.01,
    textPanelTop - textPanelBottom
  ); // Pastikan tidak negatif
  const descPanelYOffset = (textPanelTop + textPanelBottom) / 2;

  const descPanel = createTextPanel(component.description, DESC_PANEL_WIDTH, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
    baseFontSize: 14, // <-- Font SUPER KECIL agar muat
  });

  // Atur offset awal scroll (Logika tidak berubah)
  const initialOffsetY =
    (component.description.length - 1 - descriptionIndex) /
    component.description.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = descriptionIndex;
  descPanel.userData.isScrollableText = true;

  descPanel.position.set(0, descPanelYOffset, 0.01); // Posisi Y baru
  descPanel.renderOrder = 1; // Di bawah judul
  viewerUIGroup.add(descPanel);
  // =============================

  // 7. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman kuis mini (per komponen).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createMiniQuizPage(component) {
  // Posisi standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;
  clearViewerUI(); // Hanya viewerUIGroup
  navButtons = [];

  // === 1. PERUBAHAN UKURAN PANEL ===
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const backgroundPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR); // Radius 0, BG_COLOR
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);
  // =============================

  // === 2. JUDUL (SESUAI STANDAR BARU) ===
  const titleWidth = 0.3; // Lebar disesuaikan
  const titleHeight = 0.03; // Tinggi standar
  const topPadding = 0.015;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // 0.1335
  const titleLabel = createTitleLabel("Mini Quiz", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);
  // =============================

  // === 3. TOMBOL 'X' (DITAMBAHKAN, SESUAI STANDAR BARU) ===
  // Agar bisa kembali ke viewer jika tidak ingin kuis
  const exitButtonSize = 0.025;
  const exitPadding = 0.01;
  const exitButton = createButton(
    "X",
    "back_to_viewer", // Kembali ke viewer komponen
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  const exitX = panelWidth / 2 - exitPadding - exitButtonSize / 2;
  const exitY = panelHeight / 2 - exitPadding - exitButtonSize / 2;
  exitButton.position.set(exitX, exitY, 0.001); // Z seperti greeting
  exitButton.renderOrder = 3; // Paling depan
  viewerUIGroup.add(exitButton);
  // =============================

  // === 4. TOMBOL JAWABAN (True/False) (DIPERKECIL & DIPOSISIKAN) ===
  // Diletakkan di bagian bawah, bersebelahan
  const buttonWidth = 0.18; // <-- Diperkecil
  const buttonHeight = 0.04; // <-- Diperkecil
  const buttonSpacing = 0.02; // <-- Jarak diperkecil
  const bottomPadding = 0.015;
  const buttonY = -panelHeight / 2 + buttonHeight / 2 + bottomPadding; // Y paling bawah (-0.1285)

  const currentQuestion = component.quiz[0]; // Asumsi selalu ada 1 pertanyaan mini quiz
  currentQuestion.answers.forEach((answer, index) => {
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "mini_quiz_correct" : "mini_quiz_incorrect";
    const buttonX =
      index === 0
        ? -buttonSpacing / 2 - buttonWidth / 2 // Tombol kiri
        : buttonSpacing / 2 + buttonWidth / 2; // Tombol kanan

    const button = createButton(
      answer, // "True" atau "False"
      action,
      buttonWidth,
      buttonHeight,
      BTN_COLOR_PRIMARY
    );
    button.position.set(buttonX, buttonY, 0.01);
    button.renderOrder = 1;
    viewerUIGroup.add(button);
    navButtons.push(button); // Tambahkan ke navButtons agar bisa di-disable jika perlu
  });
  // =============================

  // === 5. PANEL PERTANYAAN (MENYESUAIKAN RUANG SISA) ===
  const QUESTION_PANEL_WIDTH = panelWidth * 0.9; // Lebar hampir penuh (0.387)

  // Hitung Batas
  const textPanelTop = titleY - titleHeight / 2 - 0.01; // Di bawah judul
  const textPanelBottom = buttonY + buttonHeight / 2 + 0.01; // Di atas tombol jawaban

  // Hitung tinggi & posisi Y
  const QUESTION_PANEL_HEIGHT = Math.max(0.01, textPanelTop - textPanelBottom); // Pastikan tidak negatif
  const questionPanelY = (textPanelTop + textPanelBottom) / 2;

  const questionPanel = createTextPanel(
    currentQuestion.question,
    QUESTION_PANEL_WIDTH,
    {
      fixedHeight: QUESTION_PANEL_HEIGHT,
      baseFontSize: 13, // <-- Font SUPER KECIL agar muat
    }
  );

  questionPanel.position.set(0, questionPanelY, 0.01);
  questionPanel.renderOrder = 1;
  viewerUIGroup.add(questionPanel);
  // =============================

  // 6. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman hasil kuis mini.
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createMiniQuizResultPage(component, isCorrect) {
  // Posisi standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  clearViewerUI(); // Hanya viewerUIGroup
  navButtons = [];

  // === 1. PERUBAHAN UKURAN PANEL ===
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const backgroundPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR); // Radius 0, BG_COLOR
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);
  // =============================

  // === 2. JUDUL HASIL (SESUAI STANDAR BARU) ===
  const titleText = isCorrect ? "Correct!" : "Incorrect"; // Judul dipersingkat
  const titleColor = isCorrect ? "#28a745" : "#dc3545"; // Warna tetap
  const titleWidth = 0.3; // Lebar disesuaikan
  const titleHeight = 0.03; // Tinggi standar
  const topPadding = 0.015;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // 0.1335

  const titleLabel = createTitleLabel(
    titleText,
    titleWidth,
    titleHeight,
    titleColor
  );
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);
  // =============================

  // === 3. TOMBOL 'X' (TIDAK ADA) ===
  // Halaman hasil mini quiz biasanya langsung lanjut atau coba lagi.
  // =============================

  // === 4. TOMBOL Continue / Try Again (SESUAI STANDAR BARU) ===
  const navButtonWidth = 0.35; // Sama seperti tombol landing/greeting
  const navButtonHeight = 0.04; // Sama seperti tombol landing/greeting
  const bottomPadding = 0.015;
  const navY = -panelHeight / 2 + navButtonHeight / 2 + bottomPadding; // Y paling bawah (-0.1285)

  const buttonText = isCorrect ? "Continue" : "Try Again";
  const continueButton = createButton(
    buttonText,
    "continue_after_mini_quiz", // Aksi tetap sama
    navButtonWidth,
    navButtonHeight,
    BTN_COLOR_PRIMARY
  );
  continueButton.position.set(0, navY, 0.01); // Rata tengah
  continueButton.renderOrder = 1;
  viewerUIGroup.add(continueButton);
  navButtons.push(continueButton); // Tetap tambahkan ke navButtons
  // =============================

  // === 5. PANEL PENJELASAN (MENYESUAIKAN RUANG SISA) ===
  const explanation = component.quiz[0].explanation;
  const resultMessage = isCorrect
    ? "Well done!\n" // Pesan singkat
    : "Review:\n"; // Pesan singkat
  const messageText = resultMessage + explanation;

  const RESULT_PANEL_WIDTH = panelWidth * 0.9; // Lebar hampir penuh (0.387)

  // Hitung Batas
  const textPanelTop = titleY - titleHeight / 2 - 0.01; // Di bawah judul
  const textPanelBottom = navY + navButtonHeight / 2 + 0.01; // Di atas tombol continue

  // Hitung tinggi & posisi Y
  const RESULT_PANEL_HEIGHT = Math.max(0.01, textPanelTop - textPanelBottom); // Pastikan tidak negatif
  const messagePanelY = (textPanelTop + textPanelBottom) / 2;

  const messagePanel = createTextPanel(messageText, RESULT_PANEL_WIDTH, {
    fixedHeight: RESULT_PANEL_HEIGHT,
    baseFontSize: 12, // <-- Font SUPER KECIL agar muat
  });

  messagePanel.position.set(0, messagePanelY, 0.01);
  messagePanel.renderOrder = 1;
  viewerUIGroup.add(messagePanel);
  // =============================

  // 6. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk layar pertanyaan kuis akhir.
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createQuizScreen(currentQuestion, questionIndex) {
  clearUI(); // clearUI digunakan di sini, bukan clearViewerUI

  // Posisi standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  // === 1. PERUBAHAN UKURAN PANEL ===
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR); // Radius 0, BG_COLOR
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);
  // =============================

  // === 2. JUDUL (SESUAI STANDAR BARU) ===
  const titleWidth = 0.35; // Lebar disesuaikan
  const titleHeight = 0.03; // Tinggi standar
  const topPadding = 0.015;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // 0.1335
  const titleText = `Test (${questionIndex + 1}/${quizData.length})`; // Judul dipersingkat
  const titleLabel = createTitleLabel(titleText, titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);
  // =============================

  // === 4. TOMBOL PILIHAN (A, B, C, D) (DIPERKECIL & DIPOSISIKAN) ===
  // Diletakkan di bagian bawah
  const choiceButtonWidth = 0.03; // <-- Sangat kecil
  const choiceButtonHeight = 0.031; // <-- Sangat kecil (persegi)
  const choiceGapX = 0.015; // <-- Jarak sangat kecil
  const bottomPadding = 0.015;
  const choiceButtonY =
    -panelHeight / 2 + choiceButtonHeight / 2 + bottomPadding; // Y paling bawah (-0.1285)

  const numChoices = currentQuestion.answers.length;
  const totalButtonsWidth =
    numChoices * choiceButtonWidth + (numChoices - 1) * choiceGapX;
  const choiceStartX = -totalButtonsWidth / 2 + choiceButtonWidth / 2;

  currentQuestion.answers.forEach((_, i) => {
    const isCorrect = i === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "answer_correct" : "answer_incorrect";
    const buttonLabel = String.fromCharCode(65 + i);

    const button = createButton(
      buttonLabel,
      action,
      choiceButtonWidth,
      choiceButtonHeight,
      BTN_COLOR_PRIMARY
    );
    const buttonX = choiceStartX + i * (choiceButtonWidth + choiceGapX);
    button.position.set(buttonX, choiceButtonY, 0.01); // Z=0.01 standar
    button.renderOrder = 1;
    viewerUIGroup.add(button);
  });
  // =============================

  // === 5. PANEL PERTANYAAN (MENYESUAIKAN RUANG SISA) ===
  const questionText = currentQuestion.question;
  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => `${String.fromCharCode(65 + index)}. ${answer}`)
    .join("\n");
  const fullQuizText = `${questionText}\n\n${answerChoicesText}`;

  const QUIZ_TEXT_PANEL_WIDTH = panelWidth * 0.9; // Lebar hampir penuh (0.387)

  // Hitung Batas
  const textPanelTop = titleY - titleHeight / 2 - 0.01; // Di bawah judul
  const textPanelBottom = choiceButtonY + choiceButtonHeight / 2 + 0.01; // Di atas tombol pilihan

  // Hitung tinggi & posisi Y
  const QUIZ_TEXT_PANEL_HEIGHT = Math.max(0.01, textPanelTop - textPanelBottom); // Pastikan tidak negatif
  const textPanelY = (textPanelTop + textPanelBottom) / 2;

  const quizTextPanel = createTextPanel(fullQuizText, QUIZ_TEXT_PANEL_WIDTH, {
    fixedHeight: QUIZ_TEXT_PANEL_HEIGHT,
    baseFontSize: 12, // <-- Font SUPER KECIL agar muat
  });

  quizTextPanel.position.set(0, textPanelY, 0.01);
  quizTextPanel.renderOrder = 1;
  viewerUIGroup.add(quizTextPanel);
  // =============================

  // 6. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk layar hasil kuis akhir (per pertanyaan).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createQuizResultScreen(
  isCorrect,
  currentQuestion,
  questionIndex,
  totalQuestions
) {
  clearUI(); // clearUI digunakan di sini

  // Posisi standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  // === 1. PERUBAHAN UKURAN PANEL ===
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR); // Radius 0, BG_COLOR
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);
  // =============================

  // === 2. JUDUL HASIL (SESUAI STANDAR BARU) ===
  const titleText = isCorrect ? "Correct!" : "Review"; // Judul dipersingkat
  const titleColor = isCorrect ? "#28a745" : "#FFC107"; // Warna tetap
  const titleWidth = 0.35; // Lebar disesuaikan
  const titleHeight = 0.03; // Tinggi standar
  const topPadding = 0.015;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // 0.1335

  const titleLabel = createTitleLabel(
    titleText,
    titleWidth,
    titleHeight,
    titleColor
  );
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);
  // =============================

  // === 3. TOMBOL 'X' (TIDAK DITAMBAHKAN) ===
  // Biasanya, layar hasil per pertanyaan tidak punya tombol keluar
  // agar pengguna fokus menyelesaikan kuis.
  // Jika ingin ditambahkan, kodenya mirip seperti createQuizScreen.
  // =============================

  // === 4. TOMBOL Continue/Results (SESUAI STANDAR BARU) ===
  const continueButtonWidth = 0.35; // Sama seperti tombol landing/greeting
  const continueButtonHeight = 0.04; // Sama seperti tombol landing/greeting
  const bottomPadding = 0.015;
  const buttonY = -panelHeight / 2 + continueButtonHeight / 2 + bottomPadding; // Y paling bawah (-0.1285)

  const isLastQuestion = questionIndex >= totalQuestions - 1;
  const buttonText = isLastQuestion ? "View Results" : "Next Question";

  const continueButton = createButton(
    buttonText,
    "next_question", // Aksi tetap sama
    continueButtonWidth,
    continueButtonHeight,
    BTN_COLOR_PRIMARY
  );
  continueButton.position.set(0, buttonY, 0.01); // Rata tengah
  continueButton.renderOrder = 1;
  viewerUIGroup.add(continueButton);
  // =============================

  // === 5. PANEL REVIEW JAWABAN (MENYESUAIKAN RUANG SISA) ===
  const questionText = `Q: ${currentQuestion.question}\n\n`; // Prefix ditambahkan
  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => {
      const prefix = `${String.fromCharCode(65 + index)}. ${answer}`;
      if (index === currentQuestion.correctAnswerIndex) {
        return `${prefix} (Correct)`; // ← Diubah sedikit
      }
      return prefix;
    })
    .join("\n");
  const fullResultText = questionText + answerChoicesText;

  const RESULT_TEXT_PANEL_WIDTH = panelWidth * 0.9; // Lebar hampir penuh (0.387)

  // Hitung Batas
  const textPanelTop = titleY - titleHeight / 2 - 0.01; // Di bawah judul
  const textPanelBottom = buttonY + continueButtonHeight / 2 + 0.01; // Di atas tombol continue

  // Hitung tinggi & posisi Y
  const RESULT_TEXT_PANEL_HEIGHT = Math.max(
    0.01,
    textPanelTop - textPanelBottom
  ); // Pastikan tidak negatif
  const textPanelY = (textPanelTop + textPanelBottom) / 2;

  const resultTextPanel = createTextPanel(
    fullResultText,
    RESULT_TEXT_PANEL_WIDTH,
    {
      fixedHeight: RESULT_TEXT_PANEL_HEIGHT,
      baseFontSize: 11, // <-- Font SUPER KECIL agar muat
    }
  );

  resultTextPanel.position.set(0, textPanelY, 0.01);
  resultTextPanel.renderOrder = 1;
  viewerUIGroup.add(resultTextPanel);
  // =============================

  // 6. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman laporan skor akhir.
 */
/**
 * Membuat UI untuk halaman laporan skor akhir.
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createQuizReportScreen(
  score,
  hasAttempted,
  isPostCompletion = false
) {
  clearUI(); // clearUI digunakan di sini

  // Posisi standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  // === 1. PERUBAHAN UKURAN PANEL ===
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR); // Radius 0, BG_COLOR
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);
  // =============================

  // === 2. JUDUL (SESUAI STANDAR BARU) ===

  const titleText = hasAttempted
    ? "Your Learning Report"
    : "Report Not Available"; // Judul dipersingkat
  const titleWidth = 0.35; // Lebar disesuaikan
  const titleHeight = 0.03; // Tinggi standar
  const topPadding = 0.015;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // 0.1335
  const titleLabel = createTitleLabel(titleText, titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);
  // =============================

  // === 3. TOMBOL KELUAR 'X' (SESUAI STANDAR BARU) ===
  const exitButtonAction = isPostCompletion
    ? "show_post_quiz_choice"
    : "back_to_landing"; // Aksi tetap sama
  const exitButtonSize = 0.025;
  const exitPadding = 0.01;
  const exitButton = createButton(
    "X",
    exitButtonAction,
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  const exitX = panelWidth / 2 - exitPadding - exitButtonSize / 2;
  const exitY = panelHeight / 2 - exitPadding - exitButtonSize / 2;
  exitButton.position.set(exitX, exitY, 0.001); // Z seperti greeting
  viewerUIGroup.add(exitButton);
  // =============================

  // === 4. KONTEN LAPORAN (MENYESUAIKAN RUANG SISA) ===
  const contentTop = titleY - titleHeight / 2 - 0.01; // Batas atas konten
  const contentBottom = -panelHeight / 2 + 0.01; // Batas bawah konten
  const availableContentHeight = contentTop - contentBottom;
  const contentCenterY = (contentTop + contentBottom) / 2;

  if (!hasAttempted) {
    // Tampilan jika belum mengerjakan kuis
    const reportText =
      "Complete all topics and the Final Test to view your report."; // Teks disingkat
    const LOCKED_TEXT_WIDTH = panelWidth * 0.9; // Lebar hampir penuh
    const LOCKED_TEXT_HEIGHT = availableContentHeight * 0.8; // Gunakan sebagian besar ruang

    const reportBody = createTextPanel(reportText, LOCKED_TEXT_WIDTH, {
      fixedHeight: LOCKED_TEXT_HEIGHT,
      baseFontSize: 14, // Font kecil
    });
    reportBody.position.set(0, contentCenterY, 0.02); // Posisikan di tengah
    viewerUIGroup.add(reportBody);
  } else {
    // Tampilan jika sudah mengerjakan kuis
    const totalQuestions = quizData.length;
    const finalScore = (score / totalQuestions) * 100;

    // A. Judul "Final Score"
    const scoreTitleWidth = 0.25; // Diperkecil
    const scoreTitleHeight = 0.025; // Diperkecil
    const scoreTitleY = contentTop - 0.03; // Posisi Y sedikit di bawah judul utama
    const scoreTitle = createSubtitleLabel(
      "Final Score",
      scoreTitleWidth,
      scoreTitleHeight
    );
    scoreTitle.position.set(0, scoreTitleY, 0.02);
    viewerUIGroup.add(scoreTitle);

    // B. Tampilan Skor (%)
    const scoreDisplayHeight = 0.08; // Ukuran tinggi tampilan skor
    const scoreDisplayY =
      scoreTitleY - scoreTitleHeight / 2 - scoreDisplayHeight / 2 - 0.01; // Di bawah judul skor
    const scoreDisplay = createScoreLabel(
      finalScore.toFixed(0) + "%",
      scoreDisplayHeight // Tinggi sebagai referensi ukuran
    );
    scoreDisplay.position.set(0, scoreDisplayY, 0.01);
    viewerUIGroup.add(scoreDisplay);

    // C. Teks Detail Skor
    const detailText = `You answered ${score} out of ${totalQuestions} questions correctly.`;

    const reportBodyWidth = panelWidth * 0.9; // Lebar hampir penuh
    const detailTextY = scoreDisplayY - scoreDisplayHeight / 2 - 0.03; // Di bawah skor

    const reportBody = createBodyText(detailText, reportBodyWidth, {
      baseFontSize: 16, // Font kecil-sedang
    });
    // Ambil tinggi aktual plane teks detail
    const actualDetailHeight = reportBody.geometry.parameters.height;
    reportBody.position.set(0, detailTextY - actualDetailHeight / 2, 0.02); // Posisikan Y berdasarkan tingginya
    viewerUIGroup.add(reportBody);
  }
  // =============================

  // 5. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman "Selesai Materi" (sebelum kuis akhir).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createCompletionScreen(playerName) {
  clearUI();

  // 1. Posisi standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  // === 2. PERUBAHAN UKURAN PANEL ===
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  // Radius 0 dan warna BG_COLOR
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);
  // =============================

  // === 3. JUDUL (SESUAI STANDAR BARU) ===
  let titleText = `Congrats, ${playerName}!`; // Judul dipersingkat
  const titleWidth = 0.35; // Lebar disesuaikan
  const titleHeight = 0.03; // Tinggi standar
  const topPadding = 0.015;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // 0.1335
  const titleLabel = createTitleLabel(
    titleText,
    titleWidth,
    titleHeight,
    "#FFD700" // Warna Emas tetap
  );
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);
  // =============================

  // === 4. TOMBOL (SESUAI STANDAR BARU) ===
  const buttonWidth = 0.35; // Sama seperti tombol landing/greeting
  const buttonHeight = 0.04; // Sama seperti tombol landing/greeting
  const bottomPadding = 0.015;
  const buttonY = -panelHeight / 2 + buttonHeight / 2 + bottomPadding; // Y paling bawah (-0.1285)
  const quizButton = createButton(
    "Take Final Test",
    "back_to_menu", // Aksi tetap sama
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  quizButton.position.set(0, buttonY, 0.01); // Rata tengah
  viewerUIGroup.add(quizButton);
  // =============================

  // === 5. PESAN (MENYESUAIKAN RUANG SISA) ===
  const messageText = "All topics completed.\nReady for the Final Test?"; // Teks disingkat
  const messageBodyWidth = panelWidth * 0.9; // Lebar hampir penuh (0.387)

  // Hitung Batas
  const textPanelTop = titleY - titleHeight / 2 - 0.01; // Di bawah judul
  const textPanelBottom = buttonY + buttonHeight / 2 + 0.01; // Di atas tombol

  // Hitung tinggi & posisi Y
  const availableMessageHeight = textPanelTop - textPanelBottom;
  const messageCenterY = (textPanelTop + textPanelBottom) / 2;

  const messageBody = createBodyText(messageText, messageBodyWidth, {
    baseFontSize: 16, // Font kecil-sedang
  });

  // Ambil tinggi aktual plane teks pesan
  const actualMessageHeight = messageBody.geometry.parameters.height;
  // Sesuaikan posisi Y agar benar-benar di tengah ruang sisa
  messageBody.position.set(0, messageCenterY, 0.01);
  viewerUIGroup.add(messageBody);
  // =============================

  // 6. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);

  // 7. Efek confetti (tidak perlu diubah)
  const confetti = createConfettiEffect();
  return confetti; // Tetap kembalikan objek confetti
}

/**
 * Membuat UI untuk halaman pilihan setelah kuis akhir selesai.
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createPostQuizChoiceScreen() {
  clearUI(); // clearUI digunakan di sini

  // 1. Posisi standar
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  // === 2. PERUBAHAN UKURAN PANEL ===
  const panelWidth = 0.43;
  const panelHeight = 0.327;
  // Radius 0 dan warna BG_COLOR
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);
  // =============================

  // === 3. JUDUL (SESUAI STANDAR BARU) ===
  const titleWidth = 0.35; // Lebar disesuaikan
  const titleHeight = 0.03; // Tinggi standar
  const topPadding = 0.015;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // 0.1335
  const titleLabel = createTitleLabel(
    "Session Complete", // Teks tetap sama
    titleWidth,
    titleHeight
  );
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);
  // =============================

  // === 4. TOMBOL (DIPERKECIL & DIPOSISIKAN) ===
  // Ukuran disamakan dengan tombol "True/False" di mini quiz
  const buttonWidth = 0.18; // <-- Diperkecil
  const buttonHeight = 0.04; // <-- Diperkecil
  const spacingX = 0.02; // <-- Jarak diperkecil
  const bottomPadding = 0.015;
  const buttonY = -panelHeight / 2 + buttonHeight / 2 + bottomPadding; // Y paling bawah (-0.1285)

  // Posisi X Kiri & Kanan
  const leftButtonX = -(spacingX / 2) - buttonWidth / 2;
  const rightButtonX = spacingX / 2 + buttonWidth / 2;

  // Tombol Kiri (Kembali ke Menu Utama)
  const mainMenuButton = createButton(
    "Menu", // Teks disingkat
    "back_to_landing",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_SECONDARY // Aksi sekunder
  );
  mainMenuButton.position.set(leftButtonX, buttonY, 0.01);
  viewerUIGroup.add(mainMenuButton);

  // Tombol Kanan (Ulangi Pelajaran) -> Aksi diubah ke back_to_menu juga
  const learnAgainButton = createButton(
    "Repeat", // Teks disingkat
    "back_to_menu", // Kembali ke menu topik untuk memilih lagi
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY // Aksi utama
  );
  learnAgainButton.position.set(rightButtonX, buttonY, 0.01);
  viewerUIGroup.add(learnAgainButton);
  // =============================

  // === 5. TEKS BODY (MENYESUAIKAN RUANG SISA) ===
  const subtitleText =
    "All lessons and the final test are complete. Repeat or return to menu?"; // Teks disingkat & disesuaikan
  const subtitleWidth = panelWidth * 0.9; // Lebar hampir penuh (0.387)

  // Hitung Batas
  const textPanelTop = titleY - titleHeight / 2 - 0.01; // Di bawah judul
  const textPanelBottom = buttonY + buttonHeight / 2 + 0.01; // Di atas tombol

  // Hitung tinggi & posisi Y
  const availableTextHeight = textPanelTop - textPanelBottom;
  const subtitleY = (textPanelTop + textPanelBottom) / 2;

  const subtitleLabel = createBodyText(subtitleText, subtitleWidth, {
    baseFontSize: 14, // Font kecil
  });

  // Ambil tinggi aktual plane teks pesan
  const actualSubtitleHeight = subtitleLabel.geometry.parameters.height;
  // Sesuaikan posisi Y agar benar-benar di tengah ruang sisa
  subtitleLabel.position.set(0, subtitleY, 0.01);
  viewerUIGroup.add(subtitleLabel);
  // =============================

  // 6. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
/**
 * Membuat UI untuk halaman credits (Tentang Aplikasi).
 */
export function createCreditsScreen(creditPages, pageIndex) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  clearViewerUI();

  const totalPanelWidth = 4.8;
  const totalPanelHeight = 2.0;

  const backgroundPanel = createUIPanel(totalPanelWidth, totalPanelHeight, 0.1);
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  // === Logo (kiri atas) ===
  const logoWidth = 0.24;
  const logoHeight = 0.24;
  const logoPanel = createImagePanel(
    "assets/images/logo-kampus.png",
    logoWidth,
    logoHeight
  );
  const paddingLogo = 0.08;
  logoPanel.position.set(
    -totalPanelWidth / 2 + logoWidth / 2 + paddingLogo,
    totalPanelHeight / 2 - logoHeight / 2 - paddingLogo,
    0.02
  );
  logoPanel.renderOrder = 1;
  viewerUIGroup.add(logoPanel);

  // Judul
  const titleWidth = 4.0;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel("About", titleWidth, titleHeight);
  const topPadding = 0.1;
  const titleY = 0.8;
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  // Panel Teks Credits
  const DESC_PANEL_FIXED_HEIGHT = 0.8;
  const descPanel = createTextPanel(creditPages, 4.2, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });

  // Set halaman awal
  const initialOffsetY =
    (creditPages.length - 1 - pageIndex) / creditPages.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = pageIndex;
  descPanel.userData.isCreditsPanel = true;

  const descPanelYOffset =
    titleY - titleHeight / 2 - descPanel.geometry.parameters.height / 2 - 0.1;
  descPanel.position.set(0, descPanelYOffset, 0.01);
  viewerUIGroup.add(descPanel);

  // Navigasi Halaman Credits
  const descNavY =
    descPanelYOffset - descPanel.geometry.parameters.height / 2 - 0.15;

  if (creditPages.length > 1) {
    const buttonWidth = 0.25;
    const indicatorWidth = 0.5;
    const padding = 0.1;

    const pageIndicatorText = `${pageIndex + 1}/${creditPages.length}`;
    const pageIndicator = createTitleLabel(
      pageIndicatorText,
      indicatorWidth,
      0.15
    );
    pageIndicator.position.set(0, descNavY, 0.02);
    viewerUIGroup.add(pageIndicator);

    // Tombol Next
    const isLastPage = pageIndex >= creditPages.length - 1;
    const nextButtonX = indicatorWidth / 2 + padding + buttonWidth / 2;
    const nextDescButton = createButton(
      ">",
      isLastPage ? "locked" : "next_credit",
      buttonWidth,
      0.2,
      isLastPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isLastPage) {
      nextDescButton.userData.colors = null;
      nextDescButton.userData.currentState = "disabled";
    }
    nextDescButton.position.set(nextButtonX, descNavY, 0.01);
    viewerUIGroup.add(nextDescButton);

    // Tombol Prev
    const isFirstPage = pageIndex === 0;
    const prevButtonX = -indicatorWidth / 2 - padding - buttonWidth / 2;
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_credit",
      buttonWidth,
      0.2,
      isFirstPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isFirstPage) {
      prevDescButton.userData.colors = null;
      prevDescButton.userData.currentState = "disabled";
    }
    prevDescButton.position.set(prevButtonX, descNavY, 0.01);
    viewerUIGroup.add(prevDescButton);
  }

  // Tombol Keluar X
  const exitButtonSize = 0.25;
  const exitPadding = 0.15;
  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  exitButton.position.set(
    totalPanelWidth / 2 - exitPadding - exitButtonSize / 2,
    totalPanelHeight / 2 - exitPadding - exitButtonSize / 2,
    0.02
  );
  viewerUIGroup.add(exitButton);

  // Avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.4, 0.4, 0.4),
      new THREE.Vector3(
        -totalPanelWidth / 2 - 0.2,
        totalPanelHeight / 2 - 0.2,
        0.05
      )
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

// ===============================================================
// FUNGSI MANAJEMEN UI (PUBLIK)
// ===============================================================

/**
 * Membersihkan semua elemen UI dari `uiGroup` dan `viewerUIGroup`.
 * Menghentikan animasi dan membersihkan memori (dispose).
 */
export function clearUI(options = {}) {
  const keepAvatar = options.isTextUpdateOnly || false;
  // Hentikan animasi yang mungkin berjalan
  clearActiveTypingAnimation();
  stopAvatarDropAnimation();
  stopAvatarFlyUpAnimation();

  // Hentikan mixer avatar
  if (avatarMixer && !keepAvatar) {
    avatarMixer.stopAllAction();
    avatarMixer.uncacheRoot(avatarMixer.getRoot());
    avatarMixer = null;
  }

  // Iterasi dan bersihkan kedua grup UI
  [uiGroup, viewerUIGroup].forEach((group) => {
    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i];
      if (keepAvatar && child === currentAvatar) {
        continue;
      }
      // Traverse untuk membersihkan material dan geometri
      child.traverse((object) => {
        if (object.isMesh) {
          object.geometry?.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => {
                material.map?.dispose();
                material.dispose();
              });
            } else {
              object.material.map?.dispose();
              object.material.dispose();
            }
          }
        }
      });
      group.remove(child);
    }
  });

  // Reset avatar
  if (!keepAvatar) {
    // <-- TAMBAHKAN !keepAvatar
    currentAvatar = null;
  }
}

/**
 * Membersihkan elemen UI dari `viewerUIGroup` saja.
 * Berguna saat me-refresh navigasi di halaman viewer.
 */
export function clearViewerUI() {
  // Mirip clearUI, tapi hanya untuk viewerUIGroup
  // Hentikan mixer avatar
  if (avatarMixer) {
    avatarMixer.stopAllAction();
    avatarMixer.uncacheRoot(avatarMixer.getRoot());
    avatarMixer = null;
  }

  for (let i = viewerUIGroup.children.length - 1; i >= 0; i--) {
    const child = viewerUIGroup.children[i];
    child.traverse((object) => {
      if (object.isMesh) {
        object.geometry?.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => {
              material.map?.dispose();
              material.dispose();
            });
          } else {
            object.material.map?.dispose();
            object.material.dispose();
          }
        }
      }
    });
    viewerUIGroup.remove(child);
  }
  // Reset avatar
  currentAvatar = null;
}

/**
 * Mengupdate posisi `uiGroup` agar mengikuti kamera (hanya di mode VR).
 */
export function updateUIGroupPosition() {
  if (uiGroup.children.length > 0) {
    const distance = UI_DISTANCE;
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const newPosition = new THREE.Vector3();
    newPosition
      .copy(camera.position)
      .add(cameraDirection.multiplyScalar(distance));
    uiGroup.position.copy(newPosition);
    uiGroup.lookAt(camera.position);
  }
}

// ===============================================================
// FUNGSI DEBUG (FPS LABEL)
// ===============================================================

/**
 * Membuat mesh plane untuk menampilkan label FPS.
 * @returns {THREE.Mesh}
 */
export function createFpsLabel() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false, // Performance optimization
  });

  // Enable high-quality text rendering
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  // Untuk text clarity maksimal
  context.textRendering = "optimizeLegibility";
  const canvasWidth = 256;
  const canvasHeight = 128;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  context.fillStyle = "white";
  context.font = "bold 48px Verdana, Geneva, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("0", canvasWidth / 2, canvasHeight / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const aspect = canvasWidth / canvasHeight;
  const height = 0.2;
  const width = height * aspect;
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = { context, canvas, texture, lastFps: -1 };
  return mesh;
}

/**
 * Mengupdate teks pada label FPS (dipanggil di render loop).
 * @param {THREE.Mesh} mesh - Mesh label FPS.
 * @param {number} fps - Nilai FPS saat ini.
 */
export function updateFpsLabel(mesh, fps) {
  // Hanya update jika nilai FPS berubah
  if (mesh.userData.lastFps === fps) return;
  mesh.userData.lastFps = fps;

  const { context, canvas, texture } = mesh.userData;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "white";
  context.font = "bold 48px Verdana, Geneva, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    `FPS: ${fps.toString()}`,
    canvas.width / 2,
    canvas.height / 2
  );

  texture.needsUpdate = true;
}
export function createQuickGuideScreen(guidePages, pageIndex) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  clearViewerUI();

  // === 1. PERUBAHAN UKURAN PANEL ===
  const totalPanelWidth = 0.43;
  const totalPanelHeight = 0.327;
  // =============================

  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0 // Radius 0 agar sama
  );
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  // === 2. JUDUL (SESUAI STANDAR BARU) ===
  const titleWidth = 0.3; // Diperkecil
  const titleHeight = 0.03; // Diperkecil
  const topPadding = 0.015;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding; // 0.1335
  const titleLabel = createTitleLabel("Quick Guide", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);
  // ============================

  // === 3. TOMBOL 'X' (SESUAI STANDAR BARU) ===
  const exitButtonSize = 0.025; // Ukuran dari greeting page
  const exitPadding = 0.01; // Padding dari greeting page
  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  const exitX = totalPanelWidth / 2 - exitPadding - exitButtonSize / 2;
  const exitY = totalPanelHeight / 2 - exitPadding - exitButtonSize / 2;
  exitButton.position.set(exitX, exitY, 0.001); // Z-value dari greeting
  viewerUIGroup.add(exitButton);
  // ============================

  // === 4. NAVIGASI HALAMAN (DIPERKECIL & DIPINDAH) ===
  // Kita letakkan di bagian bawah panel
  const descNavY = -0.12; // Posisi Y di bawah
  const buttonWidth = 0.032; // Diperkecil
  const buttonHeight = 0.03; // Diperkecil
  const indicatorWidth = 0.05; // Diperkecil
  const indicatorHeight = 0.02; // Diperkecil
  const padding = 0.02; // Diperkecil

  if (guidePages.length > 1) {
    const pageIndicatorText = `${pageIndex + 1}/${guidePages.length}`;
    const pageIndicator = createTitleLabel(
      pageIndicatorText,
      indicatorWidth,
      indicatorHeight
    );
    pageIndicator.position.set(0, descNavY, 0.02); // Rata tengah
    viewerUIGroup.add(pageIndicator);

    // Tombol Next (Kanan)
    const isLastPage = pageIndex >= guidePages.length - 1;
    const nextButtonX = indicatorWidth / 2 + padding + buttonWidth / 2;
    const nextDescButton = createButton(
      ">",
      isLastPage ? "locked" : "next_guide",
      buttonWidth,
      buttonHeight,
      isLastPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isLastPage) {
      nextDescButton.userData.colors = null;
      nextDescButton.userData.currentState = "disabled";
    }
    nextDescButton.position.set(nextButtonX, descNavY, 0.01);
    viewerUIGroup.add(nextDescButton);

    // Tombol Prev (Kiri)
    const isFirstPage = pageIndex === 0;
    const prevButtonX = -indicatorWidth / 2 - padding - buttonWidth / 2;
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_guide",
      buttonWidth,
      buttonHeight,
      isFirstPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isFirstPage) {
      prevDescButton.userData.colors = null;
      prevDescButton.userData.currentState = "disabled";
    }
    prevDescButton.position.set(prevButtonX, descNavY, 0.01);
    viewerUIGroup.add(prevDescButton);
  }
  // ============================

  // === 5. PANEL TEKS (MENYESUAIKAN RUANG SISA) ===
  const DESC_PANEL_WIDTH = totalPanelWidth * 0.9; // 0.387

  // Hitung Batas
  const textPanelTop = titleY - titleHeight / 2 - 0.01; // Batas atas (di bwh judul)
  const textPanelBottom = descNavY + buttonHeight / 2 + 0.01; // Batas bawah (di atas nav)

  // Hitung tinggi & posisi Y
  const DESC_PANEL_FIXED_HEIGHT = textPanelTop - textPanelBottom;
  const descPanelYOffset = (textPanelTop + textPanelBottom) / 2;

  const descPanel = createTextPanel(guidePages, DESC_PANEL_WIDTH, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });

  // Set halaman awal (Logika scroll tidak berubah)
  const initialOffsetY =
    (guidePages.length - 1 - pageIndex) / guidePages.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = pageIndex;
  descPanel.userData.isGuidePanel = true;

  descPanel.position.set(0, descPanelYOffset, 0.01); // Posisi Y baru
  viewerUIGroup.add(descPanel);
  // ============================

  // 6. Atur Posisi Grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
