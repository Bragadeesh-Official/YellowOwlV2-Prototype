import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';
import logo from '@/assets/yellowowllogo.png';
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChallengeAnswer {
  mcq: (number | null)[];
  descriptive: string;
  twist: number | null;
  ideas: string[];
}

type AnswersMap = Record<number, ChallengeAnswer>;


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

function isMCQOrTwistChallenge(challenge: Challenge): boolean {
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
  const isAnswered = selectedIndex !== null;
  let borderClass = 'border-2 border-gray-200';
  let bgClass = 'bg-white';

  if (isAnswered) {
    if (isSelected) {
      borderClass = 'border-4 border-[#FFEA11]';
      bgClass = 'bg-[#FFFDE7]';
    } else {
      borderClass = 'border-2 border-gray-100';
      bgClass = 'bg-white opacity-60';
    }
  }

  return (
    <button
      ref={optionRef}
      onClick={() => !isAnswered && onSelect(index)}
      disabled={isAnswered}
      className={`choice-card w-full text-left p-3 ${borderClass} ${bgClass} flex items-center gap-3 transition-all`}
      style={{ cursor: isAnswered ? 'default' : 'pointer' }}
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

  // redirect if not logged in
  useEffect(() => {
    if (profile === null) {
      navigate('/login');
    }
  }, [profile, navigate]);

  // ── State ──
  const [showChallengeIntro, setShowChallengeIntro] = useState(true);
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
  const [, setExplanationVisible] = useState<boolean[]>([]);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const twistBannerRef = useRef<HTMLDivElement>(null);
  const twistCardRef = useRef<HTMLDivElement>(null);
  const explanationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const optionRefs = useRef<(HTMLButtonElement | null)[][]>([]);
  const confettiRef = useRef<HTMLDivElement>(null);

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

  // ── Reset per-challenge UI when challenge changes ──
  useEffect(() => {
    setShowTwist(false);
    setShowContinueAfterTwist(false);
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
    if (isComplete || timeLeft <= 0) return;
    const interval = setInterval(() => {
      if (!timerPausedRef.current) {
        setTimeLeft((prev: number) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete, timeLeft]);

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
    if (currentAnswer.mcq[questionIndex] !== null) return;

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
    if (currentAnswer.twist !== null || !currentChallenge.twistQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentChallenge.id]: { ...prev[currentChallenge.id], twist: optionIndex },
    }));
    setTimeout(() => setShowContinueAfterTwist(true), 400);
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
  const handleLockAndContinue = () => {
    if (isMCQOrTwistChallenge(currentChallenge) && currentChallenge.twistQuestion) {
      // Reveal the twist
      setShowTwist(true);
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
      goToNextChallenge();
    }
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
  const isLockEnabled = (): boolean => {
    if (isMCQOrTwistChallenge(currentChallenge)) {
      const mcqs = getMCQQuestions(currentChallenge);
      const allMcqAnswered = mcqs.every((_, i) => currentAnswer.mcq[i] !== null);
      return allMcqAnswered;
    }
    return true; // ideas challenge — always allow
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

  const handleRestartQuest = () => {
    if (window.confirm("Are you sure you want to restart this weekly assessment quest from the beginning? This will clear your current answers.")) {
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
    }
  };

  // ── Completion screen ──
  if (isComplete) {
    return (
      <div
        ref={confettiRef}
        className="relative min-h-screen gradient-bg flex flex-col items-center justify-center p-4 overflow-hidden"
      >
        <div className="owl-card max-w-lg w-full mx-auto p-8 text-center relative z-10">
          <div className="text-5xl mb-4 pop-in">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Weekly Challenge Complete!</h1>
          <p className="text-xl text-teal-600 font-bold mb-6">You're a superstar! 🌟</p>

          <div className="flex justify-center mb-8">
            <div className="bg-yellow-50 rounded-2xl p-4 w-40 text-center border-2 border-yellow-100">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-2xl font-bold text-yellow-600">5/5</div>
              <div className="text-sm text-gray-500 mt-1">Challenges done</div>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-6">
            You successfully tackled all 5 challenges — that's incredible effort!
          </p>

          <button className="btn-primary w-full text-lg" onClick={() => navigate('/dashboard')}>
            Back to My Den ➔
          </button>
        </div>
      </div>
    );
  }

  // ── Render helpers ──
  const renderMCQSection = () => {
    const mcqs = getMCQQuestions(currentChallenge);
    return (
      <div className="space-y-6">
        {mcqs.map((q: MCQQuestion, qi: number) => (
          <div key={qi} className="space-y-3">
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
        ))}
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
            const isAnswered = currentAnswer.twist !== null;

            let borderClass = 'border-gray-200';
            let bgClass = 'bg-white';

            if (isAnswered) {
              if (isSelected) {
                borderClass = 'border-purple-400';
                bgClass = 'bg-purple-50';
              } else {
                bgClass = 'bg-white opacity-60';
              }
            }

            return (
              <button
                key={oi}
                onClick={() => handleTwistSelect(oi)}
                disabled={isAnswered}
                className={`choice-card w-full text-left p-3 border-2 ${borderClass} ${bgClass} flex items-center gap-3`}
                style={{ cursor: isAnswered ? 'default' : 'pointer' }}
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

  // ── Progress dots ──
  const renderProgressDots = () => (
    <div className="flex items-center justify-center gap-3 mb-6">
      {WEEKLY_ASSESSMENT.map((c, i) => {
        const isCompleted = i < currentChallengeIndex;
        const isCurrent = i === currentChallengeIndex;
        return (
          <div
            key={c.id}
            className={`flex items-center justify-center rounded-full font-black text-sm transition-all duration-300
              ${isCurrent ? 'w-10 h-10 bg-teal-500 text-white shadow-lg scale-110' : ''}
              ${isCompleted ? 'w-9 h-9 bg-teal-600 text-white shadow-md completed-dot-anim' : ''}
              ${!isCurrent && !isCompleted ? 'w-9 h-9 bg-gray-100 text-gray-400' : ''}
            `}
          >
            {i + 1}
          </div>
        );
      })}
    </div>
  );

  const isIdeasChallenge = !isMCQOrTwistChallenge(currentChallenge);
  const isLastChallenge = currentChallengeIndex === WEEKLY_ASSESSMENT.length - 1;

  // Determine what lock button label to show
  const showLockButton = !showTwist;
  const lockLabel = isMCQOrTwistChallenge(currentChallenge) && currentChallenge.twistQuestion
    ? 'Lock Answer & Continue →'
    : isIdeasChallenge
      ? "That's my ideas! Continue →"
      : 'Continue →';

  // After twist is answered show a special Continue
  const showTwistContinue = showTwist && showContinueAfterTwist;

  if (showChallengeIntro && !isComplete) {
    return (
      <div
        className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
      >
        <div className="owl-card max-w-lg w-full mx-auto p-8 relative z-10 text-center animate-pop-in" style={{ borderRadius: 24, boxShadow: '0 8px 32px rgba(255, 234, 17, 0.15)', background: 'white' }}>
          <span className="text-sm font-black text-[#B8A800] bg-[#fffbeb] px-3 py-1 rounded-full uppercase tracking-wider">
            Challenge {currentChallengeIndex + 1} of {WEEKLY_ASSESSMENT.length}
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
          <p className="text-base font-extrabold text-gray-500 mb-6">
            Theme: {currentChallenge.theme}
          </p>

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
              className="btn-primary w-full text-lg py-4 font-black"
              onClick={handleStartChallenge}
            >
              Enter Challenge 🚀
            </button>
            
            <button
              className="font-bold text-sm text-gray-500 hover:text-yellow-600 transition-colors mt-2"
              onClick={handleBackToDen}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Back to Den
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto w-full">
        <button
          onClick={handleBackToDen}
          className="btn-back"
        >
          ← Back to Den
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
          <h1 className="font-bold text-gray-800 text-base">Weekly Challenge 🚀</h1>
        </div>
        <div className={`font-bold text-sm ${timeLeft < 120 ? 'timer-critical' : 'text-gray-700'}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 px-2 pb-8">
        <div className="max-w-2xl mx-auto">
          {renderProgressDots()}

          {/* Challenge card */}
          <div ref={cardRef} className="owl-card p-6">
            {/* Challenge header */}
            <div
              className="flex items-center gap-3 mb-5 p-3 rounded-2xl"
              style={{ background: `${currentChallenge.color}20` }}
            >
              <span className="text-3xl">{currentChallenge.emoji}</span>
              <div>
                <div className="font-bold text-gray-800 text-base">{currentChallenge.title}</div>
                <div className="text-xs text-gray-500">{currentChallenge.theme}</div>
              </div>
              <div className="ml-auto text-xs text-gray-400 font-bold">
                {currentChallengeIndex + 1} / {WEEKLY_ASSESSMENT.length}
              </div>
            </div>

            {/* Challenge content */}
            {isMCQOrTwistChallenge(currentChallenge) ? (
              <>
                {renderMCQSection()}
                {renderDescriptiveSection()}
                {showTwist && currentChallenge.twistQuestion && renderTwistSection(currentChallenge.twistQuestion)}
              </>
            ) : (
              renderIdeasSection()
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-6">
              {currentChallengeIndex > 0 && (
                <button
                  onClick={goToPrevChallenge}
                  className="text-sm text-gray-500 hover:text-gray-700 font-bold transition-colors px-3 py-2"
                >
                  ← Previous
                </button>
              )}
              <div className="flex-1" />

              {showTwistContinue ? (
                <button
                  className="btn-primary"
                  onClick={isLastChallenge ? () => handleComplete(true) : goToNextChallenge}
                >
                  {isLastChallenge ? 'Finish 🎉' : 'Continue to Next Challenge →'}
                </button>
              ) : showLockButton ? (
                <button
                  className="btn-primary"
                  disabled={!isLockEnabled()}
                  onClick={handleLockAndContinue}
                >
                  {lockLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
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
            <button className="btn-primary w-full" onClick={handleImHere}>
              Yes, I'm here! 🙋
            </button>
          </div>
        </div>
      )}

      {/* Floating Restart Button at bottom right */}
      {!isComplete && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleRestartQuest}
            className="bg-white/95 hover:bg-red-50 text-red-500 hover:text-red-700 font-black text-xs px-4 py-2.5 rounded-full border-2 border-red-200 shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            🔄 Restart Challenge
          </button>
        </div>
      )}
    </div>
  );
}
