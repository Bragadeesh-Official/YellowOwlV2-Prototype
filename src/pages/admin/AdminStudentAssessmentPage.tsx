import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_ADMIN_USERS } from '@/mock/adminData';

import { JUNIOR_WARMUP, SENIOR_WARMUP } from '@/mock/userData';
import { ArrowLeft, User, Calendar, BookOpen } from 'lucide-react';

export default function AdminStudentAssessmentPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const user = MOCK_ADMIN_USERS.find(u => u.id === userId);


  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p className="text-gray-400 text-sm font-bold">Student not found.</p>
        <button
          onClick={() => navigate('/admin', { state: { section: 'analysis_warmup' } })}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isSenior = user.age >= 12;
  const warmupData = isSenior ? SENIOR_WARMUP : JUNIOR_WARMUP;

  const getMockAnswerIndex = (userId: string, qIdx: number, numOptions: number) => {
    if (!userId) return 0;
    const charCode = userId.charCodeAt(qIdx % userId.length);
    return charCode % numOptions;
  };

  const totalScore = warmupData.questions.reduce((sum, q, idx) => {
    const ansIdx = getMockAnswerIndex(user.id, idx, q.options.length);
    return sum + (q.options[ansIdx].score || 0);
  }, 0);
  const maxScore = warmupData.questions.length * 4;
  const pct = Math.round((totalScore / maxScore) * 100);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '28px' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin', { state: { section: 'analysis_warmup' } })}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-800">Assessment Report</h1>
          <p className="text-xs text-gray-400 mt-0.5">Diagnostic Warm-up results for {user.childName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
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
              <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {isSenior ? 'Senior Track' : 'Junior Track'}
              </span>
            </div>
          </div>
          {/* Score Badge */}
          <div className="text-center bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-100 rounded-2xl px-6 py-4">
            <div className="text-3xl font-black text-teal-700">{pct}%</div>
            <div className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mt-0.5">Overall Score</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalScore} / {maxScore} pts</div>
          </div>
        </div>

        {/* Scenario Card */}
        <div className="bg-gradient-to-r from-teal-50/70 to-blue-50/50 border border-teal-100/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-teal-600" />
            <span className="text-xs font-black text-teal-800 uppercase tracking-wider">
              {warmupData.trackName} — Challenge Scenario
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{warmupData.scenario}</p>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Question-by-Question Breakdown
          </h3>
          {warmupData.questions.map((q, idx) => {
            const ansIdx = getMockAnswerIndex(user.id, idx, q.options.length);
            const selectedOpt = q.options[ansIdx];
            const scoreColor =
              selectedOpt.score === 4 ? 'bg-green-50 text-green-700 border-green-100' :
              selectedOpt.score === 3 ? 'bg-blue-50 text-blue-700 border-blue-100' :
              selectedOpt.score === 2 ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-red-50 text-red-700 border-red-100';

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Question {q.id}
                    </span>
                    <h4 className="text-sm font-bold text-gray-800 leading-snug">{q.question}</h4>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-black border ${scoreColor}`}>
                    {selectedOpt.score} / 4
                  </span>
                </div>

                {/* All options shown, selected one highlighted */}
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => {
                    const isChosen = oIdx === ansIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          isChosen
                            ? 'bg-teal-50 border-teal-200 text-teal-800 font-bold'
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[9px] font-black ${
                            isChosen ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300'
                          }`}>
                            {isChosen ? '✓' : String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt.text}</span>
                          {isChosen && (
                            <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-black border ${scoreColor}`}>
                              Score: {opt.score}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
