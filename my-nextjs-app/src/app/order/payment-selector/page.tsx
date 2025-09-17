'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SHA256 from 'crypto-js/sha256'
import encHex from 'crypto-js/enc-hex'

const PaymentSelectorPage = () => {
  const searchParams = useSearchParams()
  const [selectedMethod, setSelectedMethod] = useState<'inicis' | 'nicepay' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedLibraries, setLoadedLibraries] = useState<Set<string>>(new Set())

  // sessionStorage에서 주문 정보 가져오기
  const [orderData, setOrderData] = useState({
    oid: '',
    price: '',
    goodname: '',
    buyername: '',
    buyeremail: '',
    buyertel: '',
    timestamp: '',
    orderId: ''
  })

  // 페이지 로드 시 sessionStorage에서 데이터 읽기
  useEffect(() => {
    const paymentKey = searchParams.get('key')
    if (paymentKey) {
      const storedData = sessionStorage.getItem(paymentKey)
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          setOrderData(parsedData)
          console.log('sessionStorage에서 결제 데이터 로드:', parsedData)
        } catch (error) {
          console.error('결제 데이터 파싱 오류:', error)
          alert('결제 데이터를 불러올 수 없습니다.')
          window.close()
        }
      } else {
        console.error('sessionStorage에서 결제 데이터를 찾을 수 없습니다.')
        alert('결제 데이터가 만료되었습니다.')
        window.close()
      }
    }
  }, [searchParams])

  // 동적 라이브러리 로딩 함수
  const loadPaymentLibrary = (method: 'inicis' | 'nicepay'): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (loadedLibraries.has(method)) {
        resolve()
        return
      }

      const script = document.createElement('script')

      if (method === 'inicis') {
        script.src = 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js'
        script.onload = () => {
          setLoadedLibraries(prev => new Set(prev).add('inicis'))
          console.log('Inicis library loaded')
          resolve()
        }
      } else if (method === 'nicepay') {
        script.src = 'https://pg-web.nicepay.co.kr/v3/common/js/nicepay-pgweb.js'
        script.charset = 'euc-kr'
        script.onload = () => {
          console.log('NICE Pay 스크립트 로드 완료')
          console.log('스크립트 로드 후 window.goPay:', typeof (window as any).goPay)
          console.log('스크립트 로드 후 사용 가능한 함수들:', Object.keys(window).filter(key =>
            key.toLowerCase().includes('nice') ||
            key.toLowerCase().includes('pay') ||
            key.toLowerCase().includes('go')
          ))
          setLoadedLibraries(prev => new Set(prev).add('nicepay'))
          resolve()
        }
      }

      script.onerror = () => {
        console.error(`Failed to load ${method} library`)
        setIsLoading(false)
        reject(new Error(`${method} 라이브러리 로딩 실패`))
      }

      document.head.appendChild(script)
    })
  }

  // Inicis 결제 처리
  const processInicisPayment = async () => {
    try {
      await loadPaymentLibrary('inicis')

      // INIStdPay 로드 확인
      if (!(window as any).INIStdPay) {
        throw new Error('Inicis 라이브러리가 로드되지 않았습니다.')
      }

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
      form.id = 'inicisPaymentForm'
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

      // 백엔드 로깅
      await fetch('http://localhost:8081/api/payment/log-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: orderData.oid,
          requestType: 'PAYMENT_REQUEST_POPUP',
          requestUrl: 'https://stgstdpay.inicis.com/stdpay/INIpayStdPayRequest.do',
          requestData: params
        }),
      }).catch(console.error)

      // 이니시스 결제 호출
      console.log('=== Inicis 결제 호출 ===')
      const result = (window as any).INIStdPay.pay('inicisPaymentForm')
      console.log('Inicis 결제 결과:', result)

      // 결제창이 열리면 로딩 해제
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)

    } catch (error) {
      console.error('Inicis 결제 오류:', error)
      alert('Inicis 결제 호출에 실패했습니다.')
      setIsLoading(false)
    }
  }

  // NICE Pay 결제 처리
  const processNicePayPayment = async () => {
    try {
      await loadPaymentLibrary('nicepay')

      // goPay 함수 확인
      console.log('NICE Pay 라이브러리 상태 확인:')
      console.log('- window.goPay:', typeof (window as any).goPay)
      console.log('- NICE Pay 관련 함수들:', Object.keys(window).filter(key => key.toLowerCase().includes('nice') || key.toLowerCase().includes('pay')))

      if (!(window as any).goPay) {
        console.error('goPay 함수를 찾을 수 없습니다.')
        throw new Error('NICE Pay 라이브러리가 로드되지 않았습니다.')
      }

      // NICE Pay 콜백 함수 등록 (PC 방식)
      try {
        // window 객체가 존재하는지 확인
        if (typeof window === 'undefined') {
          throw new Error('window 객체가 없습니다.')
        }

        const windowObj = window as any

        windowObj.nicepaySubmit = function(resultData?: any) {
        console.log('=== NICE Pay 결제 완료 콜백 (PC) ===')
        console.log('콜백 함수 인자:', arguments)
        console.log('전달받은 resultData:', resultData)

        try {
          let finalResultData: any = {}

          // 방법 1: 콜백 함수 인자로 전달받은 데이터 사용
          if (resultData && typeof resultData === 'object') {
            finalResultData = { ...resultData }
            console.log('방법 1 - 콜백 인자에서 결제 결과 획득:', finalResultData)
          }

          // 방법 2: arguments 객체에서 데이터 찾기
          if (Object.keys(finalResultData).length === 0 && arguments.length > 0) {
            for (let i = 0; i < arguments.length; i++) {
              console.log(`arguments[${i}]:`, arguments[i])
              if (arguments[i] && typeof arguments[i] === 'object') {
                finalResultData = { ...arguments[i] }
                console.log('방법 2 - arguments에서 결제 결과 획득:', finalResultData)
                break
              }
            }
          }

          // 방법 3: 전역 변수에서 결제 결과 확인
          if (Object.keys(finalResultData).length === 0) {
            const possibleGlobalVars = [
              'nicepayResult',
              'payResult',
              'authResult',
              'NICEPAY_RESULT',
              'paymentResult'
            ]

            for (const varName of possibleGlobalVars) {
              if ((window as any)[varName]) {
                finalResultData = (window as any)[varName]
                console.log(`방법 3 - 전역 변수 ${varName}에서 결제 결과 획득:`, finalResultData)
                break
              }
            }
          }

          // 방법 4: 결제 요청 시 생성한 nicePayForm에서 찾기
          if (Object.keys(finalResultData).length === 0) {
            console.log('방법 4 - nicePayForm에서 결제 결과 찾기 시도')
            const nicePayForm = document.querySelector('form[name="nicePayForm"]') as HTMLFormElement
            console.log('nicePayForm 찾기:', nicePayForm)

            if (nicePayForm) {
              const inputs = nicePayForm.querySelectorAll('input')
              const formData: any = {}
              console.log('nicePayForm 내 input 개수:', inputs.length)

              inputs.forEach(input => {
                if (input.name) {
                  // 모든 필드를 포함 (빈 값도 포함)
                  formData[input.name] = input.value || ''
                  console.log('nicePayForm 필드:', input.name, '=', input.value)
                }
              })

              if (Object.keys(formData).length > 0) {
                finalResultData = formData
                console.log('방법 4 - nicePayForm에서 결제 결과 획득:', finalResultData)
              }
            }
          }

          // 방법 5: DOM에서 모든 폼 찾기 (폴백)
          if (Object.keys(finalResultData).length === 0) {
            console.log('방법 5 - DOM에서 모든 폼 찾기 시도')
            const forms = document.querySelectorAll('form')
            console.log('전체 폼 개수:', forms.length)

            for (let i = 0; i < forms.length; i++) {
              const form = forms[i]
              console.log(`폼 ${i + 1}:`, {
                name: form.name,
                id: form.id,
                className: form.className,
                inputCount: form.querySelectorAll('input').length
              })

              const inputs = form.querySelectorAll('input')
              const formData: any = {}
              let hasNicePayFields = false

              inputs.forEach(input => {
                if (input.name && input.value) {
                  formData[input.name] = input.value
                  console.log(`폼 ${i + 1} 필드:`, input.name, '=', input.value)

                  if (input.name.includes('AuthResultCode') ||
                      input.name.includes('AuthToken') ||
                      input.name.includes('TxTid') ||
                      input.name.includes('Moid') ||
                      input.name.includes('Amt') ||
                      input.name.includes('ResultCode') ||
                      input.name.includes('ResultMsg')) {
                    hasNicePayFields = true
                  }
                }
              })

              if (hasNicePayFields || Object.keys(formData).length > 3) {
                finalResultData = formData
                console.log(`방법 5 - 폼 ${i + 1}에서 결제 결과 획득:`, finalResultData)
                break
              }
            }
          }

          // 결제 결과 데이터가 있는지 확인
          if (Object.keys(finalResultData).length === 0) {
            console.error('모든 방법으로도 결제 결과 데이터를 찾을 수 없습니다.')
            console.log('디버깅 정보:')
            console.log('- arguments.length:', arguments.length)
            console.log('- document.forms.length:', document.forms.length)
            console.log('- window 객체의 모든 속성들:')
            Object.keys(window).forEach(key => {
              if (key.toLowerCase().includes('nice') ||
                  key.toLowerCase().includes('pay') ||
                  key.toLowerCase().includes('result') ||
                  key.toLowerCase().includes('auth')) {
                console.log(`  - window.${key}:`, (window as any)[key])
              }
            })

            setIsLoading(false)
            return
          }

          console.log('최종 결제 결과 데이터:', finalResultData)

          // 백엔드로 승인 요청
          fetch('http://localhost:8081/api/payment/nicepay/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalResultData)
          })
          .then(response => response.json())
          .then(result => {
            console.log('승인 결과:', result)
            setIsLoading(false)

            if (result.success) {
              // 부모 창이 있으면 부모 창으로 결제 완료 메시지 전송 후 팝업 닫기
              if (window.opener) {
                const paymentResult = {
                  type: 'PAYMENT_COMPLETE',
                  status: 'success',
                  message: '결제가 완료되었습니다.',
                  data: {
                    orderNo: result.orderNo,
                    amount: result.amount
                  }
                };

                console.log('Sending payment success message to parent:', paymentResult);
                window.opener.postMessage(paymentResult, '*');

                // 부모 창을 주문완료 페이지로 리다이렉트
                const redirectUrl = `/order/success?status=success&message=${encodeURIComponent('결제가 완료되었습니다.')}&orderNo=${result.orderNo}&amount=${result.amount}`;
                console.log('Redirecting parent to:', redirectUrl);
                window.opener.location.href = redirectUrl;

                // 팝업 닫기
                setTimeout(() => {
                  window.close();
                }, 500);
              } else {
                // 부모 창이 없으면 현재 창에서 이동
                window.location.href = `/order/success?status=success&message=${encodeURIComponent('결제가 완료되었습니다.')}&orderNo=${result.orderNo}&amount=${result.amount}`;
              }
            } else {
              // 결제 실패 시에도 동일한 로직 적용
              if (window.opener) {
                const paymentResult = {
                  type: 'PAYMENT_COMPLETE',
                  status: 'failed',
                  message: result.resultMessage || '결제가 실패했습니다.',
                  data: {
                    orderNo: result.orderNo || '',
                    error: result.resultCode
                  }
                };

                console.log('Sending payment failure message to parent:', paymentResult);
                window.opener.postMessage(paymentResult, '*');

                // 부모 창을 실패 페이지로 리다이렉트
                const redirectUrl = `/order/failed?status=failed&message=${encodeURIComponent(result.resultMessage || '결제가 실패했습니다.')}&error=${result.resultCode}`;
                console.log('Redirecting parent to failed page:', redirectUrl);
                window.opener.location.href = redirectUrl;

                // 팝업 닫기
                setTimeout(() => {
                  window.close();
                }, 500);
              } else {
                // 부모 창이 없으면 현재 창에서 이동
                window.location.href = `/order/failed?status=failed&message=${encodeURIComponent(result.resultMessage || '결제가 실패했습니다.')}&error=${result.resultCode}`;
              }
            }
          })
          .catch(error => {
            console.error('승인 요청 오류:', error)
            setIsLoading(false)

            // 오류 시에도 팝업 닫기 로직 적용
            if (window.opener) {
              const paymentResult = {
                type: 'PAYMENT_COMPLETE',
                status: 'error',
                message: '결제 처리 중 오류가 발생했습니다.',
                data: {
                  error: 'PROCESSING_ERROR'
                }
              };

              console.log('Sending payment error message to parent:', paymentResult);
              window.opener.postMessage(paymentResult, '*');

              // 부모 창을 오류 페이지로 리다이렉트
              const redirectUrl = `/order/failed?status=failed&message=${encodeURIComponent('결제 처리 중 오류가 발생했습니다.')}&error=PROCESSING_ERROR`;
              console.log('Redirecting parent to error page:', redirectUrl);
              window.opener.location.href = redirectUrl;

              // 팝업 닫기
              setTimeout(() => {
                window.close();
              }, 500);
            } else {
              // 부모 창이 없으면 현재 창에서 이동
              window.location.href = `/order/failed?status=failed&message=${encodeURIComponent('결제 처리 중 오류가 발생했습니다.')}&error=PROCESSING_ERROR`;
            }
          })

        } catch (error) {
          console.error('nicepaySubmit 콜백 오류:', error)
          setIsLoading(false)

          // 콜백 오류 시에도 팝업 닫기 로직 적용
          if (window.opener) {
            const paymentResult = {
              type: 'PAYMENT_COMPLETE',
              status: 'error',
              message: '결제 콜백 처리 중 오류가 발생했습니다.',
              data: {
                error: 'CALLBACK_ERROR'
              }
            };

            console.log('Sending callback error message to parent:', paymentResult);
            window.opener.postMessage(paymentResult, '*');

            // 부모 창을 오류 페이지로 리다이렉트
            const redirectUrl = `/order/failed?status=failed&message=${encodeURIComponent('결제 콜백 처리 중 오류가 발생했습니다.')}&error=CALLBACK_ERROR`;
            console.log('Redirecting parent to callback error page:', redirectUrl);
            window.opener.location.href = redirectUrl;

            // 팝업 닫기
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            // 부모 창이 없으면 현재 창에서 이동
            window.location.href = `/order/failed?status=failed&message=${encodeURIComponent('결제 콜백 처리 중 오류가 발생했습니다.')}&error=CALLBACK_ERROR`;
          }
        } finally {
          // 결제 처리 완료 후 nicePayForm 정리
          setTimeout(() => {
            const nicePayForm = document.querySelector('form[name="nicePayForm"]')
            if (nicePayForm && document.body.contains(nicePayForm)) {
              document.body.removeChild(nicePayForm)
              console.log('결제 완료 후 nicePayForm 제거됨')
            }
          }, 1000)
        }
        }

        // 결제 시작 콜백
        windowObj.nicepayStart = function() {
          console.log('=== NICE Pay 결제 시작 ===')
          setIsLoading(true)
        }

        // 결제창 닫기 콜백
        windowObj.nicepayClose = function() {
          console.log('=== NICE Pay 결제창 닫기 ===')
          setIsLoading(false)
        }

        console.log('NICE Pay 콜백 함수 등록 완료')
      } catch (callbackError) {
        console.error('콜백 함수 등록 실패:', callbackError)
        throw new Error(`콜백 함수 등록 실패: ${callbackError.message}`)
      }

      // EdiDate 생성
      const now = new Date()
      const ediDate = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0')

      const MID = 'nicepay00m'
      const MerchantKey = 'EYzu8jGGMfqaDEp76gSckuvnaHHu+bC4opsSN6lHv3b2lurNYkVXrZ7Z1AoqQnXI3eLuaUFyoRNC6FkrzVjceg=='

      // SignData 생성
      const signDataString = ediDate + MID + orderData.price + MerchantKey
      const crypto = await import('crypto-js')
      const signData = crypto.SHA256(signDataString).toString(crypto.enc.Hex)

      // 결제 폼 생성
      const form = document.createElement('form')
      form.name = 'nicePayForm'
      form.style.display = 'none'

      const formData = {
        GoodsName: orderData.goodname,
        Amt: orderData.price,
        MID: MID,
        EdiDate: ediDate,
        Moid: orderData.oid,
        SignData: signData,
        PayMethod: 'CARD',
        // PC 결제는 ReturnURL 사용하지 않음 (콜백 사용)
        BuyerName: orderData.buyername,
        BuyerTel: orderData.buyertel.replace(/[^0-9]/g, ''),
        BuyerEmail: orderData.buyeremail,
        CharSet: 'utf-8',
        ReqReserved: JSON.stringify({ orderId: orderData.orderId })
      }

      // 폼 필드 추가
      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      document.body.appendChild(form)

      // 백엔드 로깅
      await fetch('http://localhost:8081/api/payment/log-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: orderData.oid,
          requestType: 'NICEPAY_REQUEST',
          requestUrl: 'NICEPAY_GOPAY',
          requestData: formData
        }),
      }).catch(console.error)

      // goPay 함수 호출
      console.log('=== NICE Pay 결제창 호출 ===')
      console.log('결제 폼 데이터:', formData)
      console.log('결제 폼 요소:', form)
      console.log('폼의 input 개수:', form.querySelectorAll('input').length)

      // 폼 필드 검증
      const requiredFields = ['MID', 'Moid', 'Amt', 'EdiDate', 'SignData']
      const missingFields = requiredFields.filter(field => !formData[field])

      if (missingFields.length > 0) {
        throw new Error(`필수 필드 누락: ${missingFields.join(', ')}`)
      }

      console.log('필수 필드 검증 완료')

      // goPay 호출
      try {
        ;(window as any).goPay(form)
        console.log('goPay 호출 성공')
      } catch (goPayError) {
        console.error('goPay 호출 중 오류:', goPayError)
        throw new Error(`goPay 호출 실패: ${goPayError.message}`)
      }

      // 결제창이 열리면 로딩 해제
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)

      // nicePayForm은 결제 결과 전달을 위해 제거하지 않음
      // NicePay가 이 폼을 통해 결제 결과를 전달할 수 있음
      console.log('nicePayForm 생성 완료 - 결제 결과를 위해 유지됨')

    } catch (error) {
      console.error('NICE Pay 결제 오류 상세:', error)
      console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('오류 메시지:', error instanceof Error ? error.message : error)

      // 더 상세한 오류 메시지 제공
      let errorMessage = 'NICE Pay 결제 호출에 실패했습니다.'
      if (error instanceof Error) {
        errorMessage += `\n상세: ${error.message}`
      }

      alert(errorMessage)
      setIsLoading(false)
    }
  }

  // 결제 수단 선택 및 실행
  const handlePaymentMethod = async (method: 'inicis' | 'nicepay') => {
    setSelectedMethod(method)
    setIsLoading(true)

    try {
      if (method === 'inicis') {
        await processInicisPayment()
      } else if (method === 'nicepay') {
        await processNicePayPayment()
      }
    } catch (error) {
      console.error('결제 처리 오류:', error)
      setIsLoading(false)
    }
  }

  // 자동 결제 수단 선택 (페이지 로드 시 실행)
  const autoSelectPaymentMethod = () => {
    const methods: ('inicis' | 'nicepay')[] = ['inicis', 'nicepay']
    const randomMethod = methods[Math.floor(Math.random() * methods.length)]
    console.log('자동 선택된 결제 수단:', randomMethod)
    handlePaymentMethod(randomMethod)
  }

  // 페이지 로드 시 자동으로 결제 수단 선택
  useEffect(() => {
    if (orderData.oid && orderData.price) {
      // 약간의 지연을 두어 로딩 애니메이션 표시
      setTimeout(() => {
        autoSelectPaymentMethod()
      }, 1000)
    }
  }, [orderData.oid, orderData.price])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">
                {selectedMethod
                  ? `${selectedMethod === 'inicis' ? 'Inicis' : 'NICE Pay'} 결제창 준비 중...`
                  : '결제 수단 선택 중...'
                }
              </h2>
              <p className="text-gray-600">
                {selectedMethod
                  ? '결제창이 곧 열립니다.'
                  : '최적의 결제 수단을 자동으로 선택하고 있습니다.'
                }
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">결제 준비 완료</h2>
              <p className="text-gray-600">결제창이 열리지 않으면 브라우저 팝업 차단을 해제해주세요.</p>
            </>
          )}

          {/* 주문 정보 표시 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">주문 정보</h3>
            <div className="text-sm space-y-1">
              <div>상품명: {orderData.goodname}</div>
              <div>결제금액: {Number(orderData.price).toLocaleString()}원</div>
              <div>주문번호: {orderData.oid}</div>
            </div>
          </div>

          {/* 선택된 결제사 표시 */}
          {selectedMethod && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-700">
                선택된 결제사: {selectedMethod === 'inicis' ? 'Inicis (이니시스)' : 'NICE Pay (나이스페이)'}
              </div>
            </div>
          )}

          {/* 라이브러리 로딩 상태 */}
          {loadedLibraries.size > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <div>로딩된 라이브러리: {Array.from(loadedLibraries).join(', ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentSelectorPage