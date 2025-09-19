import * as THREE from "three";
import { scene, camera } from "./scene-setup.js";
import { components } from "./component-data.js";
import { isVRMode } from "./vr-manager.js";
import { quizData } from "./quiz-data.js";
import { loader } from "./model-loader.js"; // Tambahkan ini
import { TextureLoader } from "three";

export const FONT = "bold 32px Arial";
export const uiGroup = new THREE.Group();
scene.add(uiGroup);

export const viewerUIGroup = new THREE.Group();
scene.add(viewerUIGroup);

let avatarMixer; // Tambahkan ini
// export const avatarContainerGroup = new THREE.Group();
// scene.add(avatarContainerGroup);
let currentAvatar = null;

const BG_COLOR = "#2D3748";
const TEXT_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#3182CE";
const UI_DISTANCE = 2.5;
const textureLoader = new TextureLoader();

export function getResolution() {
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

  // --- AWAL PERBAIKAN ---
  const vrFontScale = 1.2; // Faktor skala yang sama seperti label
  const resolution = getResolution(); // Gunakan resolusi dasar untuk kalkulasi
  const fontStyle = shape === "circle" ? "normal" : FONT.split(" ")[0];

  // Hitung ukuran font berdasarkan tinggi 3D tombol agar konsisten
  // Angka 1.4 adalah pengali agar teks pas mengisi tinggi tombol
  let baseFontSize = height * resolution * 1;

  if (shape === "circle") {
    baseFontSize *= 1.2; // Beri sedikit penyesuaian untuk tombol lingkaran
  }

  const finalFontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  ctx.font = `${fontStyle} ${finalFontSize}px Arial`;
  // --- AKHIR PERBAIKAN ---

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // --- PENYESUAIAN UNTUK PUSAT IKON ---
  // Menambahkan sedikit offset vertikal untuk beberapa ikon/karakter
  const verticalOffset = shape === "circle" ? finalFontSize * 0.05 : 0;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + verticalOffset);
  // --- AKHIR PENYESUAIAN ---

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;

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
  };

  return mesh;
}

function createTextPanel(text, width, options = {}) {
  const { footerHeight = 0 } = options;
  const MAX_PANEL_HEIGHT_3D = 1.2;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // --- AWAL PERBAIKAN: Logika Font Dinamis ---
  const BASE_FONT_SIZE_PX = 26; // Ukuran font dasar untuk browser (dalam piksel)
  const vrFontScale = 2; // Faktor skala khusus VR (sesuaikan jika perlu)

  const finalFontSize = Math.round(
    isVRMode() ? BASE_FONT_SIZE_PX * vrFontScale : BASE_FONT_SIZE_PX
  );
  // Hitung tinggi baris secara dinamis, 120% dari ukuran font
  const lineHeight = Math.round(finalFontSize * 1.2);
  const font = `${finalFontSize}px Arial`;
  // --- AKHIR PERBAIKAN ---

  const padding = 25;
  const resolution = getResolution();

  ctx.font = font;
  const canvasWidth = width * resolution;
  const maxWidth = canvasWidth - padding * 2;

  const textMetrics = wrapText(ctx, text, 0, 0, maxWidth, lineHeight, false);
  const totalTextPixelHeight = textMetrics.pixelHeight;
  const footerPixelHeight = footerHeight * resolution;

  let finalPanelHeight3D =
    (totalTextPixelHeight + padding * 2 + footerPixelHeight) / resolution;

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

      // Hapus child dari grup
      group.remove(child);
    }
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

export function toggleAvatarVisibility(visible) {
  if (currentAvatar) {
    currentAvatar.visible = visible;
  }
}

// Tambahkan fungsi ini
export function updateAvatar(deltaTime) {
  if (avatarMixer) {
    avatarMixer.update(deltaTime);
  }
}
// ui-creator.js

// ... (kode lainnya tetap sama)

export function createLandingPage(playerName) {
  // --- Gunakan pengaturan posisi yang konsisten seperti halaman laporan ---
  const uiBasePosition = new THREE.Vector3(0, 1.6, -3);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  // --- Semua elemen sekarang ditambahkan ke viewerUIGroup dengan posisi LOKAL ---

  const panelWidth = 4.0;
  const panelHeight = 1.3;
  const mainPanel = createUIPanel(panelWidth, panelHeight, 0.1);
  mainPanel.position.set(0, 0, 0); // Posisi lokal di pusat grup
  viewerUIGroup.add(mainPanel); // DIUBAH: Menggunakan viewerUIGroup

  const logoWidth = 0.3;
  const logoHeight = 0.3;
  const logoPanel = createImagePanel(
    "assets/images/logo-kampus.png",
    logoWidth,
    logoHeight
  );

  const paddingLogo = 0.1;
  // Posisi logo dihitung relatif terhadap panel (pusat grup)
  logoPanel.position.set(
    -panelWidth / 2 + logoWidth / 2 + paddingLogo,
    panelHeight / 2 - logoHeight / 2 - paddingLogo,
    0.02 // Sedikit di depan panel utama
  );
  logoPanel.renderOrder = 1;
  viewerUIGroup.add(logoPanel); // DIUBAH: Menggunakan viewerUIGroup

  if (playerName) {
    const welcomeText = `Selamat Datang, ${playerName}!`;
    const welcomeLabel = createTitleLabel(welcomeText, 3.8, 0.35);
    // Posisi label dihitung relatif terhadap panel (pusat grup)
    welcomeLabel.position.set(0, 0.45, 0.01);
    viewerUIGroup.add(welcomeLabel); // DIUBAH: Menggunakan viewerUIGroup
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
    // Posisi tombol dihitung relatif terhadap panel (pusat grup)
    button.position.set(0, buttonY, 0.01);
    viewerUIGroup.add(button); // DIUBAH: Menggunakan viewerUIGroup
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
  // Posisi tombol kredit dihitung relatif terhadap panel (pusat grup)
  creditButton.position.set(panelEdgeX - padding, panelEdgeY + padding, 0.02);
  creditButton.renderOrder = 1;
  viewerUIGroup.add(creditButton); // DIUBAH: Menggunakan viewerUIGroup

  loader.load("assets/models/bot.glb", (gltf) => {
    const model = gltf.scene;
    currentAvatar = model;
    model.scale.set(0.4, 0.4, 0.4);

    // Posisi avatar dihitung relatif terhadap panel (pusat grup)
    const avatarX = -panelWidth / 2 - 0.2;
    const avatarY = -panelHeight / 2 - 0.2;
    const avatarZ = 0.05;
    model.position.set(avatarX, avatarY, avatarZ);

    viewerUIGroup.add(model); // DIUBAH: Menggunakan viewerUIGroup

    if (gltf.animations && gltf.animations.length) {
      avatarMixer = new THREE.AnimationMixer(model);
      const action = avatarMixer.clipAction(gltf.animations[0]);
      action.play();
    }
  });

  // --- DITAMBAHKAN: Atur posisi dan orientasi seluruh grup ---
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

// ... (kode lainnya tetap sama)
function createImagePanel(imageUrl, width, height) {
  const texture = textureLoader.load(imageUrl);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// ui-creator.js

// ... (kode lainnya tetap sama)

export function createMenuPage(allComponentsUnlocked, quizHasBeenAttempted) {
  // --- POSISI GROUP: Sama seperti Laporan Belajar ---
  const uiBasePosition = new THREE.Vector3(0, 1.6, -2);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5); // Target look-at sama dengan Laporan Belajar

  // --- Konfigurasi Tata Letak Melingkar (LOKAL) ---
  const localCenterY = 0;
  const radius = 3.5;
  const angleSpan = Math.PI * 0.8;
  const itemsPerRow = 5;
  const rowHeight = 0.5;
  const localLookAtTarget = new THREE.Vector3(0, localCenterY, 5);

  // --- AWAL MODIFIKASI: Menambahkan Latar Belakang pada Judul ---
  const titleY = localCenterY + 0.9;
  const titleZ = -(radius - 1);

  // 1.A. Latar Belakang Judul
  const titleBgWidth = 4.2;
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

  // 1.B. Teks Judul
  const titleLabel = createTitleLabel("Pilih Materi", 4.0, 0.35);
  // Posisikan sedikit di depan latar belakangnya untuk menghindari tumpang tindih
  titleLabel.position.set(0, titleY, titleZ + 0.01);
  titleLabel.lookAt(localLookAtTarget);
  viewerUIGroup.add(titleLabel);
  // --- AKHIR MODIFIKASI ---

  // 2. GRID TOMBOL MATERI MELINGKAR
  const startAngle = -angleSpan / 2;
  const angleStep = angleSpan / (itemsPerRow - 1);

  components.forEach((comp, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;

    const angle = startAngle + col * angleStep;
    const isUnlocked = comp.unlocked;
    const buttonLabel = isUnlocked ? comp.label : "🔒 Terkunci";
    const buttonColor = isUnlocked ? BG_COLOR : "#4A5568";
    const button = createButton(
      buttonLabel,
      isUnlocked ? `select_${index}` : "locked",
      1.4,
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

  // 3. Tombol Aksi di bagian bawah
  const actionButtonY = localCenterY - 0.8;
  const actionZ = -(radius - 1.5);
  const actionSpacingX = 2.4;

  const exitButton = createButton("Kembali", "back_to_landing", 2.2, 0.3);
  exitButton.position.set(-actionSpacingX / 2, actionButtonY, actionZ);
  exitButton.lookAt(localLookAtTarget);
  viewerUIGroup.add(exitButton);

  let quizButtonLabel, quizButtonAction, quizButtonColor;
  if (!allComponentsUnlocked) {
    quizButtonLabel = "Tes Akhir (Terkunci)";
    quizButtonAction = "locked";
    quizButtonColor = "#4A5568";
  } else if (allComponentsUnlocked && !quizHasBeenAttempted) {
    quizButtonLabel = "Tes Akhir";
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

  // Atur posisi dan orientasi seluruh grup UI, sama seperti layar Laporan Belajar
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

// ... (kode lainnya tetap sama)

// ... (kode lainnya tetap sama)

export function createViewerPage(component, index, descriptionIndex = 0) {
  // --- Konfigurasi Posisi dan Tata Letak ---
  const uiBasePosition = new THREE.Vector3(-2.5, 1.6, -3);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 0);

  clearViewerUI();

  // --- 1. Panel Latar Belakang Utama ---
  const totalPanelWidth = 4;
  const totalPanelHeight = 2.3; // Anda bisa sesuaikan nilai ini
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

  // --- 2. Label Judul (Dipindahkan ke atas & Posisinya Diubah) ---
  const titleWidth = 2.8; // Sedikit disesuaikan agar pas
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel(component.label, titleWidth, titleHeight);

  // --- PENYESUAIAN KUNCI ---
  // Posisi Y judul sekarang dihitung dari tepi atas panel utama.
  const topPadding = 0.1; // Jarak dari tepi atas
  const titleY = totalPanelHeight / 2 - titleHeight / 2 - topPadding;

  titleLabel.position.set(0, titleY, 0.02);
  titleLabel.renderOrder = 2;
  viewerUIGroup.add(titleLabel);

  // --- 3. Panel Deskripsi ---
  const currentDescription = component.description[descriptionIndex];
  const descPanel = createTextPanel(currentDescription, 2.8); // Lebar disesuaikan
  const panelHeight = descPanel.geometry.parameters.height;
  const panelWidth = descPanel.geometry.parameters.width;

  // --- PENYESUAIAN KUNCI ---
  // Posisi Y panel deskripsi sekarang berada di bawah judul.
  const descPanelYOffset = titleY - titleHeight / 2 - panelHeight / 2 - 0.05;

  descPanel.position.set(0, descPanelYOffset, 0.01);
  descPanel.renderOrder = 1;
  viewerUIGroup.add(descPanel);

  // --- 4. Tombol Navigasi Deskripsi ---
  // Perhitungan posisi tombol ini tidak berubah, karena sudah relatif terhadap panel deskripsi.
  const descNavY = descPanelYOffset - panelHeight / 2 - 0.15;
  if (component.description.length > 1) {
    const rightEdgeX = panelWidth / 2;
    // --- PENYESUAIAN --- Tombol dibuat lebih pendek (persegi)
    const buttonWidth = 0.25;
    const indicatorWidth = 0.6;
    // --- PENYESUAIAN --- Jarak antar elemen dipersempit
    const padding = 0.05;
    let currentX = rightEdgeX;

    // Tombol Next
    const isLastPage = descriptionIndex >= component.description.length - 1;
    const nextDescButton = createButton(
      ">",
      isLastPage ? "locked" : "next_description",
      buttonWidth,
      0.2,
      isLastPage ? "#4A5568" : BG_COLOR
    );
    if (isLastPage) nextDescButton.userData.colors = null;
    const nextButtonX = currentX - buttonWidth / 2;
    nextDescButton.position.set(nextButtonX, descNavY, 0.01);
    nextDescButton.renderOrder = 1;
    viewerUIGroup.add(nextDescButton);
    currentX = nextButtonX - buttonWidth / 2 - padding;

    // Indeks Halaman
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

    // Tombol Prev
    const isFirstPage = descriptionIndex <= 0;
    const prevDescButton = createButton(
      "<",
      isFirstPage ? "locked" : "prev_description",
      buttonWidth,
      0.2,
      isFirstPage ? "#4A5568" : BG_COLOR
    );
    if (isFirstPage) prevDescButton.userData.colors = null;
    const prevButtonX = currentX - buttonWidth / 2;
    prevDescButton.position.set(prevButtonX, descNavY, 0.01);
    prevDescButton.renderOrder = 1;
    viewerUIGroup.add(prevDescButton);
  }

  // --- 5. Tombol Navigasi Komponen ---
  const navButtonWidth = 1.2;
  const navButtonHeight = 0.25;
  const navY = -totalPanelHeight / 2 + navButtonHeight / 2 + 0.1;
  const navZ = 0.01;

  if (index > 0) {
    const prevButton = createButton(
      "< Sebelumnya",
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
  }

  const nextButton = createButton(
    "Berikutnya >",
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

  // --- 6. Tombol Aksi ---
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

  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

// Tambahkan fungsi helper baru untuk membersihkan UI viewer saja
export function clearViewerUI() {
  viewerUIGroup.children.forEach((child) => {
    child.geometry.dispose();
    child.material.map?.dispose();
    child.material.dispose();
  });
  viewerUIGroup.clear();
}
function createTitleLabel(text, width, height, color = TEXT_COLOR) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  canvas.width = width * resolution;
  canvas.height = height * resolution;

  // --- AWAL PERBAIKAN ---
  const vrFontScale = 1.2; // Faktor skala tambahan untuk keterbacaan di VR
  const baseFontSize = height * resolution * 0.6;
  const fontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  // --- AKHIR PERBAIKAN ---

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
// ui-creator.js

function createSubtitleLabel(text, width, height) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();
  canvas.width = width * resolution;
  canvas.height = height * resolution;

  // --- AWAL PERBAIKAN ---
  const vrFontScale = 1.2; // Faktor skala tambahan untuk keterbacaan di VR
  const baseFontSize = height * resolution * 0.7;
  const fontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  // --- AKHIR PERBAIKAN ---

  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#E2E8F0";

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

function createBodyText(text, width, lineHeight = 40, fontSize = 32) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();

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
  canvas.height = textMetrics.pixelHeight * 1.2;

  ctx.font = `${fontSize * (resolution / 256)}px Arial`;
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
      (Math.random() - 0.5) * 5, // Sebaran horizontal
      2.5 + Math.random() * 2, // Mulai dari atas
      (Math.random() - 0.5) * 2 // Sebaran kedalaman
    );

    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
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

      // Jika sudah jatuh di bawah, reset ke atas
      if (particle.position.y < 0) {
        particle.position.y = 3.5;
        particle.position.x = (Math.random() - 0.5) * 5;
      }
    }
  }

  function destroy() {
    // Hapus grup partikel dari scene utama
    scene.remove(particles);
    // Kosongkan memori dari geometri dan material (opsional, tapi praktik yang baik)
    particles.children.forEach((child) => {
      child.geometry.dispose();
      child.material.dispose();
    });
  }

  return { update, destroy };
}

// Ganti fungsi createCompletionScreen yang lama dengan yang ini:
export function createCompletionScreen(playerName) {
  clearUI();

  // --- Gunakan Konfigurasi Posisi yang Sama dengan Laporan Belajar ---
  const uiBasePosition = new THREE.Vector3(0, 1.6, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  // Panel utama
  const panelWidth = 4.0;
  const panelHeight = 1.8;
  const mainPanel = createUIPanel(
    panelWidth,
    panelHeight,
    0.1,
    "#1A202C",
    0.95
  );
  mainPanel.position.set(0, 0, 0); // Posisi relatif terhadap grup
  viewerUIGroup.add(mainPanel); // Pindahkan ke viewerUIGroup

  // Judul "Luar Biasa!"
  let titleText = `Luar Biasa, ${playerName}!`;
  const titleLabel = createTitleLabel(titleText, 3.8, 0.4, "#FFD700");
  titleLabel.position.set(0, 0.5, 0.01); // Sesuaikan posisi Y relatif
  viewerUIGroup.add(titleLabel); // Pindahkan ke viewerUIGroup

  // Teks pesan
  const messageText =
    "Kamu telah berhasil menyelesaikan semua materi pembelajaran.\nSaatnya menguji pemahamanmu di Tes Akhir!";
  const messageBody = createBodyText(messageText, 3.5, 40, 30);
  messageBody.position.set(0, 0, 0.01); // Sesuaikan posisi Y relatif
  viewerUIGroup.add(messageBody); // Pindahkan ke viewerUIGroup

  // Tombol Lanjutkan
  const quizButton = createButton(
    "Lanjutkan ke Menu",
    "back_to_menu",
    3.0,
    0.3,
    ACCENT_COLOR
  );
  quizButton.position.set(0, -0.6, 0.01); // Sesuaikan posisi Y relatif
  viewerUIGroup.add(quizButton); // Pindahkan ke viewerUIGroup

  // --- TAMBAHKAN AVATAR ---
  loader.load("assets/models/bot.glb", (gltf) => {
    const model = gltf.scene;
    currentAvatar = model; // Simpan referensi model
    model.scale.set(0.5, 0.5, 0.5);

    // Posisikan avatar di samping kiri panel
    const avatarX = -panelWidth / 2 - 0.5;
    const avatarY = -panelHeight / 2 - 0.2;
    model.position.set(avatarX, avatarY, 0.1);

    // Tambahkan avatar ke grup UI yang sama dengan panel
    viewerUIGroup.add(model);

    if (gltf.animations && gltf.animations.length) {
      avatarMixer = new THREE.AnimationMixer(model);
      const action = avatarMixer.clipAction(gltf.animations[0]);
      action.play();
    }
  });

  // Atur posisi dan orientasi seluruh grup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);

  // Aktifkan dan return efek konfeti
  const confetti = createConfettiEffect();
  return confetti;
}
// Ganti fungsi createCreditsScreen yang lama dengan yang ini:
export function createCreditsScreen(creditPages, pageIndex) {
  // --- Gunakan posisi meja yang sudah kita tentukan ---
  const uiBasePosition = new THREE.Vector3(0, 1.6, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  clearViewerUI(); // Hapus UI sebelumnya di grup ini

  // --- 1. Panel Latar Belakang Utama (Mirip Viewer) ---
  const totalPanelWidth = 3.0;
  const totalPanelHeight = 1.7;
  const backgroundPanel = createUIPanel(
    totalPanelWidth,
    totalPanelHeight,
    0.05,
    "#1A202C",
    0.9
  );
  backgroundPanel.position.set(0, 0, 0);
  viewerUIGroup.add(backgroundPanel);

  // --- 2. Panel Deskripsi/Teks Kredit ---
  const currentCreditText = creditPages[pageIndex];
  const descPanel = createTextPanel(currentCreditText, 2.5);
  const panelHeight = descPanel.geometry.parameters.height;
  const panelWidth = descPanel.geometry.parameters.width;
  descPanel.position.set(0, 0.15, 0.01); // Naikkan sedikit
  viewerUIGroup.add(descPanel);

  // --- 3. Label Judul ---
  const titleWidth = 2.2;
  const titleHeight = 0.35;
  const titleLabel = createTitleLabel(
    "Tentang Aplikasi",
    titleWidth,
    titleHeight
  );
  const titleY = 0.15 + panelHeight / 2 + titleHeight / 2 - 0.05;
  titleLabel.position.set(0, titleY, 0.02);
  viewerUIGroup.add(titleLabel);

  // --- 4. Tombol Navigasi Halaman (Mirip Viewer) ---
  const descNavY = 0.15 - panelHeight / 2 - 0.15;
  const rightEdgeX = panelWidth / 2;
  const buttonWidth = 0.25;
  const indicatorWidth = 0.6;
  const padding = 0.05;
  let currentX = rightEdgeX;

  // Tombol Next
  const isLastPage = pageIndex >= creditPages.length - 1;
  const nextDescButton = createButton(
    ">",
    isLastPage ? "locked" : "next_credit",
    buttonWidth,
    0.2,
    isLastPage ? "#4A5568" : BG_COLOR
  );
  if (isLastPage) nextDescButton.userData.colors = null;
  const nextButtonX = currentX - buttonWidth / 2;
  nextDescButton.position.set(nextButtonX, descNavY, 0.01);
  viewerUIGroup.add(nextDescButton);
  currentX = nextButtonX - buttonWidth / 2 - padding;

  // Indeks Halaman
  const pageIndicatorText = `${pageIndex + 1} / ${creditPages.length}`;
  const pageIndicator = createTitleLabel(
    pageIndicatorText,
    indicatorWidth,
    0.15
  );
  pageIndicator.material.depthWrite = false;
  const indicatorX = currentX - indicatorWidth / 2;
  pageIndicator.position.set(indicatorX, descNavY, 0.02);
  viewerUIGroup.add(pageIndicator);
  currentX = indicatorX - indicatorWidth / 2 - padding;

  // Tombol Prev
  const isFirstPage = pageIndex <= 0;
  const prevDescButton = createButton(
    "<",
    isFirstPage ? "locked" : "prev_credit",
    buttonWidth,
    0.2,
    isFirstPage ? "#4A5568" : BG_COLOR
  );
  if (isFirstPage) prevDescButton.userData.colors = null;
  const prevButtonX = currentX - buttonWidth / 2;
  prevDescButton.position.set(prevButtonX, descNavY, 0.01);
  viewerUIGroup.add(prevDescButton);

  // --- 5. Tombol Kembali ke Menu Utama ---
  const navButtonWidth = 2.0; // Tombol lebih besar
  const navButtonHeight = 0.25;
  const navY = -totalPanelHeight / 2 + navButtonHeight / 2 + 0.1;
  const backButton = createButton(
    "Kembali ke Menu Utama",
    "back_to_landing",
    navButtonWidth,
    navButtonHeight
  );
  backButton.position.set(0, navY, 0.01);
  viewerUIGroup.add(backButton);

  // Atur posisi dan orientasi seluruh grup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

// Ganti fungsi createQuizScreen yang lama dengan yang ini:
export function createQuizScreen(questionIndex) {
  clearUI();

  // --- POSISI BARU: Sama seperti Laporan Belajar ---
  const uiBasePosition = new THREE.Vector3(0, 1.6, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const currentQuestion = quizData[questionIndex];

  // --- [PERBAIKAN RESPONSIVE] ---
  // 1. Buat panel pertanyaan terlebih dahulu untuk mendapatkan tingginya
  const questionPanel = createTextPanel(currentQuestion.question, 4.4);
  const questionPanelHeight = questionPanel.geometry.parameters.height;

  // 2. Tentukan ukuran dan padding elemen lain
  const titleHeight = 0.3;
  const buttonHeight = 0.35;
  const verticalPadding = 0.15; // Jarak antar elemen

  // 3. Hitung total tinggi panel utama secara dinamis
  const totalPanelHeight =
    titleHeight + questionPanelHeight + buttonHeight + verticalPadding * 4;

  const panelWidth = 4.8;
  const mainPanel = createUIPanel(panelWidth, totalPanelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel); // Gunakan viewerUIGroup untuk posisi tetap

  // 4. Posisikan elemen secara relatif terhadap tinggi total
  const titleY = totalPanelHeight / 2 - verticalPadding - titleHeight / 2;
  const titleText = `Uji Pemahaman (Soal ${questionIndex + 1}/${
    quizData.length
  })`;
  const titleLabel = createTitleLabel(titleText, 4.5, titleHeight);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const questionPanelY =
    titleY - titleHeight / 2 - verticalPadding - questionPanelHeight / 2;
  questionPanel.position.set(0, questionPanelY, 0.01);
  viewerUIGroup.add(questionPanel);

  const buttonY =
    questionPanelY -
    questionPanelHeight / 2 -
    verticalPadding -
    buttonHeight / 2;
  const buttonWidth = 2.1;
  const buttonSpacingX = 2.3;
  const positions = [-buttonSpacingX / 2, buttonSpacingX / 2];
  const shuffledPositions = positions.sort(() => Math.random() - 0.5);

  currentQuestion.answers.forEach((answer, index) => {
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "answer_correct" : "answer_incorrect";
    const button = createButton(answer, action, buttonWidth, buttonHeight);
    button.position.set(shuffledPositions[index], buttonY, 0.01);
    viewerUIGroup.add(button);
  });

  // Atur posisi dan orientasi seluruh grup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}

// Ganti fungsi createQuizResultScreen yang lama dengan yang ini:
export function createQuizResultScreen(isCorrect, questionIndex) {
  clearUI();

  // --- POSISI BARU: Sama seperti Laporan Belajar ---
  const uiBasePosition = new THREE.Vector3(0, 1.6, -4);
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

  const currentQuestion = quizData[questionIndex];

  // --- [PERBAIKAN RESPONSIVE] ---
  const explanationText = `**Jawaban yang benar adalah:**\n${
    currentQuestion.answers[currentQuestion.correctAnswerIndex]
  }`;
  const explanationPanel = createTextPanel(explanationText, 4.4);
  const explanationPanelHeight = explanationPanel.geometry.parameters.height;

  const titleHeight = 0.45;
  const buttonHeight = 0.35;
  const verticalPadding = 0.15;

  const totalPanelHeight =
    titleHeight + explanationPanelHeight + buttonHeight + verticalPadding * 4;

  const panelWidth = 4.8;
  const mainPanel = createUIPanel(panelWidth, totalPanelHeight, 0.1);
  mainPanel.position.set(0, 0, 0);
  viewerUIGroup.add(mainPanel); // Gunakan viewerUIGroup

  const titleY = totalPanelHeight / 2 - verticalPadding - titleHeight / 2;
  const titleText = isCorrect ? "Jawaban Benar!" : "Jawaban Salah!";
  const titleColor = isCorrect ? "#28a745" : "#dc3545";
  const titleLabel = createTitleLabel(titleText, 3.5, titleHeight, titleColor);
  titleLabel.position.set(0, titleY, 0.01);
  viewerUIGroup.add(titleLabel);

  const explanationPanelY =
    titleY - titleHeight / 2 - verticalPadding - explanationPanelHeight / 2;
  explanationPanel.position.set(0, explanationPanelY, 0.01);
  viewerUIGroup.add(explanationPanel);

  const buttonY =
    explanationPanelY -
    explanationPanelHeight / 2 -
    verticalPadding -
    buttonHeight / 2;
  const isLastQuestion = questionIndex >= quizData.length - 1;
  const buttonText = isLastQuestion
    ? "Lihat Hasil"
    : "Lanjut ke Soal Berikutnya";
  const continueButton = createButton(
    buttonText,
    "next_question",
    3.0,
    buttonHeight,
    ACCENT_COLOR
  );
  continueButton.position.set(0, buttonY, 0.01);
  viewerUIGroup.add(continueButton);

  // Atur posisi dan orientasi seluruh grup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
function createScoreLabel(text, size, color = ACCENT_COLOR) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const resolution = getResolution();

  canvas.width = size * resolution;
  canvas.height = size * resolution;

  const fontSize = Math.floor(size * resolution * 0.5); // Font sangat besar
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

  const uiBasePosition = new THREE.Vector3(0, 1.6, -4);
  // Mengatur panel agar menghadap ke posisi awal pengguna
  const uiLookAtPosition = new THREE.Vector3(0, 1.2, 5);

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
      "Anda harus menyelesaikan semua materi dan mengerjakan Tes Akhir terlebih dahulu untuk melihat laporan nilai.";
    const reportBody = createBodyText(reportText, 4.2);
    reportBody.position.set(0, 0, 0.02);
    viewerUIGroup.add(reportBody);
  } else {
    // Tampilan jika kuis sudah dikerjakan
    const totalQuestions = quizData.length;
    const finalScore = (score / totalQuestions) * 100;

    // Label "Nilai Akhir"
    const scoreTitle = createSubtitleLabel("Nilai Akhir", 2.0, 0.2);
    scoreTitle.position.set(0, 0.4, 0.02);
    viewerUIGroup.add(scoreTitle);

    // Skor utama
    const scoreDisplay = createScoreLabel(finalScore.toFixed(0), 1.0);
    scoreDisplay.position.set(0, -0.1, 0.01);
    viewerUIGroup.add(scoreDisplay);

    // Teks detail
    const detailText = `Anda berhasil menjawab ${score} dari ${totalQuestions} soal dengan benar.`;
    const reportBody = createBodyText(detailText, 4.2, 35, 28);
    reportBody.position.set(0, -0.6, 0.02);
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
    panelWidth / 2 - padding - exitButtonSize / 2, // Kiri atas
    panelHeight / 2 - padding - exitButtonSize / 2, // Kiri atas
    0.02 // Sedikit di depan panel
  );
  viewerUIGroup.add(exitButton);
  loader.load("assets/models/bot.glb", (gltf) => {
    const model = gltf.scene;
    currentAvatar = model; // Simpan referensi model
    model.scale.set(0.5, 0.5, 0.5); // Sedikit lebih besar dari di landing

    // Posisikan avatar di samping kiri panel
    const avatarX = -panelWidth / 2 - 0.5;
    const avatarY = -panelHeight / 2 - 0.2;
    model.position.set(avatarX, avatarY, 0.1);

    // Tambahkan avatar ke grup UI yang sama dengan panel laporan
    viewerUIGroup.add(model);

    if (gltf.animations && gltf.animations.length) {
      avatarMixer = new THREE.AnimationMixer(model);
      const action = avatarMixer.clipAction(gltf.animations[0]);
      action.play();
    }
  });
  // Atur posisi dan orientasi seluruh viewerUIGroup
  viewerUIGroup.position.copy(uiBasePosition);
  viewerUIGroup.lookAt(uiLookAtPosition);
}
export function createMiniQuizPage(component) {
  // --- Gunakan Konfigurasi Posisi dan Tata Letak yang Sama dengan ViewerPage ---
  const uiBasePosition = new THREE.Vector3(-2.5, 1.6, -3);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 0);
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
  const titleLabel = createTitleLabel("Mini Kuis", titleWidth, titleHeight);
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
  const uiBasePosition = new THREE.Vector3(-2.5, 1.6, -3);
  const uiLookAtPosition = new THREE.Vector3(0, 1.6, 0);
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
  clearUI();

  // --- Judul Halaman ---
  const titleLabel = createTitleLabel("Pilih Mode Pengalaman", 4, 0.5);
  // Posisikan judul di bagian atas layar
  titleLabel.position.set(0, 2.2, -3);
  uiGroup.add(titleLabel);

  // --- Konfigurasi Tombol ---
  const buttonWidth = 3.0; // Tombol dibuat sedikit lebih besar
  const buttonHeight = 0.4;
  const spacing = 0.45; // Jarak vertikal antar tombol
  const startY = 1.6; // Posisi Y untuk tombol pertama

  // --- Tombol untuk Mode Browser ---
  const browserButton = createButton(
    "Mode Browser",
    "start_browser",
    buttonWidth,
    buttonHeight,
    ACCENT_COLOR // Warna aksen untuk pilihan default
  );
  browserButton.position.set(0, startY, -3);
  uiGroup.add(browserButton);

  // --- Tombol untuk Mode VR ---
  const vrButton = createButton(
    "Mode VR",
    "start_vr",
    buttonWidth,
    buttonHeight
  );
  // Posisikan tombol kedua tepat di bawah tombol pertama
  vrButton.position.set(0, startY - spacing, -3);
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
export const debugGroup = new THREE.Group();
scene.add(debugGroup);

export function createFpsLabel() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 128;

  // Background semi-transparent
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "white";
  context.font = "bold 48px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("0", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  // 🔑 Hitung rasio agar panel tidak lebar/sempit
  const aspect = canvas.width / canvas.height;
  const height = 0.2; // tinggi panel di dunia 3D
  const width = height * aspect; // otomatis ikuti rasio canvas

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
  context.font = "bold 48px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    `FPS: ${fps.toString()}`,
    canvas.width / 2,
    canvas.height / 2
  );

  texture.needsUpdate = true;
}
