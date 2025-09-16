'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const [orderInfo, setOrderInfo] = useState({
    message: '',
    error: '',
    status: ''
  });

  useEffect(() => {
    const message = searchParams.get('message') || '결제가 실패했습니다.';
    const error = searchParams.get('error') || '';
    const status = searchParams.get('status') || '';

    setOrderInfo({
      message,
      error,
      status
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        {/* 실패 아이콘 */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>

        {/* 실패 메시지 */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">결제 실패</h1>
        <p className="text-gray-600 mb-6">{orderInfo.message}</p>

        {/* 오류 정보 */}
        {orderInfo.error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
            <h2 className="text-lg font-semibold text-red-800 mb-2">오류 상세</h2>
            <p className="text-sm text-red-700">{orderInfo.error}</p>
          </div>
        )}

        {/* 실패 원인 및 해결방법 안내 */}
        <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">결제 실패 원인</h2>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 카드 한도 초과</li>
            <li>• 카드 정보 오류</li>
            <li>• 네트워크 연결 문제</li>
            <li>• 카드사 승인 거부</li>
          </ul>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <Link 
            href="/order"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-center font-medium"
          >
            다시 주문하기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
          >
            이전 페이지로
          </button>
        </div>

        {/* 고객 안내 */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            결제 문제가 지속적으로 발생하면 고객센터로 연락해 주세요.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            고객센터: 1588-0000 (평일 09:00~18:00)
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderFailed() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <OrderFailedContent />
    </Suspense>
  );
}