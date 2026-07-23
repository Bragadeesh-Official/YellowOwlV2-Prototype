import React, { useState } from 'react';
import { type School, type AdminUser } from '@/mock/adminData';
import {
  Plus,
  Minus,
  Search,
  X,
  AlertTriangle,
  CheckCircle,
  Pencil
} from 'lucide-react';

export type AssessmentStatus = 'Not scheduled' | 'Scheduled' | 'End';
export type StartTimingType = 'immediate' | 'date' | 'next_iteration';

export interface AssessmentRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  ongoingWeek: number;
  maxChallenges: number;
  status: AssessmentStatus;
  startTiming: StartTimingType;
  startDate?: string; // e.g. YYYY-MM-DD
  lastUpdated?: string;
}

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'error' | 'success' | 'warning';
}

interface AssessmentSectionProps {
  schools: School[];
  users?: AdminUser[];
}

export default function AssessmentSection({ schools, users = [] }: AssessmentSectionProps) {
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helper to count assigned users for a school
  const getTenantUserCount = (schoolId: string) => {
    return users.filter(u => u.schoolId === schoolId).length;
  };

  // Helper to get current assessment status for a school (defaults to 'Not scheduled' if no record yet)
  const getSchoolStatus = (school: School): AssessmentStatus => {
    const rec = mergedRecords.find(item => item.schoolId === school.id || item.schoolName === school.name);
    return rec ? rec.status : 'Not scheduled';
  };

  // Assessment Records state
  const [records, setRecords] = useState<AssessmentRecord[]>(() => {
    const saved = localStorage.getItem('yellowowl_admin_assessment_configs_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean up any legacy 'Pause' statuses if present in localStorage
        return parsed.map((r: any) => ({
          ...r,
          ongoingWeek: r.ongoingWeek || 1,
          status: r.status === 'Pause' ? 'Scheduled' : r.status
        }));
      } catch {
        // fallback
      }
    }
    // Default initial mock data with Week column
    return [
      {
        id: 'rec_s1',
        schoolId: 's1',
        schoolName: 'Sunrise Academy',
        ongoingWeek: 4,
        maxChallenges: 4,
        status: 'Scheduled',
        startTiming: 'immediate',
        startDate: '',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'rec_s2',
        schoolId: 's2',
        schoolName: 'Heritage High School',
        ongoingWeek: 2,
        maxChallenges: 3,
        status: 'Scheduled',
        startTiming: 'date',
        startDate: '2026-08-01',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'rec_s3',
        schoolId: 's3',
        schoolName: 'Green Valley School',
        ongoingWeek: 1,
        maxChallenges: 0,
        status: 'Not scheduled',
        startTiming: 'immediate',
        startDate: '',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    ];
  });

  // Ensure all existing schools in `schools` prop have a record in `mergedRecords`
  const mergedRecords: AssessmentRecord[] = [...records];
  schools.forEach(school => {
    const exists = records.some(r => r.schoolId === school.id || r.schoolName === school.name);
    if (!exists) {
      mergedRecords.push({
        id: `rec_${school.id}`,
        schoolId: school.id,
        schoolName: school.name,
        ongoingWeek: 1,
        maxChallenges: 0,
        status: 'Not scheduled',
        startTiming: 'immediate',
        startDate: '',
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }
  });

  const saveRecordsToStorage = (newRecords: AssessmentRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('yellowowl_admin_assessment_configs_v2', JSON.stringify(newRecords));
  };

  // Configuration Flow States (Wizard)
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
  const [configStep, setConfigStep] = useState<'tenants' | 'challenges'>('tenants');

  // Search & Filter states for Wizard Step 1
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('All');

  // Table Filter States
  const [filterTenant, setFilterTenant] = useState('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Pagination states for history table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Form selections state in Wizard
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [challengesCount, setChallengesCount] = useState<number>(5);
  const [startTiming, setStartTiming] = useState<StartTimingType>('immediate');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<AssessmentRecord | null>(null);
  const [editChallenges, setEditChallenges] = useState<number>(5);
  const [editStatus, setEditStatus] = useState<AssessmentStatus>('Scheduled');

  // Toggle helpers for Wizard
  const handleToggleSchool = (id: string) => {
    setSelectedSchoolIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = (filteredSchoolsList: School[]) => {
    const filteredIds = filteredSchoolsList.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedSchoolIds.includes(id));

    if (allSelected) {
      setSelectedSchoolIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedSchoolIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Step 1 -> Step 2 Validation (Check for zero user tenants)
  const handleNextToChallenges = () => {
    if (selectedSchoolIds.length === 0) {
      showToast('Selection Required', 'Please select at least one tenant to configure.', 'warning');
      return;
    }

    // Check if any selected tenant has 0 assigned users
    const emptyTenants = selectedSchoolIds
      .map(id => schools.find(s => s.id === id))
      .filter(Boolean)
      .filter(school => getTenantUserCount(school!.id) === 0);

    if (emptyTenants.length > 0) {
      const names = emptyTenants.map(s => s!.name).join(', ');
      showToast('No User in Tenant', `No user in the tenant: ${names}`, 'error');
      return;
    }

    setConfigStep('challenges');
  };

  // Wizard Finish (Apply target)
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSchoolIds.length === 0) {
      showToast('Selection Required', 'Please select at least one tenant!', 'warning');
      return;
    }

    const emptyTenants = selectedSchoolIds
      .map(id => schools.find(s => s.id === id))
      .filter(Boolean)
      .filter(school => getTenantUserCount(school!.id) === 0);

    if (emptyTenants.length > 0) {
      const names = emptyTenants.map(s => s!.name).join(', ');
      showToast('No User in Tenant', `No user in the tenant: ${names}`, 'error');
      return;
    }

    const updated = [...mergedRecords];
    const todayStr = new Date().toISOString().split('T')[0];

    selectedSchoolIds.forEach(schoolId => {
      const schoolObj = schools.find(s => s.id === schoolId);
      if (!schoolObj) return;

      const idx = updated.findIndex(item => item.schoolId === schoolId || item.schoolName === schoolObj.name);
      const existingWeek = idx >= 0 && updated[idx].ongoingWeek ? updated[idx].ongoingWeek : 1;

      const newRec: AssessmentRecord = {
        id: idx >= 0 ? updated[idx].id : `rec_${schoolId}_${Date.now()}`,
        schoolId,
        schoolName: schoolObj.name,
        ongoingWeek: existingWeek,
        maxChallenges: challengesCount,
        status: 'Scheduled',
        startTiming,
        startDate: startTiming === 'date' ? startDate : '',
        lastUpdated: todayStr,
      };

      if (idx >= 0) {
        updated[idx] = newRec;
      } else {
        updated.push(newRec);
      }
    });

    saveRecordsToStorage(updated);
    setIsConfiguring(false);
    setConfigStep('tenants');
    setSelectedSchoolIds([]);
    showToast('Success', 'Assessment targets configured successfully!', 'success');
  };

  // Open Edit Modal for a Record
  const openEditModal = (rec: AssessmentRecord) => {
    const tenantUserCount = getTenantUserCount(rec.schoolId);
    if (tenantUserCount === 0) {
      showToast('No User in Tenant', `No user in the tenant: ${rec.schoolName}`, 'error');
    }
    setEditingRecord(rec);
    setEditChallenges(rec.maxChallenges > 0 ? rec.maxChallenges : 5);
    setEditStatus(rec.status === ('Pause' as any) ? 'Scheduled' : rec.status);
  };

  // Save Edit Modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const tenantUserCount = getTenantUserCount(editingRecord.schoolId);
    if (tenantUserCount === 0 && editStatus === 'Scheduled') {
      showToast('No User in Tenant', `No user in the tenant: ${editingRecord.schoolName}`, 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const updated = mergedRecords.map(item => {
      if (item.id === editingRecord.id || item.schoolId === editingRecord.schoolId) {
        return {
          ...item,
          maxChallenges: editChallenges,
          status: editStatus,
          lastUpdated: todayStr,
        };
      }
      return item;
    });

    saveRecordsToStorage(updated);
    setEditingRecord(null);
    showToast('Updated', `Assessment settings updated for ${editingRecord.schoolName}`, 'success');
  };

  // Filter schools in Step 1 — only tenants that are not yet scheduled can be picked here;
  // already-configured tenants are managed via Edit/End in the main table instead.
  const filteredSchools = schools.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBoard = selectedBoard === 'All' || s.board === selectedBoard;
    const isNotScheduled = getSchoolStatus(s) === 'Not scheduled';
    return matchesSearch && matchesBoard && isNotScheduled;
  });

  // Filters & Pagination for Main Table
  const uniqueTenants = Array.from(new Set(mergedRecords.map(item => item.schoolName))).sort();

  const filteredRecords = mergedRecords.filter(item => {
    const matchesTenant = filterTenant === 'All' || item.schoolName === filterTenant;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesTenant && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const paginatedRecords = filteredRecords.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleFilterTenantChange = (val: string) => {
    setFilterTenant(val);
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    setCurrentPage(1);
  };

  // Clean Text Badges without Icons
  const renderStatusBadge = (status: AssessmentStatus) => {
    switch (status) {
      case 'Scheduled':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#f0fdf4', color: '#15803d', display: 'inline-block' }}>
            Scheduled
          </span>
        );
      case 'End':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#fee2e2', color: '#dc2626', display: 'inline-block' }}>
            End
          </span>
        );
      case 'Not scheduled':
      default:
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#f1f5f9', color: '#64748b', display: 'inline-block' }}>
            Not scheduled
          </span>
        );
    }
  };

  const iStyle = () => ({
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    width: '100%',
    boxSizing: 'border-box' as const,
  });

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* TOAST NOTIFICATION CONTAINER */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400, width: '100%', pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              padding: 16,
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              border: '1px solid',
              background: toast.type === 'error' ? '#fef2f2' : toast.type === 'warning' ? '#fffbeb' : '#f0fdf4',
              borderColor: toast.type === 'error' ? '#fecaca' : toast.type === 'warning' ? '#fde68a' : '#bbf7d0',
              color: toast.type === 'error' ? '#991b1b' : toast.type === 'warning' ? '#92400e' : '#166534',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {toast.type === 'error' && <AlertTriangle size={18} style={{ color: '#dc2626', marginTop: 2, flexShrink: 0 }} />}
              {toast.type === 'warning' && <AlertTriangle size={18} style={{ color: '#d97706', marginTop: 2, flexShrink: 0 }} />}
              {toast.type === 'success' && <CheckCircle size={18} style={{ color: '#16a34a', marginTop: 2, flexShrink: 0 }} />}
              <div>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{toast.title}</div>
                <div style={{ fontSize: 12, marginTop: 2, opacity: 0.9 }}>{toast.message}</div>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>
            Configure Assessment
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Configure target challenges, on-going week numbers, and status across tenants.
          </p>
        </div>
      </div>

      {/* WIZARD FLOW OR MAIN TABLE */}
      {isConfiguring ? (
        /* WIZARD FLOW CONFIGURATOR */
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          {/* Header & Steps Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 900, background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>
                Setup Planner
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 8, marginBottom: 0 }}>
                {configStep === 'tenants' ? 'Step 1: Select New Tenants' : 'Step 2: Set Challenges & Timing'}
              </h2>
            </div>

            {/* Step badges */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2AD5B4', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13 }}>
                1
              </div>
              <div style={{ width: 40, height: 2, background: configStep === 'challenges' ? '#2AD5B4' : '#E2E8F0' }} />
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: configStep === 'challenges' ? '#2AD5B4' : '#E2E8F0', color: configStep === 'challenges' ? '#ffffff' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13 }}>
                2
              </div>
            </div>
          </div>

          {/* STEP 1: Select Tenants */}
          {configStep === 'tenants' && (
            <div>
              {/* Search & Filters Row */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by school name or branch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...iStyle(), paddingLeft: 40, background: 'white' }}
                  />
                </div>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  style={{ ...iStyle(), width: 'auto', padding: '10px 16px', background: 'white' }}
                >
                  <option value="All">All Boards</option>
                  <option value="CBSE">CBSE</option>
                  <option value="Stateboard">Stateboard</option>
                  <option value="ICSE">ICSE</option>
                  <option value="IB">IB</option>
                </select>
              </div>

              {/* Tenant Selection Table matching SchoolsSection style */}
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', marginBottom: 24 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                        <th style={{ padding: '14px 16px', width: 50 }}>
                          <input
                            type="checkbox"
                            checked={filteredSchools.length > 0 && filteredSchools.every(s => selectedSchoolIds.includes(s.id))}
                            onChange={() => handleSelectAllFiltered(filteredSchools)}
                            style={{ width: 18, height: 18, accentColor: '#2AD5B4', cursor: 'pointer' }}
                          />
                        </th>
                        <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>School Name</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Branch</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Board</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Assigned Users</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Available Grades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                            No new (not scheduled) tenants found matching filters.
                          </td>
                        </tr>
                      ) : (
                        filteredSchools.map((s, i) => {
                          const isChecked = selectedSchoolIds.includes(s.id);
                          const userCount = getTenantUserCount(s.id);

                          return (
                            <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px 16px' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSchool(s.id)}
                                  style={{ width: 18, height: 18, accentColor: '#2AD5B4', cursor: 'pointer' }}
                                />
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>
                                {s.name}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#475569' }}>
                                {s.branch}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>
                                  {s.board}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: userCount > 0 ? '#15803d' : '#ef4444', fontWeight: 600 }}>
                                {userCount} {userCount === 1 ? 'user' : 'users'}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#64748b' }}>
                                {s.gradeNames?.join(', ') || 'N/A'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsConfiguring(false)}
                  style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>
                    {selectedSchoolIds.length} tenants selected
                  </span>
                  <button
                    type="button"
                    disabled={selectedSchoolIds.length === 0}
                    onClick={handleNextToChallenges}
                    style={
                      selectedSchoolIds.length === 0
                        ? { padding: '10px 22px', borderRadius: 12, border: 'none', background: '#cbd5e1', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'not-allowed' }
                        : { padding: '10px 22px', borderRadius: 12, border: 'none', background: '#FFEA11', color: '#1a1a1a', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,234,17,0.35)' }
                    }
                  >
                    Next: Set Challenges & Timing ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Set Challenges Count & Start Schedule */}
          {configStep === 'challenges' && (
            <div style={{ maxWidth: 650, margin: '0 auto', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Selected Tenants Summary */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 20, marginBottom: 24, width: '100%' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target Tenants ({selectedSchoolIds.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {schools
                    .filter(s => selectedSchoolIds.includes(s.id))
                    .map(s => {
                      const rec = mergedRecords.find(item => item.schoolId === s.id || item.schoolName === s.name);
                      const currentStatus = rec ? rec.status : 'Not scheduled';
                      return (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', width: '100%', boxSizing: 'border-box' }}>
                          <span style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>{s.name}</span>
                          {renderStatusBadge(currentStatus)}
                        </div>
                      );
                    })}
                </div>
              </div>

              <form onSubmit={handleAssignSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Number of Challenges Counter */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor="counter-wrapper" style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Max Number of Challenges per Tenant
                  </label>

                  <div id="counter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <button
                      type="button"
                      onClick={() => setChallengesCount(c => Math.max(1, c - 1))}
                      style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', fontWeight: 900, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}
                    >
                      <Minus size={18} />
                    </button>
                    <div style={{ fontSize: 28, fontWeight: 900, minWidth: 64, textAlign: 'center', color: '#0F172A' }}>
                      {challengesCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setChallengesCount(c => Math.min(100, c + 1))}
                      style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', fontWeight: 900, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Explicit Notice regarding next week assessment */}
                  <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#eff6ff', border: '1px solid #dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: 14 }}>ℹ️</span>
                    <span>This change will appear from next week assessment alone.</span>
                  </div>
                </div>

                {/* When to Start Selection */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: 20, borderRadius: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    When to Start Assessment
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, border: startTiming === 'immediate' ? '2px solid #2AD5B4' : '1px solid #e2e8f0', background: startTiming === 'immediate' ? '#f0fdfa' : 'white', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="startTiming"
                        value="immediate"
                        checked={startTiming === 'immediate'}
                        onChange={() => setStartTiming('immediate')}
                        style={{ accentColor: '#2AD5B4' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Immediate Start</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Activate right away</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, border: startTiming === 'date' ? '2px solid #2AD5B4' : '1px solid #e2e8f0', background: startTiming === 'date' ? '#f0fdfa' : 'white', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="startTiming"
                        value="date"
                        checked={startTiming === 'date'}
                        onChange={() => setStartTiming('date')}
                        style={{ accentColor: '#2AD5B4' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Select Start Date</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Pick start date</div>
                      </div>
                    </label>
                  </div>

                  {/* Immediate Start Notice */}
                  {startTiming === 'immediate' && (
                    <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#fff7ed', border: '1px solid #ffedd5', color: '#c2410c', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0, color: '#ea580c' }} />
                      <span>Current progress may get reset or modified.</span>
                    </div>
                  )}

                  {/* Select Date Picker & Notice */}
                  {startTiming === 'date' && (
                    <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label htmlFor="start-date-picker" style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                          Assessment Start Date:
                        </label>
                        <input
                          id="start-date-picker"
                          type="date"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          style={{ ...iStyle(), background: 'white' }}
                        />
                      </div>
                      <div style={{ padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13 }}>ℹ️</span>
                        <span>The change will apply on the date mentioned ({startDate || 'selected date'}).</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wizard Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setConfigStep('tenants')}
                    style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Back to Tenants
                  </button>

                  <button
                    type="submit"
                    style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: '#FFEA11', color: '#1a1a1a', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,234,17,0.35)' }}
                  >
                    Apply Target & Schedule
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* MAIN ASSESSMENT CONFIGURATION TABLE WITH ON-GOING WEEK & ACTIONS COLUMNS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Toolbar with Inline Filters & Configure Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Tenant Filter */}
              <label htmlFor="filter-tenant" style={{ display: 'none' }}>Filter by tenant</label>
              <select
                id="filter-tenant"
                value={filterTenant}
                onChange={e => handleFilterTenantChange(e.target.value)}
                style={{ ...iStyle(), width: 'auto', padding: '10px 16px', background: 'white', minWidth: 170 }}
              >
                <option value="All">All Tenants</option>
                {uniqueTenants.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Status Filter */}
              <label htmlFor="filter-status" style={{ display: 'none' }}>Filter by status</label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={e => handleFilterStatusChange(e.target.value)}
                style={{ ...iStyle(), width: 'auto', padding: '10px 16px', background: 'white', minWidth: 170 }}
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Not scheduled">Not scheduled</option>
                <option value="End">End</option>
              </select>
            </div>

            {/* Configure Targets Wizard Button */}
            <button
              onClick={() => {
                setIsConfiguring(true);
                setConfigStep('tenants');
                setSelectedSchoolIds([]);
              }}
              style={{
                background: '#FFEA11',
                border: 'none',
                borderRadius: 12,
                padding: '10px 22px',
                fontSize: 13,
                fontWeight: 700,
                color: '#1a1a1a',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 234, 17, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              New Tenant Configure
            </button>
          </div>

          {/* Table Container */}
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Tenant</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>On-going Week</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Assigned Users</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Max Challenges</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                        No assessment configurations found
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((item, idx) => {
                      const userCount = getTenantUserCount(item.schoolId);

                      return (
                        <tr
                          key={item.id}
                          style={{ background: idx % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}
                        >
                          {/* Tenant name */}
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>
                            {item.schoolName}
                          </td>

                          {/* On-going Week Number */}
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', display: 'inline-block' }}>
                              Week {item.ongoingWeek || 1}
                            </span>
                          </td>

                          {/* Users Count */}
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: userCount > 0 ? '#15803d' : '#ef4444' }}>
                            {userCount} {userCount === 1 ? 'user' : 'users'}
                          </td>

                          {/* Max Challenges */}
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>
                            {item.maxChallenges === 0 ? '—' : item.maxChallenges}
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            {renderStatusBadge(item.status)}
                          </td>

                          {/* Actions Column with Edit Icon & End Button */}
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                title="Edit Assessment Configuration"
                                style={{
                                  width: 32,
                                  height: 32,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 8,
                                  border: 'none',
                                  background: '#e2e8f0',
                                  color: '#475569',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <Pencil size={16} />
                              </button>

                             
                                
                            
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Showing {filteredRecords.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to {Math.min(activePage * pageSize, filteredRecords.length)} of {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
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
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', fontSize: 12, cursor: activePage === 1 ? 'not-allowed' : 'pointer', opacity: activePage === 1 ? 0.5 : 1 }}
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
                        style={{ padding: '4px 10px', borderRadius: 6, border: isCurrent ? 'none' : '1px solid #cbd5e1', background: isCurrent ? '#2AD5B4' : 'white', color: isCurrent ? 'white' : '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', fontSize: 12, cursor: activePage === totalPages ? 'not-allowed' : 'pointer', opacity: activePage === totalPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL DIALOG - ONLY NUMBER OF CHALLENGES AND END ARE CONFIGURABLE */}
      {editingRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 460, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Edit Assessment Configuration</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{editingRecord.schoolName}</p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Number of Challenges Counter */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  Number of Challenges
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc', padding: 10, borderRadius: 12, border: '1px solid #e2e8f0', width: 'fit-content' }}>
                  <button
                    type="button"
                    onClick={() => setEditChallenges(c => Math.max(1, c - 1))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', width: 40, textAlign: 'center' }}>
                    {editChallenges}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditChallenges(c => Math.min(100, c + 1))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Explicit Notice regarding next week assessment */}
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#eff6ff', border: '1px solid #dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>ℹ️</span>
                  <span>This change will appear from next week assessment alone.</span>
                </div>
              </div>

              {/* Status / End Assessment Control */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  Assessment Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setEditStatus('Scheduled')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: editStatus === 'Scheduled' ? '2px solid #2AD5B4' : '1px solid #cbd5e1',
                      background: editStatus === 'Scheduled' ? '#f0fdf4' : 'white',
                      color: editStatus === 'Scheduled' ? '#15803d' : '#475569',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    Active / Scheduled
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('End')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: editStatus === 'End' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                      background: editStatus === 'End' ? '#fee2e2' : 'white',
                      color: editStatus === 'End' ? '#dc2626' : '#475569',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    End Assessment
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#FFEA11', color: '#1a1a1a', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,234,17,0.3)' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

