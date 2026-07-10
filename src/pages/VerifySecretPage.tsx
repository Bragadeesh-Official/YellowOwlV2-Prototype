import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
import logo from '@/assets/yellowowllogo.png';

const BUBBLES = [
  { size: 100, top: '4%', left: '3%', bg: '#2AD5B4' },
  { size: 70, top: '12%', right: '5%', bg: '#FFEA11' },
  { size: 120, bottom: '7%', left: '2%', bg: '#FFEA11' },
  { size: 80, bottom: '14%', right: '4%', bg: '#2AD5B4' },
];

export default function VerifySecretPage() {
  const navigate = useNavigate();
  const { profile } = useApp();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const owlRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const successRef = useRef<HTMLDivElement>(null);

  const phone = profile?.parentPhone ?? '**********';
  const maskedPhone = phone.length >= 10 ? `******${phone.slice(-4)}` : phone;

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardRef.current) {
        gsap.fromTo(cardRef.current,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        );
      }
      if (owlRef.current) {
        gsap.fromTo(owlRef.current,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, delay: 0.3, ease: 'back.out(1.7)' }
        );
        gsap.to(owlRef.current, {
          y: -8, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.8,
        });
      }
      bubblesRef.current.forEach((bubble, i) => {
        gsap.to(bubble, {
          y: -16 - i * 4, duration: 2.4 + i * 0.4,
          ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.2,
        });
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (success && successRef.current) {
      gsap.fromTo(successRef.current,
        { scale: 0.6, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [success]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter your OTP.');
      return;
    }

    setSuccess(true);
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
            width: b.size, height: b.size,
            backgroundColor: b.bg, opacity: 0.15,
            top: b.top,
            left: ('left' in b ? b.left : undefined),
            right: ('right' in b ? b.right : undefined),
            bottom: ('bottom' in b ? b.bottom : undefined),
          }}
        />
      ))}

      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-10 bg-white rounded-3xl shadow-lg p-8 mx-4 w-full max-w-md"
      >
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="btn-back mb-4"
        >
          ← Back
        </button>

        {/* Logo & heading */}
        <div className="flex flex-col items-center mb-7">
          <div ref={owlRef}>
            <img src={logo} alt="Yellow Owl" style={{ height: 72, objectFit: 'contain', marginBottom: 10 }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Verify OTP</h1>
          <p className="text-gray-500 text-sm text-center leading-relaxed">
            An OTP has been sent to your parent's registered WhatsApp and Email.
          </p>
          {profile?.parentPhone && (
            <p className="text-gray-700 text-sm font-bold mt-2">WhatsApp: +91 {maskedPhone}</p>
          )}
          {profile?.parentEmail && (
            <p className="text-gray-500 text-xs font-semibold mt-0.5">Email: {profile.parentEmail}</p>
          )}
        </div>

        {/* WhatsApp & Email notification hint */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm"
          style={{ backgroundColor: '#f0fdf9', border: '1.5px solid #2AD5B4' }}
        >
          <span style={{ fontSize: 22 }}>✉️</span>
          <span className="text-gray-600">
            Check your parent's <span className="font-bold text-gray-800">WhatsApp</span> and <span className="font-bold text-gray-800">Email</span> inbox for the OTP.
          </span>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              placeholder="Enter your OTP"
              autoFocus
              style={{
                width: '100%',
                border: `2px solid ${error ? '#ef4444' : '#2AD5B4'}`,
                borderRadius: 12,
                padding: '14px 16px',
                fontSize: '1.1rem',
                fontFamily: 'Andika, system-ui, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.12em',
                outline: 'none',
                color: '#1a1a1a',
                background: '#fff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                textAlign: 'center',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FFEA11';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,234,17,0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#ef4444' : '#2AD5B4';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {error && (
              <p className="mt-2 text-red-500 text-sm font-semibold text-center">{error}</p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full">
            Verify & Continue
          </button>
        </form>
      </div>

      {/* Success Dialog Box Modal */}
      {success && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            ref={successRef}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: '32px 24px',
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '3px solid #2AD5B4',
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', marginBottom: 12, fontFamily: 'Andika, system-ui, sans-serif' }}>
              OTP Verified!
            </h3>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
              Your account has been created. Let's start with login!
            </p>
            <button
              onClick={() => navigate('/login', { state: { autoOpenMobileLogin: true, phone: profile?.parentPhone } })}
              className="w-full text-base py-3.5 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              style={{
                backgroundColor: '#FFEA11',
                border: 'none',
                color: '#1a1a1a',
                boxShadow: '0 4px 14px rgba(255, 234, 17, 0.35)',
                fontFamily: 'Andika, system-ui, sans-serif',
              }}
            >
              Let's start with login ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
