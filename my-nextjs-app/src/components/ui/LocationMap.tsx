'use client';

import { useEffect, useRef, useState } from 'react';
import { Location } from '../../services/api/mapService';

interface LocationMapProps {
  locations: Location[];
  selectedLocation?: Location | null;
  onLocationSelect: (location: Location) => void;
  height?: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function LocationMap({
  locations,
  selectedLocation,
  onLocationSelect,
  height = '400px'
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 카카오맵 스크립트 로드
  useEffect(() => {
    const loadKakaoMap = () => {
      if (window.kakao) {
        setIsMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_MAP_API_KEY&libraries=services,clusterer`;
      // 실제 사용시: script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services,clusterer`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          setIsMapLoaded(true);
        });
      };
      document.head.appendChild(script);
    };

    loadKakaoMap();
  }, []);

  // 지도 초기화 및 마커 생성
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || locations.length === 0) return;

    // 지도 생성
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
      level: 8
    };

    const map = new window.kakao.maps.Map(mapRef.current, options);
    mapInstanceRef.current = map;

    // 기존 마커들 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새로운 마커들 생성
    const bounds = new window.kakao.maps.LatLngBounds();

    locations.forEach((location, index) => {
      const markerPosition = new window.kakao.maps.LatLng(location.lat, location.lng);
      
      // 마커 이미지 설정
      const markerImage = new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
        new window.kakao.maps.Size(31, 35)
      );

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        map: map,
        title: location.name,
        image: markerImage
      });

      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding:10px;min-width:200px;">
            <h3 style="margin:0 0 5px 0;font-size:16px;color:#333;">${location.name}</h3>
            <p style="margin:0 0 5px 0;font-size:14px;color:#666;">${location.address}</p>
            <p style="margin:0 0 5px 0;font-size:14px;color:#666;">📞 ${location.phone}</p>
            <p style="margin:0;font-size:14px;color:#666;">🕒 ${location.operatingHours}</p>
            <button onclick="selectLocation('${location.id}')" 
                    style="margin-top:10px;padding:5px 10px;background:#007bff;color:white;border:none;border-radius:3px;cursor:pointer;">
              이 지점 선택
            </button>
          </div>
        `
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
      });

      // 선택된 위치인 경우 다른 스타일 적용
      if (selectedLocation && selectedLocation.id === location.id) {
        marker.setImage(new window.kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
          new window.kakao.maps.Size(31, 35)
        ));
        infowindow.open(map, marker);
      }

      markersRef.current.push(marker);
      bounds.extend(markerPosition);
    });

    // 지도 범위 재설정
    map.setBounds(bounds);

    // 전역 함수 등록 (인포윈도우 내 버튼 클릭용)
    (window as any).selectLocation = (locationId: string) => {
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        onLocationSelect(location);
      }
    };

  }, [isMapLoaded, locations, selectedLocation, onLocationSelect]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ width: '100%', height }}
        className="rounded-lg border border-gray-300"
      />
      
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">지도를 불러오는 중...</p>
          </div>
        </div>
      )}
    </div>
  );
} 