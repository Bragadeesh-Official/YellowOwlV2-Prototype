import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_ADMIN_USERS } from '@/mock/adminData';

import { ArrowLeft, User, Calendar, TrendingUp, Sparkles } from 'lucide-react';

const SKILLS = [
  { id: 'digging-in',     title: 'Digging in',      description: "Can spot what's relevant from what isn't", color: '#8B5CF6' },
  { id: 'my-ideas',       title: 'My ideas',         description: 'Can come up with a few ideas',             color: '#0D9488' },
  { id: 'looking-closer', title: 'Looking closer',   description: 'Can describe pros and cons of an option',  color: '#1E3A8A' },
  { id: 'best-choice',    title: 'Best choice',      description: 'Can give a reason for a choice',           color: '#F97316' },
];

const LEVEL_LABELS = ['', 'Beginning', 'Growing', 'Strong', 'Fluent'];

export default function AdminStudentSkillPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [startWeek, setStartWeek] = useState(1);
  const [endWeek, setEndWeek] = useState(12);

  const user = MOCK_ADMIN_USERS.find(u => u.id === userId);


  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p className="text-gray-400 text-sm font-bold">Student not found.</p>
        <button onClick={() => navigate('/admin', { state: { section: 'analysis_skills' } })} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  const charSum = user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const getHistory = (skillId: string) => {
    const arr: number[] = [];
    for (let w = startWeek; w <= endWeek; w++) {
      let level = 1;
      if (skillId === 'digging-in')     level = 1 + ((charSum + w * 3) % 4);
      else if (skillId === 'my-ideas')  level = 1 + ((charSum + w * 5) % 4);
      else if (skillId === 'looking-closer') level = 1 + ((charSum + w * 7) % 4);
      else level = 1 + ((charSum + w * 11) % 4);
      arr.push(level);
    }
    return arr;
  };

  const getLatestLabel = (skillId: string) => LEVEL_LABELS[getHistory(skillId).at(-1) ?? 1];

  const totalWeeks = endWeek - startWeek + 1;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '28px' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin', { state: { section: 'analysis_skills' } })}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-teal-600" />
            Skill Progression Report
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">4 core skill trends for {user.childName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile + Controls Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-teal-500 text-white flex items-center justify-center text-xl font-black shadow-md">
              {user.childName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-black text-gray-800">{user.childName}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><User size={11} /> {user.age} yrs</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> {user.grade}</span>
                {user.rollNo && <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px]">Roll: {user.rollNo}</span>}
              </div>
            </div>
          </div>

          {/* Week Range Picker */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Start Wk:</span>
              <input
                type="number" min={1} max={endWeek} value={startWeek}
                onChange={e => setStartWeek(Math.min(endWeek, Math.max(1, Number(e.target.value) || 1)))}
                className="w-10 bg-transparent text-sm font-black text-teal-700 text-center outline-none"
              />
              <span className="text-slate-300">|</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">End Wk:</span>
              <input
                type="number" min={startWeek} max={50} value={endWeek}
                onChange={e => setEndWeek(Math.min(50, Math.max(startWeek, Number(e.target.value) || startWeek)))}
                className="w-10 bg-transparent text-sm font-black text-teal-700 text-center outline-none"
              />
            </div>
            <span className="bg-teal-50 text-teal-800 text-[10px] px-3 py-1.5 rounded-full font-bold border border-teal-100 flex items-center gap-1">
              <Sparkles size={10} /> {totalWeeks} weeks shown
            </span>
          </div>
        </div>

        {/* Summary Level Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SKILLS.map(skill => {
            const label = getLatestLabel(skill.id);
            return (
              <div key={skill.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: skill.color + '20' }}>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: skill.color }} />
                </div>
                <div className="text-xs font-black text-gray-700">{skill.title}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 mb-2">{skill.description}</div>
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border"
                  style={{ backgroundColor: skill.color + '15', color: skill.color, borderColor: skill.color + '30' }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SKILLS.map((skill, index) => {
            const chartWidth = Math.max(340, totalWeeks * 48);
            const history = getHistory(skill.id);

            const getY = (level: number) => {
              if (level === 4) return 20;
              if (level === 3) return 50;
              if (level === 2) return 80;
              return 110;
            };

            const getX = (i: number) => {
              const startX = 72;
              const endX = chartWidth - 20;
              if (totalWeeks <= 1) return startX;
              return startX + (i / (totalWeeks - 1)) * (endX - startX);
            };

            const pathD = history.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');

            return (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: skill.color }} />
                  <h4 className="text-sm font-black text-gray-800">{skill.title}</h4>
                </div>
                <p className="text-[11px] font-bold mb-4" style={{ color: skill.color }}>{skill.description}</p>

                <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 overflow-x-auto">
                  <div style={{ width: chartWidth, transition: 'width 0.3s' }}>
                    <svg viewBox={`0 0 ${chartWidth} 140`} className="w-full h-auto">
                      {/* Grid lines */}
                      {(['Fluent', 'Strong', 'Growing', 'Beginning'] as const).map((label, li) => {
                        const y = [20, 50, 80, 110][li];
                        return (
                          <g key={li}>
                            <text x="5" y={y + 4} className="text-[10px] fill-gray-400" style={{ fontSize: 9, fontWeight: 700 }}>{label}</text>
                            <line x1="70" y1={y} x2={chartWidth - 15} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />
                          </g>
                        );
                      })}

                      {/* Line */}
                      <path d={pathD} fill="none" stroke={skill.color} strokeWidth={totalWeeks > 15 ? '2' : '3.5'} strokeLinecap="round" strokeLinejoin="round" />

                      {/* Dots */}
                      {history.map((val, i) => (
                        <circle
                          key={i}
                          cx={getX(i)} cy={getY(val)}
                          r={totalWeeks > 15 ? '2.5' : '4.5'}
                          fill="white" stroke={skill.color}
                          strokeWidth={totalWeeks > 15 ? '1.5' : '2.5'}
                        />
                      ))}

                      {/* X labels */}
                      {history.map((_, i) => {
                        const wk = startWeek + i;
                        const show = i === 0 || i === totalWeeks - 1 || totalWeeks <= 10 || wk % 5 === 0;
                        if (!show) return null;
                        return (
                          <text key={i} x={getX(i)} y="133" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: '#6B7280' }}>
                            Wk {wk}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
