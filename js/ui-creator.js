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
const LOGICAL_RESOLUTION = 1024; // ↑ Increased from 768
const logicalBaseFontSize = 40; // ↑ Increased from 24
const BG_COLOR = "#000000ff";
const BTN_COLOR_PRIMARY = "#00000088";
const BTN_COLOR_SECONDARY = "#4b4b4b8a";
const BTN_COLOR_HOVER = "#2727278a";
const TEXT_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#3182CE"; // Untuk skor

// --- Posisi & Jarak ---
const UI_DISTANCE = 2.5; // Jarak UI dari kamera di mode VR
const VIEWER_UI_POSITION = new THREE.Vector3(-3, 1.6, -3);
const VIEWER_UI_LOOKAT = new THREE.Vector3(0, 1.6, 0);

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
let avatarMixer;
let currentAvatar = null;
let avatarModel = null;
let avatarDropAnimation = {
  isAnimating: false,
  startY: 0,
  targetY: 0,
  currentY: 0,
  speed: 2,
  onComplete: null,
};
let avatarFlyUpAnimation = {
  isAnimating: false,
  startY: 0,
  targetY: 0,
  currentY: 0,
  speed: 3, // Lebih cepat untuk "exit"
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
  model.rotation.y = 0.4;
  model.userData.initialY = position.y;
  viewerUIGroup.add(model);

  if (shouldAnimate) {
    const dropHeight = 3; // Sekarang nilai ini akan berpengaruh

    // Koreksi: Bagi dropHeight dengan skala y dari avatar
    // untuk mendapatkan ketinggian yang benar di local space.
    model.position.y = position.y + dropHeight / scale.y;

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
  if (Math.abs(currentY - targetY) < 0.01) {
    currentAvatar.position.y = targetY;
    avatarDropAnimation.isAnimating = false;

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
  if (Math.abs(currentY - targetY) < 0.05) {
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
    !avatarDropAnimation.isAnimating && // Hanya jika tidak sedang jatuh
    !avatarFlyUpAnimation.isAnimating // Hanya jika tidak sedang jatuh
  ) {
    const hoverAmplitude = 0.04;
    const hoverSpeed = 1.5;
    currentAvatar.position.y =
      currentAvatar.userData.initialY +
      Math.sin(elapsedTime * hoverSpeed) * hoverAmplitude;
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
    baseFontSize: logicalBaseFontSize = 24,
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
  const spawnRangeZ = 2;

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
  const uiBasePosition = new THREE.Vector3(0, 1.2, -1);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 1.5);

  // Panel utama
  const panelWidth = 1.4;
  const panelHeight = 0.8;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.05);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const titleLabel = createTitleLabel("Choose Experience Mode", 1.17, 0.14);
  titleLabel.position.set(0, 0.27, 0.01);
  viewerUIGroup.add(titleLabel);

  const buttonWidth = 0.7;
  const buttonHeight = 0.15;
  const spacing = 0.18;
  const startY = -0.02;

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

export function createAvatarGreetingPage(playerName, greetingIndex = 0) {
  // KONSISTEN dengan halaman lainnya
  const uiBasePosition = new THREE.Vector3(0, 1.2, -1);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 1.5);

  // Panel ukuran standard (chatbot style)
  const panelWidth = 1.4;
  const panelHeight = 0.8;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.05);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // Tombol X (Exit) - Ukuran konsisten dengan halaman lain
  const exitButtonSize = 0.09;
  const exitPadding = 0.055;
  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  exitButton.position.set(
    panelWidth / 2 - exitPadding - exitButtonSize / 2,
    panelHeight / 2 - exitPadding - exitButtonSize / 2,
    0.02
  );
  exitButton.renderOrder = 2;
  viewerUIGroup.add(exitButton);

  // Data greeting
  const greetingTexts = GREETING_DATA(playerName);
  const currentGreeting = greetingTexts[greetingIndex];
  if (!currentGreeting) return;

  const isLastGreeting = greetingIndex >= greetingTexts.length - 1;

  // Tombol Continue (di bawah, chatbot style)
  const primaryButtonWidth = 1.0;
  const primaryButtonHeight = 0.15;
  const continueButton = createButton(
    isLastGreeting ? "Start Learning" : "Continue",
    null,
    primaryButtonWidth,
    primaryButtonHeight,
    BTN_COLOR_PRIMARY
  );
  continueButton.position.set(0, -0.25, 0.01); // Lebih rendah untuk panel kecil
  continueButton.visible = false;
  viewerUIGroup.add(continueButton);

  // Setup Avatar (kiri atas, professional chatbot style)
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    const avatarFinalPosition = new THREE.Vector3(
      -panelWidth / 2 - 0.5,
      panelHeight / 2 - 0.05,
      0.05
    );
    const shouldAnimateDrop = greetingIndex === 0;

    // Callback setelah animasi drop selesai
    const onAvatarReady = () => {
      // 1. Putar audio
      if (window.playCurrentGreetingAudioCallback) {
        window.playCurrentGreetingAudioCallback();
      }

      // 2. Tampilkan typing text (chatbot bubble style)
      if (currentGreeting.text) {
        const textWidth = panelWidth * 0.88;
        const welcomeLabel = createTypingText(
          currentGreeting.text,
          textWidth,
          {
            baseFontSize: 40,
            vrFontScale: 1.1,
            lineHeightScale: 1.3, // Sedikit lebih lebar untuk readability
          },
          () => {
            // 3. Tampilkan tombol setelah typing selesai
            continueButton.visible = true;
            continueButton.userData.action = isLastGreeting
              ? "continue_to_landing"
              : "next_greeting";
          }
        );
        welcomeLabel.position.set(0, 0.05, 0.01); // Adjusted untuk panel kecil
        viewerUIGroup.add(welcomeLabel);
      }
    };

    if (shouldAnimateDrop) {
      avatarDropAnimation.onComplete = onAvatarReady;
    }

    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.2, 0.2, 0.2),
      avatarFinalPosition,
      shouldAnimateDrop
    );

    if (!shouldAnimateDrop) {
      onAvatarReady();
    }
  }

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
    willReadFrequently: false, // Performance optimization
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
 */
export function createLandingPage(playerName, options = {}) {
  const uiBasePosition = new THREE.Vector3(0, 1.2, -1);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 1.5);

  // Panel utama
  const panelWidth = 1.4;
  const panelHeight = 0.8;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.05);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // === Logo (kiri atas) ===
  const logoWidth = 0.15;
  const logoHeight = 0.15;
  const logoPanel = createImagePanel(
    "assets/images/logo-kampus.png",
    logoWidth,
    logoHeight
  );
  const paddingLogo = 0.023;
  logoPanel.position.set(
    -panelWidth / 2 + logoWidth / 2 + paddingLogo,
    panelHeight / 2 - logoHeight / 2 - paddingLogo,
    0.02
  );
  logoPanel.renderOrder = 1;
  viewerUIGroup.add(logoPanel);

  // === TITLE "MENU" (atas tengah) ===
  const titleWidth = 1.17;
  const titleHeight = 0.14;
  const topPadding = 0.04;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;

  const titleLabel = createTitleLabel("Main Menu", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  // === Area konten di bawah title ===
  const contentAreaTop = titleY - titleHeight / 2;
  const availableHeight = contentAreaTop - -panelHeight / 2;
  const contentCenterY = contentAreaTop - availableHeight / 2;

  // Welcome Text (kiri, center dalam area konten)
  if (playerName) {
    const welcomeText = `What do you want to do next, ${playerName}?`;
    const titleMaxWidth = 0.58;
    const titleMaxHeight = 0.48;
    const titlePaddingLeft = 0.088;

    const welcomeLabel = createWrappingTitleLabel(
      welcomeText,
      titleMaxWidth,
      titleMaxHeight,
      40, // baseFontSize disesuaikan (dari 28 ke 11)
      1,
      1.2,
      TEXT_COLOR
    );

    const welcomeTextX = -panelWidth / 2 + titlePaddingLeft + titleMaxWidth / 2;
    const welcomeTextY = contentCenterY;

    if (avatarModel) {
      const avatarInstance = avatarModel.scene.clone();

      // Gunakan posisi yang sama dengan halaman greeting agar konsisten
      const avatarFinalPosition = new THREE.Vector3(
        -panelWidth / 2 - 0.5, // -0.7 - 0.5 = -1.2
        panelHeight / 2 - 0.05, // 0.4 - 0.05 = 0.35
        0.05
      );

      const skipDrop = options.skipAvatarDrop || false;

      // Animasikan drop (true) KECUALI jika kita skip (datang dari greeting)
      const shouldAnimateDrop = !skipDrop;
      // === AKHIR MODIFIKASI LOGIKA ===

      setupAvatar(
        avatarInstance,
        new THREE.Vector3(0.2, 0.2, 0.2), // Skala yang sama
        avatarFinalPosition,
        shouldAnimateDrop // <-- Menggunakan variabel dinamis baru
      );
    }

    welcomeLabel.position.set(welcomeTextX, welcomeTextY, 0.01);
    viewerUIGroup.add(welcomeLabel);
  }

  // Tombol-tombol (kanan, center dalam area konten)
  const buttonWidth = 0.58;
  const buttonHeight = 0.112;
  const buttonSpacingY = 0.144;
  const buttonPaddingRight = 0.088;
  const buttonX = panelWidth / 2 - buttonPaddingRight - buttonWidth / 2;

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
  const totalButtonsHeight = (numButtons - 1) * buttonSpacingY;
  const buttonCenterY = contentCenterY;
  const buttonStartY = buttonCenterY + totalButtonsHeight / 2;

  primaryButtons.forEach((btn, index) => {
    const button = createButton(
      btn.text,
      btn.action,
      buttonWidth,
      buttonHeight,
      btn.color
    );
    const buttonY = buttonStartY - index * buttonSpacingY;
    button.position.set(buttonX, buttonY, 0.01);
    viewerUIGroup.add(button);
  });

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman menu pemilihan topik (grid melengkung).
 */
export function createMenuPage(allComponentsUnlocked, quizHasBeenAttempted) {
  const uiBasePosition = new THREE.Vector3(0, 1.4, -2.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 2);
  const localCenterY = 0.5;
  const localLookAtTarget = new THREE.Vector3(0, localCenterY, 5);

  // Pengaturan Grid Melengkung
  const radius = 3.5;
  const angleSpan = Math.PI * 0.8;
  const itemsPerRow = 4;
  const rowHeight = 0.5;
  const startAngle = -angleSpan / 2;
  const angleStep = angleSpan / (itemsPerRow - 1);

  // Judul
  const titleY = localCenterY + 1;
  const titleZ = -(radius - 2);
  const titleBgWidth = 3;
  const titleBgHeight = 0.45;
  const titleBackground = createUIPanel(
    titleBgWidth,
    titleBgHeight,
    0.05,
    BG_COLOR,
    0.9
  );
  titleBackground.position.set(0, titleY, titleZ);
  titleBackground.lookAt(localLookAtTarget);
  viewerUIGroup.add(titleBackground);

  const titleLabel = createTitleLabel("Select Topic", 4.0, 0.35);
  titleLabel.position.set(0, titleY, titleZ + 0.01);
  titleLabel.lookAt(localLookAtTarget);
  viewerUIGroup.add(titleLabel);

  // Tombol Komponen
  components.forEach((comp, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const angle = startAngle + col * angleStep;
    const isUnlocked = comp.unlocked;

    const buttonLabel = isUnlocked ? `${index + 1}. ${comp.label}` : "Locked";
    const buttonColor = isUnlocked ? BTN_COLOR_PRIMARY : BTN_COLOR_SECONDARY;
    const button = createButton(
      buttonLabel,
      isUnlocked ? `select_${index}` : "locked",
      1.8,
      0.25,
      buttonColor
    );
    if (!isUnlocked) {
      button.userData.colors = null; // Nonaktifkan hover
    }

    const x = radius * Math.sin(angle);
    const z = -radius * Math.cos(angle);
    const y = localCenterY + 0.4 - row * rowHeight;

    button.position.set(x, y, z);
    button.lookAt(localLookAtTarget);
    viewerUIGroup.add(button);
  });

  // Tombol Navigasi Bawah
  const actionButtonY = localCenterY - 1;
  const actionZ = -(radius - 1.5);
  const actionSpacingX = 2.4;

  const exitButton = createButton(
    "< Main Menu",
    "back_to_landing",
    2.2,
    0.3,
    BG_COLOR
  );
  exitButton.position.set(-actionSpacingX / 2, actionButtonY, actionZ);
  exitButton.lookAt(localLookAtTarget);
  viewerUIGroup.add(exitButton);

  // Logika Tombol Kuis/Laporan
  let quizButtonLabel, quizButtonAction, quizButtonColor;
  if (!allComponentsUnlocked) {
    quizButtonLabel = "Final Test > (Locked)";
    quizButtonAction = "locked";
    quizButtonColor = BTN_COLOR_SECONDARY;
  } else if (allComponentsUnlocked && !quizHasBeenAttempted) {
    quizButtonLabel = "Final Test >";
    quizButtonAction = "show_quiz";
    quizButtonColor = BTN_COLOR_PRIMARY;
  } else {
    quizButtonLabel = "Learning Report >";
    quizButtonAction = "show_quiz_report";
    quizButtonColor = BG_COLOR;
  }
  const quizButton = createButton(
    quizButtonLabel,
    quizButtonAction,
    2.2,
    0.3,
    quizButtonColor
  );
  if (!allComponentsUnlocked) {
    quizButton.userData.colors = null; // Nonaktifkan hover jika terkunci
  }
  quizButton.position.set(actionSpacingX / 2, actionButtonY, actionZ);
  quizButton.lookAt(localLookAtTarget);
  viewerUIGroup.add(quizButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman viewer komponen (deskripsi, navigasi).
 */
/**
 * Membuat UI untuk halaman viewer komponen (deskripsi, navigasi).
 */
export function createViewerPage(
  component,
  index,
  descriptionIndex = 0,
  highestComponentUnlocked = 0,
  hasAttemptedQuiz = false
) {
  // Posisi UI di dunia (Konsisten dengan halaman lain)
  const uiBasePosition = new THREE.Vector3(-1.2, 1.2, 0); // Disesuaikan sedikit ke kiri
  const uiLookAtPosition = new THREE.Vector3(0.3, 1.6, 1.5); // Melihat sedikit ke atas

  clearViewerUI();
  navButtons = []; // Pastikan reset navButtons

  // === Panel Utama (Ukuran standar 1.4 x 0.8) ===
  const panelWidth = 1.4;
  const panelHeight = 0.8;

  const backgroundPanel = createUIPanel(
    panelWidth,
    panelHeight,
    0.05, // Radius standar
    "#000000ff", // Warna latar belakang viewer
    0.7 // Opacity viewer
  );
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0; // Render di belakang
  viewerUIGroup.add(backgroundPanel);

  // === Judul (Layout standar) ===
  const titleWidth = 1.17; // Lebar standar (panelWidth - padding * 2)
  const titleHeight = 0.14; // Tinggi standar
  const topPadding = 0.04; // Padding atas standar
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // Posisi Y standar (0.29)
  const titleLabel = createTitleLabel(component.label, titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.02); // Z sedikit di depan panel
  titleLabel.renderOrder = 2; // Render di atas deskripsi
  viewerUIGroup.add(titleLabel);

  // === Panel Deskripsi (Ukuran disesuaikan agar pas) ===
  // Tinggi panel deskripsi = panelHeight - (area title + area nav desc + area nav comp + padding)
  const navDescHeightArea = 0.08 + 0.04; // Tinggi tombol + padding bawah
  const navCompHeightArea = 0.09 + 0.04; // Tinggi tombol + padding bawah
  const availableDescHeight =
    panelHeight -
    (panelHeight / 2 - titleY + titleHeight / 2) - // Area atas (termasuk title)
    navDescHeightArea -
    navCompHeightArea -
    0.01; // Sedikit padding tambahan
  const DESC_PANEL_FIXED_HEIGHT = Math.max(0.1, availableDescHeight); // Minimal 0.1
  const DESC_PANEL_WIDTH = 1.23; // Lebar standar (panelWidth - padding * 2)

  const descPanel = createTextPanel(component.description, DESC_PANEL_WIDTH, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
    baseFontSize: 24, // Sedikit lebih kecil agar muat
  });

  // Kalkulasi Y agar center di antara title dan nav desc
  const descPanelYOffset =
    titleY - titleHeight / 2 - DESC_PANEL_FIXED_HEIGHT / 2 - 0.03; // Padding antara title dan desc
  descPanel.position.set(0, descPanelYOffset, 0.01);
  descPanel.renderOrder = 1; // Render di bawah title
  viewerUIGroup.add(descPanel);

  // Atur offset awal scroll
  const initialOffsetY =
    (component.description.length - 1 - descriptionIndex) /
    component.description.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = descriptionIndex;
  descPanel.userData.isScrollableText = true; // Pastikan flag ini ada

  // === Navigasi Deskripsi (Layout standar seperti Quick Guide) ===
  const descNavY = descPanelYOffset - DESC_PANEL_FIXED_HEIGHT / 2 - 0.06; // Posisi Y di bawah panel deskripsi

  if (component.description.length > 1) {
    const buttonWidth = 0.073; // Ukuran tombol kecil standar
    const buttonHeight = 0.08; // Ukuran tombol kecil standar
    const indicatorWidth = 0.15; // Lebar indikator standar
    const indicatorHeight = 0.06; // Tinggi indikator standar
    const padding = 0.029; // Jarak antar elemen standar

    // Kalkulasi posisi X agar center
    const totalNavWidth = buttonWidth * 2 + indicatorWidth + padding * 2;
    const startX = -totalNavWidth / 2;

    // Tombol Prev "<"
    const isFirstPage = descriptionIndex <= 0;
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_description",
      buttonWidth,
      buttonHeight,
      isFirstPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isFirstPage) {
      prevDescButton.userData.colors = null;
      prevDescButton.userData.currentState = "disabled";
    }
    prevDescButton.position.set(startX + buttonWidth / 2, descNavY, 0.01);
    prevDescButton.renderOrder = 1;
    viewerUIGroup.add(prevDescButton);
    navButtons.push(prevDescButton);

    // Indikator Halaman "1 / 3"
    const pageIndicatorText = `${descriptionIndex + 1} / ${
      component.description.length
    }`;
    const pageIndicator = createTitleLabel(
      pageIndicatorText,
      indicatorWidth,
      indicatorHeight
    );
    pageIndicator.name = "page_indicator"; // Beri nama untuk update
    pageIndicator.position.set(
      startX + buttonWidth + padding + indicatorWidth / 2,
      descNavY,
      0.02 // Z sedikit di depan tombol
    );
    pageIndicator.renderOrder = 2; // Di atas tombol
    pageIndicator.material.depthWrite = false; // Agar tidak Z-fighting
    viewerUIGroup.add(pageIndicator);

    // Tombol Next ">"
    const isLastPage = descriptionIndex >= component.description.length - 1;
    const nextDescButton = createButton(
      ">",
      isLastPage ? "locked" : "next_description",
      buttonWidth,
      buttonHeight,
      isLastPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isLastPage) {
      nextDescButton.userData.colors = null;
      nextDescButton.userData.currentState = "disabled";
    }
    nextDescButton.position.set(
      startX +
        buttonWidth +
        padding +
        indicatorWidth +
        padding +
        buttonWidth / 2,
      descNavY,
      0.01
    );
    nextDescButton.renderOrder = 1;
    viewerUIGroup.add(nextDescButton);
    navButtons.push(nextDescButton);
  }

  // === Navigasi Komponen Bawah (Back, Next) ===
  const navCompButtonWidth = 0.42; // Ukuran tombol bawah
  const navCompButtonHeight = 0.09; // Ukuran tombol bawah
  const bottomPadding = 0.04; // Padding dari bawah panel
  const navCompY = -panelHeight / 2 + navCompButtonHeight / 2 + bottomPadding;
  const navCompZ = 0.01;
  const edgePadding = 0.05; // Padding dari tepi panel

  // Tombol "< Back"
  if (index > 0) {
    const prevButton = createButton(
      "< Back",
      "prev_component",
      navCompButtonWidth,
      navCompButtonHeight
    );
    prevButton.position.set(
      -panelWidth / 2 + navCompButtonWidth / 2 + edgePadding,
      navCompY,
      navCompZ
    );
    prevButton.renderOrder = 1;
    viewerUIGroup.add(prevButton);
    navButtons.push(prevButton);
  }

  // Tombol "Next >"
  const isLastComponent = index >= components.length - 1;
  const allMaterialsUnlocked = highestComponentUnlocked >= components.length;
  // Kondisi tombol next:
  // - Muncul jika BUKAN komponen terakhir
  // - ATAU jika INI komponen terakhir TAPI belum semua materi terbuka DAN belum pernah ikut kuis akhir
  const shouldShowNextButton =
    !isLastComponent ||
    (!allMaterialsUnlocked &&
      !hasAttemptedQuiz &&
      index === highestComponentUnlocked);

  if (shouldShowNextButton) {
    const nextButton = createButton(
      "Next >",
      "next_component",
      navCompButtonWidth,
      navCompButtonHeight
    );
    nextButton.position.set(
      panelWidth / 2 - navCompButtonWidth / 2 - edgePadding,
      navCompY,
      navCompZ
    );
    nextButton.renderOrder = 1;
    viewerUIGroup.add(nextButton);
    navButtons.push(nextButton);
  }

  // === Tombol Aksi Samping (Menu, Audio) ===
  // === Tombol Aksi DI ATAS Panel (Close & Audio) - HORIZONTAL LAYOUT ===
  const actionButtonSize = 0.09; // Ukuran tombol
  const actionButtonSpacingX = 0.04; // Jarak horizontal antar tombol
  const topOffset = 0.01; // Jarak dari atas panel
  const edgePaddingFromRight = 0.0; // Padding dari kanan (alignment dengan panel)

  // Y Position: DI ATAS panel
  const buttonsY = panelHeight / 2 + actionButtonSize / 2 + topOffset;

  // Tombol "X" (Close) - PALING KANAN
  const closeButton = createButton(
    "X",
    "back_to_menu",
    actionButtonSize,
    actionButtonSize,
    BTN_COLOR_PRIMARY,
    "circle"
  );
  const closeX = panelWidth / 2 - actionButtonSize / 2 - edgePaddingFromRight;
  closeButton.position.set(closeX, buttonsY, 0.02); // Y di atas panel
  closeButton.renderOrder = 2;
  viewerUIGroup.add(closeButton);
  navButtons.push(closeButton);

  // Tombol "🔊" (Audio) - SEBELAH KIRI CLOSE
  if (component.audioFile) {
    const audioButton = createButton(
      "🔊",
      "play_audio",
      actionButtonSize,
      actionButtonSize,
      BTN_COLOR_PRIMARY,
      "circle"
    );
    const audioX = closeX - actionButtonSize - actionButtonSpacingX;
    audioButton.position.set(audioX, buttonsY, 0.02); // Y sama dengan Close
    audioButton.renderOrder = 2;
    viewerUIGroup.add(audioButton);
    navButtons.push(audioButton);
  }
  // Atur posisi akhir grup UI
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman kuis mini (per komponen).
 */
export function createMiniQuizPage(component) {
  // Posisi konsisten dengan Viewer Panel
  const uiBasePosition = new THREE.Vector3(-1.2, 1.2, 0);
  const uiLookAtPosition = new THREE.Vector3(0.3, 1.6, 1.5);

  clearViewerUI();
  navButtons = [];

  // === Panel Utama (Ukuran standar) ===
  const panelWidth = 1.4;
  const panelHeight = 0.8;

  const backgroundPanel = createUIPanel(
    panelWidth,
    panelHeight,
    0.05,
    "#000000ff",
    0.7
  );
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  // === Judul ===
  const titleWidth = 1.17;
  const titleHeight = 0.14;
  const topPadding = 0.04;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;
  const titleLabel = createTitleLabel("Mini Quiz", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.02);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // === Panel Pertanyaan ===
  const currentQuestion = component.quiz[0];
  const QUESTION_PANEL_HEIGHT = 0.35;
  const QUESTION_PANEL_WIDTH = 1.23;

  const questionPanel = createTextPanel(
    currentQuestion.question,
    QUESTION_PANEL_WIDTH,
    {
      fixedHeight: QUESTION_PANEL_HEIGHT,
      baseFontSize: 24,
    }
  );

  const questionPanelY =
    titleY - titleHeight / 2 - QUESTION_PANEL_HEIGHT / 2 - 0.05;
  questionPanel.position.set(0, questionPanelY, 0.01);
  questionPanel.renderOrder = 1;
  viewerUIGroup.add(questionPanel);

  // === Tombol Jawaban (True/False) ===
  const buttonWidth = 0.55;
  const buttonHeight = 0.12;
  const buttonSpacing = 0.15;
  const buttonY = -panelHeight / 2 + buttonHeight / 2 + 0.08;

  currentQuestion.answers.forEach((answer, index) => {
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "mini_quiz_correct" : "mini_quiz_incorrect";
    const buttonX =
      index === 0
        ? -buttonSpacing / 2 - buttonWidth / 2
        : buttonSpacing / 2 + buttonWidth / 2;

    const button = createButton(
      answer,
      action,
      buttonWidth,
      buttonHeight,
      BTN_COLOR_PRIMARY
    );
    button.position.set(buttonX, buttonY, 0.01);
    button.renderOrder = 1;
    viewerUIGroup.add(button);
    navButtons.push(button);
  });

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman hasil kuis mini.
 */
export function createMiniQuizResultPage(component, isCorrect) {
  // Posisi konsisten dengan Viewer Panel
  const uiBasePosition = new THREE.Vector3(-1.2, 1.2, 0);
  const uiLookAtPosition = new THREE.Vector3(0.3, 1.6, 1.5);

  clearViewerUI();
  navButtons = [];

  // === Panel Utama (Ukuran standar) ===
  const panelWidth = 1.4;
  const panelHeight = 0.8;

  const backgroundPanel = createUIPanel(
    panelWidth,
    panelHeight,
    0.05,
    "#000000ff",
    0.7
  );
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  // === Judul Hasil ===
  const titleText = isCorrect ? "Correct Answer!" : "Wrong Answer!";
  const titleColor = isCorrect ? "#28a745" : "#dc3545"; // Hijau atau Merah
  const titleWidth = 1.17;
  const titleHeight = 0.14;
  const topPadding = 0.04;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;

  const titleLabel = createTitleLabel(
    titleText,
    titleWidth,
    titleHeight,
    titleColor
  );
  titleLabel.position.set(0, titleY, 0.02);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // === Panel Penjelasan ===
  const explanation = component.quiz[0].explanation;
  const resultMessage = isCorrect
    ? "Well done! "
    : "Try reviewing the explanation!\n\n";
  const messageText = resultMessage + explanation;

  const RESULT_PANEL_HEIGHT = 0.35;
  const RESULT_PANEL_WIDTH = 1.23;

  const messagePanel = createTextPanel(messageText, RESULT_PANEL_WIDTH, {
    fixedHeight: RESULT_PANEL_HEIGHT,
    baseFontSize: 22,
  });

  const messagePanelY =
    titleY - titleHeight / 2 - RESULT_PANEL_HEIGHT / 2 - 0.05;
  messagePanel.position.set(0, messagePanelY, 0.01);
  messagePanel.renderOrder = 1;
  viewerUIGroup.add(messagePanel);

  // === Tombol Continue / Try Again ===
  const navButtonWidth = 0.7;
  const navButtonHeight = 0.12;
  const navY = -panelHeight / 2 + navButtonHeight / 2 + 0.08;

  const buttonText = isCorrect ? "Continue" : "Try Again";
  const continueButton = createButton(
    buttonText,
    "continue_after_mini_quiz",
    navButtonWidth,
    navButtonHeight,
    BTN_COLOR_PRIMARY
  );
  continueButton.position.set(0, navY, 0.01);
  continueButton.renderOrder = 1;
  viewerUIGroup.add(continueButton);
  navButtons.push(continueButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk layar pertanyaan kuis akhir.
 */
export function createQuizScreen(currentQuestion, questionIndex) {
  clearUI();

  // Posisi konsisten dengan Main Menu
  const uiBasePosition = new THREE.Vector3(0, 1.2, -1);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 1.5);

  // === Panel Utama (Ukuran standar Main Menu) ===
  const panelWidth = 1.4;
  const panelHeight = 0.8;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.05);
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);

  // === Judul ===
  const titleWidth = 1.17;
  const titleHeight = 0.14;
  const topPadding = 0.0;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;
  const titleText = `Final Test (${questionIndex + 1}/${quizData.length})`;
  const titleLabel = createTitleLabel(titleText, titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // === Panel Pertanyaan (dengan pilihan jawaban) ===
  const questionText = currentQuestion.question;
  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => `${String.fromCharCode(65 + index)}. ${answer}`)
    .join("\n");
  const fullQuizText = `${questionText}\n\n${answerChoicesText}`;

  const QUIZ_TEXT_PANEL_HEIGHT = 0.42;
  const QUIZ_TEXT_PANEL_WIDTH = 1.23;

  const quizTextPanel = createTextPanel(fullQuizText, QUIZ_TEXT_PANEL_WIDTH, {
    fixedHeight: QUIZ_TEXT_PANEL_HEIGHT,
    baseFontSize: 22, // Diperkecil untuk panel kecil
  });

  const textPanelY =
    titleY - titleHeight / 2 - QUIZ_TEXT_PANEL_HEIGHT / 2 - 0.05;
  quizTextPanel.position.set(0, textPanelY, 0.01);
  quizTextPanel.renderOrder = 1;
  viewerUIGroup.add(quizTextPanel);

  // === Tombol Pilihan (A, B, C, D) ===
  const choiceButtonWidth = 0.13;
  const choiceButtonHeight = 0.11;
  const choiceGapX = 0.05;
  const totalButtonsWidth =
    currentQuestion.answers.length * choiceButtonWidth +
    (currentQuestion.answers.length - 1) * choiceGapX;
  const choiceStartX = -totalButtonsWidth / 2 + choiceButtonWidth / 2;
  const choiceButtonY = -panelHeight / 2 + choiceButtonHeight / 2 + 0.08;

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
    button.position.set(buttonX, choiceButtonY, 0.02);
    button.renderOrder = 1;
    viewerUIGroup.add(button);
  });

  // === Tombol Close (X) - Di atas panel (optional, untuk keluar cepat) ===
  const actionButtonSize = 0.09;
  const topOffset = 0.08;
  const edgePaddingFromRight = 0.055;
  const buttonsY = panelHeight / 2 + actionButtonSize / 2 + topOffset;

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk layar hasil kuis akhir (per pertanyaan).
 */
export function createQuizResultScreen(
  isCorrect,
  currentQuestion,
  questionIndex,
  totalQuestions
) {
  clearUI();

  // Posisi konsisten dengan Main Menu
  const uiBasePosition = new THREE.Vector3(0, 1.2, -1);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 1.5);

  // === Panel Utama ===
  const panelWidth = 1.4;
  const panelHeight = 0.8;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.05);
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);

  // === Judul Hasil ===
  const titleText = isCorrect
    ? "Excellent, that's correct!"
    : "Not quite. Here's the review";
  const titleColor = isCorrect ? "#28a745" : "#FFC107"; // Hijau atau Kuning
  const titleWidth = 1.17;
  const titleHeight = 0.1;
  const topPadding = 0.0;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;

  const titleLabel = createTitleLabel(
    titleText,
    titleWidth,
    titleHeight,
    titleColor
  );
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // === Panel Review Jawaban ===
  const questionText = `Question:\n${currentQuestion.question}\n\n`;
  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => {
      const prefix = `${String.fromCharCode(65 + index)}. ${answer}`;
      if (index === currentQuestion.correctAnswerIndex) {
        return `${prefix} ← Correct Answer`;
      }
      return prefix;
    })
    .join("\n");
  const fullResultText = questionText + answerChoicesText;

  const RESULT_TEXT_PANEL_HEIGHT = 0.42;
  const RESULT_TEXT_PANEL_WIDTH = 1.23;

  const resultTextPanel = createTextPanel(
    fullResultText,
    RESULT_TEXT_PANEL_WIDTH,
    {
      fixedHeight: RESULT_TEXT_PANEL_HEIGHT,
      baseFontSize: 20, // Lebih kecil untuk review
    }
  );

  const textPanelY =
    titleY - titleHeight / 2 - RESULT_TEXT_PANEL_HEIGHT / 2 - 0.05;
  resultTextPanel.position.set(0, textPanelY, 0.01);
  resultTextPanel.renderOrder = 1;
  viewerUIGroup.add(resultTextPanel);

  // === Tombol Continue/Results ===
  const continueButtonWidth = 0.6;
  const continueButtonHeight = 0.12;
  const buttonY = -panelHeight / 2 + continueButtonHeight / 2 + 0.08;

  const isLastQuestion = questionIndex >= totalQuestions - 1;
  const buttonText = isLastQuestion ? "View Results" : "Next Question";

  const continueButton = createButton(
    buttonText,
    "next_question",
    continueButtonWidth,
    continueButtonHeight,
    BTN_COLOR_PRIMARY
  );
  continueButton.position.set(0, buttonY, 0.01);
  continueButton.renderOrder = 1;
  viewerUIGroup.add(continueButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman laporan skor akhir.
 */
export function createQuizReportScreen(
  score,
  hasAttempted,
  isPostCompletion = false
) {
  clearUI();

  const uiBasePosition = new THREE.Vector3(0, 1.2, -1);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 1.5);

  const panelWidth = 1.4;
  const panelHeight = 0.8;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.05);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // Judul
  const titleText = hasAttempted
    ? "Your Learning Report"
    : "Report Not Available";
  const titleWidth = 1.17;
  const titleHeight = 0.14;
  const titleLabel = createTitleLabel(titleText, titleWidth, titleHeight);
  const titleY = panelHeight / 2 - titleHeight / 2 - 0.04;
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  if (!hasAttempted) {
    // Tampilan jika belum mengerjakan kuis
    const reportText =
      "You must complete all materials and take the Final Test before viewing your report.";
    const LOCKED_TEXT_HEIGHT = 0.24;
    const LOCKED_TEXT_WIDTH = 1.23;
    const reportBody = createTextPanel(reportText, LOCKED_TEXT_WIDTH, {
      fixedHeight: LOCKED_TEXT_HEIGHT,
    });
    reportBody.position.set(0, 0, 0.02);
    viewerUIGroup.add(reportBody);
  } else {
    // Tampilan jika sudah mengerjakan kuis
    const totalQuestions = quizData.length;
    const finalScore = (score / totalQuestions) * 100;

    const scoreTitleWidth = 0.58;
    const scoreTitleHeight = 0.08;
    const scoreTitle = createSubtitleLabel(
      "Final Score",
      scoreTitleWidth,
      scoreTitleHeight
    );
    scoreTitle.position.set(0, 0.15, 0.02);
    viewerUIGroup.add(scoreTitle);

    const scoreDisplayWidth = 0.29;
    const scoreDisplay = createScoreLabel(
      finalScore.toFixed(0) + "%",
      scoreDisplayWidth
    );
    scoreDisplay.position.set(0, -0.05, 0.01);
    viewerUIGroup.add(scoreDisplay);

    const detailText = `You answered ${score} out of ${totalQuestions} questions correctly.`;
    const reportBodyWidth = 1.23;
    const reportBody = createBodyText(detailText, reportBodyWidth, {
      baseFontSize: 34,
    });
    reportBody.position.set(0, -0.25, 0.02);
    viewerUIGroup.add(reportBody);
  }

  // Tombol Keluar X
  const exitButtonAction = isPostCompletion
    ? "show_post_quiz_choice"
    : "back_to_landing";
  const exitButtonSize = 0.073;
  const padding = 0.044;
  const exitButton = createButton(
    "X",
    exitButtonAction,
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  exitButton.position.set(
    panelWidth / 2 - padding - exitButtonSize / 2,
    panelHeight / 2 - padding - exitButtonSize / 2,
    0.02
  );
  viewerUIGroup.add(exitButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman "Selesai Materi" (sebelum kuis akhir).
 */
export function createCompletionScreen(playerName) {
  clearUI();
  const uiBasePosition = new THREE.Vector3(0, 2, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4);

  const panelWidth = 4.0;
  const panelHeight = 1.8;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // Judul
  let titleText = `Excellent, ${playerName}!`;
  const titleLabel = createTitleLabel(titleText, 3.8, 0.4, "#FFD700"); // Emas
  titleLabel.position.set(0, 0.5, 0.01);
  viewerUIGroup.add(titleLabel);

  // Pesan
  const messageText =
    "You have successfully completed all the learning topics.\nNow it's time to test your knowledge in the Final Test!";
  const messageBody = createBodyText(messageText, 3.5);
  messageBody.position.set(0, 0, 0.01);
  viewerUIGroup.add(messageBody);

  // Tombol ke Kuis
  const quizButton = createButton(
    "Take Final Test",
    "back_to_menu", // Aksi ini membawa ke menu, di mana tombol kuis sudah aktif
    2.5,
    0.3,
    BTN_COLOR_PRIMARY
  );
  quizButton.position.set(0, -0.6, 0.01);
  viewerUIGroup.add(quizButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);

  // Mulai efek confetti
  const confetti = createConfettiEffect();
  return confetti;
}

/**
 * Membuat UI untuk halaman pilihan setelah kuis akhir selesai.
 */
/**
 * Membuat UI untuk halaman pilihan setelah kuis akhir selesai.
 */
export function createPostQuizChoiceScreen() {
  clearUI();
  // Posisi UI di dunia (sesuai Mode Selection & Landing)
  const uiBasePosition = new THREE.Vector3(0, 1.2, -1);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 1.5);

  // Panel utama (ukuran baru)
  const panelWidth = 1.4;
  const panelHeight = 0.8;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.05);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // --- PENYESUAIAN SKALA & POSISI ---

  // Title (Menggunakan ukuran & padding standar dari Mode Selection/Landing)
  const titleWidth = 1.17; // Standar lebar judul
  const titleHeight = 0.14; // Standar tinggi judul
  const topPadding = 0.04; // Standar padding atas
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding; // Kalkulasi Y standar
  // titleY = 0.8 / 2 - 0.14 / 2 - 0.04 = 0.4 - 0.07 - 0.04 = 0.29

  const titleLabel = createTitleLabel(
    "Session Complete",
    titleWidth,
    titleHeight
  );
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  // const buttonWidth = 0.7;
  // const buttonHeight = 0.15;
  // const spacing = 0.18;
  // const startY = -0.02;
  // Buttons (Ukuran dan posisi disesuaikan agar center di bawah judul)
  const buttonWidth = 1.23; // Lebar konsisten (seperti panel teks di Quick Guide)
  const buttonHeight = 0.15; // Tinggi konsisten (seperti Landing Page)
  const spacing = 0.18; // Jarak vertikal standar antar tombol

  // Kalkulasi posisi Y agar tombol center di area bawah judul
  const spaceBelowTitle = titleY - titleHeight / 2; // = 0.29 - 0.07 = 0.22
  const spaceAboveBottom = -panelHeight / 2; // = -0.4
  const availableHeight = spaceBelowTitle - spaceAboveBottom; // = 0.22 - (-0.4) = 0.62
  const buttonGroupCenterY = spaceAboveBottom + availableHeight / 2; // = -0.4 + 0.62 / 2 = -0.4 + 0.31 = -0.09

  const learnAgainButtonY = buttonGroupCenterY + spacing / 2; // = -0.09 + 0.16 / 2 = -0.01
  const mainMenuButtonY = buttonGroupCenterY - spacing / 2; // = -0.09 - 0.16 / 2 = -0.17

  const learnAgainButton = createButton(
    "Repeat Lesson",
    "back_to_menu",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  learnAgainButton.position.set(0, learnAgainButtonY, 0.01);
  viewerUIGroup.add(learnAgainButton);

  const mainMenuButton = createButton(
    "Back to Menu",
    "back_to_landing",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_SECONDARY
  );
  mainMenuButton.position.set(0, mainMenuButtonY, 0.01);
  viewerUIGroup.add(mainMenuButton);

  // --- AKHIR PENYESUAIAN ---

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman credits (Tentang Aplikasi).
 */
/**
 * Membuat UI untuk halaman credits (Tentang Aplikasi).
 */
export function createCreditsScreen(creditPages, pageIndex) {
  const uiBasePosition = new THREE.Vector3(0, 2, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4);

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
export function clearUI() {
  // Hentikan animasi yang mungkin berjalan
  clearActiveTypingAnimation();
  stopAvatarDropAnimation();
  stopAvatarFlyUpAnimation();

  // Hentikan mixer avatar
  if (avatarMixer) {
    avatarMixer.stopAllAction();
    avatarMixer.uncacheRoot(avatarMixer.getRoot());
    avatarMixer = null;
  }

  // Iterasi dan bersihkan kedua grup UI
  [uiGroup, viewerUIGroup].forEach((group) => {
    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i];
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
  currentAvatar = null;
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
  const uiBasePosition = new THREE.Vector3(0, 1.2, -1);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 1.5);

  clearViewerUI();

  const totalPanelWidth = 1.4;
  const totalPanelHeight = 0.8;

  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0.05
  );
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  // Judul
  const titleWidth = 1.17;
  const titleHeight = 0.14;
  const titleLabel = createTitleLabel("Quick Guide", titleWidth, titleHeight);
  const topPadding = 0.04;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  // Panel Teks Guide
  const DESC_PANEL_WIDTH = 1.23;
  const DESC_PANEL_FIXED_HEIGHT = 0.32;
  const descPanel = createTextPanel(guidePages, DESC_PANEL_WIDTH, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });

  // Set halaman awal
  const initialOffsetY =
    (guidePages.length - 1 - pageIndex) / guidePages.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = pageIndex;
  descPanel.userData.isGuidePanel = true;

  const descPanelYOffset =
    titleY - titleHeight / 2 - descPanel.geometry.parameters.height / 2 - 0.05;
  descPanel.position.set(0, descPanelYOffset, 0.01);
  viewerUIGroup.add(descPanel);

  // Navigasi Halaman Guide
  const descNavY =
    descPanelYOffset - descPanel.geometry.parameters.height / 2 - 0.08;

  if (guidePages.length > 1) {
    const buttonWidth = 0.073;
    const buttonHeight = 0.08;
    const indicatorWidth = 0.15;
    const indicatorHeight = 0.06;
    const padding = 0.029;

    const pageIndicatorText = `${pageIndex + 1}/${guidePages.length}`;
    const pageIndicator = createTitleLabel(
      pageIndicatorText,
      indicatorWidth,
      indicatorHeight
    );
    pageIndicator.position.set(0, descNavY, 0.02);
    viewerUIGroup.add(pageIndicator);

    // Tombol Next
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

    // Tombol Prev
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

  // Tombol Keluar X
  const exitButtonSize = 0.073;
  const exitPadding = 0.044;
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

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
