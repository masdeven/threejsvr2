export const components = [
  {
    label: "Pengantar",
    modelFile: null,
    audioFile: "assets/audio/history.mp3",
    description: [
      "Komputer telah berevolusi melalui 5 generasi sejak 1940-an.",
      "Generasi pertama (1946–1959) memakai tabung vakum, ukurannya besar dan boros daya.",
      "Generasi kedua (1959–1964) mengganti tabung dengan transistor, lebih kecil dan efisien.",
      "Generasi ketiga (1965–1971) menggunakan IC serta memperkenalkan monitor dan keyboard.",
      "Generasi keempat (1971–1982) menghadirkan mikroprosesor dan komputer pribadi.",
      "Generasi kelima (1980–sekarang) berkembang dengan AI, multimedia, dan pemrosesan modern.",
    ],
    unlocked: true,
    quiz: [
      {
        question: "Komputer generasi pertama menggunakan tabung vakum.",
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
      "Monitor menampilkan teks, gambar, dan video sebagai keluaran komputer.",
      "Generasi ketiga sudah mengenalkan monitor dan keyboard untuk interaksi pengguna.",
      "Pada generasi keempat, monitor masih monokrom sebelum berkembang menjadi berwarna.",
      "Generasi kelima membawa monitor dengan kualitas gambar lebih tajam dan multimedia.",
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
      "Keyboard berfungsi memasukkan teks, angka, dan perintah ke komputer.",
      "Generasi ketiga mengenalkan interaksi melalui keyboard dan monitor.",
      "Tata letak QWERTY masih menjadi standar paling umum hingga kini.",
      "Keyboard juga memiliki tombol fungsi dan navigasi untuk memudahkan penggunaan.",
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
      "Mouse digunakan untuk menggerakkan kursor dan memilih objek di layar.",
      "Mouse modern memakai sensor optik atau laser untuk presisi tinggi.",
      "Klik kanan biasanya menampilkan menu konteks berisi opsi tambahan.",
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
    label: "Speaker",
    modelFile: "assets/models/speaker.glb",
    audioFile: "assets/audio/speaker.mp3",
    description: [
      "Speaker menghasilkan suara dari komputer, seperti musik atau efek sistem.",
      "Kemampuan audio mulai hadir sejak generasi ketiga komputer.",
      "Speaker internal praktis, tetapi speaker eksternal umumnya lebih baik kualitasnya.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Speaker termasuk perangkat output.",
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
      "Motherboard adalah papan sirkuit utama tempat semua komponen komputer terhubung.",
      "Evolusi motherboard dimulai dari tabung vakum, transistor, hingga IC di generasi ketiga.",
      "Chipset menentukan kompatibilitas prosesor dan fitur yang tersedia pada motherboard.",
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
      "CPU adalah otak komputer yang mengeksekusi instruksi dan memproses data.",
      "Konsep CPU modern berasal dari arsitektur von Neumann pada komputer EDVAC.",
      "Mikroprosesor pertama kali diperkenalkan oleh Intel pada tahun 1971.",
      "Kecepatan CPU terus meningkat dari seri 4004 hingga prosesor modern.",
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
    label: "Fan",
    modelFile: "assets/models/fan.glb",
    audioFile: "assets/audio/fan.mp3",
    description: [
      "Fan berfungsi mendinginkan komponen komputer agar tidak overheat.",
      "Kebutuhan pendingin sudah ada sejak komputer generasi pertama dengan tabung vakum.",
      "Fan mengalirkan udara dingin ke CPU atau GPU dan membuang panas keluar casing.",
      "Selain fan, ada juga pendingin cair untuk performa lebih tinggi.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Fan berfungsi mendinginkan komponen komputer.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "RAM",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/ram.mp3",
    description: [
      "RAM adalah memori sementara untuk menyimpan data yang sedang diproses.",
      "Generasi awal memakai memori magnetik sebelum beralih ke chip semikonduktor.",
      "RAM bersifat volatile, artinya data hilang saat komputer dimatikan.",
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
    label: "Graphics Card (GPU)",
    modelFile: "assets/models/gpu.glb",
    audioFile: "assets/audio/gpu.mp3",
    description: [
      "GPU mempercepat pemrosesan grafis untuk menampilkan gambar dan video.",
      "Perkembangan GPU penting di era multimedia dan komputer generasi kelima.",
      "Selain grafis, GPU juga digunakan untuk komputasi umum seperti AI dan sains.",
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
    label: "Power Supply (PSU)",
    modelFile: "assets/models/psu.glb",
    audioFile: "assets/audio/psu.mp3",
    description: [
      "PSU mengubah listrik dari sumber daya menjadi arus yang sesuai untuk komponen.",
      "Komputer generasi awal seperti ENIAC membutuhkan daya listrik yang sangat besar.",
      "PSU modern lebih hemat energi, terutama yang bersertifikasi 80 Plus.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "PSU berfungsi menyuplai daya listrik ke komponen komputer.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    label: "Storage",
    modelFile: "assets/models/storage.glb",
    audioFile: "assets/audio/storage.mp3",
    description: [
      "Storage adalah media penyimpanan jangka panjang, seperti HDD atau SSD.",
      "Evolusi storage dimulai dari pita magnetik, disket, hingga hard disk.",
      "SSD modern lebih cepat karena memakai chip flash tanpa bagian bergerak.",
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
    label: "Casing",
    modelFile: "assets/models/casing.glb",
    audioFile: "assets/audio/casing.mp3",
    description: [
      "Casing melindungi komponen internal komputer dan membantu sirkulasi udara.",
      "Komputer generasi pertama seperti ENIAC berukuran raksasa, berbeda jauh dengan casing modern.",
      "Selain perlindungan, casing juga berperan menjaga suhu komponen tetap stabil.",
      "Ukuran casing bervariasi, seperti ATX, Micro-ATX, hingga Mini-ITX.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Casing berfungsi melindungi komponen komputer.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
      },
    ],
  },
];
