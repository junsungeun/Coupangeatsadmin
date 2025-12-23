import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminUserList.css';

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage({ type: '', text: '' });

    const newErrors = {};
    if (!createForm.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    if (!createForm.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (createForm.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }
    if (!createForm.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/admin/register', createForm);
      setMessage({ type: 'success', text: '관리자 계정이 생성되었습니다.' });
      setCreateForm({ email: '', password: '', name: '' });
      setShowCreateForm(false);
      fetchUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.error ||
        '계정 생성 중 오류가 발생했습니다.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-user-list">
      <div className="page-header">
        <h1>관리자 계정 관리</h1>
        <button
          className="create-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '취소' : '+ 새 관리자 추가'}
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="create-form-container">
          <h2>새 관리자 계정 생성</h2>
          <form onSubmit={handleSubmit} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>이름 (담당자명) *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="홍길동"
                  value={createForm.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>이메일 (로그인 ID) *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@example.com"
                  value={createForm.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>비밀번호 *</label>
                <input
                  type="password"
                  name="password"
                  placeholder="6자 이상"
                  value={createForm.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? '생성 중...' : '계정 생성'}
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : users.length === 0 ? (
          <div className="empty">등록된 관리자가 없습니다.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>생성일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="name-cell">{user.name || '-'}</td>
                  <td className="email-cell">{user.email}</td>
                  <td className="date-cell">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUserList;
