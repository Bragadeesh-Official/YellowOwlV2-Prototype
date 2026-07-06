
export const MOCK_ENVIRONMENTS = [
  { id: 'desert', label: 'Desert', emoji: '🏜️', bg: '#F5DEB3', description: 'Hot sandy dunes!' },
  { id: 'sea', label: 'Ocean', emoji: '🌊', bg: '#87CEEB', description: 'Deep blue waters!' },
  { id: 'forest', label: 'Forest', emoji: '🌲', bg: '#90EE90', description: 'Tall green trees!' },
  { id: 'sky', label: 'Sky', emoji: '☁️', bg: '#E0F7FF', description: 'Fluffy clouds!' },
];

export const MOCK_ANIMALS: Record<string, { id: string; name: string; emoji: string; img: string }[]> = {
  desert: [
    { id: 'camel', name: 'Camel', emoji: '🐪', img: '🐪' },
    { id: 'scorpion', name: 'Scorpion', emoji: '🦂', img: '🦂' },
    { id: 'snake', name: 'Snake', emoji: '🐍', img: '🐍' },
    { id: 'lizard', name: 'Lizard', emoji: '🦎', img: '🦎' },
  ],
  sea: [
    { id: 'dolphin', name: 'Dolphin', emoji: '🐬', img: '🐬' },
    { id: 'turtle', name: 'Sea Turtle', emoji: '🐢', img: '🐢' },
    { id: 'octopus', name: 'Octopus', emoji: '🐙', img: '🐙' },
    { id: 'fish', name: 'Tropical Fish', emoji: '🐠', img: '🐠' },
  ],
  forest: [
    { id: 'owl', name: 'Owl', emoji: '🦉', img: '🦉' },
    { id: 'deer', name: 'Deer', emoji: '🦌', img: '🦌' },
    { id: 'fox', name: 'Fox', emoji: '🦊', img: '🦊' },
    { id: 'bear', name: 'Bear', emoji: '🐻', img: '🐻' },
  ],
  sky: [
    { id: 'eagle', name: 'Eagle', emoji: '🦅', img: '🦅' },
    { id: 'parrot', name: 'Parrot', emoji: '🦜', img: '🦜' },
    { id: 'butterfly', name: 'Butterfly', emoji: '🦋', img: '🦋' },
    { id: 'bee', name: 'Bee', emoji: '🐝', img: '🐝' },
  ],
};

export const MOCK_INTERESTS = [
  { id: 'sports', label: 'Sports', emoji: '⚽', description: 'Games & movement' },
  { id: 'nature', label: 'Nature', emoji: '🌿', description: 'Plants & animals' },
  { id: 'art', label: 'Art', emoji: '🎨', description: 'Colors & creativity' },
  { id: 'music', label: 'Music', emoji: '🎵', description: 'Sounds & rhythm' },
];

export const MOCK_WARMUP_QUESTIONS = [
  {
    id: 1,
    question: "If you have 12 apples and give away 1/3, how many do you have left? 🍎",
    options: ["4", "8", "6", "10"],
    correct: 1,
    explanation: "12 ÷ 3 = 4 given away, so 12 - 4 = 8 apples remain!",
  },
  {
    id: 2,
    question: "Which animal is known as the 'Ship of the Desert'? 🐪",
    options: ["Elephant", "Camel", "Horse", "Donkey"],
    correct: 1,
    explanation: "Camels can travel long distances without water — just like ships sail the sea!",
  },
  {
    id: 3,
    question: "What does a caterpillar turn into? 🦋",
    options: ["A moth", "A bee", "A butterfly", "A dragonfly"],
    correct: 2,
    explanation: "Caterpillars go through metamorphosis and become beautiful butterflies!",
  },
  {
    id: 4,
    question: "How many sides does a hexagon have? 🔷",
    options: ["5", "7", "8", "6"],
    correct: 3,
    explanation: "Hex means 6 — like a honeycomb cell!",
  },
];

export const MOCK_CHILD_PROFILE = {
  id: 'child-001',
  name: 'Alex',
  age: 10,
  dob: '2015-03-15',
  email: 'alex@example.com',
  phone: '',
  avatar: '🦉',
  interests: ['sports', 'nature'],
  weeklySession: 20,
  guardianPhone: '9876543210',
  passwordEnv: 'forest',
  passwordAnimal: 'owl',
  joinedDate: '2024-01-15',
  skills: {
    listening: 72,
    reading: 85,
    thinking: 68,
    imagination: 90,
  },
  level: 5,
  stars: 340,
  streak: 7,
};

export const SESSION_KEY = 'yellowowl_session';
export const PROFILE_KEY = 'yellowowl_profile';
