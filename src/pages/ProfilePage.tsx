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
