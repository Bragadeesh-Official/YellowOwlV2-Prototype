import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';
import logo from '@/assets/yellowowllogo.png';
import challenge1Img from '@/assets/Challenge1.png';
import challenge2Img from '@/assets/Challenge2.png';
import {
  WEEKLY_ASSESSMENT,
} from '@/mock/assessmentData';
import type {
  Challenge,
  MCQQuestion,
  DescriptiveQuestion,
  TwistQuestion,
  IdeasQuestion,
} from '@/mock/assessmentData';

export const SUPER_SKILL_DESCRIPTIONS: Record<string, { label: string; emoji: string; color: string }> = {
  thinking: {
    label: "Looking closer",
    emoji: "🧠",
    color: "#1E3A8A",
  },
  reading: {
    label: "Digging in",
    emoji: "📖",
    color: "#8B5CF6",
  },
  listening: {
    label: "Best choice",
    emoji: "🎯",
    color: "#F97316",
  },
  imagination: {
    label: "My ideas",
    emoji: "✨",
    color: "#0D9488",
  },
};


// ─── Types ───────────────────────────────────────────────────────────────────

interface ChallengeAnswer {
  mcq: (number | null)[];
  descriptive: string;
  twist: number | null;
  ideas: string[];
}

type AnswersMap = Record<number, ChallengeAnswer>;

const BUBBLES = [
  { size: 150, top: '5%', left: '5%', bg: '#2AD5B4' },
  { size: 100, top: '15%', left: '80%', bg: '#FFEA11' },
  { size: 125, top: '28%', left: '42%', bg: '#2AD5B4' },
  { size: 180, top: '42%', left: '10%', bg: '#FFEA11' },
  { size: 130, top: '55%', left: '75%', bg: '#FFEA11' },
  { size: 95, top: '68%', left: '32%', bg: '#2AD5B4' },
  { size: 140, top: '80%', left: '60%', bg: '#2AD5B4' },
  { size: 110, top: '92%', left: '15%', bg: '#FFEA11' },
  // additional circles
  { size: 70, top: '3%', left: '55%', bg: '#FFEA11' },
  { size: 90, top: '10%', left: '30%', bg: '#2AD5B4' },
  { size: 200, top: '20%', left: '88%', bg: '#2AD5B4' },
  { size: 60, top: '35%', left: '63%', bg: '#FFEA11' },
  { size: 115, top: '48%', left: '50%', bg: '#2AD5B4' },
  { size: 80, top: '60%', left: '5%', bg: '#FFEA11' },
  { size: 220, top: '65%', left: '85%', bg: '#FFEA11' },
  { size: 75, top: '72%', left: '48%', bg: '#2AD5B4' },
  { size: 160, top: '85%', left: '35%', bg: '#FFEA11' },
  { size: 85, top: '88%', left: '78%', bg: '#2AD5B4' },
  { size: 105, top: '96%', left: '55%', bg: '#2AD5B4' },
  { size: 65, top: '50%', left: '25%', bg: '#FFEA11' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getMCQQuestions(challenge: Challenge): MCQQuestion[] {
  return challenge.questions.filter((q): q is MCQQuestion => q.type === 'mcq');
}

function getDescriptiveQuestion(challenge: Challenge): DescriptiveQuestion | undefined {
  return challenge.questions.find((q): q is DescriptiveQuestion => q.type === 'descriptive');
}

function getIdeasQuestion(challenge: Challenge): IdeasQuestion | undefined {
  return challenge.questions.find((q): q is IdeasQuestion => q.type === 'ideas');
}

export function isMCQOrTwistChallenge(challenge: Challenge): boolean {
  return challenge.questions.some((q) => q.type === 'mcq');
}

function buildInitialAnswers(): AnswersMap {
  const map: AnswersMap = {};
  for (const c of WEEKLY_ASSESSMENT) {
    const mcqs = getMCQQuestions(c);
    map[c.id] = {
      mcq: mcqs.map(() => null),
      descriptive: '',
      twist: null,
      ideas: Array(5).fill(''),
    };
  }
  return map;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MCQOptionProps {
  option: string;
  index: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  optionRef: (el: HTMLButtonElement | null) => void;
}

function MCQOption({
  option,
  index,
  selectedIndex,
  onSelect,
  optionRef,
}: MCQOptionProps) {
  const isSelected = selectedIndex === index;
  let borderClass = isSelected ? 'border-4 border-[#FFEA11]' : 'border-2 border-gray-200';
  let bgClass = isSelected ? 'bg-[#FFFDE7]' : 'bg-white';

  return (
    <button
      ref={optionRef}
      onClick={() => onSelect(index)}
      className={`choice-card w-full text-left p-3 ${borderClass} ${bgClass} flex items-center gap-3 transition-all cursor-pointer`}
    >
      <span className="font-bold text-teal-600 min-w-[1.5rem]">
        {String.fromCharCode(65 + index)}.
      </span>
      <span className="flex-1 text-gray-800 text-sm leading-snug">{option}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WeeklyAssessmentPage() {
  const navigate = useNavigate();
  const { profile, saveAssessmentProgress, assessmentProgress } = useApp();
  const isSenior = profile && profile.age >= 12;

  // redirect if not logged in
  useEffect(() => {
    if (profile === null) {
      navigate('/login');
    }
  }, [profile, navigate]);

  // ── State ──
  const [showChallengeIntro, setShowChallengeIntro] = useState(true);
  const [showFeedbackPage, setShowFeedbackPage] = useState(false);
  const [feedbackSlideIndex, setFeedbackSlideIndex] = useState(0);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(() => {
    const saved = assessmentProgress as any;
    if (saved && typeof saved.currentChallengeIndex === 'number' && !saved.completed) {
      return saved.currentChallengeIndex;
    }
    return 0;
  });
  const [answers, setAnswers] = useState<AnswersMap>(() => {
    const saved = assessmentProgress as any;
    if (saved && saved.answers && Object.keys(saved.answers).length > 0 && !saved.completed) {
      return saved.answers;
    }
    return buildInitialAnswers();
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = assessmentProgress as any;
    if (saved && typeof saved.timeLeft === 'number' && !saved.completed) {
      return saved.timeLeft;
    }
    return 900; // 15 minutes
  });
  const [timerPaused, setTimerPaused] = useState(true);
  const [isComplete, setIsComplete] = useState(() => {
    const saved = assessmentProgress as any;
    return !!saved?.completed;
  });

  // Idle / "Are you still there?" state
  const [showIdlePopup, setShowIdlePopup] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(60);

  // Per-challenge UI state
  const [showTwist, setShowTwist] = useState(false);
  const [showContinueAfterTwist, setShowContinueAfterTwist] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [, setExplanationVisible] = useState<boolean[]>([]);
  const [showSurprise, setShowSurprise] = useState(false);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const rightBoxRef = useRef<HTMLDivElement>(null);
  const twistBannerRef = useRef<HTMLDivElement>(null);
  const twistCardRef = useRef<HTMLDivElement>(null);
  const surpriseOverlayRef = useRef<HTMLDivElement>(null);
  const surpriseCardRef = useRef<HTMLDivElement>(null);
  const explanationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const optionRefs = useRef<(HTMLButtonElement | null)[][]>([]);
  const confettiRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const introCardRef = useRef<HTMLDivElement>(null);
  const feedbackCardRef = useRef<HTMLDivElement>(null);

  const timerPausedRef = useRef(timerPaused);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentChallenge = WEEKLY_ASSESSMENT[currentChallengeIndex] || WEEKLY_ASSESSMENT[0];
  const currentAnswer = answers[currentChallenge.id] || {
    mcq: [],
    descriptive: '',
    twist: null,
    ideas: Array(5).fill(''),
  };

  // Get all questions in the current challenge
  const getQuestionsList = () => {
    let mcqCounter = 0;
    const list = currentChallenge.questions.map((q) => {
      if (q.type === 'mcq') {
        const idx = mcqCounter;
        mcqCounter++;
        return { ...q, mcqIndex: idx };
      }
      return q;
    });
    if (currentChallenge.twistQuestion && showTwist) {
      list.push({ ...currentChallenge.twistQuestion, type: 'twist' } as any);
    }
    return list;
  };
  const challengeQuestions = getQuestionsList();

  const isQuestionAnswered = (q: any): boolean => {
    if (!q) return false;
    if (q.type === 'mcq') {
      const mcqIdx = q.mcqIndex;
      return currentAnswer.mcq[mcqIdx] !== undefined && currentAnswer.mcq[mcqIdx] !== null;
    }
    if (q.type === 'descriptive') {
      return !!(currentAnswer.descriptive && currentAnswer.descriptive.trim() !== '');
    }
    if (q.type === 'twist') {
      return currentAnswer.twist !== undefined && currentAnswer.twist !== null;
    }
    if (q.type === 'ideas') {
      return !!(currentAnswer.ideas && currentAnswer.ideas.some((idea: string) => idea && idea.trim() !== ''));
    }
    return false;
  };

  const canNavigateToQuestion = (targetIdx: number): boolean => {
    if (showFeedbackPage) return true;
    if (targetIdx <= activeQuestionIndex) return true;
    for (let i = 0; i < targetIdx; i++) {
      if (!isQuestionAnswered(challengeQuestions[i])) {
        return false;
      }
    }
    return true;
  };

  const getQuestionLabel = (q: any, idx: number) => {
    if (!q) return `Question ${idx + 1}`;
    if (q.type === 'twist') return `Question ${idx + 1} (Twist)`;
    return `Question ${idx + 1}`;
  };

  // ── Reset per-challenge UI when challenge changes ──
  useEffect(() => {
    setShowTwist(false);
    setShowContinueAfterTwist(false);
    setActiveQuestionIndex(0);
    const mcqCount = getMCQQuestions(currentChallenge).length;
    setExplanationVisible(Array(mcqCount).fill(false));
    optionRefs.current = getMCQQuestions(currentChallenge).map(() => []);
    explanationRefs.current = Array(mcqCount).fill(null);
  }, [currentChallengeIndex, currentChallenge]);

  // ── Timer countdown ──
  useEffect(() => {
    timerPausedRef.current = timerPaused;
  }, [timerPaused]);

  useEffect(() => {
    if (isComplete || showFeedbackPage || timeLeft <= 0) return;
    const interval = setInterval(() => {
      if (!timerPausedRef.current) {
        setTimeLeft((prev: number) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete, showFeedbackPage, timeLeft]);

  // Navigate back to den when timer expires
  useEffect(() => {
    if (timeLeft === 0 && !isComplete) {
      saveAssessmentProgress({
        completed: false,
        currentChallengeIndex,
        completedChallengesCount: currentChallengeIndex,
        answers,
        timeLeft: 0,
        date: new Date().toISOString(),
      });
      navigate('/dashboard');
    }
  }, [timeLeft, isComplete, currentChallengeIndex, answers, saveAssessmentProgress, navigate]);

  // ── Idle detection ──
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!showIdlePopup) {
      idleTimerRef.current = setTimeout(() => {
        setTimerPaused(true);
        setShowIdlePopup(true);
        setIdleCountdown(60);
      }, 60_000);
    }
  }, [showIdlePopup]);

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    resetIdleTimer();
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // ── Idle popup countdown ──
  useEffect(() => {
    if (!showIdlePopup || idleCountdown <= 0) {
      if (idleCountdownRef.current) clearInterval(idleCountdownRef.current);
      return;
    }
    idleCountdownRef.current = setInterval(() => {
      setIdleCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => {
      if (idleCountdownRef.current) clearInterval(idleCountdownRef.current);
    };
  }, [showIdlePopup, idleCountdown]);

  // Navigate back to den when idle countdown expires
  useEffect(() => {
    if (showIdlePopup && idleCountdown === 0) {
      saveAssessmentProgress({
        completed: false,
        currentChallengeIndex,
        completedChallengesCount: currentChallengeIndex,
        answers,
        timeLeft,
        date: new Date().toISOString(),
      });
      navigate('/dashboard');
    }
  }, [showIdlePopup, idleCountdown, currentChallengeIndex, answers, timeLeft, saveAssessmentProgress, navigate]);

  // ── GSAP Background Bubbles Animation ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      bubblesRef.current.forEach((bubble, i) => {
        if (!bubble) return;
        gsap.to(bubble, {
          y: -30 - i * 8,
          x: (i % 2 === 0 ? 15 : -15),
          duration: 3 + i * 0.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.4,
        });
      });
    });
    return () => ctx.revert();
  }, [showChallengeIntro, showFeedbackPage, isComplete]);

  // ── GSAP Intro Card & Feedback Card Entrance Animations ──
  useEffect(() => {
    if (showChallengeIntro && introCardRef.current) {
      gsap.fromTo(introCardRef.current,
        { scale: 0.9, y: 40, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }
      );
    }
  }, [showChallengeIntro]);

  useEffect(() => {
    if (showFeedbackPage && feedbackCardRef.current) {
      gsap.fromTo(feedbackCardRef.current,
        { scale: 0.92, y: 40, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.65, ease: 'back.out(1.4)' }
      );
    }
  }, [showFeedbackPage]);

  useEffect(() => {
    if (!showChallengeIntro && !showFeedbackPage && !isComplete && cardRef.current) {
      gsap.fromTo(cardRef.current,
        { scale: 0.96, y: 30, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [showChallengeIntro, showFeedbackPage, isComplete]);

  // ── Completion / confetti ──
  const handleComplete = useCallback(
    (animated = true) => {
      setIsComplete(true);
      setTimerPaused(true);
      const timeUsed = 900 - timeLeft;
      saveAssessmentProgress({
        completed: true,
        answers,
        timeUsed,
        date: new Date().toISOString(),
      });
      if (animated && confettiRef.current) {
        const emojis = ['🎉', '⭐', '🌟', '✨', '🦉', '🎊', '🏆'];
        const container = confettiRef.current;
        for (let i = 0; i < 20; i++) {
          const el = document.createElement('div');
          el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
          el.style.cssText = `position:absolute;font-size:${Math.random() * 18 + 16}px;left:${Math.random() * 100}%;top:-40px;pointer-events:none;`;
          container.appendChild(el);
          gsap.to(el, {
            y: window.innerHeight + 60,
            x: (Math.random() - 0.5) * 200,
            rotation: Math.random() * 360,
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 1.5,
            ease: 'power1.in',
            onComplete: () => el.remove(),
          });
        }
      }
    },
    [answers, saveAssessmentProgress, timeLeft]
  );

  // ── Challenge transition animation ──
  const animateTransition = (direction: 'forward' | 'back', onMidpoint: () => void) => {
    if (!cardRef.current) {
      onMidpoint();
      return;
    }
    const exitX = direction === 'forward' ? -400 : 400;
    const enterX = direction === 'forward' ? 400 : -400;
    gsap.to(cardRef.current, {
      x: exitX,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        onMidpoint();
        if (cardRef.current) {
          gsap.fromTo(
            cardRef.current,
            { x: enterX, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
          );
        }
      },
    });
  };

  // ── MCQ answer ──
  const handleMCQSelect = (questionIndex: number, optionIndex: number) => {
    // Animate selected option
    const optionEl = optionRefs.current[questionIndex]?.[optionIndex];
    if (optionEl) {
      gsap.to(optionEl, { scale: 1.04, duration: 0.1, yoyo: true, repeat: 1 });
    }

    // Update answers
    setAnswers((prev) => {
      const prevMcq = [...prev[currentChallenge.id].mcq];
      prevMcq[questionIndex] = optionIndex;
      return {
        ...prev,
        [currentChallenge.id]: { ...prev[currentChallenge.id], mcq: prevMcq },
      };
    });
  };

  // ── Descriptive answer ──
  const handleDescriptiveChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentChallenge.id]: { ...prev[currentChallenge.id], descriptive: value },
    }));
  };

  // ── Twist answer ──
  const handleTwistSelect = (optionIndex: number) => {
    if (!currentChallenge.twistQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentChallenge.id]: { ...prev[currentChallenge.id], twist: optionIndex },
    }));
    setShowContinueAfterTwist(true);
  };

  // ── Ideas answer ──
  const handleIdeaChange = (ideaIndex: number, value: string) => {
    setAnswers((prev) => {
      const prevIdeas = [...prev[currentChallenge.id].ideas];
      prevIdeas[ideaIndex] = value;
      return {
        ...prev,
        [currentChallenge.id]: { ...prev[currentChallenge.id], ideas: prevIdeas },
      };
    });
  };

  // ── "Lock Answer & Continue" ──
  /*
  const handleLockAndContinue = () => {
    if (isMCQOrTwistChallenge(currentChallenge) && currentChallenge.twistQuestion) {
      // Reveal the twist
      setShowTwist(true);
      setActiveQuestionIndex(challengeQuestions.length - 1);
      setTimeout(() => {
        if (twistBannerRef.current) {
          gsap.from(twistBannerRef.current, {
            y: 40,
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            ease: 'back.out(1.7)',
          });
        }
        if (twistCardRef.current) {
          gsap.from(twistCardRef.current, {
            y: 40,
            opacity: 0,
            duration: 0.4,
            delay: 0.15,
            ease: 'power2.out',
          });
        }
      }, 50);
    } else {
      openFeedbackPage();
    }
  };
  */

  const triggerSurpriseTwist = () => {
    setShowSurprise(true);
    setTimeout(() => {
      if (surpriseOverlayRef.current) {
        gsap.fromTo(surpriseOverlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
      }
      if (surpriseCardRef.current) {
        gsap.fromTo(surpriseCardRef.current,
          { scale: 0.7, y: 100, rotation: -10, opacity: 0 },
          { scale: 1, y: 0, rotation: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.5)', delay: 0.1 }
        );
      }
    }, 50);
  };

  const handleRevealTwist = () => {
    if (surpriseOverlayRef.current) {
      gsap.to(surpriseOverlayRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          setShowSurprise(false);
          setShowTwist(true);
          // With showTwist=true, the next render will have challengeQuestions of length 4.
          // We transition activeQuestionIndex to index 3 (the Twist question).
          setActiveQuestionIndex(3);
          setTimeout(() => {
            if (twistBannerRef.current) {
              gsap.from(twistBannerRef.current, {
                y: 40,
                opacity: 0,
                scale: 0.8,
                duration: 0.5,
                ease: 'back.out(1.7)',
              });
            }
            if (twistCardRef.current) {
              gsap.from(twistCardRef.current, {
                y: 40,
                opacity: 0,
                duration: 0.4,
                delay: 0.15,
                ease: 'power2.out',
              });
            }
          }, 50);
        }
      });
    } else {
      setShowSurprise(false);
      setShowTwist(true);
      setActiveQuestionIndex(3);
    }
  };

  // ── Open the feedback slider, always starting at the first slide ──
  const openFeedbackPage = () => {
    setFeedbackSlideIndex(0);
    setShowFeedbackPage(true);
  };

  // ── Navigate challenges ──
  const goToNextChallenge = () => {
    const nextIndex = currentChallengeIndex + 1;
    // Save progress incrementally
    saveAssessmentProgress({
      completed: false,
      currentChallengeIndex: nextIndex,
      completedChallengesCount: nextIndex,
      answers,
      timeLeft,
      date: new Date().toISOString(),
    });

    if (currentChallengeIndex >= WEEKLY_ASSESSMENT.length - 1) {
      handleComplete(true);
    } else {
      animateTransition('forward', () => {
        setCurrentChallengeIndex((prev: number) => prev + 1);
        setShowChallengeIntro(true);
      });
    }
  };

  const goToPrevChallenge = () => {
    if (currentChallengeIndex === 0) return;
    animateTransition('back', () => {
      setCurrentChallengeIndex((prev: number) => prev - 1);
    });
  };

  // ── Lock button enablement ──
  /*
  const isLockEnabled = (): boolean => {
    if (isMCQOrTwistChallenge(currentChallenge)) {
      const mcqs = getMCQQuestions(currentChallenge);
      const allMcqAnswered = mcqs.every((_, i) => currentAnswer.mcq[i] !== null);
      const dq = getDescriptiveQuestion(currentChallenge);
      const descriptiveAnswered = dq ? currentAnswer.descriptive.trim() !== '' : true;
      return allMcqAnswered && descriptiveAnswered;
    }
    return true; // ideas challenge — always allow
  };
  */

  const animateQuestionTransition = (direction: 'forward' | 'back', onMidpoint: () => void) => {
    if (!rightBoxRef.current) {
      onMidpoint();
      return;
    }
    const exitX = direction === 'forward' ? -150 : 150;
    const enterX = direction === 'forward' ? 150 : -150;
    gsap.to(rightBoxRef.current, {
      x: exitX,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        onMidpoint();
        if (rightBoxRef.current) {
          gsap.fromTo(
            rightBoxRef.current,
            { x: enterX, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }
          );
        }
      },
    });
  };

  const handleQuestionClick = (index: number) => {
    if (index === activeQuestionIndex) return;
    const q = challengeQuestions[index];
    if (!q) return;
    const isTwist = q.type === 'twist';
    if (isTwist && !showTwist) {
      return;
    }
    const direction = index > activeQuestionIndex ? 'forward' : 'back';
    animateQuestionTransition(direction, () => {
      setActiveQuestionIndex(index);
    });
  };

  // ── Dismiss idle popup ──
  const handleImHere = () => {
    setShowIdlePopup(false);
    setTimerPaused(false);
    resetIdleTimer();
  };

  const handleStartChallenge = () => {
    setShowChallengeIntro(false);
    setTimerPaused(false);
  };

  const handleBackToDen = () => {
    saveAssessmentProgress({
      completed: false,
      currentChallengeIndex,
      completedChallengesCount: currentChallengeIndex,
      answers,
      timeLeft,
      date: new Date().toISOString(),
    });
    navigate('/dashboard');
  };

  const handleRestartChallenge = () => {
    if (window.confirm("Are you sure you want to restart this weekly assessment challenge from the beginning? This will clear your current answers.")) {
      localStorage.removeItem('yellowowl_assessment_progress');
      const initialAnswers = buildInitialAnswers();
      saveAssessmentProgress({
        completed: false,
        currentChallengeIndex: 0,
        completedChallengesCount: 0,
        answers: initialAnswers,
        timeLeft: 900,
        date: new Date().toISOString(),
      });
      setCurrentChallengeIndex(0);
      setAnswers(initialAnswers);
      setTimeLeft(900);
      setIsComplete(false);
      setTimerPaused(true);
      setShowChallengeIntro(true);
      setShowFeedbackPage(false);
    }
  };

  // ── Render helpers ──
  const renderMCQSection = (qi: number) => {
    const mcqs = getMCQQuestions(currentChallenge);
    const q = mcqs[qi];
    if (!q) return null;
    return (
      <div className="space-y-4">
        <p className="font-bold text-gray-800 text-base leading-snug">{q.question}</p>
        <div className="grid grid-cols-1 gap-2">
          {q.options.map((opt, oi) => (
            <MCQOption
              key={oi}
              option={opt}
              index={oi}
              selectedIndex={currentAnswer.mcq[qi]}
              onSelect={(idx) => handleMCQSelect(qi, idx)}
              optionRef={(el) => {
                if (!optionRefs.current[qi]) optionRefs.current[qi] = [];
                optionRefs.current[qi][oi] = el;
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderDescriptiveSection = () => {
    const dq = getDescriptiveQuestion(currentChallenge);
    if (!dq) return null;
    return (
      <div className="space-y-2 mt-4">
        <p className="font-bold text-gray-800 text-base leading-snug">{dq.question}</p>
        <p className="text-xs text-gray-400 italic">{dq.hint}</p>
        <textarea
          className="w-full border-2 border-teal-400 rounded-xl p-3 resize-none text-gray-800 text-sm focus:outline-none focus:border-teal-600"
          style={{ minHeight: '120px' }}
          placeholder="Write your answer here..."
          value={currentAnswer.descriptive}
          onChange={(e) => handleDescriptiveChange(e.target.value)}
        />
      </div>
    );
  };

  const renderTwistSection = (twist: TwistQuestion) => (
    <div className="mt-6 space-y-4">
      <div ref={twistBannerRef} className="text-center py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg">
        🌀 SURPRISE TWIST!
      </div>
      <div ref={twistCardRef} className="owl-card p-4 border-2 border-purple-200">
        <p className="font-bold text-gray-800 text-base leading-snug mb-3">{twist.question}</p>
        <div className="grid grid-cols-1 gap-2">
          {twist.options.map((opt, oi) => {
            const isSelected = currentAnswer.twist === oi;
            let borderClass = isSelected ? 'border-purple-400' : 'border-gray-200';
            let bgClass = isSelected ? 'bg-purple-50' : 'bg-white';

            return (
              <button
                key={oi}
                onClick={() => handleTwistSelect(oi)}
                className={`choice-card w-full text-left p-3 border-2 ${borderClass} ${bgClass} flex items-center gap-3 cursor-pointer`}
              >
                <span className="font-bold text-purple-600 min-w-[1.5rem]">{String.fromCharCode(65 + oi)}.</span>
                <span className="flex-1 text-gray-800 text-sm">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderIdeasSection = () => {
    const iq = getIdeasQuestion(currentChallenge);
    if (!iq) return null;
    const isLastChallenge = currentChallengeIndex === WEEKLY_ASSESSMENT.length - 1;
    return (
      <div className="space-y-4">
        <p className="font-bold text-gray-800 text-base leading-snug">{iq.question}</p>
        <p className="text-sm text-teal-600 italic">{iq.prompt}</p>
        <div className="space-y-2">
          {Array.from({ length: iq.count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-bold text-teal-600 text-sm min-w-[1.5rem]">{i + 1}.</span>
              <input
                type="text"
                className="flex-1 border-2 border-teal-400 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:border-teal-600"
                placeholder={`Idea ${i + 1}...`}
                value={currentAnswer.ideas[i] ?? ''}
                onChange={(e) => handleIdeaChange(i, e.target.value)}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 italic">{iq.example}</p>
        <p className="text-center text-sm font-bold text-teal-600">
          {isLastChallenge
            ? "You're amazing! Look how far you've come! 🎉"
            : 'Your ideas make the world better! 🌟'}
        </p>
      </div>
    );
  };

  const renderActiveQuestion = () => {
    const q = challengeQuestions[activeQuestionIndex];
    if (!q) return null;

    switch (q.type) {
      case 'mcq':
        return renderMCQSection(q.mcqIndex);
      case 'descriptive':
        return renderDescriptiveSection();
      case 'ideas':
        return renderIdeasSection();
      case 'twist':
        return renderTwistSection(q);
      default:
        return null;
    }
  };

  // Render variables for feedback screen calculation
  const mcqs = getMCQQuestions(currentChallenge);
  const mcqAnswers = currentAnswer.mcq;
  let mcqScore = 0;
  mcqs.forEach((q, idx) => {
    if (mcqAnswers[idx] === q.correct) {
      mcqScore++;
    }
  });

  const twistQuestion = currentChallenge.twistQuestion;
  const twistAnswer = currentAnswer.twist;
  let twistCorrect = false;
  if (twistQuestion && twistAnswer !== null) {
    twistCorrect = twistAnswer === twistQuestion.correct;
  }

  const totalMcqs = mcqs.length;
  const hasMcqs = totalMcqs > 0;
  const hasDescriptive = !!getDescriptiveQuestion(currentChallenge);
  const isIdeas = !hasMcqs && !hasDescriptive;
  const isLastChallenge = currentChallengeIndex === WEEKLY_ASSESSMENT.length - 1;

  return (
    <div
      className="relative min-h-screen gradient-bg flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%)' }}
    >

      {/* Floating Background Bubbles */}
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          ref={(el) => { if (el) bubblesRef.current[i] = el; }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.size,
            height: b.size,
            backgroundColor: b.bg,
            opacity: 0.18,
            top: b.top,
            left: b.left,
            zIndex: 0,
          }}
        />
      ))}

      {/* Render the Active State View */}
      <div className="relative z-10 flex-1 flex flex-col w-full">
        {isComplete ? (
          /* ── Completion View ── */
          <div
            ref={confettiRef}
            className="flex-1 flex flex-col items-center justify-center p-4"
          >
            <div className="owl-card max-w-lg w-full mx-auto p-8 text-center relative z-10">
              <div className="text-5xl mb-4 pop-in">🎉</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Weekly Challenge Complete!</h1>

              <div className="flex justify-center mb-8">
                <div className="bg-yellow-50 rounded-2xl p-4 w-48 text-center border-2 border-yellow-100">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-lg font-bold text-yellow-600">Weekly Challenge</div>
                  <div className="text-sm text-gray-500 mt-1">Successfully Completed!</div>
                </div>
              </div>

              <p className="text-gray-500 text-sm mb-6">
                You successfully tackled the challenges — that's incredible effort!
              </p>

              <button
                className="btn-yellow-owl w-full text-lg py-4"
                onClick={() => navigate('/dashboard')}
              >
                Back to My Den ➔
              </button>
            </div>
          </div>
        ) : showFeedbackPage ? (
          /* ── Feedback View (Slider) ── */
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full relative z-10">
            <div
              ref={feedbackCardRef}
              className="bg-white/95 border-4 border-[#FFEA11] shadow-2xl p-6 sm:p-8 relative max-w-2xl w-full"
              style={{ borderRadius: 36 }}
            >
              {/* Floating top badge */}
              <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 text-6xl drop-shadow-lg select-none pointer-events-none">
                {isIdeas ? '💡' : '🌟'}
              </div>

              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-dashed border-gray-200 pt-3 mb-4">
                <h2 className="text-xl font-black text-gray-800">
                  {isIdeas ? 'Genius Brainstormer!' : 'Great Job, Adventurer!'}
                </h2>
                <p className="text-[10px] font-extrabold text-gray-400 mt-1 uppercase tracking-widest">
                  Feedback · <span className="text-teal-600">{currentChallenge.title}</span>
                  &nbsp;·&nbsp; {feedbackSlideIndex + 1} / {challengeQuestions.length}
                </p>
              </div>

              {/* Slide content */}
              <div className="min-h-[240px]">
                {(() => {
                  const q = challengeQuestions[feedbackSlideIndex];
                  if (!q) return null;
                  switch (q.type) {
                    case 'mcq': {
                      const qi = (q as any).mcqIndex;
                      const mcqQ = mcqs[qi];
                      if (!mcqQ) return null;
                      const isCorrect = mcqAnswers[qi] === mcqQ.correct;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">

                          </div>
                          <p className="font-black text-gray-800 text-sm leading-snug">{mcqQ.question}</p>
                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="font-extrabold text-gray-400 block mb-1">Your Choice:</span>
                              <div className={`p-3 rounded-2xl border-2 flex items-center justify-between text-sm font-bold ${isCorrect ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-sky-50 border-sky-200 text-sky-800'}`}>
                                <span>{mcqAnswers[qi] !== null ? mcqQ.options[mcqAnswers[qi]!] : 'Not Answered'}</span>
                                {isCorrect ? <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full font-black">BEST</span> : <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full font-black">NICE TRY</span>}
                              </div>
                            </div>
                            {!isCorrect && (
                              <div className="text-xs">
                                <span className="font-extrabold text-gray-400 block mb-1">Best Choice:</span>
                                <div className="p-3 rounded-2xl border-2 border-teal-200 bg-teal-50/60 text-teal-900 text-sm font-bold flex items-center justify-between">
                                  <span>{mcqQ.options[mcqQ.correct]}</span>
                                  <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full font-black">BEST</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-sm md:text-base leading-relaxed font-semibold flex gap-3.5 items-start">
                            <img src={logo} alt="owl" className="w-7 h-7 object-contain flex-shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
                            <div><span className="font-black text-teal-900 block mb-0.5">Explanation:</span>{mcqQ.explanation}</div>
                          </div>
                        </div>
                      );
                    }
                    case 'descriptive': {
                      const dq = getDescriptiveQuestion(currentChallenge);
                      if (!dq) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><span className="font-black text-gray-800 text-sm">Your Creative Masterpiece:</span></div>
                          <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 bottom-0 left-3 w-[1px] bg-red-200/50" />
                            <p className="pl-5 text-gray-700 text-sm italic font-semibold leading-relaxed">"{currentAnswer.descriptive || 'No response provided'}"</p>
                          </div>
                          {dq.sampleAnswer && (
                            <div className="p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-100 text-sm md:text-base leading-relaxed font-semibold flex gap-3.5 items-start">
                              <span className="text-xl flex-shrink-0">💡</span>
                              <div><span className="font-black text-sky-900 block mb-0.5">Spark your imagination:</span>{dq.sampleAnswer}</div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    case 'twist': {
                      if (!twistQuestion || twistAnswer === null) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2"><span className="text-xl">🌀</span><span className="font-black text-purple-900 text-sm">Surprise Twist:</span></div>

                          </div>
                          <p className="font-black text-gray-800 text-sm leading-snug">{twistQuestion.question}</p>
                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="font-extrabold text-gray-400 block mb-1">Your Choice:</span>
                              <div className={`p-3 rounded-2xl border-2 flex items-center justify-between text-sm font-bold ${twistCorrect ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
                                <span>{twistQuestion.options[twistAnswer]}</span>
                                {twistCorrect ? <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-black">BEST</span> : <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-black">NICE TRY</span>}
                              </div>
                            </div>
                            {!twistCorrect && (
                              <div className="text-xs">
                                <span className="font-extrabold text-gray-400 block mb-1">Best Choice:</span>
                                <div className="p-3 rounded-2xl border-2 border-purple-200 bg-purple-50/60 text-purple-900 text-sm font-bold flex items-center justify-between">
                                  <span>{twistQuestion.options[twistQuestion.correct]}</span>
                                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-black">BEST</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-sm md:text-base leading-relaxed font-semibold flex gap-3.5 items-start">
                            <span className="text-xl flex-shrink-0 animate-pulse">🔮</span>
                            <div><span className="font-black text-purple-900 block mb-0.5">Twist Revealed:</span>{twistQuestion.explanation}</div>
                          </div>
                        </div>
                      );
                    }
                    case 'ideas': {
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><span className="text-xl">💡</span><span className="font-black text-violet-800 text-sm">Your Brainstormed Ideas:</span></div>
                          <div className="grid grid-cols-1 gap-2">
                            {currentAnswer.ideas.filter(i => i.trim() !== '').map((idea, i) => (
                              <div key={i} className="flex gap-3 text-sm text-gray-700 bg-white p-3 rounded-2xl border-2 border-violet-100 font-semibold shadow-sm">
                                <span className="font-black text-violet-600 bg-violet-50 w-6 h-6 flex items-center justify-center rounded-full text-xs border border-violet-200 flex-shrink-0">{i + 1}</span>
                                <span className="flex-1 leading-snug">{idea}</span>
                              </div>
                            ))}
                            {currentAnswer.ideas.filter(i => i.trim() !== '').length === 0 && <p className="text-gray-400 text-xs italic">No ideas entered.</p>}
                          </div>
                          <div className="p-3 rounded-3xl bg-teal-50 border-2 border-teal-200 text-center">
                            <p className="text-2xl mb-1 animate-bounce" style={{ animationDuration: '3.5s' }}>🌟</p>
                            <p className="text-sm font-black text-teal-800">Creativity Spark Unlocked!</p>
                          </div>
                        </div>
                      );
                    }
                    default: return null;
                  }
                })()}
              </div>

              {/* Dot indicators */}
              <div className="flex justify-center gap-2 mt-5">
                {challengeQuestions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFeedbackSlideIndex(i)}
                    className={`rounded-full transition-all cursor-pointer ${i === feedbackSlideIndex
                      ? 'w-6 h-2.5 bg-[#FFEA11] border border-yellow-400'
                      : 'w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300'
                      }`}
                  />
                ))}
              </div>

              {/* Nav buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="w-24">
                  {feedbackSlideIndex > 0 && (
                    <button
                      onClick={() => setFeedbackSlideIndex(f => f - 1)}
                      className="text-sm text-gray-500 hover:text-gray-800 font-black py-2 px-4 hover:bg-gray-100 rounded-2xl cursor-pointer transition-all"
                    >
                      ← Back
                    </button>
                  )}
                </div>

                <div className="flex-1 flex justify-center">
                  {feedbackSlideIndex < challengeQuestions.length - 1 ? (
                    <button
                      className="btn-yellow-owl text-sm py-2.5 px-7 cursor-pointer"
                      onClick={() => setFeedbackSlideIndex(f => f + 1)}
                    >
                      Next ➔
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowFeedbackPage(false);
                        if (isLastChallenge) {
                          handleComplete(true);
                        } else {
                          goToNextChallenge();
                        }
                      }}
                      className="btn-yellow-owl text-base py-3 px-8 cursor-pointer shadow-lg"
                    >
                      {isLastChallenge ? 'Finish Quest 🎉' : 'Next Challenge ➔'}
                    </button>
                  )}
                </div>

                <div className="w-24" />
              </div>
            </div>
          </div>
        ) : showChallengeIntro ? (
          /* ── Pre-Assessment Instructions View ── */
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div
              ref={introCardRef}
              className="owl-card max-w-lg w-full mx-auto p-8 relative z-10 text-center"
              style={{ borderRadius: 24, boxShadow: '0 8px 32px rgba(255, 234, 17, 0.15)', background: 'white' }}
            >
              <span className="text-sm font-black text-[#B8A800] bg-[#fffbeb] px-3 py-1 rounded-full uppercase tracking-wider">
                Challenge
              </span>

              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mt-6 mb-4 shadow-sm"
                style={{ backgroundColor: `${currentChallenge.color}20` }}
              >
                {currentChallenge.emoji}
              </div>

              <h2 className="text-3xl font-black text-gray-800 mb-1">
                {currentChallenge.title}
              </h2>
              <p className="text-base font-extrabold text-gray-500 mb-4">
                Theme: {currentChallenge.theme}
              </p>

              {/* Focus tags */}
              {(() => {
                const focusList = isSenior
                  ? currentChallenge.focus?.senior
                  : currentChallenge.focus?.junior;

                if (!focusList || focusList.length === 0) return null;

                return (
                  <div className="mb-6">
                    <span className="text-[11px] font-black text-[#B8A800] bg-[#fffbeb] px-3 py-1 rounded-full uppercase tracking-wider block w-max mx-auto mb-3">
                      Focus Areas
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {focusList.map((fValue) => (
                        <span
                          key={fValue}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black text-gray-700 shadow-sm border border-gray-200/50 hover:scale-105 transition-transform cursor-default bg-teal-50 border-teal-150"
                        >
                          <span>🎯</span>
                          <span className="capitalize">{fValue}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
                <h4 className="font-extrabold text-sm text-gray-700 mb-2">What you'll do:</h4>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  {currentChallengeIndex === 0 ? 'Crack detective questions about plants, sunlight, and clean air!' :
                    currentChallengeIndex === 1 ? 'Explore story elements, character roles, and rewrite your own creative ending!' :
                      currentChallengeIndex === 2 ? 'Use your magic wand to imagine and design 5 major improvements for your school!' :
                        currentChallengeIndex === 3 ? 'Travel to the year 2050 and list your top futuristic inventions to help humanity!' :
                          'Look back on all your achievements, challenges, and thoughts during this quest!'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="btn-yellow-owl w-full text-lg py-4"
                  onClick={handleStartChallenge}
                >
                  Enter Challenge 🚀
                </button>

                <button
                  className="font-bold text-sm text-gray-500 hover:text-yellow-600 transition-colors mt-2"
                  onClick={handleBackToDen}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Assessment View ── */
          <div className="flex-1 flex flex-col md:flex-row w-full min-h-screen relative z-10">
            {/* Desktop Sidebar (Left side, covers top to bottom) */}
            <aside className="hidden md:flex w-72 shrink-0 flex-col bg-white/95 backdrop-blur-md p-6 border-r border-yellow-100/50 sticky top-0 h-screen justify-between z-30">
              <div>
                {/* Logo & Brand */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-[#FFEA11]/20 p-1.5 rounded-2xl border-2 border-[#FFEA11]/40">
                    <img src={logo} alt="Yellow Owl Logo" className="h-10 w-auto object-contain" />
                  </div>
                  <span className="font-black text-xl tracking-wider text-gray-800 font-display">
                    Yellow Owl
                  </span>
                </div>

                {/* Challenge context card */}
                <div className="flex items-center gap-3 bg-[#fffde7] p-3 rounded-2xl mb-6 border border-yellow-250/50 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#FFEA11] border-2 border-white shadow-md flex items-center justify-center text-xl shrink-0">
                    {currentChallenge.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-gray-800 truncate">{currentChallenge.title}</div>
                    <div className="text-[10px] text-gray-400 font-bold truncate">{currentChallenge.theme}</div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Questions</div>
                <nav className="flex flex-wrap gap-2.5 px-2">
                  {challengeQuestions.map((q, idx) => {
                    const isActive = idx === activeQuestionIndex;
                    const isTwist = q.type === 'twist';
                    const isAnswered = isQuestionAnswered(q);
                    const isNavigateAllowed = canNavigateToQuestion(idx);
                    const isLocked = (isTwist && !showTwist) || !isNavigateAllowed;

                    return (
                      <button
                        key={idx}
                        disabled={isLocked}
                        onClick={() => handleQuestionClick(idx)}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl text-base font-black transition-all cursor-pointer ${isActive
                          ? 'bg-[#FFEA11] text-gray-800 shadow-md cursor-default border border-transparent'
                          : isLocked
                            ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50'
                            : isAnswered
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-250 shadow-sm hover:bg-emerald-100 hover:border-emerald-300'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-[#FFEA11]/25 hover:text-gray-800 shadow-sm'
                          }`}
                      >
                        {isLocked ? '🔒' : isAnswered && !isActive ? '✓' : idx + 1}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Actions / Timer */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className={`font-black text-sm text-center py-2.5 px-3.5 rounded-2xl border border-teal-150 bg-teal-50/50 ${timeLeft < 120 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                  ⏱️ {formatTime(timeLeft)}
                </div>
                <button
                  onClick={handleBackToDen}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-100 transition-all cursor-pointer text-left"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </aside>

            {/* Main Area (Right side) */}
            <div className="flex-1 flex flex-col min-h-screen w-full">
              {/* Mobile Top Bar */}
              <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white/95 border-b border-gray-150/80 sticky top-0 z-20">
                <button onClick={handleBackToDen} className="btn-back">
                  ← Den
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{currentChallenge.emoji}</span>
                  <span className="font-black text-gray-800 text-sm">{currentChallenge.title}</span>
                </div>
                <div className={`font-black text-xs ${timeLeft < 120 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                  ⏱️ {formatTime(timeLeft)}
                </div>
              </div>

              {/* Mobile Question Row */}
              <div className="flex md:hidden gap-1.5 overflow-x-auto p-3 bg-white/70 border-b border-gray-150/50">
                {challengeQuestions.map((q, idx) => {
                  const isActive = idx === activeQuestionIndex;
                  const isTwist = q.type === 'twist';
                  const isAnswered = isQuestionAnswered(q);
                  const isNavigateAllowed = canNavigateToQuestion(idx);
                  const isLocked = (isTwist && !showTwist) || !isNavigateAllowed;
                  return (
                    <button
                      key={idx}
                      disabled={isLocked}
                      onClick={() => handleQuestionClick(idx)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isActive
                        ? 'bg-[#FFEA11] text-gray-800 shadow-sm'
                        : isLocked
                          ? 'bg-gray-100 text-gray-400 opacity-60'
                          : isAnswered
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-250'
                            : 'bg-white/80 text-gray-655 hover:bg-gray-100'
                        }`}
                    >
                      {isAnswered && !isActive ? '✓ ' : ''}{getQuestionLabel(q, idx)}
                    </button>
                  );
                })}
              </div>

              {/* Main Content Area containing Card */}
              <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div
                  ref={cardRef}
                  className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  {/* Left Column: Scenario Card Box */}
                  <div className="lg:col-span-5 bg-white rounded-3xl shadow-md p-6 sm:p-8 border border-slate-100 flex flex-col justify-start relative overflow-hidden">
                    <span className="font-black block text-teal-500 mb-4 text-xs uppercase tracking-widest">
                      Scenario Background
                    </span>
                    <div
                      className="w-full h-40 rounded-2xl mb-6 flex flex-col items-center justify-center text-6xl select-none overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${currentChallenge.color}15 0%, ${currentChallenge.color}35 100%)`,
                        border: `2.5px dashed ${currentChallenge.color}45`,
                      }}
                    >
                      {currentChallenge.id === 1 ? (
                        <img src={challenge1Img} alt="Challenge 1" className="w-full h-full object-cover" />
                      ) : currentChallenge.id === 2 ? (
                        <img src={challenge2Img} alt="Challenge 2" className="w-full h-full object-cover" />
                      ) : (
                        <span>{currentChallenge.emoji}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">
                      {currentChallenge.title}
                    </h3>
                    <p className="leading-relaxed font-bold text-slate-700 text-base md:text-lg">
                      {currentChallenge.scenario}
                    </p>
                  </div>

                  {/* Right Column: Question Card Box */}
                  <div ref={rightBoxRef} className="lg:col-span-7 owl-card w-full p-6 sm:p-8 flex flex-col justify-between">
                    {/* Challenge Header context */}
                    <div
                      className="flex items-center gap-3 mb-6 p-3.5 rounded-2xl"
                      style={{ background: `${currentChallenge.color}20` }}
                    >
                      <span className="text-3xl">{currentChallenge.emoji}</span>
                      <div>
                        <div className="font-bold text-gray-800 text-base">{currentChallenge.title}</div>
                        <div className="text-xs text-gray-500">{currentChallenge.theme}</div>
                      </div>
                      <div className="ml-auto text-xs text-teal-650 font-black px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100">
                        {getQuestionLabel(challengeQuestions[activeQuestionIndex], activeQuestionIndex)}
                      </div>
                    </div>

                    {/* Active Question Content */}
                    <div className="min-h-[220px] flex flex-col justify-center">
                      {renderActiveQuestion()}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 mt-8 pt-4 border-t border-gray-100">
                      {/* Back button */}
                      {activeQuestionIndex > 0 ? (
                        <button
                          onClick={() => handleQuestionClick(activeQuestionIndex - 1)}
                          className="text-sm text-gray-600 hover:text-gray-800 font-black transition-colors px-4 py-2 hover:bg-gray-100 rounded-xl cursor-pointer"
                        >
                          ← Back
                        </button>
                      ) : currentChallengeIndex > 0 ? (
                        <button
                          onClick={goToPrevChallenge}
                          className="text-sm text-gray-600 hover:text-gray-800 font-black transition-colors px-4 py-2 hover:bg-gray-100 rounded-xl cursor-pointer"
                        >
                          ← Previous Challenge
                        </button>
                      ) : null}

                      <div className="flex-1" />

                      {/* Next / Action button */}
                      {activeQuestionIndex < challengeQuestions.length - 1 ? (
                        <button
                          className="btn-yellow-owl text-base py-3 px-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!isQuestionAnswered(challengeQuestions[activeQuestionIndex])}
                          onClick={() => handleQuestionClick(activeQuestionIndex + 1)}
                        >
                          Next Question ➔
                        </button>
                      ) : (
                        // We are on the last question of challengeQuestions.
                        // If it's a twist challenge, but showTwist is false:
                        currentChallenge.twistQuestion && !showTwist ? (
                          <button
                            className="btn-yellow-owl text-base py-3 px-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isQuestionAnswered(challengeQuestions[activeQuestionIndex])}
                            onClick={triggerSurpriseTwist}
                          >
                            Complete Challenge ➔
                          </button>
                        ) : (
                          // We are on the actual last question (either Twist question, or the final question of a non-twist challenge).
                          <button
                            className="btn-yellow-owl text-base py-3 px-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={
                              currentChallenge.twistQuestion
                                ? !showContinueAfterTwist
                                : !isQuestionAnswered(challengeQuestions[activeQuestionIndex])
                            }
                            onClick={openFeedbackPage}
                          >
                            See Challenge Feedback ➔
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Idle popup ── */}
      {showIdlePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative owl-card max-w-sm w-full mx-4 p-8 text-center z-10">
            <div className="flex justify-center mb-3">
              <img src={logo} alt="Yellow Owl Logo" style={{ height: 60, objectFit: 'contain' }} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Are you still there?</h2>
            <p className="text-gray-500 text-sm mb-4">Yellow Owl is waiting...</p>
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-5 text-3xl font-bold text-teal-600">
              {idleCountdown}
            </div>
            <button
              className="btn-yellow-owl w-full text-base py-3.5"
              onClick={handleImHere}
            >
              Yes, I'm here! 🙋
            </button>
          </div>
        </div>
      )}

      {/* ── Surprise Twist Overlay ── */}
      {showSurprise && (
        <div
          ref={surpriseOverlayRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md p-4"
        >
          <div
            ref={surpriseCardRef}
            className="text-center p-8 sm:p-10 rounded-3xl max-w-md w-full bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 text-white shadow-2xl border border-white/20 relative overflow-hidden"
          >
            {/* Background glowing circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="text-7xl mb-6 animate-bounce inline-block">🌀</div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight uppercase">
              Surprise Twist!
            </h2>
            <p className="text-base sm:text-lg font-bold text-purple-100 mb-8 leading-relaxed">
              Wait a minute! We have a surprise twist for you?
            </p>
            <button
              onClick={handleRevealTwist}
              className="w-full py-4 bg-[#FFEA11] text-gray-900 text-lg font-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-none"
            >
              Reveal the Twist ➔
            </button>
          </div>
        </div>
      )}

      {/* Floating Restart Button at bottom right */}
      {!isComplete && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleRestartChallenge}
            className="bg-white/95 hover:bg-red-50 text-red-500 hover:text-red-700 font-black text-xs px-4 py-2.5 rounded-full border-2 border-red-200 shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            🔄 Restart Challenge
          </button>
        </div>
      )}
    </div>
  );
}
