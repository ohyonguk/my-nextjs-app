# 멀티 기능 웹 애플리케이션

Next.js로 구현한 다양한 기능을 포함한 웹 애플리케이션입니다.

## 🚀 주요 기능

### 📶 Wi-Fi QR 생성기
- Wi-Fi 네트워크 정보를 QR 코드로 생성
- WPA/WPA2/WPA3, WEP, 개방형 네트워크 지원
- 숨겨진 네트워크 지원
- SVG 형태로 QR 코드 다운로드

### 💳 주문/결제 시스템
- 사용자 로그인 및 인증
- 주문 생성 및 관리
- 이니시스 결제 연동 (팝업/리다이렉트 방식)
- 포인트 사용 및 부분 결제
- 결제 결과 처리 (성공/실패)
- 주문 내역 조회

### 👥 사용자 관리
- 사용자 등록 및 정보 관리
- 사용자 목록 조회
- 결제 내역 관리

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **스타일링**: Tailwind CSS 4.0
- **UI 컴포넌트**: Radix UI
- **결제**: 이니시스 PG 연동
- **QR 생성**: react-qr-code
- **암호화**: crypto-js

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── payment-result/     # 결제 결과 API
│   ├── order/                  # 주문 관련 페이지
│   │   ├── failed/            # 결제 실패
│   │   ├── success/           # 결제 성공
│   │   ├── result/            # 결제 결과
│   │   └── payment-popup/     # 결제 팝업
│   ├── order-history/         # 주문 내역
│   ├── payment-history/       # 결제 내역
│   └── users/                 # 사용자 관리
├── components/
│   ├── LoginForm.tsx          # 로그인 폼
│   ├── OrderForm.tsx          # 주문 폼
│   ├── UserRegistrationForm.tsx # 회원가입 폼
│   └── ui/                    # 공통 UI 컴포넌트
├── hooks/
│   └── user/                  # 사용자 관련 훅
└── utils/
    └── inicis.ts              # 이니시스 결제 유틸
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 브라우저에서 확인
- **홈페이지** (Wi-Fi QR 생성기): http://localhost:3000
- **주문하기**: http://localhost:3000/order
- **주문 내역**: http://localhost:3000/order-history
- **결제 내역**: http://localhost:3000/payment-history
- **사용자 관리**: http://localhost:3000/users

## 📱 주요 페이지

### Wi-Fi QR 생성기 (/)
- 네트워크 이름(SSID) 입력
- 보안 타입 선택 (WPA/WEP/Open)
- 패스워드 입력
- QR 코드 실시간 생성 및 SVG 다운로드

### 주문 시스템 (/order)
- 사용자 로그인
- 주문 금액 및 포인트 사용 설정
- 이니시스 결제 처리
- 결제 결과 확인

### 결제 방식
- **팝업 방식**: 새 창에서 결제 진행
- **리다이렉트 방식**: 페이지 이동으로 결제 진행
- **CSR/SSR**: 클라이언트/서버 사이드 결과 처리

## 🔧 개발 예정 기능

- [ ] 백엔드 API 연동
- [ ] 사용자 인증 시스템 강화
- [ ] 주문 관리 기능 확장
- [ ] 결제 내역 상세 보기
- [ ] 모바일 반응형 최적화

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
