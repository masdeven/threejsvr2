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

export let activeTypingAnimation = null;

const BG_COLOR = "#2D3748";
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

function setupAvatar(model, scale, position) {
  currentAvatar = model;
  model.scale.set(scale.x, scale.y, scale.z);
  model.position.set(position.x, position.y, position.z);
  model.rotation.y = 0.4;
  model.userData.initialY = position.y;
  viewerUIGroup.add(model);

  if (avatarModel.animations && avatarModel.animations.length) {
    avatarMixer = new THREE.AnimationMixer(model);
    const action = avatarMixer.clipAction(avatarModel.animations[0]);
    action.play();
  }
}

export function getResolution() {
  if (isVRMode) {
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

  function update(deltaTime) {
    if (currentIndex >= text.length) {
      if (activeTypingAnimation === this) {
        activeTypingAnimation = null;
        if (onComplete) onComplete();
      }
      return;
    }

    timeAccumulator += deltaTime;
    const interval = 1 / typingSpeed;

    while (timeAccumulator >= interval) {
      currentIndex++;
      timeAccumulator -= interval;
      if (currentIndex > text.length) {
        currentIndex = text.length;
        break;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#E2E8F0";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
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

  activeTypingAnimation = { update };

  return mesh;
}

function createButton(
  text,
  action,
  width = 1,
  height = 0.25,
  bgColor = BG_COLOR,
  shape = "roundedRectangle"
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const buttonResolution = getResolution(); // Hilangkan * 2

  canvas.width = width * buttonResolution;
  canvas.height = height * buttonResolution;

  ctx.fillStyle = bgColor;

  if (shape === "circle") {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    const radius = 10 * (buttonResolution / getResolution());
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvas.width - radius, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    ctx.lineTo(canvas.width, canvas.height - radius);
    ctx.quadraticCurveTo(
      canvas.width,
      canvas.height,
      canvas.width - radius,
      canvas.height
    );
    ctx.lineTo(radius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
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
    alphaTest: 0.5,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = {
    isButton: true,
    action: action,
    text: text,
    colors: { default: bgColor, hover: "#4A5568" },
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
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

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
  activeTypingAnimation = null;
  [uiGroup, viewerUIGroup].forEach((group) => {
    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i];
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
}

function createUIPanel(width, height, radius, color = "#1A202C", opacity = 1) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const panelResolution = getResolution();

  canvas.width = width * panelResolution;
  canvas.height = height * panelResolution;

  const r = radius * panelResolution;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
  ctx.lineTo(canvas.width, canvas.height - r);
  ctx.quadraticCurveTo(
    canvas.width,
    canvas.height,
    canvas.width - r,
    canvas.height
  );
  ctx.lineTo(r, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
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
  if (avatarMixer) {
    avatarMixer.update(deltaTime);
  }
  if (currentAvatar && currentAvatar.userData.initialY !== undefined) {
    const hoverAmplitude = 0.04;
    const hoverSpeed = 1.5;

    currentAvatar.position.y =
      currentAvatar.userData.initialY +
      Math.sin(elapsedTime * hoverSpeed) * hoverAmplitude;
  }
}

export function createAvatarGreetingPage(playerName, greetingIndex = 0) {
  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const panelWidth = 4.0;
  const panelHeight = 1.3;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const exitButtonSize = 0.22;
  const padding = 0.15;
  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    "rgba(45, 55, 72, 0.7)",
    "circle"
  );
  exitButton.position.set(
    panelWidth / 2 - padding - exitButtonSize / 2,
    panelHeight / 2 - padding - exitButtonSize / 2,
    0.02
  );
  exitButton.renderOrder = 2;
  viewerUIGroup.add(exitButton);

  const greetingTexts = GREETING_DATA(playerName);
  const currentGreeting = greetingTexts[greetingIndex];
  if (!currentGreeting) return;

  const isLastGreeting = greetingIndex >= greetingTexts.length - 1;
  const buttonAction = isLastGreeting ? "continue_to_landing" : "next_greeting";

  const primaryButtonWidth = 2.8;
  const primaryButtonHeight = 0.32;
  const continueButton = createButton(
    isLastGreeting ? "Start Learning" : "Continue",
    null,
    primaryButtonWidth,
    primaryButtonHeight,
    ACCENT_COLOR
  );
  continueButton.position.set(0, -0.35, 0.01);
  continueButton.visible = false;
  viewerUIGroup.add(continueButton);

  if (currentGreeting.text) {
    // Calculate responsive width (85% of panel width with padding)
    const textWidth = panelWidth * 0.85; // 4.0 * 0.85 = 3.4

    // Optimized font size for greeting text
    const greetingFontSize = 25; // Reduced from 50 to 18

    const welcomeLabel = createTypingText(
      currentGreeting.text,
      textWidth, // ✅ 3.4 dengan padding memadai
      {
        baseFontSize: greetingFontSize, // ✅ 18 proporsional
        vrFontScale: 1.1,
        lineHeightScale: 1.2, // ✅ 1.2 lebih compact
      },
      () => {
        continueButton.visible = true;
        continueButton.userData.action = buttonAction;
      }
    );

    // Adjusted position for smaller text
    const textYPosition = 0.15; // ✅ 0.15 lebih centered
    welcomeLabel.position.set(0, textYPosition, 0.01);
    viewerUIGroup.add(welcomeLabel);
  } else {
    continueButton.visible = true;
    continueButton.userData.action = buttonAction;
  }

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

export function createLandingPage(playerName) {
  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const panelWidth = 4.0;
  const panelHeight = 1.3;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const logoWidth = 0.3;
  const logoHeight = 0.3;
  const logoPanel = createImagePanel(
    "assets/images/logo-kampus.png",
    logoWidth,
    logoHeight
  );

  const paddingLogo = 0.1;
  logoPanel.position.set(
    -panelWidth / 2 + logoWidth / 2 + paddingLogo,
    panelHeight / 2 - logoHeight / 2 - paddingLogo,
    0.02
  );
  logoPanel.renderOrder = 1;
  viewerUIGroup.add(logoPanel);

  if (playerName) {
    const welcomeText = `Select Activity, ${playerName}`;
    const welcomeLabel = createTitleLabel(welcomeText, 3.4, 0.35);
    welcomeLabel.position.set(0.1, 0.45, 0.01);
    viewerUIGroup.add(welcomeLabel);
  }

  const primaryButtonWidth = 2.8;
  const primaryButtonHeight = 0.32;
  const primarySpacingY = 0.4;
  const primaryStartY = 0.1;

  const primaryButtons = [
    { text: "Start Learning", action: "start_learning", color: ACCENT_COLOR },
    { text: "Learning Report", action: "show_quiz_report", color: BG_COLOR },
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

  const creditButtonSize = 0.22;
  const creditButton = createButton(
    "ⓘ",
    "show_credits",
    creditButtonSize,
    creditButtonSize,
    "rgba(45, 55, 72, 0.7)",
    "circle"
  );
  const panelEdgeX = panelWidth / 2;
  const panelEdgeY = -panelHeight / 2;
  const padding = 0.2;
  creditButton.position.set(panelEdgeX - padding, panelEdgeY + padding, 0.02);
  creditButton.renderOrder = 1;
  viewerUIGroup.add(creditButton);

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
  const uiBasePosition = new THREE.Vector3(0, 1.6, -4);
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
    "#1A202C",
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

    const buttonLabel = isUnlocked
      ? `${index + 1}. ${comp.label}`
      : "🔒 Locked";

    const buttonColor = isUnlocked ? "#1A202C" : "#4A5568";
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
    ACCENT_COLOR
  );
  exitButton.position.set(-actionSpacingX / 2, actionButtonY, actionZ);
  exitButton.lookAt(localLookAtTarget);
  viewerUIGroup.add(exitButton);

  let quizButtonLabel, quizButtonAction, quizButtonColor;
  if (!allComponentsUnlocked) {
    quizButtonLabel = "Final Test > (Locked)";
    quizButtonAction = "locked";
    quizButtonColor = "#4A5568";
  } else if (allComponentsUnlocked && !quizHasBeenAttempted) {
    quizButtonLabel = "Final Test >";
    quizButtonAction = "show_quiz";
    quizButtonColor = "#dc3545";
  } else {
    quizButtonLabel = "Learning Report >";
    quizButtonAction = "show_quiz_report";
    quizButtonColor = "#28a745";
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
  highestComponentUnlocked = 0
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
    "#1A202C",
    0.9
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
      isLastPage ? "#4A5568" : BG_COLOR
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
      isFirstPage ? "#4A5568" : BG_COLOR
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

  if (!isLastComponent || !allMaterialsUnlocked) {
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
    BG_COLOR,
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
    BG_COLOR,
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
        -totalPanelWidth / 2 - 0.3,
        totalPanelHeight / 2 - 0.2,
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

  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

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

  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

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

  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

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

  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const panelWidth = 4.0;
  const panelHeight = 1.8;
  const mainPanel = createUIPanel(
    panelWidth,
    panelHeight,
    0.1,
    "#1A202C",
    0.95
  );
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
    ACCENT_COLOR
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
  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  clearViewerUI();

  const totalPanelWidth = 3.2;
  const totalPanelHeight = 1.8;
  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0.05,
    "#1A202C",
    0.9
  );
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  const titleWidth = 2.8;
  const titleHeight = 0.3;
  const titleLabel = createTitleLabel("About", titleWidth, titleHeight);
  const topPadding = 0.1;
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const DESC_PANEL_FIXED_HEIGHT = 1.1;
  const descPanel = createTextPanel(creditPages, 2.8, {
    fixedHeight: DESC_PANEL_FIXED_HEIGHT,
  });

  const initialOffsetY =
    (creditPages.length - 1 - pageIndex) / creditPages.length;
  descPanel.material.map.offset.y = initialOffsetY;
  descPanel.userData.targetOffsetY = initialOffsetY;
  descPanel.userData.currentPage = pageIndex;

  descPanel.userData.isCreditsPanel = true;

  const descPanelYOffset =
    titleY - titleHeight / 2 - descPanel.geometry.parameters.height / 2 - 0.05;
  descPanel.position.set(0, descPanelYOffset, 0.01);
  viewerUIGroup.add(descPanel);

  const descNavY =
    descPanelYOffset - descPanel.geometry.parameters.height / 2 - 0.12;
  if (creditPages.length > 1) {
    const buttonWidth = 0.25;
    const indicatorWidth = 0.6;
    const padding = 0.1;
    const pageIndicatorText = `${pageIndex + 1} / ${creditPages.length}`;
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
      isLastPage ? "#4A5568" : BG_COLOR
    );
    if (isLastPage) nextDescButton.userData.colors = null;
    nextDescButton.position.set(nextButtonX, descNavY, 0.01);
    viewerUIGroup.add(nextDescButton);

    const isFirstPage = pageIndex <= 0;
    const prevButtonX = -(indicatorWidth / 2 + padding + buttonWidth / 2);
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_credit",
      buttonWidth,
      0.2,
      isFirstPage ? "#4A5568" : BG_COLOR
    );
    if (isFirstPage) prevDescButton.userData.colors = null;
    prevDescButton.position.set(prevButtonX, descNavY, 0.01);
    viewerUIGroup.add(prevDescButton);
  }

  const exitButtonSize = 0.22;
  const padding = 0.1;
  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    "rgba(45, 55, 72, 0.7)",
    "circle"
  );
  exitButton.position.set(
    totalPanelWidth / 2 - padding - exitButtonSize / 2,
    totalPanelHeight / 2 - padding - exitButtonSize / 2,
    0.02
  );
  viewerUIGroup.add(exitButton);

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createQuizScreen(currentQuestion, questionIndex) {
  clearUI();

  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
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

  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
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
    ACCENT_COLOR
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

  canvas.width = size * resolution;
  canvas.height = size * resolution;

  const fontSize = Math.floor(size * resolution * 0.5);
  ctx.font = `bold ${fontSize}px "Arial Rounded MT Bold", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

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

  const geometry = new THREE.PlaneGeometry(size, size);
  return new THREE.Mesh(geometry, material);
}

export function createQuizReportScreen(
  score,
  hasAttempted,
  isPostCompletion = false
) {
  clearUI();

  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
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
    const reportText =
      "You must complete all materials and take the Final Test before viewing your report.";
    const reportBody = createBodyText(reportText, 4.2, {
      baseFontSize: 42,
      vrFontScale: 1.6,
    });
    reportBody.position.set(0, 0, 0.02);
    viewerUIGroup.add(reportBody);
  } else {
    const totalQuestions = quizData.length;
    const finalScore = (score / totalQuestions) * 100;

    const scoreTitle = createSubtitleLabel("Final Score", 2.0, 0.2);
    scoreTitle.position.set(0, 0.4, 0.02);
    viewerUIGroup.add(scoreTitle);

    const scoreDisplay = createScoreLabel(finalScore.toFixed(0), 1.0);
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
    "rgba(45, 55, 72, 0.7)",
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
    "#1A202C",
    0.9
  );
  backgroundPanel.position.set(0, 0, 0);
  backgroundPanel.renderOrder = 0;
  viewerUIGroup.add(backgroundPanel);

  const titleWidth = 2.8;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel("Mini Kuis", titleWidth, titleHeight);
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

    const colors = ["#28a745", "#dc3545"];
    const buttonColor = colors[index] || ACCENT_COLOR;

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
        -totalPanelWidth / 2 - 0.3,
        totalPanelHeight / 2 - 0.2,
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
    "#1A202C",
    0.9
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
    ACCENT_COLOR
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
        -totalPanelWidth / 2 - 0.3,
        totalPanelHeight / 2 - 0.2,
        0.05
      )
    );
  }

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createPostQuizChoiceScreen() {
  clearUI();

  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
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
    ACCENT_COLOR
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

  const uiBasePosition = new THREE.Vector3(0, 1.6, -5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const panelWidth = 4.0;
  const panelHeight = 1.3;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  const titleLabel = createTitleLabel("Choose Experience Mode", 3.8, 0.35);
  titleLabel.position.set(0, 0.45, 0.01);
  viewerUIGroup.add(titleLabel);

  const buttonWidth = 3.0;
  const buttonHeight = 0.32;
  const spacing = 0.4;
  const startY = 0.05;

  const browserButton = createButton(
    "Mode Browser",
    "start_browser",
    buttonWidth,
    buttonHeight,
    ACCENT_COLOR
  );
  browserButton.position.set(0, startY, 0.01);
  viewerUIGroup.add(browserButton);

  const vrButton = createButton(
    "Mode VR",
    "start_vr",
    buttonWidth,
    buttonHeight
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
