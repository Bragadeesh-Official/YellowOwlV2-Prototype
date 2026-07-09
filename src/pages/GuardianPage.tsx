import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';
import { PAST_ASSESSMENTS } from '@/mock/assessmentData';
import logo from '@/assets/yellowowllogo.png';

type Assessment = (typeof PAST_ASSESSMENTS)[number];
type Challenge = Assessment['challenges'][number];

function getScoreColor(score: number): { bg: string; text: string } {
  if (score >= 80) return { bg: '#dcfce7', text: '#16a34a' };
  if (score >= 60) return { bg: '#fefce8', text: '#ca8a04' };
  return { bg: '#fee2e2', text: '#dc2626' };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}


function ChallengeDetail({ ch }: { ch: Challenge }) {
  const [readMore, setReadMore] = useState(false);

  const descriptiveAnswer = 'descriptiveAnswer' in ch ? ch.descriptiveAnswer : null;
  const truncated =
    descriptiveAnswer && descriptiveAnswer.length > 100
      ? descriptiveAnswer.slice(0, 100) + '...'
      : descriptiveAnswer;

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        background: '#f9fafb',
        marginBottom: 8,
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 14, color: '#374151', margin: '0 0 4px' }}>
        {ch.title}
      </p>

      {'mcqScore' in ch && 'mcqTotal' in ch && (
        <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0' }}>
          MCQ: Completed 🎯
          {'twistCorrect' in ch && (
            <span
              style={{
                marginLeft: 8,
                fontWeight: 700,
                color: '#8b5cf6',
              }}
            >
              + Twist Completed 🌀
            </span>
          )}
        </p>
      )}

      {'ideas' in ch && ch.ideas && (
        <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0' }}>
          Ideas shared: {ch.ideas.length}
        </p>
      )}

      {descriptiveAnswer && (
        <div style={{ marginTop: 4 }}>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '2px 0', fontStyle: 'italic' }}>
            "{readMore ? descriptiveAnswer : truncated}"
          </p>
          {descriptiveAnswer.length > 100 && (
            <button
              type="button"
              onClick={() => setReadMore((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2AD5B4',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                marginTop: 2,
              }}
            >
              {readMore ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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

export default function GuardianPage() {
  const navigate = useNavigate();
  const { profile, isLoggedIn, logout } = useApp();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const sectionRefs = useRef<HTMLDivElement[]>([]);
  const scoreBadgeRefs = useRef<HTMLSpanElement[]>([]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!profile) return;

    const ctx = gsap.context(() => {
      // Animate section cards sliding up
      const sections = sectionRefs.current.filter(Boolean);
      gsap.fromTo(sections,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.2,
          ease: 'power3.out',
        }
      );



      // Score badges pop in
      const badges = scoreBadgeRefs.current.filter(Boolean);
      gsap.fromTo(badges,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          delay: 0.6,
          ease: 'back.out(1.7)',
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
  }, [profile]);

  if (!profile) return null;

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
              {profile.avatar || '🦉'}
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
              onClick={() => navigate('/skills')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              My Super skillss
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all cursor-pointer"
            >
              My Profile
            </button>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left bg-[#FFEA11] text-gray-800 border border-yellow-300/60 shadow-sm cursor-pointer"
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
                  {profile.avatar || '🦉'}
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
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left text-gray-650 hover:bg-[#FFEA11]/25 hover:text-gray-800 transition-all"
                >
                  My Profile
                </button>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-left bg-[#FFEA11] text-gray-800 border border-yellow-300/60 shadow-sm"
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
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 animate-fade-in" style={{ paddingBottom: 32 }}>

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
              {profile.avatar || '🦉'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200/50 hover:bg-teal-100 transition-all cursor-pointer text-xs font-black"
            >
              Menu
            </button>
          </div>
        </div>

        {/* ===== Section 2: Past Assessments ===== */}
        <div
          className="mt-4"
          ref={(el) => { if (el) sectionRefs.current[0] = el; }}
        >
          <div
            className="owl-card"
            style={{ borderRadius: 24, padding: 24, background: 'white' }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1f2937' }}>
                Past Assessments 📋
              </h2>
              <span
                style={{
                  background: '#e0fdf4',
                  color: '#2AD5B4',
                  borderRadius: 20,
                  padding: '2px 10px',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {PAST_ASSESSMENTS.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PAST_ASSESSMENTS.map((assessment, idx) => {
                const isOpen = expanded === assessment.id;
                const sc = getScoreColor(assessment.score);
                return (
                  <div
                    key={assessment.id}
                    style={{
                      border: '1.5px solid #e5e7eb',
                      borderRadius: 16,
                      overflow: 'hidden',
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    {/* Row header */}
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : assessment.id)}
                      style={{
                        width: '100%',
                        background: isOpen ? '#f9fafb' : 'white',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        textAlign: 'left',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 800,
                              fontSize: 15,
                              color: '#1f2937',
                            }}
                          >
                            {assessment.week}
                          </p>
                          <p
                            style={{ margin: '2px 0 0', fontSize: 13, color: '#9ca3af' }}
                          >
                            {formatDate(assessment.date)} · {assessment.timeTaken} min
                          </p>
                        </div>
                      </div>
                      <span
                        ref={(el) => { if (el) scoreBadgeRefs.current[idx] = el; }}
                        style={{
                          background: sc.bg,
                          color: sc.text,
                          borderRadius: 20,
                          padding: '3px 12px',
                          fontSize: 14,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {assessment.score}%
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          color: '#9ca3af',
                          flexShrink: 0,
                          transition: 'transform 0.25s',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          display: 'inline-block',
                        }}
                      >
                        ▾
                      </span>
                    </button>

                    {/* Expandable details */}
                    <div
                      style={{
                        maxHeight: isOpen ? 2000 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.4s ease',
                      }}
                    >
                      <div style={{ padding: '0 16px 16px' }}>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: '#6b7280',
                            marginBottom: 8,
                            marginTop: 4,
                          }}
                        >
                          Challenge Results
                        </p>

                        {assessment.challenges.map((ch) => (
                          <ChallengeDetail key={ch.id} ch={ch} />
                        ))}

                        {assessment.improvements.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: '#6b7280',
                                marginBottom: 6,
                              }}
                            >
                              Areas to Improve 🎯
                            </p>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                              {assessment.improvements.map((imp, i) => (
                                <li
                                  key={i}
                                  style={{ fontSize: 13, color: '#4b5563', marginBottom: 4 }}
                                >
                                  {imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
