import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { type AdminUser, type School } from '@/mock/adminData';
import { JUNIOR_WARMUP, SENIOR_WARMUP } from '@/mock/userData';

import { FileDown, Users, CheckCircle2, Clock } from 'lucide-react';


interface AnalysisSectionProps {
  users: AdminUser[];
  schools: School[];
  mode: 'weekly' | 'warmup' | 'skills';
}

const GRADES = Array.from({ length: 5 }, (_, i) => `Grade ${i + 3}`);

export default function AnalysisSection({ users, schools, mode }: AnalysisSectionProps) {
  const navigate = useNavigate();
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [warmupFilter, setWarmupFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Filter users matching School and Grade
  const filteredUsers = users.filter(
    u => u.usageMode === 'school' && u.schoolId === selectedSchoolId && u.grade === selectedGrade
  );

  const totalCount = filteredUsers.length;
  const completedCount = filteredUsers.filter(u => u.warmupStatus === 'completed').length;
  const pendingCount = totalCount - completedCount;

  const displayedUsers = mode === 'warmup'
    ? filteredUsers.filter(u => {
        if (warmupFilter === 'completed') return u.warmupStatus === 'completed';
        if (warmupFilter === 'pending') return u.warmupStatus !== 'completed';
        return true;
      })
    : filteredUsers;

  // Compute skill level badge for a user (used in skills mode table)
  const getSkillBadge = (userId: string) => {
    const charSum = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const getLvl = (sId: string, w = 3) => {
      if (sId === 'digging-in')     return 1 + ((charSum + w * 3) % 4);
      if (sId === 'my-ideas')       return 1 + ((charSum + w * 5) % 4);
      if (sId === 'looking-closer') return 1 + ((charSum + w * 7) % 4);
      return 1 + ((charSum + w * 11) % 4);
    };
    const avg = (getLvl('digging-in') + getLvl('my-ideas') + getLvl('looking-closer') + getLvl('best-choice')) / 4;
    if (avg >= 3.5) return { label: 'Fluent',    cls: 'bg-purple-50 text-purple-700 border-purple-100', avg };
    if (avg >= 2.5) return { label: 'Strong',    cls: 'bg-teal-50 text-teal-700 border-teal-100',       avg };
    if (avg >= 1.5) return { label: 'Growing',   cls: 'bg-blue-50 text-blue-700 border-blue-100',       avg };
    return             { label: 'Beginning', cls: 'bg-orange-50 text-orange-700 border-orange-100',    avg };
  };

  // Excel Download
  const handleDownloadExcel = () => {
    if (!selectedSchoolId || !selectedGrade) return;
    const school = schools.find(s => s.id === selectedSchoolId);
    const schoolName = school ? `${school.name}_${school.branch}` : 'School';
    if (filteredUsers.length === 0) { alert('No students found.'); return; }

    const getMockAnswerIndex = (userId: string, qIdx: number, numOptions: number) => {
      if (!userId) return 0;
      return userId.charCodeAt(qIdx % userId.length) % numOptions;
    };

    if (mode === 'warmup') {
      const rows = filteredUsers.map(user => {
        const rowData: Record<string, string | number> = {
          'Student Name': user.childName,
          'Roll No': user.rollNo || '—',
          'Mobile': `${user.countryCode || '+91'} ${user.parentContact}`,
          'Email': user.parentEmail || '—',
        };

        const wData = user.age >= 12 ? SENIOR_WARMUP : JUNIOR_WARMUP;
        wData.questions.forEach((q, i) => {
          const opt = q.options[getMockAnswerIndex(user.id, i, q.options.length)];
          rowData[`Q${i + 1} Answer`] = opt.text;
          rowData[`Q${i + 1} Score`]  = opt.score;
        });

        return rowData;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Warm-up Report');
      const maxLens = Object.keys(rows[0] || {}).map(k => {
        let max = k.length;
        rows.forEach(r => { const v = String(r[k] ?? ''); if (v.length > max) max = v.length; });
        return { wch: Math.min(max + 2, 45) };
      });
      ws['!cols'] = maxLens;
      XLSX.writeFile(wb, `${schoolName}_${selectedGrade.replace(/\s+/g, '_')}_Warmup_Report.xlsx`);
    } else if (mode === 'weekly') {
      const rows = filteredUsers.map(user => {
        const rowData: Record<string, string | number> = {
          'Student Name': user.childName,
          'Roll No': user.rollNo || '—',
          'Mobile': `${user.countryCode || '+91'} ${user.parentContact}`,
          'Email': user.parentEmail || '—',
          'Week 1 Score (%)': 80,
          'Week 2 Score (%)': 88,
          'Overall Weekly Avg (%)': 84,
        };

        return rowData;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Weekly Assessment Report');
      const maxLens = Object.keys(rows[0] || {}).map(k => {
        let max = k.length;
        rows.forEach(r => { const v = String(r[k] ?? ''); if (v.length > max) max = v.length; });
        return { wch: Math.min(max + 2, 45) };
      });
      ws['!cols'] = maxLens;
      XLSX.writeFile(wb, `${schoolName}_${selectedGrade.replace(/\s+/g, '_')}_Weekly_Assessment_Report.xlsx`);
    }
  };

  return (
    <div style={{ padding: 28 }}>
      {/* Page Heading */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>
          {mode === 'skills' ? 'Skill Analysis' : mode === 'weekly' ? 'Weekly Assessment Analysis' : 'Warm-up Analysis'}
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          {mode === 'skills'
            ? 'Track skill-based progress visualization and individual student core capabilities'
            : mode === 'weekly'
            ? 'View weekly assessment challenges, progress, and performance'
            : 'View diagnostics and warm-up assessment results per student'}
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: 24 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Tenant/School</label>
            <select
              value={selectedSchoolId}
              onChange={e => { setSelectedSchoolId(e.target.value); setWarmupFilter('all'); }}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white focus:border-teal-owl transition-all"
            >
              <option value="">Choose a School...</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Grade</label>
            <select
              value={selectedGrade}
              onChange={e => { setSelectedGrade(e.target.value); setWarmupFilter('all'); }}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white focus:border-teal-owl transition-all"
            >
              <option value="">Choose a Grade...</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedSchoolId && selectedGrade ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Class List Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                Class Enrollment ({filteredUsers.length} Students)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Click <strong>"{mode === 'weekly' ? 'View Weekly' : mode === 'warmup' ? 'View Warm-up' : 'View Skill'}"</strong> to open the student's detailed report.
              </p>
            </div>

            {mode !== 'skills' && (
              <button
                onClick={handleDownloadExcel}
                disabled={filteredUsers.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer border-none"
              >
                <FileDown size={14} /> Download Grade Report (Excel)
              </button>
            )}
          </div>

          {/* Warm-up Stats & Filters */}
          {mode === 'warmup' && filteredUsers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-slate-50/40 border-b border-slate-100">
              {/* Total Card */}
              <button
                onClick={() => setWarmupFilter('all')}
                className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer bg-white ${
                  warmupFilter === 'all'
                    ? 'border-slate-800 ring-2 ring-slate-800/10 shadow-sm scale-[1.02]'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="p-3 rounded-xl bg-slate-100 transition-colors">
                  <Users className="text-slate-600" size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</p>
                  <p className="text-2xl font-black text-slate-800">{totalCount}</p>
                </div>
              </button>

              {/* Completed Card */}
              <button
                onClick={() => setWarmupFilter('completed')}
                className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer bg-white ${
                  warmupFilter === 'completed'
                    ? 'border-emerald-600 ring-2 ring-emerald-600/10 shadow-sm scale-[1.02]'
                    : 'border-slate-200 hover:border-emerald-250 hover:shadow-sm'
                }`}
              >
                <div className="p-3 rounded-xl bg-emerald-50 transition-colors">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Finished</p>
                  <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
                </div>
              </button>

              {/* Pending Card */}
              <button
                onClick={() => setWarmupFilter('pending')}
                className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer bg-white ${
                  warmupFilter === 'pending'
                    ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm scale-[1.02]'
                    : 'border-slate-200 hover:border-amber-250 hover:shadow-sm'
                }`}
              >
                <div className="p-3 rounded-xl bg-amber-50 transition-colors">
                  <Clock className="text-amber-600" size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending</p>
                  <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
                </div>
              </button>
            </div>
          )}

          {/* Student Table */}
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No students enrolled in this Grade for the selected Tenant.
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No students match the selected warm-up status filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100 text-slate-500">
                    <th className="py-3 px-4 font-black text-slate-600">#</th>
                    <th className="py-3 px-4 font-black text-slate-600">Student Name</th>
                    <th className="py-3 px-4 font-black text-slate-600">Roll No</th>
                    <th className="py-3 px-4 font-black text-slate-600">Age</th>
                    <th className="py-3 px-4 font-black text-slate-600">Parent Contact</th>
                    {mode === 'skills' && <th className="py-3 px-4 font-black text-slate-600">Latest Level</th>}
                    {mode === 'warmup' && <th className="py-3 px-4 font-black text-slate-600">Warm-up Status</th>}
                    <th className="py-3 px-4 font-black text-slate-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.map((user, idx) => {
                    const badge = mode === 'skills' ? getSkillBadge(user.id) : null;
                    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

                    return (
                      <tr key={user.id} className={`border-b border-slate-100 hover:bg-teal-50/20 transition-colors ${rowBg}`}>
                        <td className="py-3.5 px-4 text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-3.5 px-4 text-slate-800 font-bold">{user.childName}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 font-bold">{user.rollNo || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">{user.age} yrs</td>
                        <td className="py-3.5 px-4 text-slate-500 font-semibold">{user.countryCode || '+91'} {user.parentContact}</td>

                        {mode === 'skills' && badge && (
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.cls}`}>
                              {badge.label} <span className="opacity-60">({badge.avg.toFixed(1)})</span>
                            </span>
                          </td>
                        )}

                        {mode === 'warmup' && (
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              user.warmupStatus === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {user.warmupStatus === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                        )}

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {mode === 'weekly' ? (
                            <button
                              onClick={() => navigate(`/admin/student/${user.id}/weekly`)}
                              className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-slate-100 text-indigo-700 hover:bg-indigo-600 hover:text-white border-none"
                            >
                              View Weekly
                            </button>
                          ) : mode === 'warmup' ? (
                            <button
                              onClick={() => navigate(`/admin/student/${user.id}/warmup`)}
                              className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-slate-100 text-teal-700 hover:bg-teal-600 hover:text-white border-none"
                            >
                              View Warm-up
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/admin/student/${user.id}/skill`)}
                              className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-slate-100 text-purple-700 hover:bg-purple-600 hover:text-white border-none"
                            >
                              View Skill
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <h3 className="text-sm font-black text-gray-700">Select Tenant &amp; Grade</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Choose a School/Tenant and Grade above to load the student list.
          </p>
        </div>
      )}
    </div>
  );
}
