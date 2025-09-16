import { Suspense } from 'react';

interface PaymentData {
  success: boolean;
  orderId: number;
  orderNo: string;
  status: string;
  statusMessage: string;
  totalAmount: number;
  cardAmount: number;
  pointsUsed: number;
  paymentInfo?: {
    tid: string;
    resultCode: string;
    resultMessage: string;
    approvedAt: string | null;
  };
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// SSR로 서버에서 결제 상태를 조회하는 함수
async function getPaymentResult(orderNo: string): Promise<PaymentData | null> {
  try {
    console.log('SSR: 결제 상태 조회 중...', orderNo);
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081';
    const response = await fetch(`${backendUrl}/api/payment/status/order/${orderNo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 항상 최신 데이터
    });

    if (!response.ok) {
      console.error('SSR: 결제 상태 조회 실패:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('SSR: 결제 상태 조회 성공:', data);
    return data;
    
  } catch (error) {
    console.error('SSR: 결제 상태 조회 중 오류:', error);
    return null;
  }
}

// SSR 결제 결과 페이지 (getServerSideProps 방식)
export default async function PaymentResultSSR({ searchParams }: PageProps) {
  const orderNo = typeof searchParams.orderNo === 'string' ? searchParams.orderNo : '';
  
  if (!orderNo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2 text-red-600">주문번호 없음</h1>
          <p className="text-gray-600 mb-4">결제 결과를 확인할 주문번호가 없습니다.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  // 서버에서 결제 상태 조회 (SSR)
  const paymentData = await getPaymentResult(orderNo);
  
  if (!paymentData || !paymentData.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2 text-red-600">결제 결과 조회 실패</h1>
          <p className="text-gray-600 mb-4">
            {paymentData?.message || '결제 결과를 조회할 수 없습니다.'}
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              새로고침
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = paymentData.status === 'COMPLETED';
  const getStatusIcon = () => {
    switch (paymentData.status) {
      case 'COMPLETED': return '✅';
      case 'FAILED': return '❌';
      case 'PENDING': return '⏳';
      case 'PENDING_APPROVAL': return '⏳';
      case 'APPROVED': return '✅';
      default: return '❓';
    }
  };

  const getStatusColor = () => {
    switch (paymentData.status) {
      case 'COMPLETED': return 'text-green-600';
      case 'APPROVED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING':
      case 'PENDING_APPROVAL': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">{getStatusIcon()}</div>
          <h1 className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
            {paymentData.statusMessage}
          </h1>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">주문번호:</div>
              <div className="font-mono">{paymentData.orderNo}</div>
              
              <div className="text-gray-600">총 결제금액:</div>
              <div className="font-semibold">{paymentData.totalAmount?.toLocaleString()}원</div>
              
              <div className="text-gray-600">카드 결제:</div>
              <div>{paymentData.cardAmount?.toLocaleString()}원</div>
              
              <div className="text-gray-600">적립금 사용:</div>
              <div>{paymentData.pointsUsed?.toLocaleString()}원</div>
              
              {paymentData.paymentInfo?.tid && (
                <>
                  <div className="text-gray-600">거래번호:</div>
                  <div className="font-mono text-xs">{paymentData.paymentInfo.tid}</div>
                </>
              )}
              
              <div className="text-gray-600">결제 상태:</div>
              <div className={`font-semibold ${getStatusColor()}`}>{paymentData.status}</div>
            </div>
          </div>

          {paymentData.paymentInfo?.approvedAt && (
            <p className="text-sm text-gray-600">
              승인시간: {new Date(paymentData.paymentInfo.approvedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {/* 진행 중인 결제는 새로고침 버튼 제공 */}
          {(paymentData.status === 'PENDING' || paymentData.status === 'PENDING_APPROVAL') && (
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              상태 새로고침
            </button>
          )}
          
          {isSuccess && (
            <button 
              onClick={() => window.location.href = '/order/list'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              주문 내역 보기
            </button>
          )}
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            홈으로 이동
          </button>
        </div>
        
        {/* SSR 표시 */}
        <p className="text-xs text-gray-400 mt-4">
          🏗️ SSR로 렌더링됨 - 새로고침해도 최신 상태 확인
        </p>
      </div>
    </div>
  );
}