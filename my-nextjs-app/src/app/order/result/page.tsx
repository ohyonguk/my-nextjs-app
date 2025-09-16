'use client'

import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const PaymentResultPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [refunding, setRefunding] = useState(false)

  const resultCode = searchParams.get('resultCode')
  const resultMsg = searchParams.get('resultMsg')
  const tid = searchParams.get('tid')
  const oid = searchParams.get('oid')
  const price = searchParams.get('price')

  const isSuccess = resultCode === '0000'

  const handleRefund = async () => {
    if (!oid) {
      alert('주문번호가 없습니다.')
      return
    }

    if (!confirm(`결제를 취소하시겠습니까?`)) {
      return
    }

    const refundReason = prompt('취소 사유를 입력해주세요:', '고객 요청')
    if (!refundReason) {
      return
    }

    try {
      setRefunding(true)

      const response = await fetch(`http://localhost:8081/api/payment/refund/order/${oid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: refundReason,
          clientIp: '127.0.0.1'
        }),
      })

      if (!response.ok) {
        throw new Error('결제 취소 요청이 실패했습니다')
      }

      const data = await response.json()
      if (data.success) {
        alert('결제가 성공적으로 취소되었습니다')
        router.push('/order-history')
      } else {
        alert(`결제 취소 실패: ${data.message}`)
      }
    } catch (error) {
      console.error('Refund error:', error)
      alert('결제 취소 중 오류가 발생했습니다')
    } finally {
      setRefunding(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-6">
          {isSuccess ? '결제 완료' : '결제 실패'}
        </h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">결과 코드</p>
            <p className="font-semibold">{resultCode}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">결과 메시지</p>
            <p className="font-semibold">{resultMsg}</p>
          </div>
          
          {tid && (
            <div>
              <p className="text-sm text-gray-600">거래번호</p>
              <p className="font-semibold">{tid}</p>
            </div>
          )}
          
          {oid && (
            <div>
              <p className="text-sm text-gray-600">주문번호</p>
              <p className="font-semibold">{oid}</p>
            </div>
          )}
          
          {price && (
            <div>
              <p className="text-sm text-gray-600">결제금액</p>
              <p className="font-semibold">{parseInt(price).toLocaleString()}원</p>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {isSuccess && (
            <Button
              onClick={handleRefund}
              disabled={refunding}
              variant="destructive"
              className="w-full"
            >
              {refunding ? '취소 처리 중...' : '결제 취소'}
            </Button>
          )}

          <Button
            onClick={() => router.push('/')}
            variant={isSuccess ? "outline" : "default"}
            className="w-full"
          >
            홈으로 돌아가기
          </Button>

          <Button
            onClick={() => router.push('/order-history')}
            variant="outline"
            className="w-full"
          >
            주문 내역 보기
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default PaymentResultPage