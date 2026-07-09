import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
import logo from '@/assets/yellowowllogo.png';
import { HelpCircle, LogOut } from 'lucide-react';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, isLoggedIn, assessmentProgress, saveAssessmentProgress, logout } = useApp();

  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const assessCardRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const tourCardRef = useRef<HTMLDivElement>(null);

  const [tourStep, setTourStep] = useState(0);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowLeft: 0, arrowDirection: 'up' });

  // Defensive profile lookups to prevent crashes
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

  // ── Onboarding Tour Effects ──
  useEffect(() => {
    const isCompleted = localStorage.getItem('yellowowl_den_tour_completed');
    const isNewlyRegistered = localStorage.getItem('yellowowl_newly_registered') === 'true';
    if (!isCompleted && isLoggedIn && isNewlyRegistered) {
      const timer = setTimeout(() => {
        setTourStep(1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const updatePosition = () => {
      if (tourStep === 1) {
        const el = document.getElementById('tour-weekly-box');
        if (el) {
          const rect = el.getBoundingClientRect();
          const tooltipWidth = Math.min(320, window.innerWidth - 32);
          let targetLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          targetLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, targetLeft));
          setTooltipPos({
            top: rect.bottom + window.scrollY + 16,
            left: targetLeft,
            arrowLeft: (rect.left + rect.width / 2) - targetLeft,
            arrowDirection: 'up',
          });
        }
      } else if (tourStep === 2) {
        const el = document.getElementById('tour-profile-box');
        if (el) {
          const rect = el.getBoundingClientRect();
          const tooltipWidth = Math.min(300, window.innerWidth - 32);
          let targetLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          targetLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, targetLeft));
          setTooltipPos({
            top: rect.bottom + window.scrollY + 16,
            left: targetLeft,
            arrowLeft: (rect.left + rect.width / 2) - targetLeft,
            arrowDirection: 'up',
          });
        }
      } else if (tourStep === 3) {
        const el = document.getElementById('tour-skills-box');
        if (el) {
          const rect = el.getBoundingClientRect();
          const tooltipWidth = Math.min(320, window.innerWidth - 32);
          let targetLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          targetLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, targetLeft));
          const tooltipHeight = tourCardRef.current ? tourCardRef.current.offsetHeight : 160;
          setTooltipPos({
            top: rect.top + window.scrollY - tooltipHeight - 16,
            left: targetLeft,
            arrowLeft: (rect.left + rect.width / 2) - targetLeft,
            arrowDirection: 'down',
          });
        }
      }
    };

    updatePosition();
    const t = setTimeout(updatePosition, 50);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [tourStep]);

  useEffect(() => {
    if (tourStep > 0 && tourCardRef.current) {
      gsap.fromTo(tourCardRef.current,
        { scale: 0.8, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.5)' }
      );
    }
  }, [tourStep]);

  if (!profile) return null;

  const progress = assessmentProgress as {
    completed?: boolean;
    completedChallengesCount?: number;
    timeLeft?: number;
  } | null;

  const completedCount = progress?.completed
    ? 5
    : (progress?.completedChallengesCount || 0);

  const hasProgress = !!progress && completedCount > 0 && !progress.completed;

  const timeLeftSeconds = typeof progress?.timeLeft === 'number' ? progress.timeLeft : 900;
  const timeLeftMinutes = Math.ceil(timeLeftSeconds / 60);
  const remainingPercent = Math.max(0, Math.min(100, (timeLeftSeconds / 900) * 100));
  const isChallengeEnded = !!progress?.completed || timeLeftSeconds <= 0;

  const handleResetChallenge = () => {
    localStorage.removeItem('yellowowl_assessment_progress');
    saveAssessmentProgress({
      completed: false,
      currentChallengeIndex: 0,
      completedChallengesCount: 0,
      answers: {},
      timeLeft: 900,
      date: new Date().toISOString(),
    });
    setShowSettingsDialog(false);
  };

  const handleResetTime = () => {
    saveAssessmentProgress({
      timeLeft: 900,
    });
    setShowSettingsDialog(false);
  };

  const handleCompleteChallenge = () => {
    saveAssessmentProgress({
      completed: true,
      completedChallengesCount: 3,
      timeLeft: 0,
    });
    setShowSettingsDialog(false);
  };

  const handleCompleteTime = () => {
    saveAssessmentProgress({
      completed: false,
      timeLeft: 0,
    });
    setShowSettingsDialog(false);
  };

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTourStep(1)}
              className="w-10 h-10 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-200/50 transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-105 active:scale-95"
              title="Guide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-500 border border-red-200/50 transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-105 active:scale-95"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            {/* Playful Explorer Stats Badge */}
            <div
              id="tour-profile-box"
              className="flex items-center gap-3 bg-[#fffde7] px-4 py-1.5 rounded-2xl shadow-sm"
              style={{
                position: 'relative',
                zIndex: tourStep === 2 ? 9999 : undefined,
              }}
            >
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
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

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

        {/* Weekly Adventure Challenge Card */}
        <div className="mt-10" ref={assessCardRef}>
          <div
            id="tour-weekly-box"
            className="rounded-3xl p-8 text-white relative overflow-hidden transition-all duration-300 hover:shadow-lg"
            style={{
              backgroundColor: '#1FBFA0',
              boxShadow: '0 12px 24px rgba(31, 191, 160, 0.15)',
              position: 'relative',
              zIndex: tourStep === 1 ? 9999 : undefined,
            }}
          >
            <div className="relative z-10 text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-[#158a74] text-[#FFEA11] uppercase mb-3">
                Challenge section
              </span>
              <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight font-display">
                Weekly Challenge
              </h2>
              {isChallengeEnded ? (
                <div className="flex flex-row items-center gap-6 py-6 w-full max-w-md mx-auto">
                  {/* Big static logo on the left */}
                  <img src={logo} alt="Yellow Owl Logo" className="h-32 w-auto object-contain flex-shrink-0" />

                  {/* Dialog Speech Bubble on the right */}
                  <div className="relative bg-white p-6 rounded-3xl shadow-md border-4 border-[#FFEA11] flex-1">
                    {/* Arrow pointing left */}
                    <div
                      className="absolute"
                      style={{
                        left: -12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '10px solid transparent',
                        borderBottom: '10px solid transparent',
                        borderRight: '12px solid white',
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        left: -16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '10px solid transparent',
                        borderBottom: '10px solid transparent',
                        borderRight: '12px solid #FFEA11',
                        zIndex: -1,
                      }}
                    />
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-black text-[#1FBFA0] mb-1">
                        {progress?.completed ? 'Woohoo! 🎉' : 'Weekly limit is over! '}
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-gray-700 leading-snug">
                        {progress?.completed
                          ? 'All challenges completed for this week! ✨'
                          : 'Weekly limit is over, challenge completed!'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Side-by-Side Timer and Play Button layout */}
            {!isChallengeEnded && (
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 mt-6">

                {/* Left Side: Time Remaining Display */}
                <div className="flex items-center gap-6">
                  {/* Circular Timer Progress ring */}
                  <div className="relative w-28 h-28 flex items-center justify-center rounded-full p-2 flex-shrink-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    {/* SVG Circular Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      {/* Track Circle */}
                      <circle
                        cx="56"
                        cy="56"
                        r="44"
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* Glowing Progress Circle */}
                      <circle
                        cx="56"
                        cy="56"
                        r="44"
                        stroke="#FFEA11"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="276"
                        strokeDashoffset={276 - (remainingPercent / 100) * 276}
                        strokeLinecap="round"
                        style={{
                          transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </svg>

                    {/* Centered Text */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black text-white tracking-tight leading-none">
                        {timeLeftMinutes}
                      </span>
                      <span className="text-[8px] font-black text-[#FFEA11] uppercase tracking-widest mt-1 opacity-90">
                        min left
                      </span>
                    </div>
                  </div>

                  {/* Text next to the timer */}
                  <div className="text-left">
                    <p className="text-xl sm:text-2xl font-black text-white tracking-tight">Time Remaining </p>
                    <p className="text-xs sm:text-sm font-bold text-white/90 mt-1 max-w-xs leading-relaxed">
                      Complete the weekly challenge before the timer runs out!
                    </p>
                  </div>
                </div>

                {/* Right Side: Play Button */}
                <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end">
                  <button
                    type="button"
                    className="group relative text-lg sm:text-xl font-black py-4 px-12 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 w-full md:w-auto text-center"
                    style={{
                      backgroundColor: '#FFEA11',
                      color: '#0f172a',
                      boxShadow: '0 5px 0 #A88800',
                      transform: 'translateY(-2px)',
                      border: 'none',
                    }}
                    onClick={() => navigate('/assessment')}
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      {hasProgress ? 'Continue Challenge!' : 'Start Challenge! ➔'}
                    </span>
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Super Skills Card */}
        <div
          id="tour-skills-box"
          className="owl-card mt-10 p-6 bg-white"
          style={{ position: 'relative', zIndex: tourStep === 3 ? 9999 : undefined }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h2 className="text-xl font-black text-gray-800">Your Super Skills</h2>
            <p className="text-xs font-bold text-gray-500">Weekly progress over the last 3 weeks</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: "Digging in",
                description: "Can spot what's relevant from what isn't",
                color: "#8B5CF6",
                history: [1, 2, 3],
              },
              {
                title: "My ideas",
                description: "Can come up with a few ideas",
                color: "#0D9488",
                history: [2, 2, 4],
              },
              {
                title: "Looking closer",
                description: "Can describe pros and cons of an option",
                color: "#1E3A8A",
                history: [1, 3, 3],
              },
              {
                title: "Best choice",
                description: "Can give a reason for a choice",
                color: "#F97316",
                history: [3, 4, 4],
              },
            ].map((skill, index) => {
              const getY = (level: number) => {
                if (level === 4) return 20;
                if (level === 3) return 50;
                if (level === 2) return 80;
                return 110;
              };

              return (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: skill.color }} />
                    <h3 className="text-sm font-bold text-gray-800">{skill.title}</h3>
                  </div>
                  <p className="text-[10px] font-extrabold mb-2" style={{ color: skill.color }}>
                    {skill.description}
                  </p>

                  <div className="bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                    <svg viewBox="0 0 300 135" className="w-full h-auto">
                      {/* Level Grid Lines */}
                      <text x="5" y="23" className="text-[9px] font-black fill-gray-400">Super</text>
                      <line x1="55" y1="20" x2="285" y2="20" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                      <text x="5" y="53" className="text-[9px] font-black fill-gray-400">Strong</text>
                      <line x1="55" y1="50" x2="285" y2="50" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                      <text x="5" y="83" className="text-[9px] font-black fill-gray-400">Growing</text>
                      <line x1="55" y1="80" x2="285" y2="80" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                      <text x="5" y="113" className="text-[9px] font-black fill-gray-400">Basic</text>
                      <line x1="55" y1="110" x2="285" y2="110" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                      {/* Connecting Line */}
                      <path
                        d={`M 75 ${getY(skill.history[0])} L 175 ${getY(skill.history[1])} L 275 ${getY(skill.history[2])}`}
                        fill="none"
                        stroke={skill.color}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: `drop-shadow(0 2px 4px ${skill.color}30)` }}
                      />

                      {/* Dots */}
                      <circle cx="75" cy={getY(skill.history[0])} r="5" fill="white" stroke={skill.color} strokeWidth="3" />
                      <circle cx="175" cy={getY(skill.history[1])} r="5" fill="white" stroke={skill.color} strokeWidth="3" />
                      <circle cx="275" cy={getY(skill.history[2])} r="5" fill="white" stroke={skill.color} strokeWidth="3" />

                      {/* X-Axis labels */}
                      <text x="75" y="128" textAnchor="middle" className="text-[9px] font-black fill-gray-500">Wk 1</text>
                      <text x="175" y="128" textAnchor="middle" className="text-[9px] font-black fill-gray-500">Wk 2</text>
                      <text x="275" y="128" textAnchor="middle" className="text-[9px] font-black fill-gray-500">Wk 3</text>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats Grid */}


      </div>

      {/* Floating Simulation Settings Menu at bottom right */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
        {showSettingsDialog && (
          <div className="bg-white/95 backdrop-blur-md border-2 border-teal-100 rounded-3xl p-4 shadow-2xl w-64 mb-3 border-b-4 border-teal-200 animate-pop-in">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <span className="text-xs font-black text-teal-600 uppercase tracking-widest">Simulator 🛠️</span>
              <button
                onClick={() => setShowSettingsDialog(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleResetChallenge}
                className="w-full text-left text-xs font-black bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2.5 rounded-2xl border border-red-200/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                🔄 Reset Challenge
              </button>

              <button
                onClick={handleResetTime}
                className="w-full text-left text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2.5 rounded-2xl border border-blue-200/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                ⏱️ Reset Time (15m)
              </button>

              <button
                onClick={handleCompleteChallenge}
                className="w-full text-left text-xs font-black bg-green-50 hover:bg-green-100 text-green-600 px-3.5 py-2.5 rounded-2xl border border-green-200/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                🎉 Complete Challenge
              </button>

              <button
                onClick={handleCompleteTime}
                className="w-full text-left text-xs font-black bg-orange-50 hover:bg-orange-100 text-orange-600 px-3.5 py-2.5 rounded-2xl border border-orange-200/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                ⏰ Complete Time (0m)
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowSettingsDialog(!showSettingsDialog)}
          className="bg-white/95 hover:bg-teal-50 text-teal-600 hover:text-teal-700 font-black text-sm p-3.5 rounded-full border-2 border-teal-150 shadow-lg transition-all flex items-center justify-center active:scale-95 cursor-pointer"
          title="Simulation Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Onboarding Tour Overlay */}
      {tourStep > 0 && (
        <>
          {/* Dark Backdrop Mask */}
          <div
            className="fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-300 pointer-events-auto"
            onClick={() => {
              localStorage.setItem('yellowowl_den_tour_completed', 'true');
              setTourStep(0);
            }}
          />

          {/* Floating Tooltip Card */}
          <div
            ref={tourCardRef}
            className="absolute z-[9999] bg-white border-4 border-[#FFEA11] rounded-3xl p-5 shadow-2xl transition-all duration-300 max-w-[320px] w-full"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
            }}
          >
            {/* Arrow indicator */}
            <div
              className="absolute w-4 h-4 bg-white rotate-45"
              style={
                tooltipPos.arrowDirection === 'up'
                  ? {
                    top: -10,
                    left: tooltipPos.arrowLeft - 8,
                    borderTop: '4px solid #FFEA11',
                    borderLeft: '4px solid #FFEA11',
                  }
                  : {
                    bottom: -10,
                    left: tooltipPos.arrowLeft - 8,
                    borderBottom: '4px solid #FFEA11',
                    borderRight: '4px solid #FFEA11',
                  }
              }
            />

            {/* Tooltip Content */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {tourStep === 1 ? (
                  <span className="text-2xl animate-bounce">🗺️</span>
                ) : tourStep === 2 ? (
                  <img src={logo} alt="Logo" className="w-8 h-8 object-contain animate-bounce" />
                ) : (
                  <span className="text-2xl animate-bounce">📊</span>
                )}
                <h3 className="font-black text-gray-800 text-sm">
                  {tourStep === 1 ? 'Weekly Box' : tourStep === 2 ? 'Explorer Profile' : 'Your Super Skills'}
                </h3>
              </div>

              <p className="text-xs font-black text-gray-600 leading-relaxed mb-4">
                {tourStep === 1
                  ? "This is the Weekly Box where your weekly challenge is displayed! Solve it before time runs out!"
                  : tourStep === 2
                    ? 'This shows your name and level! Click on your avatar here to view your profile, edit your interests, and track your progress!'
                    : 'These charts show how your thinking skills grow each week — like Digging In, My Ideas, and Best Choice. Keep practicing to level them up!'}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase">
                  Step {tourStep} of 3
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      localStorage.setItem('yellowowl_den_tour_completed', 'true');
                      setTourStep(0);
                    }}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      if (tourStep === 1) {
                        setTourStep(2);
                      } else if (tourStep === 2) {
                        setTourStep(3);
                      } else {
                        localStorage.setItem('yellowowl_den_tour_completed', 'true');
                        setTourStep(0);
                      }
                    }}
                    className="bg-[#FFEA11] hover:bg-[#F3E000] text-gray-800 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {tourStep < 3 ? 'Next ➔' : 'Got it!'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
