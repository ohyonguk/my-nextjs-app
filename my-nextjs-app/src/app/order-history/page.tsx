"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  payment: Payment | null;
  payments: Payment[];
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    // localStorage에서 로그인한 사용자 정보 가져오기
    const getUserFromStorage = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          return userData.id || userData.userId;
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
      return null;
    };

    const currentUserId = getUserFromStorage();

    if (currentUserId) {
      setUserId(currentUserId);
      fetchOrderHistory(currentUserId);
    } else {
      // 로그인 정보가 없으면 에러 표시
      setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      setLoading(false);
    }
  }, []);

  const fetchOrderHistory = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8081/api/payment/orders/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('주문 내역을 불러오는데 실패했습니다');
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || '주문 내역을 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('Order history fetch error:', error);
      setError('주문 내역을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (orderNo: string) => {
    if (!confirm(`주문번호 ${orderNo}의 결제를 취소하시겠습니까?`)) {
      return;
    }

    const refundReason = prompt('취소 사유를 입력해주세요:', '고객 요청');
    if (!refundReason) {
      return;
    }

    try {
      setRefunding(orderNo);
      
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
        // 주문 내역 새로고침
        if (userId) {
          fetchOrderHistory(userId);
        }
      } else {
        alert(`결제 취소 실패: ${data.message}`);
      }
    } catch (error) {
      console.error('Refund error:', error);
      alert('결제 취소 중 오류가 발생했습니다');
    } finally {
      setRefunding(null);
    }
  };

  const handlePointRefund = async (orderNo: string) => {
    if (!confirm(`주문번호 ${orderNo}의 적립금을 취소하시겠습니까?`)) {
      return;
    }

    const refundReason = prompt('취소 사유를 입력해주세요:', '고객 요청');
    if (!refundReason) {
      return;
    }

    try {
      setRefunding(orderNo);

      const response = await fetch(`http://localhost:8081/api/payment/refund/points/${orderNo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: refundReason
        }),
      });

      if (!response.ok) {
        throw new Error('적립금 취소 요청이 실패했습니다');
      }

      const data = await response.json();
      if (data.success) {
        alert(`적립금이 성공적으로 취소되었습니다. (${data.refundedPoints}P 복구)`);
        // 주문 내역 새로고침
        if (userId) {
          fetchOrderHistory(userId);
        }
      } else {
        alert(`적립금 취소 실패: ${data.message}`);
      }
    } catch (error) {
      console.error('Point refund error:', error);
      alert('적립금 취소 중 오류가 발생했습니다');
    } finally {
      setRefunding(null);
    }
  };

  const handleIndividualRefund = async (payment: Payment, orderNo: string) => {
    const paymentTypeDesc = payment.paymentTypeDescription || payment.paymentType;
    const paymentMethodText = payment.paymentType === 'POINT' ? '적립금' : '카드 결제';

    if (!confirm(`${paymentMethodText} 취소\n\n결제 방식: ${paymentTypeDesc}\n취소 금액: ${formatAmount(Math.abs(payment.amount))}\n주문번호: ${orderNo}\n\n정말 취소하시겠습니까?`)) {
      return;
    }

    const refundReason = prompt('취소 사유를 입력해주세요:', '고객 요청');
    if (!refundReason) {
      return;
    }

    try {
      setRefunding(`${orderNo}-${payment.paymentId}`);

      let url = '';
      let body = {};

      if (payment.paymentType === 'POINT') {
        url = `http://localhost:8081/api/payment/refund/points/${orderNo}`;
        body = { reason: refundReason };
      } else if (payment.paymentType === 'CARD') {
        url = `http://localhost:8081/api/payment/refund/order/${orderNo}`;
        body = { reason: refundReason, clientIp: '127.0.0.1' };
      } else {
        alert('지원하지 않는 결제 방식입니다.');
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('취소 요청이 실패했습니다');
      }

      const data = await response.json();
      if (data.success) {
        const successMessage = payment.paymentType === 'POINT'
          ? `적립금 취소가 완료되었습니다.\n\n환불된 적립금: ${formatAmount(Math.abs(payment.amount))}\n(적립금이 계정으로 복구되었습니다)`
          : `카드 결제 취소가 완료되었습니다.\n\n취소 금액: ${formatAmount(Math.abs(payment.amount))}\n(영업일 기준 3-5일 내 카드사를 통해 환불됩니다)`;

        alert(successMessage);
        // 주문 내역 새로고침
        if (userId) {
          fetchOrderHistory(userId);
        }
      } else {
        alert(`${paymentMethodText} 취소 실패\n\n오류 내용: ${data.message}`);
      }
    } catch (error) {
      console.error('Individual refund error:', error);
      alert('취소 중 오류가 발생했습니다');
    } finally {
      setRefunding(null);
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

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">주문 완료</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">결제 대기</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">승인 완료</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">주문 실패</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">주문 취소</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (payment: Payment | null) => {
    if (!payment) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">결제 정보 없음</span>;
    }
    
    switch (payment.status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">결제 완료</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">결제 실패</span>;
      case 'REFUNDED':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">결제 취소</span>;
      case 'POINT_USED':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">적립금 사용</span>;
      case 'POINT_REFUNDED':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">적립금 취소</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{payment.status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">주문 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">주문 내역</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/payment-history')}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100"
                >
                  결제 내역 보기
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  뒤로가기
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="px-6 py-4">
            {error.includes('로그인이 필요합니다') ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">로그인이 필요합니다</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  홈으로 가서 로그인하기
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">주문 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.orderId} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    {/* 주문 정보 헤더 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">주문번호: {order.orderNo}</h3>
                        {getOrderStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        주문일시: {formatDate(order.createdAt)}
                      </div>
                    </div>

                    {/* 주문 금액 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">총 주문금액</div>
                        <div className="text-lg font-semibold">{formatAmount(order.totalAmount)}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">카드 결제금액</div>
                        <div className="text-lg font-semibold">{formatAmount(order.cardAmount)}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">적립금 사용</div>
                        <div className="text-lg font-semibold">{order.pointsUsed.toLocaleString()}P</div>
                      </div>
                    </div>

                    {/* 결제 정보 - 각 결제 방식별로 별도 표시 */}
                    {order.payments && order.payments.length > 0 ? (
                      <div className="border-t pt-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">결제 내역</h4>
                        {order.payments.map((payment, index) => (
                          <div key={payment.paymentId} className={`p-4 rounded-lg ${index > 0 ? 'mt-3' : ''} ${
                            payment.paymentType === 'POINT' || payment.paymentType === 'POINT_REFUND'
                              ? 'bg-blue-50 border border-blue-200'
                              : payment.paymentType === 'CARD_REFUND'
                              ? 'bg-orange-50 border border-orange-200'
                              : 'bg-gray-50 border border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {/* 결제 타입 아이콘 */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  payment.paymentType === 'POINT' || payment.paymentType === 'POINT_REFUND'
                                    ? 'bg-blue-100'
                                    : payment.paymentType === 'CARD_REFUND'
                                    ? 'bg-orange-100'
                                    : 'bg-gray-100'
                                }`}>
                                  {payment.paymentType === 'POINT' || payment.paymentType === 'POINT_REFUND' ? (
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                    </svg>
                                  ) : payment.paymentType === 'CARD_REFUND' ? (
                                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                    </svg>
                                  )}
                                </div>

                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">
                                    {payment.paymentTypeDescription || payment.paymentType}
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
                                <div className={`text-lg font-semibold ${
                                  payment.amount < 0 ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {payment.amount < 0 ? '-' : ''}{formatAmount(Math.abs(payment.amount))}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {payment.amount < 0 ? '환불금액' : '결제금액'}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600">거래번호 (TID)</div>
                                <div className="font-mono bg-white p-1 rounded text-xs">{payment.tid || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">결제수단</div>
                                <div>{payment.cardName || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">결제일시</div>
                                <div>{payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}</div>
                              </div>
                            </div>

                            {payment.resultMsg && (
                              <div className="mt-2 text-sm">
                                <div className="text-gray-600">결과 메시지</div>
                                <div>{payment.resultMsg}</div>
                              </div>
                            )}

                            {/* 개별 취소 버튼 */}
                            <div className="mt-3 flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                {payment.paymentType === 'POINT' ? '적립금 결제' :
                                 payment.paymentType === 'CARD' ? '카드 결제' :
                                 payment.paymentType === 'POINT_REFUND' ? '적립금 취소' :
                                 payment.paymentType === 'CARD_REFUND' ? '카드 취소' : payment.paymentType}
                              </div>

                              {payment.status === 'REFUNDED' || payment.amount < 0 ||
                               payment.paymentType === 'CARD_REFUND' || payment.paymentType === 'POINT_REFUND' ? (
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                  </svg>
                                  <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-700 rounded-full">
                                    취소 완료
                                  </span>
                                </div>
                              ) : payment.canRefund && payment.status === 'COMPLETED' && payment.amount > 0 ? (
                                <button
                                  onClick={() => handleIndividualRefund(payment, order.orderNo)}
                                  disabled={refunding === `${order.orderNo}-${payment.paymentId}`}
                                  className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                                    refunding === `${order.orderNo}-${payment.paymentId}`
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                      : payment.paymentType === 'POINT'
                                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300 hover:shadow-sm'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200 hover:border-red-300 hover:shadow-sm'
                                  }`}
                                >
                                  {refunding === `${order.orderNo}-${payment.paymentId}` ? (
                                    <>
                                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      <span>취소 중...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                      </svg>
                                      <span>
                                        {payment.paymentType === 'POINT' ? '적립금 취소' : '카드 취소'}
                                      </span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                                  </svg>
                                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-500 rounded-full">
                                    취소 불가
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-t pt-4">
                        <div className="text-center py-4 text-gray-500">
                          결제 정보가 없습니다
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}