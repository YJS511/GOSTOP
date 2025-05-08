import './App.css'
import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Map, MapMarker, useKakaoLoader as useKakaoLoaderOrigin } from 'react-kakao-maps-sdk'

function useKakaoLoader() {
  useKakaoLoaderOrigin({
    appkey: '6ec8020798deac7ef2f8897ad1c5ccf1', // 자신의 appkey로 교체
    libraries: ['services'],
  })
}

function App() {
  useRegisterSW()
  useKakaoLoader()

  const [selectedTransports, setSelectedTransports] = useState<string[]>([])
  const [time, setTime] = useState(6)
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  const toggleTransport = (type: string) => {
    setSelectedTransports((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // 현재 위치를 가져오는 함수
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
            const latitude = position.coords.latitude
            const longitude = position.coords.longitude
            setLat(latitude)
            setLng(longitude)

            // 위도, 경도로 도로명 주소 찾기
            const geocoder = new window.kakao.maps.services.Geocoder()
            const latlng = new window.kakao.maps.LatLng(latitude, longitude)

            geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
              if (status === window.kakao.maps.services.Status.OK) {
                setAddress(result[0].address.address_name)
              }
            })
          },
          () => {
            alert('위치를 가져오는 데 실패했습니다.')
          }
      )
    } else {
      alert('이 브라우저는 위치를 지원하지 않습니다.')
    }
  }

  // 위치 문자열이 위도,경도 형식일 때 지도에 표시
  const isValidCoords = lat !== null && lng !== null

  useEffect(() => {
    getCurrentLocation() // 컴포넌트가 마운트되면 현재 위치를 가져옴
  }, [])

  return (
      <div className="app-wrapper">
        <div className="app-container">
          <header className="app-header">
            <div className="header-inner">
              <h1 className="header-logo">GOSTOP</h1>
              <button className="header-user-btn">
                <i className="fas fa-user user-icon"></i>
              </button>
            </div>
          </header>

          <main className="app-main">
            <section className="location-section">
              <h3 className="section-title">현재 위치</h3>
              <div className="location-input-wrapper">
                <input
                    type="text"
                    placeholder="위치를 입력하세요"
                    className="location-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
                <button className="location-btn" onClick={getCurrentLocation}>
                  <i className="fas fa-location-crosshairs location-btn-icon"></i>
                </button>
              </div>
              {isValidCoords && (
                  <div style={{ marginTop: '1rem' }}>
                    <Map
                        center={{ lat, lng }}
                        style={{ width: '100%', height: '250px', borderRadius: '10px' }}
                        level={3}
                    >
                      <MapMarker position={{ lat, lng }} />
                    </Map>
                  </div>
              )}
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
                    min="20"
                    max="720"
                    value={time}
                    onChange={(e) => setTime(parseInt(e.target.value))}
                    className="time-range-slider"
                    step="10"
                />
                <div className="time-range-labels">
                  <span className="time-range-label">20분</span>
                  <span className="time-range-label">
                    {Math.floor(time / 60)}시간 {time % 60}분
                  </span>
                  <span className="time-range-label">12시간</span>
                </div>
              </div>
            </section>

            <button className="start-btn" onClick={() => alert('경로 추천 기능은 제거되었습니다.')}>
              <i className="fas fa-random start-btn-icon"></i>
              랜덤 여행 시작하기
            </button>
          </main>
        </div>
      </div>
  )
}

export default App
