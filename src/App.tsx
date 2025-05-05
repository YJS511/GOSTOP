import './App.css'
import { useState } from 'react'
import { Helmet } from 'react-helmet'

function App() {
  const [selectedTransports, setSelectedTransports] = useState<string[]>([])
  const [time, setTime] = useState(6)

  const toggleTransport = (type: string) => {
    setSelectedTransports((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
  }

  return (
    <div className="app-container">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </Helmet>
      <header className="app-header">
        <div className="header-inner">
          <h1 className="header-logo">GOSTOP</h1>
          <button className="header-user-btn">
            <i className="fas fa-user user-icon"></i>
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="intro-section">
          <h2 className="intro-title">랜덤 여행을 시작하세요!</h2>
          <p className="intro-desc">새로운 모험이 당신을 기다립니다</p>
        </section>

        <section className="transport-section">
          <h3 className="section-title">이동 수단 선택</h3>
          <div className="transport-grid">
            {[
              { icon: 'car', label: '자동차' },
              { icon: 'bus', label: '버스' },
              { icon: 'subway', label: '지하철' },
              { icon: 'walking', label: '도보' },
            ].map((item) => (
              <button
                key={item.icon}
                className={`transport-btn ${
                  selectedTransports.includes(item.icon)
                    ? 'transport-btn-selected'
                    : 'transport-btn-default'
                }`}
                onClick={() => toggleTransport(item.icon)}
              >
                <i className={`fas fa-${item.icon} transport-btn-icon`}></i>
                <span className="transport-btn-label">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="time-section">
          <h3 className="section-title">여행 시간 설정</h3>
          <div className="time-range-container">
            <input
              type="range"
              min="1"
              max="12"
              value={time}
              onChange={(e) => setTime(parseInt(e.target.value))}
              className="time-range-slider"
            />
            <div className="time-range-labels">
              <span className="time-range-label">1시간</span>
              <span className="time-range-label">{time}시간</span>
              <span className="time-range-label">12시간</span>
            </div>
          </div>
        </section>

        <section className="location-section">
          <h3 className="section-title">현재 위치</h3>
          <div className="location-input-wrapper">
            <input
              type="text"
              placeholder="위치를 입력하세요"
              className="location-input"
            />
            <button className="location-btn">
              <i className="fas fa-location-crosshairs location-btn-icon"></i>
            </button>
          </div>
        </section>

        <button className="start-btn">
          <i className="fas fa-random start-btn-icon"></i>
          랜덤 여행 시작하기
        </button>

        <section className="stats-section">
          <h3 className="section-title">오늘의 통계</h3>
          <div className="stats-grid">
            <div className="stats-card">
              <p className="stats-label">인기 이동수단</p>
              <div className="stats-value">
                <i className="fas fa-subway stats-icon"></i>
                <span className="stats-main">지하철</span>
              </div>
            </div>
            <div className="stats-card">
              <p className="stats-label">평균 여행 시간</p>
              <div className="stats-value">
                <i className="fas fa-clock stats-icon"></i>
                <span className="stats-main">4.5시간</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
