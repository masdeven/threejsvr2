export const components = [
  {
    label: "Pengantar",
    modelFile: null,
    audioFile: "assets/audio/intro.mp3",
    description: [
      "Perangkat keras (hardware) adalah komponen fisik komputer yang dapat dilihat dan disentuh. Fungsinya meliputi empat tugas utama: menerima input (seperti keyboard), memproses data (dengan CPU), menyimpan data (pada SSD/HDD), dan memberikan output (melalui monitor). Komponen ini bekerja sama untuk menjalankan sistem.",
      "Sejarah hardware dimulai pada 1940-an dengan komputer seperti ENIAC yang menggunakan tabung vakum besar. Era transistor pada 1960-an membuat perangkat menyusut, hingga penemuan mikroprosesor pada 1970-an yang menjadi dasar komputer pribadi modern saat ini.",
      "Era modern sejak 1990-an ditandai inovasi pesat: CPU lebih cepat, RAM berkapasitas besar, dan penyimpanan SSD yang efisien. Perkembangan ini meningkatkan kekuatan komputer desktop serta memicu revolusi perangkat mobile yang ringkas dan bertenaga.",
    ],
    unlocked: true,
    quiz: [
      {
        question:
          "Komputer pertama seperti ENIAC menggunakan mikroprosesor modern.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Komputer awal seperti ENIAC menggunakan tabung vakum, bukan mikroprosesor yang ditemukan pada 1970-an.",
      },
    ],
  },
  {
    label: "Monitor",
    modelFile: "assets/models/monitor.glb",
    audioFile: "assets/audio/monitor.mp3",
    description: [
      "Monitor adalah perangkat output utama yang menampilkan informasi visual dari komputer, seperti teks dan gambar. Sejarahnya dimulai dari teknologi tabung sinar katoda (CRT) yang besar dan berat, menjadi komponen penting untuk interaksi dengan sistem operasi dan aplikasi.",
      "Perkembangan monitor melahirkan teknologi Liquid Crystal Display (LCD) dan Light Emitting Diode (LED) yang menawarkan desain lebih ramping, konsumsi daya lebih rendah, dan kualitas gambar lebih tinggi. Fitur modern seperti layar sentuh dan HDR memperkaya pengalaman visual pengguna.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Teknologi monitor pertama adalah Layar Kristal Cair (LCD).",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Sejarah monitor dimulai dari penemuan tabung sinar katoda (CRT); teknologi LCD muncul kemudian.",
      },
    ],
  },
  {
    label: "Keyboard",
    modelFile: "assets/models/keyboard.glb",
    audioFile: "assets/audio/keyboard.mp3",
    description: [
      "Keyboard adalah perangkat input utama yang memungkinkan memasukkan teks, angka, dan perintah ke komputer. Desainnya terinspirasi dari mesin ketik mekanis abad ke-19. Saat tombol ditekan, keyboard mengirimkan sinyal spesifik ke komputer untuk diproses.",
      "Selain mengetik, keyboard berfungsi untuk kontrol sistem lewat tombol fungsi (F1-F12) dan shortcut seperti Ctrl+C. Penggunaan shortcut mempercepat alur kerja dan meningkatkan produktivitas dalam bernavigasi aplikasi.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Inspirasi keyboard modern berasal dari mesin ketik.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Keyboard modern terinspirasi dari mesin ketik mekanis populer abad ke-19.",
      },
    ],
  },
  {
    label: "Mouse",
    modelFile: "assets/models/mouse.glb",
    audioFile: "assets/audio/mouse.mp3",
    description: [
      "Mouse adalah perangkat input penunjuk yang mengontrol pergerakan kursor di layar. Diciptakan Douglas Engelbart pada 1964, model pertama terbuat dari kayu. Mouse menyederhanakan navigasi dalam antarmuka grafis (GUI).",
      "Fungsi utama meliputi memilih objek (klik kiri), membuka menu konteks (klik kanan), dan menggulir halaman (scroll wheel). Fitur 'drag and drop' sangat bergantung pada mouse. Kini mouse berkembang dari model mekanis menjadi optik dan nirkabel untuk kenyamanan lebih baik.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Mouse pertama kali ditemukan pada tahun 1964 oleh Douglas Engelbart.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Mouse pertama diciptakan Douglas Engelbart pada 1964, awalnya terbuat dari kayu.",
      },
    ],
  },
  {
    label: "Motherboard",
    modelFile: "assets/models/motherboard.glb",
    audioFile: "assets/audio/motherboard.mp3",
    description: [
      "Motherboard atau mainboard adalah papan sirkuit utama yang menjadi fondasi komputer. Komponen ini mengintegrasikan semua perangkat keras penting seperti CPU, RAM, kartu grafis, dan penyimpanan agar dapat berkomunikasi.",
      "Motherboard menyediakan slot dan port untuk komponen, mendistribusikan daya, serta mengatur aliran data lewat jalur sirkuit yang disebut 'bus'. Tanpa motherboard, komputer tidak dapat berfungsi sebagai satu sistem utuh.",
      "Motherboard dilengkapi chip BIOS atau UEFI yang menjalankan inisialisasi perangkat keras saat komputer dinyalakan. Slot ekspansi seperti PCI Express memungkinkan penambahan kartu suara atau jaringan.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Motherboard adalah komponen opsional dalam sebuah komputer.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Motherboard adalah papan sirkuit utama yang wajib menghubungkan semua komponen penting komputer.",
      },
    ],
  },
  {
    label: "Processor (CPU)",
    modelFile: "assets/models/cpu.glb",
    audioFile: "assets/audio/cpu.mp3",
    description: [
      "CPU (Central Processing Unit) dikenal sebagai 'otak' komputer. Komponen inti ini bertugas mengeksekusi instruksi perangkat lunak serta memproses data. Kecepatan CPU, diukur dalam Gigahertz (GHz), memengaruhi kinerja sistem secara keseluruhan.",
      "Di dalam CPU terdapat Arithmetic Logic Unit (ALU) yang mengelola operasi matematika dan logika, serta Control Unit (CU) yang mengatur seluruh aktivitas prosesor. Sejarah CPU dimulai dari Intel 4004 pada 1971, mikroprosesor pertama di dunia.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Intel 4004 adalah mikroprosesor pertama di dunia yang dirilis pada tahun 1971.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Mikroprosesor pertama, Intel 4004, dirilis pada 1971 dan menjadi tonggak dalam evolusi CPU.",
      },
    ],
  },
  {
    label: "Memori",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/ram.mp3",
    description: [
      "RAM (Random Access Memory) adalah memori berkecepatan tinggi yang menyimpan data sementara untuk CPU. Kapasitas RAM yang besar memungkinkan multitasking yang lancar dengan menjalankan banyak aplikasi sekaligus.",
      "RAM bersifat volatil, artinya data di dalamnya akan hilang saat komputer dimatikan, berbeda dengan penyimpanan jangka panjang seperti SSD atau HDD yang non-volatil.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Data yang tersimpan di RAM akan tetap ada meskipun komputer dimatikan.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "RAM bersifat volatil; data hilang ketika tidak ada daya listrik.",
      },
    ],
  },
  {
    label: "Kartu Grafis (GPU)",
    modelFile: "assets/models/gpu.glb",
    audioFile: "assets/audio/gpu.mp3",
    description: [
      "GPU (Graphics Processing Unit) adalah prosesor khusus untuk mempercepat rendering gambar, video, dan animasi di monitor. GPU mengurangi beban kerja CPU, penting untuk gaming dan desain grafis.",
      "Keunggulan GPU adalah komputasi paralel dengan ribuan inti prosesor yang memproses banyak tugas kecil sekaligus. Istilah GPU dipopulerkan NVIDIA pada 1999 dengan GeForce 256.",
      "Selain gaming, GPU sangat berguna dalam AI dan machine learning karena efisiensi proses paralel dalam melatih model kompleks jauh lebih cepat dari CPU.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "GPU hanya berfungsi untuk menampilkan teks dan tidak bisa memproses grafis 3D.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "GPU utama untuk merender grafis dua dan tiga dimensi secara efisien.",
      },
    ],
  },
  {
    label: "Kartu Jaringan",
    modelFile: "assets/models/kartu_jaringan.glb",
    audioFile: "assets/audio/kartu_jaringan.mp3",
    description: [
      "Kartu Jaringan atau NIC adalah perangkat keras yang menghubungkan komputer ke jaringan seperti internet atau LAN, tersedia dalam Ethernet untuk kabel dan Wi-Fi untuk nirkabel.",
      "Fungsi utama NIC adalah mengonversi data komputer menjadi sinyal untuk jaringan dan sebaliknya. Setiap NIC memiliki alamat unik bernama MAC address untuk identifikasi di jaringan.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Setiap kartu jaringan memiliki alamat fisik unik yang disebut MAC address.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "MAC address adalah identitas unik NIC untuk komunikasi data di jaringan.",
      },
    ],
  },
  {
    label: "Storage (HDD/SSD)",
    modelFile: "assets/models/storage.glb",
    audioFile: "assets/audio/storage.mp3",
    description: [
      "Storage atau perangkat penyimpanan menyimpan data secara permanen walau komputer mati, menyimpan sistem operasi, aplikasi, dan file pribadi. Dua jenis utama adalah HDD dan SSD.",
      "HDD menggunakan piringan magnetik berputar dan lengan mekanis untuk baca/tulis data. Kapasitas besar dan harga terjangkau, tapi lebih lambat dan rentan guncangan.",
      "SSD adalah teknologi modern tanpa bagian bergerak, memakai chip memori flash, membuatnya jauh lebih cepat, senyap, dan tahan lama, mempercepat booting dan loading aplikasi.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "SSD menyimpan data menggunakan piringan magnetik yang berputar.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "SSD memakai memori flash tanpa bagian bergerak, HDD yang menggunakan piringan magnetik.",
      },
    ],
  },
  {
    label: "Printer",
    modelFile: "assets/models/printer.glb",
    audioFile: "assets/audio/printer.mp3",
    description: [
      "Printer adalah perangkat output yang mencetak data digital dari komputer ke media fisik, biasanya kertas. Hasil cetak disebut hardcopy. Teknologi umum adalah inkjet yang menyemprot tinta dan laser yang menggunakan toner bubuk.",
      "Printer modern banyak yang multifungsi (All-in-One), bisa mencetak, memindai dokumen jadi file digital, menyalin dokumen, dan mengirim/receiving faks.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Fungsi utama printer adalah mengubah dokumen fisik menjadi data digital.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Printer mengubah data digital menjadi hardcopy; scanner mengubah dokumen fisik menjadi digital.",
      },
    ],
  },
  {
    label: "Flashdisk",
    modelFile: "assets/models/flashdisk.glb",
    audioFile: "assets/audio/flashdisk.mp3",
    description: [
      "Flashdisk atau USB flash drive adalah perangkat penyimpanan portabel yang menggunakan memori flash non-volatil. Ukurannya kecil, ringan, dan tidak butuh daya eksternal, memudahkan pemindahan file antar komputer.",
      "Terhubung ke komputer melalui port USB, flashdisk tak hanya untuk transfer file, tapi juga untuk backup data, menjalankan aplikasi portabel, dan media instalasi sistem operasi.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Flashdisk memerlukan daya listrik eksternal untuk menyimpan data secara permanen.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Memori flash non-volatil menyimpan data tanpa memerlukan daya listrik.",
      },
    ],
  },
];
