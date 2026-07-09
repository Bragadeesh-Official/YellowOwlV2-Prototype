import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useApp } from '@/context/AppContext';
import logo from '@/assets/yellowowllogo.png';

const BUBBLES = [
  { size: 110, top: '5%', left: '4%', bg: '#2AD5B4' },
  { size: 75, top: '15%', right: '5%', bg: '#FFEA11' },
  { size: 130, bottom: '8%', left: '2%', bg: '#FFEA11' },
  { size: 85, bottom: '15%', right: '4%', bg: '#2AD5B4' },
  { size: 55, top: '45%', left: '48%', bg: '#2AD5B4' },
];


const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '2px solid #2AD5B4',
  borderRadius: '12px',
  padding: '12px',
  fontSize: '1rem',
  fontFamily: 'Andika, system-ui, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  color: '#1a1a1a',
  background: '#fff',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useApp();

  const [name, setName] = useState('');
  const [age, setAge] = useState('9');
  const [weeklySession, setWeeklySession] = useState('20 minutes');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const owlRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<HTMLDivElement[]>([]);
  const bubblesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Card slide-in
      if (cardRef.current) {
        gsap.fromTo(cardRef.current,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
          }
        );
      }

      // Owl bounce
      if (owlRef.current) {
        gsap.fromTo(owlRef.current,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            delay: 0.35,
            ease: 'back.out(1.7)',
          }
        );
        gsap.to(owlRef.current, {
          y: -8,
          duration: 1.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 0.85,
        });
      }

      // Staggered form fields
      const fields = fieldsRef.current.filter(Boolean);
      if (fields.length) {
        gsap.fromTo(fields,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            stagger: 0.1,
            delay: 0.5,
            ease: 'power2.out',
          }
        );
      }

      // Bubbles float
      bubblesRef.current.forEach((bubble, i) => {
        gsap.to(bubble, {
          y: -18 - i * 4,
          duration: 2.6 + i * 0.35,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.25,
        });
      });
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(guardianPhone)) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneError('');

    if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');

    register({
      name: name.trim(),
      age: parseInt(age, 10),
      weeklySession: parseInt(weeklySession, 10),
      guardianPhone,
      guardianEmail: guardianEmail.trim() || undefined,
    });

    localStorage.setItem('yellowowl_newly_registered', 'true');
    navigate('/verify-secret');
  };

  const addFieldRef = (el: HTMLDivElement | null, i: number) => {
    if (el) fieldsRef.current[i] = el;
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
            width: b.size,
            height: b.size,
            backgroundColor: b.bg,
            opacity: 0.15,
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
        className="relative z-10 bg-white rounded-3xl shadow-lg px-12 py-8 mx-4 w-full max-w-2xl"
      >
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="btn-back mb-4"
        >
          ← Back to Login
        </button>



        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          <div ref={owlRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={logo} alt="Yellow Owl Logo" style={{ height: 140, objectFit: 'contain', marginBottom: 12 }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Join Yellow Owl!</h1>
          <p className="text-gray-500 text-sm text-center">Tell us about yourself!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* 1. Child's Name */}
          <div ref={(el) => addFieldRef(el, 0)}>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Child's Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What's your name?"
              required
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FFEA11';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,234,17,0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#2AD5B4';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* 2. Age */}
          <div ref={(el) => addFieldRef(el, 1)}>
            <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FFEA11';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,234,17,0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#2AD5B4';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {[9, 10, 11, 12, 13].map((a) => (
                <option key={a} value={a}>
                  {a} years old
                </option>
              ))}
            </select>
          </div>

          {/* 3. Weekly Session Time */}
          <div ref={(el) => addFieldRef(el, 2)}>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Weekly Session Time
            </label>
            <select
              value={weeklySession}
              onChange={(e) => setWeeklySession(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FFEA11';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,234,17,0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#2AD5B4';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {['15 minutes', '20 minutes', '25 minutes', '30 minutes'].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Guardian Mobile */}
          <div ref={(el) => addFieldRef(el, 3)}>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Guardian Mobile Number
            </label>
            <input
              type="tel"
              value={guardianPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setGuardianPhone(val);
                setPhoneError('');
              }}
              placeholder="10-digit mobile number"
              maxLength={10}
              style={{
                ...inputStyle,
                borderColor: phoneError ? '#ef4444' : '#2AD5B4',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FFEA11';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,234,17,0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = phoneError ? '#ef4444' : '#2AD5B4';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {phoneError && (
              <p className="mt-1 text-red-500 text-xs font-semibold">{phoneError}</p>
            )}
          </div>

          {/* 5. Guardian Email */}
          <div ref={(el) => addFieldRef(el, 4)}>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Guardian Email <span className="text-gray-400 text-xs font-normal"></span>
            </label>
            <input
              type="email"
              value={guardianEmail}
              onChange={(e) => {
                setGuardianEmail(e.target.value);
                setEmailError('');
              }}
              placeholder="guardian@example.com"
              style={{
                ...inputStyle,
                borderColor: emailError ? '#ef4444' : '#2AD5B4',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FFEA11';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,234,17,0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = emailError ? '#ef4444' : '#2AD5B4';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {emailError && (
              <p className="mt-1 text-red-500 text-xs font-semibold">{emailError}</p>
            )}
          </div>

          {/* 6. Terms checkbox */}
          <div
            ref={(el) => addFieldRef(el, 5)}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: '#f0fdf9', border: '1.5px solid #2AD5B4' }}
          >
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 cursor-pointer"
              style={{ accentColor: '#2AD5B4' }}
            />
            <label
              htmlFor="terms"
              className="text-sm text-gray-700 cursor-pointer leading-relaxed"
            >
              I agree to the{' '}
              <span className="font-bold" style={{ color: '#2AD5B4' }}>
                Yellow Owl Adventure Terms!
              </span>
            </label>
          </div>

          {/* Submit */}
          <div ref={(el) => addFieldRef(el, 6)}>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={!agreed || !name.trim()}
            >
              Start My Adventure!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
