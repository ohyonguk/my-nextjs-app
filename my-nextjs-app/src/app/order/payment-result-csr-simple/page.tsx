'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface PaymentResult {
  status: 'loading' | 'success' | 'failure' | 'error';
  message: string;
  orderNo?: string;
}

function PaymentResultContent() {
  const [result, setResult] = useState<PaymentResult>({
    status: 'loading',
    message: '결제 결과를 처리 중입니다...'
  });
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const processResult = () => {
      try {
        console.log('CSR Simple: 시작');
        
        if (!searchParams) {
          setResult({
            status: 'error',
            message: 'URL 파라미터를 읽을 수 없습니다.'
          });
          return;
        }

        // 모든 파라미터 출력
        const params: Record<string, string> = {};
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
        
        console.log('CSR Simple: 받은 파라미터:', params);

        // 에러 체크
        const errorFlag = searchParams.get('error');
        const errorMessage = searchParams.get('message');
        
        if (errorFlag === '1') {
          setResult({
            status: 'error',
            message: errorMessage || 'POST 데이터 처리 중 오류가 발생했습니다.'
          });
          return;
        }

        const orderNo = searchParams.get('oid') || 
                       searchParams.get('orderNumber') || 
                       searchParams.get('P_OID') || 
                       searchParams.get('MOID');

        const resultCode = searchParams.get('resultCode') || 
                          searchParams.get('P_STATUS');

        console.log('CSR Simple: 주문번호:', orderNo);
        console.log('CSR Simple: 결과코드:', resultCode);

        if (!orderNo) {
          setResult({
            status: 'error',
            message: '주문번호가 없습니다.'
          });
          return;
        }

        // 간단한 결과 처리
        if (resultCode === '0000') {
          setResult({
            status: 'success',
            message: '결제가 완료되었습니다.',
            orderNo
          });
        } else {
          setResult({
            status: 'failure',
            message: `결제 실패: ${resultCode || 'Unknown'}`
          });
        }

      } catch (error) {
        console.error('CSR Simple: 오류:', error);
        setResult({
          status: 'error',
          message: '처리 중 오류가 발생했습니다.'
        });
      }
    };

    // 컴포넌트 마운트 후 처리
    const timer = setTimeout(processResult, 100);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (result.status) {
      case 'success': return '✅';
      case 'failure': return '❌';
      case 'error': return '⚠️';
      default: return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'success': return 'text-green-600';
      case 'failure': return 'text-red-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">{getStatusIcon()}</div>
          <h1 className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
            {result.status === 'loading' && '처리 중...'}
            {result.status === 'success' && '결제 완료'}
            {result.status === 'failure' && '결제 실패'}
            {result.status === 'error' && '처리 오류'}
          </h1>
          <p className="text-gray-600 mb-4">{result.message}</p>
          
          {result.orderNo && (
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">주문번호</p>
              <p className="font-mono text-lg">{result.orderNo}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {result.status === 'success' && (
            <button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/order/list';
                }
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              주문 내역 보기
            </button>
          )}
          
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            홈으로 이동
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-4">
          🔍 CSR Simple - 파라미터 기반 처리
        </p>
      </div>
    </div>
  );
}

export default function PaymentResultCSRSimple() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}