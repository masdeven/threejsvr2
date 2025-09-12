import * as THREE from "three";
import { scene, camera } from "./scene-setup.js";
import { components } from "./component-data.js";
import { isVRMode } from "./vr-manager.js";
import { quizData } from "./quiz-data.js";

export const FONT = "bold 32px Arial";
export const uiGroup = new THREE.Group();
scene.add(uiGroup);

export const viewerUIGroup = new THREE.Group();
scene.add(viewerUIGroup);

// Ganti konstanta warna di bagian atas file
const BG_COLOR = "#2D3748"; // Abu-abu kebiruan yang modern
const TEXT_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#3182CE"; // Biru sebagai warna aksen
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

// ui-creator.js

// ui-creator.js

function createButton(
  text,
  action,
  width = 1,
  height = 0.25,
  bgColor = BG_COLOR,
  shape = "roundedRectangle"
) {
  // ... (kode canvas tetap sama)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const buttonResolution = getResolution() * 2;

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
    const radius = 20 * (buttonResolution / getResolution());
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
  const baseFontSize = parseInt(FONT.split(" ")[1]);
  const fontStyle = shape === "circle" ? "normal" : FONT.split(" ")[0];
  const scaledFontSize =
    baseFontSize *
    (buttonResolution / getResolution()) *
    (shape === "circle" ? 1.2 : 1.0);
  ctx.font = `${fontStyle} ${scaledFontSize}px Arial`;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
    // PERBAIKAN: Mencegah tombol "menulis" ke depth buffer.
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

  const radius = 20;
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

  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();

  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = TEXT_COLOR;
  wrapText(ctx, text, padding, padding, maxWidth, lineHeight, true);

  ctx.shadowColor = "transparent";

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
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

// ui-creator.js

function createUIPanel(
  width,
  height,
  radius,
  color = "#1A202C",
  opacity = 0.8
) {
  // ... (kode canvas tetap sama)
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
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: opacity,
  });

  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);

  // PERBAIKAN: Atur renderOrder agar panel digambar lebih dulu.
  mesh.renderOrder = -1;

  return mesh;
}

// ui-creator.js

// ui-creator.js

export function createLandingPage(playerName) {
  // PERBAIKAN: Atur posisi Y berdasarkan mode (VR atau non-VR)
  const yPosition = isVRMode() ? 1.5 : 1.65;
  const centerPosition = new THREE.Vector3(0, yPosition, 0);

  const panelWidth = 4.0;
  const panelHeight = 1.3;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.copy(centerPosition);
  uiGroup.add(mainPanel);

  if (playerName) {
    const welcomeText = `Selamat Datang, ${playerName}!`;
    const welcomeLabel = createTitleLabel(welcomeText, 3.8, 0.35);
    welcomeLabel.position.set(
      centerPosition.x,
      centerPosition.y + 0.45,
      centerPosition.z + 0.01
    );
    uiGroup.add(welcomeLabel);
  }

  const primaryButtonWidth = 2.8;
  const primaryButtonHeight = 0.32;
  const primarySpacingY = 0.4;
  const primaryStartY = 0.1;

  const primaryButtons = [
    { text: "Mulai Belajar", action: "start", color: ACCENT_COLOR },
    { text: "Laporan Belajar", action: "show_quiz_report", color: BG_COLOR },
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
    button.position.set(
      centerPosition.x,
      centerPosition.y + buttonY,
      centerPosition.z + 0.01
    );
    uiGroup.add(button);
  });

  const creditButtonSize = 0.22;
  const creditButton = createButton(
    "ⓘ",
    "show_credits",
    creditButtonSize,
    creditButtonSize,
    "rgba(45, 55, 72, 0.7)", // Opacity sedikit dinaikkan agar lebih solid
    "circle"
  );

  const panelEdgeX = panelWidth / 2;
  const panelEdgeY = -panelHeight / 2;
  const padding = 0.2;

  creditButton.position.set(
    centerPosition.x + panelEdgeX - padding,
    centerPosition.y + panelEdgeY + padding,
    centerPosition.z + 0.02 // Posisi Z sedikit lebih maju lagi
  );

  // PERBAIKAN: Atur renderOrder agar tombol ikon digambar paling akhir.
  creditButton.renderOrder = 1;

  uiGroup.add(creditButton);
}
// ui-creator.js

// ui-creator.js

// ui-creator.js

export function createMenuPage(allComponentsUnlocked, quizHasBeenAttempted) {
  clearUI();

  // --- Gunakan Konfigurasi Posisi dan Tata Letak yang Sama dengan ViewerPage ---
  const uiBasePosition = new THREE.Vector3(-2.5, 1.5, -1.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.5, 0);

  // --- Perhitungan Dinamis untuk Ukuran Panel ---
  const columns = 3;
  const numRows = Math.ceil(components.length / columns);
  const titleHeight = 0.35;
  const materialGridHeight = numRows * 0.25 + (numRows - 1) * 0.1;
  const actionButtonsHeight = 0.3;
  const verticalPadding = 0.8;
  const panelHeight =
    titleHeight + materialGridHeight + actionButtonsHeight + verticalPadding;
  const panelWidth = 5.0;

  // 1. PANEL LATAR BELAKANG
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel);

  // 2. JUDUL HALAMAN
  const titleY = panelHeight / 2 - 0.4;
  const titleLabel = createTitleLabel("Pilih Materi", 4.0, 0.35);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  // 3. GRID TOMBOL MATERI
  const buttonWidth = 1.4;
  const buttonHeight = 0.25;
  const spacingX = 1.6;
  const spacingY = 0.35;
  const startX = -spacingX;
  const startY = titleY - 0.4;
  components.forEach((comp, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const isUnlocked = comp.unlocked;
    const buttonLabel = isUnlocked ? comp.label : "🔒 Terkunci";
    const buttonColor = isUnlocked ? BG_COLOR : "#4A5568";
    const button = createButton(
      buttonLabel,
      isUnlocked ? `select_${index}` : "locked",
      buttonWidth,
      buttonHeight,
      buttonColor
    );
    if (!isUnlocked) {
      button.userData.colors = null;
    }
    const buttonX = startX + col * spacingX;
    const buttonY = startY - row * spacingY;
    button.position.set(buttonX, buttonY, 0.01);
    viewerUIGroup.add(button);
  });

  // 4. TOMBOL AKSI DI BAWAH (DITENGahkan)
  const actionButtonWidth = 3.0; // Lebar disesuaikan
  const actionButtonHeight = 0.3;
  const actionButtonY = -panelHeight / 2 + 0.3;
  let quizButtonLabel, quizButtonAction, quizButtonColor;
  if (!allComponentsUnlocked) {
    quizButtonLabel = "Uji Pemahaman (Terkunci)";
    quizButtonAction = "locked";
    quizButtonColor = "#4A5568";
  } else if (allComponentsUnlocked && !quizHasBeenAttempted) {
    quizButtonLabel = "Uji Pemahaman";
    quizButtonAction = "show_quiz";
    quizButtonColor = ACCENT_COLOR;
  } else {
    quizButtonLabel = "Lihat Laporan";
    quizButtonAction = "show_quiz_report";
    quizButtonColor = "#28a745";
  }
  const quizButton = createButton(
    quizButtonLabel,
    quizButtonAction,
    actionButtonWidth,
    actionButtonHeight,
    quizButtonColor
  );
  if (!allComponentsUnlocked) {
    quizButton.userData.colors = null;
  }
  quizButton.position.set(0, actionButtonY, 0.01); // Posisi X diatur ke 0 (tengah)
  viewerUIGroup.add(quizButton);

  // 5. TOMBOL "X" KEMBALI (di sudut kiri atas panel)
  const exitButtonSize = 0.25;
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
    -(panelWidth / 2) + padding + exitButtonSize / 2,
    panelHeight / 2 - padding - exitButtonSize / 2,
    0.02
  );
  viewerUIGroup.add(exitButton);

  // Atur posisi dan orientasi seluruh viewerUIGroup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createViewerPage(component, index) {
  // --- Konfigurasi Posisi dan Tata Letak ---
  const uiBasePosition = new THREE.Vector3(-2.5, 1.5, -1.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.5, 0);
  const curveIntensity = 0.05; // Mengatur seberapa cekung UI

  // --- Panel Deskripsi Utama ---
  const descPanel = createTextPanel(component.description, 2.5);
  const panelHeight = descPanel.geometry.parameters.height;
  const panelWidth = descPanel.geometry.parameters.width;
  descPanel.position.set(0, 0, 0); // Titik pusat
  viewerUIGroup.add(descPanel);

  // --- Label Judul ---
  const titleWidth = 2.0;
  const titleHeight = 0.3;
  const titleLabel = createTitleLabel(component.label, titleWidth, titleHeight);
  const titleY = panelHeight / 2 + titleHeight / 2 + 0.05;
  const titleZ = -titleY * curveIntensity; // Semakin atas, semakin ke belakang
  titleLabel.position.set(0, titleY, titleZ);
  viewerUIGroup.add(titleLabel);

  // --- Tombol Navigasi ---
  const navButtonWidth = 1.2;
  const navButtonHeight = 0.25;
  const navY = -panelHeight / 2 - navButtonHeight / 2 - 0.1;
  const navZ = -navY * curveIntensity; // Semakin bawah, semakin ke depan

  if (index > 0) {
    const prevButton = createButton(
      "< Sebelumnya",
      "prev_component",
      navButtonWidth,
      navButtonHeight
    );
    prevButton.position.set(-(panelWidth / 2) + navButtonWidth / 2, navY, navZ);
    viewerUIGroup.add(prevButton);
  }

  const nextButton = createButton(
    "Berikutnya >",
    "next_component",
    navButtonWidth,
    navButtonHeight
  );
  nextButton.position.set(panelWidth / 2 - navButtonWidth / 2, navY, navZ);
  viewerUIGroup.add(nextButton);

  // --- Tombol Aksi (di luar panel) ---
  const actionButtonSize = 0.25;
  const buttonSpacing = 0.1;
  const actionX = -panelWidth / 2 - actionButtonSize / 2 - 0.15; // Posisi X di sebelah kiri panel

  // Tombol Menu (di atas)
  const menuButton = createButton(
    "X",
    "back_to_menu",
    actionButtonSize,
    actionButtonSize,
    BG_COLOR,
    "circle"
  );
  const menuY = 0.15; // Sesuaikan posisi Y sesuai kebutuhan
  const menuZ = -menuY * curveIntensity;
  menuButton.position.set(actionX, menuY, menuZ);
  viewerUIGroup.add(menuButton);

  // Tombol Audio (di bawah tombol menu)
  const audioButton = createButton(
    "🔊",
    "play_audio",
    actionButtonSize,
    actionButtonSize,
    BG_COLOR,
    "circle"
  );
  const audioY = menuY - actionButtonSize - buttonSpacing;
  const audioZ = -audioY * curveIntensity;
  audioButton.position.set(actionX, audioY, audioZ);
  viewerUIGroup.add(audioButton);

  // Posisikan dan orientasikan GROUP-nya
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
function createTitleLabel(text, width, height, color = TEXT_COLOR) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  canvas.width = width * resolution;
  canvas.height = height * resolution;

  const fontSize = Math.floor(height * resolution * 0.6);
  ctx.font = `bold ${fontSize}px "Arial Rounded MT Bold", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

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
function createSubtitleLabel(text, width, height) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  canvas.width = width * resolution;
  canvas.height = height * resolution;

  const fontSize = Math.floor(height * resolution * 0.7);
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#E2E8F0"; // Warna lebih lembut dari putih murni

  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  return new THREE.Mesh(geometry, material);
}
// ui-creator.js

/**
 * Membuat teks multi-baris tanpa latar belakang, konsisten dengan desain.
 */
function createBodyText(text, width, lineHeight = 40, fontSize = 32) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();

  // Atur font dan hitung dimensi teks
  ctx.font = `${fontSize}px Arial`;
  const textMetrics = wrapText(
    ctx,
    text,
    0,
    0,
    width * resolution,
    lineHeight * (resolution / 256),
    false
  );

  canvas.width = width * resolution;
  canvas.height = textMetrics.pixelHeight * 1.2; // Beri sedikit padding vertikal

  // Gambar teks ke canvas
  ctx.font = `${fontSize * (resolution / 256)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#E2E8F0"; // Warna teks lembut

  // Tambahkan bayangan untuk keterbacaan
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  wrapText(
    ctx,
    text,
    canvas.width / 2,
    0,
    canvas.width,
    lineHeight * (resolution / 256),
    true
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false, // Perbaikan untuk rendering
  });

  const geometry = new THREE.PlaneGeometry(width, canvas.height / resolution);
  return new THREE.Mesh(geometry, material);
}

// export function updateViewerUIPosition() {
//   if (viewerUIGroup.children.length > 0) {
//     const distance = UI_DISTANCE;
//     const cameraDirection = new THREE.Vector3();
//     camera.getWorldDirection(cameraDirection);
//     const newPosition = new THREE.Vector3();
//     newPosition
//       .copy(camera.position)
//       .add(cameraDirection.multiplyScalar(distance));
//     viewerUIGroup.position.copy(newPosition);
//     viewerUIGroup.lookAt(camera.position);
//   }
// }

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
export function createCompletionScreen(playerName) {
  clearUI(); // Hapus UI yang ada

  // --- Gunakan Konfigurasi Posisi dan Tata Letak yang Sama dengan ViewerPage ---
  const uiBasePosition = new THREE.Vector3(-2.5, 1.5, -1.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.5, 0);

  // --- Buat elemen-elemen UI ---
  let titleText = "Selamat!";
  if (playerName) {
    titleText = `Selamat, ${playerName}!`;
  }
  const titleLabel = createTitleLabel(titleText, 3.5, 0.4);

  const messageText =
    "Semua materi sudah berhasil kamu pelajari! Sekarang, ayo uji pemahamanmu dengan mengerjakan kuis pada menu utama.";
  const messagePanel = createTextPanel(messageText, 4.0);
  const panelHeight = messagePanel.geometry.parameters.height;

  const quizButton = createButton(
    "Lanjutkan ke Menu",
    "back_to_menu",
    3.0,
    0.3
  );

  // --- Atur Posisi Relatif terhadap Grup ---
  const titleY = panelHeight / 2 + 0.3;
  titleLabel.position.set(0, titleY, 0.01);

  messagePanel.position.set(0, 0, 0);

  const buttonY = -panelHeight / 2 - 0.25;
  quizButton.position.set(0, buttonY, 0.01);

  // --- Tambahkan semua elemen ke viewerUIGroup ---
  viewerUIGroup.add(titleLabel);
  viewerUIGroup.add(messagePanel);
  viewerUIGroup.add(quizButton);

  // Atur posisi dan orientasi seluruh viewerUIGroup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
// ui-creator.js

// ui-creator.js

// ui-creator.js

// ui-creator.js

// ui-creator.js

export function createCreditsScreen() {
  clearUI();

  const uiBasePosition = new THREE.Vector3(-2.5, 1.5, -1.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.5, 0);
  const curveIntensity = 0.05;

  // 1. Panel Teks Utama
  const creditsContent = `Aplikasi ini dikembangkan sebagai media pembelajaran interaktif komponen komputer berbasis WebXR.

Pengembang: Mas Deven
Teknologi: Three.js, WebXR API

Aset 3D & Komponen:
- Model Ruangan, Motherboard, CPU, RAM, GPU, Storage, PSU, Casing, Kipas, Monitor, Keyboard, Mouse, Speaker oleh [Sumber Aset Anda]

Terima kasih atas dukungan dan partisipasi Anda dalam belajar bersama kami.
`;
  const descPanel = createTextPanel(creditsContent, 2.5);
  const panelHeight = descPanel.geometry.parameters.height;
  const panelWidth = descPanel.geometry.parameters.width;
  descPanel.position.set(0, 0, 0);
  viewerUIGroup.add(descPanel);

  // 2. Judul (di atas panel utama)
  const titleWidth = 2.0;
  const titleHeight = 0.3;
  const titleLabel = createTitleLabel(
    "Tentang Aplikasi",
    titleWidth,
    titleHeight
  );
  const titleY = panelHeight / 2 + titleHeight / 2 + 0.05;
  const titleZ = -titleY * curveIntensity;
  titleLabel.position.set(0, titleY, titleZ);
  viewerUIGroup.add(titleLabel);

  // 3. Tombol "X" Kembali (di luar panel kiri atas)
  const exitButtonSize = 0.25;
  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    "rgba(45, 55, 72, 0.7)",
    "circle"
  );

  // Atur posisi agar sejajar dengan sudut kiri atas panel deskripsi
  const exitX = -(panelWidth / 2) - exitButtonSize / 2 - 0.15; // Di sebelah kiri panel
  const exitY = panelHeight / 2 - exitButtonSize / 2; // Sejajar dengan tepi atas panel deskripsi
  const exitZ = -exitY * curveIntensity;
  exitButton.position.set(exitX, exitY, exitZ);
  viewerUIGroup.add(exitButton);

  // Atur posisi dan orientasi seluruh viewerUIGroup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

export function createQuizScreen(questionIndex) {
  const currentQuestion = quizData[questionIndex];

  const questionPanel = createTextPanel(currentQuestion.question, 4.5);
  const panelHeight = questionPanel.geometry.parameters.height;
  questionPanel.position.set(0, 1.8, 0);
  uiGroup.add(questionPanel);

  const buttonWidth = 2.0;
  const buttonHeight = 0.4;
  const buttonY = 1.8 - panelHeight / 2 - buttonHeight / 2 - 0.2;

  const positions = [-1.1, 1.1];
  const shuffledPositions = positions.sort(() => Math.random() - 0.5);

  currentQuestion.answers.forEach((answer, index) => {
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "answer_correct" : "answer_incorrect";
    const button = createButton(answer, action, buttonWidth, buttonHeight);

    button.position.set(shuffledPositions[index], buttonY, 0);
    uiGroup.add(button);
  });
}
export function createQuizResultScreen(isCorrect, questionIndex) {
  const currentQuestion = quizData[questionIndex];
  const isLastQuestion = questionIndex >= quizData.length - 1;

  const titleText = isCorrect ? "Jawaban Benar!" : "Jawaban Salah!";
  const titleColor = isCorrect ? "#28a745" : "#dc3545";

  const titleLabel = createTitleLabel(titleText, 3.5, 0.5, titleColor);
  titleLabel.position.set(0, 2.4, 0);
  uiGroup.add(titleLabel);

  const explanationText = `Soal: ${
    currentQuestion.question
  }, dan jawaban yang benar adalah ${
    currentQuestion.answers[currentQuestion.correctAnswerIndex]
  }.`;

  const explanationPanel = createTextPanel(explanationText, 4.5);
  const panelHeight = explanationPanel.geometry.parameters.height;
  explanationPanel.position.set(0, 1.6, 0);
  uiGroup.add(explanationPanel);

  const backButton = createButton("Lanjutkan", "next_question", 2.5, 0.5);
  const buttonHeight = backButton.geometry.parameters.height;
  const buttonY = 1.6 - panelHeight / 2 - buttonHeight / 2 - 0.2;
  backButton.position.set(0, buttonY, 0);
  uiGroup.add(backButton);
}

// ui-creator.js

// ui-creator.js

// ui-creator.js

// ui-creator.js

// ui-creator.js
function createScoreLabel(text, size, color = ACCENT_COLOR) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();

  canvas.width = size * resolution;
  canvas.height = size * resolution;

  const fontSize = Math.floor(size * resolution * 0.8); // Font sangat besar
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
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(size, size);
  return new THREE.Mesh(geometry, material);
}
export function createQuizReportScreen(score, hasAttempted) {
  clearUI();

  // --- Gunakan Konfigurasi Posisi dan Tata Letak yang Sama dengan ViewerPage ---
  const uiBasePosition = new THREE.Vector3(-2.5, 1.5, -1.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.5, 0);

  // 1. PANEL LATAR BELAKANG
  const panelWidth = 4.8;
  const panelHeight = 2.0;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0); // Posisi relatif terhadap grup
  viewerUIGroup.add(mainPanel);

  // 2. JUDUL
  const titleText = hasAttempted
    ? "Laporan Belajar Anda"
    : "Laporan Belum Tersedia";
  const titleLabel = createTitleLabel(titleText, 4.0, 0.35);
  titleLabel.position.set(0, 0.8, 0.01);
  viewerUIGroup.add(titleLabel);

  if (!hasAttempted) {
    // Tampilan jika kuis belum dikerjakan
    const reportText =
      "Anda harus menyelesaikan semua materi dan mengerjakan Uji Pemahaman terlebih dahulu untuk melihat laporan nilai.";
    const reportBody = createBodyText(reportText, 4.2);
    reportBody.position.set(0, 0, 0.01);
    viewerUIGroup.add(reportBody);
  } else {
    // Tampilan jika kuis sudah dikerjakan
    const totalQuestions = quizData.length;
    const finalScore = (score / totalQuestions) * 100;

    // Label "Nilai Akhir"
    const scoreTitle = createSubtitleLabel("Nilai Akhir", 2.0, 0.2);
    scoreTitle.position.set(0, 0.4, 0.01);
    viewerUIGroup.add(scoreTitle);

    // Skor utama
    const scoreDisplay = createScoreLabel(finalScore.toFixed(0), 1.0);
    scoreDisplay.position.set(0, -0.1, 0.01);
    viewerUIGroup.add(scoreDisplay);

    // Teks detail
    const detailText = `Anda berhasil menjawab ${score} dari ${totalQuestions} soal dengan benar.`;
    const reportBody = createBodyText(detailText, 4.2, 35, 28);
    reportBody.position.set(0, -0.6, 0.01);
    viewerUIGroup.add(reportBody);
  }

  // --- Tombol "X" Kembali ke Awal (di sudut kiri atas panel) ---
  const exitButtonSize = 0.25;
  const padding = 0.15; // Jarak dari tepi panel

  const exitButton = createButton(
    "X",
    "back_to_landing",
    exitButtonSize,
    exitButtonSize,
    "rgba(45, 55, 72, 0.7)", // Warna sedikit gelap
    "circle"
  );

  // Hitung posisi di sudut kiri atas panel
  exitButton.position.set(
    -(panelWidth / 2) + padding + exitButtonSize / 2, // Kiri atas
    panelHeight / 2 - padding - exitButtonSize / 2, // Kiri atas
    0.02 // Sedikit di depan panel
  );
  viewerUIGroup.add(exitButton);

  // Atur posisi dan orientasi seluruh viewerUIGroup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
export function createMiniQuizPage(component) {
  // --- Gunakan Konfigurasi Posisi dan Tata Letak yang Sama dengan ViewerPage ---
  const uiBasePosition = new THREE.Vector3(-2.5, 1.5, -1.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.5, 0);
  const curveIntensity = 0.05; // Mengatur seberapa cekung UI

  const currentQuestion = component.quiz[0];

  // --- Panel Pertanyaan (sebagai pengganti panel deskripsi) ---
  const questionPanel = createTextPanel(currentQuestion.question, 2.5); // Lebar disamakan dengan deskripsi
  const panelHeight = questionPanel.geometry.parameters.height;
  questionPanel.position.set(0, 0, 0); // Titik pusat
  viewerUIGroup.add(questionPanel);

  // --- Judul Halaman Mini Quiz ---
  const titleWidth = 2.0;
  const titleHeight = 0.3;
  const titleLabel = createTitleLabel("Kuis Singkat", titleWidth, titleHeight);
  const titleY = panelHeight / 2 + titleHeight / 2 + 0.05;
  const titleZ = -titleY * curveIntensity;
  titleLabel.position.set(0, titleY, titleZ);
  viewerUIGroup.add(titleLabel);

  // --- PENYESUAIAN TOMBOL ---
  const buttonWidth = 1.2; // Lebar tombol diperkecil dari 2.0 menjadi 1.2
  const buttonHeight = 0.25;
  const buttonY = -panelHeight / 2 - buttonHeight / 2 - 0.1;
  const buttonZ = -buttonY * curveIntensity;
  // Sesuaikan posisi X agar tombol lebih ke tengah
  const positions = [-0.8, 0.8];

  currentQuestion.answers.forEach((answer, index) => {
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "mini_quiz_correct" : "mini_quiz_incorrect";
    const button = createButton(answer, action, buttonWidth, buttonHeight);

    // Gunakan posisi X dari array 'positions' dan Y/Z yang sudah dihitung
    button.position.set(positions[index], buttonY, buttonZ);
    viewerUIGroup.add(button);
  });

  // Posisikan dan orientasikan GROUP-nya, sama seperti di ViewerPage
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
export function createMiniQuizResultPage(isCorrect) {
  // --- Gunakan Konfigurasi Posisi dan Tata Letak yang Sama dengan ViewerPage ---
  const uiBasePosition = new THREE.Vector3(-2.5, 1.5, -1.5);
  const uiLookAtPosition = new THREE.Vector3(0, 1.5, 0);
  const curveIntensity = 0.05;

  // --- Teks Pesan Hasil ---
  const messageText = isCorrect
    ? "Bagus! Kamu sudah memahami materi ini. Ayo lanjut ke materi berikutnya."
    : "Jangan khawatir, coba pelajari lagi materinya untuk lebih paham.";
  const messagePanel = createTextPanel(messageText, 2.5); // Lebar disamakan
  const panelHeight = messagePanel.geometry.parameters.height;
  messagePanel.position.set(0, 0, 0); // Titik pusat
  viewerUIGroup.add(messagePanel);

  // --- Judul Hasil (Benar/Salah) ---
  const titleText = isCorrect ? "Jawaban Benar!" : "Jawaban Salah!";
  const titleColor = isCorrect ? "#28a745" : "#dc3545";
  const titleWidth = 2.0;
  const titleHeight = 0.3;

  const titleLabel = createTitleLabel(
    titleText,
    titleWidth,
    titleHeight,
    titleColor
  );
  const titleY = panelHeight / 2 + titleHeight / 2 + 0.05;
  const titleZ = -titleY * curveIntensity;
  titleLabel.position.set(0, titleY, titleZ);
  viewerUIGroup.add(titleLabel);

  // --- Tombol Lanjutkan ---
  const continueButton = createButton(
    "Lanjutkan",
    "continue_after_mini_quiz",
    2.0, // Lebar disamakan
    0.25 // Tinggi disamakan
  );
  const buttonY = -panelHeight / 2 - 0.25 / 2 - 0.1;
  const buttonZ = -buttonY * curveIntensity;
  continueButton.position.set(0, buttonY, buttonZ);
  viewerUIGroup.add(continueButton);

  // Posisikan dan orientasikan GROUP-nya, sama seperti di halaman lain
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
export function createModeSelectionPage() {
  const titleLabel = createTitleLabel("Pilih Mode Pengalaman", 4, 0.5);
  titleLabel.position.set(0, 2.3, 0); // Diubah menjadi 0
  uiGroup.add(titleLabel);

  const buttonWidth = 2.5;
  const buttonHeight = 0.4;
  const spacing = 0.2;
  const startY = 1.6;

  // Tombol untuk Mode Browser
  const browserButton = createButton(
    "Mode Browser",
    "start_browser",
    buttonWidth,
    buttonHeight
  );
  browserButton.position.set(0, startY, 0); // Diubah menjadi 0
  uiGroup.add(browserButton);

  // Tombol untuk Mode VR
  const vrButton = createButton(
    "Mode VR",
    "start_vr",
    buttonWidth,
    buttonHeight
  );
  vrButton.position.set(0, startY - (buttonHeight + spacing), 0); // Diubah menjadi 0
  uiGroup.add(vrButton);
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
function createScrollableTextPanel(text, viewportWidth, viewportHeight) {
  const scrollableGroup = new THREE.Group();

  // 1. Definisikan area clipping (agar teks tidak keluar dari viewport)
  const clippingPlanes = [
    new THREE.Plane(new THREE.Vector3(0, 1, 0), viewportHeight / 2),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), viewportHeight / 2),
  ];

  // 2. Buat panel konten yang panjang
  const contentWidth = viewportWidth * 0.9; // Konten sedikit lebih sempit
  const contentText = createBodyText(text, contentWidth);

  // Terapkan clipping ke material konten
  contentText.material.clippingPlanes = clippingPlanes;
  contentText.material.needsUpdate = true;

  const contentHeight = contentText.geometry.parameters.height;

  // Hanya tampilkan scrollbar jika konten lebih panjang dari viewport
  const isScrollable = contentHeight > viewportHeight;

  // Posisi awal konten (bagian atas terlihat)
  // Posisi awal konten (bagian atas terlihat)
  contentText.position.y = (contentHeight - viewportHeight) / 2;
  scrollableGroup.add(contentText);

  if (isScrollable) {
    // 3. Buat Scrollbar (tombol atas dan bawah)
    const scrollButtonSize = 0.2;
    const scrollbarX = viewportWidth / 2 - scrollButtonSize / 2 - 0.05;

    const upButton = createButton(
      "▲",
      "scroll_up",
      scrollButtonSize,
      scrollButtonSize,
      BG_COLOR,
      "circle"
    );
    upButton.position.set(
      scrollbarX,
      viewportHeight / 2 - scrollButtonSize / 2 - 0.05,
      0.01
    );
    scrollableGroup.add(upButton);

    const downButton = createButton(
      "▼",
      "scroll_down",
      scrollButtonSize,
      scrollButtonSize,
      BG_COLOR,
      "circle"
    );
    downButton.position.set(
      scrollbarX,
      -viewportHeight / 2 + scrollButtonSize / 2 + 0.05,
      0.01
    );
    scrollableGroup.add(downButton);

    // 4. Simpan data penting untuk interaksi scroll
    scrollableGroup.userData = {
      isScrollable: true,
      content: contentText,
      // Batas atas dan bawah untuk posisi Y konten
      scrollBounds: {
        top: (contentHeight - viewportHeight) / 2,
        bottom: -(contentHeight - viewportHeight) / 2,
      },
    };
    upButton.userData.scrollParent = scrollableGroup;
    downButton.userData.scrollParent = scrollableGroup;
  }

  return scrollableGroup;
}
