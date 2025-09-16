'use client';

import { useState, useEffect } from 'react';

interface User {
  userId: number;
  email: string;
  name: string;
  phoneNumber: string;
  points: number;
}

interface OrderFormProps {
  user: User;
  onLogout: () => void;
}


export default function OrderForm({ user, onLogout }: OrderFormProps) {
  const [orderAmount, setOrderAmount] = useState(100);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [cardAmount, setCardAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 결제 완료 메시지 리스너
    const handlePaymentMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data);
      
      if (event.data && event.data.type === 'PAYMENT_COMPLETE') {
        const { status, message, data } = event.data;
        
        setIsProcessing(false); // 결제 처리 상태 해제
        
        if (status === 'success') {
          // 결제 성공 - 성공 페이지로 이동
          const params = new URLSearchParams({
            status: 'success',
            message: message || '결제가 완료되었습니다.',
            orderNo: data?.orderNo || '',
            amount: data?.amount?.toString() || cardAmount.toString()
          });
          
          console.log('Redirecting to success page with params:', params.toString());
          window.location.href = `/order/success?${params.toString()}`;
        } else {
          // 결제 실패 또는 에러 - 실패 페이지로 이동
          const params = new URLSearchParams({
            status: 'failed',
            message: message || '결제가 실패했습니다.',
            error: data?.resultMsg || data?.resultCode || ''
          });
          
          console.log('Redirecting to failed page with params:', params.toString());
          window.location.href = `/order/failed?${params.toString()}`;
        }
      }
    };

    window.addEventListener('message', handlePaymentMessage);
    
    return () => {
      window.removeEventListener('message', handlePaymentMessage);
    };
  }, [cardAmount]);

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
        window.location.reload(); // 간단히 페이지 새로고침
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const handlePointsChange = (points: number) => {
    const maxPoints = Math.min(points, user.points, orderAmount);
    setPointsToUse(maxPoints);
    setCardAmount(orderAmount - maxPoints);
  };

  const handleOrderAmountChange = (amount: number) => {
    setOrderAmount(amount);
    const adjustedPoints = Math.min(pointsToUse, amount, user.points);
    setPointsToUse(adjustedPoints);
    setCardAmount(amount - adjustedPoints);
  };

  const handlePayment = async () => {
    // 최소 주문 금액 검증
    if (orderAmount < 100) {
      alert('최소 주문 금액은 100원입니다.');
      return;
    }

    if (cardAmount > 0 && cardAmount < 100) {
      alert('카드 결제 최소 금액은 100원입니다.');
      return;
    }

    setIsProcessing(true);

    try {
      // 주문 생성
      const orderResponse = await fetch('http://localhost:8081/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user.userId,
          totalAmount: orderAmount,
          pointsUsed: pointsToUse,
          cardAmount: cardAmount,
        }),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        throw new Error(errorText);
      }

      const orderData = await orderResponse.json();

      // 적립금만으로 결제가 완료된 경우 바로 성공 페이지로 이동
      if (orderData.paymentCompleted && orderData.paymentMethod === 'POINTS_ONLY') {
        setIsProcessing(false);

        console.log('Payment completed with points only, redirecting to success page');

        // 성공 페이지로 리다이렉트
        const params = new URLSearchParams({
          orderNo: orderData.orderNo,
          amount: orderData.totalAmount.toString(),
          message: '적립금 결제가 완료되었습니다.',
          status: 'COMPLETED'
        });

        window.location.href = `/order/success?${params.toString()}`;
        return;
      }

      if (cardAmount > 0) {
        // payment-popup 페이지로 이동하면서 결제 정보 전달
        const timestamp = Date.now().toString();
        const paymentParams = new URLSearchParams({
          oid: orderData.orderNo,
          price: cardAmount.toString(),
          goodname: '테스트 상품',
          buyername: user.name,
          buyeremail: user.email,
          buyertel: user.phoneNumber || '010-0000-0000',
          timestamp: timestamp
        });

        // 새 창에서 결제 팝업 열기
        const popupWindow = window.open(
          `/order/payment-popup?${paymentParams.toString()}`,
          'paymentPopup',
          'width=700,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popupWindow) {
          alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        }
      } else {
        // 적립금만 사용 (카드 결제 없음) - 백업 로직
        console.log('Fallback: Points only payment, redirecting to success page');

        // 성공 페이지로 리다이렉트
        const params = new URLSearchParams({
          orderNo: orderData.orderNo,
          amount: orderData.totalAmount?.toString() || orderAmount.toString(),
          message: '적립금 결제가 완료되었습니다.',
          status: 'COMPLETED'
        });

        window.location.href = `/order/success?${params.toString()}`;
        return;
      }
      setIsProcessing(false);
    } catch (error: any) {
      alert(error.message || '주문 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      {/* 사용자 정보 표시 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">주문하기</h2>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            로그아웃
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">이름:</span> {user.name}</div>
          <div><span className="font-medium">이메일:</span> {user.email}</div>
          <div><span className="font-medium">전화번호:</span> {user.phoneNumber || '미등록'}</div>
          <div><span className="font-medium text-blue-600">보유 적립금:</span> {user.points.toLocaleString()}원</div>
        </div>
      </div>

      {/* 주문 정보 */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주문 금액
          </label>
          <input
            type="number"
            value={orderAmount}
            onChange={(e) => handleOrderAmountChange(Number(e.target.value))}
            min="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">최소 주문 금액: 100원</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사용할 적립금 (최대: {Math.min(user.points, orderAmount).toLocaleString()}원)
          </label>
          <input
            type="number"
            value={pointsToUse}
            onChange={(e) => handlePointsChange(Number(e.target.value))}
            min="0"
            max={Math.min(user.points, orderAmount)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handlePointsChange(0)}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              사용 안함
            </button>
            <button
              onClick={() => handlePointsChange(Math.min(user.points, orderAmount))}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              전액 사용
            </button>
          </div>
        </div>

        {/* 결제 금액 요약 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-3">결제 금액</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>총 주문금액:</span>
              <span>{orderAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>적립금 사용:</span>
              <span>-{pointsToUse.toLocaleString()}원</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>카드 결제금액:</span>
              <span className="text-blue-600">{cardAmount.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing || orderAmount < 100}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium"
        >
          {isProcessing ? '결제 진행 중...' : `${cardAmount.toLocaleString()}원 결제하기`}
        </button>
      </div>
    </div>
  );
}