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
export const FONT = "bold 32px Verdana, Geneva, sans-serif";
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
  speed: 3.5,
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
    // Set posisi awal lebih tinggi untuk efek jatuh
    const dropHeight = 2.5;
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

  // 2. Update animasi idle
  if (avatarMixer) {
    avatarMixer.update(deltaTime);
  }

  // 3. Update animasi hover (mengambang)
  if (
    currentAvatar &&
    currentAvatar.userData.initialY !== undefined &&
    !avatarDropAnimation.isAnimating // Hanya jika tidak sedang jatuh
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
 * Mendapatkan resolusi canvas target berdasarkan mode (VR/Desktop) dan DPR.
 * @returns {number} - Resolusi (mis: 256 atau 480).
 */
export function getResolution() {
  if (isVRMode()) {
    return 256; // Resolusi tetap untuk VR
  } else {
    const baseResolution = 240;
    const dpr = Math.min(window.devicePixelRatio, 2); // Batasi DPR di 2
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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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

  const BASE_FONT_SIZE_PX = 25;
  const vrFontScale = 1.1;
  const dpr = isVRMode() ? 1 : Math.min(window.devicePixelRatio, 2);
  const finalFontSize = Math.round(
    isVRMode() ? BASE_FONT_SIZE_PX * vrFontScale : BASE_FONT_SIZE_PX * dpr
  );
  const lineHeight = Math.round(finalFontSize * 1.2);
  const font = `${finalFontSize}px Verdana, Geneva, sans-serif`;
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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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

  const vrFontScale = 1;
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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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

  const vrFontScale = 1.2;
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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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
    baseFontSize = 25,
    vrFontScale = 1.1,
    lineHeightScale = 1.2,
  } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  const dpr = isVRMode() ? 1 : Math.min(window.devicePixelRatio, 2);

  const finalFontSize = Math.round(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize * dpr
  );
  const lineHeight = Math.round(finalFontSize * lineHeightScale);
  const font = `${finalFontSize}px Verdana, Geneva, sans-serif`;
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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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
  const ctx = canvas.getContext("2d");
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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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
    baseFontSize = 14,
    vrFontScale = 1.5,
    lineHeightScale = 1.2,
  } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  const dpr = isVRMode() ? 1 : Math.min(window.devicePixelRatio, 2);

  const finalFontSize = Math.round(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize * dpr
  );
  const lineHeight = Math.round(finalFontSize * lineHeightScale);
  const font = `${finalFontSize}px Verdana, Geneva, sans-serif`;
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
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 16);

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
  const uiBasePosition = new THREE.Vector3(0, 1.6, -2.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 3.5);

  const panelWidth = 3.2;
  const panelHeight = 1.1;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const titleLabel = createTitleLabel("Choose Experience Mode", 3.0, 0.3);
  titleLabel.position.set(0, 0.35, 0.01);
  viewerUIGroup.add(titleLabel);

  const buttonWidth = 2.3;
  const buttonHeight = 0.28;
  const spacing = 0.34;
  const startY = 0.02;

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

/**
 * Membuat UI untuk halaman sapaan avatar (typing text).
 */
export function createAvatarGreetingPage(playerName, greetingIndex = 0) {
  const uiBasePosition = new THREE.Vector3(0, 1.6, -2.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4.5);
  const panelWidth = 3.2;
  const panelHeight = 1.1;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // Tombol X (Keluar)
  const exitButtonSize = 0.2;
  const exitOffsetX = 0.15;
  const exitOffsetY = 0.15;
  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_PRIMARY,
    "circle"
  );
  exitButton.position.set(
    panelWidth / 2 + exitOffsetX,
    panelHeight / 2 - exitOffsetY,
    0.02
  );
  exitButton.renderOrder = 2;
  viewerUIGroup.add(exitButton);

  const greetingTexts = GREETING_DATA(playerName);
  const currentGreeting = greetingTexts[greetingIndex];
  if (!currentGreeting) return;

  const isLastGreeting = greetingIndex >= greetingTexts.length - 1;

  // Tombol Continue
  const primaryButtonWidth = 2.3;
  const primaryButtonHeight = 0.28;
  const continueButton = createButton(
    isLastGreeting ? "Start Learning" : "Continue",
    null, // Aksi di-set setelah typing selesai
    primaryButtonWidth,
    primaryButtonHeight,
    BTN_COLOR_PRIMARY
  );
  continueButton.position.set(0, -0.28, 0.01);
  continueButton.visible = false; // Sembunyikan dulu
  viewerUIGroup.add(continueButton);

  // Setup Avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    const avatarFinalPosition = new THREE.Vector3(
      -panelWidth / 2 - 0.18,
      panelHeight / 2 - 0.18,
      0.05
    );
    const shouldAnimateDrop = greetingIndex === 0;

    // Callback setelah animasi drop selesai
    const onAvatarReady = () => {
      // 1. Putar audio
      if (window.playCurrentGreetingAudioCallback) {
        window.playCurrentGreetingAudioCallback();
      }
      // 2. Tampilkan typing text
      if (currentGreeting.text) {
        const textWidth = panelWidth * 0.88;
        const welcomeLabel = createTypingText(
          currentGreeting.text,
          textWidth,
          { baseFontSize: 25, vrFontScale: 1.1, lineHeightScale: 1.2 },
          () => {
            // 3. Tampilkan tombol setelah typing selesai
            continueButton.visible = true;
            continueButton.userData.action = isLastGreeting
              ? "continue_to_landing"
              : "next_greeting";
          }
        );
        welcomeLabel.position.set(0, 0.12, 0.01);
        viewerUIGroup.add(welcomeLabel);
      }
    };

    if (shouldAnimateDrop) {
      avatarDropAnimation.onComplete = onAvatarReady;
    }

    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.35, 0.35, 0.35),
      avatarFinalPosition,
      shouldAnimateDrop
    );

    if (!shouldAnimateDrop) {
      onAvatarReady(); // Panggil langsung jika tidak ada animasi drop
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
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  const dpr = isVRMode() ? 1 : Math.min(window.devicePixelRatio, 2);
  const finalFontSize = Math.round(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize * dpr
  );
  const lineHeight = Math.round(finalFontSize * lineHeightScale);
  const font = `bold ${finalFontSize}px Verdana, Geneva, sans-serif`;
  ctx.font = font;

  const padding = 15; // Padding dalam piksel (ditambah untuk spacing vertikal)
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

  // Batasi tinggi sesuai maxHeight, tambahkan padding atas dan bawah
  const finalCanvasHeight = Math.min(
    canvasMaxHeight,
    textHeightNeeded + padding * 2 // Padding atas dan bawah
  );

  canvas.width = canvasMaxWidth;
  canvas.height = finalCanvasHeight;

  // Gambar teks dengan center vertikal
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = color;

  // Hitung posisi Y untuk center vertikal teks di canvas
  const textStartY = (finalCanvasHeight - textHeightNeeded) / 2;

  wrapText(
    ctx,
    text,
    padding,
    textStartY, // Posisi Y center vertikal
    maxTextWidth,
    lineHeight,
    true
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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
/**
 * Membuat UI untuk halaman landing (menu utama).
 */
export function createLandingPage(playerName) {
  const uiBasePosition = new THREE.Vector3(0, 2, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4.5);

  // Panel utama
  const panelWidth = 4.8;
  const panelHeight = 2.0;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // Logo (tetap di kiri atas)
  const logoWidth = 0.24;
  const logoHeight = 0.24;
  const logoPanel = createImagePanel(
    "assets/images/logo-kampus.png",
    logoWidth,
    logoHeight
  );
  const paddingLogo = 0.08;
  logoPanel.position.set(
    -panelWidth / 2 + logoWidth / 2 + paddingLogo,
    panelHeight / 2 - logoHeight / 2 - paddingLogo,
    0.02
  );
  logoPanel.renderOrder = 1;
  viewerUIGroup.add(logoPanel);

  // === TITLE "MENU" (atas tengah) ===
  const titleWidth = 4.0;
  const titleHeight = 0.35;
  const topPadding = 0.1;
  const titleY = 0.8;

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
    const titleMaxWidth = 2.0;
    const titleMaxHeight = 1.0;
    const titlePaddingLeft = 0.3;

    const welcomeLabel = createWrappingTitleLabel(
      welcomeText,
      titleMaxWidth,
      titleMaxHeight,
      28,
      1.1,
      1.2,
      TEXT_COLOR
    );

    // Posisi X: kiri panel dengan padding
    const welcomeTextX = -panelWidth / 2 + titlePaddingLeft + titleMaxWidth / 2;
    // Posisi Y: center dalam area konten
    const welcomeTextY = contentCenterY;

    welcomeLabel.position.set(welcomeTextX, welcomeTextY, 0.01);
    viewerUIGroup.add(welcomeLabel);
  }

  // Tombol-tombol (kanan, center dalam area konten)
  const buttonWidth = 2.0;
  const buttonHeight = 0.28;
  const buttonSpacingY = 0.36;
  const buttonPaddingRight = 0.3;
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
  // Button center Y sama dengan welcome text Y
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

  // Tombol Credits (i) - tetap di kanan bawah
  const creditButtonSize = 0.15;
  const creditButton = createButton(
    "i",
    "show_credits",
    creditButtonSize,
    creditButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  const padding = 0.15;
  creditButton.position.set(
    panelWidth / 2 - padding,
    -panelHeight / 2 + padding,
    0.02
  );
  creditButton.renderOrder = 1;
  viewerUIGroup.add(creditButton);

  // Avatar (kiri atas, dekat logo)
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.4, 0.4, 0.4),
      new THREE.Vector3(-panelWidth / 2 - 0.2, panelHeight / 2 - 0.2, 0.05)
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman menu pemilihan topik (grid melengkung).
 */
export function createMenuPage(allComponentsUnlocked, quizHasBeenAttempted) {
  const uiBasePosition = new THREE.Vector3(0, 1.7, -2.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);
  const localCenterY = 0;
  const localLookAtTarget = new THREE.Vector3(0, localCenterY, 5);

  // Pengaturan Grid Melengkung
  const radius = 3.5;
  const angleSpan = Math.PI * 0.8;
  const itemsPerRow = 4;
  const rowHeight = 0.5;
  const startAngle = -angleSpan / 2;
  const angleStep = angleSpan / (itemsPerRow - 1);

  // Judul
  const titleY = localCenterY + 0.8;
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
export function createViewerPage(
  component,
  index,
  descriptionIndex = 0,
  highestComponentUnlocked = 0,
  hasAttemptedQuiz = false
) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  clearViewerUI();
  navButtons = []; // Reset array tombol navigasi

  const totalPanelWidth = 4;
  const totalPanelHeight = 2.3;
  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0.05,
    "#000000ff",
    0.7
  );
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  // Judul
  const titleWidth = 2.8;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel(component.label, titleWidth, titleHeight);
  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  titleLabel.position.set(0, titleY, 0.02);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // Panel Deskripsi
  const DESC_PANEL_FIXED_HEIGHT = 1.2;
  const descPanel = createTextPanel(component.description, 3.5, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });
  // Set halaman awal
  const initialOffsetY =
    (component.description.length - 1 - descriptionIndex) /
    component.description.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = descriptionIndex;

  const panelHeight = descPanel.geometry.parameters.height;
  const panelWidth = descPanel.geometry.parameters.width;
  const descPanelYOffset = titleY - titleHeight / 2 - panelHeight / 2 - 0.05;
  descPanel.position.set(0, descPanelYOffset, 0.01);
  descPanel.renderOrder = 1;
  viewerUIGroup.add(descPanel);

  // Navigasi Deskripsi (Page Indicator, Prev, Next)
  const descNavY = descPanelYOffset - panelHeight / 2 - 0.15;
  if (component.description.length > 1) {
    const rightEdgeX = panelWidth / 1.85;
    const buttonWidth = 0.25;
    const indicatorWidth = 0.5;
    const padding = 0.1;
    let currentX = rightEdgeX;

    const isLastPage = descriptionIndex >= component.description.length - 1;
    const nextDescButton = createButton(
      ">",
      isLastPage ? "locked" : "next_description",
      buttonWidth,
      0.2,
      isLastPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isLastPage) {
      nextDescButton.userData.colors = null;
      nextDescButton.userData.currentState = "disabled";
    }
    const nextButtonX = currentX - buttonWidth / 2;
    nextDescButton.position.set(nextButtonX, descNavY, 0.01);
    nextDescButton.renderOrder = 1;
    viewerUIGroup.add(nextDescButton);
    navButtons.push(nextDescButton);

    currentX = nextButtonX - buttonWidth / 2 - padding;

    const pageIndicatorText = `${descriptionIndex + 1} / ${
      component.description.length
    }`;
    const pageIndicator = createTitleLabel(
      pageIndicatorText,
      indicatorWidth,
      0.15
    );
    pageIndicator.material.depthWrite = false;
    const indicatorX = currentX - indicatorWidth / 2;
    pageIndicator.position.set(indicatorX, descNavY, 0.02);
    pageIndicator.renderOrder = 2;
    viewerUIGroup.add(pageIndicator);
    currentX = indicatorX - indicatorWidth / 2 - padding;

    const isFirstPage = descriptionIndex <= 0;
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_description",
      buttonWidth,
      0.2,
      isFirstPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isFirstPage) {
      prevDescButton.userData.colors = null;
      prevDescButton.userData.currentState = "disabled";
    }
    const prevButtonX = currentX - buttonWidth / 2;
    prevDescButton.position.set(prevButtonX, descNavY, 0.01);
    prevDescButton.renderOrder = 1;
    viewerUIGroup.add(prevDescButton);
    navButtons.push(prevDescButton);
  }

  // Navigasi Komponen (Back, Next)
  const navButtonWidth = 1.2;
  const navButtonHeight = 0.25;
  const navY = -totalPanelHeight / 2 + navButtonHeight / 2 + 0.05;
  const navZ = 0.01;

  if (index > 0) {
    const prevButton = createButton(
      "< Back",
      "prev_component",
      navButtonWidth,
      navButtonHeight
    );
    prevButton.position.set(
      -(totalPanelWidth / 2) + navButtonWidth / 2 + 0.1,
      navY,
      navZ
    );
    prevButton.renderOrder = 1;
    viewerUIGroup.add(prevButton);
    navButtons.push(prevButton);
  }

  const isLastComponent = index >= components.length - 1;
  const allMaterialsUnlocked = highestComponentUnlocked >= components.length;
  const shouldShowNextButton =
    !isLastComponent || (!allMaterialsUnlocked && !hasAttemptedQuiz);

  if (shouldShowNextButton) {
    const nextButton = createButton(
      "Next >",
      "next_component",
      navButtonWidth,
      navButtonHeight
    );
    nextButton.position.set(
      totalPanelWidth / 2 - navButtonWidth / 2 - 0.1,
      navY,
      navZ
    );
    nextButton.renderOrder = 1;
    viewerUIGroup.add(nextButton);
    navButtons.push(nextButton);
  }

  // Tombol Aksi Samping (Menu, Audio)
  const actionButtonSize = 0.25;
  const buttonSpacing = 0.1;
  const actionX = totalPanelWidth / 2 + actionButtonSize / 2 + 0.15;

  const menuButton = createButton(
    "X",
    "back_to_menu",
    actionButtonSize,
    actionButtonSize,
    BTN_COLOR_PRIMARY,
    "circle"
  );
  const menuY = totalPanelHeight / 2 - actionButtonSize / 2;
  menuButton.position.set(actionX, menuY, 0.01);
  menuButton.renderOrder = 1;
  viewerUIGroup.add(menuButton);
  navButtons.push(menuButton);

  const audioButton = createButton(
    "🔊",
    "play_audio",
    actionButtonSize,
    actionButtonSize,
    BTN_COLOR_PRIMARY,
    "circle"
  );
  const audioY = menuY - actionButtonSize - buttonSpacing;
  audioButton.position.set(actionX, audioY, 0.01);
  audioButton.renderOrder = 1;
  viewerUIGroup.add(audioButton);
  navButtons.push(audioButton);

  // Avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.4, 0.4, 0.4),
      new THREE.Vector3(
        -totalPanelWidth / 2 - 0.1,
        totalPanelHeight / 2 - 0.1,
        0.05
      )
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman bantuan (placeholder).
 */
export function createHelpPanel() {
  const helpLabel = createTitleLabel("Bantuan", 3, 0.5);
  helpLabel.position.set(0, 2.2, 0);
  uiGroup.add(helpLabel);

  const helpText = "Deskripsi bantuan";
  const helpPanel = createTextPanel(helpText, 4);
  const panelHeight = helpPanel.geometry.parameters.height;
  helpPanel.position.set(0, 1.6, 0);
  uiGroup.add(helpPanel);

  const closeButton = createButton("Tutup", "close_help", 1, 0.4);
  const closeButtonY = 1.6 - panelHeight / 2 - 0.4 / 2 - 0.2;
  closeButton.position.set(0, closeButtonY, 0);
  uiGroup.add(closeButton);
}

/**
 * Membuat UI untuk halaman kuis mini (per komponen).
 */
export function createMiniQuizPage(component) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const totalPanelWidth = 4;
  const totalPanelHeight = 2.3;
  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0.05,
    "#000000ff",
    0.7
  );
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  // Judul
  const titleWidth = 2.8;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel("Mini Quiz", titleWidth, titleHeight);
  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  titleLabel.position.set(0, titleY, 0.02);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // Panel Pertanyaan
  const currentQuestion = component.quiz[0];
  const QUESTION_PANEL_FIXED_HEIGHT = 1.2;
  const questionPanel = createTextPanel(currentQuestion.question, 2.8, {
    fixedHeight: QUESTION_PANEL_FIXED_HEIGHT,
  });
  const panelHeight = questionPanel.geometry.parameters.height;
  const descPanelYOffset = titleY - titleHeight / 2 - panelHeight / 2 - 0.05;
  questionPanel.position.set(0, descPanelYOffset, 0.01);
  questionPanel.renderOrder = 1;
  viewerUIGroup.add(questionPanel);

  // Tombol Jawaban (True/False)
  const buttonWidth = 1.2;
  const buttonHeight = 0.25;
  const buttonY = descPanelYOffset - panelHeight / 2 - 0.2;
  const buttonZ = 0.01;
  const positions = [-0.8, 0.8]; // Posisi X untuk dua tombol

  currentQuestion.answers.forEach((answer, index) => {
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "mini_quiz_correct" : "mini_quiz_incorrect";
    const colors = [BTN_COLOR_PRIMARY, BTN_COLOR_SECONDARY];
    const buttonColor = colors[index] || BTN_COLOR_PRIMARY;

    const button = createButton(
      answer,
      action,
      buttonWidth,
      buttonHeight,
      buttonColor
    );
    button.position.set(positions[index], buttonY, buttonZ);
    button.renderOrder = 1;
    viewerUIGroup.add(button);
  });

  // Avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.4, 0.4, 0.4),
      new THREE.Vector3(
        -totalPanelWidth / 2 - 0.1,
        totalPanelHeight / 2 - 0.1,
        0.05
      )
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman hasil kuis mini.
 */
export function createMiniQuizResultPage(component, isCorrect) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const totalPanelWidth = 4;
  const totalPanelHeight = 2.3;
  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0.05,
    BG_COLOR,
    0.7
  );
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  // Judul Hasil
  const titleText = isCorrect ? "Correct Answer!" : "Wrong Answer!";
  const titleColor = isCorrect ? "#28a745" : "#dc3545"; // Hijau atau Merah
  const titleWidth = 2.8;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel(
    titleText,
    titleWidth,
    titleHeight,
    titleColor
  );
  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  titleLabel.position.set(0, titleY, 0.02);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // Panel Penjelasan
  const explanation = component.quiz[0].explanation;
  const resultMessage = isCorrect
    ? "Well done!"
    : "Try reviewing the explanation!";
  const messageText = `${resultMessage}\n\n${explanation}`;
  const RESULT_PANEL_FIXED_HEIGHT = 1.2;
  const messagePanel = createTextPanel(messageText, 2.8, {
    fixedHeight: RESULT_PANEL_FIXED_HEIGHT,
  });
  const panelHeight = messagePanel.geometry.parameters.height;
  const descPanelYOffset = titleY - titleHeight / 2 - panelHeight / 2 - 0.05;
  messagePanel.position.set(0, descPanelYOffset, 0.01);
  messagePanel.renderOrder = 1;
  viewerUIGroup.add(messagePanel);

  // Tombol Lanjut/Coba Lagi
  const navButtonWidth = 2.0;
  const navButtonHeight = 0.25;
  const navY = -totalPanelHeight / 2 + navButtonHeight / 2 + 0.1;
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

  // Avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.4, 0.4, 0.4),
      new THREE.Vector3(
        -totalPanelWidth / 2 - 0.1,
        totalPanelHeight / 2 - 0.1,
        0.05
      )
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk layar pertanyaan kuis akhir.
 */
export function createQuizScreen(currentQuestion, questionIndex) {
  clearUI();
  const uiBasePosition = new THREE.Vector3(0, 2, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4);

  const totalPanelWidth = 4.8;
  const totalPanelHeight = 2.4;
  const mainPanel = createUIPanel(totalPanelWidth, totalPanelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);

  // Judul Kuis
  const titleHeight = 0.3;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - 0.1;
  const titleText = `Final Test (Question ${questionIndex + 1}/${
    quizData.length
  })`;
  const titleLabel = createTitleLabel(titleText, 3.8, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // Panel Pertanyaan & Jawaban
  const questionText = currentQuestion.question;
  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => `${String.fromCharCode(65 + index)}. ${answer}`)
    .join("\n");
  const fullQuizText = `${questionText}\n\n${answerChoicesText}`;

  const QUIZ_TEXT_PANEL_HEIGHT = 1.6;
  const quizTextPanel = createTextPanel(fullQuizText, 4.2, {
    fixedHeight: QUIZ_TEXT_PANEL_HEIGHT,
  });
  const textPanelY =
    titleY - titleHeight / 2 - QUIZ_TEXT_PANEL_HEIGHT / 2 - 0.1;
  quizTextPanel.position.set(0, textPanelY, 0.01);
  quizTextPanel.renderOrder = 1;
  viewerUIGroup.add(quizTextPanel);

  // Tombol Pilihan Ganda (A, B, C, D)
  const choiceButtonWidth = 0.6;
  const choiceButtonHeight = 0.3;
  const choiceGapX = 0.2;
  const totalButtonsWidth =
    currentQuestion.answers.length * choiceButtonWidth +
    (currentQuestion.answers.length - 1) * choiceGapX;
  const choiceStartX = -totalButtonsWidth / 2 + choiceButtonWidth / 2;
  const choiceButtonY = -totalPanelHeight / 2 + choiceButtonHeight / 2 + 0.15;

  currentQuestion.answers.forEach((_, i) => {
    const isCorrect = i === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "answer_correct" : "answer_incorrect";
    const buttonLabel = String.fromCharCode(65 + i);

    const button = createButton(
      buttonLabel,
      action,
      choiceButtonWidth,
      choiceButtonHeight
    );
    const buttonX = choiceStartX + i * (choiceButtonWidth + choiceGapX);
    button.position.set(buttonX, choiceButtonY, 0.02);
    button.renderOrder = 1;
    viewerUIGroup.add(button);
  });

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
  const uiBasePosition = new THREE.Vector3(0, 2, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4);

  const totalPanelWidth = 4.8;
  const totalPanelHeight = 2.4;
  const mainPanel = createUIPanel(totalPanelWidth, totalPanelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);

  // Judul Hasil
  const titleHeight = 0.35;
  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  const titleText = isCorrect
    ? "Excellent, that's correct!"
    : "Not quite. Here's the review:";
  const titleColor = isCorrect ? "#28a745" : "#FFC107"; // Hijau atau Kuning
  const titleLabel = createTitleLabel(titleText, 4.0, titleHeight, titleColor);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // Panel Review Jawaban
  const questionText = `Question:\n${currentQuestion.question}`;
  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => {
      const prefix = `${String.fromCharCode(65 + index)}. ${answer}`;
      if (index === currentQuestion.correctAnswerIndex) {
        return `${prefix}  <-- Correct Answer`; // Tandai jawaban benar
      }
      return prefix;
    })
    .join("\n");
  const fullResultText = `${questionText}\n\n${answerChoicesText}`;

  const RESULT_TEXT_PANEL_HEIGHT = 1.5;
  const resultTextPanel = createTextPanel(fullResultText, 4.2, {
    fixedHeight: RESULT_TEXT_PANEL_HEIGHT,
  });
  const textPanelY =
    titleY - titleHeight / 2 - RESULT_TEXT_PANEL_HEIGHT / 2 - 0.1;
  resultTextPanel.position.set(0, textPanelY, 0.01);
  resultTextPanel.renderOrder = 1;
  viewerUIGroup.add(resultTextPanel);

  // Tombol Lanjut
  const continueButtonWidth = 1.2;
  const continueButtonHeight = 0.25;
  const padding = 0.15;
  const buttonY = -totalPanelHeight / 2 + continueButtonHeight / 2 + padding;
  const buttonX = totalPanelWidth / 2 - continueButtonWidth / 2 - padding;
  const isLastQuestion = questionIndex >= totalQuestions - 1;
  const buttonText = isLastQuestion ? "Results >" : "Next >";

  const continueButton = createButton(
    buttonText,
    "next_question",
    continueButtonWidth,
    continueButtonHeight,
    BTN_COLOR_PRIMARY
  );
  continueButton.position.set(buttonX, buttonY, 0.01);
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
  const uiBasePosition = new THREE.Vector3(0, 2, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4);

  const panelWidth = 4.8;
  const panelHeight = 2.0;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // Judul
  const titleText = hasAttempted
    ? "Your Learning Report"
    : "Report Not Available";
  const titleLabel = createTitleLabel(titleText, 4.0, 0.35);
  titleLabel.position.set(0, 0.8, 0.01);
  viewerUIGroup.add(titleLabel);

  if (!hasAttempted) {
    // Tampilan jika belum mengerjakan kuis
    const reportText =
      "You must complete all materials and take the Final Test before viewing your report.";
    const LOCKED_TEXT_HEIGHT = 0.6;
    const reportBody = createTextPanel(reportText, 4.2, {
      fixedHeight: LOCKED_TEXT_HEIGHT,
    });
    reportBody.position.set(0, 0, 0.02);
    viewerUIGroup.add(reportBody);
  } else {
    // Tampilan jika sudah mengerjakan kuis
    const totalQuestions = quizData.length;
    const finalScore = (score / totalQuestions) * 100;

    const scoreTitle = createSubtitleLabel("Final Score", 2.0, 0.2);
    scoreTitle.position.set(0, 0.4, 0.02);
    viewerUIGroup.add(scoreTitle);

    const scoreDisplay = createScoreLabel(`${finalScore.toFixed(0)}%`, 1.0);
    scoreDisplay.position.set(0, -0.1, 0.01);
    viewerUIGroup.add(scoreDisplay);

    const detailText = `You answered ${score} out of ${totalQuestions} questions correctly.`;
    const reportBody = createBodyText(detailText, 4.2);
    reportBody.position.set(0, -0.6, 0.02);
    viewerUIGroup.add(reportBody);
  }

  // Tombol Keluar (X)
  const exitButtonAction = isPostCompletion
    ? "show_post_quiz_choice"
    : "back_to_landing";
  const exitButtonSize = 0.25;
  const padding = 0.15;
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

  // Avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.4, 0.4, 0.4),
      new THREE.Vector3(-panelWidth / 2 - 0.2, panelHeight / 2 - 0.2, 0.05)
    );
  }

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
    "Go to Final Test",
    "back_to_menu", // Aksi ini membawa ke menu, di mana tombol kuis sudah aktif
    3.0,
    0.3,
    BTN_COLOR_PRIMARY
  );
  quizButton.position.set(0, -0.6, 0.01);
  viewerUIGroup.add(quizButton);

  // Avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.5, 0.5, 0.5),
      new THREE.Vector3(-panelWidth / 2 - 0.5, panelHeight / 2 - 0.2, 0.1)
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);

  // Mulai efek confetti
  const confetti = createConfettiEffect();
  return confetti;
}

/**
 * Membuat UI untuk halaman pilihan setelah kuis akhir selesai.
 */
export function createPostQuizChoiceScreen() {
  clearUI();
  const uiBasePosition = new THREE.Vector3(0, 2, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4);

  const panelWidth = 4.0;
  const panelHeight = 1.4;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // Judul
  const titleLabel = createTitleLabel("Learning Session Complete", 3.5, 0.3);
  titleLabel.position.set(0, 0.45, 0.01);
  viewerUIGroup.add(titleLabel);

  // Tombol
  const buttonWidth = 3.2;
  const buttonHeight = 0.32;
  const learnAgainButton = createButton(
    "Learn Again",
    "back_to_menu",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  learnAgainButton.position.set(0, 0.04, 0.01);
  viewerUIGroup.add(learnAgainButton);

  const mainMenuButton = createButton(
    "Back to Main Menu",
    "back_to_landing",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_SECONDARY
  );
  mainMenuButton.position.set(0, -0.38, 0.01);
  viewerUIGroup.add(mainMenuButton);

  // Avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.4, 0.4, 0.4),
      new THREE.Vector3(-panelWidth / 2 - 0.2, panelHeight / 2 - 0.2, 0.05)
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

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
  descPanel.userData.isCreditsPanel = true; // Tandai sebagai panel credits

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

    const pageIndicatorText = `${pageIndex + 1} / ${creditPages.length}`;
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
    const isFirstPage = pageIndex <= 0;
    const prevButtonX = -(indicatorWidth / 2 + padding + buttonWidth / 2);
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

  // Tombol Keluar (X)
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
  const context = canvas.getContext("2d");
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
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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
  const uiBasePosition = new THREE.Vector3(0, 2, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 4);

  clearViewerUI();

  const totalPanelWidth = 4.8;
  const totalPanelHeight = 2.0;

  const backgroundPanel = createUIPanel(totalPanelWidth, totalPanelHeight, 0.1);
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  // Judul
  const titleWidth = 4.0;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel("Quick Guide", titleWidth, titleHeight);
  const topPadding = 0.1;
  const titleY = 0.8;
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  // Panel Teks Guide
  const DESC_PANEL_FIXED_HEIGHT = 0.8;
  const descPanel = createTextPanel(guidePages, 4.2, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });

  // Set halaman awal
  const initialOffsetY =
    (guidePages.length - 1 - pageIndex) / guidePages.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = pageIndex;
  descPanel.userData.isGuidePanel = true; // Tandai sebagai panel guide

  const descPanelYOffset =
    titleY - titleHeight / 2 - descPanel.geometry.parameters.height / 2 - 0.1;
  descPanel.position.set(0, descPanelYOffset, 0.01);
  viewerUIGroup.add(descPanel);

  // Navigasi Halaman Guide
  const descNavY =
    descPanelYOffset - descPanel.geometry.parameters.height / 2 - 0.15;

  if (guidePages.length > 1) {
    const buttonWidth = 0.25;
    const indicatorWidth = 0.5;
    const padding = 0.1;

    const pageIndicatorText = `${pageIndex + 1}/${guidePages.length}`;
    const pageIndicator = createTitleLabel(
      pageIndicatorText,
      indicatorWidth,
      0.15
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
      isFirstPage ? "locked" : "prev_guide",
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
