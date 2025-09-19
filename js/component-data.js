export const components = [
  {
    label: "Pengantar",
    modelFile: null,
    audioFile: "assets/audio/intro.mp3",
    description: [
      "Perangkat keras (hardware) adalah bagian fisik dari sistem komputer yang mencakup komponen elektronik dan mekanis. Fungsinya meliputi menjalankan perintah, mengolah data, serta menyimpan informasi.",
    ],
    unlocked: true,
    quiz: [
      {
        question: "Perangkat keras adalah bagian fisik dari komputer.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Monitor",
    modelFile: "assets/models/monitor.glb",
    audioFile: "assets/audio/monitor.mp3",
    description: [
      "Monitor merupakan perangkat output yang digunakan untuk menampilkan hasil pemrosesan komputer dalam bentuk teks maupun gambar. Fungsinya adalah menyajikan informasi visual kepada pengguna.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Monitor adalah perangkat output.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Keyboard",
    modelFile: "assets/models/keyboard.glb",
    audioFile: "assets/audio/keyboard.mp3",
    description: [
      "Keyboard adalah perangkat input yang digunakan untuk memasukkan teks, angka, dan perintah ke dalam komputer. Fungsinya adalah menyampaikan instruksi pengguna ke sistem.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Keyboard digunakan untuk memasukkan teks ke komputer.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Mouse",
    modelFile: "assets/models/mouse.glb",
    audioFile: "assets/audio/mouse.mp3",
    description: [
      "Mouse adalah perangkat input yang digunakan untuk menggerakkan kursor di layar serta memilih atau membuka objek dengan klik. Fungsinya adalah memudahkan navigasi dan interaksi dengan komputer.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Mouse digunakan untuk mengendalikan kursor.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Motherboard",
    modelFile: "assets/models/motherboard.glb",
    audioFile: "assets/audio/motherboard.mp3",
    description: [
      "Motherboard adalah papan sirkuit utama yang menjadi pusat penghubung seluruh komponen perangkat keras komputer. Pada papan ini terdapat slot dan konektor untuk CPU, RAM, kartu ekspansi, serta perangkat lainnya. Fungsinya adalah menyatukan dan mengoordinasikan kerja tiap komponen.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Motherboard berfungsi menghubungkan komponen komputer.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Processor (CPU)",
    modelFile: "assets/models/cpu.glb",
    audioFile: "assets/audio/cpu.mp3",
    description: [
      "CPU (Central Processing Unit) adalah otak komputer yang mengeksekusi instruksi program, melakukan perhitungan, dan mengoordinasikan kerja perangkat keras lain. Dengan adanya inti prosesor (core) yang dapat bekerja paralel, CPU mampu meningkatkan kinerja sistem. Fungsinya adalah memproses instruksi, menjalankan program, dan mengendalikan operasi perangkat keras.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "CPU sering disebut otak komputer.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Memori",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/ram.mp3",
    description: [
      "Memori adalah tempat penyimpanan data dan instruksi yang dibutuhkan CPU dalam menjalankan operasi. Terdapat dua jenis utama: RAM, yang menyimpan data sementara saat komputer aktif, dan ROM, yang berisi instruksi dasar untuk proses awal saat komputer dinyalakan. Fungsinya adalah menyediakan data dan instruksi bagi sistem agar dapat berjalan.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "RAM menyimpan data sementara.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Kartu Grafis (GPU)",
    modelFile: "assets/models/gpu.glb",
    audioFile: "assets/audio/gpu.mp3",
    description: [
      "Kartu grafis adalah perangkat keras yang menghasilkan output visual ke monitor. Komponen ini memiliki prosesor grafis khusus yang mampu mengolah data gambar dan video dengan cepat. Fungsinya adalah menyajikan tampilan grafis berupa gambar maupun video.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "GPU digunakan untuk mempercepat pemrosesan grafis.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Storage (HDD/SDD",
    modelFile: "assets/models/storage.glb",
    audioFile: "assets/audio/storage.mp3",
    description: [
      "HDD dan SSD merupakan media penyimpanan utama pada komputer. HDD bekerja dengan piringan magnetik untuk menyimpan data, sedangkan SSD menggunakan chip memori sehingga lebih cepat dan tahan lama. Fungsinya adalah menyimpan data, program, serta file secara permanen.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "SSD dan HDD termasuk media penyimpanan jangka panjang.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Printer",
    modelFile: "assets/models/printer.glb",
    audioFile: "assets/audio/printer.mp3",
    description: [
      "Printer adalah perangkat output yang digunakan untuk menghasilkan salinan fisik dari dokumen digital. Fungsinya adalah mencetak teks maupun gambar ke dalam bentuk kertas.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Printer berfungsi mencetak dokumen ke bentuk fisik.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Flashdisk",
    modelFile: "assets/models/flashdisk.glb",
    audioFile: "assets/audio/flashdisk.mp3",
    description: [
      "Flashdisk adalah perangkat penyimpanan eksternal berukuran kecil yang digunakan untuk menyimpan dan memindahkan data. Fungsinya adalah menyediakan media penyimpanan portabel yang mudah diakses di berbagai komputer.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Flashdisk adalah media penyimpanan portabel.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
];
