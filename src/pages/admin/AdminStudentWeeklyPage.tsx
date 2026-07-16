import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_ADMIN_USERS } from '@/mock/adminData';
import { PAST_ASSESSMENTS, WEEKLY_ASSESSMENT } from '@/mock/assessmentData';
import { ArrowLeft, User, Calendar, Clock, Award } from 'lucide-react';

export default function AdminStudentWeeklyPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const user = MOCK_ADMIN_USERS.find(u => u.id === userId);
  const [selectedWeek, setSelectedWeek] = useState('Week 1');

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p className="text-gray-400 text-sm font-bold">Student not found.</p>
        <button
          onClick={() => navigate('/admin', { state: { section: 'analysis_weekly' } })}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Get past assessment for this week
  const pastAssessment = PAST_ASSESSMENTS.find(a => a.week === selectedWeek);

  const getWeekAvg = () => {
    if (selectedWeek === 'Week 1') return 80;
    return 88;
  };

  const getWeekTime = () => {
    if (selectedWeek === 'Week 1') return '12:34';
    return '13:58';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '28px' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin', { state: { section: 'analysis_weekly' } })}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-800 font-sans">Weekly Assessment Report</h1>
          <p className="text-xs text-gray-400 mt-0.5">Weekly challenges performance analysis for {user.childName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-md">
            {user.childName.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-gray-800">{user.childName}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><User size={11} /> Age: {user.age} yrs</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> {user.grade}</span>
              {user.rollNo && (
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px]">Roll: {user.rollNo}</span>
              )}
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                Weekly Active Track
              </span>
            </div>
          </div>
          {/* Week Summary Badge */}
          <div className="flex gap-4">
            <div className="text-center bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl px-5 py-3">
              <div className="text-2xl font-black text-indigo-700">{getWeekAvg()}%</div>
              <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5">Week Score</div>
            </div>
            <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl px-5 py-3">
              <div className="text-2xl font-black text-slate-700 flex items-center justify-center gap-1">
                <Clock size={16} /> {getWeekTime()}
              </div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Time Taken</div>
            </div>
          </div>
        </div>

        {/* Week Switcher Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-px">
          {['Week 1', 'Week 2'].map(wk => (
            <button
              key={wk}
              onClick={() => setSelectedWeek(wk)}
              className={`px-6 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
                selectedWeek === wk
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {wk}
            </button>
          ))}
        </div>

        {/* Weekly Challenges breakdown */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
            {selectedWeek} Challenge Submissions
          </h3>

          {WEEKLY_ASSESSMENT.map((challenge) => {
            // Find past challenge submission
            const challengeSubmission = pastAssessment?.challenges.find(c => c.title === challenge.title || c.id === challenge.id);

            const isMCQ = challenge.questions.some(q => q.type === 'mcq');
            const isIdeas = challenge.questions.some(q => q.type === 'ideas');

            return (
              <div key={challenge.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{challenge.emoji}</span>
                    <div>
                      <h4 className="text-sm font-black text-gray-800">{challenge.title}</h4>
                      <p className="text-[11px] text-gray-400 font-semibold">{challenge.theme}</p>
                    </div>
                  </div>
                  {challengeSubmission && 'mcqScore' in challengeSubmission && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black border bg-indigo-50 border-indigo-100 text-indigo-700">
                      Score: {challengeSubmission.mcqScore} / {challengeSubmission.mcqTotal}
                    </span>
                  )}
                  {challengeSubmission && 'ideas' in challengeSubmission && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black border bg-emerald-50 border-emerald-100 text-emerald-700 flex items-center gap-1">
                      <Award size={12} /> Completed
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-xs font-medium text-slate-600 leading-relaxed border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Challenge Scenario:</span>
                  {challenge.scenario}
                </div>

                {/* Submissions detail */}
                {isMCQ && (
                  <div className="space-y-4 pt-2">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions Breakdown</h5>
                    
                    {challenge.questions.filter(q => q.type === 'mcq').map((q: any, qIdx) => {
                      return (
                        <div key={qIdx} className="space-y-2 border-l-2 border-slate-200 pl-4">
                          <p className="text-xs font-bold text-gray-800">{q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isCorrect = oIdx === q.correct;
                              let borderCls = 'border-slate-100 text-slate-500';
                              let bgCls = 'bg-slate-50/50';

                              if (isCorrect) {
                                borderCls = 'border-green-200 text-green-800 font-bold';
                                bgCls = 'bg-green-50/50';
                              }

                              return (
                                <div key={oIdx} className={`px-3 py-1.5 rounded-xl text-[11px] border ${borderCls} ${bgCls}`}>
                                  {opt} {isCorrect && ' ✓'}
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-gray-400 italic">Explanation: {q.explanation}</p>
                        </div>
                      );
                    })}

                    {/* Descriptive Section */}
                    {challenge.questions.filter(q => q.type === 'descriptive').map((q: any, qIdx) => {
                      const ans = challengeSubmission && 'descriptiveAnswer' in challengeSubmission ? challengeSubmission.descriptiveAnswer : '—';
                      return (
                        <div key={qIdx} className="space-y-2 border-l-2 border-slate-200 pl-4">
                          <p className="text-xs font-bold text-gray-800">{q.question}</p>
                          <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-3 text-xs font-semibold text-slate-700">
                            <span className="font-bold text-indigo-700 block mb-1">Student Answer:</span>
                            "{ans}"
                          </div>
                        </div>
                      );
                    })}

                    {/* Twist Question */}
                    {challenge.twistQuestion && (
                      <div className="space-y-2 border-l-2 border-amber-300 pl-4 bg-amber-50/10 p-3 rounded-xl border border-dashed border-amber-100">
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">The Surprise Twist</span>
                        <p className="text-xs font-bold text-gray-800">{challenge.twistQuestion.question}</p>
                        <div className="bg-green-50 border border-green-200 text-green-800 font-bold px-3 py-1.5 rounded-xl text-[11px] inline-block">
                          Correct Answer: {challenge.twistQuestion.options[challenge.twistQuestion.correct]}
                        </div>
                        <p className="text-[10px] text-gray-400 italic mt-1">Explanation: {challenge.twistQuestion.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {isIdeas && challengeSubmission && 'ideas' in challengeSubmission && (
                  <div className="space-y-3 pt-2">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brainstormed Ideas</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {challengeSubmission.ideas?.map((idea, iIdx) => (
                        <div key={iIdx} className="flex gap-3 items-center bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center">
                            {iIdx + 1}
                          </span>
                          <span>{idea}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
