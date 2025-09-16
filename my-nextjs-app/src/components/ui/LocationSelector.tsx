'use client';

import { useState, useEffect } from 'react';
import { Location, mapService } from '../../services/api/mapService';
import LocationMap from './LocationMap';

interface LocationSelectorProps {
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
}

export default function LocationSelector({
  selectedLocation,
  onLocationSelect
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);

  // 대여점 목록 로드
  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true);
      try {
        const data = await mapService.getAllLocations();
        setLocations(data);
        setFilteredLocations(data);
      } catch (error) {
        console.error('대여점 목록을 불러오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  // 검색어에 따른 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLocations(locations);
      return;
    }

    const filtered = locations.filter(location =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLocations(filtered);
  }, [searchTerm, locations]);

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setShowMap(false);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const nearbyLocations = await mapService.getNearbyLocations(latitude, longitude, 10);
            setFilteredLocations(nearbyLocations);
            setSearchTerm('내 주변');
          } catch (error) {
            console.error('주변 대여점을 찾는데 실패했습니다:', error);
          }
        },
        (error) => {
          console.error('위치 정보를 가져오는데 실패했습니다:', error);
          alert('위치 정보를 가져올 수 없습니다. 수동으로 검색해주세요.');
        }
      );
    } else {
      alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
    }
  };

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="대여점명 또는 주소로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleCurrentLocation}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          📍 내 주변
        </button>
        <button
          onClick={() => setShowMap(!showMap)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {showMap ? '🗺️ 목록 보기' : '🗺️ 지도 보기'}
        </button>
      </div>

      {/* 선택된 대여점 표시 */}
      {selectedLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">선택된 대여점</h3>
          <div className="space-y-1">
            <p className="text-blue-800 font-medium">{selectedLocation.name}</p>
            <p className="text-blue-700 text-sm">{selectedLocation.address}</p>
            <p className="text-blue-700 text-sm">📞 {selectedLocation.phone}</p>
            <p className="text-blue-700 text-sm">🕒 {selectedLocation.operatingHours}</p>
          </div>
        </div>
      )}

      {/* 지도 또는 목록 표시 */}
      {showMap ? (
        <LocationMap
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          height="400px"
        />
      ) : (
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">대여점 목록을 불러오는 중...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '대여점 정보를 불러올 수 없습니다.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedLocation?.id === location.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{location.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">{location.address}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📞 {location.phone}</span>
                        <span>🕒 {location.operatingHours}</span>
                      </div>
                    </div>
                    {selectedLocation?.id === location.id && (
                      <span className="text-blue-600 text-sm font-medium">✓ 선택됨</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 대여점 통계 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{locations.length}</p>
            <p className="text-sm text-gray-600">전체 대여점</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {locations.filter(loc => loc.address.includes('서울')).length}
            </p>
            <p className="text-sm text-gray-600">서울 지역</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {locations.filter(loc => loc.address.includes('경기')).length}
            </p>
            <p className="text-sm text-gray-600">경기 지역</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {filteredLocations.length}
            </p>
            <p className="text-sm text-gray-600">검색 결과</p>
          </div>
        </div>
      </div>
    </div>
  );
} 