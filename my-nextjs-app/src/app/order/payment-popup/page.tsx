'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SHA256 from 'crypto-js/sha256'
import encHex from 'crypto-js/enc-hex'

const PaymentPopupPage = () => {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  // URL 파라미터에서 주문 정보 가져오기
  const orderData = {
    oid: searchParams.get('oid') || '',
    price: searchParams.get('price') || '',
    goodname: searchParams.get('goodname') || '',
    buyername: searchParams.get('buyername') || '',
    buyeremail: searchParams.get('buyeremail') || '',
    buyertel: searchParams.get('buyertel') || '',
    timestamp: searchParams.get('timestamp') || ''
  }

  useEffect(() => {
    // 이니시스 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js';
    script.async = true;
    document.head.appendChild(script);

    const initPayment = async () => {
      // INIStdPay 로드 확인
      if (!(window as any).INIStdPay) {
        console.log('INIStdPay not loaded yet, retrying...')
        setTimeout(initPayment, 100)
        return
      }

      setIsLoading(false)

      const mid = "INIpayTest"
      const signKey = "SU5JTElURV9UUklQTEVERVNfS0VZU1RS"

      // 해시 생성
      const signature = SHA256(
        'oid=' + orderData.oid + '&price=' + orderData.price + '&timestamp=' + orderData.timestamp
      ).toString(encHex)
      
      const verification = SHA256(
        'oid=' + orderData.oid + '&price=' + orderData.price + '&signKey=' + signKey + '&timestamp=' + orderData.timestamp
      ).toString(encHex)
      
      const mKey = SHA256(signKey).toString(encHex)

      // form 생성
      const form = document.createElement('form')
      form.id = 'paymentForm'
      form.method = 'POST'
      form.action = 'https://stgstdpay.inicis.com/stdpay/INIpayStdPayRequest.do'
      form.acceptCharset = 'UTF-8'
      form.style.display = 'none'

      const params = {
        version: "1.0",
        mid,
        oid: orderData.oid,
        price: orderData.price,
        timestamp: orderData.timestamp,
        use_chkfake: "Y",
        signature,
        verification,
        mKey,
        currency: "WON",
        goodname: orderData.goodname,
        buyername: orderData.buyername,
        buyertel: orderData.buyertel,
        buyeremail: orderData.buyeremail,
        returnUrl: `http://localhost:3000/order/payment-result`,
        closeUrl: `http://localhost:3000/order`,
        acceptmethod: "below1000",
        gopaymethod: "Card"
      }

      // 파라미터를 form에 추가
      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      document.body.appendChild(form)

      // 결제 요청 데이터를 백엔드에 로깅
      try {
        await fetch('http://localhost:8081/api/payment/log-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderNo: orderData.oid,
            requestType: 'PAYMENT_REQUEST_POPUP',
            requestUrl: 'https://stgstdpay.inicis.com/stdpay/INIpayStdPayRequest.do',
            requestData: params
          }),
        }).catch(error => {
          console.error('결제 요청 로깅 실패:', error)
        })
      } catch (error) {
        console.error('결제 요청 로깅 에러:', error)
      }

      // 결제 호출
      try {
        console.log('=== 이니시스 결제 호출 시작 ===')
        console.log('Form ID:', form.id)
        console.log('Form action:', form.action)
        console.log('Payment params:', params)
        console.log('INIStdPay 객체 존재:', !!(window as any).INIStdPay)

        // 이니시스 결제 호출
        const result = (window as any).INIStdPay.pay('paymentForm')
        console.log('INIStdPay.pay 호출 결과:', result)
        
      } catch (error) {
        console.error('Payment failed:', error)
        alert('결제 호출에 실패했습니다.')
      }
    }

    script.onload = () => {
      if (orderData.oid && orderData.price) {
        initPayment()
      }
    };

    // 이미 로드된 경우
    if ((window as any).INIStdPay && orderData.oid && orderData.price) {
      initPayment()
    }
  }, [orderData])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">결제 준비 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2">결제 처리 중</h2>
            <p className="text-gray-600">결제창이 열리지 않으면 브라우저 팝업 차단을 해제해주세요.</p>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentPopupPage