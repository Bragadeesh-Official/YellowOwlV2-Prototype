import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { type AdminUser, type School } from '@/mock/adminData';
import Stepper from './Stepper';
import { Pencil, Trash2 } from 'lucide-react';

type View = 'list' | 'create' | 'edit';
type UploadMode = 'individual' | 'bulk';

const GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
const AGES = [9, 10, 11, 12, 13];
const SESSION_OPTS = [15, 20, 25, 30];

const INDIVIDUAL_STEPS = ['Select School & Grade', 'Student Info', 'Guardian Info', 'Review'];
const BULK_STEPS = ['Select School & Grade', 'Upload & Preview'];

interface UserForm {
  schoolId: string;
  grade: string;
  childName: string;
  age: string;
  sessionTime: string;
  guardianMobile: string;
  guardianEmail: string;
  rollNo: string;
  countryCode: string;
}

const EMPTY: UserForm = { schoolId: '', grade: '', childName: '', age: '', sessionTime: '', guardianMobile: '', guardianEmail: '', rollNo: '', countryCode: '+91' };

type ErrMap = Partial<Record<keyof UserForm, string>>;

function genId() { return 'u' + Math.random().toString(36).slice(2, 9); }
  function isMobile(v: string) { return /^[6-9]\d{9}$/.test(v.trim()); }
  function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validateRollNo(rollNo: string) {
  return /^[A-Z]{3}\d{3}$/.test(rollNo.trim());
}

function validateStep(step: number, form: UserForm): ErrMap {
  const e: ErrMap = {};
  if (step === 0) {
    if (!form.schoolId) e.schoolId = 'Please select a school';
    if (!form.grade) e.grade = 'Please select a grade';
  }
  if (step === 1) {
    if (!form.childName.trim()) e.childName = 'Child name is required';
    if (!form.age) e.age = 'Age is required';
    if (!form.sessionTime) e.sessionTime = 'Session time is required';
    if (!form.rollNo.trim()) {
      e.rollNo = 'Roll number is required';
    } else if (!validateRollNo(form.rollNo)) {
      e.rollNo = 'Roll number must be 3 letters + 3 digits (e.g. ABC123)';
    }
  }
  if (step === 2) {
    if (!form.guardianMobile.trim()) e.guardianMobile = 'Guardian mobile is required';
    else if (!isMobile(form.guardianMobile)) e.guardianMobile = 'Enter a valid 10-digit mobile number';
    if (form.guardianEmail && !isEmail(form.guardianEmail)) e.guardianEmail = 'Enter a valid email address';
  }
  return e;
}

// ─── Shared style helpers ────────────────────────────────────────────────────

const iStyle = (err?: string): React.CSSProperties => ({
  width: '100%', boxSizing: 'border-box',
  border: `2px solid ${err ? '#fca5a5' : '#e2e8f0'}`,
  borderRadius: 10, padding: '11px 14px',
  fontSize: 14, fontFamily: 'Andika, system-ui, sans-serif',
  outline: 'none', background: 'white', color: '#1e293b', display: 'block',
});

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6,
};

const errTxt: React.CSSProperties = { color: '#ef4444', fontSize: 12, marginTop: 4 };

function NavBtn({ onClick, children, primary, disabled }: { onClick: () => void; children: React.ReactNode; primary?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: disabled ? 'none' : (primary ? 'none' : '2px solid #e2e8f0'),
      borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'Andika, system-ui, sans-serif',
      background: disabled ? '#e2e8f0' : (primary ? '#FFEA11' : 'transparent'),
      color: disabled ? '#94a3b8' : (primary ? '#1a1a1a' : '#64748b'),
      boxShadow: (primary && !disabled) ? '0 4px 12px rgba(255, 234, 17, 0.35)' : 'none',
      opacity: disabled ? 0.6 : 1,
    }}>
      {children}
    </button>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1e293b', marginTop: 3 }}>{value || '—'}</div>
    </div>
  );
}

// ─── Bulk upload row type ────────────────────────────────────────────────────

interface BulkRow {
  rowNum: number;
  childName: string;
  age: string;
  guardianMobile: string;
  sessionTime: string;
  guardianEmail: string;
  rollNo: string;
  countryCode: string;
  errors: string[];
}

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+61', label: '🇦🇺 +61' },
];

function parseBulkRows(raw: Record<string, unknown>[]): BulkRow[] {
  return raw.map((r, idx) => {
    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const val = r[k] ?? r[k.toLowerCase()] ?? r[k.replace(/ /g, '_')] ?? r[k.replace(/ /g, '')];
        if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
      }
      return '';
    };

    const childName = pick('Name', 'Child Name', 'Student Name');
    const age = pick('Age');
    const guardianMobile = pick('Guardian Mobile', 'Mobile', 'Contact', 'Guardian Contact');
    const sessionTime = pick('Session Time', 'Session');
    const guardianEmail = pick('Guardian Email', 'Email');
    const rollNo = pick('Roll No', 'Roll Number', 'RollNo', 'Roll_No').toUpperCase();
    let countryCode = pick('Country Code', 'CountryCode', 'Code').trim();
    if (countryCode) {
      if (!countryCode.startsWith('+')) {
        countryCode = '+' + countryCode;
      }
    } else {
      countryCode = '+91';
    }

    const errors: string[] = [];
    if (!childName) errors.push('Name is missing');
    if (!age || isNaN(Number(age)) || Number(age) < 9 || Number(age) > 13) errors.push('Age must be 9–13');
    if (!guardianMobile || !isMobile(guardianMobile)) errors.push('Valid 10-digit mobile required');
    
    const sessNum = Number(sessionTime);
    if (!sessionTime || isNaN(sessNum) || sessNum < 15 || sessNum > 30) {
      errors.push('Session must be 15–30 min');
    }

    if (!rollNo) {
      errors.push('Roll No is missing');
    } else if (!validateRollNo(rollNo)) {
      errors.push('Roll No must be 3 letters + 3 digits (e.g. ABC123)');
    }

    if (!/^\+\d{1,4}$/.test(countryCode)) {
      errors.push('Invalid country code (e.g. +91)');
    }

    return { rowNum: idx + 2, childName, age, guardianMobile, sessionTime, guardianEmail, rollNo, countryCode, errors };
  });
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Name', 'Age', 'Guardian Mobile', 'Session Time', 'Guardian Email', 'Roll No', 'Country Code'],
    ['Arjun Kumar', '10', '9876543210', '20', 'parent@example.com', 'ARJ101', '+91'],
  ]);
  ws['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, 'student_upload_template.xlsx');
}

export default function SchoolUsersSection({ users, setUsers, schools }: {
  users: AdminUser[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  schools: School[];
}) {
  const [view, setView] = useState<View>('list');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSchoolId, setFilterSchoolId] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Create stepper
  const [step, setStep] = useState(0);
  const [uploadMode, setUploadMode] = useState<UploadMode>('individual');
  const [form, setForm] = useState<UserForm>(EMPTY);
  const [errors, setErrors] = useState<ErrMap>({});

  // Bulk upload
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form
  const [editForm, setEditForm] = useState<UserForm>(EMPTY);
  const [editErrors, setEditErrors] = useState<ErrMap>({});

  const onChange = (k: keyof UserForm, v: string) => {
    const val = k === 'rollNo' ? v.toUpperCase() : v;
    setForm(f => ({ ...f, [k]: val }));
    setErrors(e => ({ ...e, [k]: '' }));
  };
  const onEditChange = (k: keyof UserForm, v: string) => {
    const val = k === 'rollNo' ? v.toUpperCase() : v;
    setEditForm(f => ({ ...f, [k]: val }));
    setEditErrors(e => ({ ...e, [k]: '' }));
  };

  const currentSteps = uploadMode === 'bulk' ? BULK_STEPS : INDIVIDUAL_STEPS;

  const schoolUsers = users.filter(u => u.usageMode === 'school');

  const filtered = schoolUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.childName.toLowerCase().includes(q) || u.guardianContact.includes(q) || (u.guardianEmail ?? '').toLowerCase().includes(q);
    const matchGrade = filterGrade === 'all' || u.grade === filterGrade;
    const matchSchool = filterSchoolId === 'all' || u.schoolId === filterSchoolId;
    return matchSearch && matchGrade && matchSchool;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const paginatedUsers = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      try {
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { raw: false, defval: '' });
        setBulkRows(parseBulkRows(rows));
      } catch {
        setBulkRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validBulkRows = bulkRows.filter(r => r.errors.length === 0);

  const handleBulkImport = () => {
    const newUsers: AdminUser[] = validBulkRows.map(r => ({
      id: genId(),
      childName: r.childName,
      age: Number(r.age),
      guardianContact: r.guardianMobile,
      guardianEmail: r.guardianEmail || undefined,
      weeklySession: Number(r.sessionTime),
      usageMode: 'school',
      grade: form.grade,
      schoolId: form.schoolId,
      rollNo: r.rollNo,
      countryCode: r.countryCode,
    }));
    setUsers(p => [...p, ...newUsers]);
    setView('list');
  };

  // ─── List View ──────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>School Users</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Manage school-linked student accounts</p>
          </div>
          <button onClick={() => { setForm(EMPTY); setErrors({}); setStep(0); setUploadMode('individual'); setBulkRows([]); setFileName(''); setView('create'); }}
            style={{
              background: '#2AD5B4', border: 'none', borderRadius: 10,
              padding: '10px 22px', fontSize: 13, fontWeight: 700,
              color: 'white', cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif',
              boxShadow: '0 4px 14px rgba(42, 213, 180, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            Add School User
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }}>🔍</span>
            <input
              type="text" value={search} placeholder="Search by name or mobile..."
              onChange={e => setSearch(e.target.value)}
              style={{ ...iStyle(), paddingLeft: 40, paddingRight: 14, background: 'white' }}
            />
          </div>
          <select value={filterSchoolId} onChange={e => setFilterSchoolId(e.target.value)}
            style={{ ...iStyle(), width: 'auto', padding: '11px 16px', background: 'white' }}>
            <option value="all">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            style={{ ...iStyle(), width: 'auto', padding: '11px 16px', background: 'white' }}>
            <option value="all">All Grades</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(42,213,180,0.06)', border: '1px solid rgba(42, 213, 180, 0.08)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                  {['Child Name', 'School', 'Age', 'Grade', 'Roll No', 'Guardian Mobile', 'Guardian Email', 'Session', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Actions' ? 'center' : 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>No school users found</td></tr>
                ) : paginatedUsers.map((u, i) => {
                  const school = schools.find(s => s.id === u.schoolId);
                  const schoolName = school ? `${school.name} (${school.branch})` : '—';
                  return (
                    <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{u.childName}</td>
                      <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 500 }}>{schoolName}</td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{u.age} yrs</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>{u.grade}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: 600, fontFamily: 'monospace' }}>{u.rollNo || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{u.countryCode ? `${u.countryCode} ` : ''}{u.guardianContact}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{u.guardianEmail || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{u.weeklySession} min</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {deleteId === u.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Delete?</span>
                            <button onClick={() => { setUsers(p => p.filter(x => x.id !== u.id)); setDeleteId(null); }}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#ef4444', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif' }}>Yes</button>
                            <button onClick={() => setDeleteId(null)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#e2e8f0', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif' }}>No</button>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', gap: 8 }}>
                            <button onClick={() => {
                              setEditUser(u);
                              setEditForm({
                                schoolId: u.schoolId ?? '',
                                grade: u.grade ?? '',
                                childName: u.childName,
                                age: String(u.age),
                                sessionTime: String(u.weeklySession),
                                guardianMobile: u.guardianContact,
                                guardianEmail: u.guardianEmail ?? '',
                                rollNo: u.rollNo ?? '',
                                countryCode: u.countryCode ?? '+91'
                              });
                              setEditErrors({}); setView('edit');
                            }}
                              title="Edit User"
                              style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#e2e8f0', color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }}>
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => setDeleteId(u.id)}
                              title="Delete User"
                              style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', transition: 'all 0.2s' }}>
                              <Trash2 size={16} />
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Showing {filtered.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to {Math.min(activePage * pageSize, filtered.length)} of {filtered.length} student{filtered.length !== 1 ? 's' : ''}
              </span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  fontSize: 11,
                  color: '#475569',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: activePage === 1 ? '#f1f5f9' : 'white',
                    color: activePage === 1 ? '#94a3b8' : '#475569',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: activePage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  const isCurrent = p === activePage;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: isCurrent ? '1px solid #2AD5B4' : '1px solid #e2e8f0',
                        background: isCurrent ? '#2AD5B4' : 'white',
                        color: isCurrent ? 'white' : '#475569',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: activePage === totalPages ? '#f1f5f9' : 'white',
                    color: activePage === totalPages ? '#94a3b8' : '#475569',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: activePage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Create View (Stepper) ──────────────────────────────────────────────────

  if (view === 'create') {
    const handleNext = () => {
      const e = validateStep(step, form);
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(s => s + 1);
    };

    const handleSubmit = () => {
      setUsers(p => [...p, {
        id: genId(), childName: form.childName, age: Number(form.age),
        guardianContact: form.guardianMobile, guardianEmail: form.guardianEmail || undefined,
        weeklySession: Number(form.sessionTime), usageMode: 'school', grade: form.grade,
        schoolId: form.schoolId,
        rollNo: form.rollNo,
        countryCode: form.countryCode,
      }]);
      setView('list');
    };

    const switchMode = (m: UploadMode) => {
      setUploadMode(m);
      setStep(0);
      setBulkRows([]);
      setFileName('');
      setErrors({});
    };

    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
          ← Back to School Users
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>Add School User</h1>

        <div style={{ background: 'white', borderRadius: 16, padding: '32px 36px', maxWidth: 680, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Stepper steps={currentSteps} current={step} />

          {/* ── Step 0: School & Grade Selection ───────────────────────────── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Select School <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={form.schoolId} onChange={e => onChange('schoolId', e.target.value)} style={{ ...iStyle(errors.schoolId), background: 'white' }}>
                  <option value="">Select school...</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
                </select>
                {errors.schoolId && <p style={errTxt}>{errors.schoolId}</p>}
              </div>
              <div>
                <label style={{ ...lbl, fontSize: 14, marginBottom: 10 }}>Select Grade <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {GRADES.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => { onChange('grade', g); setErrors(e => ({ ...e, grade: '' })); }}
                      style={{
                        border: `2px solid ${form.grade === g ? '#2AD5B4' : '#e2e8f0'}`,
                        borderRadius: 12, padding: '18px 10px', cursor: 'pointer',
                        fontFamily: 'Andika, system-ui, sans-serif', fontSize: 14, fontWeight: 700,
                        background: form.grade === g ? '#f0fdf8' : 'white',
                        color: form.grade === g ? '#0d9488' : '#475569',
                        transition: 'all 0.15s',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.grade && <p style={errTxt}>{errors.grade}</p>}
              </div>

              {/* Bulk upload toggle — appears once a school and grade are selected */}
              {form.schoolId && form.grade && (
                <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px dashed #e2e8f0' }}>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>How would you like to add students?</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {(['individual', 'bulk'] as UploadMode[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => switchMode(m)}
                        style={{
                          flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                          border: `2px solid ${uploadMode === m ? '#2AD5B4' : '#e2e8f0'}`,
                          background: uploadMode === m ? '#f0fdf8' : 'white',
                          color: uploadMode === m ? '#0d9488' : '#64748b',
                          fontSize: 13, fontWeight: 700, fontFamily: 'Andika, system-ui, sans-serif',
                          transition: 'all 0.15s',
                        }}
                      >
                        {m === 'individual' ? 'Add Individual Student' : 'Upload from Excel'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1 (individual): Student Info ────────────────────────── */}
          {step === 1 && uploadMode === 'individual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Child Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={form.childName} placeholder="e.g. Arjun Kumar"
                  onChange={e => onChange('childName', e.target.value)} style={iStyle(errors.childName)} />
                {errors.childName && <p style={errTxt}>{errors.childName}</p>}
              </div>
              <div>
                <label style={lbl}>Child Age <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={form.age} onChange={e => onChange('age', e.target.value)} style={{ ...iStyle(errors.age), background: 'white' }}>
                  <option value="">Select age...</option>
                  {AGES.map(a => <option key={a} value={a}>{a} years</option>)}
                </select>
                {errors.age && <p style={errTxt}>{errors.age}</p>}
              </div>
              <div>
                <label style={lbl}>Weekly Session Time <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={form.sessionTime} onChange={e => onChange('sessionTime', e.target.value)} style={{ ...iStyle(errors.sessionTime), background: 'white' }}>
                  <option value="">Select duration...</option>
                  {SESSION_OPTS.map(t => <option key={t} value={t}>{t} minutes</option>)}
                </select>
                {errors.sessionTime && <p style={errTxt}>{errors.sessionTime}</p>}
              </div>
              <div>
                <label style={lbl}>Roll Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={form.rollNo} placeholder="e.g. ABC123" maxLength={6}
                  onChange={e => onChange('rollNo', e.target.value)} style={iStyle(errors.rollNo)} />
                {errors.rollNo && <p style={errTxt}>{errors.rollNo}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2 (individual): Guardian Info ────────────────────────── */}
          {step === 2 && uploadMode === 'individual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Guardian Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={form.countryCode}
                    onChange={(e) => onChange('countryCode', e.target.value)}
                    style={{
                      ...iStyle(),
                      width: '100px',
                      background: 'white',
                    }}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={form.guardianMobile}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    onChange={(e) => onChange('guardianMobile', e.target.value.replace(/\D/g, ''))}
                    style={{ ...iStyle(errors.guardianMobile), flex: 1 }}
                  />
                </div>
                {errors.guardianMobile && <p style={errTxt}>{errors.guardianMobile}</p>}
              </div>
              <div>
                <label style={lbl}>Guardian Email</label>
                <input type="email" value={form.guardianEmail} placeholder="guardian@example.com"
                  onChange={e => onChange('guardianEmail', e.target.value)} style={iStyle(errors.guardianEmail)} />
                {errors.guardianEmail && <p style={errTxt}>{errors.guardianEmail}</p>}
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Optional</p>
              </div>
            </div>
          )}

          {/* ── Step 3 (individual): Review ──────────────────────────────── */}
          {step === 3 && uploadMode === 'individual' && (
            <div>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 0, marginBottom: 20 }}>Review before adding the student.</p>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FieldRow label="School" value={schools.find(s => s.id === form.schoolId)?.name || ''} />
                <FieldRow label="Grade" value={form.grade} />
                <FieldRow label="Child Name" value={form.childName} />
                <FieldRow label="Age" value={form.age ? `${form.age} years` : ''} />
                <FieldRow label="Weekly Session" value={form.sessionTime ? `${form.sessionTime} minutes` : ''} />
                <FieldRow label="Roll Number" value={form.rollNo} />
                <FieldRow label="Guardian Mobile" value={`${form.countryCode} ${form.guardianMobile}`} />
                <FieldRow label="Guardian Email" value={form.guardianEmail || 'Not provided'} />
              </div>
            </div>
          )}

          {/* ── Step 1 (bulk): Upload & Preview ──────────────────────────── */}
          {step === 1 && uploadMode === 'bulk' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>Upload student data for {form.grade}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                    Mandatory columns: Name, Age, Guardian Mobile, Session Time, Roll No
                  </p>
                </div>
                <button onClick={downloadTemplate} style={{
                  border: '2px solid #e2e8f0', borderRadius: 8, padding: '7px 14px',
                  fontSize: 12, fontWeight: 700, color: '#475569', background: 'white',
                  cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif', whiteSpace: 'nowrap',
                }}>
                  Download Template
                </button>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed #cbd5e1', borderRadius: 12, padding: '32px 20px',
                  textAlign: 'center', cursor: 'pointer', background: '#f8fafc',
                  marginBottom: 20, transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2AD5B4')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange}
                  style={{ display: 'none' }} />
                {fileName ? (
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>{fileName}</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{bulkRows.length} row{bulkRows.length !== 1 ? 's' : ''} detected — click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: '0 0 4px' }}>Click to upload Excel file</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Supports .xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>

              {/* Preview table */}
              {bulkRows.length > 0 && (
                <div>
                  {/* Summary Cards */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                    <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Rows</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{bulkRows.length}</div>
                    </div>
                    <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ready to Import</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d', marginTop: 4 }}>{validBulkRows.length}</div>
                    </div>
                    <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Invalid Rows</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c', marginTop: 4 }}>{bulkRows.length - validBulkRows.length}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      Preview
                    </p>
                    {(bulkRows.length - validBulkRows.length) > 0 && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                          background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8,
                          padding: '6px 12px', fontSize: 12, fontWeight: 700,
                          color: '#dc2626', cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif'
                        }}
                      >
                        🔄 Re-upload Excel File
                      </button>
                    )}
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', maxHeight: 280, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
                        <tr>
                          {['Row', 'Name', 'Age', 'Country Code', 'Guardian Mobile', 'Session', 'Email', 'Roll No', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map(row => (
                          <tr key={row.rowNum} style={{ background: row.errors.length > 0 ? '#fff5f5' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{row.rowNum}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{row.childName || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>{row.age || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>{row.countryCode || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>{row.guardianMobile || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>{row.sessionTime || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>{row.guardianEmail || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#1e293b', fontWeight: 600, fontFamily: 'monospace' }}>{row.rollNo || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {row.errors.length === 0 ? (
                                <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 700 }}>Ready</span>
                              ) : (
                                <span style={{ color: '#dc2626', fontSize: 11, fontWeight: 700 }} title={row.errors.join('; ')}>
                                  {row.errors.length} error{row.errors.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {uploadMode === 'bulk' && step === 1 && bulkRows.length > 0 && bulkRows.some(r => r.errors.length > 0) && (
            <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 700, margin: '0 0 12px', textAlign: 'right', width: '100%' }}>
              ⚠️ Cannot import: Please resolve all spreadsheet errors and re-upload.
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <NavBtn onClick={() => step === 0 ? setView('list') : setStep(s => s - 1)}>
              {step === 0 ? 'Cancel' : 'Back'}
            </NavBtn>
            {uploadMode === 'bulk' && step === 1 ? (
              <NavBtn primary onClick={handleBulkImport} disabled={bulkRows.length === 0 || bulkRows.some(r => r.errors.length > 0)}>
                Import {validBulkRows.length > 0 ? `${validBulkRows.length} Student${validBulkRows.length !== 1 ? 's' : ''}` : 'Students'}
              </NavBtn>
            ) : step < currentSteps.length - 1 ? (
              <NavBtn primary onClick={handleNext}>Next</NavBtn>
            ) : (
              <NavBtn primary onClick={handleSubmit}>Add Student</NavBtn>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Edit View (flat form) ──────────────────────────────────────────────────

  const handleEditSave = () => {
    const e: ErrMap = {};
    if (!editForm.schoolId) e.schoolId = 'School is required';
    if (!editForm.grade) e.grade = 'Grade is required';
    if (!editForm.childName.trim()) e.childName = 'Child name is required';
    if (!editForm.age) e.age = 'Age is required';
    if (!editForm.sessionTime) e.sessionTime = 'Session time is required';
    if (!editForm.rollNo.trim()) {
      e.rollNo = 'Roll number is required';
    } else if (!validateRollNo(editForm.rollNo)) {
      e.rollNo = 'Roll number must be 3 letters + 3 digits (e.g. ABC123)';
    }
    if (!editForm.guardianMobile.trim()) e.guardianMobile = 'Guardian mobile is required';
    else if (!isMobile(editForm.guardianMobile)) e.guardianMobile = 'Enter a valid 10-digit mobile number';
    if (editForm.guardianEmail && !isEmail(editForm.guardianEmail)) e.guardianEmail = 'Enter a valid email address';
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;
    setUsers(p => p.map(u => u.id === editUser!.id ? {
      ...u, schoolId: editForm.schoolId, grade: editForm.grade, childName: editForm.childName,
      age: Number(editForm.age), guardianContact: editForm.guardianMobile,
      guardianEmail: editForm.guardianEmail || undefined,
      weeklySession: Number(editForm.sessionTime),
      rollNo: editForm.rollNo,
      countryCode: editForm.countryCode,
    } : u));
    setView('list');
  };

  return (
    <div style={{ padding: 28 }}>
      <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
        ← Back to School Users
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>Edit School User</h1>

      <div style={{ background: 'white', borderRadius: 16, padding: '32px 36px', maxWidth: 580, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={lbl}>School <span style={{ color: '#ef4444' }}>*</span></label>
            <select value={editForm.schoolId} onChange={e => onEditChange('schoolId', e.target.value)} style={{ ...iStyle(editErrors.schoolId), background: 'white' }}>
              <option value="">Select school...</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
            </select>
            {editErrors.schoolId && <p style={errTxt}>{editErrors.schoolId}</p>}
          </div>
          <div>
            <label style={lbl}>Grade <span style={{ color: '#ef4444' }}>*</span></label>
            <select value={editForm.grade} onChange={e => onEditChange('grade', e.target.value)} style={{ ...iStyle(editErrors.grade), background: 'white' }}>
              <option value="">Select grade...</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {editErrors.grade && <p style={errTxt}>{editErrors.grade}</p>}
          </div>
          <div>
            <label style={lbl}>Child Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={editForm.childName} onChange={e => onEditChange('childName', e.target.value)} style={iStyle(editErrors.childName)} />
            {editErrors.childName && <p style={errTxt}>{editErrors.childName}</p>}
          </div>
          <div>
            <label style={lbl}>Child Age <span style={{ color: '#ef4444' }}>*</span></label>
            <select value={editForm.age} onChange={e => onEditChange('age', e.target.value)} style={{ ...iStyle(editErrors.age), background: 'white' }}>
              <option value="">Select age...</option>
              {AGES.map(a => <option key={a} value={a}>{a} years</option>)}
            </select>
            {editErrors.age && <p style={errTxt}>{editErrors.age}</p>}
          </div>
          <div>
            <label style={lbl}>Weekly Session Time <span style={{ color: '#ef4444' }}>*</span></label>
            <select value={editForm.sessionTime} onChange={e => onEditChange('sessionTime', e.target.value)} style={{ ...iStyle(editErrors.sessionTime), background: 'white' }}>
              <option value="">Select duration...</option>
              {SESSION_OPTS.map(t => <option key={t} value={t}>{t} minutes</option>)}
            </select>
            {editErrors.sessionTime && <p style={errTxt}>{editErrors.sessionTime}</p>}
          </div>
          <div>
            <label style={lbl}>Roll Number <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={editForm.rollNo} onChange={e => onEditChange('rollNo', e.target.value)} maxLength={6} style={iStyle(editErrors.rollNo)} />
            {editErrors.rollNo && <p style={errTxt}>{editErrors.rollNo}</p>}
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
            <div>
              <label style={lbl}>Guardian Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={editForm.countryCode}
                  onChange={(e) => onEditChange('countryCode', e.target.value)}
                  style={{
                    ...iStyle(),
                    width: '100px',
                    background: 'white',
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={editForm.guardianMobile}
                  maxLength={10}
                  onChange={(e) => onEditChange('guardianMobile', e.target.value.replace(/\D/g, ''))}
                  style={{ ...iStyle(editErrors.guardianMobile), flex: 1 }}
                />
              </div>
              {editErrors.guardianMobile && <p style={errTxt}>{editErrors.guardianMobile}</p>}
            </div>
          </div>
          <div>
            <label style={lbl}>Guardian Email</label>
            <input type="email" value={editForm.guardianEmail} onChange={e => onEditChange('guardianEmail', e.target.value)} style={iStyle(editErrors.guardianEmail)} />
            {editErrors.guardianEmail && <p style={errTxt}>{editErrors.guardianEmail}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <NavBtn onClick={() => setView('list')}>Cancel</NavBtn>
          <NavBtn primary onClick={handleEditSave}>Save Changes</NavBtn>
        </div>
      </div>
    </div>
  );
}
