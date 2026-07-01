import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';
import { MOCK_INTERESTS } from '@/mock/userData';
import logo from '@/assets/yellowowllogo.png';

const BUBBLES = [
  { size: 100, top: '8%', left: '4%', bg: '#2AD5B4' },
  { size: 70, top: '22%', right: '6%', bg: '#FFEA11' },
  { size: 130, bottom: '8%', left: '3%', bg: '#FFEA11' },
  { size: 85, bottom: '20%', right: '4%', bg: '#2AD5B4' },
];

export default function InterestsPage() {
  const navigate = useNavigate();
  const { updateProfile } = useApp();

  const [selected, setSelected] = useState<string[]>([]);

  const cardRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const interestCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const starBadgeRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

      // Stagger interest cards in
      const cards = interestCardRefs.current.filter(Boolean) as HTMLDivElement[];
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

  const toggleInterest = (id: string, idx: number) => {
    const isNowSelected = !selected.includes(id);

    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

    // Animate the card
    const card = interestCardRefs.current[idx];
    if (card) {
      gsap.to(card, { scale: 1.05, duration: 0.12, ease: 'power2.out' })
        .then(() => gsap.to(card, { scale: 1, duration: 0.15, ease: 'power2.in' }));
    }

    // Pop-in the star badge when selecting
    if (isNowSelected) {
      const badge = starBadgeRefs.current[idx];
      if (badge) {
        badge.style.display = 'flex';
        gsap.fromTo(badge,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
        );
      }
    }
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    updateProfile({ interests: selected });
    navigate('/warmup');
  };

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
        className="relative z-10 bg-white rounded-3xl shadow-lg p-8 mx-4 w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Yellow Owl Logo" style={{ height: 80, objectFit: 'contain', marginBottom: 12 }} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            What Makes You Excited? ⚡
          </h1>
          <p className="text-gray-500 text-sm text-center">
            Pick everything you love! You can choose more than one! 💪
          </p>
        </div>

        {/* Counter */}
        <div className="text-center mb-5">
          <span
            className="text-sm font-bold px-4 py-1.5 rounded-full"
            style={{ backgroundColor: selected.length > 0 ? '#e0fdf6' : '#f3f4f6', color: selected.length > 0 ? '#2AD5B4' : '#9ca3af' }}
          >
            {selected.length === 0
              ? 'Nothing selected yet!'
              : `You selected ${selected.length} thing${selected.length > 1 ? 's' : ''}!`}
          </span>
        </div>

        {/* Interest Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {MOCK_INTERESTS.map((interest, idx) => {
            const isSelected = selected.includes(interest.id);
            return (
              <div
                key={interest.id}
                ref={(el) => { interestCardRefs.current[idx] = el; }}
                className={`choice-card relative flex flex-col items-center p-6 cursor-pointer rounded-2xl bg-white shadow${isSelected ? ' selected' : ''}`}
                onClick={() => toggleInterest(interest.id, idx)}
              >
                {/* Star badge */}
                <span
                  ref={(el) => { starBadgeRefs.current[idx] = el; }}
                  className="absolute top-2 right-2 text-lg leading-none"
                  style={{ display: isSelected ? 'flex' : 'none' }}
                >
                  ⭐
                </span>

                <span className="text-6xl mb-3 leading-none">{interest.emoji}</span>
                <span className="text-xl font-bold text-gray-800">{interest.label}</span>
                <span className="text-sm text-gray-500 mt-1 text-center">{interest.description}</span>
              </div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center">
          <button
            className="btn-primary"
            disabled={selected.length === 0}
            onClick={handleConfirm}
          >
            Next Up! →
          </button>
        </div>
      </div>
    </div>
  );
}
