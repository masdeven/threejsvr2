import * as THREE from "three";
import { scene, camera, renderer } from "./scene-setup.js";
import { components } from "./component-data.js";
import { isVRMode } from "./vr-manager.js";
import { quizData } from "./quiz-data.js";
import { loader } from "./model-loader.js";
import { TextureLoader } from "three";

export const FONT = "bold 32px Arial, sans-serif";
export const LOGICAL_RESOLUTION = 1024;
const logicalBaseFontSize = 14;
const BG_COLOR = "#00000002";

const BTN_COLOR_PRIMARY = "#5579bf88";
const BTN_COLOR_SECONDARY = "#4b4b4b8a";
const BTN_COLOR_HOVER = "#2727278a";
const TEXT_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#3182CE";

const UI_DISTANCE = 2.5;
const VIEWER_UI_POSITION = new THREE.Vector3(0.015, 1.2107, -0.982);
const VIEWER_UI_LOOKAT = new THREE.Vector3(0.015, 1.2107, 0);

export const uiGroup = new THREE.Group();
scene.add(uiGroup);
export const viewerUIGroup = new THREE.Group();
scene.add(viewerUIGroup);
export const debugGroup = new THREE.Group();
scene.add(debugGroup);

const textureLoader = new TextureLoader();

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
  speed: 8,
  onComplete: null,
};

let activeTypingAnimation = null;

export let navButtons = [];

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
    text: "Oh, and don't forget! You can spin the 3D models around by hand to check out all the details.",
    audioFile: "assets/audio/narration/greeting/greeting_5.ogg",
  },
  {
    text: "Happy learning, and hope you have fun!",
    audioFile: "assets/audio/narration/greeting/greeting_6.ogg",
  },
];

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
        avatarModel = gltf;
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
    const dropHeight = 3;
    model.position.y = position.y + dropHeight;
    avatarDropAnimation.isAnimating = true;
    avatarDropAnimation.startY = model.position.y;
    avatarDropAnimation.targetY = position.y;
    avatarDropAnimation.currentY = model.position.y;
  }

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
    avatarDropAnimation.onComplete = null;
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

  avatarDropAnimation.currentY = THREE.MathUtils.lerp(
    currentY,
    targetY,
    speed * deltaTime
  );
  currentAvatar.position.y = avatarDropAnimation.currentY;

  if (Math.abs(currentY - targetY) < 0.001) {
    currentAvatar.position.y = targetY;
    avatarDropAnimation.isAnimating = false;
    currentAvatar.userData.hoverStartTime = -1;
    if (avatarDropAnimation.onComplete) {
      avatarDropAnimation.onComplete();
      avatarDropAnimation.onComplete = null;
    }
  }
}

/**
 * Mengupdate animasi terbang ke atas avatar (dipanggil di render loop).
 * @param {number} deltaTime - Waktu delta.
 */
export function updateAvatarFlyUpAnimation(deltaTime) {
  if (!avatarFlyUpAnimation.isAnimating || !currentAvatar) return;

  const currentY = avatarFlyUpAnimation.currentY;
  const targetY = avatarFlyUpAnimation.targetY;
  const speed = avatarFlyUpAnimation.speed;

  avatarFlyUpAnimation.currentY = THREE.MathUtils.lerp(
    currentY,
    targetY,
    speed * deltaTime
  );
  currentAvatar.position.y = avatarFlyUpAnimation.currentY;

  if (Math.abs(currentY - targetY) < 0.001) {
    currentAvatar.position.y = targetY;
    avatarFlyUpAnimation.isAnimating = false;
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
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  currentAvatar.userData.hoverStartTime = -1;
  const flyUpHeight = 2;
  const startY = currentAvatar.position.y;
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
    avatarFlyUpAnimation.onComplete = null;
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
  updateAvatarDropAnimation(deltaTime);
  updateAvatarFlyUpAnimation(deltaTime);

  if (avatarMixer) {
    avatarMixer.update(deltaTime);
  }

  if (
    currentAvatar &&
    currentAvatar.userData.initialY !== undefined &&
    !avatarDropAnimation.isAnimating &&
    !avatarFlyUpAnimation.isAnimating
  ) {
    if (currentAvatar.userData.hoverStartTime === -1) {
      currentAvatar.userData.hoverStartTime = elapsedTime;
    }

    const hoverTime = elapsedTime - currentAvatar.userData.hoverStartTime;
    const hoverAmplitude = 0.04;
    const hoverSpeed = 1.5;

    currentAvatar.position.y =
      currentAvatar.userData.initialY +
      Math.sin(hoverTime * hoverSpeed) * hoverAmplitude;
  }
}

/**
 * Mendapatkan resolusi canvas target yang tinggi dan konsisten.
 * @returns {number} - Resolusi (mis: 1536).
 */
export function getResolution() {
  if (isVRMode()) {
    return 2048;
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
  const lines = text.split("\n");
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
  mesh.renderOrder = -1;
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
  const padding = 0;

  if (shape === "circle") {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - padding;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    const r = buttonResolution / getResolution();
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
  const padding = 0;

  const r = buttonResolution / getResolution();
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

  ctx.fillStyle = TEXT_COLOR;
  const vrFontScale = 1;
  const resolution = getResolution();
  const fontStyle = FONT.split(" ")[0];
  let baseFontSize = height * resolution * 0.5;
  const finalFontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  ctx.font = `${fontStyle} ${finalFontSize}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const logicalTextPadding = 8;
  const textPadding =
    logicalTextPadding * (buttonResolution / LOGICAL_RESOLUTION);

  const verticalOffset = 0;
  ctx.fillText(text, textPadding, canvas.height / 2 + verticalOffset);

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

  const currentResolution = getResolution();
  const scaleFactor = currentResolution / LOGICAL_RESOLUTION;
  const scaledBaseFontSize = logicalBaseFontSize * scaleFactor;

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

  const screenWidth = window.innerWidth;
  let vrFontScale;
  if (screenWidth <= 768) {
    vrFontScale = 0.8;
  } else {
    vrFontScale = 1;
  }

  const baseFontSize = height * resolution * 0.6;
  const fontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );

  ctx.font = `bold ${fontSize}px Arial, Geneva, sans-serif`;
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
function createSubtitleLabel(text, width, height, color = "#E2E8F0") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRendering = "optimizeLegibility";

  const resolution = getResolution();
  canvas.width = Math.max(1, Math.floor(width * resolution));
  canvas.height = Math.max(1, Math.floor(height * resolution));

  const screenWidth = window.innerWidth;
  let vrFontScale;
  if (screenWidth <= 768) {
    vrFontScale = 0.8;
  } else {
    vrFontScale = 1;
  }

  const baseFontSize = height * resolution * 0.7;
  const fontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );

  ctx.font = `bold ${fontSize}px Arial, Geneva, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
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
    willReadFrequently: false,
  });

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRendering = "optimizeLegibility";
  const resolution = getResolution();

  const currentResolution = getResolution();
  const scaleFactor = currentResolution / LOGICAL_RESOLUTION;
  const scaledBaseFontSize = logicalBaseFontSize * scaleFactor;

  const finalFontSize = Math.round(
    isVRMode() ? scaledBaseFontSize * vrFontScale : scaledBaseFontSize
  );
  const lineHeight = Math.round(finalFontSize * lineHeightScale);
  const font = `700 ${finalFontSize}px Verdana, Geneva, sans-serif`;
  ctx.font = font;

  const padding = 7.5;
  const canvasWidth = width * resolution;
  const maxWidth = canvasWidth - padding * 2;

  const textMetrics = wrapText(ctx, text, 0, 0, maxWidth, lineHeight, false);
  const totalTextPixelHeight = textMetrics.pixelHeight;

  canvas.width = canvasWidth;
  canvas.height = totalTextPixelHeight + padding;

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

  const geometry = new THREE.PlaneGeometry(width, canvas.height / resolution);
  return new THREE.Mesh(geometry, material);
}
function createScoreLabel(text, size, color = ACCENT_COLOR) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRendering = "optimizeLegibility";
  const resolution = getResolution();

  const fontSize = Math.floor(size * resolution * 0.5);
  ctx.font = `bold ${fontSize}px "Arial Rounded MT Bold", Arial, sans-serif`;

  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const paddingX = textWidth * 0.2;
  const canvasWidth = Math.ceil(textWidth + paddingX * 2);

  canvas.width = canvasWidth;
  canvas.height = size * resolution;

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

  const aspect = canvas.width / canvas.height;
  const planeHeight = size;
  const planeWidth = planeHeight * aspect;

  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  return new THREE.Mesh(geometry, material);
}

function createImagePanel(imageUrl, width, height) {
  const texture = textureLoader.load(imageUrl);
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function createTypingText(text, width, options = {}, onComplete) {
  const {
    baseFontSize: logicalBaseFontSize = 28,
    vrFontScale = 1.5,
    lineHeightScale = 1.2,
  } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRendering = "optimizeLegibility";
  const resolution = getResolution();

  const currentResolution = getResolution();
  const scaleFactor = currentResolution / LOGICAL_RESOLUTION;
  const scaledBaseFontSize = logicalBaseFontSize * scaleFactor;

  const finalFontSize = Math.round(
    isVRMode() ? scaledBaseFontSize * vrFontScale : scaledBaseFontSize
  );
  const lineHeight = Math.round(finalFontSize * lineHeightScale);
  const font = `600 ${finalFontSize}px Arial, Geneva, sans-serif`;
  ctx.font = font;

  const padding = 7.5;
  const canvasWidth = width * resolution;
  const maxWidth = canvasWidth - padding * 2;

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
  const typingSpeed = 20;

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

    while (timeAccumulator >= interval) {
      currentIndex++;
      timeAccumulator -= interval;
      shouldUpdate = true;
      if (currentIndex > text.length) {
        currentIndex = text.length;
        break;
      }
    }

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

  setActiveTypingAnimation({ update });
  return mesh;
}

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
      (Math.random() - 0.5) * 0.1,
      -0.5 - Math.random(),
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
export function createModeSelectionPage() {
  clearUI();
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const interButtonSpacing = panelHeight * 0.046;

  const titleWidth = panelWidth * 0.93;
  const titleHeight = panelHeight * 0.092;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;

  const titleLabel = createTitleLabel(
    "Choose Experience Mode",
    titleWidth,
    titleHeight
  );
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const buttonWidth = panelWidth * 0.81;
  const buttonHeight = panelHeight * 0.122;

  const gapBelowTitle = panelHeight * 0.03;
  const contentTop = titleY - titleHeight / 2 - gapBelowTitle;
  const contentBottom = -panelHeight / 2 + bottomPadding;
  const contentCenterY = (contentTop + contentBottom) / 2;

  const groupOffset = (buttonHeight + interButtonSpacing) / 2;

  const browserButton = createButton(
    "Mode Desktop",
    "start_browser",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  browserButton.position.set(0, contentCenterY + groupOffset, 0.01);
  viewerUIGroup.add(browserButton);

  const vrButton = createButton(
    "Mode VR",
    "start_vr",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_SECONDARY
  );
  vrButton.position.set(0, contentCenterY - groupOffset, 0.01);
  viewerUIGroup.add(vrButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createAvatarGreetingPage(
  playerName,
  greetingIndex = 0,
  options = {}
) {
  const isTextUpdateOnly = options.isTextUpdateOnly || false;

  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const panelWidth = 0.43;
  const panelHeight = 0.327;

  clearUI({ isTextUpdateOnly });

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const interItemGap = panelHeight * 0.03;

  const exitButtonSize = panelHeight * 0.076;
  const exitPadding = panelHeight * 0.031;
  const exitButton = createButton(
    "X",
    null,
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  const exitX = panelWidth / 2 - exitPadding - exitButtonSize / 2;
  const exitY = panelHeight / 2 - exitPadding - exitButtonSize / 2;
  exitButton.position.set(exitX, exitY, 0.001);
  exitButton.renderOrder = 2;
  exitButton.visible = false;
  exitButton.userData.isButton = false;
  viewerUIGroup.add(exitButton);

  const greetingTexts = GREETING_DATA(playerName);
  const currentGreeting = greetingTexts[greetingIndex];
  if (!currentGreeting) return;
  const isLastGreeting = greetingIndex >= greetingTexts.length - 1;

  const primaryButtonWidth = panelWidth * 0.81;
  const primaryButtonHeight = panelHeight * 0.122;
  const continueButton = createButton(
    isLastGreeting ? "Start Learning" : "Continue",
    null,
    primaryButtonWidth,
    primaryButtonHeight,
    BTN_COLOR_PRIMARY
  );
  const continueY = -panelHeight / 2 + primaryButtonHeight / 2 + bottomPadding;
  continueButton.position.set(0, continueY, 0.01);
  continueButton.visible = false;
  continueButton.userData.isButton = false;
  viewerUIGroup.add(continueButton);

  const onAvatarReady = () => {
    exitButton.visible = true;
    exitButton.userData.action = "back_to_landing";
    exitButton.userData.isButton = true;

    if (window.playCurrentGreetingAudioCallback) {
      window.playCurrentGreetingAudioCallback();
    }

    if (currentGreeting.text) {
      const textWidth = panelWidth * 0.88;
      const scaledBaseFont = Math.max(
        12,
        Math.round(18 * (panelHeight / 0.327))
      );

      const welcomeLabel = createTypingText(
        currentGreeting.text,
        textWidth,
        {
          baseFontSize: scaledBaseFont,
          vrFontScale: 1.1,
          lineHeightScale: 1.3,
        },
        () => {
          continueButton.visible = true;
          continueButton.userData.isButton = true;
          continueButton.userData.action = isLastGreeting
            ? "continue_to_landing"
            : "next_greeting";
        }
      );

      const textTop = panelHeight / 2 - topPadding;
      const textBottom = continueY + primaryButtonHeight / 2 + interItemGap;
      const textCenterY = (textTop + textBottom) / 2;

      welcomeLabel.position.set(0, textCenterY, 0.01);
      viewerUIGroup.add(welcomeLabel);
    }
  };

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

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

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
    willReadFrequently: false,
  });

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRendering = "optimizeLegibility";
  const resolution = getResolution();

  const logicalBaseFontSize = baseFontSize;
  const currentResolution = getResolution();
  const scaleFactor = currentResolution / LOGICAL_RESOLUTION;
  const scaledBaseFontSize = logicalBaseFontSize * scaleFactor;

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

  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = color;

  const textStartY = (finalCanvasHeight - textHeightNeeded) / 2;
  const centerX = canvasMaxWidth / 2;

  wrapText(ctx, text, centerX, textStartY, maxTextWidth, lineHeight, true);
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

  const panelWidth = 0.43;
  const panelHeight = 0.327;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const interButtonSpacing = panelHeight * 0.046;

  const titleWidth = panelWidth * 0.93;
  const titleHeight = panelHeight * 0.092;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;

  const titleLabel = createTitleLabel("Main Menu", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const buttonWidth = panelWidth * 0.81;
  const buttonHeight = panelHeight * 0.122;

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
  const totalButtonsHeight =
    numButtons * buttonHeight + (numButtons - 1) * interButtonSpacing;

  const groupBottom = -panelHeight / 2 + bottomPadding;
  const groupTop = groupBottom + totalButtonsHeight;
  const groupCenterY = (groupTop + groupBottom) / 2;

  const startY = groupTop - buttonHeight / 2;

  primaryButtons.forEach((btn, index) => {
    const button = createButton(
      btn.text,
      btn.action,
      buttonWidth,
      buttonHeight,
      btn.color
    );
    const buttonY = startY - index * (buttonHeight + interButtonSpacing);
    button.position.set(0, buttonY, 0.01);
    viewerUIGroup.add(button);
  });

  if (playerName) {
    const welcomeText = `What do you want to do next, ${playerName}?`;

    const titleMaxWidth = panelWidth * 0.9;
    const textAreaTop = titleY - titleHeight / 2 - panelHeight * 0.03;
    const textAreaBottom = groupTop + panelHeight * 0.03;
    const textCenterY = (textAreaTop + textAreaBottom) / 2;

    const scaledBaseFont = Math.max(12, Math.round(18 * (panelHeight / 0.327)));

    const welcomeLabel = createWrappingTitleLabel(
      welcomeText,
      titleMaxWidth,
      Math.max(0.06, textAreaTop - textAreaBottom),
      scaledBaseFont,
      1,
      1.2,
      TEXT_COLOR
    );
    welcomeLabel.position.set(0, textCenterY, 0.01);
    viewerUIGroup.add(welcomeLabel);
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman menu pemilihan topik (grid melengkung).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createMenuPage(allComponentsUnlocked, quizHasBeenAttempted) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  clearViewerUI();

  const totalPanelWidth = 0.43;
  const totalPanelHeight = 0.327;

  const backgroundPanel = createUIPanel(totalPanelWidth, totalPanelHeight, 0);
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  const topPadding = totalPanelHeight * 0.046;
  const bottomPadding = totalPanelHeight * 0.046;
  const smallGap = totalPanelHeight * 0.03;

  const titleWidth = totalPanelWidth * 0.7;
  const titleHeight = totalPanelHeight * 0.092;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;

  const titleLabel = createTitleLabel("Select Topic", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const exitButtonSize = totalPanelHeight * 0.076;
  const exitPadding = totalPanelHeight * 0.031;
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

  const quizButtonWidth = totalPanelWidth * 0.81;
  const quizButtonHeight = totalPanelHeight * 0.122;
  const quizButtonY =
    -totalPanelHeight / 2 + quizButtonHeight / 2 + bottomPadding;

  let quizButtonLabel, quizButtonAction, quizButtonColor;
  if (!allComponentsUnlocked) {
    quizButtonLabel = "Final Test (Locked)";
    quizButtonAction = "locked";
    quizButtonColor = BTN_COLOR_SECONDARY;
  } else if (!quizHasBeenAttempted) {
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

  const itemsPerRow = 2;
  const numRows = Math.ceil(components.length / itemsPerRow);

  const gridTopBoundary = titleY - titleHeight / 2 - smallGap;
  const gridBottomBoundary = quizButtonY + quizButtonHeight / 2 + smallGap;
  const availableGridHeight = Math.max(
    0.01,
    gridTopBoundary - gridBottomBoundary
  );

  const interRowGap = totalPanelHeight * 0.03;
  const contentWidth = totalPanelWidth * 0.9;
  const interColGap = totalPanelWidth * 0.02;

  const topicButtonHeight =
    (availableGridHeight - (numRows - 1) * interRowGap) / numRows;
  const topicButtonWidth = (contentWidth - interColGap) / itemsPerRow;

  const gridTotalHeight =
    numRows * topicButtonHeight + (numRows - 1) * interRowGap;
  const gridCenterY = (gridTopBoundary + gridBottomBoundary) / 2;
  const gridTopY = gridCenterY + gridTotalHeight / 2 - topicButtonHeight / 2;

  const col1X = -((topicButtonWidth + interColGap) / 2);
  const col2X = (topicButtonWidth + interColGap) / 2;

  components.forEach((comp, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const isUnlocked = comp.unlocked;

    const buttonLabel = isUnlocked ? `${index + 1}. ${comp.label}` : "Locked";
    const buttonColor = isUnlocked ? BTN_COLOR_PRIMARY : BTN_COLOR_SECONDARY;

    const button = createTopicButton(
      buttonLabel,
      isUnlocked ? `select_${index}` : "locked",
      topicButtonWidth,
      topicButtonHeight,
      buttonColor
    );

    if (!isUnlocked) {
      button.userData.colors = null;
    }

    const x = col === 0 ? col1X : col2X;
    const y = gridTopY - row * (topicButtonHeight + interRowGap);
    button.position.set(x, y, 0.01);
    viewerUIGroup.add(button);
  });

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
/**
 * Membuat UI untuk halaman viewer komponen (deskripsi, navigasi).
 * @param {Object} component - Data komponen yang sedang dilihat.
 * @param {number} index - Indeks komponen dalam daftar.
 * @param {number} [descriptionIndex=0] - Indeks deskripsi aktif.
 * @param {number} [highestComponentUnlocked=0] - Komponen tertinggi yang sudah terbuka.
 * @param {boolean} [hasAttemptedQuiz=false] - Status apakah kuis sudah dicoba.
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
  navButtons = [];

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const backgroundPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const titleMaxWidth = panelWidth * 0.7;
  const titleMaxHeight = panelHeight * 0.18;
  const titleBaseY = panelHeight / 2 - topPadding;

  const scaledTitleBaseFont = Math.max(
    14,
    Math.round(18 * (panelHeight / 0.327))
  );

  const titleLabel = createWrappingTitleLabel(
    component.label,
    titleMaxWidth,
    titleMaxHeight,
    scaledTitleBaseFont,
    1,
    1.2
  );
  const actualTitleHeight =
    titleLabel.geometry.parameters.height || panelHeight * 0.092;
  const titleY = titleBaseY - actualTitleHeight / 2;
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  const actionButtonSize = panelHeight * 0.076;
  const actionPadding = panelHeight * 0.031;
  const actionButtonY = panelHeight / 2 - actionPadding - actionButtonSize / 2;

  const closeButton = createButton(
    "X",
    "back_to_menu",
    actionButtonSize,
    actionButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );
  const closeX = panelWidth / 2 - actionPadding - actionButtonSize / 2;
  closeButton.position.set(closeX, actionButtonY, 0.001);
  closeButton.renderOrder = 3;
  viewerUIGroup.add(closeButton);
  navButtons.push(closeButton);

  let lastButtonX = closeX;
  if (component.audioFile) {
    const audioButton = createButton(
      "🔊",
      "play_audio",
      actionButtonSize,
      actionButtonSize,
      BTN_COLOR_SECONDARY,
      "circle"
    );
    const audioX = lastButtonX - actionButtonSize - actionPadding;
    audioButton.position.set(audioX, actionButtonY, 0.001);
    audioButton.renderOrder = 3;
    viewerUIGroup.add(audioButton);
    navButtons.push(audioButton);
    lastButtonX = audioX;
  }

  const contentWidth = panelWidth * 0.9;
  const interButtonGap = panelWidth * 0.046;
  const navCompButtonWidth = (contentWidth - interButtonGap) / 2;
  const navCompButtonHeight = panelHeight * 0.122;
  const navCompY = -panelHeight / 2 + navCompButtonHeight / 2 + bottomPadding;
  const navCompZ = 0.01;

  if (index > 0) {
    const prevButton = createButton(
      "< Back",
      "prev_component",
      navCompButtonWidth,
      navCompButtonHeight,
      BTN_COLOR_SECONDARY
    );
    const prevX = -(navCompButtonWidth / 2 + interButtonGap / 2);
    prevButton.position.set(prevX, navCompY, navCompZ);
    prevButton.renderOrder = 1;
    viewerUIGroup.add(prevButton);
    navButtons.push(prevButton);
  }

  const isLastComponent = index >= components.length - 1;
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
      BTN_COLOR_PRIMARY
    );
    const nextX = navCompButtonWidth / 2 + interButtonGap / 2;
    nextButton.position.set(nextX, navCompY, navCompZ);
    nextButton.renderOrder = 1;
    viewerUIGroup.add(nextButton);
    navButtons.push(nextButton);
  }

  const descNavButtonHeight = panelHeight * 0.092;
  const descNavButtonWidth = descNavButtonHeight * 1.01;
  const descIndicatorWidth = panelWidth * 0.12;
  const descIndicatorHeight = panelHeight * 0.061;
  const descNavPadding = panelWidth * 0.046;
  const descNavY =
    navCompY + navCompButtonHeight / 2 + smallGap + descNavButtonHeight / 2;

  let pageIndicator = null;

  if (component.description.length > 1) {
    const pageIndicatorText = `${descriptionIndex + 1} / ${
      component.description.length
    }`;
    pageIndicator = createTitleLabel(
      pageIndicatorText,
      descIndicatorWidth,
      descIndicatorHeight
    );
    pageIndicator.name = "page_indicator";
    pageIndicator.position.set(0, descNavY, 0.02);
    pageIndicator.renderOrder = 2;
    pageIndicator.material.depthWrite = false;
    viewerUIGroup.add(pageIndicator);

    const isFirstPage = descriptionIndex <= 0;
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_description",
      descNavButtonWidth,
      descNavButtonHeight,
      isFirstPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isFirstPage) {
      prevDescButton.userData.colors = null;
      prevDescButton.userData.currentState = "disabled";
    }
    const prevX =
      -descIndicatorWidth / 2 - descNavPadding - descNavButtonWidth / 2;
    prevDescButton.position.set(prevX, descNavY, 0.021);
    prevDescButton.renderOrder = 1;
    viewerUIGroup.add(prevDescButton);
    navButtons.push(prevDescButton);

    const isLastPage = descriptionIndex >= component.description.length - 1;
    const nextDescButton = createButton(
      ">",
      isLastPage ? "locked" : "next_description",
      descNavButtonWidth,
      descNavButtonHeight,
      isLastPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isLastPage) {
      nextDescButton.userData.colors = null;
      nextDescButton.userData.currentState = "disabled";
    }
    const nextX =
      descIndicatorWidth / 2 + descNavPadding + descNavButtonWidth / 2;
    nextDescButton.position.set(nextX, descNavY, 0.021);
    nextDescButton.renderOrder = 1;
    viewerUIGroup.add(nextDescButton);
    navButtons.push(nextDescButton);
  }

  const DESC_PANEL_WIDTH = panelWidth * 0.9;

  const textPanelTop = titleY - actualTitleHeight / 2 - smallGap;
  const bottomAnchorY = component.description.length > 1 ? descNavY : navCompY;
  const bottomAnchorHeight =
    component.description.length > 1
      ? descNavButtonHeight
      : navCompButtonHeight;
  const textPanelBottom = bottomAnchorY + bottomAnchorHeight / 2 + smallGap;

  const DESC_PANEL_FIXED_HEIGHT = Math.max(
    0.01,
    textPanelTop - textPanelBottom
  );
  const descPanelYOffset = (textPanelTop + textPanelBottom) / 2;

  const scaledBodyFont = Math.max(12, Math.round(14 * (panelHeight / 0.327)));
  const descPanel = createTextPanel(component.description, DESC_PANEL_WIDTH, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
    baseFontSize: scaledBodyFont,
  });

  const initialOffsetY =
    (component.description.length - 1 - descriptionIndex) /
    component.description.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = descriptionIndex;
  descPanel.userData.isScrollableText = true;

  descPanel.position.set(0, descPanelYOffset, 0.01);
  descPanel.renderOrder = 1;
  viewerUIGroup.add(descPanel);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
/**
 * Membuat UI untuk halaman kuis mini (per komponen).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createMiniQuizPage(component) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;
  clearViewerUI();
  navButtons = [];

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const backgroundPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const titleWidth = panelWidth * 0.93;
  const titleHeight = panelHeight * 0.092;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;
  const titleLabel = createTitleLabel("Mini Quiz", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  const contentWidth = panelWidth * 0.9;
  const interButtonGap = panelWidth * 0.046;
  const answerButtonWidth = (contentWidth - interButtonGap) / 2;
  const answerButtonHeight = panelHeight * 0.122;
  const answerY = -panelHeight / 2 + answerButtonHeight / 2 + bottomPadding;

  const currentQuestion = component.quiz[0];

  currentQuestion.answers.forEach((answer, index) => {
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "mini_quiz_correct" : "mini_quiz_incorrect";
    const buttonX =
      index === 0
        ? -(answerButtonWidth / 2 + interButtonGap / 2)
        : answerButtonWidth / 2 + interButtonGap / 2;

    const button = createButton(
      answer,
      action,
      answerButtonWidth,
      answerButtonHeight,
      BTN_COLOR_PRIMARY
    );
    button.position.set(buttonX, answerY, 0.01);
    button.renderOrder = 1;
    viewerUIGroup.add(button);
    navButtons.push(button);
  });

  const QUESTION_PANEL_WIDTH = contentWidth;
  const textPanelTop = titleY - titleHeight / 2 - smallGap;
  const textPanelBottom = answerY + answerButtonHeight / 2 + smallGap;

  const QUESTION_PANEL_HEIGHT = Math.max(0.01, textPanelTop - textPanelBottom);
  const questionPanelY = (textPanelTop + textPanelBottom) / 2;

  const questionPanel = createTextPanel(
    currentQuestion.question,
    QUESTION_PANEL_WIDTH,
    {
      fixedHeight: QUESTION_PANEL_HEIGHT,
    }
  );
  questionPanel.position.set(0, questionPanelY, 0.01);
  questionPanel.renderOrder = 1;
  viewerUIGroup.add(questionPanel);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createMiniQuizResultPage(component, isCorrect) {
  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  clearViewerUI();
  navButtons = [];

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const backgroundPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const titleText = isCorrect ? "Correct!" : "Incorrect";
  const titleColor = isCorrect ? "#28a745" : "#dc3545";
  const titleWidth = panelWidth * 0.93;
  const titleHeight = panelHeight * 0.092;
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

  const navButtonWidth = panelWidth * 0.81;
  const navButtonHeight = panelHeight * 0.122;
  const navY = -panelHeight / 2 + navButtonHeight / 2 + bottomPadding;

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

  const explanation = component.quiz[0].explanation;
  const resultMessage = isCorrect ? "Well done!\n" : "Review:\n";
  const messageText = resultMessage + explanation;

  const RESULT_PANEL_WIDTH = panelWidth * 0.9;

  const textPanelTop = titleY - titleHeight / 2 - smallGap;
  const textPanelBottom = navY + navButtonHeight / 2 + smallGap;

  const RESULT_PANEL_HEIGHT = Math.max(0.01, textPanelTop - textPanelBottom);
  const messagePanelY = (textPanelTop + textPanelBottom) / 2;

  const scaledBaseFont = Math.max(11, Math.round(12 * (panelHeight / 0.327)));

  const messagePanel = createTextPanel(messageText, RESULT_PANEL_WIDTH, {
    fixedHeight: RESULT_PANEL_HEIGHT,
    baseFontSize: scaledBaseFont,
  });
  messagePanel.position.set(0, messagePanelY, 0.01);
  messagePanel.renderOrder = 1;
  viewerUIGroup.add(messagePanel);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk layar pertanyaan kuis akhir.
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createQuizScreen(currentQuestion, questionIndex) {
  clearUI();

  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const titleWidth = panelWidth * 0.93;
  const titleHeight = panelHeight * 0.092;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;
  const titleText = `Test (${questionIndex + 1}/${quizData.length})`;
  const titleLabel = createTitleLabel(titleText, titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  const numChoices = currentQuestion.answers.length;
  const choiceButtonHeight = panelHeight * 0.092;
  const choiceButtonWidth = choiceButtonHeight * 1.01;
  const choiceGapX = panelWidth * 0.046;
  const choiceButtonY =
    -panelHeight / 2 + choiceButtonHeight / 2 + bottomPadding;

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
    button.position.set(buttonX, choiceButtonY, 0.01);
    button.renderOrder = 1;
    viewerUIGroup.add(button);
  });

  const questionText = currentQuestion.question;
  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => `${String.fromCharCode(65 + index)}. ${answer}`)
    .join("\n");
  const fullQuizText = `${questionText}\n\n${answerChoicesText}`;

  const QUIZ_TEXT_PANEL_WIDTH = panelWidth * 0.9;

  const textPanelTop = titleY - titleHeight / 2 - smallGap;
  const textPanelBottom = choiceButtonY + choiceButtonHeight / 2 + smallGap;

  const QUIZ_TEXT_PANEL_HEIGHT = Math.max(0.01, textPanelTop - textPanelBottom);
  const textPanelY = (textPanelTop + textPanelBottom) / 2;

  const scaledBaseFont = Math.max(12, Math.round(12 * (panelHeight / 0.327)));

  const quizTextPanel = createTextPanel(fullQuizText, QUIZ_TEXT_PANEL_WIDTH, {
    fixedHeight: QUIZ_TEXT_PANEL_HEIGHT,
    baseFontSize: scaledBaseFont,
  });

  quizTextPanel.position.set(0, textPanelY, 0.01);
  quizTextPanel.renderOrder = 1;
  viewerUIGroup.add(quizTextPanel);

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
  clearUI();

  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const titleText = isCorrect ? "Correct!" : "Incorrect: Review";
  const titleColor = isCorrect ? "#28a745" : "#FFC107";
  const titleWidth = panelWidth * 0.93;
  const titleHeight = panelHeight * 0.092;
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

  const continueButtonHeight = panelHeight * 0.092;
  const continueButtonWidth = panelWidth * 0.25;
  const rightPadding = panelWidth * 0.07;
  const buttonY = -panelHeight / 2 + continueButtonHeight / 2 + bottomPadding;
  const buttonX = panelWidth / 2 - continueButtonWidth / 2 - rightPadding;

  const isLastQuestion = questionIndex >= totalQuestions - 1;
  const buttonText = isLastQuestion ? "Results" : "Next";

  const continueButton = createButton(
    buttonText,
    "next_question",
    continueButtonWidth,
    continueButtonHeight,
    BTN_COLOR_PRIMARY
  );
  continueButton.position.set(buttonX, buttonY, 0.02);
  continueButton.renderOrder = 1;
  continueButton.name = "quizResultContinueButton";
  viewerUIGroup.add(continueButton);

  const questionText = `Q: ${currentQuestion.question}\n\n`;
  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => {
      const prefix = `${String.fromCharCode(65 + index)}. ${answer}`;
      return index === currentQuestion.correctAnswerIndex
        ? `${prefix} ✅ (Correct)`
        : prefix;
    })
    .join("\n");
  const fullResultText = questionText + answerChoicesText;

  const RESULT_TEXT_PANEL_WIDTH = panelWidth * 0.9;

  const textPanelTop = titleY - titleHeight / 2 - smallGap;
  const textPanelBottom = buttonY + continueButtonHeight / 2 + smallGap;

  const RESULT_TEXT_PANEL_HEIGHT = Math.max(
    0.01,
    textPanelTop - textPanelBottom
  );
  const textPanelY = (textPanelTop + textPanelBottom) / 2;

  const scaledBaseFont = Math.max(11, Math.round(12 * (panelHeight / 0.327)));

  const resultTextPanel = createTextPanel(
    fullResultText,
    RESULT_TEXT_PANEL_WIDTH,
    {
      fixedHeight: RESULT_TEXT_PANEL_HEIGHT,
      baseFontSize: scaledBaseFont,
    }
  );

  resultTextPanel.position.set(0, textPanelY, 0.01);
  resultTextPanel.renderOrder = 1;
  viewerUIGroup.add(resultTextPanel);

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

  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const titleText = hasAttempted
    ? "Your Learning Report"
    : "Report Not Available";
  const titleWidth = panelWidth * 0.7;
  const titleHeight = panelHeight * 0.092;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;

  const titleLabel = createTitleLabel(titleText, titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const exitButtonAction = isPostCompletion
    ? "show_post_quiz_choice"
    : "back_to_landing";
  const exitButtonSize = panelHeight * 0.076;
  const exitPadding = panelHeight * 0.031;
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
  exitButton.position.set(exitX, exitY, 0.001);
  viewerUIGroup.add(exitButton);

  const contentTop = titleY - titleHeight / 2 - smallGap;
  const contentBottom = -panelHeight / 2 + bottomPadding;
  const availableContentHeight = Math.max(0.01, contentTop - contentBottom);
  const contentCenterY = (contentTop + contentBottom) / 2;

  if (!hasAttempted) {
    const reportText =
      "Complete all topics and the Final Test to view your report.";
    const textWidth = panelWidth * 0.9;
    const scaledBaseFont = Math.max(12, Math.round(14 * (panelHeight / 0.327)));

    const reportBody = createTextPanel(reportText, textWidth, {
      fixedHeight: availableContentHeight * 0.9,
      baseFontSize: scaledBaseFont,
    });
    reportBody.position.set(0, contentCenterY, 0.02);
    viewerUIGroup.add(reportBody);
  } else {
    const totalQuestions = quizData.length;
    const finalScore = (score / totalQuestions) * 100;

    const scoreTitleWidth = panelWidth;
    const scoreTitleHeight = panelHeight * 0.076;
    const scoreTitleY = contentTop - scoreTitleHeight / 2 - smallGap;

    const scoreTitle = createSubtitleLabel(
      "Final Score",
      scoreTitleWidth,
      scoreTitleHeight
    );
    scoreTitle.position.set(-0.005, scoreTitleY, 0.02);
    viewerUIGroup.add(scoreTitle);

    const scoreDisplayHeight = panelHeight * 0.245;
    const scoreDisplayY =
      scoreTitleY - scoreTitleHeight / 2 - smallGap - scoreDisplayHeight / 2;

    const scoreDisplay = createScoreLabel(
      finalScore.toFixed(0) + "%",
      scoreDisplayHeight
    );
    scoreDisplay.position.set(0, scoreDisplayY, 0.01);
    viewerUIGroup.add(scoreDisplay);

    const detailText = `You answered ${score} out of ${totalQuestions} questions correctly.`;
    const reportBodyWidth = panelWidth * 0.9;

    const textAreaTop = scoreDisplayY - scoreDisplayHeight / 2 - smallGap;
    const textAreaBottom = contentBottom;
    const textAreaCenterY = (textAreaTop + textAreaBottom) / 2;
    const textAreaHeight = Math.max(0.04, textAreaTop - textAreaBottom);

    const scaledDetailFont = Math.max(
      12,
      Math.round(16 * (panelHeight / 0.327))
    );
    const reportBody = createBodyText(detailText, reportBodyWidth, {
      baseFontSize: scaledDetailFont,
    });

    const actualDetailHeight = reportBody.geometry.parameters.height || 0.02;
    const detailY = textAreaCenterY - actualDetailHeight / 2;
    reportBody.position.set(0, detailY, 0.02);
    viewerUIGroup.add(reportBody);
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk halaman "Selesai Materi" (sebelum kuis akhir).
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createCompletionScreen(playerName) {
  clearUI();

  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const titleText = `Congrats, ${playerName}!`;
  const titleWidth = panelWidth * 0.93;
  const titleHeight = panelHeight * 0.092;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;
  const titleLabel = createTitleLabel(
    titleText,
    titleWidth,
    titleHeight,
    "#FFD700"
  );
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const buttonWidth = panelWidth * 0.81;
  const buttonHeight = panelHeight * 0.122;
  const buttonY = -panelHeight / 2 + buttonHeight / 2 + bottomPadding;
  const quizButton = createButton(
    "Take Final Test",
    "back_to_menu",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  quizButton.position.set(0, buttonY, 0.01);
  viewerUIGroup.add(quizButton);

  const messageText = "All topics completed.\nReady for the Final Test?";
  const messageBodyWidth = panelWidth * 0.9;

  const textPanelTop = titleY - titleHeight / 2 - smallGap;
  const textPanelBottom = buttonY + buttonHeight / 2 + smallGap;
  const messageCenterY = (textPanelTop + textPanelBottom) / 2;

  const scaledBaseFont = Math.max(12, Math.round(16 * (panelHeight / 0.327)));

  const messageBody = createBodyText(messageText, messageBodyWidth, {
    baseFontSize: scaledBaseFont,
    vrFontScale: 1.1,
    lineHeightScale: 1.2,
  });
  messageBody.position.set(0, messageCenterY, 0.01);
  viewerUIGroup.add(messageBody);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);

  const confetti = createConfettiEffect();
  return confetti;
}

/**
 * Membuat UI untuk halaman pilihan setelah kuis akhir selesai.
 * --- VERSI REFAKTOR SKALA KECIL ---
 */
export function createPostQuizChoiceScreen() {
  clearUI();

  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const titleWidth = panelWidth * 0.93;
  const titleHeight = panelHeight * 0.092;
  const titleY = panelHeight / 2 - titleHeight / 2 - topPadding;
  const titleLabel = createTitleLabel(
    "Session Complete",
    titleWidth,
    titleHeight
  );
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const contentWidth = panelWidth * 0.9;
  const interButtonGap = panelWidth * 0.046;
  const buttonWidth = (contentWidth - interButtonGap) / 2;
  const buttonHeight = panelHeight * 0.122;
  const buttonY = -panelHeight / 2 + buttonHeight / 2 + bottomPadding;

  const leftButtonX = -(buttonWidth / 2 + interButtonGap / 2);
  const rightButtonX = buttonWidth / 2 + interButtonGap / 2;

  const mainMenuButton = createButton(
    "Menu",
    "back_to_landing",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_SECONDARY
  );
  mainMenuButton.position.set(leftButtonX, buttonY, 0.01);
  viewerUIGroup.add(mainMenuButton);

  const learnAgainButton = createButton(
    "Repeat",
    "back_to_menu",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  learnAgainButton.position.set(rightButtonX, buttonY, 0.01);
  viewerUIGroup.add(learnAgainButton);

  const subtitleText =
    "All lessons and the final test are complete. Repeat or return to menu?";
  const subtitleWidth = panelWidth * 0.9;

  const textPanelTop = titleY - titleHeight / 2 - smallGap;
  const textPanelBottom = buttonY + buttonHeight / 2 + smallGap;
  const subtitleY = (textPanelTop + textPanelBottom) / 2;

  const scaledBaseFont = Math.max(12, Math.round(14 * (panelHeight / 0.327)));

  const subtitleLabel = createBodyText(subtitleText, subtitleWidth, {
    baseFontSize: scaledBaseFont,
    vrFontScale: 1.1,
    lineHeightScale: 1.2,
  });
  subtitleLabel.position.set(0, subtitleY, 0.01);
  viewerUIGroup.add(subtitleLabel);

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

  const titleWidth = 4.0;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel("About", titleWidth, titleHeight);
  const topPadding = 0.1;
  const titleY = 0.8;
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const DESC_PANEL_FIXED_HEIGHT = 0.8;
  const descPanel = createTextPanel(creditPages, 4.2, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });

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

/**
 * Membersihkan semua elemen UI dari `uiGroup` dan `viewerUIGroup`.
 * Menghentikan animasi dan membersihkan memori (dispose).
 */
export function clearUI(options = {}) {
  const keepAvatar = options.isTextUpdateOnly || false;
  clearActiveTypingAnimation();
  stopAvatarDropAnimation();
  stopAvatarFlyUpAnimation();

  if (avatarMixer && !keepAvatar) {
    avatarMixer.stopAllAction();
    avatarMixer.uncacheRoot(avatarMixer.getRoot());
    avatarMixer = null;
  }

  [uiGroup, viewerUIGroup].forEach((group) => {
    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i];
      if (keepAvatar && child === currentAvatar) {
        continue;
      }
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

  if (!keepAvatar) {
    currentAvatar = null;
  }
}

/**
 * Membersihkan elemen UI dari `viewerUIGroup` saja.
 * Berguna saat me-refresh navigasi di halaman viewer.
 */
export function clearViewerUI() {
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

/**
 * Membuat mesh plane untuk menampilkan label FPS.
 * @returns {THREE.Mesh}
 */
export function createFpsLabel() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

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

  const totalPanelWidth = 0.43;
  const totalPanelHeight = 0.327;

  const backgroundPanel = createUIPanel(totalPanelWidth, totalPanelHeight, 0);
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  const topPadding = totalPanelHeight * 0.046;
  const bottomPadding = totalPanelHeight * 0.046;
  const smallGap = totalPanelHeight * 0.03;

  const titleWidth = totalPanelWidth * 0.7;
  const titleHeight = totalPanelHeight * 0.092;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;

  const titleLabel = createTitleLabel("Quick Guide", titleWidth, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const exitButtonSize = totalPanelHeight * 0.076;
  const exitPadding = totalPanelHeight * 0.031;
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

  const navButtonHeight = totalPanelHeight * 0.092;
  const navButtonWidth = navButtonHeight * 1.01;
  const indicatorWidth = totalPanelWidth * 0.12;
  const indicatorHeight = totalPanelHeight * 0.061;
  const navPaddingX = totalPanelWidth * 0.046;
  const navY = -totalPanelHeight / 2 + navButtonHeight / 2 + bottomPadding;

  if (guidePages.length > 1) {
    const pageIndicatorText = `${pageIndex + 1}/${guidePages.length}`;
    const pageIndicator = createTitleLabel(
      pageIndicatorText,
      indicatorWidth,
      indicatorHeight
    );
    pageIndicator.position.set(0, navY, 0.02);
    viewerUIGroup.add(pageIndicator);

    const isLastPage = pageIndex >= guidePages.length - 1;
    const nextButtonX = indicatorWidth / 2 + navPaddingX + navButtonWidth / 2;
    const nextDescButton = createButton(
      ">",
      isLastPage ? "locked" : "next_guide",
      navButtonWidth,
      navButtonHeight,
      isLastPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isLastPage) {
      nextDescButton.userData.colors = null;
      nextDescButton.userData.currentState = "disabled";
    }
    nextDescButton.position.set(nextButtonX, navY, 0.01);
    viewerUIGroup.add(nextDescButton);

    const isFirstPage = pageIndex === 0;
    const prevButtonX = -indicatorWidth / 2 - navPaddingX - navButtonWidth / 2;
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_guide",
      navButtonWidth,
      navButtonHeight,
      isFirstPage ? BTN_COLOR_SECONDARY : BTN_COLOR_PRIMARY
    );
    if (isFirstPage) {
      prevDescButton.userData.colors = null;
      prevDescButton.userData.currentState = "disabled";
    }
    prevDescButton.position.set(prevButtonX, navY, 0.01);
    viewerUIGroup.add(prevDescButton);
  }

  const DESC_PANEL_WIDTH = totalPanelWidth * 0.9;

  const textPanelTop = titleY - titleHeight / 2 - smallGap;
  const textPanelBottom = navY + navButtonHeight / 2 + smallGap;

  const DESC_PANEL_FIXED_HEIGHT = Math.max(
    0.01,
    textPanelTop - textPanelBottom
  );
  const descPanelYOffset = (textPanelTop + textPanelBottom) / 2;

  const descPanel = createTextPanel(guidePages, DESC_PANEL_WIDTH, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });

  const initialOffsetY =
    (guidePages.length - 1 - pageIndex) / guidePages.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = pageIndex;
  descPanel.userData.isGuidePanel = true;

  descPanel.position.set(0, descPanelYOffset, 0.01);
  viewerUIGroup.add(descPanel);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

/**
 * Membuat UI untuk konfirmasi memulai Final Test.
 * --- SKALA KECIL ---
 */
export function createFinalTestConfirmationPage() {
  clearViewerUI();

  const uiBasePosition = VIEWER_UI_POSITION;
  const uiLookAtPosition = VIEWER_UI_LOOKAT;

  const panelWidth = 0.43;
  const panelHeight = 0.327;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0, BG_COLOR);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const topPadding = panelHeight * 0.046;
  const bottomPadding = panelHeight * 0.046;
  const smallGap = panelHeight * 0.03;

  const messageText = "Start the Final Test now?";
  const messageWidth = panelWidth * 0.9;
  const scaledBaseFont = Math.max(12, Math.round(18 * (panelHeight / 0.327)));

  const contentTop = panelHeight / 2 - topPadding;
  const contentBottom = -panelHeight / 2 + bottomPadding;

  const messageLabel = createBodyText(messageText, messageWidth, {
    baseFontSize: scaledBaseFont,
    vrFontScale: 1.1,
    lineHeightScale: 1.2,
  });

  const messageY = contentBottom + (contentTop - contentBottom) * 0.65;
  messageLabel.position.set(0, messageY, 0.01);
  viewerUIGroup.add(messageLabel);

  const contentWidth = panelWidth * 0.9;
  const interButtonGap = panelWidth * 0.046;
  const buttonWidth = (contentWidth - interButtonGap) / 2;
  const buttonHeight = panelHeight * 0.122;
  const buttonY = -panelHeight / 2 + buttonHeight / 2 + bottomPadding;

  const leftButtonX = -(buttonWidth / 2 + interButtonGap / 2);
  const rightButtonX = buttonWidth / 2 + interButtonGap / 2;

  const cancelButton = createButton(
    "Cancel",
    "back_to_menu",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_SECONDARY
  );
  cancelButton.position.set(leftButtonX, buttonY, 0.01);
  viewerUIGroup.add(cancelButton);

  const confirmButton = createButton(
    "Start",
    "confirm_start_quiz",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  confirmButton.position.set(rightButtonX, buttonY, 0.01);
  viewerUIGroup.add(confirmButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
