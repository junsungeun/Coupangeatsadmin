import React, { useState } from 'react';
import axios from 'axios';
import './Landing.css';

const Landing = () => {
  const [activeTab, setActiveTab] = useState('consult');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

  const handleConsultChange = (e) => {
    setConsultForm({ ...consultForm, [e.target.name]: e.target.value });
  };

  const handleJoinChange = (e) => {
    setJoinForm({ ...joinForm, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

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

    try {
      const formData = new FormData();
      Object.keys(joinForm).forEach(key => {
        formData.append(key, joinForm[key]);
      });
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      const response = await axios.post('/api/leads/direct-join', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
      // Reset file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
      });
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.error ||
        '입점 신청 중 오류가 발생했습니다.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>쿠팡이츠 입점 + <span className="highlight">AI 브랜딩</span>으로<br /><span className="highlight">매출 채널</span>을 빠르게 열어보세요</h1>
              <p>입점비 0원, 수수료는 판매될 때만 / AI 이미지로 비주얼까지 개선</p>

              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-number">평균 +35%</div>
                  <div className="hero-stat-label">월 매출 증가</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">3개월</div>
                  <div className="hero-stat-label">수수료 50% 할인</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">0원</div>
                  <div className="hero-stat-label">초기 비용</div>
                </div>
              </div>

              <div className="hero-buttons">
                <a href="#cta" className="btn-primary">입점 가능 여부 확인하기</a>
                <a href="#showcase" className="btn-secondary">AI 이미지 샘플 보기</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image">
                <div className="floating-element">✨</div>
                <div className="floating-element">🌸</div>
                <div className="floating-element">🍰</div>
                <div className="floating-element">📦</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">실제 입점 사장님들의 변화</h2>
          <p className="section-subtitle">추가 채널로 기존 매출은 그대로, 새로운 수익이 더해집니다</p>

          <div className="case-study-intro">
            <p>쿠팡이츠는 <strong>기존 오프라인 매출에 영향을 주지 않으면서</strong><br />새로운 온라인 채널이 추가되는 구조입니다</p>
          </div>

          <div className="case-grid">
            {/* Case 1 */}
            <div className="case-card">
              <div className="case-header">
                <div className="case-icon">🌸</div>
                <div className="case-business">
                  <div className="case-type">꽃집</div>
                  <div className="case-name">○○플라워</div>
                </div>
              </div>
              <div className="case-chart">
                <div className="chart-label">월 매출 변화</div>
                <div className="chart-bars">
                  <div className="chart-bar">
                    <div className="bar" style={{ height: '100%' }}>
                      <span className="bar-value">320만원</span>
                    </div>
                    <div className="bar-label">입점 전</div>
                  </div>
                  <div className="chart-bar">
                    <div className="bar after" style={{ height: '135%' }}>
                      <span className="bar-value">432만원</span>
                    </div>
                    <div className="bar-label">입점 후</div>
                  </div>
                </div>
              </div>
              <div className="case-result">
                <span className="result-text">매출 증가</span>
                <span className="result-badge">+35%</span>
              </div>
              <p className="case-note">오프라인 매장은 그대로 운영하면서<br />퀵커머스 채널만 추가</p>
            </div>

            {/* Case 2 */}
            <div className="case-card">
              <div className="case-header">
                <div className="case-icon">🍰</div>
                <div className="case-business">
                  <div className="case-type">디저트 카페</div>
                  <div className="case-name">△△케이크</div>
                </div>
              </div>
              <div className="case-chart">
                <div className="chart-label">월 매출 변화</div>
                <div className="chart-bars">
                  <div className="chart-bar">
                    <div className="bar" style={{ height: '100%' }}>
                      <span className="bar-value">580만원</span>
                    </div>
                    <div className="bar-label">입점 전</div>
                  </div>
                  <div className="chart-bar">
                    <div className="bar after" style={{ height: '145%' }}>
                      <span className="bar-value">841만원</span>
                    </div>
                    <div className="bar-label">입점 후</div>
                  </div>
                </div>
              </div>
              <div className="case-result">
                <span className="result-text">매출 증가</span>
                <span className="result-badge">+45%</span>
              </div>
              <p className="case-note">저녁 시간대 배달 주문으로<br />유휴시간 활용 극대화</p>
            </div>

            {/* Case 3 */}
            <div className="case-card">
              <div className="case-header">
                <div className="case-icon">🍱</div>
                <div className="case-business">
                  <div className="case-type">반찬 가게</div>
                  <div className="case-name">□□반찬</div>
                </div>
              </div>
              <div className="case-chart">
                <div className="chart-label">월 매출 변화</div>
                <div className="chart-bars">
                  <div className="chart-bar">
                    <div className="bar" style={{ height: '100%' }}>
                      <span className="bar-value">270만원</span>
                    </div>
                    <div className="bar-label">입점 전</div>
                  </div>
                  <div className="chart-bar">
                    <div className="bar after" style={{ height: '130%' }}>
                      <span className="bar-value">351만원</span>
                    </div>
                    <div className="bar-label">입점 후</div>
                  </div>
                </div>
              </div>
              <div className="case-result">
                <span className="result-text">매출 증가</span>
                <span className="result-badge">+30%</span>
              </div>
              <p className="case-note">단골 손님 외 신규 고객층<br />30대 직장인 유입 증가</p>
            </div>
          </div>
        </div>
      </section>

      {/* Review Section */}
      <section className="section section-light">
        <div className="container">
          <h2 className="section-title">입점 사장님들의 실제 후기</h2>
          <p className="section-subtitle">직접 경험한 사장님들의 솔직한 이야기를 들어보세요</p>
          <div className="review-grid">
            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar">김○○</div>
                <div className="review-info">
                  <div className="review-author">김○○ 사장님</div>
                  <div className="review-business">꽃집 · 서울 강남구</div>
                </div>
              </div>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <p className="review-text">
                처음엔 반신반의했는데, 입점 후 <span className="review-highlight">저녁 시간대 주문이 꾸준히 들어와요.</span> AI 이미지 덕분에 클릭률도 높아진 것 같고, 관리도 생각보다 전혀 어렵지 않아요. 수수료 할인 기간에 시작해서 부담도 없었습니다.
              </p>
              <div className="review-date">2024년 11월</div>
            </div>

            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar">박○○</div>
                <div className="review-info">
                  <div className="review-author">박○○ 사장님</div>
                  <div className="review-business">디저트 카페 · 서울 마포구</div>
                </div>
              </div>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <p className="review-text">
                <span className="review-highlight">상품 등록부터 CS까지 다 해주셔서</span> 진짜 편해요. 원래 배달앱 관리가 걱정이었는데, 전문가가 대행해주시니까 저는 케이크 만드는 데만 집중할 수 있어요. 매출도 30% 이상 늘었고요!
              </p>
              <div className="review-date">2024년 10월</div>
            </div>

            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar">이○○</div>
                <div className="review-info">
                  <div className="review-author">이○○ 사장님</div>
                  <div className="review-business">반찬 가게 · 서울 송파구</div>
                </div>
              </div>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <p className="review-text">
                가장 좋은 건 <span className="review-highlight">오프라인 매출은 그대로인데 온라인 주문이 추가로</span> 들어온다는 거예요. 단골 어르신들은 매장에서 계속 사시고, 젊은 직장인들은 배달로 주문하시더라고요. 완전 윈윈이에요!
              </p>
              <div className="review-date">2024년 11월</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section section-light">
        <div className="container">
          <h2 className="section-title">온라인 판매, 왜 망설이셨나요?</h2>
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
              <div className="problem-icon">😓</div>
              <h3>관리할 시간이 부족하다</h3>
              <p>상품 등록부터 CS까지 혼자 하기엔 너무 벅차요</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">이 모든 걱정을 한 번에 해결합니다</h2>
          <p className="section-subtitle">복잡한 과정 없이, 전문가가 모두 대신해드립니다</p>
          <div className="solution-grid">
            <div className="solution-card">
              <span className="solution-badge">SOLUTION 1</span>
              <div className="solution-icon">✨</div>
              <h3>AI 이미지 합성</h3>
              <p>핸드폰 사진을 AI가 전문가급 퀄리티로 변환해드립니다</p>
              <div className="before-after">
                <div className="before-after-box">
                  <span className="before-after-label">변경 전</span>
                  <span>🌹</span>
                </div>
                <div className="before-after-box after">
                  <span className="before-after-label">AI 변경 후</span>
                  <span>💐</span>
                </div>
              </div>
            </div>
            <div className="solution-card">
              <span className="solution-badge">SOLUTION 2</span>
              <div className="solution-icon">🚀</div>
              <h3>쿠팡이츠 퀵커머스</h3>
              <p>반경 4km 내 1시간 배송으로 빠르게 고객을 만나세요</p>
            </div>
            <div className="solution-card">
              <span className="solution-badge">SOLUTION 3</span>
              <div className="solution-icon">🎯</div>
              <h3>풀 대행 서비스</h3>
              <p>상품 등록부터 CS까지, 해지도 자유롭게 가능합니다</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section section-light">
        <div className="container">
          <h2 className="section-title">입점 과정은 이렇게 간단합니다</h2>
          <p className="section-subtitle">복잡한 절차 없이, 빠르게 시작하세요</p>
          <div className="process-container">
            <div className="process-steps">
              <div className="process-step">
                <div className="process-number">1</div>
                <h3>간단 신청</h3>
                <p>1분이면 신청 완료<br />가능 여부 즉시 확인</p>
              </div>
              <div className="process-step">
                <div className="process-number">2</div>
                <h3>무료 상담</h3>
                <p>전문가가 직접 방문<br />맞춤 제안</p>
              </div>
              <div className="process-step">
                <div className="process-number">3</div>
                <h3>입점 진행</h3>
                <p>서류 대행 + AI 이미지<br />모두 지원</p>
              </div>
              <div className="process-step">
                <div className="process-number">4</div>
                <h3>판매 시작</h3>
                <p>바로 주문 받기<br />매출 증대</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="section" id="showcase">
        <div className="container">
          <h2 className="section-title">AI 이미지 합성 예시</h2>
          <p className="section-subtitle">실제 사장님 상품을 AI로 변환한 결과를 확인해보세요</p>
          <div className="showcase-grid">
            <div className="showcase-card">
              <div className="showcase-image">
                <span className="showcase-label before">변경 전</span>
                <span className="showcase-label after">AI 변경 후</span>
                <div className="showcase-divider"></div>
                <div className="showcase-handle">⟷</div>
                🌹
              </div>
              <div className="showcase-content">
                <span className="showcase-tag">꽃</span>
                <h3>장미 꽃다발</h3>
                <p>어두운 실내 → 스튜디오 조명 효과</p>
              </div>
            </div>
            <div className="showcase-card">
              <div className="showcase-image">
                <span className="showcase-label before">변경 전</span>
                <span className="showcase-label after">AI 변경 후</span>
                <div className="showcase-divider"></div>
                <div className="showcase-handle">⟷</div>
                🍰
              </div>
              <div className="showcase-content">
                <span className="showcase-tag">디저트</span>
                <h3>수제 케이크</h3>
                <p>평범한 배경 → 감성 카페 분위기</p>
              </div>
            </div>
            <div className="showcase-card">
              <div className="showcase-image">
                <span className="showcase-label before">변경 전</span>
                <span className="showcase-label after">AI 변경 후</span>
                <div className="showcase-divider"></div>
                <div className="showcase-handle">⟷</div>
                🍱
              </div>
              <div className="showcase-content">
                <span className="showcase-tag">반찬</span>
                <h3>집반찬 세트</h3>
                <p>핸드폰 플래시 → 자연광 고급 연출</p>
              </div>
            </div>
            <div className="showcase-card">
              <div className="showcase-image">
                <span className="showcase-label before">변경 전</span>
                <span className="showcase-label after">AI 변경 후</span>
                <div className="showcase-divider"></div>
                <div className="showcase-handle">⟷</div>
                📓
              </div>
              <div className="showcase-content">
                <span className="showcase-tag">문구</span>
                <h3>수제 다이어리</h3>
                <p>생활감 있는 책상 → 미니멀 배경</p>
              </div>
            </div>
            <div className="showcase-card">
              <div className="showcase-image">
                <span className="showcase-label before">변경 전</span>
                <span className="showcase-label after">AI 변경 후</span>
                <div className="showcase-divider"></div>
                <div className="showcase-handle">⟷</div>
                ☕
              </div>
              <div className="showcase-content">
                <span className="showcase-tag">공방</span>
                <h3>도자기 머그컵</h3>
                <p>일반 조명 → 제품 디테일 강조</p>
              </div>
            </div>
            <div className="showcase-card">
              <div className="showcase-image">
                <span className="showcase-label before">변경 전</span>
                <span className="showcase-label after">AI 변경 후</span>
                <div className="showcase-divider"></div>
                <div className="showcase-handle">⟷</div>
                🥐
              </div>
              <div className="showcase-content">
                <span className="showcase-tag">베이커리</span>
                <h3>크루아상 세트</h3>
                <p>형광등 아래 → 따뜻한 베이커리 감성</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section section-gradient">
        <div className="container">
          <h2 className="section-title">지금 입점하면 좋은 이유</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <span className="benefit-badge">한정 혜택</span>
              <div className="benefit-value">
                <span className="old">6.8%</span> → 3%
              </div>
              <h3>수수료 50% 할인 (90일)</h3>
              <p>입점 후 3개월간 절반 수수료로 부담 없이 시작</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎁</div>
              <span className="benefit-badge">무료 제공</span>
              <div className="benefit-value">0원</div>
              <h3>입점비 · 해지비 완전 무료</h3>
              <p>초기 비용 없이 시작하고, 원할 때 자유롭게 중단 가능</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <span className="benefit-badge">안심 보장</span>
              <div className="benefit-value">풀서비스</div>
              <h3>상품 등록 대행 + CS 지원</h3>
              <p>복잡한 과정은 전문가가 처리, 판매에만 집중하세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta">
        <div className="container">
          <div className="cta-special-offer">
            🎁 12월 한정 · SNS 광고 이미지 3종 무료 제작
          </div>

          <h2 className="cta-title">사장님 매장도 입점 가능할까요?</h2>
          <p className="cta-subtitle">1분이면 가능 여부를 바로 확인하실 수 있습니다</p>

          {/* Toggle Buttons */}
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

          {/* Form Container */}
          <div className="form-container">
            {message.text && (
              <div className={`form-message ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Consult Form */}
            {activeTab === 'consult' && (
              <form onSubmit={handleConsultSubmit}>
                <div className="form-group">
                  <label htmlFor="c_name">이름</label>
                  <input
                    type="text"
                    id="c_name"
                    name="name"
                    placeholder="홍길동"
                    value={consultForm.name}
                    onChange={handleConsultChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="c_store">매장명</label>
                  <input
                    type="text"
                    id="c_store"
                    name="store_name"
                    placeholder="행복한 꽃집"
                    value={consultForm.store_name}
                    onChange={handleConsultChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="c_phone">연락처</label>
                  <input
                    type="tel"
                    id="c_phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    value={consultForm.phone}
                    onChange={handleConsultChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="c_email">
                    이메일
                    <span style={{ fontWeight: 400, color: '#94a3b8' }}> (선택)</span>
                  </label>
                  <input
                    type="email"
                    id="c_email"
                    name="email"
                    placeholder="example@naver.com"
                    value={consultForm.email}
                    onChange={handleConsultChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="c_link">
                    매장 링크
                    <span style={{ fontWeight: 400, color: '#94a3b8' }}> (인스타/네이버지도 · 선택)</span>
                  </label>
                  <input
                    type="text"
                    id="c_link"
                    name="store_link"
                    placeholder="인스타그램 또는 네이버지도 링크"
                    value={consultForm.store_link}
                    onChange={handleConsultChange}
                  />
                </div>

                <button type="submit" className="form-submit" disabled={loading}>
                  {loading ? '처리 중...' : '무료 상담 요청하기'}
                </button>

                <p className="form-notice">
                  입력하신 정보는 상담 목적 외에는 절대 사용되지 않습니다.
                </p>
              </form>
            )}

            {/* Direct Join Form */}
            {activeTab === 'direct_join' && (
              <form onSubmit={handleJoinSubmit}>
                <div className="form-group">
                  <label htmlFor="j_name">이름</label>
                  <input
                    type="text"
                    id="j_name"
                    name="name"
                    placeholder="홍길동"
                    value={joinForm.name}
                    onChange={handleJoinChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="j_store">매장명</label>
                  <input
                    type="text"
                    id="j_store"
                    name="store_name"
                    placeholder="행복한 꽃집"
                    value={joinForm.store_name}
                    onChange={handleJoinChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="j_phone">연락처</label>
                  <input
                    type="tel"
                    id="j_phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    value={joinForm.phone}
                    onChange={handleJoinChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="j_email">이메일 주소 (세금계산서 발행용)</label>
                  <input
                    type="email"
                    id="j_email"
                    name="email"
                    placeholder="example@naver.com"
                    value={joinForm.email}
                    onChange={handleJoinChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="j_biz">사업자등록증</label>
                  <input
                    type="file"
                    id="j_biz"
                    name="biz_registration"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="j_mailorder">
                    통신판매신고증
                    <span style={{ fontWeight: 400, color: '#94a3b8' }}>
                      {' '}(떡·수산·정육·반찬의 경우 영업신고증 추가 제출)
                    </span>
                  </label>
                  <input
                    type="file"
                    id="j_mailorder"
                    name="mailorder_cert"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="j_bankbook">
                    통장사본
                    <span style={{ fontWeight: 400, color: '#94a3b8' }}>
                      {' '}(정산 계좌 · 토스뱅크 불가)
                    </span>
                  </label>
                  <input
                    type="file"
                    id="j_bankbook"
                    name="bank_copy"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="j_userid">사용하실 아이디</label>
                  <input
                    type="text"
                    id="j_userid"
                    name="user_id"
                    placeholder="아이디 입력"
                    value={joinForm.user_id}
                    onChange={handleJoinChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="j_password">사용하실 비밀번호</label>
                  <input
                    type="password"
                    id="j_password"
                    name="password"
                    placeholder="비밀번호 입력"
                    value={joinForm.password}
                    onChange={handleJoinChange}
                    required
                  />
                </div>

                <button type="submit" className="form-submit" disabled={loading}>
                  {loading ? '처리 중...' : '바로 입점 신청하기'}
                </button>

                <p className="form-notice">
                  입력하신 정보 및 서류는 입점 심사 및 정산을 위한 용도에만 사용됩니다.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
