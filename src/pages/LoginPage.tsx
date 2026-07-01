import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
import { MOCK_INVITE_CODE, PROFILE_KEY, MOCK_CHILD_PROFILE } from '@/mock/userData';
import { ADMIN_CREDENTIALS, ADMIN_SESSION_KEY } from '@/mock/adminData';
import logo from '@/assets/yellowowllogo.png';

// More circles, spread across the full viewport
const BUBBLES = [
  // Corners
  { size: 280, top: '-8%', left: '-5%', bg: '#FFEA11' },
  { size: 200, top: '-4%', right: '-4%', bg: '#2AD5B4' },
  { size: 180, bottom: '-5%', right: '-5%', bg: '#FFEA11' },
  // Mid sides
  { size: 140, top: '38%', left: '-3%', bg: '#FFEA11' },
  { size: 120, top: '42%', right: '-2%', bg: '#2AD5B4' },
  // Interior scatter
  { size: 100, top: '15%', left: '28%', bg: '#FFEA11' },
  { size: 80, top: '22%', right: '28%', bg: '#2AD5B4' },
  { size: 90, top: '60%', left: '18%', bg: '#2AD5B4' },
  { size: 110, top: '65%', right: '18%', bg: '#FFEA11' },
  { size: 70, top: '78%', left: '45%', bg: '#FFEA11' },
  { size: 60, top: '10%', left: '55%', bg: '#2AD5B4' },
  { size: 75, bottom: '20%', right: '35%', bg: '#FFEA11' },
  { size: 55, top: '50%', left: '50%', bg: '#2AD5B4' },
];

type LoginMode = 'choose' | 'child' | 'admin';

export default function LoginPage() {
  const navigate = useNavigate();
  const { register } = useApp();

  const [mode, setMode] = useState<LoginMode>('choose');

  // Child login state
  const [inviteCode, setInviteCode] = useState('');
  const [childError, setChildError] = useState(false);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const owlRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardRef.current) {
        gsap.fromTo(cardRef.current,
          { x: 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        );
      }
      if (owlRef.current) {
        gsap.fromTo(owlRef.current,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, delay: 0.3, ease: 'back.out(1.7)' }
        );
        gsap.to(owlRef.current, {
          y: -12, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.8,
        });
      }
      bubblesRef.current.forEach((bubble, i) => {
        gsap.to(bubble, {
          y: -18 - i * 4,
          duration: 2.8 + i * 0.35,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.25,
        });
      });
    });
    return () => ctx.revert();
  }, []);

  const shakeCard = () => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
    }
  };

  const handleChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim();
    if (code === MOCK_INVITE_CODE) {
      setChildError(false);
      const savedProfileStr = localStorage.getItem(PROFILE_KEY);
      let p = savedProfileStr ? JSON.parse(savedProfileStr) : null;
      if (!p) {
        p = { ...MOCK_CHILD_PROFILE, passwordEnv: 'desert', passwordAnimal: 'camel', name: 'Alex' };
      } else {
        p.passwordEnv = 'desert';
        p.passwordAnimal = 'camel';
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      register(p);
      navigate('/image-password');
    } else {
      setChildError(true);
      shakeCard();
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      adminEmail.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
      adminPassword === ADMIN_CREDENTIALS.password
    ) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'active');
      navigate('/admin');
    } else {
      setAdminError('Invalid email or password. Please try again.');
      shakeCard();
    }
  };

  const switchMode = (m: LoginMode) => {
    setMode(m);
    setChildError(false);
    setAdminError('');
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
    >
      {/* ── Background Bubbles ── */}
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          ref={(el) => { if (el) bubblesRef.current[i] = el; }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.size,
            height: b.size,
            backgroundColor: b.bg,
            opacity: 0.28,
            top: 'top' in b ? b.top : undefined,
            left: 'left' in b ? b.left : undefined,
            right: 'right' in b ? b.right : undefined,
            bottom: 'bottom' in b ? b.bottom : undefined,
            filter: 'blur(2px)',
          }}
        />
      ))}

      {/* ── Centered content wrapper ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center min-h-screen px-6 gap-16">

        {/* ── LEFT PANEL — Branding ── */}
        <div className="hidden md:flex flex-col items-start flex-1">
          <div ref={owlRef} className="flex flex-col items-start gap-2">
            <img
              src={logo}
              alt="Yellow Owl Logo"
              style={{ height: 400, width: 'auto', objectFit: 'contain', objectPosition: 'left center', marginLeft: 0 }}
            />

          </div>
        </div>

        {/* ── RIGHT PANEL — Forms ── */}
        <div className="w-full md:w-[420px] shrink-0">
          <div
            ref={cardRef}
            className="bg-white rounded-3xl p-8 w-full"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.10), 0 4px 16px rgba(255,234,17,0.12)' }}
          >
            {/* Mobile-only logo */}
            <div className="flex flex-col items-center mb-6 md:hidden">
              <img src={logo} alt="Yellow Owl Logo" style={{ height: 72, objectFit: 'contain', marginBottom: 8 }} />
              <h1 className="text-2xl font-black text-gray-800">Yellow Owl</h1>
              <p className="text-gray-400 text-sm text-center">Your Learning Adventure Begins!</p>
            </div>

            {/* ── Choose mode ── */}
            {mode === 'choose' && (
              <div className="flex flex-col gap-5 animate-pop-in">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-gray-800">Welcome back!</h2>
                  <p className="text-gray-400 text-sm mt-1">How would you like to continue?</p>
                </div>

                <button
                  type="button"
                  className="w-full text-base py-4 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    backgroundColor: '#FFEA11',
                    border: 'none',
                    color: '#1a1a1a',
                    boxShadow: '0 4px 14px rgba(255, 234, 17, 0.35)',
                    cursor: 'pointer',
                    fontFamily: 'Andika, system-ui, sans-serif',
                  }}
                  onClick={() => switchMode('child')}
                >
                  I already have a code! (Log In)
                </button>

                <button
                  type="button"
                  className="w-full text-base py-4 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    backgroundColor: 'white',
                    border: '2px solid #FFEA11',
                    color: '#B8A800',
                    boxShadow: '0 4px 14px rgba(255, 234, 17, 0.12)',
                    cursor: 'pointer',
                    fontFamily: 'Andika, system-ui, sans-serif',
                  }}
                  onClick={() => navigate('/register')}
                >
                  I'm new here! (Register)
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchMode('admin')}
                    className="font-semibold text-xs text-gray-400 hover:text-yellow-600 underline underline-offset-2 transition-colors"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Admin Login
                  </button>
                </div>
              </div>
            )}

            {/* ── Child login ── */}
            {mode === 'child' && (
              <form onSubmit={handleChildSubmit} className="flex flex-col gap-5 animate-pop-in">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 mb-1">Enter your code</h2>
                  <p className="text-gray-400 text-sm">Type in the secret code from your teacher or parent.</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value); setChildError(false); }}
                    placeholder="Your secret code..."
                    className="w-full border-2 rounded-xl p-3 text-lg outline-none transition-all focus:border-[#FFEA11]"
                    style={{
                      borderColor: childError ? '#ef4444' : '#FFEA11',
                      fontFamily: 'Andika, system-ui, sans-serif',
                    }}
                    autoComplete="off"
                    autoFocus
                  />
                  {childError && (
                    <p className="mt-2 text-red-500 text-sm font-semibold">
                      Oops! That's not the right code. Try again!
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                >
                  Let's Go!
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('choose')}
                  className="font-bold text-sm text-gray-400 hover:text-[#B8A800] transition-colors text-center"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Back
                </button>
              </form>
            )}

            {/* ── Admin login ── */}
            {mode === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4 animate-pop-in">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 mb-1">Admin Sign In</h2>
                  <p className="text-gray-400 text-sm">Restricted access — admins only.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => { setAdminEmail(e.target.value); setAdminError(''); }}
                    placeholder="admin@yellowowl.com"
                    className="w-full border-2 rounded-xl p-3 text-base outline-none transition-all focus:border-[#FFEA11]"
                    style={{
                      borderColor: adminError ? '#ef4444' : '#d1d5db',
                      fontFamily: 'Andika, system-ui, sans-serif',
                    }}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }}
                      placeholder="Enter password"
                      className="w-full border-2 rounded-xl p-3 text-base outline-none transition-all pr-12 focus:border-[#FFEA11]"
                      style={{
                        borderColor: adminError ? '#ef4444' : '#d1d5db',
                        fontFamily: 'Andika, system-ui, sans-serif',
                      }}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {adminError && (
                    <p className="mt-2 text-red-500 text-sm font-semibold">{adminError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-white transition-all mt-1 hover:-translate-y-0.5"
                  style={{ background: '#B8A800', boxShadow: '0 6px 20px rgba(184,168,0,0.25)', border: 'none', cursor: 'pointer' }}
                >
                  Sign In →
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('choose')}
                  className="font-bold text-sm text-gray-400 hover:text-yellow-600 transition-colors text-center"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Back
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
