import CryptoJS from 'crypto-js'

export interface PaymentParams {
  version: string
  mid: string
  oid: string
  price: string
  timestamp: string
  use_chkfake: string
  goodname: string
  buyername: string
  buyeremail: string
  buyertel: string
  returnUrl: string
  closeUrl: string
  acceptmethod: string
  signature: string
  verification: string
  mKey: string
  currency: string
  gopaymethod?: string
  acceptmethod_mobile?: string
  quotainterest?: string
}

const SIGNKEY = 'SU5JTElURV9UUklQTEVERVNfS0VZU1RS' // 테스트용 키

export const generateSignature = (
  oid: string,
  price: string,
  timestamp: string
): string => {
  const data = `${oid}${price}${timestamp}`
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
}

export const generateVerification = (
  oid: string,
  price: string,
  timestamp: string
): string => {
  const data = `${oid}${price}${SIGNKEY}${timestamp}`
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
}

export const generateMKey = (mid: string): string => {
  const data = `${mid}${SIGNKEY}`
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
}

export const initializePayment = async (params: Omit<PaymentParams, 'signature' | 'verification' | 'mKey' | 'use_chkfake' | 'closeUrl' | 'acceptmethod'>) => {
  // 파라미터 검증
  if (!params.mid || !params.oid || !params.price || !params.timestamp) {
    alert('필수 파라미터가 누락되었습니다.')
    return
  }

  // 최소 결제 금액 검증 (100원 이상)
  const amount = parseInt(params.price)
  if (amount < 100) {
    alert('최소 결제 금액은 100원입니다.')
    return
  }

  const signature = generateSignature(
    params.oid,
    params.price,
    params.timestamp
  )
  
  const verification = generateVerification(
    params.oid,
    params.price,
    params.timestamp
  )
  
  const mKey = generateMKey(params.mid)

  // 이니시스 결제 페이지로 직접 POST
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = 'https://stgstdpay.inicis.com/stdpay/pay.ini'
  form.target = '_blank'
  
  const formData = {
    version: params.version,
    mid: params.mid,
    oid: params.oid,
    price: params.price,
    timestamp: params.timestamp,
    use_chkfake: 'Y',
    goodname: params.goodname,
    buyername: params.buyername,
    buyeremail: params.buyeremail,
    buyertel: params.buyertel,
    returnUrl: params.returnUrl,
    closeUrl: params.returnUrl,
    acceptmethod: 'below1000(N)',
    gopaymethod: 'Card',
    signature,
    verification,
    mKey,
    currency: params.currency
  }

  // form에 파라미터 추가
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(value)
      form.appendChild(input)
    }
  })

  document.body.appendChild(form)
  console.log('Payment params:', formData)

  // 결제 요청 데이터를 백엔드에 로깅
  try {
    await fetch('http://localhost:8081/api/payment/log-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderNo: params.oid,
        requestType: 'PAYMENT_REQUEST',
        requestUrl: 'https://stgstdpay.inicis.com/stdpay/pay.ini',
        requestData: formData
      }),
    }).catch(error => {
      console.error('결제 요청 로깅 실패:', error)
    })
  } catch (error) {
    console.error('결제 요청 로깅 에러:', error)
  }

  // 폼 제출
  form.submit()
  
  // 폼 제거
  setTimeout(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form)
    }
  }, 100)
}