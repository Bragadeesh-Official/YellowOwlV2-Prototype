import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
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
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowLeft: 0, arrowDirection: 'up' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [noWeeklyChallenge, setNoWeeklyChallenge] = useState(false);

  // Hook up popstate navigation when in development mode to prompt confirm logout
  useEffect(() => {
    if (!isDevelopmentMode) return;

    // Push state to history to enable catching back button clicks
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Prevent actual back navigation by pushing the state back immediately
      window.history.pushState(null, '', window.location.href);
      // Open our custom confirmation modal
      setShowLogoutConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDevelopmentMode]);


  // Defensive profile lookups to prevent crashes
  const interests = profile?.interests || [];
  const name = profile?.name || 'Explorer';
  const avatar = profile?.avatar && profile.avatar !== '🦉' ? profile.avatar : '🦊';
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

  // Auto open mobile menu during navigation steps on small screens
  useEffect(() => {
    if (tourStep >= 2 && window.innerWidth < 768) {
      setMobileMenuOpen(true);
    } else if (tourStep === 0 || tourStep === 1) {
      setMobileMenuOpen(false);
    }
  }, [tourStep]);

  useEffect(() => {
    const updatePosition = () => {
      let el: HTMLElement | null = null;
      if (tourStep === 1) {
        el = document.getElementById('tour-weekly-box');
      } else if (tourStep === 2) {
        el = document.getElementById('tour-skills-nav');
        if (el && el.getBoundingClientRect().width === 0) {
          el = document.getElementById('tour-skills-nav-mobile');
        }
      } else if (tourStep === 3) {
        el = document.getElementById('tour-profile-nav');
        if (el && el.getBoundingClientRect().width === 0) {
          el = document.getElementById('tour-profile-nav-mobile');
        }
      } else if (tourStep === 4) {
        el = document.getElementById('tour-parent-nav');
        if (el && el.getBoundingClientRect().width === 0) {
          el = document.getElementById('tour-parent-nav-mobile');
        }
      }

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

  const handleNoWeeklyChallenge = () => {
    setNoWeeklyChallenge((prev) => !prev);
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

  if (isDevelopmentMode) {
    return (
      <div className="relative h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%)' }}>
        {/* Floating Background Bubbles */}
        {BUBBLES.map((b, i) => (
          <div
            key={i}
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

        {/* Development Box Card */}
        <div className="relative z-10 bg-white/90 backdrop-blur-md border-4 border-[#FFEA11]/30 rounded-[40px] p-12 sm:p-16 shadow-2xl max-w-2xl w-full text-center flex flex-col items-center border-b-8 border-yellow-400/80 animate-pop-in">
          {/* Logo */}
          <div className="bg-[#FFEA11]/20 p-6 rounded-[32px] border-2 border-[#FFEA11]/40 mb-10">
            <img src={logo} alt="Yellow Owl Logo" className="h-36 w-auto object-contain" />
          </div>

          {/* Text */}
          <h1 className="text-3xl sm:text-4xl font-black text-gray-800 leading-normal mb-12 font-display">
            Your dashboard is prepared by Yellow owl team.
          </h1>

          {/* Logout Option */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full sm:w-80 text-center text-base font-black bg-red-50 hover:bg-red-100 text-red-650 py-4 px-8 rounded-2xl border-2 border-red-200/50 transition-all cursor-pointer active:scale-95 shadow-md"
          >
            Log Out
          </button>
        </div>

        {/* Logout Confirmation Dialog Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in animate-duration-200 animate-fill-both">
            <div className="bg-white rounded-[32px] border-4 border-[#FFEA11]/40 p-8 sm:p-10 shadow-2xl max-w-sm w-full text-center flex flex-col items-center border-b-8 border-yellow-400 animate-pop-in">
              <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 mb-6 text-3xl">
                ⚠️
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-3">
                Confirm Log Out
              </h3>
              <p className="text-sm font-semibold text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to log out from the dashboard?
              </p>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/login';
                  }}
                  className="w-full text-center text-sm font-black bg-red-50 hover:bg-red-100 text-red-650 py-3.5 px-6 rounded-2xl border-2 border-red-200/50 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  Yes, Log Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full text-center text-sm font-black bg-slate-50 hover:bg-slate-100 text-gray-650 py-3.5 px-6 rounded-2xl border-2 border-slate-200 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden flex" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%)' }}>
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

      {/* Sidebar (Desktop) */}
      <aside className={`hidden md:flex w-72 shrink-0 flex-col bg-white/95 backdrop-blur-md p-6 border-r border-yellow-100/50 sticky top-0 h-screen justify-between transition-all ${[2, 3, 4].includes(tourStep) ? 'z-[9999]' : 'z-30'}`}>
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

          {/* User profile box */}
          <div
            id="tour-profile-box"
            className="flex items-center gap-3 bg-[#fffde7] p-3 rounded-2xl mb-6 border border-yellow-250/50 shadow-sm"
          >
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-[#FFEA11] border-2 border-white shadow-md flex items-center justify-center text-xl shrink-0 hover:scale-105 transition-transform"
            >
              {avatar}
            </button>
            <div className="min-w-0">
              <div className="text-sm font-black text-gray-800 truncate">{name}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-left bg-[#FFEA11] text-gray-800 border border-yellow-300/60 shadow-sm cursor-pointer transition-opacity ${tourStep > 0 && tourStep !== 1 ? 'opacity-30' : 'opacity-100'}`}
            >
              My Challenges
            </button>

            <button
              id="tour-skills-nav"
              onClick={() => navigate('/skills')}
              className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-600 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer ${tourStep > 0 && tourStep !== 2 ? 'opacity-30' : 'opacity-100'} ${tourStep === 2 ? 'bg-[#FFEA11] text-gray-800 border-2 border-yellow-400 shadow-md scale-105' : ''}`}
            >
              My Super Skills
            </button>

            <button
              id="tour-profile-nav"
              onClick={() => navigate('/profile')}
              className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-600 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer ${tourStep > 0 && tourStep !== 3 ? 'opacity-30' : 'opacity-100'} ${tourStep === 3 ? 'bg-[#FFEA11] text-gray-800 border-2 border-yellow-400 shadow-md scale-105' : ''}`}
            >
              My Profile
            </button>

            <button
              id="tour-parent-nav"
              onClick={() => navigate('/parent')}
              className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-600 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer ${tourStep > 0 && tourStep !== 4 ? 'opacity-30' : 'opacity-100'} ${tourStep === 4 ? 'bg-[#FFEA11] text-gray-800 border-2 border-yellow-400 shadow-md scale-105' : ''}`}
            >
              Parent View
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => setTourStep(1)}
            className="w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-teal-650 hover:bg-teal-50 transition-all cursor-pointer text-left"
          >
            Guide Tour
          </button>

          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 transition-all cursor-pointer text-left"
          >
            Log Out
          </button>
        </div>
      </aside>      {mobileMenuOpen && (
        <div className={`fixed inset-0 flex md:hidden ${tourStep > 1 ? 'z-[9999]' : 'z-50'}`}>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <aside className="relative flex w-72 max-w-xs flex-col bg-white p-6 shadow-xl border-r border-yellow-100/50 justify-between h-full z-10">
            <div>
              {/* Close button */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Yellow Owl Logo" className="h-8 w-auto object-contain" />
                  <span className="font-black text-lg tracking-wider text-gray-800">Yellow Owl</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-600 font-black text-lg p-2"
                >
                  ✕
                </button>
              </div>

              {/* Profile details */}
              <div className="flex items-center gap-3 bg-[#fffde7] p-3 rounded-2xl mb-6 border border-yellow-200/40">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-10 h-10 rounded-full bg-[#FFEA11] border-2 border-white shadow-md flex items-center justify-center text-xl shrink-0"
                >
                  {avatar}
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-black text-gray-800 truncate">{name}</div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-left bg-[#FFEA11] text-gray-800 border border-yellow-300/60 shadow-sm transition-opacity ${tourStep > 0 && tourStep !== 1 ? 'opacity-30' : 'opacity-100'}`}
                >
                  My Challenges
                </button>

                <button
                  id="tour-skills-nav-mobile"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/skills');
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all ${tourStep > 0 && tourStep !== 2 ? 'opacity-30' : 'opacity-100'} ${tourStep === 2 ? 'bg-[#FFEA11] text-gray-800 border-2 border-yellow-400 shadow-md scale-105' : ''}`}
                >
                  My Super Skills
                </button>

                <button
                  id="tour-profile-nav-mobile"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all ${tourStep > 0 && tourStep !== 3 ? 'opacity-30' : 'opacity-100'} ${tourStep === 3 ? 'bg-[#FFEA11] text-gray-800 border-2 border-yellow-400 shadow-md scale-105' : ''}`}
                >
                  My Profile
                </button>

                <button
                  id="tour-parent-nav-mobile"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/parent');
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all ${tourStep > 0 && tourStep !== 4 ? 'opacity-30' : 'opacity-100'} ${tourStep === 4 ? 'bg-[#FFEA11] text-gray-800 border-2 border-yellow-400 shadow-md scale-105' : ''}`}
                >
                  Parent View
                </button>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTourStep(1);
                }}
                className="w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-teal-650 hover:bg-teal-50 text-left"
              >
                Guide Tour
              </button>

              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="w-full flex items-center px-4 py-3 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 text-left"
              >
                Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 overflow-y-auto h-screen">

        {/* Mobile Header (only visible on mobile) */}
        <div className="flex md:hidden items-center justify-between bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-md mb-6 border border-yellow-100/50">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Yellow Owl Logo" className="h-8 w-auto object-contain" />
            <span className="font-black text-base tracking-wider text-gray-800">Yellow Owl</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tour-profile-box-mobile"
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-[#FFEA11] border border-white shadow-sm flex items-center justify-center text-sm"
            >
              {avatar}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200/50 hover:bg-teal-100 transition-all cursor-pointer text-xs font-black"
            >
              Menu
            </button>
          </div>
        </div>

        {/* Welcome & Stats Hero Board */}
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-white"
          ref={heroRef}
          style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">
                Hey, {name}!
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
        <div className="mt-5" ref={assessCardRef}>
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
            {noWeeklyChallenge ? (
              /* ── No Assessment State ── */
              <div className="relative z-10 flex flex-col items-center gap-4 py-4 text-center">

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black mb-1 tracking-tight">No Weekly Assessment</h2>
                  <p className="text-white/80 text-base font-bold">No weekly assessment assigned</p>
                </div>

                <p className="text-white/60 text-sm font-semibold">Check back later for your next challenge!</p>
              </div>
            ) : (
              /* ── Normal Challenge State ── */
              <>
                <div className="relative z-10 text-center mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-[#158a74] text-[#FFEA11] uppercase mb-3">
                    Challenge section
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight font-display">
                    Weekly Challenge
                  </h2>
                </div>

                {/* Unified layout — same size for active, ended, and completed states */}
                <div className="relative z-10 flex flex-col items-center gap-6 mt-6">

                  {/* Ring — active: countdown progress; ended: empty ring with emoji */}
                  <div className="relative w-44 h-44 flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 176 176">
                      <circle
                        cx="88" cy="88" r="72"
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="10" fill="transparent"
                      />
                      <circle
                        cx="88" cy="88" r="72"
                        stroke={isChallengeEnded ? (progress?.completed ? '#FFEA11' : 'rgba(255,255,255,0.3)') : '#FFEA11'}
                        strokeWidth="10" fill="transparent"
                        strokeDasharray="452"
                        strokeDashoffset={isChallengeEnded ? (progress?.completed ? 0 : 452) : 452 - (remainingPercent / 100) * 452}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                      {isChallengeEnded ? (
                        <img src={logo} alt="Yellow Owl" className="w-16 h-16 object-contain" />
                      ) : (
                        <>
                          <span className="text-5xl font-black text-white tracking-tight leading-none">
                            {timeLeftMinutes}
                          </span>
                          <span className="text-xs font-black text-[#FFEA11] uppercase tracking-widest mt-2 opacity-90">
                            min left
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-base font-bold text-white/80 text-center">
                    {isChallengeEnded
                      ? 'Challenge Completed! All challenges done for this week ✨'
                      : 'Complete the weekly challenge before the timer runs out!'}
                  </p>

                  {!isChallengeEnded && (
                    <button
                      type="button"
                      className="group relative text-lg sm:text-xl font-black py-4 px-12 rounded-full transition-all duration-300 w-full md:w-auto text-center"
                      style={{
                        backgroundColor: '#FFEA11',
                        color: '#0f172a',
                        boxShadow: '0 5px 0 #A88800',
                        transform: 'translateY(-2px)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate('/assessment')}
                    >
                      <span className="relative flex items-center justify-center gap-2">
                        {hasProgress ? 'Continue Challenge!' : 'Start Challenge! ➔'}
                      </span>
                    </button>
                  )}

                </div>
              </>
            )}
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="mt-4">
          <div
            className="rounded-3xl p-6 text-white relative overflow-hidden flex flex-col items-center justify-center gap-3"
            style={{
              backgroundColor: '#1FBFA0',
              boxShadow: '0 8px 16px rgba(31, 191, 160, 0.12)',
              opacity: 0.82,
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <img src={logo} alt="Yellow Owl" className="relative z-10 w-20 h-20 object-contain" />
            <p className="relative z-10 text-3xl font-black text-white tracking-tight">Coming Soon</p>
          </div>
        </div>

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

              <button
                onClick={handleNoWeeklyChallenge}
                className={`w-full text-left text-xs font-black px-3.5 py-2.5 rounded-2xl border transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${noWeeklyChallenge
                  ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300/50'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200/50'
                  }`}
              >
                {noWeeklyChallenge ? '📅 Show Weekly Challenge' : '📅 No Weekly Challenge'}
              </button>

              <button
                onClick={() => setIsDevelopmentMode(true)}
                className="w-full text-left text-xs font-black bg-amber-50 hover:bg-amber-100 text-amber-800 px-3.5 py-2.5 rounded-2xl border border-amber-250/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                🛠️ On-Development
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
                  <span className="text-2xl animate-bounce">⚡</span>
                ) : tourStep === 3 ? (
                  <span className="text-2xl animate-bounce">👤</span>
                ) : (
                  <span className="text-2xl animate-bounce">🔒</span>
                )}
                <h3 className="font-black text-gray-800 text-sm">
                  {tourStep === 1
                    ? 'Weekly Challenge'
                    : tourStep === 2
                      ? 'My Super skillss'
                      : tourStep === 3
                        ? 'My Profile'
                        : 'Parent View'}
                </h3>
              </div>

              <p className="text-xs font-black text-gray-600 leading-relaxed mb-4">
                {tourStep === 1
                  ? "This is the Weekly Assessment box! Solve your weekly challenges here to unlock your potential and earn stars."
                  : tourStep === 2
                    ? "Track your growth across various abilities here! Click this link to see your dynamic progress graphs."
                    : tourStep === 3
                      ? "Customize your name, select your avatar, and manage your learning interests to tailor the challenges."
                      : "A secure, parents-only view displaying in-depth analytical growth patterns and specific next steps for you."}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase">
                  Step {tourStep} of 4
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
                      if (tourStep < 4) {
                        setTourStep(tourStep + 1);
                      } else {
                        localStorage.setItem('yellowowl_den_tour_completed', 'true');
                        setTourStep(0);
                      }
                    }}
                    className="bg-[#FFEA11] hover:bg-[#F3E000] text-gray-800 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {tourStep < 4 ? 'Next ➔' : 'Got it!'}
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
