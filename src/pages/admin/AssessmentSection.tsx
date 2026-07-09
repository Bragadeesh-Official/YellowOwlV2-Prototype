import { useState } from 'react';
import { type School } from '@/mock/adminData';

interface HistoryItem {
  id: string;
  week: string;
  schoolName: string;
  maxChallenges: number;
  status: string; // 'Completed' | 'In Progress' | 'Scheduled'
}

interface AssessmentSectionProps {
  schools: School[];
}

export default function AssessmentSection({ schools }: AssessmentSectionProps) {
  // Past History mock data state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('yellowowl_admin_challenges_history');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'h1',
        week: 'Week 1',
        schoolName: 'Sunrise Academy',
        maxChallenges: 4,
        status: 'Completed',
      },
      {
        id: 'h2',
        week: 'Week 1',
        schoolName: 'Heritage High School',
        maxChallenges: 3,
        status: 'Completed',
      },
      {
        id: 'h3',
        week: 'Week 2',
        schoolName: 'Sunrise Academy',
        maxChallenges: 4,
        status: 'In Progress',
      },
      {
        id: 'h4',
        week: 'Week 2',
        schoolName: 'Green Valley School',
        maxChallenges: 5,
        status: 'Scheduled',
      },
      {
        id: 'h5',
        week: 'Week 2',
        schoolName: 'Heritage High School',
        maxChallenges: 6,
        status: 'Scheduled',
      },
    ];
  });

  // Configuration Flow States
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
  const [configStep, setConfigStep] = useState<'tenants' | 'challenges'>('tenants');

  // Search & Filter states for Config Step 1
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('All');

  // History Filter States
  const [filterWeek, setFilterWeek] = useState('All');
  const [filterTenant, setFilterTenant] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All'); // Defaults to 'All'

  // Pagination states for history table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Form selections state
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [challengesCount, setChallengesCount] = useState<number>(5);

  // Toggle helpers
  const handleToggleSchool = (id: string) => {
    setSelectedSchoolIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = (filteredSchools: School[]) => {
    const filteredIds = filteredSchools.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedSchoolIds.includes(id));

    if (allSelected) {
      // Remove all filtered ids
      setSelectedSchoolIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Add missing filtered ids
      setSelectedSchoolIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSchoolIds.length === 0) {
      alert('Please select at least one tenant!');
      return;
    }

    // Find highest week number from history
    let maxWeekNum = 1;
    history.forEach(item => {
      const match = item.week.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxWeekNum) maxWeekNum = num;
      }
    });
    const currentWeekStr = `Week ${maxWeekNum}`;

    // Clone existing history
    const updatedHistory = [...history];

    selectedSchoolIds.forEach(schoolId => {
      const schoolObj = schools.find(s => s.id === schoolId);
      if (!schoolObj) return;

      // Find if record exists for this school in the current week
      const existingIndex = updatedHistory.findIndex(
        item => item.week === currentWeekStr && item.schoolName === schoolObj.name
      );

      if (existingIndex >= 0) {
        // Update existing record
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          maxChallenges: challengesCount,
          status: 'Scheduled',
        };
      } else {
        // Insert new record
        updatedHistory.push({
          id: 'h_' + Math.random().toString(36).slice(2, 9),
          week: currentWeekStr,
          schoolName: schoolObj.name,
          maxChallenges: challengesCount,
          status: 'Scheduled',
        });
      }
    });

    // Update state & localStorage
    setHistory(updatedHistory);
    localStorage.setItem('yellowowl_admin_challenges_history', JSON.stringify(updatedHistory));

    // Reset Config Flow and Go Back to History Page
    setIsConfiguring(false);
    setConfigStep('tenants');
    setSelectedSchoolIds([]);
    setCurrentPage(1); // Reset page to 1
  };

  // Filter schools based on search term and board dropdown
  const filteredSchools = schools.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBoard = selectedBoard === 'All' || s.board === selectedBoard;
    return matchesSearch && matchesBoard;
  });

  // Unique lists from history data for filtering
  const uniqueWeeks = Array.from(new Set(history.map(item => item.week))).sort();
  const uniqueTenants = Array.from(new Set(history.map(item => item.schoolName))).sort();

  // Apply filters to history
  const filteredHistory = history.filter(item => {
    const matchesWeek = filterWeek === 'All' || item.week === filterWeek;
    const matchesTenant = filterTenant === 'All' || item.schoolName === filterTenant;
    
    let matchesStatus = true;
    if (filterStatus === 'Active') {
      matchesStatus = item.status === 'In Progress' || item.status === 'Scheduled';
    } else if (filterStatus !== 'All') {
      matchesStatus = item.status === filterStatus;
    }
    
    return matchesWeek && matchesTenant && matchesStatus;
  });

  // Paginated history items
  const totalPages = Math.ceil(filteredHistory.length / pageSize);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const paginatedHistory = filteredHistory.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleFilterWeekChange = (val: string) => {
    setFilterWeek(val);
    setCurrentPage(1);
  };

  const handleFilterTenantChange = (val: string) => {
    setFilterTenant(val);
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (val: string) => {
    setFilterStatus(val);
    setCurrentPage(1);
  };

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>
            Weekly Assessment Planner
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Configure targets and log weekly assessment milestones.
          </p>
        </div>
      </div>

      {/* Conditional Rendering: Configurator Wizard OR History Dash */}
      {isConfiguring ? (
        /* WIZARD FLOW CONFIGURATOR */
        <div className="bg-white rounded-2xl overflow-hidden" style={{ padding: 32, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(42,213,180,0.12)' }}>
          
          {/* Header & Steps Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 900, background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>
                Setup Planner
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 8, marginBottom: 0 }}>
                {configStep === 'tenants' ? 'Step 1: Select Tenants' : 'Step 2: Set Challenges Target'}
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

          {/* STEP 1: Select Tenants Table with Filter and Search */}
          {configStep === 'tenants' && (
            <div>
              {/* Search & Filters Row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <label htmlFor="search-tenant" style={{ display: 'none' }}>Search tenants</label>
                  <input
                    id="search-tenant"
                    type="text"
                    placeholder="Search by school name or branch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-teal-owl transition-all"
                  />
                </div>
                <div style={{ minWidth: 180 }}>
                  <label htmlFor="board-filter" style={{ display: 'none' }}>Filter by board</label>
                  <select
                    id="board-filter"
                    value={selectedBoard}
                    onChange={(e) => setSelectedBoard(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-owl transition-all bg-white min-w-[180px]"
                  >
                    <option value="All">All Boards</option>
                    <option value="CBSE">CBSE</option>
                    <option value="Stateboard">Stateboard</option>
                    <option value="ICSE">ICSE</option>
                    <option value="IB">IB</option>
                  </select>
                </div>
              </div>

              {/* Tenant Selection Table */}
              <div className="bg-white rounded-2xl overflow-hidden mb-8" style={{ boxShadow: '0 4px 20px rgba(42,213,180,0.12)', border: '1px solid #E2E8F0' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: '#f8fffe', borderBottom: '2px solid #e5f9f5' }}>
                        <th style={{ padding: '14px 16px', width: 50 }}>
                          <input
                            type="checkbox"
                            checked={filteredSchools.length > 0 && filteredSchools.every(s => selectedSchoolIds.includes(s.id))}
                            onChange={() => handleSelectAllFiltered(filteredSchools)}
                            style={{ width: 18, height: 18, accentColor: '#2AD5B4', cursor: 'pointer' }}
                          />
                        </th>
                        <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">School Name</th>
                        <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Branch</th>
                        <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Board</th>
                        <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Available Grades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-gray-400">
                            No schools found matching filters.
                          </td>
                        </tr>
                      ) : (
                        filteredSchools.map((s, i) => {
                          const isChecked = selectedSchoolIds.includes(s.id);
                          return (
                            <tr
                              key={s.id}
                              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                              style={{ background: i % 2 === 0 ? 'white' : '#fafffe' }}
                            >
                              <td style={{ padding: '14px 16px' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSchool(s.id)}
                                  style={{ width: 18, height: 18, accentColor: '#2AD5B4', cursor: 'pointer' }}
                                />
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                                {s.name}
                              </td>
                              <td className="px-5 py-3.5 text-gray-600">
                                {s.branch}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                                  style={{ background: '#eff6ff', color: '#1d4ed8' }}
                                >
                                  {s.board}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-gray-500">
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
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer border-none"
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
                    onClick={() => setConfigStep('challenges')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer border-none"
                    style={
                      selectedSchoolIds.length === 0
                        ? { background: '#CBD5E1', color: '#94A3B8', cursor: 'not-allowed' }
                        : { background: '#FFEA11', boxShadow: '0 4px 12px rgba(255,234,17,0.4)' }
                    }
                  >
                    Next: Set Challenges ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Set Challenges Count with Custom Counter */}
          {configStep === 'challenges' && (
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 18, marginBottom: 30, width: '100%' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Target Tenants ({selectedSchoolIds.length})
                </h4>
                <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 700 }}>
                  {schools.filter(s => selectedSchoolIds.includes(s.id)).map(s => s.name).join(', ')}
                </div>
              </div>

              <form onSubmit={handleAssign} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor="counter-wrapper" style={{ fontSize: 13, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Max Number of Challenges per Tenant
                  </label>
                  
                  {/* Custom Counter Component */}
                  <div id="counter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button
                      type="button"
                      onClick={() => setChallengesCount(c => Math.max(1, c - 1))}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        border: '2.5px solid #CBD5E1',
                        background: '#ffffff',
                        fontWeight: 900,
                        fontSize: 22,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#334155',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2AD5B4')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                    >
                      -
                    </button>
                    <div style={{ fontSize: 28, fontWeight: 900, minWidth: 64, textAlign: 'center', color: '#0F172A' }}>
                      {challengesCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setChallengesCount(c => Math.min(100, c + 1))}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        border: '2.5px solid #CBD5E1',
                        background: '#ffffff',
                        fontWeight: 900,
                        fontSize: 22,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#334155',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2AD5B4')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                    >
                      +
                    </button>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>ℹ️</span> Note: This update will reflect on next week's sessions.
                  </p>
                </div>

                {/* Wizard Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 30 }}>
                  <button
                    type="button"
                    onClick={() => setConfigStep('tenants')}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer border-none"
                  >
                    Back to Tenants
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer border-none"
                    style={{ background: '#FFEA11', boxShadow: '0 4px 12px rgba(255,234,17,0.4)' }}
                  >
                    Apply Weekly Target
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      ) : (
        /* PRIMARY CHALLENGE COMPLETION HISTORY WITH FILTERS AND MATCHING DESIGN */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Toolbar with Inline Filters & Action Button */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Week Filter */}
              <label htmlFor="filter-week" style={{ display: 'none' }}>Filter by week</label>
              <select
                id="filter-week"
                value={filterWeek}
                onChange={e => handleFilterWeekChange(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-owl transition-all bg-white min-w-[140px]"
              >
                <option value="All">All Weeks</option>
                {uniqueWeeks.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>

              {/* Tenant Filter */}
              <label htmlFor="filter-tenant" style={{ display: 'none' }}>Filter by tenant</label>
              <select
                id="filter-tenant"
                value={filterTenant}
                onChange={e => handleFilterTenantChange(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-owl transition-all bg-white min-w-[160px]"
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
                className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-owl transition-all bg-white min-w-[180px]"
              >
                <option value="All">All</option>
                <option value="Active">Active (In Progress / Scheduled)</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>

            {/* Configure Weekly Targets Button on the right */}
            <button
              onClick={() => {
                setIsConfiguring(true);
                setConfigStep('tenants');
                setSelectedSchoolIds([]);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer border-none"
              style={{ background: '#FFEA11', boxShadow: '0 4px 12px rgba(255,234,17,0.4)' }}
            >
              <span style={{ fontSize: '15px' }}>⚙️</span> Configure Weekly Targets
            </button>
          </div>

          {/* Challenge Completion History Table */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(42,213,180,0.12)', border: '1px solid #E2E8F0' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fffe', borderBottom: '2px solid #e5f9f5' }}>
                    <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Week</th>
                    <th className="text-left px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Tenant</th>
                    <th className="text-center px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Max Challenges</th>
                    <th className="text-right px-5 py-3.5 font-bold text-gray-600 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400">
                        <div className="text-3xl mb-2">📋</div>
                        <div>No planning history records found</div>
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((item, idx) => {
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                          style={{ background: idx % 2 === 0 ? 'white' : '#fafffe' }}
                        >
                          {/* Week */}
                          <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                            {item.week}
                          </td>

                          {/* Tenant name */}
                          <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                            {item.schoolName}
                          </td>

                          {/* Max Challenges */}
                          <td className="px-5 py-3.5 text-center text-gray-600">
                            {item.maxChallenges}
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-3.5 text-right">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                              style={
                                item.status === 'Completed'
                                  ? { background: '#f0fdf4', color: '#15803d' }
                                  : item.status === 'In Progress'
                                  ? { background: '#eff6ff', color: '#1d4ed8' }
                                  : { background: '#fff7ed', color: '#c2410c' }
                              }
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  Showing {filteredHistory.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to {Math.min(activePage * pageSize, filteredHistory.length)} of {filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''}
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
      )}

    </div>
  );
}
