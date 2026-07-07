import { useState } from 'react';
import { type AdminUser } from '@/mock/adminData';
import Stepper from './Stepper';
import { Pencil, Trash2 } from 'lucide-react';

type View = 'list' | 'create' | 'edit';

interface UserForm {
  childName: string;
  age: string;
  sessionTime: string;
  guardianMobile: string;
  guardianEmail: string;
  countryCode: string;
}

const EMPTY: UserForm = { childName: '', age: '', sessionTime: '', guardianMobile: '', guardianEmail: '', countryCode: '+91' };
const STEPS = ['Child Info', 'Guardian Info', 'Review'];
const AGES = [9, 10, 11, 12, 13];
const SESSION_OPTS = [15, 20, 25, 30];

function genId() { return 'u' + Math.random().toString(36).slice(2, 9); }
function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isMobile(v: string) { return /^[6-9]\d{9}$/.test(v.trim()); }

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+61', label: '🇦🇺 +61' },
];

type ErrMap = Partial<Record<keyof UserForm, string>>;

function validateStep(step: number, form: UserForm): ErrMap {
  const e: ErrMap = {};
  if (step === 0) {
    if (!form.childName.trim()) e.childName = 'Child name is required';
    if (!form.age) e.age = 'Age is required';
    if (!form.sessionTime) e.sessionTime = 'Session time is required';
  }
  if (step === 1) {
    if (!form.guardianMobile.trim()) e.guardianMobile = 'Guardian mobile is required';
    else if (!isMobile(form.guardianMobile)) e.guardianMobile = 'Enter a valid 10-digit mobile number';
    if (form.guardianEmail && !isEmail(form.guardianEmail)) e.guardianEmail = 'Enter a valid email address';
  }
  return e;
}

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

function NavBtn({ onClick, children, primary }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button onClick={onClick} style={{
      border: primary ? 'none' : '2px solid #e2e8f0',
      borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif',
      background: primary ? '#FFEA11' : 'transparent',
      color: primary ? '#1a1a1a' : '#64748b',
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

function ModeBadge({ mode }: { mode: 'general' | 'school' }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: mode === 'general' ? '#f0fdf4' : '#eff6ff',
      color: mode === 'general' ? '#15803d' : '#1d4ed8',
      textTransform: 'capitalize',
    }}>
      {mode}
    </span>
  );
}

function UserFormStep0({ form, errors, onChange }: { form: UserForm; errors: ErrMap; onChange: (k: keyof UserForm, v: string) => void }) {
  return (
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
    </div>
  );
}

function UserFormStep1({ form, errors, onChange }: { form: UserForm; errors: ErrMap; onChange: (k: keyof UserForm, v: string) => void }) {
  return (
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
  );
}

export default function GeneralUsersSection({ users, setUsers }: {
  users: AdminUser[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
}) {
  const [view, setView] = useState<View>('list');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Create stepper
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserForm>(EMPTY);
  const [errors, setErrors] = useState<ErrMap>({});

  // Edit form
  const [editForm, setEditForm] = useState<UserForm>(EMPTY);
  const [editErrors, setEditErrors] = useState<ErrMap>({});

  const onChange = (k: keyof UserForm, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };
  const onEditChange = (k: keyof UserForm, v: string) => { setEditForm(f => ({ ...f, [k]: v })); setEditErrors(e => ({ ...e, [k]: '' })); };

  const generalUsers = users.filter(u => u.usageMode === 'general');

  const filtered = generalUsers.filter(u => {
    const q = search.toLowerCase();
    return u.childName.toLowerCase().includes(q) || u.guardianContact.includes(q) || (u.guardianEmail ?? '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const paginatedUsers = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);

  // ─── List View ──────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>General Users</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Manage general (non-school) user accounts</p>
          </div>
          <button onClick={() => { setForm(EMPTY); setErrors({}); setStep(0); setView('create'); }}
            style={{
              background: '#2AD5B4', border: 'none', borderRadius: 10,
              padding: '10px 22px', fontSize: 13, fontWeight: 700,
              color: 'white', cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif',
              boxShadow: '0 4px 14px rgba(42, 213, 180, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            Add User
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 420 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }}>🔍</span>
            <input
              type="text" value={search} placeholder="Search by name, mobile or email..."
              onChange={e => setSearch(e.target.value)}
              style={{ ...iStyle(), paddingLeft: 40, paddingRight: 14, background: 'white' }}
            />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(42,213,180,0.06)', border: '1px solid rgba(42, 213, 180, 0.08)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                  {['Child Name', 'Age', 'Guardian Mobile', 'Guardian Email', 'Session', 'Mode', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Actions' ? 'center' : 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>No users found</td></tr>
                ) : paginatedUsers.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{u.childName}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{u.age} yrs</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{u.countryCode ? `${u.countryCode} ` : ''}{u.guardianContact}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{u.guardianEmail || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{u.weeklySession} min</td>
                    <td style={{ padding: '14px 16px' }}><ModeBadge mode={u.usageMode} /></td>
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
                            setEditForm({ childName: u.childName, age: String(u.age), sessionTime: String(u.weeklySession), guardianMobile: u.guardianContact, guardianEmail: u.guardianEmail ?? '', countryCode: u.countryCode ?? '+91' });
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
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Showing {filtered.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to {Math.min(activePage * pageSize, filtered.length)} of {filtered.length} user{filtered.length !== 1 ? 's' : ''}
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
        weeklySession: Number(form.sessionTime), usageMode: 'general',
        countryCode: form.countryCode,
      }]);
      setView('list');
    };

    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
          ← Back to General Users
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>Add General User</h1>

        <div style={{ background: 'white', borderRadius: 16, padding: '32px 36px', maxWidth: 580, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Stepper steps={STEPS} current={step} />

          {step === 0 && <UserFormStep0 form={form} errors={errors} onChange={onChange} />}
          {step === 1 && <UserFormStep1 form={form} errors={errors} onChange={onChange} />}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 0, marginBottom: 20 }}>Review before adding the user.</p>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FieldRow label="Child Name" value={form.childName} />
                <FieldRow label="Age" value={form.age ? `${form.age} years` : ''} />
                <FieldRow label="Weekly Session" value={form.sessionTime ? `${form.sessionTime} minutes` : ''} />
                <FieldRow label="Guardian Mobile" value={`${form.countryCode} ${form.guardianMobile}`} />
                <FieldRow label="Guardian Email" value={form.guardianEmail || 'Not provided'} />
                <FieldRow label="Usage Mode" value="General" />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <NavBtn onClick={() => step === 0 ? setView('list') : setStep(s => s - 1)}>
              {step === 0 ? 'Cancel' : 'Back'}
            </NavBtn>
            {step < STEPS.length - 1
              ? <NavBtn primary onClick={handleNext}>Next</NavBtn>
              : <NavBtn primary onClick={handleSubmit}>Add User</NavBtn>
            }
          </div>
        </div>
      </div>
    );
  }

  // ─── Edit View (flat form) ──────────────────────────────────────────────────

  const handleEditSave = () => {
    const e0 = validateStep(0, editForm);
    const e1 = validateStep(1, editForm);
    const e = { ...e0, ...e1 };
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;
    setUsers(p => p.map(u => u.id === editUser!.id ? {
      ...u, childName: editForm.childName, age: Number(editForm.age),
      guardianContact: editForm.guardianMobile, guardianEmail: editForm.guardianEmail || undefined,
      weeklySession: Number(editForm.sessionTime),
      countryCode: editForm.countryCode,
    } : u));
    setView('list');
  };

  return (
    <div style={{ padding: 28 }}>
      <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
        ← Back to General Users
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>Edit User</h1>

      <div style={{ background: 'white', borderRadius: 16, padding: '32px 36px', maxWidth: 580, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <UserFormStep0 form={editForm} errors={editErrors} onChange={onEditChange} />
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
            <UserFormStep1 form={editForm} errors={editErrors} onChange={onEditChange} />
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
