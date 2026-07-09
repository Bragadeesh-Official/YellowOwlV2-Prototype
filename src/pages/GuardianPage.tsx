import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useApp } from '@/context/AppContext';
import { PAST_ASSESSMENTS, SKILL_DESCRIPTIONS } from '@/mock/assessmentData';
import logo from '@/assets/yellowowllogo.png';

type SkillKey = keyof typeof SKILL_DESCRIPTIONS;
const SKILL_KEYS: SkillKey[] = ['listening', 'reading', 'thinking', 'imagination'];

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

export default function GuardianPage() {
  const navigate = useNavigate();
  const { profile, isLoggedIn } = useApp();

  const [expanded, setExpanded] = useState<string | null>(null);

  const sectionRefs = useRef<HTMLDivElement[]>([]);
  const barRefs = useRef<HTMLDivElement[]>([]);
  const scoreBadgeRefs = useRef<HTMLSpanElement[]>([]);

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

      // Animate skill bars
      SKILL_KEYS.forEach((key, i) => {
        const bar = barRefs.current[i];
        if (!bar) return;
        const value = profile.skills[key];
        gsap.fromTo(
          bar,
          { width: '0%' },
          { width: `${value}%`, duration: 0.9, delay: 0.35 + i * 0.12, ease: 'power2.out' }
        );
      });

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
    });

    return () => ctx.revert();
  }, [profile]);

  if (!profile) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      }}
    >
      {/* Sticky Top Bar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          height: 60,
        }}
      >
        <div className="max-w-2xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn-back"
          >
            ← Back to Profile
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={logo} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: '#374151' }}>
              Guardian View
            </span>
          </div>

          <span
            style={{
              background: '#f0fdf4',
              color: '#16a34a',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 700,
              border: '1.5px solid #bbf7d0',
            }}
          >
            Protected 🔒
          </span>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingBottom: 32 }}>
        {/* ===== Section 1: Child Overview ===== */}
        <div
          className="mt-4"
          ref={(el) => { if (el) sectionRefs.current[0] = el; }}
        >
          <div
            className="owl-card"
            style={{ borderRadius: 24, padding: 24, background: 'white' }}
          >
            {/* Avatar + name + age + level */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#FFEA11',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  flexShrink: 0,
                }}
              >
                {profile.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1f2937' }}>
                  {profile.name}
                </h2>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
                  Age {profile.age}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 6,
                    background: '#2AD5B4',
                    color: 'white',
                    borderRadius: 20,
                    padding: '3px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Level {profile.level} ⭐
                </span>
              </div>
            </div>

            {/* Skill progress bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SKILL_KEYS.map((key, i) => {
                const desc = SKILL_DESCRIPTIONS[key];
                const value = profile.skills[key];
                const fillColor = desc.color === '#FFEA11' ? '#B8A800' : desc.color;
                return (
                  <div key={key}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>
                        {desc.emoji} {desc.label}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: fillColor }}>
                        {value}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        borderRadius: 5,
                        background: '#e5e7eb',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        ref={(el) => { if (el) barRefs.current[i] = el; }}
                        style={{
                          height: '100%',
                          borderRadius: 5,
                          backgroundColor: fillColor,
                          width: '0%',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== Section 2: Past Assessments ===== */}
        <div
          className="mt-4"
          ref={(el) => { if (el) sectionRefs.current[1] = el; }}
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
