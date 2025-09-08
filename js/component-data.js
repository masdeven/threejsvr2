export const components = [
  {
    label: "Monitor",
    modelFile: "assets/models/monitor.glb",
    audioFile: "assets/audio/monitor.mp3",
    description:
      "Monitor adalah perangkat output yang menampilkan gambar, teks, dan video dari komputer.",
    unlocked: true,
    quiz: [
      {
        question: "Monitor berfungsi sebagai perangkat input atau output?",
        answers: ["Input", "Output"],
        correctAnswerIndex: 1,
      },
    ],
  },
  {
    label: "Keyboard",
    modelFile: "assets/models/keyboard.glb",
    audioFile: "assets/audio/keyboard.mp3",
    description:
      "Keyboard adalah perangkat input utama yang digunakan untuk memasukkan huruf, angka, dan perintah ke dalam komputer.",
    unlocked: false,
    quiz: [
      {
        question: "Fungsi utama keyboard adalah untuk...?",
        answers: ["Menampilkan Gambar", "Memasukkan Teks"],
        correctAnswerIndex: 1,
      },
    ],
  },
  {
    label: "Mouse",
    modelFile: "assets/models/mouse.glb",
    audioFile: "assets/audio/mouse.mp3",
    description:
      "Mouse adalah perangkat input yang digunakan untuk menggerakkan kursor dan melakukan klik pada layar komputer.",
    unlocked: false,
    quiz: [
      {
        question: "Gerakan kursor di layar dikendalikan oleh...?",
        answers: ["Mouse", "Speaker"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Speaker",
    modelFile: "assets/models/speaker.glb",
    audioFile: "assets/audio/speaker.mp3",
    description:
      "Speaker adalah perangkat output audio yang menghasilkan suara dari komputer, seperti musik, suara sistem, dan efek multimedia.",
    unlocked: false,
    quiz: [
      {
        question: "Speaker termasuk perangkat...?",
        answers: ["Input", "Output"],
        correctAnswerIndex: 1,
      },
    ],
  },
  {
    label: "Casing",
    modelFile: "assets/models/casing.glb",
    audioFile: "assets/audio/casing.mp3",
    description:
      "Casing adalah wadah yang melindungi komponen internal komputer serta membantu pengaturan sirkulasi udara.",
    unlocked: false,
    quiz: [
      {
        question: "Fungsi utama casing adalah...?",
        answers: ["Menghubungkan komponen", "Melindungi komponen"],
        correctAnswerIndex: 1,
      },
    ],
  },
  {
    label: "Motherboard",
    modelFile: "assets/models/motherboard.glb",
    audioFile: "assets/audio/motherboard.mp3",
    description:
      "Motherboard adalah papan sirkuit utama yang menghubungkan dan mengatur komunikasi antar komponen komputer.",
    unlocked: false,
    quiz: [
      {
        question: "Motherboard berfungsi untuk...?",
        answers: ["Menghubungkan komponen komputer", "Menyimpan data"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Processor (CPU)",
    modelFile: "assets/models/cpu.glb",
    audioFile: "assets/audio/cpu.mp3",
    description:
      "CPU (Central Processing Unit) adalah otak komputer yang bertanggung jawab menjalankan instruksi dan memproses data.",
    unlocked: false,
    quiz: [
      {
        question: "Komponen manakah yang disebut otak komputer?",
        answers: ["GPU", "CPU"],
        correctAnswerIndex: 1,
      },
    ],
  },
  {
    label: "Fan",
    modelFile: "assets/models/fan.glb",
    audioFile: "assets/audio/fan.mp3",
    description:
      "Fan adalah kipas pendingin yang menjaga suhu komponen komputer tetap stabil agar tidak mengalami overheat.",
    unlocked: false,
    quiz: [
      {
        question: "Fungsi utama fan adalah...?",
        answers: ["Pendingin komponen", "Menyimpan data"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "RAM",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/ram.mp3",
    description:
      "RAM (Random Access Memory) adalah memori sementara yang digunakan untuk menyimpan data yang sedang aktif diproses.",
    unlocked: false,
    quiz: [
      {
        question: "RAM digunakan untuk menyimpan data secara...?",
        answers: ["Sementara", "Permanen"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Graphics Card (GPU)",
    modelFile: "assets/models/gpu.glb",
    audioFile: "assets/audio/gpu.mp3",
    description:
      "GPU (Graphics Processing Unit) dirancang khusus untuk mempercepat pemrosesan grafis dan visualisasi.",
    unlocked: false,
    quiz: [
      {
        question: "Komponen yang mempercepat pemrosesan grafis adalah...?",
        answers: ["CPU", "GPU"],
        correctAnswerIndex: 1,
      },
    ],
  },
  {
    label: "Power Supply (PSU)",
    modelFile: "assets/models/psu.glb",
    audioFile: "assets/audio/psu.mp3",
    description:
      "PSU (Power Supply Unit) mengubah arus listrik dari sumber daya menjadi arus yang sesuai untuk komponen komputer.",
    unlocked: false,
    quiz: [
      {
        question: "Fungsi utama PSU adalah...?",
        answers: ["Mengolah data", "Menyuplai daya listrik"],
        correctAnswerIndex: 1,
      },
    ],
  },
  {
    label: "Storage",
    modelFile: "assets/models/storage.glb",
    audioFile: "assets/audio/storage.mp3",
    description:
      "Storage adalah media penyimpanan data jangka panjang pada komputer, seperti HDD atau SSD.",
    unlocked: false,
    quiz: [
      {
        question: "Manakah yang termasuk media penyimpanan jangka panjang?",
        answers: ["RAM", "SSD/HDD"],
        correctAnswerIndex: 1,
      },
    ],
  },
];
