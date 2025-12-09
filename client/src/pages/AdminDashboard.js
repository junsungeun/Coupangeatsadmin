import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    consults: 0,
    directJoins: 0,
    today: 0,
    byStatus: {}
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          axios.get('/api/leads/stats'),
          axios.get('/api/leads/recent')
        ]);
        setStats(statsRes.data);
        setRecentLeads(recentRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
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

  if (loading) {
    return <div className="dashboard-loading">로딩 중...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <p>리드 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">총 리드 수</div>
          </div>
        </div>

        <div className="stat-card consult">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-value">{stats.consults}</div>
            <div className="stat-label">문의 리드</div>
          </div>
        </div>

        <div className="stat-card direct">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-value">{stats.directJoins}</div>
            <div className="stat-label">바로 입점 신청</div>
          </div>
        </div>

        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.today}</div>
            <div className="stat-label">오늘 생성</div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="status-summary">
        <h2>상태별 현황</h2>
        <div className="status-grid">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div className="status-item" key={status}>
              <span
                className="status-dot"
                style={{ backgroundColor: getStatusColor(status) }}
              />
              <span className="status-name">{status}</span>
              <span className="status-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="recent-leads">
        <div className="section-header">
          <h2>최근 리드</h2>
          <Link to="/admin/leads" className="view-all">
            전체 보기 →
          </Link>
        </div>

        <div className="leads-table">
          <table>
            <thead>
              <tr>
                <th>생성일</th>
                <th>타입</th>
                <th>이름</th>
                <th>매장명</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-message">
                    아직 리드가 없습니다.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{formatDate(lead.created_at)}</td>
                    <td>
                      <span className={`type-badge ${lead.type}`}>
                        {lead.type === 'consult' ? '문의' : '바로입점'}
                      </span>
                    </td>
                    <td>{lead.name}</td>
                    <td>{lead.store_name}</td>
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
                    <td>
                      <Link to={`/admin/leads/${lead.id}`} className="detail-link">
                        상세
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
