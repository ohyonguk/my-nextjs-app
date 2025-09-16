# SK렌터카 단기렌트 클론 프로젝트

Next.js로 구현한 SK렌터카 단기렌트 페이지 클론 프로젝트입니다.

## 🚀 주요 기능

### 📍 지도 API 통합
- **카카오맵 API**를 사용한 대여점 위치 표시
- 대여점 검색 및 필터링
- 현재 위치 기반 주변 대여점 검색
- 지도/목록 뷰 전환

### 🚗 차량 관리
- 차량 목록 표시
- 카테고리별 필터링 (경차, 중형차, 대형차, SUV)
- 예약 가능/불가 상태 표시
- 차량 상세 정보 (가격, 옵션 등)

### 👥 회원 관리
- 회원 목록 조회
- 회원 정보 수정/삭제
- 역할별 회원 관리

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **지도 API**: 카카오맵 API
- **상태 관리**: React Hooks
- **스타일링**: Tailwind CSS

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── members/          # 회원 관리 페이지
│   ├── short-rent/       # 단기렌트 페이지
│   └── ...
├── components/
│   ├── cars/            # 차량 관련 컴포넌트
│   ├── members/         # 회원 관련 컴포넌트
│   └── ui/              # 공통 UI 컴포넌트
├── services/
│   ├── api/             # API 서비스
│   ├── user/            # 사용자 관련 서비스
│   └── ...
└── hooks/
    └── user/            # 커스텀 훅
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 카카오맵 API 키 설정

#### 카카오맵 API 키 발급
1. [카카오 개발자 센터](https://developers.kakao.com/)에 접속
2. 애플리케이션 생성
3. JavaScript 키 복사

#### 환경변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key_here
```

#### 또는 직접 수정
`src/components/ui/LocationMap.tsx` 파일에서 다음 라인을 수정:

```typescript
// 현재:
script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_MAP_API_KEY&libraries=services,clusterer`;

// 수정 후:
script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=실제_API_키&libraries=services,clusterer`;
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 브라우저에서 확인
- **홈페이지**: http://localhost:3000
- **회원 관리**: http://localhost:3000/members
- **단기렌트**: http://localhost:3000/short-rent

## 🗺️ 지도 기능

### 대여점 검색
- 대여점명 또는 주소로 검색
- 현재 위치 기반 주변 대여점 검색
- 지역별 필터링

### 지도 표시
- 카카오맵을 통한 대여점 위치 표시
- 마커 클릭 시 상세 정보 표시
- 선택된 대여점 하이라이트

### 대여점 정보
- 대여점명, 주소, 연락처
- 운영시간
- 선택 상태 표시

## 🚗 차량 기능

### 차량 목록
- 차량 이미지 및 정보 표시
- 카테고리별 분류
- 가격 정보

### 예약 시스템
- 예약 가능/불가 상태 표시
- 예약 버튼 (기능 구현 예정)

## 👥 회원 기능

### 회원 관리
- 회원 목록 테이블 형태로 표시
- 회원 정보 수정/삭제
- 새 회원 추가

### 역할 관리
- 관리자/일반회원 구분
- 역할별 필터링

## 🔧 추가 개발 예정

- [ ] 실제 예약 시스템 구현
- [ ] 결제 시스템 연동
- [ ] 사용자 인증 시스템
- [ ] 실시간 차량 가용성 확인
- [ ] 모바일 앱 연동

## 📝 라이선스

이 프로젝트는 학습 목적으로 제작되었습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.
