export const components = [
  {
    label: "Pengantar",
    modelFile: null,
    audioFile: "assets/audio/intro.mp3",
    description: [
      "Hardware atau perangkat keras adalah semua komponen fisik komputer atau laptop yang dapat dilihat dan diraba secara langsung. Fungsi utama hardware meliputi menerima input melalui perangkat seperti keyboard dan mouse, memproses data dengan CPU, menyimpan data pada hard disk atau SSD, serta memberikan output lewat monitor dan printer.",
      "Selain itu, hardware juga menghubungkan berbagai komponen komputer agar dapat bekerja sama secara harmonis. Sejarah perangkat keras dimulai dari komputer awal pada 1940-an sampai 1950-an seperti ENIAC dan UNIVAC yang menggunakan tabung vakum besar dan boros energi.",
      "Pada era 1960-an hingga 1970-an, perangkat keras mengecil berkat transistor dan sirkuit terpadu meski masih mahal dan besar. Penemuan mikroprosesor pada 1970-an memungkinkan munculnya komputer pribadi yang lebih kecil dan terjangkau.",
      "Era modern sejak 1990-an memperlihatkan perkembangan pesat hardware dengan CPU lebih cepat, kapasitas RAM lebih besar, dan penyimpanan solid-state yang efisien. Perangkat mobile pun semakin populer, menjadikan komputer lebih cepat, efisien, dan mudah diakses.",
    ],
    unlocked: true,
    quiz: [
      {
        question:
          "Komputer pertama seperti ENIAC menggunakan mikroprosesor modern.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Komputer awal seperti ENIAC menggunakan tabung vakum, bukan mikroprosesor yang baru ditemukan pada tahun 1970-an.",
      },
    ],
  },
  {
    label: "Monitor",
    modelFile: "assets/models/monitor.glb",
    audioFile: "assets/audio/monitor.mp3",
    description: [
      "Monitor adalah perangkat output komputer yang menampilkan informasi visual seperti teks, gambar, dan video. Alat ini memungkinkan pengguna untuk berinteraksi dengan sistem komputer. Sejarah monitor dimulai dari penemuan tabung sinar katoda (CRT) oleh Heinrich Geißler pada tahun 1855.",
      "Perkembangan monitor berlanjut menjadi teknologi LCD yang lebih tipis dan hemat energi, lalu disempurnakan dengan monitor LED yang menggunakan lampu latar LED, memberikan kualitas gambar dan efisiensi energi lebih baik. Monitor kini juga mendukung layar sentuh dan teknologi HDR.",
      "Monitor mengubah sinyal digital menjadi tampilan visual yang dapat dilihat pengguna. Fungsinya menampilkan beragam informasi komputer, seperti teks, grafik, dan video, agar mudah dipahami secara visual. Ini menjadikan monitor komponen vital dalam penggunaan komputer sehari-hari.",
      "Fungsi utama monitor adalah menampilkan hasil pemrosesan komputer, mulai dari dokumen teks hingga gambar dan video kompleks. Selain itu, monitor memungkinkan pengguna melihat antarmuka sistem operasi dan memberikan perintah melalui aplikasi yang digunakan.",
      "Monitor juga berguna untuk memantau status sistem komputer, misalnya penggunaan CPU atau RAM, sehingga membantu menjaga kinerja dan kesehatan alat. Selain itu, monitor meningkatkan produktivitas dengan menampilkan banyak data sekaligus, memudahkan multitasking.",
      "Sejarah monitor dimulai dengan era CRT yang memakai tabung besar dan berat. Penemuan tabung sinar katoda oleh Geißler dan pengembangannya oleh Plucker dan Braun menjadi fondasi teknologi ini. Kemudian layar LCD hadir menawarkan solusi lebih tipis dan hemat energi.",
      "Teknologi LED selanjutnya menyempurnakan LCD dengan menggunakan lampu LED sebagai cahaya latar, yang membuat gambar lebih cerah dan hemat daya. Monitor modern kini dilengkapi fitur canggih seperti layar sentuh, refresh rate tinggi, dan dukungan HDR, serta fungsi untuk presentasi dan kolaborasi digital.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Teknologi monitor pertama adalah Layar Kristal Cair (LCD).",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Sejarah monitor dimulai dari penemuan tabung sinar katoda (CRT), teknologi LCD baru muncul setelahnya.",
      },
    ],
  },
  {
    label: "Keyboard",
    modelFile: "assets/models/keyboard.glb",
    audioFile: "assets/audio/keyboard.mp3",
    description: [
      "Keyboard adalah perangkat keras yang digunakan untuk memasukkan teks, angka, simbol, dan perintah ke dalam komputer melalui penekanan tombol. Sejarahnya terinspirasi dari mesin ketik mekanik abad ke-19, lalu berkembang menjadi perangkat elektronik canggih yang mendukung berbagai fungsi seperti kontrol sistem dan input data.",
      "Keyboard terdiri dari susunan tombol yang mewakili huruf, angka, simbol, dan fungsi khusus. Ketika tombol ditekan, keyboard mengirimkan sinyal ke komputer yang diolah menjadi perintah atau data digital. Ini menjadikannya perangkat input utama dalam interaksi dengan komputer.",
      "Inspirasi keyboard modern berasal dari mesin ketik mekanik yang diperkenalkan pada abad ke-19. Christopher Latham Sholes mematenkan keyboard pertama pada 1868, yang kemudian digunakan dalam komputer pada 1964. Evolusi berlanjut dari teknologi kartu berlubang ke koneksi PS/2 dan USB, hingga keyboard nirkabel saat ini.",
      "Fungsi utama keyboard adalah mengetik teks, angka, dan simbol ke dalam dokumen atau pesan. Beberapa tombol khusus menjalankan perintah atau fungsi tertentu, seperti tombol fungsi (F1-F12) dan kombinasi shortcut (Ctrl+C, Alt+Tab) untuk memudahkan pekerjaan pengguna.",
      "Keyboard juga berperan dalam kontrol sistem operasi melalui tombol navigasi dan akses fitur tertentu. Selain mengetik, keyboard digunakan untuk menggerakkan kursor, menggulir layar, dan mengontrol elemen dalam aplikasi atau permainan.",
      "Dengan menguasai kombinasi tombol atau shortcut, pengguna dapat bekerja lebih cepat dan efisien. Keyboard menjadi alat penting yang menyederhanakan alur kerja dan meningkatkan produktivitas dalam berbagai aktivitas komputer.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Inspirasi keyboard modern berasal dari mesin ketik.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Keyboard modern terinspirasi dari mesin ketik mekanik yang populer pada abad ke-19.",
      },
    ],
  },
  {
    label: "Mouse",
    modelFile: "assets/models/mouse.glb",
    audioFile: "assets/audio/mouse.mp3",
    description: [
      "Mouse adalah perangkat input komputer yang mengontrol kursor di layar dan digunakan untuk memilih serta memanipulasi objek. Ditemukan Douglas Engelbart pada 1964, mouse awal berupa kotak kayu dengan tombol dan dua roda metal. Kini, mouse hadir dalam berbagai jenis seperti optik, nirkabel, dan ergonomis untuk kenyamanan dan fungsi lebih baik.",
      "Fungsi utama mouse adalah sebagai alat penunjuk yang memudahkan navigasi grafis antarmuka. Gerakan mouse di permukaan menggerakkan kursor di layar. Tombol kiri dipakai untuk memilih objek, sedangkan roda gulir memungkinkan menggulir halaman dengan mudah. Tombol kanan membuka menu konteks.",
      "Mouse juga mendukung fitur drag and drop, yakni memindahkan objek dengan menahan tombol kiri sambil menggeser mouse. Semua fungsi ini mempermudah interaksi pengguna dengan komputer secara visual dan intuitif, meningkatkan efisiensi kerja dan pengalaman pengguna.",
      "Sejarah mouse dimulai pada 1964 saat Douglas Engelbart dan Bill English menciptakan perangkat awal berbahan kayu dengan satu tombol dan dua roda metal. Penggunaan mouse berkembang dengan komputer Xerox Alto pada 1970-an, yang menjadi langkah awal popularisasi alat ini dalam komputer.",
      "Teknologi mouse terus maju dengan hadirnya mouse optik pada 1980-an dan pengenalan roda gulir pada 1995, yang memudahkan navigasi halaman. Pada akhir 1990-an, mouse nirkabel dan sensor laser mulai digunakan, meningkatkan akurasi dan kenyamanan penggunaan.",
      "Perkembangan mouse tidak berhenti di situ. Desain yang ergonomis terus dikembangkan untuk kenyamanan penggunanya. Penambahan tombol dan fungsi baru mencerminkan kemajuan teknologi sekaligus memenuhi kebutuhan interaksi yang makin kompleks antara pengguna dan komputer.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Mouse pertama kali ditemukan pada tahun 1964 oleh Douglas Engelbart.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Mouse pertama kali diciptakan oleh Douglas Engelbart pada tahun 1964, awalnya terbuat dari kayu.",
      },
    ],
  },
  {
    label: "Motherboard",
    modelFile: "assets/models/motherboard.glb",
    audioFile: "assets/audio/motherboard.mp3",
    description: [
      "Motherboard adalah papan sirkuit cetak utama yang menghubungkan komponen perangkat keras komputer seperti CPU, RAM, penyimpanan, dan kartu video. Fungsinya menyediakan konektivitas serta jalur distribusi daya dan data agar semua komponen dapat berkomunikasi dan bekerja secara harmonis. Sejarahnya dimulai pada 1981 dengan IBM 'Planar Breadboard' oleh Patty McHugh.",
      "Motherboard, juga disebut mainboard atau mobo, menjadi fondasi komputer dengan menyediakan jalur komunikasi yang menghubungkan berbagai hardware. Setiap motherboard dirancang untuk tipe prosesor dan memori tertentu, sehingga tersedia beragam jenis yang memungkinkan pembuatan sistem komputer yang berbeda.",
      "Fungsi utama motherboard adalah sebagai pusat penghubung yang mengintegrasikan seluruh komponen penting komputer. Ia menyediakan slot dan port untuk prosesor, memori, kartu grafis, dan media penyimpanan, serta jalur distribusi daya ke semua perangkat yang terpasang.",
      "Motherboard juga mengandung chip BIOS yang menyimpan konfigurasi sistem dan mengatur interaksi awal perangkat keras dengan sistem operasi. Selain itu, motherboard memiliki slot ekspansi seperti PCI dan PCI Express untuk menambah komponen ekstra seperti kartu suara atau jaringan.",
      "Sejarah motherboard dimulai tahun 1981 dengan IBM 'Planar Breadboard' yang dibuat oleh insinyur Patty McHugh. Model awal ini sederhana, hanya menampung CPU, RAM, dan beberapa komponen pendukung di sebuah papan sirkuit cetak sebagai dasar komputer pribadi pertama.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Motherboard adalah komponen opsional dalam sebuah komputer.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Motherboard adalah papan sirkuit utama yang wajib ada untuk menghubungkan semua komponen penting komputer.",
      },
    ],
  },
  {
    label: "Processor (CPU)",
    modelFile: "assets/models/cpu.glb",
    audioFile: "assets/audio/cpu.mp3",
    description: [
      "CPU, atau Unit Pemrosesan Pusat, adalah otak komputer yang mengeksekusi instruksi dan memproses data. CPU bekerja bersama unit kontrol (CU) dan unit logika aritmatika (ALU) untuk menjalankan tugas. Sejarahnya bermula dari penggunaan tabung vakum pada 1940-an hingga mikroprosesor Intel 4004 tahun 1971 yang merevolusi komputer.",
      "CPU adalah komponen inti perangkat keras yang berfungsi sebagai otak komputer atau perangkat digital lain. Tugas utamanya memproses instruksi perangkat lunak dan data untuk menghasilkan keluaran sesuai perintah yang diberikan.",
      "CPU terdiri dari unit-unit yang bekerja bersama, seperti Unit Kontrol (CU) yang mengatur pengambilan instruksi dan aliran data, serta Unit Logika Aritmatika (ALU) yang melakukan operasi perhitungan dan perbandingan logika. Unit memori cache menyimpan data sementara untuk mempercepat proses.",
      "Sejarah CPU dimulai pada 1940-an dengan tabung vakum yang besar dan boros daya, seperti pada komputer ENIAC. Kemudian teknologi transistor dan sirkuit terpadu (IC) mengubah desain CPU menjadi lebih kecil dan efisien.",
      "Mikroprosesor pertama, Intel 4004, muncul pada 1971 sebagai chip terpadu yang menggabungkan seluruh fungsi CPU, membuka era komputer lebih kecil dan cepat. Sejak IBM System/360 pada 1964, produsen seperti Intel, AMD, dan ARM terus mengembangkan CPU dengan performa tinggi dan efisiensi energi.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Intel 4004 adalah mikroprosesor pertama di dunia yang dirilis pada tahun 1971.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Mikroprosesor pertama, Intel 4004, yang dirilis pada tahun 1971, menjadi tonggak sejarah dalam evolusi CPU.",
      },
    ],
  },
  {
    label: "Memori",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/ram.mp3",
    description: [
      "RAM atau Random Access Memory adalah memori sementara (volatil) yang digunakan komputer untuk menyimpan data yang sedang diproses agar dapat diakses cepat oleh prosesor. Sejarah RAM dimulai dari tabung Williams pada 1947, lalu berkembang ke memori inti magnetik dan teknologi DRAM pada 1968-1970-an.",
      "RAM bersifat volatil, artinya data hanya tersimpan selama perangkat menyala dan hilang saat dimatikan. RAM memungkinkan prosesor membaca dan menulis data dengan sangat cepat dibandingkan penyimpanan permanen seperti hard drive atau SSD.",
      "Sebagai ruang kerja aktif, RAM menyimpan data dan instruksi yang sedang diproses secara real-time. Ini penting untuk mempercepat pemrosesan data dan membuat perangkat dapat menjalankan multitasking dengan lancar tanpa hambatan.",
      "Sejarah RAM dimulai dengan tabung Williams yang menyimpan data sebagai muatan listrik di layar tabung CRT pada 1947. Selanjutnya memori inti magnetik menggunakan cincin kecil yang menyimpan data sebagai pengembangan RAM awal.",
      "Teknologi DRAM, ditemukan oleh Robert Dennard pada 1968-1970-an dan diproduksi massal oleh Intel, membawa efisiensi lebih tinggi dalam penyimpanan data sementara. RAM berfungsi menyimpan data sementara, mempercepat akses CPU, mendukung multitasking, dan menyediakan ruang kerja real-time.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Data yang tersimpan di RAM akan tetap ada meskipun komputer dimatikan.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "RAM bersifat volatil, yang berarti data akan hilang saat komputer tidak mendapatkan daya listrik.",
      },
    ],
  },
  {
    label: "Kartu Grafis (GPU)",
    modelFile: "assets/models/gpu.glb",
    audioFile: "assets/audio/gpu.mp3",
    description: [
      "Kartu Grafis (GPU) adalah prosesor khusus yang dirancang untuk memproses data grafis seperti gambar dan video dengan efisiensi tinggi menggunakan komputasi paralel. GPU berfungsi merender gambar, animasi, dan video, serta mendukung tugas intensif seperti machine learning. Istilah GPU populer sejak 1999 dengan NVIDIA GeForce 256.",
      "GPU adalah chip yang mengolah dan menampilkan data grafis ke layar. Berbeda dari CPU yang bekerja berurutan, GPU memiliki ribuan inti pemrosesan paralel sehingga mampu merender gambar dan video dengan sangat cepat. GPU bisa berdiri sendiri sebagai kartu terpisah atau terintegrasi di CPU atau motherboard.",
      "Fungsi utama GPU adalah merender grafis dua dan tiga dimensi dengan cepat dan akurat. GPU juga melakukan komputasi paralel untuk tugas berat seperti machine learning dan desain grafis, menghasilkan gambar berkualitas tinggi yang halus dan realistis, serta meringankan beban CPU.",
      "Sejarah GPU dimulai pada 1970-an sebagai istilah 'Graphics Processor Unit'. Pada 1994, Sony menggunakan istilah ini untuk PlayStation yang dibuat Toshiba. NVIDIA mempopulerkan istilah GPU tahun 1999 dengan meluncurkan GeForce 256 sebagai GPU pertama di dunia.",
      "Sejak itu, GPU berkembang dengan fitur shader yang dapat diprogram, teknik anti-aliasing, dan dukungan warna presisi tinggi. Peran GPU semakin penting dalam deep learning karena mampu melatih jaringan saraf jauh lebih cepat daripada CPU, membuka peluang baru dalam berbagai aplikasi canggih.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "GPU hanya berfungsi untuk menampilkan teks dan tidak bisa memproses grafis 3D.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Fungsi utama GPU adalah merender grafis dua dan tiga dimensi (3D) dengan cepat dan efisien.",
      },
    ],
  },
  {
    label: "Kartu Jaringan",
    modelFile: "assets/models/kartu_jaringan.glb",
    audioFile: "assets/audio/kartu_jaringan.mp3",
    description: [
      "Kartu jaringan atau NIC (Network Interface Card) adalah perangkat keras yang menghubungkan komputer ke jaringan dengan mengubah data menjadi paket untuk transmisi dan mengonversinya kembali agar dapat digunakan komputer. Sejarahnya dimulai dari pengembangan di IBM akhir 1960-an hingga standar Ethernet dan Wi-Fi.",
      "NIC berperan sebagai penghubung antara komputer dan jaringan. Ia mengubah data komputer menjadi format yang bisa dikirim melalui kabel atau sinyal nirkabel, dan mengonversi data dari jaringan menjadi bentuk yang dapat diproses komputer.",
      "Fungsi utama NIC adalah menghubungkan perangkat ke jaringan, mengirim dan menerima data, serta melakukan pengalamatan menggunakan alamat fisik unik bernama MAC address. NIC mendukung koneksi kabel seperti Ethernet dan koneksi nirkabel seperti Wi-Fi.",
      "Sejarah NIC dimulai dengan konsep kartu antarmuka pada akhir 1960-an dan 1970-an, seiring perkembangan teknologi Ethernet oleh IBM, Xerox, Intel, dan DEC. Ethernet menjadi standar penting yang membuat NIC wajib di jaringan lokal (LAN).",
      "Dengan kemajuan teknologi, NIC berkembang termasuk kartu jaringan nirkabel yang memberi fleksibilitas koneksi tanpa kabel. NIC terus berevolusi menyesuaikan standar jaringan, meningkatkan kecepatan transfer data dan efisiensi penanganan data di jaringan modern.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Setiap kartu jaringan memiliki alamat fisik unik yang disebut MAC address.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Kartu jaringan menggunakan MAC address sebagai pengenal unik untuk mengirim dan menerima data di jaringan.",
      },
    ],
  },
  {
    label: "Storage (HDD/SDD)",
    modelFile: "assets/models/storage.glb",
    audioFile: "assets/audio/storage.mp3",
    description: [
      "HDD (Hard Disk Drive) adalah media penyimpanan mekanis yang menggunakan piringan magnetik berputar untuk menyimpan data secara permanen. Ditemukan pada 1956, HDD telah menjadi standar penyimpanan selama puluhan tahun. SSD (Solid State Drive) adalah media penyimpanan berbasis chip memori flash yang lebih cepat dan tahan guncangan, menggantikan HDD dalam banyak aplikasi modern.",
      "HDD menyimpan data dengan membaca dan menulis di piringan magnetik menggunakan head bergerak. SSD menggunakan chip memori flash NAND tanpa bagian bergerak sehingga lebih tahan lama dan hemat energi. Keduanya berfungsi menyimpan sistem operasi, aplikasi, dan file pribadi pengguna secara permanen.",
      "HDD ditemukan oleh IBM pada 1956 dan menjadi tulang punggung penyimpanan komputer selama beberapa dekade. SSD hadir sebagai revolusi penyimpanan berbasis sirkuit terpadu, memberikan kecepatan baca tulis yang jauh lebih tinggi dan daya tahan lebih baik, cocok untuk komputer modern.",
      "Fungsi utama HDD dan SSD adalah menyimpan sistem operasi agar komputer dapat booting, menyimpan aplikasi agar dapat dijalankan, serta menyimpan file pribadi seperti dokumen, foto, musik, dan video. Keduanya juga mempercepat pengolahan data di server dan mendukung produktivitas bisnis yang butuh akses data cepat.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "SSD menyimpan data menggunakan piringan magnetik yang berputar.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "SSD menggunakan chip memori flash tanpa bagian bergerak, sedangkan HDD yang menggunakan piringan magnetik.",
      },
    ],
  },
  {
    label: "Printer",
    modelFile: "assets/models/printer.glb",
    audioFile: "assets/audio/printer.mp3",
    description: [
      "Printer adalah perangkat keras yang mengubah data digital menjadi salinan fisik di atas kertas, seperti teks dan gambar. Selain mencetak, printer juga berfungsi memindai dan menyalin dokumen. Sejarahnya dimulai dari mesin cetak Gutenberg abad ke-15, lalu berkembang ke printer elektronik Epson tahun 1968 hingga printer 3D modern.",
      "Printer mengambil data dari komputer dan mengubahnya menjadi dokumen atau gambar fisik, yang disebut hardcopy. Proses ini memudahkan penyimpanan dan distribusi informasi dari bentuk digital ke media cetak yang nyata.",
      "Sejarah printer berawal dari mesin cetak Johannes Gutenberg pada 1440-an yang menggunakan huruf logam untuk mencetak buku. Printer elektronik pertama muncul pada 1968 oleh Epson, diikuti inovasi printer laser HP pada 1984 yang menghasilkan cetakan berkualitas tinggi.",
      "Seiring kemajuan teknologi, printer berkembang menjadi perangkat multifungsi dengan kemampuan mencetak foto berkualitas tinggi, memindai dokumen, menyalin tanpa komputer, bahkan mengirim dan menerima faks. Printer 3D juga memungkinkan mencetak objek tiga dimensi dari desain digital, membuka banyak peluang baru.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Fungsi utama printer adalah mengubah dokumen fisik menjadi data digital.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Printer berfungsi mengubah data digital menjadi salinan fisik (hardcopy). Fungsi sebaliknya dilakukan oleh scanner.",
      },
    ],
  },
  {
    label: "Flashdisk",
    modelFile: "assets/models/flashdisk.glb",
    audioFile: "assets/audio/flashdisk.mp3",
    description: [
      "Flashdisk adalah perangkat penyimpanan data portabel yang menggunakan memori flash tipe NAND untuk menyimpan data secara permanen tanpa daya listrik. Terhubung melalui port USB, flashdisk berfungsi menyimpan, mentransfer, dan mencadangkan data dengan mudah. Teknologi memori flash dikembangkan pada 1980-an oleh Dr. Fujio Masuoka.",
      "Flashdisk berupa alat kecil, ringan, dan mudah dibawa, yang memanfaatkan teknologi memori flash non-volatil. Koneksi USB memungkinkan perangkat ini berintegrasi dengan komputer atau perangkat lain untuk akses data cepat dan praktis kapan saja.",
      "Sejarah flashdisk dimulai saat M-Systems memperkenalkan DiskOnKey pada 1999 dengan kapasitas 8 MB, menjadi alternatif disket pertama yang sukses. Setelah itu, banyak perusahaan seperti IBM dan Netac mengembangkan flashdisk dengan kapasitas dan kecepatan yang terus meningkat.",
      "Fungsi utama flashdisk adalah menyimpan dan mentransfer berbagai jenis file secara cepat tanpa internet, membantu mencadangkan data penting. Selain itu, flashdisk bisa menjalankan aplikasi portabel dan menjadi media instalasi sistem operasi, menjadikannya alat multifungsi untuk kebutuhan sehari-hari.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Flashdisk memerlukan daya listrik eksternal untuk menyimpan data secara permanen.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Flashdisk menggunakan memori flash non-volatil, yang artinya dapat menyimpan data secara permanen tanpa memerlukan daya listrik.",
      },
    ],
  },
];
