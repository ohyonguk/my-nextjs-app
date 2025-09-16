'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Payment {
  paymentId: number;
  tid: string;
  amount: number;
  status: string;
  paymentType: string;
  paymentTypeDescription: string;
  resultCode: string;
  resultMsg: string;
  paymentDate: string;
  cardName: string;
  canRefund: boolean;
}

interface OrderDetail {
  orderId: number;
  orderNo: string;
  totalAmount: number;
  cardAmount: number;
  pointsUsed: number;
  status: string;
  statusMessage: string;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [refunding, setRefunding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderInfo, setOrderInfo] = useState({
    message: '',
    orderNo: '',
    amount: '',
    status: ''
  });

  useEffect(() => {
    const message = searchParams.get('message') || '주문이 완료되었습니다.';
    const orderNo = searchParams.get('orderNo') || '';
    const amount = searchParams.get('amount') || '0';
    const status = searchParams.get('status') || '';

    setOrderInfo({
      message,
      orderNo,
      amount,
      status
    });

    // 주문번호가 있으면 상세 정보 조회
    if (orderNo) {
      fetchOrderDetail(orderNo);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchOrderDetail = async (orderNo: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8081/api/payment/order-detail/${orderNo}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('주문 정보를 불러오는데 실패했습니다');
      }

      const data = await response.json();
      if (data.success) {
        const orderDetail: OrderDetail = {
          orderId: data.orderId,
          orderNo: data.orderNo,
          totalAmount: data.totalAmount,
          cardAmount: data.cardAmount,
          pointsUsed: data.pointsUsed,
          status: data.status,
          statusMessage: data.statusMessage,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          payments: data.payments || []
        };
        setOrderDetail(orderDetail);
      }
    } catch (error) {
      console.error('Order detail fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    const orderNo = orderDetail?.orderNo || orderInfo.orderNo;
    if (!orderNo) {
      alert('주문번호가 없습니다.');
      return;
    }

    if (!confirm(`전체 결제를 취소하시겠습니까?\n주문번호: ${orderNo}`)) {
      return;
    }

    const refundReason = prompt('취소 사유를 입력해주세요:', '고객 요청');
    if (!refundReason) {
      return;
    }

    try {
      setRefunding(true);

      const response = await fetch(`http://localhost:8081/api/payment/refund/order/${orderNo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: refundReason,
          clientIp: '127.0.0.1'
        }),
      });

      if (!response.ok) {
        throw new Error('결제 취소 요청이 실패했습니다');
      }

      const data = await response.json();
      if (data.success) {
        alert('결제가 성공적으로 취소되었습니다');
        router.push('/order-history');
      } else {
        alert(`결제 취소 실패: ${data.message}`);
      }
    } catch (error) {
      console.error('Refund error:', error);
      alert('결제 취소 중 오류가 발생했습니다');
    } finally {
      setRefunding(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getPaymentStatusBadge = (payment: Payment | null) => {
    if (!payment) return null;

    switch (payment.status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">결제 완료</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">결제 실패</span>;
      case 'REFUNDED':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">결제 취소</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{payment.status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-2xl w-full">
        {/* 성공 아이콘 */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        {/* 성공 메시지 */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">결제 완료!</h1>
        <p className="text-gray-600 mb-6">{orderInfo.message}</p>

        {/* 주문 정보 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">주문 정보</h2>

          {orderDetail ? (
            <>
              <div className="mb-2">
                <span className="text-sm text-gray-600">주문번호:</span>
                <span className="ml-2 font-medium">{orderDetail.orderNo}</span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-600">총 주문금액:</span>
                <span className="ml-2 font-medium text-blue-600">{formatAmount(orderDetail.totalAmount)}</span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-600">카드 결제:</span>
                <span className="ml-2 font-medium">{formatAmount(orderDetail.cardAmount)}</span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-600">적립금 사용:</span>
                <span className="ml-2 font-medium">{orderDetail.pointsUsed.toLocaleString()}P</span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-600">주문일시:</span>
                <span className="ml-2 font-medium">{formatDate(orderDetail.createdAt)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">상태:</span>
                <span className="ml-2 font-medium text-green-600">{orderDetail.statusMessage}</span>
              </div>
            </>
          ) : (
            <>
              {orderInfo.orderNo && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600">주문번호:</span>
                  <span className="ml-2 font-medium">{orderInfo.orderNo}</span>
                </div>
              )}
              {orderInfo.amount && parseInt(orderInfo.amount) > 0 && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600">결제금액:</span>
                  <span className="ml-2 font-medium text-blue-600">{parseInt(orderInfo.amount).toLocaleString()}원</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">상태:</span>
                <span className="ml-2 font-medium text-green-600">결제완료</span>
              </div>
            </>
          )}
        </div>

        {/* 결제 내역 */}
        {orderDetail && orderDetail.payments && orderDetail.payments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-md font-semibold text-gray-800 mb-3">결제 내역</h3>
            {orderDetail.payments.map((payment, index) => (
              <div key={payment.paymentId} className={`p-3 rounded-lg ${index > 0 ? 'mt-3' : ''} ${
                payment.paymentType === 'POINT' || payment.paymentType === 'POINT_REFUND'
                  ? 'bg-blue-50 border border-blue-200'
                  : payment.paymentType === 'CARD_REFUND'
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {/* 결제 타입 아이콘 */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      payment.paymentType === 'POINT' || payment.paymentType === 'POINT_REFUND'
                        ? 'bg-blue-100'
                        : payment.paymentType === 'CARD_REFUND'
                        ? 'bg-orange-100'
                        : 'bg-gray-100'
                    }`}>
                      {payment.paymentType === 'POINT' || payment.paymentType === 'POINT_REFUND' ? (
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                      ) : payment.paymentType === 'CARD_REFUND' ? (
                        <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                        </svg>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {payment.paymentTypeDescription}
                      </span>
                      <span className="text-xs text-gray-500">
                        {payment.paymentType === 'POINT' ? '적립금 사용' :
                         payment.paymentType === 'CARD' ? '카드 결제' :
                         payment.paymentType === 'POINT_REFUND' ? '적립금 환불' :
                         payment.paymentType === 'CARD_REFUND' ? '카드 환불' : ''}
                      </span>
                    </div>

                    {getPaymentStatusBadge(payment)}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      payment.amount < 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {payment.amount < 0 ? '-' : ''}{formatAmount(Math.abs(payment.amount))}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  {payment.tid && (
                    <div>거래번호: {payment.tid}</div>
                  )}
                  {payment.cardName && (
                    <div>카드사: {payment.cardName}</div>
                  )}
                  {payment.paymentDate && (
                    <div>결제일시: {formatDate(payment.paymentDate)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-3">
          {/* 결제 취소 버튼 */}
          {(orderInfo.orderNo || (orderDetail && orderDetail.orderNo)) && (
            <button
              onClick={handleRefund}
              disabled={refunding}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              {refunding ? '취소 처리 중...' : '전체 결제 취소'}
            </button>
          )}

          <Link
            href="/order"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-center font-medium"
          >
            새로운 주문하기
          </Link>

          <Link
            href="/order-history"
            className="block w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-center font-medium"
          >
            주문 내역 보기
          </Link>

          <button
            onClick={() => window.print()}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
          >
            영수증 인쇄
          </button>
        </div>

        {/* 고객 안내 */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            주문 관련 문의사항이 있으시면 고객센터로 연락해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}