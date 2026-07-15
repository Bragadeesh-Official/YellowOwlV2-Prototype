import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';
import { JUNIOR_WARMUP, SENIOR_WARMUP } from '@/mock/userData';
import logo from '@/assets/yellowowllogo.png';

const BUBBLES = [
  { size: 100, top: '6%', left: '3%', bg: '#2AD5B4' },
  { size: 70, top: '20%', right: '5%', bg: '#FFEA11' },
  { size: 120, bottom: '8%', left: '2%', bg: '#FFEA11' },
  { size: 85, bottom: '16%', right: '4%', bg: '#2AD5B4' },
];

const juniorImg = '/warmup/Junior_Warmup.png';
const seniorImg = '/warmup/Senior_Warmup.png';

type AnswerState = {
  selectedOption: number | null;
};

export default function WarmupPage() {
  const navigate = useNavigate();
  const { login, profile } = useApp();

  // Dynamically choose track based on student age (Default: Junior)
  const isSenior = profile && profile.age >= 12;
  const warmupTrack = isSenior ? SENIOR_WARMUP : JUNIOR_WARMUP;
  const scenarioImg = isSenior ? seniorImg : juniorImg;
  const questions = warmupTrack.questions;
  const totalQuestions = questions.length;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    Array(totalQuestions).fill(null).map(() => ({ selectedOption: null }))
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const questionPanelRef = useRef<HTMLDivElement>(null);
  const celebrationRef = useRef<HTMLDivElement>(null);
  const celebrationIconRef = useRef<HTMLDivElement>(null);

  // Mount animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardRef.current) {
        gsap.fromTo(cardRef.current,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
          }
        );
      }

      bubblesRef.current.forEach((bubble, i) => {
        if (!bubble) return;
        gsap.to(bubble, {
          y: -18 - i * 5,
          duration: 2.5 + i * 0.4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.3,
        });
      });

      if (questionPanelRef.current) {
        gsap.fromTo(questionPanelRef.current,
          { x: 60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            delay: 0.25,
            ease: 'power2.out',
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // Celebration animation
  useEffect(() => {
    if (showCelebration) {
      if (celebrationRef.current) {
        gsap.fromTo(celebrationRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out',
          }
        );
      }
      if (celebrationIconRef.current) {
        gsap.fromTo(celebrationIconRef.current,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(2)',
            delay: 0.2,
          }
        );
        gsap.to(celebrationIconRef.current, {
          scale: 1.15,
          duration: 0.8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 0.8,
        });
      }
    }
  }, [showCelebration]);

  const currentAnswer = answers[currentQuestion];
  const hasAnswered = currentAnswer?.selectedOption !== null;
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleOptionSelect = (optionIdx: number) => {
    const updated = answers.map((a, i) =>
      i === currentQuestion ? { selectedOption: optionIdx } : a
    );
    setAnswers(updated);
  };

  const handleNext = () => {
    const panel = questionPanelRef.current;

    const doTransition = (onComplete: () => void) => {
      if (panel) {
        gsap.to(panel, {
          x: -60,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            onComplete();
            if (panel) {
              gsap.fromTo(panel,
                { x: 60, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
              );
            }
          },
        });
      } else {
        onComplete();
      }
    };

    if (currentQuestion < totalQuestions - 1) {
      doTransition(() => {
        setCurrentQuestion((q) => q + 1);
      });
    } else {
      doTransition(() => {
        setShowCelebration(true);
      });
    }
  };

  const handleEnter = () => {
    login();
    navigate('/dashboard');
  };

  const handleBack = () => {
    const panel = questionPanelRef.current;

    const doTransition = (onComplete: () => void) => {
      if (panel) {
        gsap.to(panel, {
          x: 60,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            onComplete();
            if (panel) {
              gsap.fromTo(panel,
                { x: -60, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
              );
            }
          },
        });
      } else {
        onComplete();
      }
    };

    if (currentQuestion > 0) {
      doTransition(() => {
        setCurrentQuestion((q) => q - 1);
      });
    } else {
      navigate('/interests');
    }
  };

  const getOptionStyle = (optionIdx: number): React.CSSProperties => {
    const isSelected = optionIdx === currentAnswer.selectedOption;

    if (isSelected) {
      return {
        border: '2.5px solid #FFEA11',
        background: '#FFFDE7',
        cursor: 'pointer',
        transform: 'scale(1.01)',
        transition: 'all 0.2s ease',
      };
    }

    return {
      border: '2px solid #e5e7eb',
      background: '#fff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };
  };

  if (showCelebration) {
    return (
      <div
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
      >
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            ref={(el) => { if (el) bubblesRef.current[i] = el; }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: b.size,
              height: b.size,
              backgroundColor: b.bg,
              opacity: 0.15,
              top: 'top' in b ? b.top : undefined,
              bottom: 'bottom' in b ? b.bottom : undefined,
              left: 'left' in b ? b.left : undefined,
              right: 'right' in b ? b.right : undefined,
            }}
          />
        ))}

        <div
          ref={celebrationRef}
          className="relative z-10 bg-white rounded-3xl shadow-lg p-10 mx-4 w-full max-w-xl text-center"
        >
          <div ref={celebrationIconRef} className="text-8xl mb-4 leading-none">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Great Effort!
          </h1>
          <p className="text-gray-500 text-base mb-6">
            You are now ready for your challenges!
          </p>

          <div>
            <button className="btn-primary text-lg px-8" onClick={handleEnter}>
              Go to challenges
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-10"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
    >
      {/* Floating Bubbles */}
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          ref={(el) => { if (el) bubblesRef.current[i] = el; }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.size,
            height: b.size,
            backgroundColor: b.bg,
            opacity: 0.15,
            top: 'top' in b ? b.top : undefined,
            bottom: 'bottom' in b ? b.bottom : undefined,
            left: 'left' in b ? b.left : undefined,
            right: 'right' in b ? b.right : undefined,
          }}
        />
      ))}

      {/* Header above the cards */}
      <div className="relative z-10 flex flex-col items-center mb-8 px-4 text-center">
        <img src={logo} alt="Yellow Owl Logo" style={{ height: 80, objectFit: 'contain', marginBottom: 12 }} />
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Quick Warm-Up!</h1>

      </div>

      {/* Cards Container */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8 px-4 items-start"
      >
        {/* Left Column: Scenario Card Box */}
        <div className="md:col-span-6 bg-white rounded-3xl shadow-lg p-8 border border-slate-100 flex flex-col justify-start">
          <span className="font-black block text-teal-500 mb-4 text-xs uppercase tracking-widest">
            Scenario Background
          </span>
          <img
            src={scenarioImg}
            alt="Scenario Illustration"
            className="w-full rounded-2xl mb-6 object-cover shadow-sm border border-slate-100"
            style={{ maxHeight: '380px' }}
          />
          <p className="leading-relaxed font-bold text-slate-800 text-lg md:text-xl">
            {warmupTrack.scenario}
          </p>
        </div>

        {/* Right Column: Question Card Box */}
        <div className="md:col-span-6 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col border border-slate-100">
          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: '#2AD5B4' }}
            />
          </div>

          <div ref={questionPanelRef} className="p-8 flex flex-col justify-between flex-grow">
            <div>
              {/* Question number badge */}
              <div className="flex justify-center md:justify-start mb-3">
                <span
                  className="text-sm font-bold px-4 py-1.5 rounded-full"
                  style={{ backgroundColor: '#e0fdf6', color: '#2AD5B4' }}
                >
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
              </div>

              {/* Question Title */}
              <div className="mb-4 text-center md:text-left">
                <span className="text-xs font-black uppercase tracking-wider text-teal-500 block">
                  {question.title}
                </span>
              </div>

              {/* Question text */}
              <div className="mb-6 text-center md:text-left">
                <p className="text-lg md:text-xl font-bold text-gray-800">
                  {question.question}
                </p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3 mb-6">
                {question.options.map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className="rounded-2xl px-5 py-3.5 text-sm md:text-base font-semibold text-gray-800 choice-card"
                    style={getOptionStyle(optIdx)}
                    onClick={() => handleOptionSelect(optIdx)}
                  >
                    <span className="mr-2 font-bold" style={{ color: '#2AD5B4' }}>
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    {option.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <button className="btn-back" onClick={handleBack}>
                ← Back
              </button>
              <button
                className="btn-primary"
                disabled={!hasAnswered}
                onClick={handleNext}
              >
                {currentQuestion < totalQuestions - 1 ? 'Next Question ➔' : 'Complete ➔'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
