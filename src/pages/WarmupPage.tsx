import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';
import { MOCK_WARMUP_QUESTIONS } from '@/mock/userData';
import logo from '@/assets/yellowowllogo.png';

const BUBBLES = [
  { size: 100, top: '6%', left: '3%', bg: '#2AD5B4' },
  { size: 70, top: '20%', right: '5%', bg: '#FFEA11' },
  { size: 120, bottom: '8%', left: '2%', bg: '#FFEA11' },
  { size: 85, bottom: '16%', right: '4%', bg: '#2AD5B4' },
];

type AnswerState = {
  selectedOption: number | null;
  isCorrect: boolean;
};

export default function WarmupPage() {
  const navigate = useNavigate();
  const { login } = useApp();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(
    MOCK_WARMUP_QUESTIONS.map(() => ({ selectedOption: null, isCorrect: false }))
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const questionPanelRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);
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
  const hasAnswered = currentAnswer.selectedOption !== null;
  const question = MOCK_WARMUP_QUESTIONS[currentQuestion];
  const totalQuestions = MOCK_WARMUP_QUESTIONS.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleOptionSelect = (optionIdx: number) => {
    if (hasAnswered) return; // already answered this question

    const isCorrect = optionIdx === question.correct;
    const updated = answers.map((a, i) =>
      i === currentQuestion ? { selectedOption: optionIdx, isCorrect } : a
    );
    setAnswers(updated);

    // Slide explanation in
    if (explanationRef.current) {
      gsap.from(explanationRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
      });
    }
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
      // Show celebration
      doTransition(() => {
        setShowCelebration(true);
      });
    }
  };

  const handleEnterDen = () => {
    login();
    navigate('/dashboard');
  };

  const getOptionStyle = (optionIdx: number): React.CSSProperties => {
    if (!hasAnswered) {
      return {
        border: '2px solid #e5e7eb',
        background: '#fff',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      };
    }

    if (optionIdx === currentAnswer.selectedOption) {
      return {
        border: '2px solid #FFEA11',
        background: '#FFFDE7',
        cursor: 'default',
      };
    }

    return {
      border: '2px solid #e5e7eb',
      background: '#fff',
      opacity: 0.6,
      cursor: 'default',
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
            Amazing! You're all warmed up!
          </h1>
          <p className="text-gray-500 text-base mb-6">
            Great job completing the warm-up!
          </p>
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-2xl font-bold mb-8"
            style={{ backgroundColor: '#fffde7', border: '3px solid #FFEA11' }}
          >
            🧠 All {totalQuestions} challenges completed!
          </div>
          <div>
            <button className="btn-primary text-lg px-8" onClick={handleEnterDen}>
              Enter the Den! ➔
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

      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-10 bg-white rounded-3xl shadow-lg mx-4 w-full max-w-xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#2AD5B4' }}
          />
        </div>

        <div className="p-8">
          {/* Title */}
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Yellow Owl Logo" style={{ height: 80, objectFit: 'contain', marginBottom: 12 }} />
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Quick Warm-Up! 🧠</h1>
            <p className="text-gray-500 text-sm text-center">
              Let's get your brain buzzing with {totalQuestions} fun questions!
            </p>
          </div>

          {/* Question panel */}
          <div ref={questionPanelRef}>
            {/* Question number badge */}
            <div className="flex justify-center mb-4">
              <span
                className="text-sm font-bold px-4 py-1.5 rounded-full"
                style={{ backgroundColor: '#e0fdf6', color: '#2AD5B4' }}
              >
                Question {currentQuestion + 1} of {totalQuestions}
              </span>
            </div>

            {/* Question text */}
            <p className="text-lg font-bold text-gray-800 text-center mb-6">
              {question.question}
            </p>

            {/* Options */}
            <div className="flex flex-col gap-3 mb-4">
              {question.options.map((option, optIdx) => (
                <div
                  key={optIdx}
                  className="rounded-2xl px-5 py-3 text-base font-semibold text-gray-800 choice-card"
                  style={getOptionStyle(optIdx)}
                  onClick={() => handleOptionSelect(optIdx)}
                >
                  <span className="mr-2 font-bold" style={{ color: '#2AD5B4' }}>
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  {option}
                </div>
              ))}
            </div>



            {/* Next / Finish button */}
            {hasAnswered && (
              <div className="flex justify-center">
                <button className="btn-primary" onClick={handleNext}>
                  {currentQuestion < totalQuestions - 1
                    ? 'Next Question →'
                    : 'See My Results! 🎉'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
