import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
import { MOCK_INTERESTS } from '@/mock/userData';
import logo from '@/assets/yellowowllogo.png';

const AVATAR_OPTIONS = ['🦉', '🦊', '🐸', '🐼', '🦋', '🦄', '🐯'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, isLoggedIn, logout, updateProfile } = useApp();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  // Avatar cycling
  const [avatarIndex, setAvatarIndex] = useState(0);

  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const interestsRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const guardianRef = useRef<HTMLDivElement>(null);
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
        guardianRef.current,
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

  const handleSave = () => {
    updateProfile({ dob, email, phone });
    setIsEditing(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
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
    <div
      className="min-h-screen pb-8"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fffbeb 100%)' }}
    >
      {/* Back button & Logo */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="btn-back"
        >
          ← Back to Den
        </button>
        <img src={logo} alt="Yellow Owl Logo" style={{ height: 40, objectFit: 'contain' }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
              className="rounded-full px-3 py-1 text-sm font-bold text-white"
              style={{ backgroundColor: '#2AD5B4' }}
            >
              Level {profile.level} ⭐
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



        {/* Edit Form Card */}
        <div ref={formRef} className="owl-card mt-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Your Info ✏️</h2>
          {!isEditing && (
            <button
              type="button"
              className="text-sm font-bold px-4 py-1 rounded-full"
              style={{
                backgroundColor: '#FFEA11',
                border: 'none',
                cursor: 'pointer',
                color: '#1a1a1a',
              }}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
        </div>

        {savedFlash && (
          <div
            className="mb-4 px-4 py-2 rounded-xl text-sm font-bold text-center"
            style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
          >
            Saved! ✅
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">
              Date of Birth
            </label>
            {isEditing ? (
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-base outline-none"
                style={{
                  border: '2px solid #2AD5B4',
                  fontFamily: 'Andika, system-ui, sans-serif',
                }}
              />
            ) : (
              <p className="text-base text-gray-800 font-semibold">{dob || '—'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl px-3 py-2 text-base outline-none"
                style={{
                  border: '2px solid #2AD5B4',
                  fontFamily: 'Andika, system-ui, sans-serif',
                }}
              />
            ) : (
              <p className="text-base text-gray-800 font-semibold">{email || '—'}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">
              Your phone (optional)
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Phone number"
                className="w-full rounded-xl px-3 py-2 text-base outline-none"
                style={{
                  border: '2px solid #2AD5B4',
                  fontFamily: 'Andika, system-ui, sans-serif',
                }}
              />
            ) : (
              <p className="text-base text-gray-800 font-semibold">{phone || '—'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-5">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={handleSave}
            >
              Save Changes 💾
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                // Reset to current profile values
                setDob(profile.dob ?? '');
                setEmail(profile.email ?? '');
                setPhone(profile.phone ?? '');
              }}
              className="flex-1 rounded-full py-3 font-bold text-gray-600 transition-colors"
              style={{
                border: '2px solid #d1d5db',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'Andika, system-ui, sans-serif',
              }}
            >
              Cancel
            </button>
          </div>
        )}
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

      {/* Super Skills Card */}
      <div ref={skillsRef} className="owl-card mt-4 p-6 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-800">Your Super Skills</h2>
          <p className="text-xs font-bold text-gray-400">Weekly progress over the last 3 weeks</p>
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

      {/* Guardian Section */}
        <div ref={guardianRef} className="mt-4">
        <button
          type="button"
          className="btn-primary w-full text-base font-bold"
          onClick={() => navigate('/guardian')}
        >
          Guardian View 👨‍👩‍👧 →
        </button>
      </div>

        {/* Logout */}
        <div ref={logoutRef} className="mt-4 mb-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-full py-2 px-6 font-bold text-base transition-colors hover:bg-red-50"
          style={{
            border: '2px solid #f87171',
            color: '#f87171',
            background: 'none',
            cursor: 'pointer',
            fontFamily: 'Andika, system-ui, sans-serif',
          }}
        >
          Log Out 👋
        </button>
      </div>
      </div>
    </div>
  );
}
