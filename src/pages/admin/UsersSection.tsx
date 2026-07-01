import { useState, useRef, useEffect } from 'react';
import { MOCK_ADMIN_USERS, type AdminUser } from '@/mock/adminData';

type UsageMode = 'general' | 'school';

interface FormState {
  childName: string;
  age: string;
  guardianContact: string;
  guardianEmail: string;
  weeklySession: string;
  usageMode: UsageMode | '';
  grade: string;
}

const EMPTY_FORM: FormState = {
  childName: '',
  age: '',
  guardianContact: '',
  guardianEmail: '',
  weeklySession: '',
  usageMode: '',
  grade: '',
};

const AGES = Array.from({ length: 14 }, (_, i) => i + 5); // 5–18
const SESSION_TIMES = [15, 20, 25, 30];
const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

function genId() {
  return 'u' + Math.random().toString(36).slice(2, 9);
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

export default function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<UsageMode | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [showModal]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.childName.toLowerCase().includes(q) ||
      (u.guardianEmail ?? '').toLowerCase().includes(q) ||
      u.guardianContact.includes(q);
    const matchMode = filterMode === 'all' || u.usageMode === filterMode;
    return matchSearch && matchMode;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
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
    });
    setErrors({});
    setShowModal(true);
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
    if (form.usageMode === 'school' && !form.grade) e.grade = 'Grade is required for school mode';
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
    };
    if (editingId) {
      setUsers((prev) => prev.map((u) => (u.id === editingId ? payload : u)));
    } else {
      setUsers((prev) => [...prev, payload]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteConfirm(null);
  };

  const setField = (key: keyof FormState, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((er) => ({ ...er, [key]: '' }));
  };

  const inputClass = (err?: string) =>
    `w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
      err ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-teal-owl'
    }`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-teal-owl transition-all"
          />
        </div>
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as UsageMode | 'all')}
          className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-owl transition-all bg-white min-w-[140px]"
        >
          <option value="all">All Modes</option>
          <option value="general">General</option>
          <option value="school">School</option>
        </select>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5"
          style={{ background: '#FFEA11', boxShadow: '0 4px 12px rgba(255,234,17,0.4)' }}
        >
          <span className="text-base">+</span> Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(42,213,180,0.12)' }}>
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
                <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Grade</th>
                <th className="text-center px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="text-3xl mb-2">👥</div>
                    <div>No users found</div>
                  </td>
                </tr>
              ) : (
                filtered.map((user, idx) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    style={{ background: idx % 2 === 0 ? 'white' : '#fafffe' }}
                  >
                    <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{user.childName}</td>
                    <td className="px-5 py-3.5 text-gray-600">{user.age} yrs</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{user.guardianContact}</td>
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
                    <td className="px-5 py-3.5 text-gray-500">{user.grade ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        {deleteConfirm === user.id ? (
                          <>
                            <span className="text-xs text-red-500 font-semibold mr-1">Delete?</span>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openEdit(user)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:-translate-y-0.5"
                              style={{ background: '#2AD5B4' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-400 hover:bg-red-500 transition-all hover:-translate-y-0.5"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50">
          {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Child Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Child Name <span className="text-red-400">*</span>
                </label>
                <input
                  ref={firstInputRef}
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
                <input
                  type="tel"
                  value={form.guardianContact}
                  onChange={(e) => setField('guardianContact', e.target.value)}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={inputClass(errors.guardianContact)}
                />
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
                    if (e.target.value !== 'school') setField('grade', '');
                  }}
                  className={inputClass(errors.usageMode) + ' bg-white'}
                >
                  <option value="">Select mode...</option>
                  <option value="general">General</option>
                  <option value="school">School</option>
                </select>
                {errors.usageMode && <p className="mt-1 text-xs text-red-500">{errors.usageMode}</p>}
              </div>

              {/* Grade — only when school mode */}
              {form.usageMode === 'school' && (
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
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                  style={{ background: '#FFEA11', boxShadow: '0 4px 12px rgba(255,234,17,0.4)' }}
                >
                  {editingId ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
