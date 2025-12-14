import React, { useState } from 'react';
import axios from 'axios';
import { uploadFile, supabase } from '../config/supabase';
import './Landing.css';

const Landing = () => {
  const [activeTab, setActiveTab] = useState('consult');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isComplete, setIsComplete] = useState(false);

  // Consult form state
  const [consultForm, setConsultForm] = useState({
    name: '',
    store_name: '',
    phone: '',
    email: '',
    store_link: ''
  });

  // Direct join form state
  const [joinForm, setJoinForm] = useState({
    name: '',
    store_name: '',
    phone: '',
    email: '',
    user_id: '',
    password: ''
  });
  const [files, setFiles] = useState({
    biz_registration: null,
    mailorder_cert: null,
    bank_copy: null
  });
  const [errors, setErrors] = useState({});

  // Validation functions
  const validatePhone = (phone) => {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateFile = (file) => {
    if (!file) return { valid: false, error: '파일을 선택해주세요.' };

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'PDF, JPG, PNG 파일만 업로드 가능합니다.' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: '파일 크기는 5MB 이하여야 합니다.' };
    }

    return { valid: true };
  };

  // Check for duplicate store name
  const checkDuplicateStore = async (storeName) => {
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .eq('store_name', storeName)
      .limit(1);

    if (error) {
      console.error('Store check error:', error);
      return false;
    }
    return data && data.length > 0;
  };

  // Check for duplicate user ID
  const checkDuplicateUserId = async (userId) => {
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('User ID check error:', error);
      return false;
    }
    return data && data.length > 0;
  };

  const handleConsultChange = (e) => {
    setConsultForm({ ...consultForm, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleJoinChange = (e) => {
    setJoinForm({ ...joinForm, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const fieldName = e.target.name;

    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setErrors({ ...errors, [fieldName]: validation.error });
        e.target.value = '';
        return;
      }
    }

    setFiles({ ...files, [fieldName]: file });
    setErrors({ ...errors, [fieldName]: '' });
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setErrors({});

    const newErrors = {};

    if (!consultForm.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    if (!consultForm.store_name.trim()) {
      newErrors.store_name = '매장명을 입력해주세요.';
    }
    if (!consultForm.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.';
    } else if (!validatePhone(consultForm.phone)) {
      newErrors.phone = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
    if (consultForm.email && !validateEmail(consultForm.email)) {
      newErrors.email = '이메일 형식이 올바르지 않습니다.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/leads/consult', consultForm);
      setMessage({ type: 'success', text: response.data.message });
      setConsultForm({
        name: '',
        store_name: '',
        phone: '',
        email: '',
        store_link: ''
      });
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.error ||
        '문의 접수 중 오류가 발생했습니다.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setErrors({});

    const newErrors = {};

    if (!joinForm.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    if (!joinForm.store_name.trim()) {
      newErrors.store_name = '매장명을 입력해주세요.';
    }
    if (!joinForm.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.';
    } else if (!validatePhone(joinForm.phone)) {
      newErrors.phone = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
    if (!joinForm.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(joinForm.email)) {
      newErrors.email = '이메일 형식이 올바르지 않습니다.';
    }
    if (!joinForm.user_id.trim()) {
      newErrors.user_id = '아이디를 입력해주세요.';
    }
    if (!joinForm.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (joinForm.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    if (!files.biz_registration) {
      newErrors.biz_registration = '사업자등록증을 첨부해주세요.';
    }

    if (files.mailorder_cert) {
      const validation = validateFile(files.mailorder_cert);
      if (!validation.valid) {
        newErrors.mailorder_cert = validation.error;
      }
    }
    if (files.bank_copy) {
      const validation = validateFile(files.bank_copy);
      if (!validation.valid) {
        newErrors.bank_copy = validation.error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      setMessage({ type: 'info', text: '중복 확인 중...' });

      const [isDuplicateStore, isDuplicateUserId] = await Promise.all([
        checkDuplicateStore(joinForm.store_name),
        checkDuplicateUserId(joinForm.user_id)
      ]);

      if (isDuplicateStore) {
        setErrors({ store_name: '이미 등록된 매장입니다.' });
        setMessage({ type: 'error', text: '이미 등록된 매장입니다.' });
        setLoading(false);
        return;
      }

      if (isDuplicateUserId) {
        setErrors({ user_id: '이미 사용 중인 아이디입니다.' });
        setMessage({ type: 'error', text: '이미 사용 중인 아이디입니다.' });
        setLoading(false);
        return;
      }

      setMessage({ type: 'info', text: '파일 업로드 중...' });

      const bizRegUrl = await uploadFile(files.biz_registration, 'biz_registration');

      let mailorderUrl = null;
      if (files.mailorder_cert) {
        mailorderUrl = await uploadFile(files.mailorder_cert, 'mailorder_cert');
      }

      let bankCopyUrl = null;
      if (files.bank_copy) {
        bankCopyUrl = await uploadFile(files.bank_copy, 'bank_copy');
      }

      setMessage({ type: 'info', text: '신청서 제출 중...' });

      const response = await axios.post('/api/leads/direct-join', {
        ...joinForm,
        biz_registration_url: bizRegUrl,
        mailorder_cert_url: mailorderUrl,
        bank_copy_url: bankCopyUrl
      });

      setIsComplete(true);
      setMessage({ type: 'success', text: response.data.message });

      setJoinForm({
        name: '',
        store_name: '',
        phone: '',
        email: '',
        user_id: '',
        password: ''
      });
      setFiles({
        biz_registration: null,
        mailorder_cert: null,
        bank_copy: null
      });
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
      });

    } catch (error) {
      console.error('Submit error:', error);
      const errorMsg = error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.error ||
        error.message ||
        '입점 신청 중 오류가 발생했습니다.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 완료 화면
  if (isComplete) {
    return (
      <div className="landing">
        <section className="complete-section">
          <div className="container">
            <div className="complete-card">
              <div className="complete-icon">✅</div>
              <h2>입점 신청 완료</h2>
              <p>입점 신청이 접수되었습니다.<br />서류 검토 후 연락드리겠습니다.</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsComplete(false);
                  setMessage({ type: '', text: '' });
                }}
              >
                돌아가기
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">쿠팡이츠 입점으로<br />매출 채널을 빠르게 열어보세요</h1>
          <p className="hero-subtitle">입점비 0원, 수수료는 판매될 때만 발생합니다</p>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="hero-stat-value">
                <span className="hero-stat-icon">📈</span>
                <span className="hero-stat-number">평균 +35%</span>
              </div>
              <div className="hero-stat-label">월 매출 증가</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">
                <span className="hero-stat-icon">📅</span>
                <span className="hero-stat-number">3개월</span>
              </div>
              <div className="hero-stat-label">수수료 50% 할인</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">
                <span className="hero-stat-icon">💰</span>
                <span className="hero-stat-number">0원</span>
              </div>
              <div className="hero-stat-label">초기 비용</div>
            </div>
          </div>

          <a href="#cta" className="btn btn-primary">입점 가능 여부 확인하기</a>
        </div>
      </section>

      {/* Growing Market Section */}
      <section className="growing-market">
        <div className="container">
          <div className="market-icon">📈</div>

          <h2 className="section-title">
            커져가는 배송시장,<br />
            <span className="highlight-blue">우리 가게도</span> 시작할 수 있을까?
          </h2>

          <div className="description-box">
            <p>쿠팡이츠 소핑은 <strong>생활에 필요한 모든 상품</strong>을 배달로 판매할 수 있는 퀵커머스예요.</p>
            <p>우리 가게의 상품을 고객이 원하는 시간에 <strong>'지금 바로'</strong> 전달해 드리면 어떨까요?</p>
            <p>오프라인의 재고를 넘어 온라인으로! <strong>1천만 고객</strong>이 사용하는 쿠팡이츠가 사장님들의 상품을 배달해드려요.</p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="container">
          <div className="categories-header">
            <h2>배달은 음식만 가능하다고 생각하셨나요? 🤔</h2>
            <p>쿠팡이츠 소핑은 생활에 필요한 것들도 배달해 드려요!</p>
          </div>

          <div className="categories-grid">
            <div className="category-card"><div className="category-icon">🌸</div><div className="category-name">꽃</div></div>
            <div className="category-card"><div className="category-icon">🍰</div><div className="category-name">반려용품</div></div>
            <div className="category-card"><div className="category-icon">📝</div><div className="category-name">문구류</div></div>
            <div className="category-card"><div className="category-icon">🛁</div><div className="category-name">생활용품</div></div>
            <div className="category-card"><div className="category-icon">👕</div><div className="category-name">패션</div></div>
            <div className="category-card"><div className="category-icon">💄</div><div className="category-name">뷰티</div></div>
            <div className="category-card"><div className="category-icon">🥗</div><div className="category-name">스포츠/레저</div></div>
            <div className="category-card"><div className="category-icon">📱</div><div className="category-name">디지털</div></div>
            <div className="category-card"><div className="category-icon">🎁</div><div className="category-name">편의점</div></div>
            <div className="category-card"><div className="category-icon">👜</div><div className="category-name">잡화</div></div>
            <div className="category-card"><div className="category-icon">🍱</div><div className="category-name">반찬</div></div>
            <div className="category-card"><div className="category-icon">🥖</div><div className="category-name">마트</div></div>
            <div className="category-card"><div className="category-icon">🍊</div><div className="category-name">과일</div></div>
            <div className="category-card"><div className="category-icon">🥩</div><div className="category-name">정육</div></div>
            <div className="category-card"><div className="category-icon">🐟</div><div className="category-name">수산물</div></div>
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section className="case-study">
        <div className="container">
          <div className="case-study-header">
            <h2>실제 입점 사장님들의 변화</h2>
            <p>추가 채널로 기존 매출은 그대로, 새로운 수익이 더해집니다</p>
          </div>

          <div className="case-grid">
            <div className="case-card">
              <div className="case-header">
                <div className="case-avatar">🌸</div>
                <div className="case-info">
                  <h3>○○플라워</h3>
                  <p>꽃집 · 서울 강남구</p>
                </div>
              </div>
              <div className="case-chart">
                <div className="chart-bars">
                  <div className="chart-bar">
                    <div className="bar" style={{ height: '100px' }}><span className="bar-value">320만원</span></div>
                    <div className="bar-label">입점 전</div>
                  </div>
                  <div className="chart-bar">
                    <div className="bar after" style={{ height: '135px' }}><span className="bar-value">432만원</span></div>
                    <div className="bar-label">입점 후</div>
                  </div>
                </div>
              </div>
              <div className="case-result">
                <div className="case-result-value">+35%</div>
                <div className="case-result-label">매출 증가</div>
              </div>
              <p className="case-note">오프라인 매장은 그대로 운영하면서<br />퀵커머스 채널만 추가</p>
            </div>

            <div className="case-card">
              <div className="case-header">
                <div className="case-avatar">🍰</div>
                <div className="case-info">
                  <h3>△△케이크</h3>
                  <p>디저트 카페 · 서울 마포구</p>
                </div>
              </div>
              <div className="case-chart">
                <div className="chart-bars">
                  <div className="chart-bar">
                    <div className="bar" style={{ height: '100px' }}><span className="bar-value">580만원</span></div>
                    <div className="bar-label">입점 전</div>
                  </div>
                  <div className="chart-bar">
                    <div className="bar after" style={{ height: '145px' }}><span className="bar-value">841만원</span></div>
                    <div className="bar-label">입점 후</div>
                  </div>
                </div>
              </div>
              <div className="case-result">
                <div className="case-result-value">+45%</div>
                <div className="case-result-label">매출 증가</div>
              </div>
              <p className="case-note">저녁 시간대 배달 주문으로<br />유휴시간 활용 극대화</p>
            </div>

            <div className="case-card">
              <div className="case-header">
                <div className="case-avatar">🍱</div>
                <div className="case-info">
                  <h3>□□반찬</h3>
                  <p>반찬 가게 · 서울 송파구</p>
                </div>
              </div>
              <div className="case-chart">
                <div className="chart-bars">
                  <div className="chart-bar">
                    <div className="bar" style={{ height: '100px' }}><span className="bar-value">270만원</span></div>
                    <div className="bar-label">입점 전</div>
                  </div>
                  <div className="chart-bar">
                    <div className="bar after" style={{ height: '130px' }}><span className="bar-value">351만원</span></div>
                    <div className="bar-label">입점 후</div>
                  </div>
                </div>
              </div>
              <div className="case-result">
                <div className="case-result-value">+30%</div>
                <div className="case-result-label">매출 증가</div>
              </div>
              <p className="case-note">단골 손님 외 신규 고객층<br />30대 직장인 유입 증가</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="reviews">
        <div className="container">
          <div className="reviews-header">
            <h2>입점 사장님들의 실제 후기</h2>
            <p>직접 경험하신 사장님들의 솔직한 이야기를 들어보세요</p>
          </div>

          <div className="reviews-grid">
            <div className="review-card">
              <div className="review-avatar-wrapper">
                <div className="review-avatar">😊</div>
                <div className="review-info">
                  <h3>김○○ 사장님</h3>
                  <p>꽃집 · 서울 강남구</p>
                </div>
              </div>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <div className="review-quote">처음엔 반신반의했는데, 입점 후 저녁 시간대 주문이 꾸준히 들어와요. AI 이미지 덕분에 클릭률도 높아진 것 같고, 관리도 생각보다 전혀 어렵지 않아요. 수수료 할인 기간에 시작해서 부담도 없었습니다.</div>
              <div className="review-date">2024년 11월</div>
            </div>

            <div className="review-card">
              <div className="review-avatar-wrapper">
                <div className="review-avatar">😄</div>
                <div className="review-info">
                  <h3>박○○ 사장님</h3>
                  <p>디저트 카페 · 서울 마포구</p>
                </div>
              </div>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <div className="review-quote">상품 등록부터 CS까지 다 해주셔서 진짜 편해요. 원래 배달앱 관리가 걱정이었는데, 전문가가 대행해주시니까 저는 케이크 만드는 데만 집중할 수 있어요. 매출도 30% 이상 늘었고요!</div>
              <div className="review-date">2024년 10월</div>
            </div>

            <div className="review-card">
              <div className="review-avatar-wrapper">
                <div className="review-avatar">🙂</div>
                <div className="review-info">
                  <h3>이○○ 사장님</h3>
                  <p>반찬 가게 · 서울 송파구</p>
                </div>
              </div>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <div className="review-quote">가장 좋은 건 오프라인 매출은 그대로인데 온라인 주문이 추가로 들어온다는 거예요. 단골 어르신들은 매장에서 계속 사시고, 젊은 직장인들은 배달로 주문하시더라고요. 완전 윈윈이에요!</div>
              <div className="review-date">2024년 11월</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem">
        <div className="container">
          <div className="problem-header">
            <h2>온라인 판매, 왜 망설이셨나요?</h2>
          </div>

          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">📷</div>
              <h3>사진이 예쁘게 안 나온다</h3>
              <p>핸드폰으로 찍으면 어둡고 평범해서 매력이 안 보여요</p>
            </div>

            <div className="problem-card">
              <div className="problem-icon">📉</div>
              <h3>배달앱 경쟁이 너무 심하다</h3>
              <p>광고비 쓰지 않으면 우리 매장이 고객 눈에 안 띄어요</p>
            </div>

            <div className="problem-card">
              <div className="problem-icon">😰</div>
              <h3>관리할 시간이 부족하다</h3>
              <p>상품 등록부터 CS까지 혼자 하기엔 너무 벅차요</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process">
        <div className="container">
          <div className="process-header">
            <h2>입점 과정은 이렇게 간단합니다</h2>
            <p>복잡한 절차 없이, 빠르게 시작하세요</p>
          </div>

          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-title">간단 신청</div>
              <div className="step-desc">1분이면 신청 완료<br />가능 여부 즉시 확인</div>
            </div>

            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-title">무료 상담</div>
              <div className="step-desc">전문가가 직접 방문<br />맞춤 제안</div>
            </div>

            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-title">입점 진행</div>
              <div className="step-desc">서류 대행 + AI 이미지<br />모두 지원</div>
            </div>

            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-title">판매 시작</div>
              <div className="step-desc">바로 주문 받기<br />매출 증대</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-header">
            <h2>지금 입점하면 좋은 이유</h2>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <div className="benefit-badge">한정 혜택</div>
              <div className="benefit-title">6.8% → 3%</div>
              <div className="benefit-subtitle">수수료 50% 할인 (90일)</div>
              <div className="benefit-desc">입점 후 3개월간 절반 수수료로 부담 없이 시작</div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🎁</div>
              <div className="benefit-badge">무료 제공</div>
              <div className="benefit-title">0원</div>
              <div className="benefit-subtitle">입점비 · 해지비 완전 무료</div>
              <div className="benefit-desc">초기 비용 없이 시작하고, 원할 때 자유롭게 중단 가능</div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <div className="benefit-badge">안심 보장</div>
              <div className="benefit-title">풀서비스</div>
              <div className="benefit-subtitle">상품 등록 대행 + CS 지원</div>
              <div className="benefit-desc">복잡한 과정은 전문가가 처리, 판매에만 집중하세요</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta" id="cta">
        <div className="container">
          <div className="cta-badge">
            🎁 12월 한정 · 입점 수수료 50% 할인 (3개월)
          </div>

          <h2>사장님 매장도 입점 가능할까요?</h2>
          <p className="cta-subtitle">1분이면 가능 여부를 바로 확인하실 수 있습니다</p>

          <div className="cta-toggle">
            <button
              type="button"
              className={`cta-toggle-btn ${activeTab === 'consult' ? 'active' : ''}`}
              onClick={() => setActiveTab('consult')}
            >
              문의하기
            </button>
            <button
              type="button"
              className={`cta-toggle-btn ${activeTab === 'direct_join' ? 'active' : ''}`}
              onClick={() => setActiveTab('direct_join')}
            >
              바로 입점하기
            </button>
          </div>

          <div className="form-container">
            {message.text && (
              <div className={`form-message ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* 문의하기 폼 */}
            {activeTab === 'consult' && (
              <form onSubmit={handleConsultSubmit}>
                <div className="form-group">
                  <label htmlFor="c_name">이름 <span className="required">*</span></label>
                  <input
                    type="text"
                    id="c_name"
                    name="name"
                    placeholder="홍길동"
                    value={consultForm.name}
                    onChange={handleConsultChange}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="c_store">매장명 <span className="required">*</span></label>
                  <input
                    type="text"
                    id="c_store"
                    name="store_name"
                    placeholder="행복한 꽃집"
                    value={consultForm.store_name}
                    onChange={handleConsultChange}
                    className={errors.store_name ? 'error' : ''}
                  />
                  {errors.store_name && <span className="error-text">{errors.store_name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="c_phone">연락처 <span className="required">*</span></label>
                  <input
                    type="tel"
                    id="c_phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    value={consultForm.phone}
                    onChange={handleConsultChange}
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="c_email">이메일 <span className="optional">(선택)</span></label>
                  <input
                    type="email"
                    id="c_email"
                    name="email"
                    placeholder="example@naver.com"
                    value={consultForm.email}
                    onChange={handleConsultChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="c_link">스마트스토어/자사몰 주소 <span className="optional">(선택)</span></label>
                  <input
                    type="text"
                    id="c_link"
                    name="store_link"
                    placeholder="스마트스토어 또는 자사몰 주소"
                    value={consultForm.store_link}
                    onChange={handleConsultChange}
                  />
                </div>
                <button type="submit" className="form-submit" disabled={loading}>
                  {loading ? '처리 중...' : '무료 상담 요청하기'}
                </button>
                <p className="form-notice">입력하신 정보는 상담 목적 외에는 절대 사용되지 않습니다.</p>
              </form>
            )}

            {/* 바로 입점하기 폼 */}
            {activeTab === 'direct_join' && (
              <form onSubmit={handleJoinSubmit}>
                <div className="form-group">
                  <label htmlFor="j_name">이름 <span className="required">*</span></label>
                  <input
                    type="text"
                    id="j_name"
                    name="name"
                    placeholder="홍길동"
                    value={joinForm.name}
                    onChange={handleJoinChange}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="j_store">매장명 <span className="required">*</span></label>
                  <input
                    type="text"
                    id="j_store"
                    name="store_name"
                    placeholder="행복한 꽃집"
                    value={joinForm.store_name}
                    onChange={handleJoinChange}
                    className={errors.store_name ? 'error' : ''}
                  />
                  {errors.store_name && <span className="error-text">{errors.store_name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="j_phone">연락처 <span className="required">*</span></label>
                  <input
                    type="tel"
                    id="j_phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    value={joinForm.phone}
                    onChange={handleJoinChange}
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="j_email">이메일 주소 <span className="required">*</span> (세금계산서 발행용)</label>
                  <input
                    type="email"
                    id="j_email"
                    name="email"
                    placeholder="example@naver.com"
                    value={joinForm.email}
                    onChange={handleJoinChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="j_biz">사업자등록증 <span className="required">*</span></label>
                  <input
                    type="file"
                    id="j_biz"
                    name="biz_registration"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className={errors.biz_registration ? 'error' : ''}
                  />
                  <span className="file-hint">PDF, JPG, PNG (최대 5MB)</span>
                  {errors.biz_registration && <span className="error-text">{errors.biz_registration}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="j_mailorder">통신판매신고증 <span className="optional">(선택 - 떡·수산·정육·반찬의 경우 영업신고증 추가 제출)</span></label>
                  <input
                    type="file"
                    id="j_mailorder"
                    name="mailorder_cert"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className={errors.mailorder_cert ? 'error' : ''}
                  />
                  <span className="file-hint">PDF, JPG, PNG (최대 5MB)</span>
                  {errors.mailorder_cert && <span className="error-text">{errors.mailorder_cert}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="j_bankbook">통장사본 <span className="optional">(선택 - 정산 계좌 · 토스뱅크 불가)</span></label>
                  <input
                    type="file"
                    id="j_bankbook"
                    name="bank_copy"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className={errors.bank_copy ? 'error' : ''}
                  />
                  <span className="file-hint">PDF, JPG, PNG (최대 5MB)</span>
                  {errors.bank_copy && <span className="error-text">{errors.bank_copy}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="j_userid">사용하실 아이디 <span className="required">*</span></label>
                  <input
                    type="text"
                    id="j_userid"
                    name="user_id"
                    placeholder="아이디 입력"
                    value={joinForm.user_id}
                    onChange={handleJoinChange}
                    className={errors.user_id ? 'error' : ''}
                  />
                  {errors.user_id && <span className="error-text">{errors.user_id}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="j_password">사용하실 비밀번호 <span className="required">*</span></label>
                  <input
                    type="password"
                    id="j_password"
                    name="password"
                    placeholder="비밀번호 입력 (6자 이상)"
                    value={joinForm.password}
                    onChange={handleJoinChange}
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>
                <button type="submit" className="form-submit" disabled={loading}>
                  {loading ? '처리 중...' : '바로 입점 신청하기'}
                </button>
                <p className="form-notice">입력하신 정보 및 서류는 입점 심사 및 정산을 위한 용도에만 사용됩니다.</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
