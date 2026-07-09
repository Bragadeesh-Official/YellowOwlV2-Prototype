import { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';

// Environment Images
import ForestImg from '@/assets/environments/Forest.png';
import OceanImg from '@/assets/environments/Ocean.png';
import PolarImg from '@/assets/environments/Polar.png';
import SkyImg from '@/assets/environments/Sky.png';

// Animal Images
import ForestBearPass from '@/assets/animals/Forest_BearPass.png';
import ForestDeerPass from '@/assets/animals/Forest_DeerPass.png';
import ForestElephantPass from '@/assets/animals/Forest_ElephantPass.png';
import ForestTigerPass from '@/assets/animals/Forest_TigerPass.png';

import OceanDolphinPass from '@/assets/animals/Ocean_DolphinPass.png';
import OceanFishPass from '@/assets/animals/Ocean_FishPass.png';
import OceanOctopusPass from '@/assets/animals/Ocean_OctopusPass.png';
import OceanSeaTurtlePass from '@/assets/animals/Ocean_SeaTurtlePass.png';

import PolarPenguinPass from '@/assets/animals/Polar_PenguinPass.png';
import PolarSnowBearPass from '@/assets/animals/Polar_SnowBearPass.png';
import PolarWhalePass from '@/assets/animals/Polar_WhalePass.png';
import PolarWolfPass from '@/assets/animals/Polar_WolfPass.png';

import SkyBeePass from '@/assets/animals/Sky_BeePass.png';
import SkyButterflyPass from '@/assets/animals/Sky_ButterflyPass.png';
import SkyEaglePass from '@/assets/animals/Sky_EaglePass.png';
import SkyParrotPass from '@/assets/animals/Sky_ParrotPass.png';

const BUBBLES = [
  { size: 120, top: '6%',    left: '3%',   bg: '#2AD5B4' },
  { size: 80,  top: '18%',   right: '6%',  bg: '#FFEA11' },
  { size: 140, bottom: '10%', left: '2%',  bg: '#FFEA11' },
  { size: 90,  bottom: '18%', right: '5%', bg: '#2AD5B4' },
];

const ENVIRONMENTS = [
  { id: 'polar', label: 'Polar', image: PolarImg, description: 'Cold snowy lands!' },
  { id: 'ocean', label: 'Ocean', image: OceanImg, description: 'Deep blue waters!' },
  { id: 'forest', label: 'Forest', image: ForestImg, description: 'Tall green trees!' },
  { id: 'sky', label: 'Sky', image: SkyImg, description: 'Fluffy clouds!' },
];

const ANIMALS_BY_ENV: Record<string, { id: string; name: string; image: string }[]> = {
  polar: [
    { id: 'penguin', name: 'Penguin', image: PolarPenguinPass },
    { id: 'snowbear', name: 'Polar Bear', image: PolarSnowBearPass },
    { id: 'wolf', name: 'Arctic Wolf', image: PolarWolfPass },
    { id: 'whale', name: 'Whale', image: PolarWhalePass },
  ],
  ocean: [
    { id: 'dolphin', name: 'Dolphin', image: OceanDolphinPass },
    { id: 'turtle', name: 'Sea Turtle', image: OceanSeaTurtlePass },
    { id: 'octopus', name: 'Octopus', image: OceanOctopusPass },
    { id: 'fish', name: 'Tropical Fish', image: OceanFishPass },
  ],
  forest: [
    { id: 'bear', name: 'Bear', image: ForestBearPass },
    { id: 'deer', name: 'Deer', image: ForestDeerPass },
    { id: 'tiger', name: 'Tiger', image: ForestTigerPass },
    { id: 'elephant', name: 'Elephant', image: ForestElephantPass },
  ],
  sky: [
    { id: 'eagle', name: 'Eagle', image: SkyEaglePass },
    { id: 'parrot', name: 'Parrot', image: SkyParrotPass },
    { id: 'butterfly', name: 'Butterfly', image: SkyButterflyPass },
    { id: 'bee', name: 'Bee', image: SkyBeePass },
  ],
};

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
      setErrorMsg('');
      updateProfile({ passwordEnv: selectedEnv, passwordAnimal: selectedAnimal });
      login();
      navigate('/dashboard');
    }
  };

  const animals = selectedEnv ? (ANIMALS_BY_ENV[selectedEnv] ?? []) : [];

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-10"
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

      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-10 bg-white rounded-3xl shadow-lg p-6 mx-4 w-full max-w-3xl overflow-hidden animate-pop-in"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 mb-1 text-center">
            {isSetup ? 'Choose Your Secret Password Picture!' : 'Enter Your Secret Password Picture!'}
          </h1>
          <p className="text-gray-500 font-bold text-xs text-center">
            {isSetup ? "Pick your magic animal — you'll need it to login next time!" : 'Tap your secret animal to verify your password!'}
          </p>
          {errorMsg && (
            <p className="mt-2 text-red-500 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Step 1: Environment Selection */}
        {step === 1 && (
          <div ref={step1Ref}>
            <h2 className="text-base font-bold text-teal-600 mb-4 text-center">
              Step 1: Pick your world!
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {ENVIRONMENTS.map((env, idx) => (
                <div
                  key={env.id}
                  ref={(el) => { envCardRefs.current[idx] = el; }}
                  className="choice-card flex flex-col items-center p-3 cursor-pointer rounded-2xl transition-all"
                  style={{
                    borderWidth: '4px',
                    borderStyle: 'solid',
                    borderColor: selectedEnv === env.id ? '#FFEA11' : '#E2E8F0',
                    backgroundColor: selectedEnv === env.id ? '#FFFDE7' : '#FFFFFF',
                    transform: selectedEnv === env.id ? 'scale(1.02)' : undefined,
                    boxShadow: selectedEnv === env.id ? '0 8px 20px rgba(255, 234, 17, 0.35)' : undefined,
                  }}
                  onClick={() => handleEnvSelect(env.id, idx)}
                >
                  <div className="w-full aspect-[16/10] rounded-xl overflow-hidden mb-2 bg-gray-100 shadow-inner">
                    <img
                      src={env.image}
                      alt={env.label}
                      className="w-full h-full object-cover select-none"
                    />
                  </div>
                  <span className="font-black text-gray-800 text-base">{env.label}</span>
                  <span className="text-[10px] font-black text-gray-400 text-center mt-0.5">{env.description}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className="btn-primary text-sm px-6 py-2.5"
                disabled={!selectedEnv}
                onClick={goToStep2}
              >
                Next: Pick your animal!
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
                className="btn-back text-xs px-2.5 py-1"
              >
                Back
              </button>
              <h2 className="text-base font-bold text-teal-600">
                Step 2: Pick your magical animal!
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {animals.map((animal, idx) => (
                <div
                  key={animal.id}
                  ref={(el) => { animalCardRefs.current[idx] = el; }}
                  className="choice-card flex flex-col items-center p-3 cursor-pointer rounded-2xl transition-all"
                  style={{
                    borderWidth: '4px',
                    borderStyle: 'solid',
                    borderColor: selectedAnimal === animal.id ? '#FFEA11' : '#E2E8F0',
                    backgroundColor: selectedAnimal === animal.id ? '#FFFDE7' : '#FFFFFF',
                    transform: selectedAnimal === animal.id ? 'scale(1.02)' : undefined,
                    boxShadow: selectedAnimal === animal.id ? '0 8px 20px rgba(255, 234, 17, 0.35)' : undefined,
                  }}
                  onClick={() => handleAnimalSelect(animal.id, idx)}
                >
                  <div className="w-full aspect-[16/10] rounded-xl overflow-hidden mb-2 bg-gray-50 flex items-center justify-center p-2 shadow-inner">
                    <img
                      src={animal.image}
                      alt={animal.name}
                      className="max-w-full max-h-full object-contain rounded-lg select-none"
                    />
                  </div>
                  <span className="font-black text-gray-800 text-base text-center">{animal.name}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className="btn-primary text-sm px-6 py-2.5"
                disabled={!selectedAnimal}
                onClick={handleConfirm}
              >
                Lock it in!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
