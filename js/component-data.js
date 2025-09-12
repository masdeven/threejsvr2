export const components = [
  {
    label: "Monitor",
    modelFile: "assets/models/monitor.glb",
    audioFile: "assets/audio/monitor.mp3",
    description: [
      "Monitor adalah perangkat output yang menampilkan gambar, teks, dan video dari komputer.",
      "Ada berbagai jenis monitor, seperti CRT, LCD, dan LED, masing-masing dengan teknologi tampilan yang berbeda.",
      "Resolusi dan refresh rate adalah spesifikasi penting yang menentukan kualitas gambar pada monitor.",
    ],
    unlocked: true,
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
      "Keyboard adalah perangkat input utama yang digunakan untuk memasukkan huruf, angka, dan perintah ke dalam komputer.",
      "Tata letak keyboard yang paling umum adalah QWERTY, dinamai sesuai enam huruf pertama di baris atas.",
      "Selain untuk mengetik, keyboard juga memiliki tombol fungsi (F1-F12) dan tombol khusus untuk navigasi dan shortcut.",
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
      "Mouse adalah perangkat input yang digunakan untuk menggerakkan kursor dan melakukan klik pada layar komputer.",
      "Mouse modern umumnya menggunakan sensor optik atau laser untuk melacak gerakan dengan presisi tinggi.",
      "Tombol klik kanan pada mouse biasanya digunakan untuk membuka menu konteks yang berisi opsi tambahan.",
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
      "Speaker adalah perangkat output audio yang menghasilkan suara dari komputer, seperti musik, suara sistem, dan efek multimedia.",
      "Speaker mengubah sinyal audio elektrik menjadi gelombang suara yang dapat didengar oleh telinga manusia.",
      "Beberapa monitor sudah dilengkapi dengan speaker internal, namun speaker eksternal seringkali menawarkan kualitas suara yang lebih baik.",
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
    label: "Casing",
    modelFile: "assets/models/casing.glb",
    audioFile: "assets/audio/casing.mp3",
    description: [
      "Casing adalah wadah yang melindungi komponen internal komputer serta membantu pengaturan sirkulasi udara.",
      "Selain melindungi dari debu dan benturan, casing juga berperan penting dalam menjaga suhu komponen tetap dingin.",
      "Casing tersedia dalam berbagai ukuran (form factor) seperti ATX, Micro-ATX, dan Mini-ITX untuk disesuaikan dengan motherboard.",
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
  {
    label: "Motherboard",
    modelFile: "assets/models/motherboard.glb",
    audioFile: "assets/audio/motherboard.mp3",
    description: [
      "Motherboard adalah papan sirkuit utama yang menghubungkan dan mengatur komunikasi antar komponen komputer.",
      "Semua komponen seperti CPU, RAM, dan kartu grafis terpasang langsung atau terhubung ke motherboard.",
      "Chipset pada motherboard menentukan kompatibilitas prosesor dan fitur-fitur lain yang didukung.",
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
      "CPU (Central Processing Unit) adalah otak komputer yang bertanggung jawab menjalankan instruksi dan memproses data.",
      "Kecepatan CPU diukur dalam Hertz (Hz), yang menunjukkan jumlah siklus instruksi yang dapat dijalankan per detik.",
      "CPU modern memiliki beberapa 'core' yang memungkinkannya untuk melakukan banyak tugas secara bersamaan (multitasking).",
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
      "Fan adalah kipas pendingin yang menjaga suhu komponen komputer tetap stabil agar tidak mengalami overheat.",
      "Fan bekerja dengan cara mengalirkan udara dingin ke komponen panas seperti CPU dan GPU, serta membuang udara panas keluar dari casing.",
      "Selain fan, sistem pendingin lain seperti pendingin cair (liquid cooling) juga digunakan untuk performa yang lebih tinggi.",
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
      "RAM (Random Access Memory) adalah memori sementara yang digunakan untuk menyimpan data yang sedang aktif diproses.",
      "Semakin besar kapasitas RAM, semakin banyak aplikasi yang dapat dijalankan secara bersamaan tanpa melambat.",
      "Data di dalam RAM akan hilang ketika komputer dimatikan, karena sifatnya yang 'volatile' (menguap).",
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
      "GPU (Graphics Processing Unit) dirancang khusus untuk mempercepat pemrosesan grafis dan visualisasi.",
      "GPU sangat penting untuk aplikasi yang membutuhkan grafis intensif seperti game, desain 3D, dan video editing.",
      "Selain grafis, GPU juga dapat digunakan untuk komputasi umum (GPGPU) pada bidang sains dan kecerdasan buatan.",
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
      "PSU (Power Supply Unit) mengubah arus listrik dari sumber daya menjadi arus yang sesuai untuk komponen komputer.",
      "Kapasitas PSU diukur dalam Watt (W) dan harus cukup untuk menyuplai daya ke semua komponen di dalam PC.",
      "PSU dengan sertifikasi efisiensi (seperti 80 Plus Bronze, Gold, dll.) dapat menghemat energi dan menghasilkan lebih sedikit panas.",
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
      "Storage adalah media penyimpanan data jangka panjang pada komputer, seperti HDD atau SSD.",
      "HDD (Hard Disk Drive) menggunakan piringan magnetik berputar untuk menyimpan data, menawarkan kapasitas besar dengan harga terjangkau.",
      "SSD (Solid State Drive) menggunakan chip memori flash tanpa bagian bergerak, memberikan kecepatan baca/tulis yang jauh lebih tinggi daripada HDD.",
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
];
