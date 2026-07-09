import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function SkillsPage() {
  const navigate = useNavigate();
  const { profile, isLoggedIn, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bubblesRef = useRef<HTMLDivElement[]>([]);

  const skillsRef = useRef<HTMLDivElement>(null);

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
      if (skillsRef.current) {
        gsap.fromTo(skillsRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
          }
        );

        // Connect paths & dots inside the skills card
        gsap.fromTo(skillsRef.current.querySelectorAll('.skills-chart-path'),
          { strokeDasharray: 300, strokeDashoffset: 300 },
          {
            strokeDashoffset: 0,
            duration: 1.0,
            delay: 0.5,
            ease: 'power2.out',
            stagger: 0.15,
          }
        );

        gsap.fromTo(skillsRef.current.querySelectorAll('.skills-chart-dot'),
          { scale: 0, transformOrigin: 'center' },
          {
            scale: 1,
            duration: 0.5,
            delay: 1.0,
            ease: 'back.out(1.8)',
            stagger: 0.05,
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

  const currentAvatar = profile.avatar || '🦉';
  const avatarIndex = AVATAR_OPTIONS.indexOf(currentAvatar);
  const displayAvatar = avatarIndex >= 0 ? currentAvatar : '🦉';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

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
            opacity: 0.2,
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
          <div
            id="tour-profile-box"
            className="flex items-center gap-3 bg-[#fffde7] p-3 rounded-2xl mb-6 border border-yellow-250/50 shadow-sm"
          >
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
              Adventure Den
            </button>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left bg-[#FFEA11] text-gray-800 border border-yellow-300/60 shadow-sm cursor-pointer"
            >
              My Super skills
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              My Profile
            </button>

            <button
              onClick={() => navigate('/guardian')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              Guardian View
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4 border-t border-gray-100">
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
                  {displayAvatar}
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-black text-gray-800 truncate">{profile.name}</div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all"
                >
                  Adventure Den
                </button>

                <button
                  onClick={() => setMobileMenuOpen(false)}
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
                    navigate('/guardian');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all"
                >
                  Guardian View
                </button>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-teal-650 hover:bg-teal-50 text-left"
              >
                <span>Guide Tour</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 text-left"
              >
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 animate-fade-in">

        {/* Mobile Header (only visible on mobile) */}
        <div className="flex md:hidden items-center justify-between bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-md mb-6 border border-yellow-100/50">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Yellow Owl Logo" className="h-8 w-auto object-contain" />
            <span className="font-black text-base tracking-wider text-gray-800">Yellow Owl</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-[#FFEA11] border border-white shadow-sm flex items-center justify-center text-sm"
            >
              {displayAvatar}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200/50 hover:bg-teal-100 transition-all cursor-pointer text-xs font-black"
            >
              Menu
            </button>
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-yellow-100/50 pb-3 mt-2">
          <h2 className="text-2xl font-black text-gray-800">My Super Skills ⚡</h2>
          <p className="text-sm font-black text-gray-400">Weekly progress over the last 3 weeks</p>
        </div>

        {/* My Super skills Grid with separate boxes */}
        <div ref={skillsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div
                key={index}
                className="owl-card p-6 bg-white border border-yellow-150/40 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: skill.color }} />
                    <h3 className="text-lg font-black text-gray-800">{skill.title}</h3>
                  </div>
                  <p className="text-xs font-black mb-4" style={{ color: skill.color }}>
                    {skill.description}
                  </p>
                </div>

                <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100/70">
                  <svg viewBox="0 0 300 135" className="w-full h-auto">
                    {/* Level Grid Lines */}
                    <text x="5" y="24" className="text-[11px] font-black fill-gray-400">Super</text>
                    <line x1="55" y1="20" x2="285" y2="20" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                    <text x="5" y="54" className="text-[11px] font-black fill-gray-400">Strong</text>
                    <line x1="55" y1="50" x2="285" y2="50" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                    <text x="5" y="84" className="text-[11px] font-black fill-gray-400">Growing</text>
                    <line x1="55" y1="80" x2="285" y2="80" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                    <text x="5" y="114" className="text-[11px] font-black fill-gray-400">Basic</text>
                    <line x1="55" y1="110" x2="285" y2="110" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Connecting Line */}
                    <path
                      className="skills-chart-path"
                      d={`M 75 ${getY(skill.history[0])} L 175 ${getY(skill.history[1])} L 275 ${getY(skill.history[2])}`}
                      fill="none"
                      stroke={skill.color}
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: `drop-shadow(0 2px 4px ${skill.color}30)` }}
                    />

                    {/* Dots */}
                    <circle cx="75" cy={getY(skill.history[0])} r="6.5" fill="white" stroke={skill.color} strokeWidth="3.5" className="skills-chart-dot" />
                    <circle cx="175" cy={getY(skill.history[1])} r="6.5" fill="white" stroke={skill.color} strokeWidth="3.5" className="skills-chart-dot" />
                    <circle cx="275" cy={getY(skill.history[2])} r="6.5" fill="white" stroke={skill.color} strokeWidth="3.5" className="skills-chart-dot" />

                    {/* X-Axis labels */}
                    <text x="75" y="129" textAnchor="middle" className="text-[11px] font-black fill-gray-500">Wk 1</text>
                    <text x="175" y="129" textAnchor="middle" className="text-[11px] font-black fill-gray-500">Wk 2</text>
                    <text x="275" y="129" textAnchor="middle" className="text-[11px] font-black fill-gray-500">Wk 3</text>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
