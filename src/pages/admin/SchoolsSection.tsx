import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { type School, type AdminUser } from '@/mock/adminData';
import Stepper from './Stepper';
import { Eye, Pencil, Trash2 } from 'lucide-react';

type Board = 'CBSE' | 'Stateboard' | 'ICSE' | 'IB';
type View = 'list' | 'create' | 'edit' | 'view-tenant' | 'add-student' | 'bulk-upload';

interface SchoolForm {
  name: string;
  branch: string;
  board: Board | '';
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  numberOfGrades: string;
  gradeNames: string[];
}

const EMPTY_FORM: SchoolForm = {
  name: '',
  branch: '',
  board: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  contactEmail: '',
  contactPhone: '',
  numberOfGrades: '',
  gradeNames: [],
};
const CREATE_STEPS = ['Tenant Details', 'Grades Setup', 'Review'];

const GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
const AGES = [9, 10, 11, 12, 13];
const SESSION_OPTS = [15, 20, 25, 30];

const getTenantGrades = (tenant: School | null): string[] => {
  if (!tenant) return [];
  if (tenant.gradeNames && tenant.gradeNames.length > 0) {
    return tenant.gradeNames;
  }
  const count = tenant.numberOfGrades || 0;
  if (count > 0) {
    return Array.from({ length: count }, (_, i) => `Grade ${i + 3}`);
  }
  return GRADES;
};

function genId(prefix: 's' | 'u') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

const iStyle = (err?: string): React.CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  border: `2px solid ${err ? '#fca5a5' : '#e2e8f0'}`,
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 14,
  fontFamily: 'Andika, system-ui, sans-serif',
  outline: 'none',
  background: 'white',
  color: '#1e293b',
  display: 'block',
});

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
  marginBottom: 6,
};

const errTxt: React.CSSProperties = { color: '#ef4444', fontSize: 12, marginTop: 4 };

type ErrMap = Partial<Record<keyof SchoolForm, string>>;

function validateForm(f: SchoolForm): ErrMap {
  const e: ErrMap = {};
  if (!f.name.trim()) e.name = 'Tenant name is required';
  if (!f.branch.trim()) e.branch = 'Branch is required';
  if (!f.board) e.board = 'Board is required';
  if (!f.addressLine1.trim()) e.addressLine1 = 'Address Line 1 is required';
  if (!f.city.trim()) e.city = 'City is required';
  if (!f.state.trim()) e.state = 'State is required';
  if (!f.pincode.trim()) {
    e.pincode = 'Pincode is required';
  } else if (!/^\d{6}$/.test(f.pincode.trim())) {
    e.pincode = 'Pincode must be exactly 6 digits';
  }
  if (f.contactEmail && !/^[^@]+@[^@]+\.[^@]+$/.test(f.contactEmail.trim())) e.contactEmail = 'Enter a valid email address';
  if (f.contactPhone && !/^\d{10}$/.test(f.contactPhone.trim())) e.contactPhone = 'Enter a valid 10-digit phone number';
  if (f.numberOfGrades && (isNaN(Number(f.numberOfGrades)) || Number(f.numberOfGrades) < 1 || Number(f.numberOfGrades) > 12)) e.numberOfGrades = 'Number of grades must be between 1 and 12';
  return e;
}

function BoardBadge({ board }: { board: Board }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: board === 'CBSE' ? '#ecfdf5' : '#fefce8',
      color: board === 'CBSE' ? '#065f46' : '#713f12',
    }}>
      {board}
    </span>
  );
}

function NavBtn({ onClick, children, primary, disabled }: { onClick: () => void; children: React.ReactNode; primary?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: disabled ? 'none' : (primary ? 'none' : '2px solid #e2e8f0'),
      borderRadius: 12,
      padding: '10px 24px',
      fontSize: 13,
      fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'Andika, system-ui, sans-serif',
      background: disabled ? '#e2e8f0' : (primary ? '#FFEA11' : 'transparent'),
      color: disabled ? '#94a3b8' : (primary ? '#1a1a1a' : '#64748b'),
      boxShadow: (primary && !disabled) ? '0 4px 12px rgba(255, 234, 17, 0.35)' : 'none',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.2s',
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

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Name', 'Guardian Mobile', 'Guardian Email'],
    ['Arjun Kumar', '9876543210', 'parent@example.com'],
    ['Priya Sharma', '9123456789', 'sharma@example.com'],
  ]);
  ws['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 25 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, 'student_bulk_upload_template.xlsx');
}

// ─── Tenant Form Fields ──────────────────────────────────────────────────────
// ─── Tenant Form Fields ──────────────────────────────────────────────────────
function SchoolFormFields({ form, errors, onChange, hideGrades, showGradesOnly }: {
  form: SchoolForm;
  errors: ErrMap;
  onChange: (key: keyof SchoolForm, val: any) => void;
  hideGrades?: boolean;
  showGradesOnly?: boolean;
}) {
  if (showGradesOnly) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={lbl}>Number of Grades</label>
          <input type="number" min={1} max={12} value={form.numberOfGrades} placeholder="e.g. 5"
            onChange={e => {
              const val = e.target.value;
              onChange('numberOfGrades', val);
              const num = Number(val);
              if (!isNaN(num) && num > 0) {
                const newNames = [...form.gradeNames];
                if (newNames.length > num) {
                  onChange('gradeNames', newNames.slice(0, num));
                } else {
                  while (newNames.length < num) {
                    newNames.push(`Grade ${newNames.length + 3}`);
                  }
                  onChange('gradeNames', newNames);
                }
              }
            }} style={iStyle(errors.numberOfGrades)} />
          {errors.numberOfGrades && <p style={errTxt}>{errors.numberOfGrades}</p>}
        </div>

      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Row 1: Name + Branch */}
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Tenant Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" value={form.name} placeholder="e.g. Sunrise Academy"
            onChange={e => onChange('name', e.target.value)} style={iStyle(errors.name)} />
          {errors.name && <p style={errTxt}>{errors.name}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Branch <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" value={form.branch} placeholder="e.g. Anna Nagar"
            onChange={e => onChange('branch', e.target.value)} style={iStyle(errors.branch)} />
          {errors.branch && <p style={errTxt}>{errors.branch}</p>}
        </div>
      </div>
      {/* Row 2: Board (+ Number of Grades if not hideGrades) */}
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Board <span style={{ color: '#ef4444' }}>*</span></label>
          <select value={form.board} onChange={e => onChange('board', e.target.value)}
            style={{ ...iStyle(errors.board), background: 'white' }}>
            <option value="">Select board...</option>
            <option value="CBSE">CBSE</option>
            <option value="Stateboard">Stateboard</option>
            <option value="ICSE">ICSE</option>
            <option value="IB">IB</option>
          </select>
          {errors.board && <p style={errTxt}>{errors.board}</p>}
        </div>
        {!hideGrades && (
          <div style={{ flex: 1 }}>
            <label style={lbl}>Number of Grades</label>
            <input type="number" min={1} max={12} value={form.numberOfGrades} placeholder="e.g. 5"
              onChange={e => {
                const val = e.target.value;
                onChange('numberOfGrades', val);
                const num = Number(val);
                if (!isNaN(num) && num > 0) {
                  const newNames = [...form.gradeNames];
                  if (newNames.length > num) {
                    onChange('gradeNames', newNames.slice(0, num));
                  } else {
                    while (newNames.length < num) {
                      newNames.push(`Grade ${newNames.length + 3}`);
                    }
                    onChange('gradeNames', newNames);
                  }
                }
              }} style={iStyle(errors.numberOfGrades)} />
            {errors.numberOfGrades && <p style={errTxt}>{errors.numberOfGrades}</p>}
          </div>
        )}
      </div>

      {/* Row 3: Address Line 1 + Address Line 2 */}
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Address Line 1 <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" value={form.addressLine1} placeholder="Street, building name"
            onChange={e => onChange('addressLine1', e.target.value)} style={iStyle(errors.addressLine1)} />
          {errors.addressLine1 && <p style={errTxt}>{errors.addressLine1}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Address Line 2</label>
          <input type="text" value={form.addressLine2} placeholder="Apartment, suite, unit (optional)"
            onChange={e => onChange('addressLine2', e.target.value)} style={iStyle()} />
        </div>
      </div>

      {/* Row 3b: City + State + Pincode */}
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>City <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" value={form.city} placeholder="e.g. Chennai"
            onChange={e => onChange('city', e.target.value)} style={iStyle(errors.city)} />
          {errors.city && <p style={errTxt}>{errors.city}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>State <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" value={form.state} placeholder="e.g. Tamil Nadu"
            onChange={e => onChange('state', e.target.value)} style={iStyle(errors.state)} />
          {errors.state && <p style={errTxt}>{errors.state}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Pincode <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" value={form.pincode} placeholder="e.g. 600040" maxLength={6}
            onChange={e => onChange('pincode', e.target.value.replace(/\D/g, ''))} style={iStyle(errors.pincode)} />
          {errors.pincode && <p style={errTxt}>{errors.pincode}</p>}
        </div>
      </div>


      {/* Row 4: Contact Email + Contact Phone */}
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>School Contact Email</label>
          <input type="email" value={form.contactEmail} placeholder="e.g. school@example.com"
            onChange={e => onChange('contactEmail', e.target.value)} style={iStyle(errors.contactEmail)} />
          {errors.contactEmail && <p style={errTxt}>{errors.contactEmail}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>School Contact Phone</label>
          <input type="text" value={form.contactPhone} placeholder="e.g. 9876543210"
            onChange={e => onChange('contactPhone', e.target.value)} style={iStyle(errors.contactPhone)} />
          {errors.contactPhone && <p style={errTxt}>{errors.contactPhone}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SchoolsSection({ schools, setSchools, users, setUsers }: {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  users: AdminUser[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
}) {
  const [view, setView] = useState<View>('list');
  const [selectedTenant, setSelectedTenant] = useState<School | null>(null);
  const [editSchool, setEditSchool] = useState<School | null>(null);

  // List filters
  const [search, setSearch] = useState('');
  const [filterBoard, setFilterBoard] = useState<Board | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Create/Edit states
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SchoolForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<ErrMap>({});
  const [editForm, setEditForm] = useState<SchoolForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<ErrMap>({});

  // View Tenant state
  const [activeGradeTab, setActiveGradeTab] = useState<string>('All');

  // Add student Form states
  const [studentGrade, setStudentGrade] = useState<string>('');
  const [studentForm, setStudentForm] = useState({
    childName: '',
    age: '9',
    guardianContact: '',
    guardianEmail: '',
    weeklySession: '20'
  });
  const [studentErrors, setStudentErrors] = useState<Record<string, string>>({});

  // Bulk Upload states
  const [bulkGrade, setBulkGrade] = useState<string>('');
  const [bulkSession, setBulkSession] = useState<string>('20');
  const [fileName, setFileName] = useState('');
  const [bulkRows, setBulkRows] = useState<{ childName: string; guardianMobile: string; guardianEmail?: string; errors: string[] }[]>([]);
  const [bulkError, setBulkError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const changeForm = (key: keyof SchoolForm, val: any) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const changeEditForm = (key: keyof SchoolForm, val: any) => {
    setEditForm(f => ({ ...f, [key]: val }));
    setEditErrors(e => ({ ...e, [key]: '' }));
  };

  const filtered = schools.filter(s => {
    const q = search.toLowerCase();
    return (s.name.toLowerCase().includes(q) || s.branch.toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
      && (filterBoard === 'all' || s.board === filterBoard);
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const paginatedSchools = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setBulkError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      try {
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { raw: false, defval: '' });

        // Parse rows
        const parsed = rows.map((r) => {
          const pick = (...keys: string[]) => {
            for (const k of keys) {
              const val = r[k] ?? r[k.toLowerCase()] ?? r[k.replace(/ /g, '_')] ?? r[k.replace(/ /g, '')];
              if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
            }
            return '';
          };

          const childName = pick('Name', 'Child Name', 'Student Name', 'Full Name');
          const guardianMobile = pick('Guardian Mobile', 'Mobile', 'Contact', 'Guardian Contact', 'Phone');
          const guardianEmail = pick('Guardian Email', 'Email');

          const errors: string[] = [];
          if (!childName) errors.push('Name is missing');
          if (!guardianMobile) errors.push('Mobile number is missing');
          else if (!/^\d{10}$/.test(guardianMobile)) errors.push('Mobile must be exactly 10 digits');

          return { childName, guardianMobile, guardianEmail, errors };
        });

        setBulkRows(parsed);
      } catch {
        setBulkError('Failed to parse Excel file. Please use the template.');
        setBulkRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ─── 1. List View ──────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>Tenants</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Manage school/tenant accounts</p>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setStep(0); setView('create'); }}
            style={{
              background: '#FFEA11', border: 'none', borderRadius: 12,
              padding: '10px 22px', fontSize: 13, fontWeight: 700,
              color: '#1a1a1a', cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif',
              boxShadow: '0 4px 14px rgba(255, 234, 17, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            Add Tenant
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <input
              type="text" value={search} placeholder="Search tenants..."
              onChange={e => setSearch(e.target.value)}
              style={{ ...iStyle(), paddingLeft: 10, paddingRight: 14, background: 'white' }}
            />
          </div>
          <select value={filterBoard} onChange={e => setFilterBoard(e.target.value as Board | 'all')}
            style={{ ...iStyle(), width: 'auto', padding: '11px 16px', background: 'white' }}>
            <option value="all">All Boards</option>
            <option value="CBSE">CBSE</option>
            <option value="Stateboard">Stateboard</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                  {['Tenant Name', 'Branch', 'Board', 'Number of Grades', 'Address', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Actions' ? 'center' : 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>No tenants found</td></tr>
                ) : paginatedSchools.map((s, i) => {
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{s.branch}</td>
                      <td style={{ padding: '14px 16px' }}><BoardBadge board={s.board} /></td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(42, 213, 180, 0.15)',
                          color: '#20a78c'
                        }}>
                          {s.numberOfGrades || 0} Grade{(s.numberOfGrades || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {deleteId === s.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Delete?</span>
                            <button onClick={() => { setSchools(p => p.filter(x => x.id !== s.id)); setDeleteId(null); }}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#ef4444', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif' }}>Yes</button>
                            <button onClick={() => setDeleteId(null)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#e2e8f0', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif' }}>No</button>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', gap: 8 }}>
                            <button onClick={() => { setSelectedTenant(s); setActiveGradeTab('All'); setView('view-tenant'); }}
                              title="View Details"
                              style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#e0f2fe', color: '#0369a1', cursor: 'pointer', transition: 'all 0.2s' }}>
                              <Eye size={16} />
                            </button>
                            <button onClick={() => {
                              setEditSchool(s);
                              setEditForm({
                                name: s.name,
                                branch: s.branch,
                                board: s.board,
                                addressLine1: s.addressLine1 || s.address.split(',')[0] || '',
                                addressLine2: s.addressLine2 || '',
                                city: s.city || 'Chennai',
                                state: s.state || 'Tamil Nadu',
                                pincode: s.pincode || '600040',
                                contactEmail: s.contactEmail ?? '',
                                contactPhone: s.contactPhone ?? '',
                                numberOfGrades: s.numberOfGrades != null ? String(s.numberOfGrades) : '',
                                gradeNames: s.gradeNames || Array.from({ length: s.numberOfGrades || 0 }, (_, idx) => `Grade ${idx + 3}`),
                              });
                              setEditErrors({});
                              setView('edit');
                            }}
                              title="Edit Tenant"
                              style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#e2e8f0', color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }}>
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => setDeleteId(s.id)}
                              title="Delete Tenant"
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
                Showing {filtered.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to {Math.min(activePage * pageSize, filtered.length)} of {filtered.length} school{filtered.length !== 1 ? 's' : ''}
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

  // ─── 2. Create Tenant View (Stepper) ──────────────────────────────────────────
  if (view === 'create') {
    const handleNext = () => {
      let e: ErrMap = {};
      if (step === 0) {
        // Validate Tenant Details (exclude numberOfGrades)
        const allErrors = validateForm(form);
        const { numberOfGrades, ...step0Errors } = allErrors;
        e = step0Errors;
      } else if (step === 1) {
        // Validate Grades Setup
        if (!form.numberOfGrades) {
          e.numberOfGrades = 'Number of grades is required';
        } else {
          const num = Number(form.numberOfGrades);
          if (isNaN(num) || num < 1 || num > 12) {
            e.numberOfGrades = 'Number of grades must be between 1 and 12';
          }
        }
      }
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(s => s + 1);
    };

    const handleSubmit = () => {
      const addressString = `${form.addressLine1}${form.addressLine2 ? ', ' + form.addressLine2 : ''}, ${form.city}, ${form.state} - ${form.pincode}`;
      const newTenant = {
        id: genId('s'),
        name: form.name,
        branch: form.branch,
        board: form.board as Board,
        address: addressString,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        numberOfGrades: form.numberOfGrades ? Number(form.numberOfGrades) : undefined,
        gradeNames: form.gradeNames.map((name, i) => name || `Grade ${i + 3}`),
      };
      setSchools(p => [...p, newTenant]);
      setSelectedTenant(newTenant);
      setView('view-tenant');
    };

    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => setView('list')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
          ← Back to Tenants
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>Add New Tenant</h1>

        <div style={{ background: 'white', borderRadius: 16, padding: '32px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
          <Stepper steps={CREATE_STEPS} current={step} />

          {step === 0 && (
            <SchoolFormFields form={form} errors={errors} onChange={changeForm} hideGrades={true} />
          )}

          {step === 1 && (
            <SchoolFormFields form={form} errors={errors} onChange={changeForm} showGradesOnly={true} />
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 0, marginBottom: 20 }}>
                Review the details before adding the school tenant.
              </p>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FieldRow label="Tenant Name" value={form.name} />
                <FieldRow label="Branch" value={form.branch} />
                <FieldRow label="Board" value={form.board} />
                <FieldRow label="Address Line 1" value={form.addressLine1} />
                {form.addressLine2 && <FieldRow label="Address Line 2" value={form.addressLine2} />}
                <FieldRow label="City" value={form.city} />
                <FieldRow label="State" value={form.state} />
                <FieldRow label="Pincode" value={form.pincode} />
                {form.contactEmail && <FieldRow label="Contact Email" value={form.contactEmail} />}
                {form.contactPhone && <FieldRow label="Contact Phone" value={form.contactPhone} />}
                {form.numberOfGrades && <FieldRow label="Number of Grades" value={form.numberOfGrades} />}
                {form.gradeNames && form.gradeNames.length > 0 && (
                  <FieldRow label="Grade Names" value={form.gradeNames.filter(Boolean).join(', ')} />
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <NavBtn onClick={() => step === 0 ? setView('list') : setStep(s => s - 1)}>
              {step === 0 ? 'Cancel' : 'Back'}
            </NavBtn>
            {step < CREATE_STEPS.length - 1
              ? <NavBtn primary onClick={handleNext}>Next</NavBtn>
              : <NavBtn primary onClick={handleSubmit}>Add Tenant</NavBtn>
            }
          </div>
        </div>
      </div>
    );
  }

  // ─── 3. Edit Tenant View ──────────────────────────────────────────────────────
  if (view === 'edit') {
    const handleEditSave = () => {
      const e = validateForm(editForm);
      setEditErrors(e);
      if (Object.keys(e).length > 0) return;
      const addressString = `${editForm.addressLine1}${editForm.addressLine2 ? ', ' + editForm.addressLine2 : ''}, ${editForm.city}, ${editForm.state} - ${editForm.pincode}`;
      setSchools(p => p.map(s => s.id === editSchool!.id ? {
        ...s,
        name: editForm.name,
        branch: editForm.branch,
        board: editForm.board as Board,
        address: addressString,
        addressLine1: editForm.addressLine1,
        addressLine2: editForm.addressLine2,
        city: editForm.city,
        state: editForm.state,
        pincode: editForm.pincode,
        contactEmail: editForm.contactEmail || undefined,
        contactPhone: editForm.contactPhone || undefined,
        numberOfGrades: editForm.numberOfGrades ? Number(editForm.numberOfGrades) : undefined,
        gradeNames: editForm.gradeNames.map((name, i) => name || `Grade ${i + 3}`),
      } : s));
      setView('list');
    };

    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => setView('list')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
          ← Back to Tenants
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>Edit Tenant</h1>

        <div style={{ background: 'white', borderRadius: 16, padding: '32px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
          <SchoolFormFields form={editForm} errors={editErrors} onChange={changeEditForm} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <NavBtn onClick={() => setView('list')}>Cancel</NavBtn>
            <NavBtn primary onClick={handleEditSave}>Save Changes</NavBtn>
          </div>
        </div>
      </div>
    );
  }

  // ─── 4. View Tenant Details & Students under Grades ───────────────────────────
  if (view === 'view-tenant' && selectedTenant) {
    const tenantUsers = users.filter(u => u.usageMode === 'school' && u.schoolId === selectedTenant.id);
    const activeGradeUsers = activeGradeTab === 'All'
      ? tenantUsers
      : tenantUsers.filter(u => u.grade === activeGradeTab);

    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => setView('list')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
          ← Back to Tenants List
        </button>

        {/* Tenant Header details */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>{selectedTenant.name}</h1>
              <BoardBadge board={selectedTenant.board} />
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
              📍 {selectedTenant.branch} Branch | {selectedTenant.address}
            </p>
          </div>
        </div>

        {/* Grades Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
          {['All', ...getTenantGrades(selectedTenant)].map(g => {
            const count = g === 'All'
              ? tenantUsers.length
              : tenantUsers.filter(u => u.grade === g).length;
            const active = activeGradeTab === g;
            return (
              <button
                key={g}
                onClick={() => setActiveGradeTab(g)}
                style={{
                  background: active ? '#FFEA11' : 'white',
                  color: active ? '#1a1a1a' : '#64748b',
                  border: `1px solid ${active ? '#FFEA11' : '#E2E8F0'}`,
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Andika, system-ui, sans-serif',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {g === 'All' ? '🌍 All Grades' : g} ({count})
              </button>
            );
          })}
        </div>

        {/* Users Table */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                  {['Student Name', 'Grade', 'Age', 'Session duration', 'Guardian Email', 'Guardian Contact'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeGradeUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                      No users found in this grade category.
                    </td>
                  </tr>
                ) : activeGradeUsers.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{u.childName}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {u.grade || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{u.age} yrs</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{u.weeklySession} mins</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{u.guardianEmail || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{u.guardianContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── 5. Add Student Workflow (prompts for Grade first) ──────────────────────
  if (view === 'add-student' && selectedTenant) {
    const handleStudentSubmit = () => {
      // Validation
      const errs: Record<string, string> = {};
      if (!studentGrade) errs.grade = 'Please select a Grade';
      if (!studentForm.childName.trim()) errs.childName = 'Student name is required';
      if (!studentForm.guardianContact.trim()) errs.guardianContact = 'Guardian contact mobile is required';
      else if (!/^\d{10}$/.test(studentForm.guardianContact.trim())) errs.guardianContact = 'Please enter a valid 10-digit mobile number';

      if (Object.keys(errs).length > 0) {
        setStudentErrors(errs);
        return;
      }

      // Add user
      const newUser: AdminUser = {
        id: genId('u'),
        childName: studentForm.childName.trim(),
        age: parseInt(studentForm.age),
        guardianContact: studentForm.guardianContact.trim(),
        guardianEmail: studentForm.guardianEmail.trim() || undefined,
        weeklySession: parseInt(studentForm.weeklySession),
        usageMode: 'school',
        grade: studentGrade,
        schoolId: selectedTenant.id
      };

      setUsers(prev => [...prev, newUser]);
      setView('view-tenant');
    };

    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => setView('view-tenant')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
          ← Back to Tenant Details
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>
          Add Student User
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, background: 'white', borderRadius: 16, padding: '32px 36px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          {/* Step 1: Grade Selection */}
          <div>
            <label style={lbl}>1. Select Grade <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {getTenantGrades(selectedTenant).map(g => {
                const active = studentGrade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setStudentGrade(g);
                      setStudentErrors(prev => ({ ...prev, grade: '' }));
                    }}
                    style={{
                      background: active ? '#FFEA11' : '#f8fafc',
                      color: active ? '#1a1a1a' : '#475569',
                      border: `2px solid ${active ? '#FFEA11' : '#e2e8f0'}`,
                      borderRadius: 10,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
            {studentErrors.grade && <p style={errTxt}>{studentErrors.grade}</p>}
          </div>

          {/* Step 2: Student Details Form */}
          {studentGrade && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                  2. Enter details for {studentGrade} Student
                </h3>
              </div>

              <div>
                <label style={lbl}>Student Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Patel"
                  value={studentForm.childName}
                  onChange={e => {
                    const val = e.target.value;
                    setStudentForm(prev => ({ ...prev, childName: val }));
                    setStudentErrors(prev => ({ ...prev, childName: '' }));
                  }}
                  style={iStyle(studentErrors.childName)}
                />
                {studentErrors.childName && <p style={errTxt}>{studentErrors.childName}</p>}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Age <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    value={studentForm.age}
                    onChange={e => setStudentForm(prev => ({ ...prev, age: e.target.value }))}
                    style={{ ...iStyle(), background: 'white' }}
                  >
                    {AGES.map(a => <option key={a} value={a}>{a} years</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Weekly Session <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    value={studentForm.weeklySession}
                    onChange={e => setStudentForm(prev => ({ ...prev, weeklySession: e.target.value }))}
                    style={{ ...iStyle(), background: 'white' }}
                  >
                    {SESSION_OPTS.map(m => <option key={m} value={m}>{m} mins</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>Guardian Contact Mobile (10 digits) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={studentForm.guardianContact}
                  onChange={e => {
                    const val = e.target.value;
                    setStudentForm(prev => ({ ...prev, guardianContact: val }));
                    setStudentErrors(prev => ({ ...prev, guardianContact: '' }));
                  }}
                  style={iStyle(studentErrors.guardianContact)}
                />
                {studentErrors.guardianContact && <p style={errTxt}>{studentErrors.guardianContact}</p>}
              </div>

              <div>
                <label style={lbl}>Guardian Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. parent@email.com"
                  value={studentForm.guardianEmail}
                  onChange={e => setStudentForm(prev => ({ ...prev, guardianEmail: e.target.value }))}
                  style={iStyle()}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <NavBtn onClick={() => setView('view-tenant')}>Cancel</NavBtn>
                <NavBtn primary onClick={handleStudentSubmit}>Save Student User</NavBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── 6. Bulk Upload Workflow (Excel based, Grade + Session duration only) ────
  if (view === 'bulk-upload' && selectedTenant) {
    const handleBulkUpload = () => {
      if (!bulkGrade) {
        setBulkError('Please select a Grade');
        return;
      }
      if (bulkRows.length === 0) {
        setBulkError('Please select a valid Excel file first.');
        return;
      }

      const validRows = bulkRows.filter(r => r.errors.length === 0);
      if (validRows.length === 0) {
        setBulkError('No valid student rows found in the uploaded file.');
        return;
      }

      // Map grade to default age
      let defaultAge = 10;
      if (bulkGrade === 'Grade 3') defaultAge = 9;
      else if (bulkGrade === 'Grade 4') defaultAge = 10;
      else if (bulkGrade === 'Grade 5') defaultAge = 11;
      else if (bulkGrade === 'Grade 6') defaultAge = 12;
      else if (bulkGrade === 'Grade 7') defaultAge = 13;

      // Generate users
      const newUsers: AdminUser[] = validRows.map((r, index) => ({
        id: genId('u') + index,
        childName: r.childName,
        age: defaultAge,
        guardianContact: r.guardianMobile,
        guardianEmail: r.guardianEmail || undefined,
        weeklySession: parseInt(bulkSession),
        usageMode: 'school',
        grade: bulkGrade,
        schoolId: selectedTenant.id
      }));

      setUsers(prev => [...prev, ...newUsers]);
      setView('view-tenant');
    };

    const validRowsCount = bulkRows.filter(r => r.errors.length === 0).length;

    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => setView('view-tenant')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, fontFamily: 'Andika, system-ui, sans-serif', marginBottom: 8 }}>
          ← Back to Tenant Details
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>
          Bulk Upload Students (Excel)
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, background: 'white', borderRadius: 16, padding: '32px 36px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>

          {/* Step 1: Grade Selection */}
          <div>
            <label style={lbl}>1. Select Target Grade <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {getTenantGrades(selectedTenant).map(g => {
                const active = bulkGrade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setBulkGrade(g);
                      setBulkError('');
                    }}
                    style={{
                      background: active ? '#FFEA11' : '#f8fafc',
                      color: active ? '#1a1a1a' : '#475569',
                      border: `2px solid ${active ? '#FFEA11' : '#e2e8f0'}`,
                      borderRadius: 10,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Settings & Excel file upload */}
          {bulkGrade && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                <label style={lbl}>2. Session Duration for all uploaded students <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  value={bulkSession}
                  onChange={e => setBulkSession(e.target.value)}
                  style={{ ...iStyle(), width: 200, background: 'white', marginTop: 6 }}
                >
                  {SESSION_OPTS.map(m => <option key={m} value={m}>{m} mins</option>)}
                </select>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                <label style={lbl}>3. Upload Excel Spreadsheet (.xlsx)</label>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 12px' }}>
                  Please download the spreadsheet template, fill in your student names, mobile numbers, and optional email addresses, then upload it.
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    style={{
                      background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10,
                      padding: '10px 16px', fontSize: 12, fontWeight: 700,
                      color: '#475569', cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif',
                    }}
                  >
                    ⬇️ Download Excel Template
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10,
                      padding: '10px 16px', fontSize: 12, fontWeight: 700,
                      color: '#0369a1', cursor: 'pointer', fontFamily: 'Andika, system-ui, sans-serif',
                    }}
                  >
                    📁 Choose Excel File
                  </button>
                  {fileName && <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{fileName}</span>}
                </div>
                {bulkError && <p style={errTxt}>{bulkError}</p>}
              </div>

              {/* Preview parsed spreadsheet rows */}
              {bulkRows.length > 0 && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                  {/* Summary Cards */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                    <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Rows</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{bulkRows.length}</div>
                    </div>
                    <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ready to Import</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d', marginTop: 4 }}>{validRowsCount}</div>
                    </div>
                    <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Invalid Rows</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c', marginTop: 4 }}>{bulkRows.length - validRowsCount}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                      Spreadsheet Preview
                    </h3>
                    {validRowsCount < bulkRows.length && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
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
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Name</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Guardian Mobile</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Guardian Email</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', color: '#1e293b', fontWeight: 600 }}>{r.childName || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>{r.guardianMobile || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>{r.guardianEmail || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {r.errors.length > 0 ? (
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠️ {r.errors.join(', ')}</span>
                              ) : (
                                <span style={{ color: '#10b981', fontWeight: 700 }}>Ready</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkRows.length > 0 && bulkRows.some(r => r.errors.length > 0) && (
                <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 700, margin: '8px 0', textAlign: 'right' }}>
                  ⚠️ Cannot import: Please resolve all spreadsheet errors and re-upload.
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <NavBtn onClick={() => setView('view-tenant')}>Cancel</NavBtn>
                <NavBtn
                  primary
                  disabled={bulkRows.length === 0 || bulkRows.some(r => r.errors.length > 0)}
                  onClick={handleBulkUpload}
                >
                  Upload & Import {validRowsCount} Students
                </NavBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
