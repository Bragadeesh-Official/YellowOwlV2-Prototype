import { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';
import { MOCK_ENVIRONMENTS, MOCK_ANIMALS } from '@/mock/userData';
import logo from '@/assets/yellowowllogo.png';

const BUBBLES = [
  { size: 120, top: '6%',    left: '3%',   bg: '#2AD5B4' },
  { size: 80,  top: '18%',   right: '6%',  bg: '#FFEA11' },
  { size: 140, bottom: '10%', left: '2%',  bg: '#FFEA11' },
  { size: 90,  bottom: '18%', right: '5%', bg: '#2AD5B4' },
];

export default function ImagePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateProfile, login } = useApp();

  const isSetup = location.pathname.includes('/setup-password');

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const cardRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const envCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animalCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mount animation
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

      // Stagger env cards in
      const cards = envCardRefs.current.filter(Boolean) as HTMLDivElement[];
      if (cards.length) {
        gsap.fromTo(cards,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            stagger: 0.1,
            delay: 0.4,
            ease: 'power2.out',
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const handleEnvSelect = (envId: string, idx: number) => {
    setSelectedEnv(envId);
    setSelectedAnimal(''); // reset animal when env changes
    const card = envCardRefs.current[idx];
    if (card) {
      gsap.to(card, { scale: 1.05, duration: 0.15, ease: 'power2.out' })
        .then(() => gsap.to(card, { scale: 1, duration: 0.15, ease: 'power2.in' }));
    }
  };

  const handleAnimalSelect = (animalId: string, idx: number) => {
    setSelectedAnimal(animalId);
    const card = animalCardRefs.current[idx];
    if (card) {
      gsap.fromTo(card,
        { scale: 0.8 },
        { scale: 1, duration: 0.35, ease: 'back.out(2)' }
      );
    }
  };

  const goToStep2 = () => {
    if (!selectedEnv) return;

    // Slide step 1 out left, step 2 in from right
    const s1 = step1Ref.current;
    const s2 = step2Ref.current;

    if (s1) {
      gsap.to(s1, { x: -60, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => {
        setStep(2);
        if (s2) {
          gsap.fromTo(s2,
            { x: 60, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
          );
        }
        // Stagger animal cards in
        setTimeout(() => {
          const cards = animalCardRefs.current.filter(Boolean) as HTMLDivElement[];
          if (cards.length) {
            gsap.fromTo(cards,
              { y: 30, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.4,
                stagger: 0.08,
                ease: 'power2.out',
              }
            );
          }
        }, 50);
      }});
    } else {
      setStep(2);
    }
  };

  const goToStep1 = () => {
    const s2 = step2Ref.current;
    const s1 = step1Ref.current;

    if (s2) {
      gsap.to(s2, { x: 60, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => {
        setStep(1);
        if (s1) {
          gsap.fromTo(s1,
            { x: -60, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
          );
        }
      }});
    } else {
      setStep(1);
    }
  };

  const handleConfirm = () => {
    if (!selectedEnv || !selectedAnimal) return;
    if (isSetup) {
      updateProfile({ passwordEnv: selectedEnv, passwordAnimal: selectedAnimal });
      navigate('/interests');
    } else {
      // No auth, for now - accept any selected env and animal
      setErrorMsg('');
      updateProfile({ passwordEnv: selectedEnv, passwordAnimal: selectedAnimal });
      login();
      navigate('/dashboard');
    }
  };

  const animals = selectedEnv ? (MOCK_ANIMALS[selectedEnv] ?? []) : [];

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
        className="relative z-10 bg-white rounded-3xl shadow-lg p-8 mx-4 w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Yellow Owl Logo" style={{ height: 80, objectFit: 'contain', marginBottom: 12 }} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isSetup ? 'Choose Your Secret Password Picture! 🔐' : 'Enter Your Secret Password Picture! 🔐'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isSetup ? "Pick your magic animal — you'll need it to login next time!" : 'Tap your secret animal to verify your password!'}
          </p>
          {errorMsg && (
            <p className="mt-3 text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Step 1: Environment Selection */}
        {step === 1 && (
          <div ref={step1Ref}>
            <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">
              Step 1: Pick your world! 🌍
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {MOCK_ENVIRONMENTS.map((env, idx) => (
                <div
                  key={env.id}
                  ref={(el) => { envCardRefs.current[idx] = el; }}
                  className={`choice-card flex flex-col items-center p-4 cursor-pointer rounded-2xl${selectedEnv === env.id ? ' selected' : ''}`}
                  style={{ backgroundColor: env.bg }}
                  onClick={() => handleEnvSelect(env.id, idx)}
                >
                  <span className="text-5xl mb-2 leading-none">{env.emoji}</span>
                  <span className="font-bold text-gray-800 text-sm">{env.label}</span>
                  <span className="text-xs text-gray-600 text-center mt-1">{env.description}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className="btn-primary"
                disabled={!selectedEnv}
                onClick={goToStep2}
              >
                Next: Pick your animal! 🐾
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Animal Selection */}
        {step === 2 && (
          <div ref={step2Ref}>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={goToStep1}
                className="btn-back"
              >
                ← Back
              </button>
              <h2 className="text-lg font-bold text-gray-700">
                Step 2: Pick your magical animal! 🐾
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {animals.map((animal, idx) => (
                <div
                  key={animal.id}
                  ref={(el) => { animalCardRefs.current[idx] = el; }}
                  className={`choice-card flex flex-col items-center p-5 cursor-pointer rounded-2xl bg-white shadow${selectedAnimal === animal.id ? ' selected' : ''}`}
                  onClick={() => handleAnimalSelect(animal.id, idx)}
                >
                  <span className="text-6xl mb-2 leading-none">{animal.emoji}</span>
                  <span className="font-bold text-gray-800 text-sm">{animal.name}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className="btn-primary"
                disabled={!selectedAnimal}
                onClick={handleConfirm}
              >
                Lock it in! 🔒
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
