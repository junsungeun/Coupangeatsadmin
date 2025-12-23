import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './AdminLeadList.css';

const AdminLeadList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    status: searchParams.get('status') || 'all',
    assigned_admin_id: searchParams.get('assigned_admin_id') || 'all',
    search: searchParams.get('search') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  });

  const statusOptions = ['신규', '연락완료', '상담중', '입점진행', '입점완료', '보류', '이탈'];

  // Fetch admin users for filter dropdown
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await axios.get('/api/admin/users');
        setAdminUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch admin users:', error);
      }
    };
    fetchAdminUsers();
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 20,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await axios.get('/api/leads', { params });
      setLeads(response.data.leads);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (filters.search) {
      newParams.set('search', filters.search);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handleExport = async () => {
    try {
      const params = { ...filters };
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await axios.get('/api/leads/export', {
        params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('CSV 내보내기에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      '신규': '#1E80FF',
      '연락완료': '#10b981',
      '상담중': '#f59e0b',
      '입점진행': '#8b5cf6',
      '입점완료': '#22c55e',
      '보류': '#6b7280',
      '이탈': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="lead-list">
      <div className="list-header">
        <div className="header-title">
          <h1>리드 관리</h1>
          <span className="lead-count">총 {pagination.total}건</span>
        </div>
        <button className="export-btn" onClick={handleExport}>
          📥 CSV 내보내기
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>타입</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">전체</option>
              <option value="consult">문의</option>
              <option value="direct_join">바로 입점</option>
            </select>
          </div>

          <div className="filter-group">
            <label>상태</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">전체</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>담당자</label>
            <select
              value={filters.assigned_admin_id}
              onChange={(e) => handleFilterChange('assigned_admin_id', e.target.value)}
            >
              <option value="all">전체</option>
              <option value="unassigned">미지정</option>
              {adminUsers.map(admin => (
                <option key={admin.id} value={admin.id}>{admin.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>시작일</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>종료일</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="이름, 매장명, 연락처, 이메일 검색..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <button type="submit">검색</button>
        </form>
      </div>

      {/* Table */}
      <div className="leads-table-container">
        {loading ? (
          <div className="table-loading">로딩 중...</div>
        ) : leads.length === 0 ? (
          <div className="table-empty">검색 결과가 없습니다.</div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>생성일</th>
                <th>타입</th>
                <th>이름</th>
                <th>매장명</th>
                <th>연락처</th>
                <th>담당자</th>
                <th>상태</th>
                <th>메모</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="date-cell">{formatDate(lead.created_at)}</td>
                  <td>
                    <span className={`type-badge ${lead.type}`}>
                      {lead.type === 'consult' ? '문의' : '바로입점'}
                    </span>
                  </td>
                  <td className="name-cell">{lead.name}</td>
                  <td className="store-cell">{lead.store_name}</td>
                  <td className="phone-cell">{lead.phone}</td>
                  <td className="admin-cell">
                    <span className={`admin-badge ${lead.assigned_admin_name ? '' : 'unassigned'}`}>
                      {lead.assigned_admin_name || '미지정'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(lead.status)}15`,
                        color: getStatusColor(lead.status)
                      }}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="memo-cell">
                    {lead.memo ? <span className="memo-icon" title={lead.memo}>📝</span> : '-'}
                  </td>
                  <td>
                    <Link to={`/admin/leads/${lead.id}`} className="detail-link">
                      상세 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            이전
          </button>

          <div className="page-numbers">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                const current = pagination.page;
                return page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - current) <= 2;
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="page-ellipsis">...</span>
                  )}
                  <button
                    className={`page-num ${page === pagination.page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            className="page-btn"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLeadList;
