import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
import { MOCK_INTERESTS } from '@/mock/userData';
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, isLoggedIn, logout, updateProfile } = useApp();
  const bubblesRef = useRef<HTMLDivElement[]>([]);

  // Edit mode state
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Avatar cycling
  const [avatarIndex, setAvatarIndex] = useState(0);

  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const interestsRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const logoutRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Initialise form fields and avatar index from profile
  useEffect(() => {
    if (profile) {
      setDob(profile.dob ?? '');
      setEmail(profile.email ?? '');
      setPhone(profile.phone ?? '');
      const idx = AVATAR_OPTIONS.indexOf(profile.avatar);
      setAvatarIndex(idx >= 0 ? idx : 0);
    }
  }, [profile]);

  // GSAP mount animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = [
        headerRef.current,
        formRef.current,
        interestsRef.current,
        skillsRef.current,
        parentRef.current,
        logoutRef.current,
      ].filter(Boolean) as HTMLElement[];

      gsap.fromTo(sections,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );

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
  }, []);

  if (!profile) return null;

  const currentAvatar = AVATAR_OPTIONS[avatarIndex];

  const handleAvatarClick = () => {
    const next = (avatarIndex + 1) % AVATAR_OPTIONS.length;
    setAvatarIndex(next);
    updateProfile({ avatar: AVATAR_OPTIONS[next] });
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Format join date for display
  const joinedFormatted = profile.joinedDate
    ? new Date(profile.joinedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : '—';

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
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-10 h-10 rounded-full bg-[#FFEA11] border-2 border-white shadow-md flex items-center justify-center text-xl shrink-0 hover:scale-105 transition-transform"
            >
              {currentAvatar}
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
              My Super skillss
            </button>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left bg-[#FFEA11] text-gray-800 border border-yellow-300/60 shadow-sm cursor-pointer"
            >
              My Profile
            </button>

            <button
              onClick={() => navigate('/parent')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-655 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              Parent View
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-10 h-10 rounded-full bg-[#FFEA11] border-2 border-white shadow-md flex items-center justify-center text-xl shrink-0"
                >
                  {currentAvatar}
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
                  My Challenges
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/skills');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all"
                >
                  My Super skillss
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left bg-[#FFEA11] text-gray-800 border border-yellow-300/60 shadow-sm"
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
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">

        {/* Mobile Header (only visible on mobile) */}
        <div className="flex md:hidden items-center justify-between bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-md mb-6 border border-yellow-100/50">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Yellow Owl Logo" className="h-8 w-auto object-contain" />
            <span className="font-black text-base tracking-wider text-gray-800">Yellow Owl</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tour-profile-box-mobile"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-8 h-8 rounded-full bg-[#FFEA11] border border-white shadow-sm flex items-center justify-center text-sm"
            >
              {currentAvatar}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200/50 hover:bg-teal-100 transition-all cursor-pointer text-xs font-black"
            >
              Menu
            </button>
          </div>
        </div>
        {/* Profile Header Card */}
        <div ref={headerRef} className="owl-card mt-2 p-6">
          <div className="flex flex-col items-center">
            {/* Avatar — clicking cycles through emojis */}
            <button
              type="button"
              onClick={handleAvatarClick}
              className="flex items-center justify-center rounded-full mb-4 transition-transform hover:scale-105 active:scale-95"
              style={{
                width: 80,
                height: 80,
                backgroundColor: '#FFEA11',
                border: 'none',
                cursor: 'pointer',
                fontSize: '2.5rem',
              }}
              title="Tap to change avatar"
              aria-label="Change avatar"
            >
              {currentAvatar}
            </button>
            <p className="text-xs text-gray-400 mb-3">Tap to change avatar</p>

            {/* Name — not editable */}
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{profile.name}</h1>
              <span title="Name cannot be changed">🔒</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-sm font-bold text-white"
                style={{ backgroundColor: '#2AD5B4' }}
              >
                Age {profile.age}
              </span>

              <span
                className="rounded-full px-3 py-1 text-sm font-bold text-gray-700"
                style={{ backgroundColor: '#FFEA11' }}
              >
                Joined {joinedFormatted}
              </span>
            </div>
          </div>
        </div>



        {/* Info Card */}
        <div ref={formRef} className="owl-card mt-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Your Info 📝</h2>
          </div>

          <div className="flex flex-col gap-4">
            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">
                Date of Birth
              </label>
              <p className="text-base text-gray-800 font-semibold">
                {dob
                  ? new Date(dob).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">
                Email
              </label>
              <p className="text-base text-gray-800 font-semibold">{email || '—'}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">
                Your phone
              </label>
              <p className="text-base text-gray-800 font-semibold">{phone || '987654321'}</p>
            </div>
          </div>
        </div>

        {/* Interests Section */}
        <div ref={interestsRef} className="owl-card mt-4 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Interests ⚡</h2>
          {profile.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interestId) => {
                const found = MOCK_INTERESTS.find((m) => m.id === interestId);
                if (!found) return null;
                return (
                  <span
                    key={interestId}
                    className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold"
                    style={{ backgroundColor: '#e0fdf6', color: '#065f46', border: '1.5px solid #2AD5B4' }}
                  >
                    {found.emoji} {found.label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No interests added yet.</p>
          )}
        </div>



      </div>
    </div>
  );
}
