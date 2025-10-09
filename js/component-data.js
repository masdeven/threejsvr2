export const components = [
  {
    label: "Introduction",
    modelFile: null,
    audioFile: "assets/audio/history.mp3",
    description: [
      "The history of computers began with simple counting tools such as the abacus thousands of years ago, then developed into mechanical calculating machines in the 17th century. The first electronic computers, such as ENIAC in 1946, were room-sized and used thousands of vacuum tubes. The development of transistors in the 1950s allowed computers to become smaller and more efficient, followed by integrated circuits in the 1960s that further reduced computer size.",
      "The era of personal computers began in the 1970s with the emergence of the Apple II and IBM PC, making computers usable in homes and small offices. The 1980s to 1990s became a period of rapid development with the arrival of Windows operating systems, the mouse, and user-friendly graphical interfaces. The Internet became popular in the 1990s, changing the way humans communicate and access information.",
      "The 21st century brought the revolution of mobile computers with increasingly thin and light laptops, smartphones as pocket computers, and tablets combining portability with touchscreens. Cloud computing technology enables data access from anywhere, while artificial intelligence and machine learning open a new era of intelligent computing that can learn and adapt. Today, quantum computers are being developed to solve extremely complex computational problems.",
    ],
    unlocked: true,
    quiz: [
      {
        question:
          "The era of personal computers, marked by devices like the Apple II and IBM PC, began in the 1970s.",
        answers: ["True", "False"],
        correctAnswerIndex: 0, // Answer is True
        explanation:
          "The text confirms that 'The era of personal computers began in the 1970s with the emergence of the Apple II and IBM PC'.",
      },
    ],
  },
  {
    label: "Monitor",
    modelFile: "assets/models/monitor.glb",
    audioFile: "assets/audio/monitor.mp3",
    description: [
      "A monitor is the computer’s display screen that functions as a visual window between the user and the computer system. This device displays all information, images, videos, and program interfaces running on the computer. Without a monitor, we cannot see what the computer is working on.",
      "There are several types of monitors based on their technology, such as LED monitors which are most commonly used today because they are energy-efficient and provide good image quality, OLED monitors with high contrast and more vivid colors, and gaming monitors with high refresh rates for smoother gaming experiences. Monitors are also available in various sizes ranging from 15 inches to 32 inches or larger.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "A monitor functions as a visual window, displaying information and program interfaces to the user.",
        answers: ["True", "False"],
        correctAnswerIndex: 0, // Answer is True
        explanation:
          "The description states that a monitor 'functions as a visual window' and 'displays all information, images, videos, and program interfaces'.",
      },
    ],
  },
  {
    label: "Keyboard",
    modelFile: "assets/models/keyboard.glb",
    audioFile: "assets/audio/keyboard.mp3",
    description: [
      "A keyboard is the main input device that allows users to enter text, numbers, and commands into the computer. Each key on the keyboard represents a specific character or function that is sent to the computer when pressed. Modern keyboards generally have 104 standard keys including letters, numbers, symbols, and special function keys.",
      "There are various types of keyboards available, from membrane keyboards that use a flexible layer and are more affordable, mechanical keyboards that provide better tactile response and durability, to wireless keyboards that use Bluetooth or a USB receiver. Some special keyboards are also equipped with backlighting or macro keys for gaming and productivity needs.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "A keyboard is a primary input device used for entering text, numbers, and commands into a computer.",
        answers: ["True", "False"],
        correctAnswerIndex: 0, // Answer is True
        explanation:
          "The text clearly identifies the keyboard as 'the main input device that allows users to enter text, numbers, and commands'.",
      },
    ],
  },
  {
    label: "Mouse",
    modelFile: "assets/models/mouse.glb",
    audioFile: "assets/audio/mouse.mp3",
    description: [
      "A mouse is a pointing device that allows the user to control the cursor on the computer screen and interact with visual elements such as icons, menus, and buttons. The mouse works by detecting movement and converting it into cursor movement on the screen. This device has left and right buttons for clicking, as well as a scroll wheel for page navigation.",
      "Based on detection technology, there are optical mice that use LED sensors and can be used on almost any surface, laser mice that are more accurate and sensitive, and gaming mice with high DPI for precise movement. Mice are also available in wired and wireless versions, with ergonomics designed for long-term comfort.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "A mouse is primarily considered an output device.",
        answers: ["True", "False"],
        correctAnswerIndex: 1, // Answer is False
        explanation:
          "The description identifies the mouse as a 'pointing device' for user interaction, which is an input function, not an output function.",
      },
    ],
  },
  {
    label: "Motherboard",
    modelFile: "assets/models/motherboard.glb",
    audioFile: "assets/audio/motherboard.mp3",
    description: [
      "The motherboard is the main component that connects all parts of the computer into one complete system. As the name suggests, the motherboard functions as the “mother” that provides communication pathways and electrical power for all other components such as the processor, RAM, graphics card, and storage devices. Without a motherboard, these components cannot communicate with each other.",
      "Motherboards come in various sizes or form factors, from large ATX boards suitable for desktop computers with many expansion slots, Micro-ATX which is more compact but still feature-rich, to Mini-ITX which is very small for space-saving PC builds. Each motherboard has a specific processor socket, RAM slots, input-output ports, and a chipset that determines compatibility with other components.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "The motherboard is an optional component in a computer.",
        answers: ["True", "False"],
        correctAnswerIndex: 1, // Answer is False
        explanation:
          "The text states the motherboard is the 'main component' and is essential for other parts to communicate, making it mandatory.",
      },
    ],
  },
  {
    label: "Processor (CPU)",
    modelFile: "assets/models/cpu.glb",
    audioFile: "assets/audio/cpu.mp3",
    description: [
      "The CPU or processor is the brain of the computer that is responsible for executing all instructions and calculations required by the system and applications. Every time you open a program, type, or perform any activity on the computer, the CPU processes these commands at very high speed. CPU performance greatly determines how fast the computer can complete tasks.",
      "Modern CPUs come in various core configurations, ranging from dual-core for basic needs, quad-core for smooth multitasking, to 8, 16, or even 32 cores for professional tasks such as video editing and rendering. The two main CPU manufacturers are Intel with its Core i3, i5, i7, and i9 series, and AMD with its Ryzen 3, 5, 7, and 9 series. The higher the number, the more powerful the performance offered.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "The CPU acts as the 'brain' of the computer, processing instructions and performing calculations.",
        answers: ["True", "False"],
        correctAnswerIndex: 0, // Answer is True
        explanation:
          "The description explicitly states that the CPU 'is the brain of the computer that is responsible for executing all instructions and calculations'.",
      },
    ],
  },
  {
    label: "Memory (RAM)",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/memory.mp3",
    description: [
      "Memory is a storage area used by the computer to run programs and the operating system. RAM or Random Access Memory serves as the computer’s workspace, storing data that is actively in use so it can be quickly accessed by the processor. The larger the RAM capacity, the more programs can run simultaneously without slowing the computer down.",
      "ROM or Read-Only Memory is a permanent type of memory that stores basic instructions for starting the computer, such as the BIOS or UEFI. RAM is available in various capacities starting from 4GB for basic needs, 8GB for normal use, up to 16GB or 32GB for professional requirements. RAM also comes in different speeds, such as DDR4 and the newer DDR5 with better performance.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "A larger RAM capacity allows a computer to store more files permanently.",
        answers: ["True", "False"],
        correctAnswerIndex: 1, // Answer is False
        explanation:
          "According to the text, RAM is the computer's temporary workspace. Permanent file storage is the role of devices like HDDs or SSDs.",
      },
    ],
  },
  {
    label: "Graphics Card (GPU)",
    modelFile: "assets/models/gpu.glb",
    audioFile: "assets/audio/gpu.mp3",
    description: [
      "The GPU or graphics card is the component responsible for processing and displaying images, videos, animations, and visual effects on the computer screen. Unlike the CPU, which is designed for general processing, the GPU has thousands of small cores that work in parallel to handle complex graphic calculations efficiently. The GPU is essential for gaming, graphic design, video editing, and applications that require high visualization.",
      "There are two types of GPUs: integrated graphics, which are built into the processor and suitable for basic needs, and dedicated graphics cards, which are separate cards with much higher performance. Dedicated GPUs are produced by NVIDIA with its GeForce RTX and GTX series, and AMD with its Radeon RX series. Modern GPUs also support ray tracing technology for realistic lighting and DLSS to increase frame rates in gaming.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Dedicated graphics cards are separate components that offer much higher performance than integrated graphics.",
        answers: ["True", "False"],
        correctAnswerIndex: 0, // Answer is True
        explanation:
          "The text distinguishes between integrated graphics and 'dedicated graphics cards, which are separate cards with much higher performance'.",
      },
    ],
  },
  {
    label: "Network Card (NIC)",
    modelFile: "assets/models/kartu_jaringan.glb",
    audioFile: "assets/audio/network_card.mp3",
    description: [
      "A network card or Network Interface Card is a component that allows the computer to connect to the internet or a local network. This device acts as a communication bridge between the computer and a router, modem, or other network devices. The network card converts digital data into signals that can be transmitted via cable or radio waves for wireless connections.",
      "Network cards are available in two main types: Ethernet cards for wired connections with stable speed and low latency, and WiFi cards for wireless connections that provide mobility flexibility. Network card speeds range from 100 Mbps for basic needs, 1 Gbps for home use, up to 10 Gbps for servers and enterprise needs. Most modern motherboards already have an integrated network card.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Ethernet cards are used for wireless connections to provide mobility.",
        answers: ["True", "False"],
        correctAnswerIndex: 1, // Answer is False
        explanation:
          "The description specifies that Ethernet cards are for wired connections, while WiFi cards are for wireless ones.",
      },
    ],
  },
  {
    label: "Storage",
    modelFile: "assets/models/storage.glb",
    audioFile: "assets/audio/storage.mp3",
    description: [
      "Storage is the device that permanently stores all data, files, programs, and the operating system on the computer. Unlike RAM, which is temporary, data in storage remains saved even when the computer is turned off. Storage plays a vital role in keeping photos, videos, documents, games, applications, and all your digital files.",
      "There are two main types of storage: HDD or Hard Disk Drive, which uses rotating magnetic disks with large capacity and affordable prices, and SSD or Solid State Drive, which uses flash memory chips with much faster read-write speeds but is more expensive. Storage is available in various capacities from 128GB to several terabytes, with SATA interfaces for traditional HDDs and NVMe for modern SSDs that are super fast.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Unlike RAM, data in a storage device remains saved even when the computer is turned off.",
        answers: ["True", "False"],
        correctAnswerIndex: 0, // Answer is True
        explanation:
          "The description states that 'Unlike RAM, which is temporary, data in storage remains saved even when the computer is turned off'.",
      },
    ],
  },
  {
    label: "Printer",
    modelFile: "assets/models/printer.glb",
    audioFile: "assets/audio/printer.mp3",
    description: [
      "A printer is an output device that functions to print digital documents into physical form on paper or other media. The printer converts text, images, or documents from the computer into printed results that can be held and read directly. This device is very important for office, school, and household needs in producing physical documents.",
      "Based on printing technology, there are inkjet printers that use liquid ink and are suitable for printing high-quality photos but have higher operating costs, laser printers that use powdered toner with high print speeds and are ideal for large-volume text documents, and dot matrix printers that are still used for official documents because they can print with pressure. Printers are also available in monochrome black-and-white or color versions for color printing needs.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "The main function of a printer is to convert physical documents into digital data.",
        answers: ["True", "False"],
        correctAnswerIndex: 1, // Answer is False
        explanation:
          "The description says a printer is an output device that prints digital documents into physical form. A scanner performs the opposite function.",
      },
    ],
  },
  {
    label: "Flash Drive",
    modelFile: "assets/models/flashdisk.glb",
    audioFile: "assets/audio/flashdrive.mp3",
    description: [
      "A flash drive or USB flash drive is a small portable storage device that can be easily carried anywhere. This device uses flash memory technology, which allows data storage without the need for electrical power to retain data. Flash drives are very practical for transferring files between computers, backing up important data, or storing temporary files.",
      "Flash drives are available in various capacities starting from 8GB for basic needs up to 1TB for large storage, with USB 2.0, USB 3.0, USB 3.2, and USB-C interfaces for faster data transfer. Flash drive transfer speeds vary from 10 MB/s to over 200 MB/s depending on the technology used. Some flash drives are equipped with encryption and passwords for data security.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "A flash drive is a portable storage device that is practical for transferring files between computers.",
        answers: ["True", "False"],
        correctAnswerIndex: 0, // Answer is True
        explanation:
          "The text describes a flash drive as a 'small portable storage device' that is 'very practical for transferring files between computers'.",
      },
    ],
  },
];
