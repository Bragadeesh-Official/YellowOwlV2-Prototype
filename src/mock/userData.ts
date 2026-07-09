
export const MOCK_ENVIRONMENTS = [
  { id: 'polar', label: 'Polar', emoji: '❄️', bg: '#E0F2FE', description: 'Cold snowy lands!' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊', bg: '#E0F7FF', description: 'Deep blue waters!' },
  { id: 'forest', label: 'Forest', emoji: '🌲', bg: '#ECFDF5', description: 'Tall green trees!' },
  { id: 'sky', label: 'Sky', emoji: '☁️', bg: '#F8FAFC', description: 'Fluffy clouds!' },
];

export const MOCK_ANIMALS: Record<string, { id: string; name: string; emoji: string; img: string }[]> = {
  polar: [
    { id: 'penguin', name: 'Penguin', emoji: '🐧', img: '🐧' },
    { id: 'snowbear', name: 'Polar Bear', emoji: '🐻‍❄️', img: '🐻‍❄️' },
    { id: 'wolf', name: 'Arctic Wolf', emoji: '🐺', img: '🐺' },
    { id: 'whale', name: 'Whale', emoji: '🐳', img: '🐳' },
  ],
  ocean: [
    { id: 'dolphin', name: 'Dolphin', emoji: '🐬', img: '🐬' },
    { id: 'turtle', name: 'Sea Turtle', emoji: '🐢', img: '🐢' },
    { id: 'octopus', name: 'Octopus', emoji: '🐙', img: '🐙' },
    { id: 'fish', name: 'Tropical Fish', emoji: '🐠', img: '🐠' },
  ],
  forest: [
    { id: 'bear', name: 'Bear', emoji: '🐻', img: '🐻' },
    { id: 'deer', name: 'Deer', emoji: '🦌', img: '🦌' },
    { id: 'tiger', name: 'Tiger', emoji: '🐯', img: '🐯' },
    { id: 'elephant', name: 'Elephant', emoji: '🐘', img: '🐘' },
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

export const JUNIOR_WARMUP = {
  trackName: "JUNIOR TRACK — Explorer (Ages 9–11)",
  scenario: "Your school wants to fix the playground. Fewer students are going to the playground at lunch. The school has ₹20,000 to spend. Your class needs to find out what is wrong and suggest what to do.",
  questions: [
    {
      id: 1,
      title: "Question 1 — Finding Information",
      question: "What information should you find out first, before deciding what to do?",
      options: [
        {
          text: "Talk to students and ask why they stopped going outside",
          score: 4,
          feedback: "Goes directly to the source and asks WHY — the only question that tells you what to actually fix. Every solution you design after this will be grounded in the real reason students stopped going out."
        },
        {
          text: "Count how many students go to the playground each day",
          score: 3,
          feedback: "Counting gives you scale — you learn how serious the problem is — but not the cause. You still do not know what to fix. Well-intentioned data collection that gets the wrong data."
        },
        {
          text: "Talk to neighbouring schools to get ideas",
          score: 2,
          feedback: "Talking to other schools skips diagnosing your own problem and jumps straight to looking for solutions. Useful later, but the wrong move before you understand what is actually wrong at your school."
        },
        {
          text: "Fix new swing sets as children usually love them",
          score: 1,
          feedback: "Does not find anything out at all — it goes straight to a solution based on a general assumption. The question asks what to find out first; this option ignores that entirely."
        }
      ],
      strongDistractor: "Counting students sounds like proper research because it involves evidence and numbers. But it measures the size of the problem, not the cause — so any solution you build from it is still a guess."
    },
    {
      id: 2,
      title: "Question 2 — Creating Ideas",
      question: "Students said the playground is 'boring' and 'too hot'. What should be your next step?",
      options: [
        {
          text: "Think of many different kinds of fixes — shade, new games, art corners, sports",
          score: 4,
          feedback: "Generates ideas across completely different categories — shade, games, art, sports — so the options are genuinely varied and cover both problems (boring and hot). This is what strong idea generation looks like: breadth across types, not just more of the same thing."
        },
        {
          text: "Find two things that worked at other schools and suggest those",
          score: 3,
          feedback: "Borrowing from other schools is sensible and practical, but it limits thinking to what already exists elsewhere. You get two ideas, but they may not fit your school's specific problem and you have ruled out anything new before you even started."
        },
        {
          text: "Ask the most popular student what they want",
          score: 2,
          feedback: "One person's preference from a single, likely biased source. The most popular student probably speaks for one group of students, not everyone. Low effort and easy to do, which is exactly why it scores low."
        },
        {
          text: "Fix new swing sets since more students it was boring",
          score: 1,
          feedback: "Skips idea generation entirely and jumps to one specific solution based on a flawed reading of the data. 'Students said it was boring' does not mean swing sets are the fix — that is an assumption. Also only addresses one of the two problems."
        }
      ],
      strongDistractor: "Looking at what worked at other schools feels like research and real-world thinking. It is — but it anchors your thinking to existing solutions and stops you from generating ideas that might be better suited to your situation."
    },
    {
      id: 3,
      title: "Question 3 — Analysing Options",
      question: "You have two choices: a shade cover (₹16,000) or painted game lines on the ground (₹8,000). What is the best way to pick between them?",
      options: [
        {
          text: "Think about how many students each one helps, whether it fixes the real problem, and what could go wrong",
          score: 4,
          feedback: "Compares both options against what actually matters — reach, problem fit, and risk. This is what a real comparison looks like: multiple criteria, all tied back to the original problem."
        },
        {
          text: "Check which one fits in the ₹20,000 budget",
          score: 3,
          feedback: "Budget is a genuine constraint worth checking, but using it as the only basis for comparison turns one factor into the whole decision. Partial thinking — relevant but incomplete."
        },
        {
          text: "Ask students which one looks better",
          score: 2,
          feedback: "Asking students is real evidence, but appearance has nothing to do with whether either option solves the problem. The right instinct (ask people) applied to the wrong question (what looks better)."
        },
        {
          text: "Pick the shade cover as it costs more, so it is probably the better option",
          score: 1,
          feedback: "Uses price as a stand-in for quality without any comparison at all. 'Costs more = must be better' is a common assumption but has no basis here — cost tells you nothing about how well either option fixes the playground problem."
        }
      ],
      strongDistractor: "Checking the budget sounds like responsible, practical thinking. It is — but it makes affordability the entire comparison, ignoring everything else that matters."
    },
    {
      id: 4,
      title: "Question 4 — Evaluating and Deciding",
      question: "The shade cover (₹16,000) does not fix the main problem. Students left because it was boring. The game lines (₹8,000) fix boredom and leave ₹12,000 for something else. What should you suggest?",
      options: [
        {
          text: "Choose the game lines as they fix why students leave, cost less, and leave ₹12,000 for something else",
          score: 4,
          feedback: "Correct choice with full reasoning: fixes the root cause, acknowledges the cost difference, and recognises the leftover budget as an opportunity for a second improvement."
        },
        {
          text: "Choose the game lines because they fix boredom and cost less",
          score: 3,
          feedback: "Correct choice, but the reasoning stops short. Mentions boredom and cost but misses that ₹12,000 remains for further improvement."
        },
        {
          text: "Choose the shade cover as being cool is more important than fixing boredom",
          score: 2,
          feedback: "Wrong choice, but the reasoning is genuine — 'physical comfort before boredom' is a defensible value. Scored above D because it involves actual thinking."
        },
        {
          text: "Spend only ₹8,000 on the game lines and save the balance. Wait to see if it works first",
          score: 1,
          feedback: "Sounds cautious and prudent, but saves money without actually solving the heat problem. An incomplete answer dressed up as responsibility."
        }
      ],
      strongDistractor: "'Comfort is a more serious need than boredom' is a real ethical argument — not random noise — which is what makes it a strong wrong answer."
    }
  ]
};

export const SENIOR_WARMUP = {
  trackName: "SENIOR TRACK — Navigator (Ages 12–13)",
  scenario: "A school tried different homework rules for each class: no homework in Class 7, optional homework in Class 8, compulsory homework in Class 9. After one year, Class 7 scores went up, Class 8 stayed the same, Class 9 scores went down.",
  questions: [
    {
      id: 1,
      title: "Question 1 — Evaluating",
      question: "The principal wants to remove homework for all classes. What is the most important thing to check first?",
      options: [
        {
          text: "If removing homework actually caused Class 7's improvement. It might have been a better batch or different teachers that year",
          score: 4,
          feedback: "The only check that answers whether the policy should be expanded. Before acting on Class 7's results, you must ask whether the homework removal actually caused them — or whether something else did (a stronger batch, a different teacher). Expanding without this check means building a school-wide policy on an assumption."
        },
        {
          text: "If Class 7 results went up in all subjects or only in some",
          score: 3,
          feedback: "Checking whether results improved across all subjects or just some is genuine evidence-seeking — the right instinct. But even if scores went up in every subject, you still do not know what caused the rise. It narrows the picture without answering the causation question."
        },
        {
          text: "If all parents support the no-homework approach",
          score: 2,
          feedback: "Parent support matters when implementing a policy, but it has no bearing on whether the policy caused the improvement. 'All parents agree' does not make Class 7's results more or less likely to have been caused by removing homework. The right thing to check eventually — but not first, and not for this reason."
        },
        {
          text: "Just roll it out. The Class 7 results clearly show it works",
          score: 1,
          feedback: "Treats the Class 7 correlation as proof that the policy works. This is the exact reasoning error the question is designed to catch — acting on a result without checking what produced it."
        }
      ],
      strongDistractor: "Checking whether results improved across all subjects or just some is genuine evidence-seeking — the right instinct. But even if scores went up in every subject, you still do not know what caused the rise. It narrows the picture without answering the causation question."
    },
    {
      id: 2,
      title: "Question 2 — Finding Causes",
      question: "Class 9 scores dropped after homework became compulsory. What is the most likely reason?",
      options: [
        {
          text: "Forced homework takes away student choice. Work done unwillingly is less useful.",
          score: 4,
          feedback: "Identifies the root cause (removal of autonomy) and explains the mechanism (motivation, not time). Distinguishes between what changed on the surface and what actually drives performance."
        },
        {
          text: "Class 9 students have more things pulling their attention at home such as tuitions, phones, family so homework helps less",
          score: 3,
          feedback: "A plausible contextual factor specific to Indian schooling — tuitions, family expectations, phone use are real pressures. But this doesn't explain why the drop happened specifically when the policy changed, not before."
        },
        {
          text: "Teachers gave too much homework, which stressed students",
          score: 2,
          feedback: "Amount of homework may genuinely matter, but this assumes the policy caused over-assignment without any evidence. A plausible guess without grounding."
        },
        {
          text: "Class 9 has a harder syllabus. Scores often drop at this stage no matter what",
          score: 1,
          feedback: "Confounds curriculum difficulty with the policy change. Dismisses the pattern by attributing it to natural progression. Avoids engaging with the cause."
        }
      ],
      strongDistractor: "'Class 9 students face more pressure at home' is a genuinely accurate observation about the Indian school context, which makes it convincing."
    },
    {
      id: 3,
      title: "Question 3 — Spotting Patterns",
      question: "Students in Class 8 who chose to do homework scored higher than both the no-homework group and the compulsory group. What does this show?",
      options: [
        {
          text: "Choice is what matters. Students who choose to work may already be motivated",
          score: 4,
          feedback: "Names the mechanism (choice), holds two competing explanations in parallel (selection effect vs. ownership effect), and generates a testable prediction. This is the full pattern-reading skill."
        },
        {
          text: "Students who choose homework are probably already more hardworking so the homework itself may not be what helped",
          score: 3,
          feedback: "Correctly identifies the selection confound — motivated students self-select into homework. This is real statistical thinking, but it stops short of explaining the mechanism or making a prediction."
        },
        {
          text: "Optional homework gives students some practice without the stress of it being forced",
          score: 2,
          feedback: "Accurately describes the outcome but does not explain why it happens or what it predicts. Surface-level reading of the pattern."
        },
        {
          text: "There were probably too few students who chose homework in Class 8 to draw any conclusion",
          score: 1,
          feedback: "Raises a legitimate methodological concern but uses it to dismiss a clear and consistent finding entirely. Scepticism without engagement."
        }
      ],
      strongDistractor: "Raising the selection confound is genuine statistical reasoning — a confident 13-year-old will feel this is the best answer, which is what makes it a strong 3."
    },
    {
      id: 4,
      title: "Question 4 — Logical Reasoning",
      question: "A parent says: 'Every Class 7 student improved after homework was removed. So removing homework must be what helped.' What is wrong with this?",
      options: [
        {
          text: "Just because everyone improved doesn't mean removing homework caused it — there was no group in Class 7 who kept homework to compare with",
          score: 4,
          feedback: "Identifies the structural flaw: no control group. Even if every student improved, without a comparison group that kept homework in the same year, you cannot attribute the change to the policy. This is the logic error at the heart of the argument."
        },
        {
          text: "The argument leaves out Class 9, where compulsory homework came with lower scores",
          score: 3,
          feedback: "Points to relevant counter-evidence (Class 9), which is a valid rhetorical move. But this addresses what is missing from the argument, not what is structurally wrong with its logic."
        },
        {
          text: "Class 7 students often improve naturally — marks tend to go up as they settle into a new year",
          score: 2,
          feedback: "Names a real confound (natural improvement over the year). Partially correct but does not identify the core logical flaw — the absence of a control group."
        },
        {
          text: "The parent is probably right — if every student improved, the policy most likely caused it",
          score: 1,
          feedback: "Endorses the flawed reasoning. The student accepts 'universal improvement = proof of cause,' which is exactly what is wrong."
        }
      ],
      strongDistractor: "Citing the Class 9 counter-example is sophisticated and would be a strong point in a debate. But the question asks what is wrong with the argument's logic, not what evidence it ignores."
    }
  ]
};

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
