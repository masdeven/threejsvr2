import * as THREE from "three";
import { scene, camera } from "./scene-setup.js";
import { components } from "./component-data.js";
import { isVRMode } from "./vr-manager.js";

export const FONT = "bold 32px Arial";
export const uiGroup = new THREE.Group();
scene.add(uiGroup);

export const viewerUIGroup = new THREE.Group();
scene.add(viewerUIGroup);

const BG_COLOR = "#222222";
const TEXT_COLOR = "#FFFFFF";
const UI_DISTANCE = 2.5;

function getResolution() {
  return isVRMode() ? 512 : 256;
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

function createButton(
  text,
  action,
  width = 1,
  height = 0.25,
  bgColor = BG_COLOR
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  canvas.width = width * resolution;
  canvas.height = height * resolution;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 5;
  ctx.strokeRect(2.5, 2.5, canvas.width - 5, canvas.height - 5);
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = {
    isButton: true,
    action: action,
    text: text,
    colors: { default: bgColor, hover: "#007BFF" },
    canvasContext: ctx,
  };
  return mesh;
}

function createTextPanel(text, width) {
  const MAX_PANEL_HEIGHT_3D = 0.5;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = isVRMode() ? "30px Arial" : "26px Arial";
  const lineHeight = isVRMode() ? 38 : 32;
  const padding = 25;
  const resolution = getResolution();

  ctx.font = font;
  const canvasWidth = width * resolution;
  const maxWidth = canvasWidth - padding * 2;

  const textMetrics = wrapText(ctx, text, 0, 0, maxWidth, lineHeight, false);
  const totalTextPixelHeight = textMetrics.pixelHeight;

  let finalPanelHeight3D = (totalTextPixelHeight + padding * 2) / resolution;
  finalPanelHeight3D = Math.min(finalPanelHeight3D, MAX_PANEL_HEIGHT_3D);

  canvas.width = canvasWidth;
  canvas.height = finalPanelHeight3D * resolution;

  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  wrapText(ctx, text, padding, padding, maxWidth, lineHeight, true);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(width, finalPanelHeight3D);
  const mesh = new THREE.Mesh(geometry, material);

  return mesh;
}
export function clearUI() {
  [uiGroup, viewerUIGroup].forEach((group) => {
    group.children.forEach((child) => {
      child.geometry.dispose();
      child.material.map?.dispose();
      child.material.dispose();
    });
    group.clear();
  });
}

export function createLandingPage(playerName) {
  if (playerName) {
    const welcomeText = `Selamat Datang, ${playerName}!`;
    const welcomeLabel = createTitleLabel(welcomeText, 3.5, 0.5);
    welcomeLabel.position.set(0, 2.2, UI_DISTANCE);
    uiGroup.add(welcomeLabel);
  }

  const startButton = createButton("Mulai", "start", 1.5, 0.4);
  startButton.position.set(0, 1.8, UI_DISTANCE);
  uiGroup.add(startButton);

  const helpButton = createButton("Bantuan", "help", 1.5, 0.4);
  helpButton.position.set(0, 1.3, UI_DISTANCE);
  uiGroup.add(helpButton);
}

export function createMenuPage() {
  const columns = 3;
  const spacingX = 1.5;
  const spacingY = 0.25;
  const startX = -spacingX;
  const startY = 1.8;

  const titleCanvas = document.createElement("canvas");
  const titleCtx = titleCanvas.getContext("2d");
  titleCanvas.width = 1024;
  titleCanvas.height = 192;
  titleCtx.font = "bold 64px Arial";
  titleCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
  titleCtx.shadowBlur = 10;
  titleCtx.shadowOffsetX = 5;
  titleCtx.shadowOffsetY = 5;
  titleCtx.fillStyle = "white";
  titleCtx.textAlign = "center";
  titleCtx.textBaseline = "middle";
  titleCtx.fillText(
    "Pilih Komponen",
    titleCanvas.width / 2,
    titleCanvas.height / 2
  );

  const titleTexture = new THREE.CanvasTexture(titleCanvas);
  const titleMaterial = new THREE.MeshBasicMaterial({
    map: titleTexture,
    transparent: true,
  });
  const titlePlaneHeight = 3 * (titleCanvas.height / titleCanvas.width);
  const titleMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3, titlePlaneHeight),
    titleMaterial
  );
  titleMesh.position.set(0, 2.3, UI_DISTANCE);
  uiGroup.add(titleMesh);

  components.forEach((comp, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const button = createButton(comp.label, `select_${index}`, 1.3, 0.2);
    button.position.set(startX + col * spacingX, startY - row * spacingY, 2.5);
    uiGroup.add(button);
  });
}

export function createViewerPage(component) {
  const prevButton = createButton("<", "prev_component", 0.3, 0.3);
  prevButton.position.set(-2.2, 0, 0);
  viewerUIGroup.add(prevButton);
  const nextButton = createButton(">", "next_component", 0.3, 0.3);
  nextButton.position.set(2.2, 0, 0);
  viewerUIGroup.add(nextButton);
  const descPanel = createTextPanel(component.description, 3);
  const panelHeight = descPanel.geometry.parameters.height;
  const panelWidth = descPanel.geometry.parameters.width;
  const panelYPosition = -0.6 - panelHeight / 2;
  descPanel.position.set(0, panelYPosition, 0);
  viewerUIGroup.add(descPanel);
  const titleWidth = 1.5;
  const titleHeight = 0.3;
  const titleLabel = createTitleLabel(component.label, titleWidth, titleHeight);
  const titleYPosition =
    panelYPosition + panelHeight / 2 + titleHeight / 2 + 0.05;
  const titleXPosition = -(panelWidth / 2) + titleWidth / 2;
  titleLabel.position.set(titleXPosition, titleYPosition, 0);
  viewerUIGroup.add(titleLabel);
  const buttonWidth = 0.7;
  const buttonHeight = 0.25;
  const buttonPadding = 0.1;
  const buttonXPosition = panelWidth / 2 + buttonWidth / 2 + buttonPadding;
  const audioButton = createButton(
    "Audio",
    "play_audio",
    buttonWidth,
    buttonHeight
  );
  const audioYPosition = panelYPosition + buttonHeight / 2 + buttonPadding / 2;
  audioButton.position.set(buttonXPosition, audioYPosition, 0);
  viewerUIGroup.add(audioButton);
  const menuButton = createButton(
    "Menu",
    "back_to_menu",
    buttonWidth,
    buttonHeight
  );
  const menuYPosition = panelYPosition - buttonHeight / 2 - buttonPadding / 2;
  menuButton.position.set(buttonXPosition, menuYPosition, 0);
  viewerUIGroup.add(menuButton);
}

function createTitleLabel(text, width, height) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  canvas.width = width * resolution;
  canvas.height = height * resolution;
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 10, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  return new THREE.Mesh(geometry, material);
}

export function updateViewerUIPosition() {
  if (viewerUIGroup.children.length > 0) {
    const distance = UI_DISTANCE;
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const newPosition = new THREE.Vector3();
    newPosition
      .copy(camera.position)
      .add(cameraDirection.multiplyScalar(distance));
    viewerUIGroup.position.copy(newPosition);
    viewerUIGroup.lookAt(camera.position);
  }
}

export function createHelpPanel() {
  const helpText =
    "Selamat datang! Jika pakai komputer, klik tombol dengan mouse dan geser untuk memutar model. Jika pakai VR, arahkan laser dan tekan tombol pada controller untuk memilih dan memutar model.";
  const helpPanel = createTextPanel(helpText, 4);
  const panelHeight = helpPanel.geometry.parameters.height;
  helpPanel.position.set(0, 1.6, UI_DISTANCE);
  uiGroup.add(helpPanel);
  const closeButton = createButton("Tutup", "close_help", 1, 0.4);
  const closeButtonY = 1.6 - panelHeight / 2 - 0.4 / 2 - 0.2;
  closeButton.position.set(0, closeButtonY, UI_DISTANCE);
  uiGroup.add(closeButton);
}
