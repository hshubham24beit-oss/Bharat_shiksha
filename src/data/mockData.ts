import {
  StudentProfile,
  LessonPlan,
  TeachingStep,
  Quiz,
  SmartNotes,
  VideoLecture,
  AnalyticsReport,
} from "../types";

export const initialStudentProfile: StudentProfile = {
  id: "student-shubham-01",
  name: "Aarav Sharma",
  email: "aarav.sharma@bharat.edu",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  xp: 3450,
  level: 7,
  streakDays: 6,
  dailyGoalXp: 500,
  todayXpEarned: 350,
  totalHoursLearned: 28.5,
  targetExam: "JEE Main & Advanced",
  learningStyle: "Socratic & Visual",
  preferredLanguage: "English",
  weakConcepts: ["Coulomb's Law in Vector Form", "Gauss Law Flux Integration", "Dielectric Polarization"],
  strongConcepts: ["Quantization of Charge", "Electric Potential Energy", "Ohm's Law"],
  badges: [
    {
      id: "badge-1",
      title: "First Principle Thinker",
      description: "Solved 10 concept checkpoints using deep physical intuition without hints.",
      icon: "🧠",
      isUnlocked: true,
      unlockedAt: "2026-08-28",
    },
    {
      id: "badge-2",
      title: "7-Day Flame",
      description: "Maintained a 7-day continuous Socratic learning streak.",
      icon: "🔥",
      isUnlocked: true,
      unlockedAt: "2026-08-30",
    },
    {
      id: "badge-3",
      title: "RAG Scholar",
      description: "Uploaded 5 personal textbook PDFs and asked grounded questions.",
      icon: "📚",
      isUnlocked: true,
      unlockedAt: "2026-08-31",
    },
    {
      id: "badge-4",
      title: "Polyglot Learner",
      description: "Learned science concepts in Hindi and English seamlessly.",
      icon: "🌐",
      isUnlocked: true,
      unlockedAt: "2026-09-01",
    },
    {
      id: "badge-5",
      title: "Misconception Destroyer",
      description: "Identified and corrected 5 common exam traps in physics.",
      icon: "⚡",
      isUnlocked: false,
    },
  ],
};

export const defaultLessonPlan: LessonPlan = {
  topicTitle: "Coulomb's Law & Electrostatic Fields",
  subject: "Class 12 Physics / JEE Foundation",
  difficultyLevel: "Intermediate",
  estimatedTimeMinutes: 45,
  overview: "Master the foundational interaction of point charges, the inverse-square law, vector force formulation, electric field superposition, and Gaussian flux geometry.",
  prerequisites: ["Vectors & Unit Vectors ($\\hat{r}$)", "Newton's Third Law of Motion", "Basic Calculus & Surface Area Integrals"],
  learningOutcomes: [
    "Calculate vector electrostatic forces between multi-charge configurations using $F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2} \\hat{r}$",
    "Identify common sign traps and distinguish between attraction and repulsion vectors",
    "Derive the electric field intensity $E$ at any point in space",
    "Apply Gauss's Law to calculate flux $\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{enc}}{\\varepsilon_0}$"
  ],
  modules: [
    {
      id: "mod-1",
      moduleNumber: 1,
      title: "Charge Fundamentals & Quantization",
      description: "Understanding elementary charge $e = 1.6 \\times 10^{-19}$ C and conservation laws.",
      estimatedMinutes: 8,
      keyConcepts: ["Quantization of charge", "Charge conservation", "Point charges"],
      formulaOrKeywords: ["$q = ne$", "Conservation of Charge"],
      socraticPrompt: "Why does rubbing a glass rod with silk transfer charge without creating new electrons?",
    },
    {
      id: "mod-2",
      moduleNumber: 2,
      title: "Coulomb's Inverse-Square Law & Vector Notation",
      description: "The mathematical law of electrostatic attraction and repulsion in vector form.",
      estimatedMinutes: 12,
      keyConcepts: ["Inverse-square nature", "Permittivity $\\varepsilon_0$", "Vector forces"],
      formulaOrKeywords: ["$\\vec{F}_{12} = -\\vec{F}_{21}$", "$\\varepsilon_0 = 8.854 \\times 10^{-12} \\text{ F/m}$"],
      socraticPrompt: "If the distance between two charges is doubled and one charge is halved, how does the force change?",
    },
    {
      id: "mod-3",
      moduleNumber: 3,
      title: "Electric Field & Principle of Superposition",
      description: "Mapping force fields in 3D space created by charge distributions.",
      estimatedMinutes: 12,
      keyConcepts: ["Field intensity", "Test charge $q_0$", "Superposition vector sum"],
      formulaOrKeywords: ["$\\vec{E} = \\frac{\\vec{F}}{q_0}$", "$\\vec{E}_{net} = \\sum \\vec{E}_i$"],
      socraticPrompt: "Can electric field lines ever cross each other? What would happen to a test charge at the intersection?",
    },
    {
      id: "mod-4",
      moduleNumber: 4,
      title: "Gauss's Law & Electric Flux",
      description: "Surface integrals and calculating fields from symmetric spherical and cylindrical geometries.",
      estimatedMinutes: 13,
      keyConcepts: ["Electric flux $\\Phi$", "Closed Gaussian surface", "Enclosed charge"],
      formulaOrKeywords: ["$\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{enc}}{\\varepsilon_0}$"],
      socraticPrompt: "Does a charge placed OUTSIDE a closed sphere contribute to the net flux passing through the sphere?",
    }
  ]
};

export const defaultTeachingStep: TeachingStep = {
  conceptName: "Coulomb's Law in Vector Form",
  stepNumber: 2,
  title: "Understanding Electrostatic Force & Directionality",
  explanationMarkdown: `When two point charges $q_1$ and $q_2$ are separated by a distance $r$ in vacuum, they exert equal and opposite forces on each other.

The scalar magnitude is given by:
$$F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{|q_1 q_2|}{r^2}$$

where $\\frac{1}{4\\pi\\varepsilon_0} \\approx 8.99 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2$.

In **Vector Form**, the force $\\vec{F}_{12}$ exerted on charge $q_1$ by charge $q_2$ is:
$$\\vec{F}_{12} = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{|\\vec{r}_1 - \\vec{r}_2|^3} (\\vec{r}_1 - \\vec{r}_2)$$

**Crucial Exam Insight:** Notice that if both charges have the same sign ($q_1 q_2 > 0$), the force pushes along $(\\vec{r}_1 - \\vec{r}_2)$, indicating **repulsion**. If opposite ($q_1 q_2 < 0$), the force pulls inward, indicating **attraction**.`,
  analogy: "Think of two repelling magnets on a smooth table: the harder you push them together (decreasing distance $r$), the force skyrockets exponentially (quadratically, by $1/r^2$). If you double the distance, the repulsive push drops to one-quarter!",
  diagramType: "mermaid",
  diagramCode: `graph LR
    A["(+) Charge q1"] -->|"Repulsion Force F21"| B["(+) Charge q2"]
    B -->|"Equal & Opposite Force F12"| A
    C["Separation Distance: r"] -.-> A
    C -.-> B
    classDef charge fill:#4338ca,stroke:#818cf8,stroke-width:2px,color:#ffffff;
    class A,B charge;`,
  diagramCaption: "Two like charges (+ and +) repelling along the line of centers obeying Newton's Third Law (F12 = -F21).",
  keyTakeaway: "Electrostatic force follows the Inverse-Square Law and always acts along the line joining the centers of the two charges.",
  checkpointQuestion: {
    questionText: "If the separation distance $r$ between two protons is reduced to one-third ($r/3$), by what factor does the electrostatic repulsive force change?",
    questionType: "mcq",
    options: [
      "Decreases by 3 times",
      "Increases by 3 times",
      "Increases by 9 times",
      "Decreases by 9 times"
    ],
    hint: "Remember the force is proportional to $1/r^2$. Substitute $(r/3)$ in place of $r$."
  }
};

export const defaultQuiz: Quiz = {
  quizTitle: "Mastery Challenge: Electrostatics & Coulomb's Law",
  topic: "Physics - Class 12 & JEE",
  totalTimeMinutes: 10,
  passingScorePercent: 75,
  questions: [
    {
      id: "q-1",
      questionNumber: 1,
      type: "mcq",
      questionText: "Two point charges $+2\\,\\mu\\text{C}$ and $-6\\,\\mu\\text{C}$ are kept at distance $d$. If they are brought into contact and then returned to separation $d$, the new electrostatic force between them is:",
      options: [
        "Attractive and equal to initial force",
        "Repulsive and equal to $1/3$ of initial force",
        "Repulsive and equal to $4/3$ of initial force",
        "Attractive and equal to $1/3$ of initial force"
      ],
      correctAnswer: "Repulsive and equal to $1/3$ of initial force",
      solutionExplanation: "Initially, $F_1 \\propto |(+2)(-6)| = 12$. When touched, total charge $+2 - 6 = -4\\,\\mu\\text{C}$ divides equally into $-2\\,\\mu\\text{C}$ each. Now both are negative (repulsive), and $F_2 \\propto |(-2)(-2)| = 4$. Thus $F_2 / F_1 = 4/12 = 1/3$ repulsive.",
      conceptTested: "Charge Redistribution & Coulomb's Law",
      difficulty: "Medium",
      xpReward: 50,
    },
    {
      id: "q-2",
      questionNumber: 2,
      type: "numerical",
      questionText: "Calculate the net electric flux (in $\\text{N}\\cdot\\text{m}^2/\\text{C}$) through a cube enclosing a single charge of $8.854\\,\\text{pC}$. (Given $\\varepsilon_0 = 8.854 \\times 10^{-12}\\,\\text{C}^2/\\text{N}\\cdot\\text{m}^2$)",
      options: [],
      correctAnswer: "1",
      solutionExplanation: "By Gauss's Law, $\\Phi = \\frac{q_{enc}}{\\varepsilon_0} = \\frac{8.854 \\times 10^{-12}}{8.854 \\times 10^{-12}} = 1\\,\\text{N}\\cdot\\text{m}^2/\\text{C}$.",
      conceptTested: "Gauss's Law Net Flux",
      difficulty: "Easy",
      xpReward: 40,
    },
    {
      id: "q-3",
      questionNumber: 3,
      type: "coding",
      questionText: "Write a Python function `coulomb_force(q1, q2, r)` that returns the magnitude of electrostatic force in Newtons. Use $k = 8.99 \\times 10^9$.",
      options: [],
      correctAnswer: "def coulomb_force(q1, q2, r):\n    k = 8.99e9\n    return k * abs(q1 * q2) / (r ** 2)",
      starterCode: "def coulomb_force(q1: float, q2: float, r: float) -> float:\n    # Implement Coulomb's law calculation\n    k = 8.99e9\n    pass",
      solutionExplanation: "The function calculates $F = k \\frac{|q_1 q_2|}{r^2}$ and handles float arithmetic correctly.",
      conceptTested: "Computational Physics & Modeling",
      difficulty: "Medium",
      xpReward: 60,
    },
    {
      id: "q-4",
      questionNumber: 4,
      type: "true_false",
      questionText: "Electric field lines always form closed loops like magnetic field lines.",
      options: ["True", "False"],
      correctAnswer: "False",
      solutionExplanation: "False. Electrostatic field lines originate on positive charges and terminate on negative charges. They do NOT form continuous closed loops because electrostatic fields are conservative.",
      conceptTested: "Properties of Electric Field Lines",
      difficulty: "Easy",
      xpReward: 30,
    },
    {
      id: "q-5",
      questionNumber: 5,
      type: "short_answer",
      questionText: "What is the physical significance of the electric field being zero inside a charged hollow metallic conductor?",
      options: [],
      correctAnswer: "Electrostatic shielding (Faraday cage effect)",
      solutionExplanation: "Charges reside solely on the outer surface in electrostatic equilibrium, shielding sensitive electronic instruments inside from external electric fields.",
      conceptTested: "Electrostatic Shielding",
      difficulty: "Hard",
      xpReward: 70,
    }
  ]
};

export const defaultSmartNotes: SmartNotes = {
  topic: "Electrostatics & Coulomb's Law",
  summaryNotesMarkdown: `# Master Summary: Electrostatics & Field Theory

## 1. Fundamental Properties of Charge
- **Quantization:** Any charge in the universe exists as integral multiples of fundamental electron charge:
  $$q = \\pm n e \\quad (e = 1.602 \\times 10^{-19}\\,\\text{C})$$
- **Conservation:** The algebraic sum of electric charges in an isolated system remains constant over time.
- **Additivity:** Charges are scalar and sum algebraically.

## 2. Coulomb's Law
The force between two point charges in vacuum:
$$F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{|q_1 q_2|}{r^2}$$
- **Medium Effect:** In a medium of relative permittivity (dielectric constant) $K = \\varepsilon_r$:
  $$F_{medium} = \\frac{F_{vacuum}}{K}$$

## 3. Electric Field Intensity
$$\\vec{E} = \\lim_{q_0 \\to 0} \\frac{\\vec{F}}{q_0} = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q}{r^2}\\hat{r}$$
- Field due to dipole on axial line: $E_{axial} = \\frac{2kp}{r^3}$
- Field due to dipole on equatorial line: $E_{equatorial} = \\frac{kp}{r^3}$

## 4. Gauss's Law
$$\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{enclosed}}{\\varepsilon_0}$$`,
  cheatSheet: {
    keyFormulas: [
      { name: "Coulomb's Law", formula: "F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}", where: "\\varepsilon_0 = 8.854 \\times 10^{-12} \\text{ F/m}" },
      { name: "Electric Field of Point Charge", formula: "E = \\frac{k q}{r^2}", where: "k = 8.99 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2" },
      { name: "Dipole Moment", formula: "\\vec{p} = q(2\\vec{a})", where: "Vector from -q to +q" },
      { name: "Torque on Dipole", formula: "\\vec{\\tau} = \\vec{p} \\times \\vec{E}", where: "\\tau = p E \\sin\\theta" },
      { name: "Gauss's Law Flux", formula: "\\Phi = \\frac{q_{enc}}{\\varepsilon_0}", where: "Independent of surface shape" }
    ],
    goldenRules: [
      "Never forget the $1/K$ factor when placing charges in water ($K=81$) or oil.",
      "Electric field lines never cross and are perpendicular to equipotential surfaces.",
      "Net charge inside a Gaussian surface determines flux; external charges shift the field vector but cancel out in total surface integral."
    ],
    commonPitfallsToAvoid: [
      "Confusing inverse proportionality with inverse-square: doubling $r$ quarters the force, not halves it.",
      "Mixing up field direction: positive charge repels a test charge outward, negative charge pulls inward.",
      "Forgetting vector signs when applying superposition to multi-charge geometries."
    ]
  },
  flashcards: [
    {
      id: "fc-1",
      front: "State the formula for electrostatic force in a medium with dielectric constant K.",
      back: "$$F_{med} = \\frac{F_{vac}}{K} = \\frac{1}{4\\pi K \\varepsilon_0} \\frac{q_1 q_2}{r^2}$$ Because $K > 1$ for all insulators, the electrostatic force is always reduced in a medium.",
      category: "Formulas",
      difficulty: "Easy",
      boxLevel: 3,
    },
    {
      id: "fc-2",
      front: "Why does the electric field inside a charged solid metal conductor vanish in electrostatic equilibrium?",
      back: "Mobile free electrons rearrange on the outer surface until the internal induced field exactly cancels the external field ($E_{inside} = 0$).",
      category: "Conductors",
      difficulty: "Medium",
      boxLevel: 2,
    },
    {
      id: "fc-3",
      front: "What is the ratio of electric field on the axial axis to the equatorial plane of a short electric dipole at the same distance r?",
      back: "$$\\frac{E_{axial}}{E_{equatorial}} = \\frac{2kp/r^3}{kp/r^3} = 2 : 1$$",
      category: "Dipoles",
      difficulty: "Medium",
      boxLevel: 4,
    },
    {
      id: "fc-4",
      front: "If a Gaussian surface encloses zero net charge, is the electric field everywhere on the surface necessarily zero?",
      back: "No! The net FLUX is zero ($\\Phi = 0$), but the electric field $E$ can be non-zero if field lines enter and exit equally.",
      category: "Gauss Law",
      difficulty: "Hard",
      boxLevel: 1,
    }
  ]
};

export const defaultVideoLecture: VideoLecture = {
  lectureTitle: "Visual Deep Dive: Electrostatic Fields & Gauss's Geometry",
  totalDurationSeconds: 150,
  overview: "An animated multi-slide video experience breaking down Coulomb interactions, vector force fields, and Gaussian symmetry.",
  slides: [
    {
      slideNumber: 1,
      title: "The Mystery of Invisible Forces",
      bulletPoints: [
        "How do charges push and pull across empty vacuum?",
        "Faraday's insight: The Electric Field is a physical distortion of space",
        "Charge $q_1$ creates a field; charge $q_2$ responds to the local field"
      ],
      visualDescription: "Animated particles radiating dynamic force lines across space.",
      diagramType: "mermaid",
      diagramCode: `graph LR
        Q1["Charge q1"] -->|"Creates Field E"| Space["Distorted Space"]
        Space -->|"Exerts Force F = q2*E"| Q2["Charge q2"]`,
      narrationScript: "Namaste learners! Imagine pushing an object without ever touching it. In electrostatics, charge doesn't act through magic—it curves the local space around it by creating an electric field.",
      durationSeconds: 30,
      accentColor: "#6366f1",
    },
    {
      slideNumber: 2,
      title: "The Inverse-Square Law Revealed",
      bulletPoints: [
        "Force diminishes as surface area of a sphere expands ($4\\pi r^2$)",
        "At distance $2r$, force is $\\frac{1}{4}$th",
        "At distance $3r$, force is $\\frac{1}{9}$th"
      ],
      visualDescription: "Expanding concentric spherical wave fronts showing density dilution.",
      diagramType: "stats",
      diagramCode: "$$F \\propto \\frac{1}{r^2}$$",
      narrationScript: "Why does the force follow $1/r^2$? Because energy spreads uniformly over the surface of an expanding sphere, whose surface area grows as $4\\pi r^2$.",
      durationSeconds: 30,
      accentColor: "#06b6d4",
    },
    {
      slideNumber: 3,
      title: "Superposition: Multiple Charges in Harmony",
      bulletPoints: [
        "Every pair interacts independently",
        "Total force is the vector sum of all individual forces",
        "Resolve forces into $x, y, z$ Cartesian components"
      ],
      visualDescription: "Triangle of charges with vector arrows summing into a resultant arrow.",
      diagramType: "mermaid",
      diagramCode: `graph TD
        Q1["q1"] -->|"F13"| Q3["Target q3"]
        Q2["q2"] -->|"F23"| Q3
        Q3 -->|"Resultant F_net"| Res["Resultant Vector"]`,
      narrationScript: "When multiple charges enter the stage, they don't block each other. You simply calculate each pairwise vector force and compute the vector sum.",
      durationSeconds: 30,
      accentColor: "#10b981",
    },
    {
      slideNumber: 4,
      title: "Gauss's Law: The Beauty of Symmetry",
      bulletPoints: [
        "Count the total flux (number of field lines) piercing a closed box",
        "Total flux = Total enclosed charge divided by $\\varepsilon_0$",
        "Solves complex problems in 2 lines of algebra"
      ],
      visualDescription: "Gaussian pillbox and sphere enclosing a glowing point charge.",
      diagramType: "badge",
      diagramCode: "$$\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{enc}}{\\varepsilon_0}$$",
      narrationScript: "Carl Friedrich Gauss gave us one of physics' most elegant tools. If you draw any imaginary closed box around charges, the net flux piercing the surface is simply the enclosed charge divided by epsilon naught.",
      durationSeconds: 30,
      accentColor: "#f59e0b",
    },
    {
      slideNumber: 5,
      title: "Summary & Active Practice",
      bulletPoints: [
        "Coulomb's Law: $F = k \\frac{q_1 q_2}{r^2}$",
        "Electric Field: $E = F / q_0$",
        "Ready to test your intuition in the Quiz Arena!"
      ],
      visualDescription: "Golden trophy with summary checklist and practice button.",
      diagramType: "quote",
      diagramCode: "Mastery achieved! Proceed to practice checkpoint.",
      narrationScript: "You are now equipped with the core intuition of electrostatics. Let's test your problem-solving power in the quiz arena!",
      durationSeconds: 30,
      accentColor: "#8b5cf6",
    }
  ]
};

export const defaultAnalyticsReport: AnalyticsReport = {
  studentName: "Aarav Sharma",
  overallScore: 84,
  masteryLevel: "Proficient",
  streakDays: 6,
  totalStudyHours: 28.5,
  subjectMasteryBreakdown: [
    { subject: "Class 12 Physics (Electrostatics & Current)", score: 88, status: "Strong" },
    { subject: "Mathematics (Calculus & Vectors)", score: 82, status: "Strong" },
    { subject: "Physical Chemistry (Thermodynamics)", score: 74, status: "Improving" },
    { subject: "Computer Science (Python & Data Structures)", score: 92, status: "Strong" },
  ],
  radarMetrics: [
    { metric: "Conceptual Grasp", value: 86 },
    { metric: "Problem Solving Speed", value: 78 },
    { metric: "Retention & Recall", value: 89 },
    { metric: "Consistency & Streak", value: 92 },
    { metric: "Mathematical Precision", value: 80 }
  ],
  topStrengths: [
    "Rapid conceptual understanding of field geometry and vector algebra",
    "High accuracy on first-principle qualitative checkpoint questions (92%)",
    "Strong engagement with Socratic analogies and interactive visual diagrams"
  ],
  criticalWeaknesses: [
    "Occasionally misses dielectric constant $1/K$ factor in multi-medium calculations",
    "Speed in multi-charge 3D coordinate vector decomposition needs 10% acceleration",
    "Surface integral boundary conditions in non-spherical Gaussian surfaces"
  ],
  misconceptionPatterns: [
    "Confused electric potential $V$ (scalar) with electric field magnitude $|E|$ (vector) in 1 diagnostic quiz question.",
    "Assumed negative flux means zero field rather than field lines entering the surface."
  ],
  aiRecommendations: [
    { actionTitle: "Practice 5 Dielectric Medium numericals", reason: "Eliminate the $1/K$ oversight before the upcoming JEE mock exam.", priority: "High" },
    { actionTitle: "Review Gaussian Pillbox Flashcards", reason: "Reinforce boundary flux conditions for infinite plane sheets.", priority: "Medium" },
    { actionTitle: "Take the 10-minute Adaptive Diagnostic on Dipoles", reason: "Elevate your dipole mastery from 75% to 95%.", priority: "Medium" }
  ],
  customizedStudySchedule: [
    { day: "Monday", focusTopic: "Coulomb's Law in Multi-Dielectric Media", recommendedMinutes: 30 },
    { day: "Tuesday", focusTopic: "Gauss's Law Cylindrical & Planar Symmetry", recommendedMinutes: 40 },
    { day: "Wednesday", focusTopic: "Electric Potential & Equipotential Surfaces", recommendedMinutes: 35 },
    { day: "Thursday", focusTopic: "Speed Quiz & Misconception Review Arena", recommendedMinutes: 25 },
    { day: "Friday", focusTopic: "Capacitance & Energy Stored in Electric Fields", recommendedMinutes: 45 }
  ]
};

export const leaderboardData = [
  { rank: 1, name: "Priya Sundaram", xp: 5420, streak: 18, school: "Chennai STEM Academy", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80", badge: "🏆 Grand Master" },
  { rank: 2, name: "Aarav Sharma (You)", xp: 3450, streak: 6, school: "Delhi Public School", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80", badge: "⚡ Concept Master" },
  { rank: 3, name: "Rohan Kulkarni", xp: 3310, streak: 12, school: "Pune National College", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80", badge: "🔥 Flame Keeper" },
  { rank: 4, name: "Ananya Iyer", xp: 2980, streak: 9, school: "Bengaluru Tech High", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80", badge: "🧠 First Principle" },
  { rank: 5, name: "Vikramjit Singh", xp: 2750, streak: 5, school: "Chandigarh Model School", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80", badge: "📚 RAG Scholar" },
];

export const teacherPersonas = [
  {
    id: "vikram",
    name: "Dr. Vikram AI",
    roleTitle: "Autonomous STEM & Physics Mentor",
    subjectSpecialty: "Physics, Mathematics, JEE & Engineering",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    avatarGradient: "from-indigo-600 via-purple-600 to-emerald-500",
    voiceGender: "male" as const,
    voicePitch: 1.0,
    voiceRate: 0.95,
    teachingStyle: "First-Principles & Socratic Dialogue",
    bio: "Specializes in breaking down hard concepts into intuitive everyday physical analogies and rigorous mathematical derivations.",
    badge: "🎓 Socratic Guru",
  },
  {
    id: "ananya",
    name: "Prof. Ananya AI",
    roleTitle: "Bio-Medical & Life Sciences Guide",
    subjectSpecialty: "Biology, Organic Chemistry, NEET & Biotech",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    avatarGradient: "from-emerald-500 via-teal-600 to-cyan-500",
    voiceGender: "female" as const,
    voicePitch: 1.15,
    voiceRate: 0.98,
    teachingStyle: "Visual Diagrams & Clinical Intuition",
    bio: "Translates complex biochemical pathways and mechanisms into vivid memory anchors and clinical reasoning.",
    badge: "🧬 Bio Master",
  },
  {
    id: "chanakya",
    name: "Acharya Chanakya AI",
    roleTitle: "Strategic Thinking & Civil Services Mentor",
    subjectSpecialty: "Polity, Economics, History, UPSC & Logic",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    avatarGradient: "from-amber-600 via-orange-600 to-rose-600",
    voiceGender: "male" as const,
    voicePitch: 0.9,
    voiceRate: 0.92,
    teachingStyle: "Structured Frameworks & Critical Reasoning",
    bio: "Uses historical case studies, governance frameworks, constitutional clauses, and dialectical inquiry.",
    badge: "🏛️ Strategic Guru",
  },
  {
    id: "tara",
    name: "Tara AI",
    roleTitle: "High-Yield Speed & Foundation Tutor",
    subjectSpecialty: "CBSE 9-12, Foundation Science & Quick Revision",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    avatarGradient: "from-fuchsia-600 via-pink-600 to-indigo-500",
    voiceGender: "female" as const,
    voicePitch: 1.2,
    voiceRate: 1.02,
    teachingStyle: "Bilingual Hinglish, Rapid Quizzes & Cheat-Codes",
    bio: "Enthusiastic, cheerful, and focused on mnemonics, shortcut tricks, and high-yield retention for board exams.",
    badge: "🌟 High-Yield Speed",
  },
];

