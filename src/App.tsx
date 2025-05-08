import './App.css'
import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Map, MapMarker, Circle, Polyline, useKakaoLoader as useKakaoLoaderOrigin } from 'react-kakao-maps-sdk'

type TransportMode = 'car' | 'bus' | 'subway' | 'walking'

function useKakaoLoader() {
  useKakaoLoaderOrigin({
    appkey: '6ec8020798deac7ef2f8897ad1c5ccf1', // 자신의 appkey로 교체
    libraries: ['services'],
  })
}

function App() {
  useRegisterSW()
  useKakaoLoader()

  const [selectedTransports, setSelectedTransports] = useState<TransportMode[]>([])
  const [time, setTime] = useState(6)
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [randomPoint, setRandomPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>([])

  const toggleTransport = (type: TransportMode) => {
    setSelectedTransports((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const speeds: Record<TransportMode, number> = {
    car: 40,
    bus: 30,
    subway: 35,
    walking: 5
  }

  // 현재 위치를 가져오는 함수
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          // Ensure latitude and longitude are not undefined before setting the state
          if (latitude !== undefined && longitude !== undefined) {
            setLat(latitude);
            setLng(longitude);

            // 위도, 경도로 도로명 주소 찾기
            const geocoder = new window.kakao.maps.services.Geocoder();
            const latlng = new window.kakao.maps.LatLng(latitude, longitude);

            geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
              if (status === window.kakao.maps.services.Status.OK) {
                setAddress(result[0].address.address_name);
              }
            });
          }
        },
        () => {
          alert('위치를 가져오는 데 실패했습니다.');
        }
      );
    } else {
      alert('이 브라우저는 위치를 지원하지 않습니다.');
    }
  }

  // 위치 문자열이 위도,경도 형식일 때 지도에 표시
  const isValidCoords = lat !== null && lng !== null

  const getAverageSpeed = () => {
    if (selectedTransports.length === 0) return 0
    const total = selectedTransports.reduce((sum, mode) => sum + (speeds[mode] || 0), 0)
    return total / selectedTransports.length
  }


  const checkLand = (lat: number, lng: number) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    const latlng = new window.kakao.maps.LatLng(lat, lng);

    return new Promise<boolean>((resolve) => {
      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (_result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve(true);  // Land
        } else {
          resolve(false); // Sea
        }
      });
    });
  }

  const generateRandomPoint = async (lat: number, lng: number, minRadiusInMeters: number, maxRadiusInMeters: number) => {
    let point;
    let distance;
    let isLand = false;

    do {
      const angle = Math.random() * 2 * Math.PI;
      distance = Math.random() * (maxRadiusInMeters - minRadiusInMeters) + minRadiusInMeters;
      const newLat = lat + (distance / 111320) * Math.sin(angle);
      const newLng = lng + (distance / (111320 * Math.cos(lat * (Math.PI / 180)))) * Math.cos(angle);

      // Check if the point is on land
      isLand = await checkLand(newLat, newLng);

      if (isLand) {
        point = { lat: newLat, lng: newLng };
      }
    } while (!isLand);  // If it's sea, retry

    return point;
  };

  type Road = { vertexes: number[] };

  // Helper to determine current transport mode for route
  const getTransportMode = (): 'car' | 'walk' => {
    if (selectedTransports.includes('walking')) return 'walk';
    return 'car';
  };

  const fetchRoute = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    try {
      const mode = getTransportMode();
      const endpoint = mode === 'walk'
        ? `https://apis-navi.kakaomobility.com/v1/walking/directions`
        : `https://apis-navi.kakaomobility.com/v1/directions`;

      const response = await fetch(`${endpoint}?origin=${start.lng},${start.lat}&destination=${end.lng},${end.lat}`, {
        headers: {
          Authorization: 'KakaoAK 9f4de54e30e64dde2e536f1dba0f5422' // Replace with your actual REST API key
        }
      });

      const data = await response.json();
      const path = (mode === 'walk'
        ? data.routes[0].sections[0].roads
        : data.routes[0].sections[0].roads) as Road[];

      const coordinates = path.flatMap((road) =>
        road.vertexes.reduce<{ lat: number; lng: number }[]>((acc, val, idx) => {
          if (idx % 2 === 0) acc.push({ lng: val, lat: road.vertexes[idx + 1] });
          return acc;
        }, [])
      );

      setRoutePath(coordinates);
    } catch (error) {
      console.error('Failed to fetch route:', error);
    }
  };

  const handleRandomTrip = async () => {
    if (!lat || !lng) {
      alert('위치를 먼저 확인하세요.')
      return
    }

    const minRadiusInMeters = (time / 60) * getAverageSpeed() * 1000;  // Smaller radius
    const maxRadiusInMeters = (time / 60) * getAverageSpeed() * 1500;  // Larger radius
    const randomLocation = await generateRandomPoint(lat, lng, minRadiusInMeters, maxRadiusInMeters);
    if (randomLocation) {
      setRandomPoint(randomLocation);
      await fetchRoute({ lat, lng }, randomLocation);
    }
  }

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
                            selectedTransports.includes(item.icon as TransportMode)
                                ? 'transport-btn-selected'
                                : 'transport-btn-default'
                        }`}
                        onClick={() => toggleTransport(item.icon as TransportMode)}
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

            {isValidCoords && (
              <div className="location-map-container">
                <Map
                  center={{ lat, lng }}
                  style={{ width: '100%', aspectRatio: '1', borderRadius: '10px' }}
                  level={3}
                >
                  <MapMarker position={{ lat, lng }} />
                  <Circle
                    center={{ lat, lng }}
                    radius={(time / 60) * getAverageSpeed() * 1500}
                    strokeWeight={0}
                    fillColor="rgba(135, 206, 250, 0.4)"
                    fillOpacity={1}
                  />
                  <Circle
                    center={{ lat, lng }}
                    radius={(time / 60) * getAverageSpeed() * 1000}
                    strokeWeight={0}
                    fillColor="#ffffff"
                    fillOpacity={0.5}
                  />
                  {randomPoint && (
                    <MapMarker position={randomPoint} />
                  )}
                  {routePath.length > 0 && (
                    <Polyline
                      path={routePath}
                      strokeWeight={5}
                      strokeColor="#FF0000"
                      strokeOpacity={0.8}
                      strokeStyle="solid"
                    />
                  )}
                </Map>
              </div>
            )}

            <button className="start-btn" onClick={handleRandomTrip}>
              <i className="fas fa-random start-btn-icon"></i>
              랜덤 여행 시작하기
            </button>
          </main>
        </div>
      </div>
  )
}

export default App
