import { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
import logo from '@/assets/yellowowllogo.png';

const AVATAR_OPTIONS = ['🦉', '🦊', '🐸', '🐼', '🦋', '🦄', '🐯'];

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

const SKILL_DATA = {
  'digging-in': {
    title: "Digging in",
    description: "Can spot what's relevant from what isn't",
    color: "#8B5CF6",
    history: [1, 2, 3],
  },
  'my-ideas': {
    title: "My ideas",
    description: "Can come up with a few ideas",
    color: "#0D9488",
    history: [2, 2, 4],
  },
  'looking-closer': {
    title: "Looking closer",
    description: "Can describe pros and cons of an option",
    color: "#1E3A8A",
    history: [1, 3, 3],
  },
  'best-choice': {
    title: "Best choice",
    description: "Can give a reason for a choice",
    color: "#F97316",
    history: [3, 4, 4],
  },
};

export default function SkillDetailPage() {
  const navigate = useNavigate();
  const { skillId } = useParams();
  const { profile, isLoggedIn, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [weeksCount, setWeeksCount] = useState<number>(() => {
    const saved = localStorage.getItem('weeksCount');
    return saved ? Number(saved) : 3;
  });

  // Keep state sync
  useEffect(() => {
    const checkValue = () => {
      const saved = localStorage.getItem('weeksCount');
      if (saved) setWeeksCount(Number(saved));
    };
    window.addEventListener('storage', checkValue);
    return () => window.removeEventListener('storage', checkValue);
  }, []);

  const handleWeeksChange = (val: number) => {
    setWeeksCount(val);
    localStorage.setItem('weeksCount', String(val));
    // Trigger local update event for sync
    window.dispatchEvent(new Event('storage'));
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // GSAP mounting animations
  useEffect(() => {
    if (!profile) return;
    const ctx = gsap.context(() => {
      if (containerRef.current) {
        gsap.fromTo(containerRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
          }
        );

        // Connect paths & dots
        gsap.fromTo(containerRef.current.querySelectorAll('.skills-chart-path'),
          { strokeDasharray: 10000, strokeDashoffset: 10000 },
          {
            strokeDashoffset: 0,
            duration: 1.2,
            delay: 0.3,
            ease: 'power2.out',
          }
        );

        gsap.fromTo(containerRef.current.querySelectorAll('.skills-chart-dot'),
          { scale: 0, transformOrigin: 'center' },
          {
            scale: 1,
            duration: 0.5,
            delay: 0.8,
            ease: 'back.out(1.8)',
            stagger: 0.03,
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
  }, [profile, skillId, weeksCount]);

  if (!profile) return null;

  const currentAvatar = profile.avatar || '🦉';
  const avatarIndex = AVATAR_OPTIONS.indexOf(currentAvatar);
  const displayAvatar = avatarIndex >= 0 ? currentAvatar : '🦉';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const skill = SKILL_DATA[skillId as keyof typeof SKILL_DATA];
  if (!skill) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-xl font-bold">Skill not found</h3>
        <button onClick={() => navigate('/skills')} className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-xl">
          Back to Skills
        </button>
      </div>
    );
  }

  // Helper to generate history for count weeks
  const generateSkillHistory = (baseHistory: number[], count: number) => {
    const result: number[] = [];
    const startVal = baseHistory[0];
    const endVal = baseHistory[baseHistory.length - 1];

    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 1;
      const interp = startVal + t * (endVal - startVal);
      const noise = Math.sin(i * 1.5) * 0.4;
      const val = Math.max(1, Math.min(4, Math.round(interp + noise)));
      result.push(val);
    }
    return result;
  };

  const getY = (level: number) => {
    if (level === 4) return 30;
    if (level === 3) return 100;
    if (level === 2) return 170;
    return 240;
  };

  // The width stretches according to weeksCount
  const chartWidth = Math.max(600, weeksCount * 48);

  const getX = (i: number) => {
    const startX = 90;
    const endX = chartWidth - 50;
    if (weeksCount <= 1) return startX;
    return startX + (i / (weeksCount - 1)) * (endX - startX);
  };

  const history = generateSkillHistory(skill.history, weeksCount);
  const pathD = history.map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`).join(' ');

  return (
    <div className="relative min-h-screen flex overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fffbeb 100%)' }}>
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
            opacity: 0.15,
            top: b.top,
            left: b.left,
            zIndex: 0,
          }}
        />
      ))}

      {/* Sidebar (Desktop) */}
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

          {/* User profile box */}
          <div className="flex items-center gap-3 bg-[#fffde7] p-3 rounded-2xl mb-6 border border-yellow-250/50 shadow-sm">
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-[#FFEA11] border-2 border-white shadow-md flex items-center justify-center text-xl shrink-0 hover:scale-105 transition-transform"
            >
              {displayAvatar}
            </button>
            <div className="min-w-0">
              <div className="text-sm font-black text-gray-800 truncate">{profile.name}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-600 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              My Challenges
            </button>

            <button
              onClick={() => navigate('/skills')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-655 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              My Super skills
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-655 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              My Profile
            </button>

            <button
              onClick={() => navigate('/parent')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              Parent View
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {/* Week Progress Setting */}
          <div className="px-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              📅 History Period
            </label>
            <div className="relative">
              <select
                value={weeksCount}
                onChange={(e) => handleWeeksChange(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFEA11] appearance-none"
              >
                <option value={3}>Last 3 Weeks</option>
                <option value={15}>Last 15 Weeks</option>
                <option value={30}>Last 30 Weeks</option>
                <option value={50}>Last 50 Weeks</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                ▾
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-teal-650 hover:bg-teal-50 transition-all cursor-pointer text-left"
          >
            <span>Guide Tour</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 transition-all cursor-pointer text-left"
          >
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Sidebar (Mobile Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex w-72 max-w-xs flex-col bg-white p-6 shadow-xl border-r border-yellow-100/50 justify-between h-full z-10">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Yellow Owl Logo" className="h-8 w-auto object-contain" />
                  <span className="font-black text-lg tracking-wider text-gray-800">Yellow Owl</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-600 font-black text-lg p-2">✕</button>
              </div>

              <div className="flex items-center gap-3 bg-[#fffde7] p-3 rounded-2xl mb-6 border border-yellow-200/40">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-10 h-10 rounded-full bg-[#FFEA11] border-2 border-white shadow-md flex items-center justify-center text-xl shrink-0"
                >
                  {displayAvatar}
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-black text-gray-800 truncate">{profile.name}</div>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all"
                >
                  My Challenges
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/skills');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left bg-[#FFEA11] text-gray-800 border border-yellow-300/60 shadow-sm"
                >
                  My Super skills
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all"
                >
                  My Profile
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/parent');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all"
                >
                  Parent View
                </button>
              </nav>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              {/* Week Progress Setting */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  📅 History Period
                </label>
                <div className="relative">
                  <select
                    value={weeksCount}
                    onChange={(e) => handleWeeksChange(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFEA11] appearance-none"
                  >
                    <option value={3}>Last 3 Weeks</option>
                    <option value={15}>Last 15 Weeks</option>
                    <option value={30}>Last 30 Weeks</option>
                    <option value={50}>Last 50 Weeks</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                    ▾
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-teal-655 hover:bg-teal-50 text-left"
              >
                <span>Guide Tour</span>
              </button>

              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 text-left">
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div ref={containerRef} className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-md mb-6 border border-yellow-100/50">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Yellow Owl Logo" className="h-8 w-auto object-contain" />
            <span className="font-black text-base tracking-wider text-gray-800">Yellow Owl</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-[#FFEA11] border border-white shadow-sm flex items-center justify-center text-sm">
              {displayAvatar}
            </button>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200/50 hover:bg-teal-100 text-xs font-black">
              Menu
            </button>
          </div>
        </div>

        {/* Back navigation */}
        <button
          onClick={() => navigate('/skills')}
          className="mb-4 flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-800 transition-all cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-yellow-150/40 shadow-sm"
        >
          ← Back to Super Skills
        </button>

        {/* Detail Header */}
        <div className="bg-white border border-yellow-150/40 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: skill.color }} />
            <div>
              <h2 className="text-2xl font-black text-gray-800">{skill.title}</h2>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: skill.color }}>{skill.description}</p>
            </div>
          </div>

          {/* Current Level Status */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Current Level</span>
              <span className="text-sm font-black text-gray-700">
                {(() => {
                  const lastVal = history[history.length - 1];
                  if (lastVal === 4) return 'Fluent';
                  if (lastVal === 3) return 'Strong';
                  if (lastVal === 2) return 'Growing';
                  return 'Beginning';
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* ── EXPANDING WEEK GRAPH ── */}
        <div className="bg-white border border-yellow-150/40 rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Weekly Performance Chart</h3>
            <span className="text-xs font-black text-gray-400">Scroll horizontally if needed →</span>
          </div>

          {/* Horizontally scrolling container */}
          <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-yellow-200">
            <div style={{ width: chartWidth, transition: 'width 0.3s ease-in-out' }}>
              <svg viewBox={`0 0 ${chartWidth} 300`} className="w-full h-auto">
                <text x="5" y="34" className="text-[11px] font-black fill-gray-400">Fluent</text>
                <line x1="75" y1="30" x2={chartWidth - 20} y2="30" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                <text x="5" y="104" className="text-[11px] font-black fill-gray-400">Strong</text>
                <line x1="75" y1="100" x2={chartWidth - 20} y2="100" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                <text x="5" y="174" className="text-[11px] font-black fill-gray-400">Growing</text>
                <line x1="75" y1="170" x2={chartWidth - 20} y2="170" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                <text x="5" y="244" className="text-[11px] font-black fill-gray-400">Beginning</text>
                <line x1="75" y1="240" x2={chartWidth - 20} y2="240" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                {/* Connecting Line path */}
                <path
                  className="skills-chart-path"
                  d={pathD}
                  fill="none"
                  stroke={skill.color}
                  strokeWidth={weeksCount > 15 ? "2.5" : "4.5"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 2px 4px ${skill.color}30)` }}
                />

                {/* Dots */}
                {history.map((val, idx) => (
                  <circle
                    key={idx}
                    cx={getX(idx)}
                    cy={getY(val)}
                    r={weeksCount > 15 ? "3.5" : weeksCount > 3 ? "5" : "7"}
                    fill="white"
                    stroke={skill.color}
                    strokeWidth={weeksCount > 15 ? "2" : weeksCount > 3 ? "2.5" : "4"}
                    className="skills-chart-dot"
                  />
                ))}

                {/* X-Axis Labels */}
                {history.map((_, idx) => {
                  // Only show key labels to avoid overcrowding
                  const isStart = idx === 0;
                  const isEnd = idx === weeksCount - 1;
                  const isMid = idx === Math.floor(weeksCount / 2);
                  const isInterval = weeksCount <= 15 || idx % 5 === 0;

                  if (isStart || isEnd || isMid || isInterval) {
                    return (
                      <text
                        key={idx}
                        x={getX(idx)}
                        y="275"
                        textAnchor="middle"
                        className="text-[10px] font-black fill-gray-500"
                      >
                        Wk {idx + 1}
                      </text>
                    );
                  }
                  return null;
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Focus & Definition */}
          <div className="space-y-6">

            {/* Meaning details */}
            <div className="bg-white border border-yellow-150/40 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">What this means</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-semibold">
                {(() => {
                  if (skill.title === "Digging in") {
                    return "Digging in means your child can sift through a scenario to separate crucial details from background noise. This is the foundation of critical reading and analytics.";
                  }
                  if (skill.title === "My ideas") {
                    return "My ideas represents brainstorming capacity. Your child can generate creative and diverse possibilities to solve complex problems, establishing key cause-and-effect paths.";
                  }
                  if (skill.title === "Looking closer") {
                    return "Looking closer represents analytical thinking. Your child examines options deeply, comparing pros and cons while recognizing repetitive patterns in problems.";
                  }
                  return "Best choice shows logical reasoning and sound decision making. Your child evaluates alternatives and justifies their choices with logical evidence.";
                })()}
              </p>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
