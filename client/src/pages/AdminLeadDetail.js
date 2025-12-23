import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminLeadDetail.css';

const AdminLeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: '',
    business_type: '',
    memo: '',
    assigned_admin_id: ''
  });

  const statusOptions = ['신규', '연락완료', '상담중', '입점진행', '입점완료', '보류', '이탈'];
  const businessTypeOptions = ['꽃집', '디저트', '문구', '반찬', '베이커리', '공방', '기타'];

  // Fetch admin users for dropdown
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

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await axios.get(`/api/leads/${id}`);
        setLead(response.data);
        setEditForm({
          status: response.data.status || '',
          business_type: response.data.business_type || '',
          memo: response.data.memo || '',
          assigned_admin_id: response.data.assigned_admin_id || ''
        });
      } catch (err) {
        setError('리드 정보를 불러오는데 실패했습니다.');
        console.error('Failed to fetch lead:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.put(`/api/leads/${id}`, editForm);
      setLead(response.data.lead);
      setSuccessMessage('저장되었습니다.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('저장에 실패했습니다.');
      console.error('Failed to save lead:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 리드를 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/leads/${id}`);
      navigate('/admin/leads');
    } catch (err) {
      setError('삭제에 실패했습니다.');
      console.error('Failed to delete lead:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
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
    return <div className="detail-loading">로딩 중...</div>;
  }

  if (!lead) {
    return <div className="detail-error">리드를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="lead-detail">
      <div className="detail-header">
        <div className="header-left">
          <Link to="/admin/leads" className="back-link">
            ← 목록으로
          </Link>
          <h1>리드 상세</h1>
          <span className={`type-badge ${lead.type}`}>
            {lead.type === 'consult' ? '문의' : '바로 입점'}
          </span>
        </div>
        <button className="delete-btn" onClick={handleDelete}>
          삭제
        </button>
      </div>

      {error && <div className="message error">{error}</div>}
      {successMessage && <div className="message success">{successMessage}</div>}

      <div className="detail-content">
        {/* Basic Info */}
        <div className="detail-card">
          <h2>기본 정보</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>이름</label>
              <span>{lead.name}</span>
            </div>
            <div className="info-item">
              <label>매장명</label>
              <span>{lead.store_name}</span>
            </div>
            <div className="info-item">
              <label>연락처</label>
              <span>
                <a href={`tel:${lead.phone}`} className="contact-link">
                  {lead.phone}
                </a>
              </span>
            </div>
            <div className="info-item">
              <label>이메일</label>
              <span>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="contact-link">
                    {lead.email}
                  </a>
                ) : '-'}
              </span>
            </div>
            <div className="info-item">
              <label>매장 링크</label>
              <span>
                {lead.store_link ? (
                  <a href={lead.store_link} target="_blank" rel="noopener noreferrer" className="external-link">
                    링크 열기 ↗
                  </a>
                ) : '-'}
              </span>
            </div>
            <div className="info-item">
              <label>생성일</label>
              <span>{formatDate(lead.created_at)}</span>
            </div>
            <div className="info-item">
              <label>수정일</label>
              <span>{formatDate(lead.updated_at)}</span>
            </div>
            <div className="info-item">
              <label>담당자</label>
              <span className={`admin-info ${lead.assigned_admin_name ? '' : 'unassigned'}`}>
                {lead.assigned_admin_name || '미지정'}
              </span>
            </div>
          </div>
        </div>

        {/* Documents (for direct_join only) */}
        {lead.type === 'direct_join' && (
          <div className="detail-card">
            <h2>제출 서류</h2>
            <div className="documents-grid">
              <div className="document-item">
                <label>사업자등록증</label>
                {lead.biz_registration_url ? (
                  <a href={lead.biz_registration_url} target="_blank" rel="noopener noreferrer" className="document-link">
                    📄 다운로드
                  </a>
                ) : <span className="no-file">미제출</span>}
              </div>
              <div className="document-item">
                <label>통신판매신고증</label>
                {lead.mailorder_cert_url ? (
                  <a href={lead.mailorder_cert_url} target="_blank" rel="noopener noreferrer" className="document-link">
                    📄 다운로드
                  </a>
                ) : <span className="no-file">미제출</span>}
              </div>
              <div className="document-item">
                <label>통장사본</label>
                {lead.bank_copy_url ? (
                  <a href={lead.bank_copy_url} target="_blank" rel="noopener noreferrer" className="document-link">
                    📄 다운로드
                  </a>
                ) : <span className="no-file">미제출</span>}
              </div>
            </div>

            <div className="account-info">
              <h3>계정 정보</h3>
              <div className="info-row">
                <label>희망 아이디</label>
                <span>{lead.user_id || '-'}</span>
              </div>
              <div className="info-row">
                <label>비밀번호</label>
                <span className="password-status">
                  {lead.password_hash ? '✓ 설정됨' : '미설정'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Management */}
        <div className="detail-card">
          <h2>관리</h2>
          <div className="management-form">
            <div className="form-row">
              <div className="form-group">
                <label>상태</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleChange}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>업종</label>
                <select
                  name="business_type"
                  value={editForm.business_type}
                  onChange={handleChange}
                >
                  <option value="">선택안함</option>
                  {businessTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>담당자</label>
                <select
                  name="assigned_admin_id"
                  value={editForm.assigned_admin_id}
                  onChange={handleChange}
                >
                  <option value="">미지정</option>
                  {adminUsers.map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label>메모</label>
              <textarea
                name="memo"
                value={editForm.memo}
                onChange={handleChange}
                rows={4}
                placeholder="내부 메모, 영업 기록 등을 입력하세요..."
              />
            </div>

            <div className="form-actions">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        {lead.activityLogs && lead.activityLogs.length > 0 && (
          <div className="detail-card">
            <h2>활동 기록</h2>
            <div className="activity-list">
              {lead.activityLogs.map((log, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {log.action === 'status_change' ? '🔄' : log.action === 'assigned_admin_change' ? '👤' : '📝'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      {log.action === 'status_change' ? (
                        <>
                          상태 변경: <span className="old-value">{log.old_value}</span>
                          {' → '}
                          <span className="new-value" style={{ color: getStatusColor(log.new_value) }}>
                            {log.new_value}
                          </span>
                        </>
                      ) : log.action === 'assigned_admin_change' ? (
                        <>
                          담당자 변경: <span className="old-value">{log.old_value}</span>
                          {' → '}
                          <span className="new-value">{log.new_value}</span>
                        </>
                      ) : (
                        '메모 수정'
                      )}
                    </div>
                    <div className="activity-meta">
                      {log.admin_name || '관리자'} · {formatDate(log.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeadDetail;
