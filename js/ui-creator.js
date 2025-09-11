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

  const radius = 15;
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

  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
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

export function createLandingPage(playerName) {
  if (playerName) {
    const welcomeText = `Selamat Datang, ${playerName}!`;
    const welcomeLabel = createTitleLabel(welcomeText, 3.5, 0.5);
    welcomeLabel.position.set(0, 2.3, 0);
    uiGroup.add(welcomeLabel);
  }

  const buttonWidth = 2.0;
  const buttonHeight = 0.2;
  const spacing = 0.12;
  const startY = 1.9;

  const startButton = createButton(
    "Ayo Mulai!",
    "start",
    buttonWidth,
    buttonHeight
  );
  startButton.position.set(0, startY, 0);
  uiGroup.add(startButton);

  // const quizButton = createButton(
  //   "Uji Pemahaman",
  //   "show_quiz",
  //   buttonWidth,
  //   buttonHeight
  // );
  // quizButton.position.set(0, startY - (buttonHeight + spacing), UI_DISTANCE);
  // uiGroup.add(quizButton);

  const reportButton = createButton(
    "Laporan Belajar",
    "show_quiz_report",
    buttonWidth,
    buttonHeight
  );
  reportButton.position.set(0, startY - (buttonHeight + spacing), 0);
  uiGroup.add(reportButton);

  const helpButton = createButton("Bantuan", "help", buttonWidth, buttonHeight);
  helpButton.position.set(0, startY - 2 * (buttonHeight + spacing), 0);
  uiGroup.add(helpButton);

  const creditsButton = createButton(
    "Tentang Aplikasi",
    "show_credits",
    buttonWidth,
    buttonHeight
  );
  creditsButton.position.set(0, startY - 3 * (buttonHeight + spacing), 0);
  uiGroup.add(creditsButton);
}

export function createMenuPage(allComponentsUnlocked, quizHasBeenAttempted) {
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
    "Pilih Materi",
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
  titleMesh.position.set(0, 2.3, 0);
  uiGroup.add(titleMesh);

  components.forEach((comp, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const isUnlocked = comp.unlocked;
    const buttonLabel = isUnlocked ? comp.label : "Terkunci";
    const buttonColor = isUnlocked ? BG_COLOR : "#444444";
    const button = createButton(
      buttonLabel,
      `select_${index}`,
      1.3,
      0.2,
      buttonColor
    );
    if (!isUnlocked) {
      button.userData.action = "locked";
      button.userData.colors = null;
    }

    button.position.set(startX + col * spacingX, startY - row * spacingY, 0);
    uiGroup.add(button);
  });

  const backButton = createButton(
    "Kembali ke Awal",
    "back_to_landing",
    1.8,
    0.4
  );
  backButton.position.set(-1.0, 0.7, 0);
  uiGroup.add(backButton);

  let quizButtonLabel, quizButtonAction, quizButtonColor;

  if (!allComponentsUnlocked) {
    quizButtonLabel = "Uji Pemahaman (Terkunci)";
    quizButtonAction = "locked";
    quizButtonColor = "#dc3545";
  } else if (allComponentsUnlocked && !quizHasBeenAttempted) {
    quizButtonLabel = "Uji Pemahaman";
    quizButtonAction = "show_quiz";
    quizButtonColor = BG_COLOR;
  } else {
    quizButtonLabel = "Uji Pemahaman (Selesai)";
    quizButtonAction = "show_quiz_report";
    quizButtonColor = "#28a745";
  }

  const quizButton = createButton(
    quizButtonLabel,
    quizButtonAction,
    1.8,
    0.4,
    quizButtonColor
  );

  if (!allComponentsUnlocked) {
    quizButton.userData.colors = null;
  }

  quizButton.position.set(1.0, 0.7, 0);
  uiGroup.add(quizButton);
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

  // --- Tombol Aksi ---
  const actionButtonWidth = 2.0;
  const actionButtonHeight = 0.25;
  const buttonSpacing = 0.1;

  const audioY =
    navY - navButtonHeight / 2 - actionButtonHeight / 2 - buttonSpacing;
  const audioZ = -audioY * curveIntensity;
  const audioButton = createButton(
    "Dengarkan Audio",
    "play_audio",
    actionButtonWidth,
    actionButtonHeight
  );
  audioButton.position.set(0, audioY, audioZ);
  viewerUIGroup.add(audioButton);

  const menuY = audioY - actionButtonHeight - buttonSpacing;
  const menuZ = -menuY * curveIntensity;
  const menuButton = createButton(
    "Kembali ke Menu",
    "back_to_menu",
    actionButtonWidth,
    actionButtonHeight
  );
  menuButton.position.set(0, menuY, menuZ);
  viewerUIGroup.add(menuButton);

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

  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  const textWidth = ctx.measureText(text).width;
  ctx.beginPath();
  ctx.moveTo((canvas.width - textWidth) / 2, canvas.height * 0.8);
  ctx.lineTo((canvas.width + textWidth) / 2, canvas.height * 0.8);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(width, height);

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
  if (playerName) {
    const titleText = `Selamat, ${playerName}!`;
    const titleLabel = createTitleLabel(titleText, 3.5, 0.5);
    titleLabel.position.set(0, 2.2, UI_DISTANCE);
    uiGroup.add(titleLabel);
  }

  const messageText =
    "Semua materi sudah berhasil kamu pelajari, sekarang ayo uji pemahamanmu dengan mengerjakan Kuis pada menu Uji Pemahaman dan tunjukkan seberapa jauh kamu sudah menguasai materi ini!";
  const messagePanel = createTextPanel(messageText, 3.5);
  messagePanel.position.set(0, 1.5, 0);
  uiGroup.add(messagePanel);

  const quizButton = createButton("Lihat Materi", "back_to_menu", 2.5, 0.5);
  quizButton.position.set(0, 0.9, 0);
  uiGroup.add(quizButton);
}
export function createCreditsScreen() {
  const creditsText =
    "Aplikasi ini dikembangkan menggunakan Three.js dan WebXR untuk menghadirkan pengalaman VR interaktif langsung di browser. Teknologi ini menunjukkan potensi besar web dalam pengembangan visualisasi 3D yang imersif dan mudah diakses.";
  const creditLabel = createTitleLabel("Tentang Aplikasi", 3, 0.5);
  creditLabel.position.set(0, 2.2, 0);
  uiGroup.add(creditLabel);

  const creditsPanel = createTextPanel(creditsText, 4);
  const panelHeight = creditsPanel.geometry.parameters.height;
  creditsPanel.position.set(0, 1.6, 0);
  uiGroup.add(creditsPanel);

  const backButton = createButton("Tutup", "back_to_landing", 1.5, 0.4);
  const buttonHeight = backButton.geometry.parameters.height;
  const buttonY = 1.6 - panelHeight / 2 - buttonHeight / 2 - 0.2;
  backButton.position.set(0, buttonY, 0);
  uiGroup.add(backButton);
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

export function createQuizReportScreen(score, hasAttempted) {
  if (!hasAttempted) {
    const titleText = "Belum Ada Laporan";
    const titleLabel = createTitleLabel(titleText, 3.5, 0.5);
    titleLabel.position.set(0, 2.1, 0);
    uiGroup.add(titleLabel);

    const reportText =
      "Kamu harus menyelesaikan materi dan mengerjakan Uji Pemahaman terlebih dahulu untuk melihat laporan nilai.";
    const reportPanel = createTextPanel(reportText, 4.5);
    const panelHeight = reportPanel.geometry.parameters.height;
    reportPanel.position.set(0, 1.5, 0);
    uiGroup.add(reportPanel);

    const backButton = createButton(
      "Kembali ke Awal",
      "back_to_landing",
      2.5,
      0.5
    );
    const buttonHeight = backButton.geometry.parameters.height;
    const buttonY = 1.5 - panelHeight / 2 - buttonHeight / 2 - 0.2;
    backButton.position.set(0, buttonY, 0);
    uiGroup.add(backButton);
  } else {
    const totalQuestions = quizData.length;
    const finalScore = (score / totalQuestions) * 100;

    const titleText = "Laporan Belajar";
    const titleLabel = createTitleLabel(titleText, 3.5, 0.5);
    titleLabel.position.set(0, 2.4, 0);
    uiGroup.add(titleLabel);

    const reportText = `Uji Pemahaman selesai! kamu telah menuntaskan semua materi dengan menjawab ${score} dari ${totalQuestions} soal benar dan meraih nilai akhir ${finalScore.toFixed(
      0
    )}/100.`;

    const reportPanel = createTextPanel(reportText, 4.5);
    const panelHeight = reportPanel.geometry.parameters.height;
    reportPanel.position.set(0, 1.6, 0);
    uiGroup.add(reportPanel);

    const backButton = createButton(
      "Selesai & Kembali ke Awal",
      "back_to_landing",
      2.5,
      0.5
    );
    const buttonHeight = backButton.geometry.parameters.height;
    const buttonY = 1.6 - panelHeight / 2 - buttonHeight / 2 - 0.2;
    backButton.position.set(0, buttonY, 0);
    uiGroup.add(backButton);
  }
}
export function createMiniQuizPage(component) {
  const currentQuestion = component.quiz[0];

  const questionPanel = createTextPanel(currentQuestion.question, 4.5);
  const panelHeight = questionPanel.geometry.parameters.height;
  questionPanel.position.set(0, 1.8, 0);
  uiGroup.add(questionPanel);

  const buttonWidth = 2.0;
  const buttonHeight = 0.4;
  const buttonY = 1.8 - panelHeight / 2 - buttonHeight / 2 - 0.2;
  const positions = [-1.1, 1.1];

  currentQuestion.answers.forEach((answer, index) => {
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const action = isCorrect ? "mini_quiz_correct" : "mini_quiz_incorrect";
    const button = createButton(answer, action, buttonWidth, buttonHeight);

    button.position.set(positions[index], buttonY, 0);
    uiGroup.add(button);
  });
}
export function createMiniQuizResultPage(isCorrect) {
  const titleText = isCorrect ? "Jawaban Benar!" : "Jawaban Salah!";
  const titleColor = isCorrect ? "#28a745" : "#dc3545";

  const titleLabel = createTitleLabel(titleText, 3.5, 0.5, titleColor);
  titleLabel.position.set(0, 2.1, 0);
  uiGroup.add(titleLabel);

  const messageText = isCorrect
    ? "Bagus! Kamu sudah memahami materi ini. Ayo lanjut ke materi berikutnya."
    : "Jangan khawatir, coba pelajari lagi materinya untuk lebih paham.";

  const messagePanel = createTextPanel(messageText, 4);
  const panelHeight = messagePanel.geometry.parameters.height;
  messagePanel.position.set(0, 1.5, 0);
  uiGroup.add(messagePanel);

  const continueButton = createButton(
    "Lanjutkan",
    "continue_after_mini_quiz",
    2,
    0.4
  );
  const buttonHeight = continueButton.geometry.parameters.height;
  const buttonY = 1.5 - panelHeight / 2 - buttonHeight / 2 - 0.2;
  continueButton.position.set(0, buttonY, 0);
  uiGroup.add(continueButton);
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
