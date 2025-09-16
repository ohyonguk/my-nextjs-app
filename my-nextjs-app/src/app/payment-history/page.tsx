"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Payment {
  id: number;
  orderNo: string;
  tid: string;
  amount: number;
  status: string;
  resultCode: string;
  resultMsg: string;
  paymentDate: string;
  cardName: string;
  cardCode: string;
  applNum: string;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    // 임시로 userId = 1로 설정 (실제로는 로그인 세션에서 가져와야 함)
    const currentUserId = 1;
    setUserId(currentUserId);
    fetchPaymentHistory(currentUserId);
  }, []);

  const fetchPaymentHistory = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8081/api/payment/history/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('결제 내역을 불러오는데 실패했습니다');
      }

      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      } else {
        setError(data.message || '결제 내역을 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('Payment history fetch error:', error);
      setError('결제 내역을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (tid: string, orderNo: string) => {
    if (!confirm(`주문번호 ${orderNo}의 결제를 취소하시겠습니까?`)) {
      return;
    }

    const refundReason = prompt('취소 사유를 입력해주세요:', '고객 요청');
    if (!refundReason) {
      return;
    }

    try {
      setRefunding(tid);
      
      const response = await fetch('http://localhost:8081/api/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tid: tid,
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
        // 결제 내역 새로고침
        if (userId) {
          fetchPaymentHistory(userId);
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusBadge = (status: string, amount: number) => {
    if (amount < 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">취소됨</span>;
    }
    
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">완료</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">실패</span>;
      case 'REFUNDED':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">취소됨</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  const canRefund = (payment: Payment) => {
    return payment.status === 'COMPLETED' && payment.amount > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">결제 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">결제 내역</h1>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                뒤로가기
              </button>
            </div>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="px-6 py-4">
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">결제 내역이 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        주문번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        결제금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        결제수단
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        결제일시
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.orderNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={payment.amount < 0 ? 'text-red-600' : 'text-gray-900'}>
                            {formatAmount(Math.abs(payment.amount))}
                            {payment.amount < 0 && ' (취소)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status, payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.cardName || '카드'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {payment.tid}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {canRefund(payment) && (
                            <button
                              onClick={() => handleRefund(payment.tid, payment.orderNo)}
                              disabled={refunding === payment.tid}
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                refunding === payment.tid
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {refunding === payment.tid ? '취소 중...' : '결제 취소'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}