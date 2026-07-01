import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
import { SKILL_DESCRIPTIONS } from '@/mock/assessmentData';
import logo from '@/assets/yellowowllogo.png';

const BUBBLES = [
  { size: 150, top: '5%', left: '5%', bg: '#2AD5B4' },
  { size: 100, top: '15%', left: '80%', bg: '#FFEA11' },
  { size: 125, top: '28%', left: '42%', bg: '#2AD5B4' },
  { size: 180, top: '42%', left: '10%', bg: '#FFEA11' },
  { size: 130, top: '55%', left: '75%', bg: '#FFEA11' },
  { size: 95, top: '68%', left: '32%', bg: '#2AD5B4' },
  { size: 140, top: '80%', left: '60%', bg: '#2AD5B4' },
  { size: 110, top: '92%', left: '15%', bg: '#FFEA11' },
];

type SkillKey = keyof typeof SKILL_DESCRIPTIONS;

const SKILL_KEYS: SkillKey[] = ['listening', 'reading', 'thinking', 'imagination'];

const SKILL_CARD_THEMES: Record<SkillKey, { bg: string; border: string; badgeBg: string; barBg: string }> = {
  listening: { bg: '#F0F3FF', border: '#ADC4FF', badgeBg: '#D6E4FF', barBg: '#5B8CFF' },
  reading: { bg: '#FCFCE5', border: '#FFD700', badgeBg: '#FFFDE7', barBg: '#E6D200' },
  thinking: { bg: '#F8F0FC', border: '#D5A6FA', badgeBg: '#F3E0FD', barBg: '#B35BFF' },
  imagination: { bg: '#FFF4EB', border: '#FFB885', badgeBg: '#FFEADA', barBg: '#FF7F24' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, isLoggedIn, assessmentProgress, saveAssessmentProgress } = useApp();

  const heroRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<HTMLDivElement[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);
  const assessCardRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);

  // Defensive profile lookups to prevent crashes
  const skills = profile?.skills || { listening: 0, reading: 0, thinking: 0, imagination: 0 };
  const interests = profile?.interests || [];
  const name = profile?.name || 'Explorer';
  const avatar = profile?.avatar && profile.avatar !== '🦉' ? profile.avatar : '🦊';
  const level = profile?.level || 1;
  // Redirect if not logged in or profile is missing
  useEffect(() => {
    if (!isLoggedIn || !profile) {
      navigate('/login');
    }
  }, [isLoggedIn, profile, navigate]);

  useEffect(() => {
    if (!profile) return;

    const ctx = gsap.context(() => {
      // Hero slide-down
      if (heroRef.current) {
        gsap.fromTo(heroRef.current,
          { y: -30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
          }
        );
      }

      // Skills section fade-in
      if (skillsRef.current) {
        gsap.fromTo(skillsRef.current,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay: 0.2,
            ease: 'power2.out',
          }
        );
      }

      // Animate skill progress bars
      const bars = barRefs.current.filter(Boolean);
      bars.forEach((bar, i) => {
        const key = SKILL_KEYS[i];
        const value = skills[key] || 0;
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: `${value}%`,
            duration: 0.9,
            delay: 0.35 + i * 0.12,
            ease: 'power2.out',
          }
        );
      });

      // Stats row
      if (statsRef.current) {
        gsap.fromTo(statsRef.current,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay: 0.3,
            ease: 'power2.out',
          }
        );
      }

      // Assessment card slide-up
      if (assessCardRef.current) {
        gsap.fromTo(assessCardRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: 0.4,
            ease: 'power3.out',
          }
        );
      }

      // Floating background bubbles
      bubblesRef.current.forEach((bubble, i) => {
        if (!bubble) return;
        gsap.to(bubble, {
          y: -25 - i * 5,
          duration: 3 + i * 0.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.4,
        });
      });
    });

    return () => ctx.revert();
  }, [profile]);

  if (!profile) return null;

  const progress = assessmentProgress as {
    completed?: boolean;
    completedChallengesCount?: number;
  } | null;

  const completedCount = progress?.completed
    ? 5
    : (progress?.completedChallengesCount || 0);

  const hasProgress = !!progress && completedCount > 0 && !progress.completed;

  // Percentage progress from Quest 1 (0%) to Quest 5 (100%)
  const progressPercent = Math.min(100, Math.max(0, (completedCount / 4) * 100));

  const handleResetProgress = () => {
    if (window.confirm("Are you sure you want to reset your weekly quest progress? This will clear your completed stepping stones.")) {
      localStorage.removeItem('yellowowl_assessment_progress');
      saveAssessmentProgress({
        completed: false,
        currentChallengeIndex: 0,
        completedChallengesCount: 0,
        answers: {},
        timeLeft: 900,
        date: new Date().toISOString(),
      });
    }
  };

  // State for interactive skill bubble
  const [activeSkillBubble, setActiveSkillBubble] = useState<string | null>(null);

  // Interest-based wisdom generator
  const getOwlWisdom = () => {
    const wisdomMap: Record<string, string> = {
      space: "The universe is full of secrets! Let's train our thinking power to build virtual space rockets! 🚀",
      dinos: "Dinosaur explorers need quick listening skills to hear footsteps in the forest! Let's keep exploring! 🦖",
      art: "Your imagination is your superpower! Today is a perfect day to paint a new story in your mind! 🎨",
      music: "Your brain loves rhythms and patterns. Keep listening and learning to unlock cool beats! 🎵",
      nature: "The great outdoors has so many mysteries to solve! Let's sharpen our observation skills today!",
      games: "Every great gamer needs sharp focus! Solve today's puzzles to level up your brain score! 🎮",
      reading: "Every book is an open door to a new world. What amazing story will we discover next? 📚",
      science: "Did you know that owls can turn their heads 270 degrees? Science is full of cool magic! 🦉",
    };

    if (interests && interests.length > 0) {
      // Find a matching interest wisdom
      for (const interestId of interests) {
        if (wisdomMap[interestId]) return wisdomMap[interestId];
      }
    }
    return "Your owl is so proud of you! Let's do today's challenge to earn more shiny stars! 🦉⭐";
  };

  const handleSkillClick = (key: SkillKey) => {
    setActiveSkillBubble(activeSkillBubble === key ? null : key);
    // Bounce animation on the clicked skill card
    const cardEl = document.getElementById(`skill-card-${key}`);
    if (cardEl) {
      gsap.fromTo(cardEl, { y: 0 }, { y: -8, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut' });
    }
  };

  return (
    <div className="relative min-h-screen pb-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%)' }}>
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
            opacity: 0.2,
            top: b.top,
            left: b.left,
            zIndex: 0,
          }}
        />
      ))}
      {/* Top Sticky Navbar - Redesigned to be a premium, playful, floating glassmorphic nav */}
      <nav className="sticky top-4 z-50 px-4 max-w-5xl mx-auto w-full">
        <div 
          className="bg-white/95 backdrop-blur-xl rounded-3xl flex items-center justify-between px-4 sm:px-6 py-2.5 transition-all shadow-lg"
          style={{
            boxShadow: '0 8px 32px rgba(255, 234, 17, 0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="bg-[#FFEA11]/20 p-1.5 rounded-2xl border-2 border-[#FFEA11]/40 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              <img src={logo} alt="Yellow Owl Logo" className="h-10 sm:h-12 w-auto object-contain" />
            </div>
            <span className="font-black text-xl sm:text-2xl tracking-wider text-gray-800 drop-shadow-sm font-display">
              Yellow Owl
            </span>
          </div>

          {/* User Profile Info & Actions */}
          <div className="flex items-center gap-4">
            {/* Playful Explorer Stats Badge */}
            <div className="flex items-center gap-3 bg-[#fffde7] px-4 py-1.5 rounded-2xl shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-gray-800 leading-tight">
                  {name}
                </span>
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none mt-0.5">
                  ⭐ Lvl {level} Explorer
                </span>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-[#FFEA11] border-2 border-white shadow-md flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all cursor-pointer relative overflow-hidden"
              >
                {avatar}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* Welcome & Stats Hero Board */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white"
          ref={heroRef}
          style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">
                Hey, {name}! 🌟
              </h1>
              <p className="text-base sm:text-lg font-extrabold text-gray-600">
                Ready for today's learning adventure? Let's explore!
              </p>
            </div>

            {/* Redesigned Owl Greeting Widget with Speech Bubble */}
            <div className="flex items-center gap-4 max-w-md w-full">
              <div
                className="w-16 h-16 rounded-full bg-[#FFEA11] border-4 border-[#E6D200] flex items-center justify-center p-2 shadow-md shrink-0 animate-bounce"
                style={{ animationDuration: '3s' }}
              >
                <img src={logo} alt="Yellow Owl" className="h-full w-full object-contain" />
              </div>

              <div
                className="relative bg-white p-4 rounded-3xl flex-1 shadow-sm"
                style={{
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                {/* Speech Bubble Arrow */}
                <div
                  className="absolute"
                  style={{
                    left: -10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '8px solid transparent',
                    borderRight: '10px solid white',
                    borderBottom: '8px solid transparent',
                  }}
                />

                <p className="text-xs font-black uppercase text-[#1FBFA0] tracking-wider mb-1">Owl Wisdom</p>
                <p className="text-sm font-extrabold text-gray-700 leading-snug">{getOwlWisdom()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Adventure Quest Map */}
        <div className="mt-10" ref={assessCardRef}>
          <div
            className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2AD5B4 0%, #1FBFA0 100%)',
              boxShadow: '0 12px 28px rgba(42, 213, 180, 0.2)',
            }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-black mb-1">Weekly Adventure Map</h2>
              <p className="text-sm sm:text-base font-extrabold opacity-95">
                Complete all 5 stepping stones to unlock the weekly treasure chest!
              </p>
            </div>

            {/* Wavy Stepping Stones Game Path */}
            <div className="relative w-full py-8 flex flex-col items-center">
              {/* Connector line behind stages */}
              <div
                className="absolute left-10 right-10 hidden sm:block shadow-inner"
                style={{
                  height: 8,
                  backgroundColor: '#10856E',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                  borderRadius: 4,
                }}
              >
                {/* Active progress line indicator */}
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: '#FFEA11',
                    boxShadow: '0 0 10px #FFEA11, 0 0 4px #FFEA11',
                  }}
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap justify-center sm:justify-between items-center gap-4 sm:gap-0 w-full max-w-2xl relative z-10 px-4">
                {Array.from({ length: 5 }, (_, i) => {
                  const isCompleted = i < completedCount;
                  const isCurrent = i === completedCount;
                  const isOdd = i % 2 !== 0;

                  // Alternate vertical translation for game board path
                  const yTranslation = isOdd ? 'sm:-translate-y-4' : 'sm:translate-y-4';
                  const flexClass = isOdd ? 'flex-col-reverse' : 'flex-col';

                  return (
                    <div
                      key={i}
                      className={`flex ${flexClass} items-center transition-all ${yTranslation}`}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl transition-all hover:scale-110 shadow-md relative cursor-default"
                        style={{
                          backgroundColor: isCompleted ? '#FFEA11' : isCurrent ? '#FFFDE7' : '#169E83',
                          border: `4px solid ${isCompleted ? '#E6D200' : isCurrent ? '#FFEA11' : '#0F705D'}`,
                          color: isCompleted ? '#8C7700' : isCurrent ? '#E6D200' : '#A9ECE0',
                          boxShadow: isCurrent ? '0 0 20px #FFF' : '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        {isCompleted ? '⭐' : isCurrent ? '⚡' : '🔒'}

                        {/* Current Quest Pulse Glow */}
                        {isCurrent && (
                          <span className="absolute -inset-1 rounded-full border-2 border-white animate-ping opacity-75 pointer-events-none" />
                        )}
                      </div>
                      <span className={`text-xs font-black bg-black/20 px-2 py-0.5 rounded-full ${isOdd ? 'mb-2' : 'mt-2'}`}>
                        Quest {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Play Button */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                className="btn-primary text-xl font-black py-4 px-12 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
                style={{
                  boxShadow: '0 6px 0 #D4C100, 0 10px 20px rgba(0,0,0,0.15)',
                  transform: 'translateY(-2px)',
                }}
                onClick={() => navigate('/assessment')}
              >
                {hasProgress ? 'Continue Quest! ▶️' : 'Start Quest! ➔'}
              </button>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mt-10" ref={skillsRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-800">Your Super Skills 💪</h2>
            <p className="text-xs font-bold text-gray-500">Tap cards to see skill details!</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SKILL_KEYS.map((key) => {
              const desc = SKILL_DESCRIPTIONS[key];
              const value = skills[key] || 0;
              const theme = SKILL_CARD_THEMES[key];
              const isBubbleActive = activeSkillBubble === key;

              return (
                <div
                  key={key}
                  id={`skill-card-${key}`}
                  className="rounded-3xl p-5 flex flex-col items-center text-center shadow-sm cursor-pointer transition-all hover:shadow-md"
                  style={{
                    backgroundColor: theme.bg,
                    border: `3px solid ${theme.border}`,
                  }}
                  onClick={() => handleSkillClick(key)}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner"
                    style={{ backgroundColor: theme.badgeBg }}
                  >
                    {desc.emoji}
                  </div>
                  <div className="text-base font-extrabold text-gray-800 mb-4">{desc.label}</div>

                  {/* 5-star rating instead of progress bar */}
                  <div className="flex items-center gap-1 mb-2 text-2xl">
                    {[...Array(5)].map((_, starIdx) => {
                      const starCount = Math.round((value / 100) * 5);
                      const isFilled = starIdx < starCount;
                      return (
                        <span
                          key={starIdx}
                          style={{
                            color: isFilled ? '#FFD700' : '#D1D5DB',
                            textShadow: isFilled ? '0 1.5px 3px rgba(0,0,0,0.12)' : 'none',
                          }}
                        >
                          ★
                        </span>
                      );
                    })}
                  </div>

                  {/* Interactive Details Modal/Bubble */}
                  {isBubbleActive && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-xs font-bold text-gray-600 leading-relaxed">
                      🦉 {desc.label === 'Listening' ? 'Train your ears to understand complex audio adventures!' :
                        desc.label === 'Reading' ? 'Master spelling, speed, and comprehension!' :
                          desc.label === 'Thinking' ? 'Build logic and step-by-step problem solving!' :
                            'Create new stories and write beautiful descriptions!'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats Grid */}


      </div>

      {/* Floating Reset Button at bottom right */}
      {completedCount > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleResetProgress}
            className="bg-white/95 hover:bg-red-50 text-red-500 hover:text-red-700 font-black text-xs px-4 py-2.5 rounded-full border-2 border-red-200 shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            🔄 Reset Quest Progress
          </button>
        </div>
      )}
    </div>
  );
}
