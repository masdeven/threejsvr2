import * as THREE from "three";
import { scene, camera, renderer } from "./scene-setup.js";
import { components } from "./component-data.js";
import { isVRMode } from "./vr-manager.js";
import { quizData } from "./quiz-data.js";
import { loader } from "./model-loader.js";
import { TextureLoader } from "three";

export const FONT = "bold 32px Verdana, Geneva, sans-serif";
export const uiGroup = new THREE.Group();
scene.add(uiGroup);

export const viewerUIGroup = new THREE.Group();
scene.add(viewerUIGroup);

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

let activeTypingAnimation = null;

// ✅ TAMBAHKAN fungsi setter dan getter
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

const BG_COLOR = "#000000ff";
const BTN_COLOR_PRIMARY = "#00000088";
const BTN_COLOR_SECONDARY = "#4b4b4b8a";
const BTN_COLOR_HOVER = "#2727278a";
const TEXT_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#3182CE";
const UI_DISTANCE = 2.5;
const textureLoader = new TextureLoader();
export let navButtons = [];

const VIEWER_UI_POSITION = new THREE.Vector3(-3, 1.6, -4);
const VIEWER_UI_LOOKAT = new THREE.Vector3(0, 1.6, 0);

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

function setupAvatar(model, scale, position, shouldAnimate = false) {
  currentAvatar = model;
  model.scale.set(scale.x, scale.y, scale.z);
  model.position.set(position.x, position.y, position.z);
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

  if (avatarModel.animations && avatarModel.animations.length) {
    avatarMixer = new THREE.AnimationMixer(model);
    const action = avatarMixer.clipAction(avatarModel.animations[0]);
    action.play();
  }
}
// ✅ Tambahkan fungsi untuk stop avatar drop animation
export function stopAvatarDropAnimation() {
  if (avatarDropAnimation.isAnimating) {
    avatarDropAnimation.isAnimating = false;
    avatarDropAnimation.onComplete = null; // Clear callback

    // Set ke posisi final langsung
    if (currentAvatar && currentAvatar.userData.initialY !== undefined) {
      currentAvatar.position.y = currentAvatar.userData.initialY;
    }

    console.log("✓ Avatar drop animation stopped");
  }
}

export function updateAvatarDropAnimation(deltaTime) {
  if (!avatarDropAnimation.isAnimating || !currentAvatar) return;

  const currentY = avatarDropAnimation.currentY;
  const targetY = avatarDropAnimation.targetY;
  const speed = avatarDropAnimation.speed;

  // Lerp dengan easing untuk efek yang lebih natural
  avatarDropAnimation.currentY = THREE.MathUtils.lerp(
    currentY,
    targetY,
    speed * deltaTime
  );

  currentAvatar.position.y = avatarDropAnimation.currentY;

  // Cek jika sudah mencapai target
  if (Math.abs(currentY - targetY) < 0.01) {
    currentAvatar.position.y = targetY;
    avatarDropAnimation.isAnimating = false;

    // Trigger callback setelah animasi selesai
    if (avatarDropAnimation.onComplete) {
      avatarDropAnimation.onComplete();
      avatarDropAnimation.onComplete = null;
    }
  }
}

export function getResolution() {
  if (isVRMode()) {
    return 256;
  } else {
    const baseResolution = 240;
    const dpr = Math.min(window.devicePixelRatio, 2);
    return baseResolution * dpr;
  }
}

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

// Di ui-creator.js, modifikasi createTypingText
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
  const typingSpeed = 20;

  // ✅ Pre-render setup untuk mengurangi pekerjaan di loop
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#E2E8F0";
  // ctx.shadowColor = "rgba(0,0,0,0.8)";
  // ctx.shadowBlur = 6;
  // ctx.shadowOffsetX = 2;
  // ctx.shadowOffsetY = 2;

  function update(deltaTime) {
    if (currentIndex >= text.length) {
      if (getActiveTypingAnimation() === this) {
        clearActiveTypingAnimation(); // ✅ Gunakan setter
        if (onComplete) onComplete();
      }
      return;
    }

    timeAccumulator += deltaTime;
    const interval = 1 / typingSpeed;

    // ✅ Batch update: hanya update setiap N karakter untuk mengurangi GPU upload
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

    // ✅ Hanya render jika ada perubahan
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
  const buttonResolution = getResolution(); // Hilangkan * 2

  canvas.width = width * buttonResolution;
  canvas.height = height * buttonResolution;

  ctx.fillStyle = bgColor;

  // ✅ PERBAIKAN: Tingkatkan padding dari 2 menjadi 4
  const padding = 0;

  if (shape === "circle") {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // ✅ PERBAIKAN: Kurangi radius dengan padding
    const radius = Math.min(canvas.width, canvas.height) / 2 - padding;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    // ✅ PERBAIKAN: Terapkan padding 4px pada rounded rectangle
    const r = 10 * (buttonResolution / getResolution()); // r = radius sudut (tetap 10)
    const x = padding;
    const y = padding;
    const w = canvas.width - padding * 2; // lebar gambar dikurangi padding
    const h = canvas.height - padding * 2; // tinggi gambar dikurangi padding

    // Pastikan radius sudut tidak lebih besar dari setengah lebar/tinggi
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
    baseFontSize *= 1.2; // Dari 1.2 → 1.0
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
    // alphaTest: 0.5, // Tetap dihapus
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
    currentState: "default", // State tracking
  };

  return mesh;
}

function createTextPanel(descriptions, width, options = {}) {
  const { fixedHeight = null } = options;
  const MAX_PANEL_HEIGHT_3D = 1.2;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const descriptionsArray = Array.isArray(descriptions)
    ? descriptions
    : [descriptions];

  const BASEFONTSIZEPX = 25;
  const vrFontScale = 1.1;
  const dpr = isVRMode() ? 1 : Math.min(window.devicePixelRatio, 2);
  const finalFontSize = Math.round(
    isVRMode() ? BASEFONTSIZEPX * vrFontScale : BASEFONTSIZEPX * dpr
  );
  const lineHeight = Math.round(finalFontSize * 1.2);
  const font = `${finalFontSize}px Verdana, Geneva, sans-serif`;
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
    // ctx.shadowColor = "rgba(0,0,0,0.6)";
    // ctx.shadowBlur = 3;
    // ctx.shadowOffsetX = 1;
    // ctx.shadowOffsetY = 1;

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

  ctx.shadowColor = "transparent";

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1 / descriptionsArray.length);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(width, fixedHeight);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData.isScrollableText = true;
  mesh.userData.totalPages = descriptionsArray.length;
  mesh.userData.currentPage = 0;
  mesh.userData.targetOffsetY = 0;

  return mesh;
}

export function clearUI() {
  // ✅ Stop typing animation SEBELUM clear UI
  clearActiveTypingAnimation();

  // ✅ Stop avatar drop animation
  stopAvatarDropAnimation();

  if (avatarMixer) {
    avatarMixer.stopAllAction();
    avatarMixer.uncacheRoot(avatarMixer.getRoot());
    avatarMixer = null;
  }

  [uiGroup, viewerUIGroup].forEach((group) => {
    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i];

      child.traverse((object) => {
        if (object.isMesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }

          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => {
                if (material.map) {
                  material.map.dispose();
                }
                material.dispose();
              });
            } else {
              if (object.material.map) {
                object.material.map.dispose();
              }
              object.material.dispose();
            }
          }
        }
      });

      group.remove(child);
    }
  });
}

function createUIPanel(width, height, radius, color = BG_COLOR, opacity = 0.7) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const panelResolution = getResolution();

  canvas.width = width * panelResolution;
  canvas.height = height * panelResolution;

  const r = radius * panelResolution;

  // Pastikan radius tidak melebihi setengah dari lebar atau tinggi
  const maxWidthRadius = (width * panelResolution) / 2;
  const maxHeightRadius = (height * panelResolution) / 2;
  const clampedR = Math.min(r, maxWidthRadius, maxHeightRadius);

  ctx.beginPath();
  // Mulai dari titik di bawah sudut kiri atas
  ctx.arc(clampedR, clampedR, clampedR, Math.PI, Math.PI * 1.5); // Kiri Atas
  ctx.lineTo(canvas.width - clampedR, 0); // Garis ke kanan
  ctx.arc(
    canvas.width - clampedR,
    clampedR,
    clampedR,
    Math.PI * 1.5,
    Math.PI * 2
  ); // Kanan Atas
  ctx.lineTo(canvas.width, canvas.height - clampedR); // Garis ke bawah
  ctx.arc(
    canvas.width - clampedR,
    canvas.height - clampedR,
    clampedR,
    0,
    Math.PI * 0.5
  ); // Kanan Bawah
  ctx.lineTo(clampedR, canvas.height); // Garis ke kiri
  ctx.arc(clampedR, canvas.height - clampedR, clampedR, Math.PI * 0.5, Math.PI); // Kiri Bawah
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

  mesh.renderOrder = -1;

  return mesh;
}

export function toggleAvatarVisibility(visible) {
  if (currentAvatar) {
    currentAvatar.visible = visible;
  }
}

export function updateAvatar(deltaTime, elapsedTime) {
  // Update animasi jatuh terlebih dahulu
  updateAvatarDropAnimation(deltaTime);

  // Update mixer untuk animasi karakter
  if (avatarMixer) {
    avatarMixer.update(deltaTime);
  }

  // Hover animation (hanya jika tidak sedang drop)
  if (
    currentAvatar &&
    currentAvatar.userData.initialY !== undefined &&
    !avatarDropAnimation.isAnimating
  ) {
    const hoverAmplitude = 0.04;
    const hoverSpeed = 1.5;
    currentAvatar.position.y =
      currentAvatar.userData.initialY +
      Math.sin(elapsedTime * hoverSpeed) * hoverAmplitude;
  }
}

export function createAvatarGreetingPage(playerName, greetingIndex = 0) {
  // ✅ Selaras dengan Landing
  const uiBasePosition = new THREE.Vector3(0, 1.6, -3.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 3.5);

  const panelWidth = 3.2;
  const panelHeight = 1.1;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // ✅ TOMBOL X DI LUAR KANAN ATAS (FLOATING)
  const exitButtonSize = 0.2;
  const exitOffsetX = 0.15; // Jarak dari edge panel ke luar
  const exitOffsetY = 0.15; // Jarak dari top panel

  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    BTN_COLOR_PRIMARY,
    "circle"
  );

  // Posisi: LUAR kanan atas panel
  exitButton.position.set(
    panelWidth / 2 + exitOffsetX, // Pindah ke LUAR kanan (+)
    panelHeight / 2 - exitOffsetY, // Tetap di atas
    0.02
  );
  exitButton.renderOrder = 2;
  viewerUIGroup.add(exitButton);

  const greetingTexts = GREETING_DATA(playerName);
  const currentGreeting = greetingTexts[greetingIndex];

  if (!currentGreeting) return;

  const isLastGreeting = greetingIndex >= greetingTexts.length - 1;

  const primaryButtonWidth = 2.3;
  const primaryButtonHeight = 0.28;

  const continueButton = createButton(
    isLastGreeting ? "Start Learning" : "Continue",
    null,
    primaryButtonWidth,
    primaryButtonHeight,
    BTN_COLOR_PRIMARY
  );

  continueButton.position.set(0, -0.28, 0.01);
  continueButton.visible = false;
  viewerUIGroup.add(continueButton);

  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();

    const avatarFinalPosition = new THREE.Vector3(
      -panelWidth / 2 - 0.18,
      panelHeight / 2 - 0.18,
      0.05
    );

    const shouldAnimateDrop = greetingIndex === 0;
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.35, 0.35, 0.35),
      avatarFinalPosition,
      shouldAnimateDrop
    );

    if (shouldAnimateDrop) {
      avatarDropAnimation.onComplete = () => {
        if (window.playCurrentGreetingAudioCallback) {
          window.playCurrentGreetingAudioCallback();
        }

        if (currentGreeting.text) {
          const textWidth = panelWidth * 0.88;

          const welcomeLabel = createTypingText(
            currentGreeting.text,
            textWidth,
            {
              baseFontSize: 25,
              vrFontScale: 1.1,
              lineHeightScale: 1.2,
            },
            () => {
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
    } else {
      // Jika TIDAK ada animasi drop
      if (window.playCurrentGreetingAudioCallback) {
        window.playCurrentGreetingAudioCallback();
      }

      if (currentGreeting.text) {
        const textWidth = panelWidth * 0.88;

        const welcomeLabel = createTypingText(
          currentGreeting.text,
          textWidth,
          {
            baseFontSize: 25,
            vrFontScale: 1.1,
            lineHeightScale: 1.2,
          },
          () => {
            continueButton.visible = true;
            continueButton.userData.action = isLastGreeting
              ? "continue_to_landing"
              : "next_greeting";
          }
        );

        welcomeLabel.position.set(0, 0.12, 0.01);
        viewerUIGroup.add(welcomeLabel);
      }
    }
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createLandingPage(playerName) {
  // ✅ OPTIMASI: Dekatkan panel untuk comfort zone VR (1.75m adalah standar)
  const uiBasePosition = new THREE.Vector3(0, 1.6, -3.5); // Dari -5 → -3.5
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 3.5); // Adjusted

  // ✅ OPTIMASI: Kecilkan panel agar tidak overwhelming
  const panelWidth = 3.2; // Dari 4.0 → 3.2 (20% lebih kecil)
  const panelHeight = 1.1; // Dari 1.3 → 1.1 (15% lebih kecil)

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // ✅ OPTIMASI: Kecilkan logo (proporsional dengan panel)
  const logoWidth = 0.24; // Dari 0.3 → 0.24 (20% lebih kecil)
  const logoHeight = 0.24; // Dari 0.3 → 0.24
  const logoPanel = createImagePanel(
    "assets/images/logo-kampus.png",
    logoWidth,
    logoHeight
  );

  const paddingLogo = 0.08; // Dari 0.1 → 0.08 (lebih rapat)
  logoPanel.position.set(
    -panelWidth / 2 + logoWidth / 2 + paddingLogo,
    panelHeight / 2 - logoHeight / 2 - paddingLogo,
    0.02
  );
  logoPanel.renderOrder = 1;
  viewerUIGroup.add(logoPanel);

  if (playerName) {
    const welcomeText = `Select Activity, ${playerName}`;

    // ✅ OPTIMASI: Kecilkan welcome text
    const welcomeLabel = createTitleLabel(
      welcomeText,
      2.8, // Dari 3.4 → 2.8 (18% lebih kecil)
      0.28 // Dari 0.35 → 0.28 (20% lebih kecil)
    );
    welcomeLabel.position.set(0.08, 0.35, 0.01); // Adjusted Y dari 0.45 → 0.35
    viewerUIGroup.add(welcomeLabel);
  }

  // ✅ OPTIMASI: Kecilkan button agar lebih proporsional
  const primaryButtonWidth = 2.3; // Dari 2.8 → 2.3 (18% lebih kecil)
  const primaryButtonHeight = 0.28; // Dari 0.32 → 0.28 (12% lebih kecil)
  const primarySpacingY = 0.34; // Dari 0.4 → 0.34 (lebih rapat)
  const primaryStartY = 0.05; // Dari 0.1 → 0.05 (turunkan sedikit)

  const primaryButtons = [
    {
      text: "Start Learning",
      action: "start_learning",
      color: BTN_COLOR_PRIMARY,
    },
    {
      text: "Learning Report",
      action: "show_quiz_report",
      color: BTN_COLOR_SECONDARY,
    },
  ];

  primaryButtons.forEach((btn, index) => {
    const button = createButton(
      btn.text,
      btn.action,
      primaryButtonWidth,
      primaryButtonHeight,
      btn.color
    );

    const buttonY = primaryStartY - index * primarySpacingY;
    button.position.set(0, buttonY, 0.01);
    viewerUIGroup.add(button);
  });

  // ✅ OPTIMASI: Kecilkan credit button
  const creditButtonSize = 0.15; // Dari 0.22 → 0.2 (9% lebih kecil)
  const creditButton = createButton(
    "i",
    "show_credits",
    creditButtonSize,
    creditButtonSize,
    BTN_COLOR_SECONDARY,
    "circle"
  );

  const panelEdgeX = panelWidth / 2;
  const panelEdgeY = -panelHeight / 2;
  const padding = 0.15; // Dari 0.2 → 0.15 (lebih rapat)

  creditButton.position.set(panelEdgeX - padding, panelEdgeY + padding, 0.02);
  creditButton.renderOrder = 1;
  viewerUIGroup.add(creditButton);

  // ✅ OPTIMASI: Kecilkan avatar
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.35, 0.35, 0.35), // Dari 0.4 → 0.35 (12% lebih kecil)
      new THREE.Vector3(
        -panelWidth / 2 - 0.18, // Dari -0.2 → -0.18 (lebih dekat ke panel)
        panelHeight / 2 - 0.18, // Dari -0.2 → -0.18
        0.05
      )
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

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

export function createMenuPage(allComponentsUnlocked, quizHasBeenAttempted) {
  const uiBasePosition = new THREE.Vector3(0, 1.7, -3.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);
  const localCenterY = 0;

  const radius = 3.5;
  const angleSpan = Math.PI * 0.8;
  const itemsPerRow = 4;
  const rowHeight = 0.5;
  const localLookAtTarget = new THREE.Vector3(0, localCenterY, 5);

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

  const startAngle = -angleSpan / 2;
  const angleStep = angleSpan / (itemsPerRow - 1);

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
      button.userData.colors = null;
    }

    const x = radius * Math.sin(angle);
    const z = -radius * Math.cos(angle);
    const y = localCenterY + 0.4 - row * rowHeight;

    button.position.set(x, y, z);
    button.lookAt(localLookAtTarget);
    viewerUIGroup.add(button);
  });

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
    quizButton.userData.colors = null;
  }

  quizButton.position.set(actionSpacingX / 2, actionButtonY, actionZ);
  quizButton.lookAt(localLookAtTarget);
  viewerUIGroup.add(quizButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

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

  const titleWidth = 2.8;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel(component.label, titleWidth, titleHeight);

  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;

  titleLabel.position.set(0, titleY, 0.02);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  const DESC_PANEL_FIXED_HEIGHT = 1.2;
  const descPanel = createTextPanel(component.description, 3.5, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });

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
      nextDescButton.userData.currentState = "disabled"; // ✅ Tambahkan
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
      prevDescButton.userData.currentState = "disabled"; // ✅ Tambahkan
    }
    const prevButtonX = currentX - buttonWidth / 2;
    prevDescButton.position.set(prevButtonX, descNavY, 0.01);
    prevDescButton.renderOrder = 1;
    viewerUIGroup.add(prevDescButton);
    navButtons.push(prevDescButton);
  }

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

export function clearViewerUI() {
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
}

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

  // ctx.shadowColor = "rgba(0,0,0,0.7)";
  // ctx.shadowBlur = 6;
  // ctx.shadowOffsetX = 3;
  // ctx.shadowOffsetY = 3;

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
  ctx.fillStyle = "#E2E8F0";

  // ctx.shadowColor = "rgba(0,0,0,0.8)";
  // ctx.shadowBlur = 6;
  // ctx.shadowOffsetX = 2;
  // ctx.shadowOffsetY = 2;

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
  ctx.font = `${finalFontSize}px Arial, sans-serif`;

  const padding = 7.5;
  const canvasWidth = width * resolution;
  const maxWidth = canvasWidth - padding * 2;

  const textMetrics = wrapText(ctx, text, 0, 0, maxWidth, lineHeight, false);
  const totalTextPixelHeight = textMetrics.pixelHeight;

  canvas.width = canvasWidth;
  canvas.height = totalTextPixelHeight + padding;

  ctx.font = `${finalFontSize}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#E2E8F0";

  // ctx.shadowColor = "rgba(0,0,0,0.8)";
  // ctx.shadowBlur = 6;
  // ctx.shadowOffsetX = 2;
  // ctx.shadowOffsetY = 2;

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

  const geometry = new THREE.PlaneGeometry(width, canvas.height / resolution);
  return new THREE.Mesh(geometry, material);
}

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

function createConfettiEffect() {
  const particleCount = 200;
  const particles = new THREE.Group();
  scene.add(particles);

  const particleGeometry = new THREE.PlaneGeometry(0.02, 0.02);
  const colors = [0xffd700, 0xff6347, 0x4169e1, 0x32cd32, 0xffffff];

  for (let i = 0; i < particleCount; i++) {
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      side: THREE.DoubleSide,
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    particle.position.set(
      (Math.random() - 0.5) * 5,
      2.5 + Math.random() * 2,
      (Math.random() - 0.5) * 2
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

      if (particle.position.y < 0) {
        particle.position.y = 3.5;
        particle.position.x = (Math.random() - 0.5) * 5;
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

export function createCompletionScreen(playerName) {
  clearUI();

  const uiBasePosition = new THREE.Vector3(0, 2, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const panelWidth = 4.0;
  const panelHeight = 1.8;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  let titleText = `Excellent, ${playerName}!`;
  const titleLabel = createTitleLabel(titleText, 3.8, 0.4, "#FFD700");
  titleLabel.position.set(0, 0.5, 0.01);
  viewerUIGroup.add(titleLabel);

  const messageText =
    "You have successfully completed all the learning topics.\nNow it's time to test your knowledge in the Final Test!";
  const messageBody = createBodyText(messageText, 3.5, 40, 30);
  messageBody.position.set(0, 0, 0.01);
  viewerUIGroup.add(messageBody);

  const quizButton = createButton(
    "Go to Final Test",
    "back_to_menu",
    3.0,
    0.3,
    BTN_COLOR_PRIMARY
  );
  quizButton.position.set(0, -0.6, 0.01);
  viewerUIGroup.add(quizButton);

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

  const confetti = createConfettiEffect();
  return confetti;
}

export function createCreditsScreen(creditPages, pageIndex) {
  const uiBasePosition = new THREE.Vector3(0, 2, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);
  clearViewerUI();

  const totalPanelWidth = 4.8;
  const totalPanelHeight = 2.0;

  // PERBAIKAN 1: Radius dari 0.05 → 0.1 (sama dengan Report)
  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0.1 // ← UBAH dari 0.05 menjadi 0.1
  );
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  // Title sama
  const titleWidth = 4.0;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel("About", titleWidth, titleHeight);
  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  // PERBAIKAN 2: Text panel height dari 1.0 → 0.8 (lebih optimal)
  const DESCPANELFIXEDHEIGHT = 0.8; // ← UBAH dari 1.0 menjadi 0.8
  const descPanel = createTextPanel(creditPages, 4.2, {
    fixedHeight: DESCPANELFIXEDHEIGHT,
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

  // Navigation buttons - sama seperti sebelumnya
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

    // Next button
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

    // Prev button
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

  // ✅ SAMA dengan Learning Report
  const exitButtonSize = 0.25; // Learning Report: 0.25
  const exitPadding = 0.15; // Learning Report: 0.15
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

  // ✅ SAMA dengan Learning Report
  if (avatarModel) {
    const avatarInstance = avatarModel.scene.clone();
    setupAvatar(
      avatarInstance,
      new THREE.Vector3(0.4, 0.4, 0.4), // Learning Report: 0.4
      new THREE.Vector3(
        -totalPanelWidth / 2 - 0.2, // Learning Report: -0.2
        totalPanelHeight / 2 - 0.2, // Learning Report: -0.2
        0.05
      )
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createQuizScreen(currentQuestion, questionIndex) {
  clearUI();

  const uiBasePosition = new THREE.Vector3(0, 2, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const totalPanelWidth = 4.8;
  const totalPanelHeight = 2.4;
  const mainPanel = createUIPanel(totalPanelWidth, totalPanelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);

  const titleHeight = 0.3;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - 0.1;
  const titleText = `Final Test (Question ${questionIndex + 1}/${
    quizData.length
  })`;
  const titleLabel = createTitleLabel(titleText, 3.8, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

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

export function createQuizResultScreen(
  isCorrect,
  currentQuestion,
  questionIndex,
  totalQuestions
) {
  clearUI();

  const uiBasePosition = new THREE.Vector3(0, 2, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const totalPanelWidth = 4.8;
  const totalPanelHeight = 2.4;
  const mainPanel = createUIPanel(totalPanelWidth, totalPanelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  mainPanel.renderOrder = 0;
  viewerUIGroup.add(mainPanel);

  const titleHeight = 0.35;
  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  const titleText = isCorrect
    ? "Excellent, that's correct!"
    : "Not quite. Here's the review:";
  const titleColor = isCorrect ? "#28a745" : "#FFC107";
  const titleLabel = createTitleLabel(titleText, 4.0, titleHeight, titleColor);
  titleLabel.position.set(0, titleY, 0.01);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  const questionText = `Question:\n${currentQuestion.question}`;

  const answerChoicesText = currentQuestion.answers
    .map((answer, index) => {
      const prefix = `${String.fromCharCode(65 + index)}. ${answer}`;
      if (index === currentQuestion.correctAnswerIndex) {
        return `${prefix}  <-- Correct Answer`;
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

function createScoreLabel(text, size, color = ACCENT_COLOR) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();

  // ✅ PERBAIKAN: Calculate font size first
  const fontSize = Math.floor(size * resolution * 0.5);
  ctx.font = `bold ${fontSize}px "Arial Rounded MT Bold", Arial, sans-serif`;

  // ✅ PERBAIKAN: Measure text to get actual width needed
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  // ✅ PERBAIKAN: Add padding (20% on each side)
  const paddingX = textWidth * 0.2;
  const canvasWidth = Math.ceil(textWidth + paddingX * 2);

  // Canvas height tetap based on size
  canvas.width = canvasWidth;
  canvas.height = size * resolution;

  // ✅ PERBAIKAN: Re-apply font after canvas resize
  ctx.font = `bold ${fontSize}px "Arial Rounded MT Bold", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ctx.shadowColor = "rgba(0,0,0,0.7)";
  // ctx.shadowBlur = 8;
  // ctx.shadowOffsetX = 4;
  // ctx.shadowOffsetY = 4;

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

  // ✅ PERBAIKAN: PlaneGeometry width based on actual canvas aspect ratio
  const aspect = canvas.width / canvas.height;
  const planeHeight = size;
  const planeWidth = planeHeight * aspect;

  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  return new THREE.Mesh(geometry, material);
}

export function createQuizReportScreen(
  score,
  hasAttempted,
  isPostCompletion = false
) {
  clearUI();
  const uiBasePosition = new THREE.Vector3(0, 2, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const panelWidth = 4.8;
  const panelHeight = 2.0;

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const titleText = hasAttempted
    ? "Your Learning Report"
    : "Report Not Available";
  const titleLabel = createTitleLabel(titleText, 4.0, 0.35);
  titleLabel.position.set(0, 0.8, 0.01);
  viewerUIGroup.add(titleLabel);

  if (!hasAttempted) {
    // ✅ UBAH: Gunakan createTextPanel dengan fixedHeight
    const reportText =
      "You must complete all materials and take the Final Test before viewing your report.";

    const LOCKED_TEXT_HEIGHT = 0.6; // Height yang cukup untuk 2-3 baris
    const reportBody = createTextPanel(reportText, 4.2, {
      fixedHeight: LOCKED_TEXT_HEIGHT,
    });
    reportBody.position.set(0, 0, 0.02);
    viewerUIGroup.add(reportBody);
  } else {
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

  const titleWidth = 2.8;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel("Mini Quiz", titleWidth, titleHeight);
  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  titleLabel.position.set(0, titleY, 0.02);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

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

  const buttonWidth = 1.2;
  const buttonHeight = 0.25;
  const buttonY = descPanelYOffset - panelHeight / 2 - 0.2;
  const buttonZ = 0.01;
  const positions = [-0.8, 0.8];

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

  const titleText = isCorrect ? "Correct Answer!" : "Wrong Answer!";
  const titleColor = isCorrect ? "#28a745" : "#dc3545";
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

export function createPostQuizChoiceScreen() {
  clearUI();

  const uiBasePosition = new THREE.Vector3(0, 2, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const panelWidth = 4.0;
  const panelHeight = 1.4;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const titleLabel = createTitleLabel("Learning Session Complete", 3.5, 0.3);

  titleLabel.position.set(0, 0.45, 0.01);
  viewerUIGroup.add(titleLabel);

  const buttonWidth = 3.2;
  const buttonHeight = 0.32;

  const learnAgainButton = createButton(
    "Learn Again",
    "back_to_menu",
    buttonWidth,
    buttonHeight,
    BG_COLOR
  );
  learnAgainButton.position.set(0, 0.04, 0.01);
  viewerUIGroup.add(learnAgainButton);

  const mainMenuButton = createButton(
    "Back to Main Menu",
    "back_to_landing",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  mainMenuButton.position.set(0, -0.38, 0.01);
  viewerUIGroup.add(mainMenuButton);

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

export function createModeSelectionPage() {
  clearUI();

  // ✅ Selaras dengan Landing
  const uiBasePosition = new THREE.Vector3(0, 1.6, -3.5); // -5 → -3.5
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 3.5);

  const panelWidth = 3.2; // 4.0 → 3.2
  const panelHeight = 1.1; // 1.3 → 1.1

  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const titleLabel = createTitleLabel("Choose Experience Mode", 3.0, 0.3); // 3.8→3.0, 0.35→0.3
  titleLabel.position.set(0, 0.35, 0.01); // 0.45 → 0.35
  viewerUIGroup.add(titleLabel);

  const buttonWidth = 2.3; // 3.0 → 2.3
  const buttonHeight = 0.28; // 0.32 → 0.28
  const spacing = 0.34; // 0.4 → 0.34
  const startY = 0.02; // 0.05 → 0.02

  const browserButton = createButton(
    "Mode Desktop", // "Mode Browser" → "Browser Mode"
    "start_browser",
    buttonWidth,
    buttonHeight,
    BTN_COLOR_PRIMARY
  );
  browserButton.position.set(0, startY, 0.01);
  viewerUIGroup.add(browserButton);

  const vrButton = createButton(
    "Mode VR", // "Mode VR" → "VR Mode"
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

export const debugGroup = new THREE.Group();
scene.add(debugGroup);

export function createFpsLabel() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 128;

  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "white";
  context.font = "bold 48px Verdana, Geneva, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("0", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const aspect = canvas.width / canvas.height;
  const height = 0.2;
  const width = height * aspect;

  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = { context, canvas, texture, lastFps: -1 };

  return mesh;
}

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
