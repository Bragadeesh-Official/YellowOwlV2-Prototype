import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Pencil, Trash2 } from 'lucide-react';
import { type AdminUser, type School } from '@/mock/adminData';

type UsageMode = 'general' | 'school';
type View = 'list' | 'create' | 'edit' | 'bulk-upload';

interface FormState {
  childName: string;
  age: string;
  guardianContact: string;
  guardianEmail: string;
  weeklySession: string;
  usageMode: UsageMode | '';
  grade: string;
  schoolId: string;
  rollNo: string;
  countryCode: string;
}

const EMPTY_FORM: FormState = {
  childName: '',
  age: '',
  guardianContact: '',
  guardianEmail: '',
  weeklySession: '',
  usageMode: '',
  grade: '',
  schoolId: '',
  rollNo: '',
  countryCode: '+91',
};

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+61', label: '🇦🇺 +61' },
];

const AGES = [9, 10, 11, 12, 13];
const SESSION_TIMES = [15, 20, 25, 30];
const GRADES = Array.from({ length: 5 }, (_, i) => `Grade ${i + 3}`); // Grade 3 to Grade 7

function genId() {
  return 'u' + Math.random().toString(36).slice(2, 9);
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

function validateRollNo(rollNo: string) {
  return /^[A-Z]{3}\d{3}$/.test(rollNo.trim());
}

interface BulkRow {
  rowNum: number;
  childName: string;
  age: string;
  guardianMobile: string;
  guardianEmail: string;
  sessionTime: string;
  rollNo: string;
  countryCode: string;
  errors: string[];
}

function parseBulkRows(raw: Record<string, unknown>[]): BulkRow[] {
  return raw.map((r, idx) => {
    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const val = r[k] ?? r[k.toLowerCase()] ?? r[k.replace(/ /g, '_')] ?? r[k.replace(/ /g, '')];
        if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
      }
      return '';
    };

    const childName = pick('Child Name', 'Name', 'Student Name', 'Full Name');
    const age = pick('Age', 'Child Age');
    const guardianMobile = pick('Guardian Mobile', 'Mobile', 'Contact', 'Guardian Contact', 'Phone');
    const guardianEmail = pick('Guardian Email', 'Email');
    const sessionTime = pick('Weekly Session Time', 'Session Time', 'Weekly Session', 'Session', 'Time');
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

    if (!age) {
      errors.push('Age is missing');
    } else {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 9 || ageNum > 13) {
        errors.push('Age must be 9–13');
      }
    }

    if (!guardianMobile) {
      errors.push('Mobile is missing');
    } else if (!validatePhone(guardianMobile)) {
      errors.push('Valid 10-digit mobile required');
    }

    if (guardianEmail && !validateEmail(guardianEmail)) {
      errors.push('Enter a valid email');
    }

    if (!sessionTime) {
      errors.push('Session time is missing');
    } else {
      const sessNum = Number(sessionTime);
      if (isNaN(sessNum) || sessNum < 15 || sessNum > 30) {
        errors.push('Session must be 15–30 min');
      }
    }

    if (!rollNo) {
      errors.push('Roll No is missing');
    } else if (!validateRollNo(rollNo)) {
      errors.push('Roll No must be 3 letters + 3 digits (e.g. ABC123)');
    }

    if (!/^\+\d{1,4}$/.test(countryCode)) {
      errors.push('Invalid country code (e.g. +91)');
    }

    return {
      rowNum: idx + 2,
      childName,
      age,
      guardianMobile,
      guardianEmail,
      sessionTime,
      rollNo,
      countryCode,
      errors,
    };
  });
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Child Name', 'Age', 'Guardian Mobile', 'Guardian Email', 'Weekly Session Time', 'Roll No', 'Country Code'],
    ['Arjun Kumar', '10', '9876543210', 'parent@example.com', '20', 'ARJ101', '+91'],
    ['Priya Sharma', '11', '9123456789', 'sharma@example.com', '25', 'PRI202', '+91'],
  ]);
  ws['!cols'] = [{ wch: 22 }, { wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students Template');
  XLSX.writeFile(wb, 'student_bulk_upload_template.xlsx');
}

export default function UsersSection({
  users,
  setUsers,
  schools,
}: {
  users: AdminUser[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  schools: School[];
}) {
  const [view, setView] = useState<View>('list');
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<UsageMode | 'all'>('all');
  const [filterSchoolId, setFilterSchoolId] = useState<string>('all');

  // Single creation/edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Bulk creation states
  const [bulkSchoolId, setBulkSchoolId] = useState('');
  const [bulkGrade, setBulkGrade] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkError, setBulkError] = useState('');
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.childName.toLowerCase().includes(q) ||
      (u.guardianEmail ?? '').toLowerCase().includes(q) ||
      u.guardianContact.includes(q);
    const matchMode = filterMode === 'all' || u.usageMode === filterMode;
    const matchSchool = filterSchoolId === 'all' || (u.usageMode === 'school' && u.schoolId === filterSchoolId);
    return matchSearch && matchMode && matchSchool;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const paginatedUsers = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setView('create');
  };

  const openEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({
      childName: user.childName,
      age: String(user.age),
      guardianContact: user.guardianContact,
      guardianEmail: user.guardianEmail ?? '',
      weeklySession: String(user.weeklySession),
      usageMode: user.usageMode,
      grade: user.grade ?? '',
      schoolId: user.schoolId ?? '',
      rollNo: user.rollNo ?? '',
      countryCode: user.countryCode ?? '+91',
    });
    setErrors({});
    setView('edit');
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.childName.trim()) e.childName = 'Child name is required';
    if (!form.age) e.age = 'Age is required';
    if (!form.guardianContact.trim()) {
      e.guardianContact = 'Guardian contact is required';
    } else if (!validatePhone(form.guardianContact)) {
      e.guardianContact = 'Enter a valid 10-digit mobile number';
    }
    if (!form.guardianEmail.trim()) {
      e.guardianEmail = 'Guardian email is required';
    } else if (!validateEmail(form.guardianEmail)) {
      e.guardianEmail = 'Enter a valid email address';
    }
    if (!form.weeklySession) e.weeklySession = 'Session time is required';
    if (!form.usageMode) e.usageMode = 'Usage mode is required';
    if (form.usageMode === 'school') {
      if (!form.schoolId) e.schoolId = 'Tenant selection is required for school mode';
      if (!form.grade) e.grade = 'Grade is required for school mode';
      if (!form.rollNo.trim()) {
        e.rollNo = 'Roll number is required';
      } else if (!validateRollNo(form.rollNo)) {
        e.rollNo = 'Roll number must be 3 letters + 3 digits (e.g. ABC123)';
      }
    } else {
      if (form.rollNo.trim() && !validateRollNo(form.rollNo)) {
        e.rollNo = 'Roll number must be 3 letters + 3 digits (e.g. ABC123)';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: AdminUser = {
      id: editingId ?? genId(),
      childName: form.childName.trim(),
      age: Number(form.age),
      guardianContact: form.guardianContact.trim(),
      guardianEmail: form.guardianEmail.trim(),
      weeklySession: Number(form.weeklySession),
      usageMode: form.usageMode as UsageMode,
      grade: form.usageMode === 'school' ? form.grade : undefined,
      schoolId: form.usageMode === 'school' ? form.schoolId : undefined,
      rollNo: form.rollNo.trim() || undefined,
      countryCode: form.countryCode,
    };
    if (editingId) {
      setUsers((prev) => prev.map((u) => (u.id === editingId ? payload : u)));
    } else {
      setUsers((prev) => [...prev, payload]);
    }
    setView('list');
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteConfirm(null);
  };

  const setField = (key: keyof FormState, val: string) => {
    const finalVal = key === 'rollNo' ? val.toUpperCase() : val;
    setForm((f) => ({ ...f, [key]: finalVal }));
    setErrors((er) => ({ ...er, [key]: '' }));
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    setBulkError('');
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
        setBulkError('Failed to parse Excel file. Please use the valid template.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkImport = () => {
    if (!bulkSchoolId) {
      setBulkError('Please select a School/Tenant.');
      return;
    }
    if (!bulkGrade) {
      setBulkError('Please select a Grade.');
      return;
    }
    const valid = bulkRows.filter((r) => r.errors.length === 0);
    if (valid.length === 0) {
      setBulkError('No valid student rows found to import.');
      return;
    }

    const newUsers: AdminUser[] = valid.map((r) => ({
      id: genId(),
      childName: r.childName,
      age: Number(r.age),
      guardianContact: r.guardianMobile,
      guardianEmail: r.guardianEmail || undefined,
      weeklySession: Number(r.sessionTime),
      usageMode: 'school',
      grade: bulkGrade,
      schoolId: bulkSchoolId,
      rollNo: r.rollNo,
      countryCode: r.countryCode,
    }));

    setUsers((prev) => [...prev, ...newUsers]);
    setView('list');
  };

  const inputClass = (err?: string) =>
    `w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${err ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-teal-owl'
    }`;

  // ─── 1. Table List View ──────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>Users</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Manage general and school-linked users</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <input
              type="text"
              placeholder="Search by name, email or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 13,
                fontFamily: 'Andika, system-ui, sans-serif',
                color: '#1e293b',
                outline: 'none',
                background: 'white',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#2AD5B4'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>
          <select
            value={filterMode}
            onChange={(e) => {
              setFilterMode(e.target.value as UsageMode | 'all');
              setFilterSchoolId('all');
            }}
            className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-owl transition-all bg-white min-w-[140px]"
          >
            <option value="all">All Modes</option>
            <option value="general">General</option>
            <option value="school">School</option>
          </select>

          {filterMode !== 'general' && (
            <select
              value={filterSchoolId}
              onChange={(e) => setFilterSchoolId(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-owl transition-all bg-white min-w-[160px]"
            >
              <option value="all">All Tenants</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.branch})
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setBulkSchoolId('');
                setBulkGrade('');
                setBulkRows([]);
                setBulkFileName('');
                setBulkError('');
                setView('bulk-upload');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 border-2 border-gray-200 transition-all hover:bg-gray-50 hover:-translate-y-0.5 bg-white cursor-pointer"
            >
              <span>📥</span> Bulk Upload
            </button>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
              style={{ background: '#FFEA11', boxShadow: '0 4px 12px rgba(255,234,17,0.4)' }}
            >
              <span className="text-base">+</span> Add User
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(42,213,180,0.12)', border: '1px solid #E2E8F0' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fffe', borderBottom: '2px solid #e5f9f5' }}>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Child Name</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Age</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Guardian Contact</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Guardian Email</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Session</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Mode</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Tenant</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Grade</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Roll No</th>
                  <th className="text-center px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      <div className="text-3xl mb-2">👥</div>
                      <div>No users found</div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, idx) => {
                    const school = schools.find((s) => s.id === user.schoolId);
                    const schoolName = school ? `${school.name} (${school.branch})` : '—';
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        style={{ background: idx % 2 === 0 ? 'white' : '#fafffe' }}
                      >
                        <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{user.childName}</td>
                        <td className="px-5 py-3.5 text-gray-600">{user.age} yrs</td>
                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{user.countryCode ? `${user.countryCode} ` : ''}{user.guardianContact}</td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{user.guardianEmail}</td>
                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{user.weeklySession} min</td>
                        <td className="px-5 py-3.5">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                            style={
                              user.usageMode === 'school'
                                ? { background: '#eff6ff', color: '#1d4ed8' }
                                : { background: '#f0fdf4', color: '#15803d' }
                            }
                          >
                            {user.usageMode}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{schoolName}</td>
                        <td className="px-5 py-3.5 text-gray-500">{user.grade ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-800 font-mono font-semibold">{user.rollNo ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            {deleteConfirm === user.id ? (
                              <>
                                <span className="text-xs text-red-500 font-semibold mr-1">Delete?</span>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                  No
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEdit(user)}
                                  title="Edit User"
                                  className="w-8 h-8 rounded-lg text-sm flex items-center justify-center border-none bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(user.id)}
                                  title="Delete User"
                                  className="w-8 h-8 rounded-lg text-sm flex items-center justify-center border-none bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                Showing {filtered.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to {Math.min(activePage * pageSize, filtered.length)} of {filtered.length} user{filtered.length !== 1 ? 's' : ''}
              </span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-600 bg-white cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 rounded text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${isCurrent
                          ? 'bg-teal-500 border-teal-500 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1 rounded text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

  // ─── 2. Create / Edit Full-Page View ─────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div style={{ padding: 28 }}>
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors mb-6 cursor-pointer"
        >
          ← Back to Users List
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 24px' }}>
          {view === 'create' ? 'Add New User' : 'Edit User Details'}
        </h1>

        <div style={{ background: 'white', borderRadius: 16, padding: '32px 36px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Child Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Child Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.childName}
                onChange={(e) => setField('childName', e.target.value)}
                placeholder="e.g. Arjun Kumar"
                className={inputClass(errors.childName)}
              />
              {errors.childName && <p className="mt-1 text-xs text-red-500">{errors.childName}</p>}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Child Age <span className="text-red-400">*</span>
              </label>
              <select
                value={form.age}
                onChange={(e) => setField('age', e.target.value)}
                className={inputClass(errors.age) + ' bg-white'}
              >
                <option value="">Select age...</option>
                {AGES.map((a) => (
                  <option key={a} value={a}>{a} years</option>
                ))}
              </select>
              {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age}</p>}
            </div>

            {/* Guardian Contact */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Guardian Contact Number <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={form.countryCode}
                  onChange={(e) => setField('countryCode', e.target.value)}
                  className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white focus:border-teal-owl"
                  style={{ width: '100px' }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={form.guardianContact}
                  onChange={(e) => setField('guardianContact', e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={`${inputClass(errors.guardianContact)} flex-1`}
                />
              </div>
              {errors.guardianContact && <p className="mt-1 text-xs text-red-500">{errors.guardianContact}</p>}
            </div>

            {/* Guardian Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Guardian Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.guardianEmail}
                onChange={(e) => setField('guardianEmail', e.target.value)}
                placeholder="guardian@example.com"
                className={inputClass(errors.guardianEmail)}
              />
              {errors.guardianEmail && <p className="mt-1 text-xs text-red-500">{errors.guardianEmail}</p>}
            </div>

            {/* Weekly Session */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Weekly Session Time <span className="text-red-400">*</span>
              </label>
              <select
                value={form.weeklySession}
                onChange={(e) => setField('weeklySession', e.target.value)}
                className={inputClass(errors.weeklySession) + ' bg-white'}
              >
                <option value="">Select duration...</option>
                {SESSION_TIMES.map((t) => (
                  <option key={t} value={t}>{t} minutes</option>
                ))}
              </select>
              {errors.weeklySession && <p className="mt-1 text-xs text-red-500">{errors.weeklySession}</p>}
            </div>

            {/* Usage Mode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Usage Mode <span className="text-red-400">*</span>
              </label>
              <select
                value={form.usageMode}
                onChange={(e) => {
                  setField('usageMode', e.target.value);
                  if (e.target.value !== 'school') {
                    setField('grade', '');
                    setField('schoolId', '');
                  }
                }}
                className={inputClass(errors.usageMode) + ' bg-white'}
              >
                <option value="">Select mode...</option>
                <option value="general">General</option>
                <option value="school">School</option>
              </select>
              {errors.usageMode && <p className="mt-1 text-xs text-red-500">{errors.usageMode}</p>}
            </div>

            {/* Tenant & Grade — only when school mode */}
            {form.usageMode === 'school' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Select Tenant <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.schoolId}
                    onChange={(e) => setField('schoolId', e.target.value)}
                    className={inputClass(errors.schoolId) + ' bg-white'}
                  >
                    <option value="">Select school/tenant...</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.branch})
                      </option>
                    ))}
                  </select>
                  {errors.schoolId && <p className="mt-1 text-xs text-red-500">{errors.schoolId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Grade <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.grade}
                    onChange={(e) => setField('grade', e.target.value)}
                    className={inputClass(errors.grade) + ' bg-white'}
                  >
                    <option value="">Select grade...</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.grade && <p className="mt-1 text-xs text-red-500">{errors.grade}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Roll Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.rollNo}
                    onChange={(e) => setField('rollNo', e.target.value)}
                    placeholder="e.g. ABC123"
                    maxLength={6}
                    className={inputClass(errors.rollNo)}
                  />
                  {errors.rollNo && <p className="mt-1 text-xs text-red-500">{errors.rollNo}</p>}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{ background: '#FFEA11', boxShadow: '0 4px 12px rgba(255,234,17,0.4)' }}
              >
                {view === 'create' ? 'Add User' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── 3. Bulk Upload Full-Page View ───────────────────────────────────────────
  if (view === 'bulk-upload') {
    return (
      <div style={{ padding: 28 }}>
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors mb-6 cursor-pointer"
        >
          ← Back to Users List
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 24px' }}>
          Bulk Upload Users (Excel)
        </h1>

        <div style={{ background: 'white', borderRadius: 16, padding: '32px 36px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div className="flex flex-col gap-5">
            <p className="text-xs text-gray-500">
              Upload school-linked users using an Excel spreadsheet.
              The sheet must contain the child's name, age (must be between <strong>9 to 13</strong>), guardian mobile, guardian email (optional), and weekly session time (from <strong>15 to 30 min</strong>).
            </p>

            {/* School selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Select Tenant/School <span className="text-red-400">*</span>
              </label>
              <select
                value={bulkSchoolId}
                onChange={(e) => setBulkSchoolId(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white focus:border-teal-owl"
              >
                <option value="">Select school...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.branch})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Select Grade <span className="text-red-400">*</span>
              </label>
              <select
                value={bulkGrade}
                onChange={(e) => setBulkGrade(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white focus:border-teal-owl"
              >
                <option value="">Select grade...</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Template Download & File Upload */}
            <div className="border-t border-dashed border-gray-200 pt-4 mt-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Excel File Upload</span>
                <button
                  onClick={downloadTemplate}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  ⬇️ Download Template
                </button>
              </div>

              <div
                onClick={() => bulkFileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-teal-owl bg-gray-50 transition-colors"
              >
                <input
                  type="file"
                  ref={bulkFileRef}
                  accept=".xlsx"
                  onChange={handleBulkFileChange}
                  className="hidden"
                />
                {bulkFileName ? (
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{bulkFileName}</div>
                    <div className="text-xs text-gray-500 mt-1">{bulkRows.length} rows loaded — Click to change file</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Click to upload spreadsheet (.xlsx)</div>
                    <div className="text-xs text-gray-400 mt-1">Columns: Child Name, Age, Guardian Mobile, Guardian Email, Weekly Session Time, Roll No, Country Code</div>
                  </div>
                )}
              </div>

              {bulkError && <p className="text-xs text-red-500 font-medium mt-1">{bulkError}</p>}
            </div>

            {/* Rows preview */}
            {bulkRows.length > 0 && (
              <div className="border-t border-gray-200 pt-4 flex flex-col gap-2">
                {/* Summary Cards */}
                <div className="flex gap-4 mb-2">
                  <div className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Rows</div>
                    <div className="text-lg font-bold text-gray-800 mt-1">{bulkRows.length}</div>
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Ready to Import</div>
                    <div className="text-lg font-bold text-green-800 mt-1">{bulkRows.filter((r) => r.errors.length === 0).length}</div>
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-red-50 border border-red-200">
                    <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Invalid Rows</div>
                    <div className="text-lg font-bold text-red-800 mt-1">{bulkRows.length - bulkRows.filter((r) => r.errors.length === 0).length}</div>
                  </div>
                </div>

                <div className="text-xs font-bold text-gray-700">
                  Preview
                </div>
                <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 sticky top-0 border-b border-gray-200">
                        <th className="p-2 font-semibold text-gray-600">Row</th>
                        <th className="p-2 font-semibold text-gray-600">Child Name</th>
                        <th className="p-2 font-semibold text-gray-600">Age</th>
                        <th className="p-2 font-semibold text-gray-600">Country Code</th>
                        <th className="p-2 font-semibold text-gray-600">Mobile</th>
                        <th className="p-2 font-semibold text-gray-600">Session</th>
                        <th className="p-2 font-semibold text-gray-600">Roll No</th>
                        <th className="p-2 font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.map((r) => (
                        <tr key={r.rowNum} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="p-2 text-gray-400">{r.rowNum}</td>
                          <td className="p-2 font-medium text-gray-800">{r.childName || '—'}</td>
                          <td className="p-2 text-gray-600">{r.age || '—'}</td>
                          <td className="p-2 text-gray-600">{r.countryCode || '—'}</td>
                          <td className="p-2 text-gray-600">{r.guardianMobile || '—'}</td>
                          <td className="p-2 text-gray-600">{r.sessionTime ? r.sessionTime + ' min' : '—'}</td>
                          <td className="p-2 text-gray-800 font-mono font-semibold">{r.rollNo || '—'}</td>
                          <td className="p-2">
                            {r.errors.length > 0 ? (
                              <span className="text-red-500 font-bold" title={r.errors.join(', ')}>
                                ❌ {r.errors.join('; ')}
                              </span>
                            ) : (
                              <span className="text-green-600 font-bold">Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            {bulkRows.length > 0 && (
              <div className="text-right w-full mt-2">
                {bulkRows.some((r) => r.errors.length > 0) && (
                  <p className="text-sm text-red-500 font-semibold mb-1">
                    ⚠️ Cannot import: Please resolve all spreadsheet errors and re-upload.
                  </p>
                )}
                {(!bulkSchoolId || !bulkGrade) && (
                  <p className="text-sm text-amber-600 font-semibold mb-1">
                    ⚠️ Please select school and grade above.
                  </p>
                )}
                {bulkError && (
                  <p className="text-sm text-red-500 font-semibold mb-1">
                    ⚠️ {bulkError}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <button
                onClick={() => setView('list')}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!bulkSchoolId || !bulkGrade || bulkRows.length === 0 || bulkRows.some((r) => r.errors.length > 0)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 cursor-pointer"
                style={
                  (!bulkSchoolId || !bulkGrade || bulkRows.length === 0 || bulkRows.some((r) => r.errors.length > 0))
                    ? { background: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed', opacity: 0.6 }
                    : { background: '#FFEA11', color: '#1a1a1a', boxShadow: '0 4px 12px rgba(255,234,17,0.4)' }
                }
              >
                Import Users ({bulkRows.filter((r) => r.errors.length === 0).length})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
