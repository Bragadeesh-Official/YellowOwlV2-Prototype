export interface MCQQuestion {
  type: 'mcq';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface DescriptiveQuestion {
  type: 'descriptive';
  question: string;
  hint: string;
  sampleAnswer: string;
}

export interface TwistQuestion {
  type: 'twist';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface IdeasQuestion {
  type: 'ideas';
  question: string;
  prompt: string;
  count: number;
  example: string;
}

export interface Challenge {
  id: number;
  title: string;
  theme: string;
  emoji: string;
  color: string;
  questions: (MCQQuestion | DescriptiveQuestion | TwistQuestion | IdeasQuestion)[];
  twistQuestion?: TwistQuestion;
}

export const WEEKLY_ASSESSMENT: Challenge[] = [
  {
    id: 1,
    title: 'Nature Detectives',
    theme: 'The Amazing World of Plants',
    emoji: '🌿',
    color: '#2AD5B4',
    questions: [
      {
        type: 'mcq',
        question: 'Which part of the plant makes food using sunlight? ☀️',
        options: ['Roots', 'Stem', 'Leaves', 'Flowers'],
        correct: 2,
        explanation: 'Leaves have chlorophyll that captures sunlight to make food — they are the plant\'s kitchen!',
      },
      {
        type: 'mcq',
        question: 'What do plants breathe in that humans breathe out? 🌬️',
        options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Water vapor'],
        correct: 1,
        explanation: 'Plants breathe in CO₂ and give us fresh oxygen — they are our best friends!',
      },
      {
        type: 'descriptive',
        question: 'If you were a tree in a busy city, how would you feel and what would you do? 🌳',
        hint: 'Think about the pollution, the people, and what a tree does for the city...',
        sampleAnswer: 'I would feel strong but sometimes choked by smoke. I would grow my branches wide to give shade and clean the air for everyone around me!',
      },
    ],
    twistQuestion: {
      type: 'twist',
      question: '🌀 TWIST! A plant is kept in a dark room for a week. What will most likely happen?',
      options: [
        'It will grow faster without sunlight distracting it',
        'Nothing will change',
        'It will turn yellow and die slowly',
        'It will produce more flowers',
      ],
      correct: 2,
      explanation: 'Without sunlight, plants cannot make food and their chlorophyll breaks down — turning them yellow and weak!',
    },
  },
  {
    id: 2,
    title: 'Story Explorers',
    theme: 'Tales from Around the World',
    emoji: '📚',
    color: '#FFEA11',
    questions: [
      {
        type: 'mcq',
        question: 'In stories, what do you call the main character who faces the problems? 🦸',
        options: ['Villain', 'Narrator', 'Protagonist', 'Supporting character'],
        correct: 2,
        explanation: 'The protagonist is the hero of the story — the one we root for!',
      },
      {
        type: 'mcq',
        question: 'Which of these is NOT a type of story? 📖',
        options: ['Fable', 'Legend', 'Biography', 'Triangle'],
        correct: 3,
        explanation: 'Triangle is a shape, not a type of story! Fables, legends, and biographies are all story types.',
      },
      {
        type: 'descriptive',
        question: 'Create your own story opening! Start with "One rainy afternoon, something strange appeared at the door..." ✍️',
        hint: 'Who is at home? What is at the door? What happens next?',
        sampleAnswer: 'One rainy afternoon, something strange appeared at the door — a tiny glowing box with no label. Inside was a map leading to the school library at midnight!',
      },
    ],
    twistQuestion: {
      type: 'twist',
      question: '🌀 TWIST! If you could rewrite the ending of any famous story, which SKILL would be most useful?',
      options: [
        'Being the fastest runner',
        'Understanding how the villain thinks',
        'Having the loudest voice',
        'Knowing the most facts',
      ],
      correct: 1,
      explanation: 'Understanding others (empathy) helps you make better decisions — even heroes need to understand villains to defeat them!',
    },
  },
  {
    id: 3,
    title: 'Idea Storm',
    theme: 'Making the World Better',
    emoji: '💡',
    color: '#A78BFA',
    questions: [
      {
        type: 'ideas',
        question: 'You have a magic wand to improve your school! What 5 awesome things would you change or add? ✨',
        prompt: 'Think big and wild — no idea is too crazy!',
        count: 5,
        example: 'Example: Add a rooftop garden where we grow food for lunch!',
      },
    ],
  },
  {
    id: 4,
    title: 'Future Dreamers',
    theme: 'Inventions We Need',
    emoji: '🚀',
    color: '#F97316',
    questions: [
      {
        type: 'ideas',
        question: 'Imagine you are an inventor in the year 2050! What 5 inventions would you create to help people? 🤖',
        prompt: 'They can be silly, smart, or super futuristic!',
        count: 5,
        example: 'Example: A helmet that translates animal thoughts into human words!',
      },
    ],
  },
  {
    id: 5,
    title: 'Reflection Time',
    theme: 'Thinking About Thinking',
    emoji: '🪞',
    color: '#EC4899',
    questions: [
      {
        type: 'ideas',
        question: 'Look back at all 4 challenges you completed! What are 3 things you learned and 2 things you want to explore more? 🌟',
        prompt: 'Be honest — there are no wrong answers here!',
        count: 5,
        example: 'Example: I learned that plants breathe CO₂ and I want to explore how they grow in space!',
      },
    ],
  },
];

export const PAST_ASSESSMENTS = [
  {
    id: 'assess-001',
    week: 'Week 1',
    date: '2024-01-08',
    completedAt: '2024-01-08T10:45:00',
    timeTaken: '12:34',
    score: 80,
    challenges: [
      {
        id: 1,
        title: 'Nature Detectives',
        mcqScore: 2,
        mcqTotal: 2,
        descriptiveAnswer: 'I would feel strong but sometimes choked by smoke. I would grow my branches wide to give shade and clean the air for everyone!',
        twistAnswer: 2,
        twistCorrect: true,
      },
      {
        id: 2,
        title: 'Story Explorers',
        mcqScore: 1,
        mcqTotal: 2,
        descriptiveAnswer: 'One rainy afternoon, something strange appeared at the door — a tiny glowing box. It was from the future!',
        twistAnswer: 1,
        twistCorrect: true,
      },
      {
        id: 3,
        title: 'Idea Storm',
        ideas: ['Rooftop garden', 'Sleep pods', 'Robot teachers', 'Movie Fridays', 'Animal petting corner'],
      },
      {
        id: 4,
        title: 'Future Dreamers',
        ideas: ['Teleporter', 'Mind-reading helmet', 'Flying backpack', 'Underwater school', 'Time machine pen'],
      },
      {
        id: 5,
        title: 'Reflection Time',
        ideas: ['Plants make food', 'Stories have heroes', 'Empathy is powerful', 'I want to learn more about space plants', 'Future inventions are exciting'],
      },
    ],
    improvements: ['Try to explain your ideas in more detail', 'Practice reading comprehension for story types'],
  },
  {
    id: 'assess-002',
    week: 'Week 2',
    date: '2024-01-15',
    completedAt: '2024-01-15T11:20:00',
    timeTaken: '13:58',
    score: 88,
    challenges: [
      { id: 1, title: 'Ocean Wonders', mcqScore: 2, mcqTotal: 2, descriptiveAnswer: 'The ocean is vast and beautiful!', twistAnswer: 0, twistCorrect: false },
      { id: 2, title: 'Number Magic', mcqScore: 2, mcqTotal: 2, descriptiveAnswer: 'Math is everywhere in nature.', twistAnswer: 1, twistCorrect: true },
      { id: 3, title: 'Dream School', ideas: ['Library with VR', 'Art room always open', 'Music everywhere', 'Games between classes', 'Chef teaches cooking'] },
      { id: 4, title: '2050 Inventions', ideas: ['Weather controller', 'Mood ring AI', 'Instant food printer', 'Dream recorder', 'Anti-gravity boots'] },
      { id: 5, title: 'My Week', ideas: ['Learned about oceans', 'Math is fun', 'My best idea was VR library', 'Want to know more about deep sea', 'Feeling more confident'] },
    ],
    improvements: ['Great improvement! Keep up the creative thinking!'],
  },
];

export const SKILL_DESCRIPTIONS = {
  listening: {
    label: 'Listening',
    emoji: '👂',
    color: '#2AD5B4',
    description: 'How well you understand stories and instructions',
  },
  reading: {
    label: 'Reading',
    emoji: '📖',
    color: '#FFEA11',
    darkColor: '#B8A800',
    description: 'Your speed and understanding when reading',
  },
  thinking: {
    label: 'Thinking',
    emoji: '🧠',
    color: '#A78BFA',
    description: 'Your logical and creative problem-solving',
  },
  imagination: {
    label: 'Imagination',
    emoji: '✨',
    color: '#F97316',
    description: 'How creative and expressive your ideas are',
  },
};
