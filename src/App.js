import './App.css'
import { useState, useEffect, useRef, useCallback } from 'react'

function App() {
  const [selectedTransports, setSelectedTransports] = useState([])
  const [time, setTime] = useState(20)
  const [address, setAddress] = useState('')

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);

  const toggleTransport = (type) => {
    setSelectedTransports((prev) => {
      // Prevent selecting bus or subway if car is already selected
      if ((type === 'bus' || type === 'subway') && prev.includes('car') && !prev.includes(type)) {
        return prev;
      }
      // Prevent selecting car if bus or subway is already selected
      if (type === 'car' && (prev.includes('bus') || prev.includes('subway')) && !prev.includes('car')) {
        return prev;
      }
      // 2. If selecting 'bus' or 'subway', ensure 'walking' is also selected
      if ((type === 'bus' || type === 'subway')) {
        if (prev.includes(type)) {
          // Deselecting bus/subway
          return prev.filter((t) => t !== type);
        } else {
          // Selecting bus/subway
          let newTransports = [...prev, type];
          if (!prev.includes('walking')) {
            newTransports.push('walking');
          }
          // Remove duplicates
          return Array.from(new Set(newTransports));
        }
      }
      // 3. If deselecting walking, also remove bus and subway if present
      if (type === 'walking') {
        if (prev.includes('walking')) {
          // Deselect walking, also remove bus and subway
          return prev.filter((t) => t !== 'walking' && t !== 'bus' && t !== 'subway');
        } else {
          // Selecting walking
          return [...prev, 'walking'];
        }
      }
      // Default toggle for other types (including 'car')
      return prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
    });
  }

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          if (latitude !== undefined && longitude !== undefined) {
            const appKey = 'US3lRlDB4J7h64o8wkq6kUYZAtYW44e7BGFUBz58';
            const url = `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${latitude}&lon=${longitude}&coordType=WGS84GEO&addressType=A10&appKey=${appKey}`;

            fetch(url)
              .then(response => response.json())
              .then(data => {
                if (data && data.addressInfo) {
                  const { legalDong, roadName, buildingName } = data.addressInfo;
                  const simplifiedAddress = `${legalDong} ${roadName}${buildingName ? ' ' + buildingName : ''}`;
                  setAddress(simplifiedAddress);
                } else {
                  setAddress(`위도: ${latitude.toFixed(5)}, 경도: ${longitude.toFixed(5)}`);
                }
                if (window.Tmapv2 && mapInstanceRef.current) {
                  // Remove previous marker if exists
                  if (markerRef.current) {
                    markerRef.current.setMap(null);
                  }
                  markerRef.current = new window.Tmapv2.Marker({
                    position: new window.Tmapv2.LatLng(latitude, longitude),
                    map: mapInstanceRef.current,
                  });
                  mapInstanceRef.current.setCenter(new window.Tmapv2.LatLng(latitude, longitude));
                }
              })
              .catch((error) => {
                console.error(error);
                alert('주소 변환에 실패했습니다.');
                setAddress(`위도: ${latitude.toFixed(5)}, 경도: ${longitude.toFixed(5)}`);
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
  }, [])

  useEffect(() => {
    getCurrentLocation()
    if (window.Tmapv2 && mapRef.current) {
      mapInstanceRef.current = new window.Tmapv2.Map(mapRef.current, {
        center: new window.Tmapv2.LatLng(37.49241689559544, 127.03171389453507),
        width: "100%",
        height: "100%",
        zoom: 15, // further zoomed in
        zoomControl: false,
        scrollwheel: true,
      });
    }
  }, [getCurrentLocation])

  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) {
      return;
    }
    // Remove previous circle if exists
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    if (selectedTransports.length === 0) {
      return;
    }
    const position = markerRef.current.getPosition();
    const latitude = position.lat();
    const longitude = position.lng();

    // Average speeds in meters per hour
    const speedTable = {
      car: 60000,
      bus: 40000,
      subway: 50000,
      walking: 5000,
    };
    // Reduction factors for each transport mode
    const reductionTable = {
      car: 0.7,      // 30% reduction
      bus: 0.6,      // 40% reduction
      subway: 0.5,   // 50% reduction
      walking: 0.4,  // 60% reduction
    };
    const transports = selectedTransports;
    const adjustedSpeeds = transports.map((t) => {
      return speedTable[t] || 0;
    });
    const totalSpeed = adjustedSpeeds.reduce((acc, s) => acc + s, 0);
    const avgSpeedMph = totalSpeed / transports.length;
    const avgSpeedMpm = avgSpeedMph / 60; // meters per minute
    let radius = avgSpeedMpm * time; // meters

    // Apply reduction factors based on selected transport modes
    // Use the most restrictive (minimum) reduction factor among selected transports
    if (transports.length > 0) {
      const reductions = transports.map((t) => reductionTable[t] || 1);
      const minReduction = Math.min(...reductions);
      radius = radius * minReduction;
    }

    circleRef.current = new window.Tmapv2.Circle({
      center: new window.Tmapv2.LatLng(latitude, longitude),
      radius: radius,
      strokeWeight: 2,
      strokeColor: "#3399ff",
      strokeOpacity: 0.7,
      fillColor: "#3399ff",
      fillOpacity: 0.2,
      map: mapInstanceRef.current,
    });
  }, [selectedTransports, time])

  return (
      <div className="app-wrapper">
        <div className="app-container">
          <header className="app-header">
            <div className="header-inner">
              <h1 className="header-logo">GOSTOP</h1>
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

            <div className="map-container">
              <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            </div>

            <button
              className="start-btn"
              onClick={() => {
                if (
                  !markerRef.current ||
                  !mapInstanceRef.current ||
                  !circleRef.current
                ) {
                  alert('지도를 초기화하거나 이동수단/시간을 선택해주세요.');
                  return;
                }
                // Get center and radius
                const center = circleRef.current.getCenter();
                const radius = circleRef.current.getRadius(); // in meters
                // Generate random angle and distance
                const theta = Math.random() * 2 * Math.PI;
                const r = radius * Math.sqrt(Math.random());
                // Convert meters to degrees
                // 1 deg latitude ~= 111,320 m, 1 deg longitude ~= 111,320 * cos(lat)
                const latConv = 111320;
                const lngConv = 111320 * Math.cos((center.lat() * Math.PI) / 180);
                const dLat = (r * Math.cos(theta)) / latConv;
                const dLng = (r * Math.sin(theta)) / lngConv;
                const lat = center.lat() + dLat;
                const lng = center.lng() + dLng;
                // Remove previous random markers if exist
                if (window._randomTravelMarkerA) {
                  window._randomTravelMarkerA.setMap(null);
                }
                if (window._randomTravelMarkerB) {
                  window._randomTravelMarkerB.setMap(null);
                }
                // Marker A: start point
                window._randomTravelMarkerA = new window.Tmapv2.Marker({
                  position: center,
                  map: mapInstanceRef.current,
                  label: 'A',
                });
                // Marker B: random destination (no label)
                window._randomTravelMarkerB = new window.Tmapv2.Marker({
                  position: new window.Tmapv2.LatLng(lat, lng),
                  map: mapInstanceRef.current,
                  label: '',
                });
                // Center map to random point
                mapInstanceRef.current.setCenter(new window.Tmapv2.LatLng(lat, lng));
              }}
            >
              <i className="fas fa-random start-btn-icon"></i>
              랜덤 여행 시작하기
            </button>
          </main>
        </div>
      </div>
  )
}

export default App
