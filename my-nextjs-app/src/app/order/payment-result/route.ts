import { NextRequest, NextResponse } from 'next/server';

// 이니시스에서 POST로 보내는 결제 결과를 처리하는 route
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('=== Payment Result Route: POST 요청 수신 ===', timestamp);
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Content-Type 확인 (이니시스는 form-data로 전송)
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    // FormData 읽기 (이니시스는 form-data로 전송)
    const formData = await request.formData();
    
    // FormData를 일반 객체로 변환
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }
    
    console.log('Payment Result Route: 받은 FormData:', params);
    console.log('FormData 키 개수:', Object.keys(params).length);
    
    // 주요 파라미터 추출 (orderNumber를 우선으로)
    const orderNo = params['orderNumber'] || params['oid'] || params['P_OID'] || params['MOID'];
    const resultCode = params['resultCode'] || params['P_STATUS'];
    const resultMsg = params['resultMsg'] || params['P_RMESG1'];
    const tid = params['tid'] || params['P_TID'];
    
    console.log('Payment Result Route: 주문번호:', orderNo, '결과코드:', resultCode);
    
    if (!orderNo) {
      console.error('Payment Result Route: 주문번호가 없습니다.');
      return new NextResponse(generateCloseWindowHtml('주문번호가 없습니다.', 'error'), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' }
      });
    }
    
    // 이니시스에서 실제 결제 완료 후 보낸 데이터인지 검증
    console.log('Payment Result Route: 이니시스 결제 완료 데이터 검증 중...');
    
    // 이니시스에서 오는 필수 파라미터들이 있는지 확인
    const hasInicisParams = params['P_STATUS'] || params['resultCode'] || params['P_TID'] || params['tid'];
    const hasValidOrderNo = orderNo && orderNo.startsWith('ORD');
    
    console.log('이니시스 파라미터 존재:', !!hasInicisParams);
    console.log('유효한 주문번호:', hasValidOrderNo);
    console.log('결과코드:', resultCode);
    
    // 이니시스 테스트 환경에서는 즉시 결과가 올 수 있으므로 더 유연하게 처리
    if ((hasInicisParams || hasValidOrderNo) && orderNo) {
      console.log('이니시스 결제 데이터로 판단하여 처리 시작');
      try {
        console.log('Payment Result Route: Spring Boot로 결제 결과 전달 시작');
        
        const backendResponse = await fetch('http://localhost:8081/api/payment/response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        const backendResult = await backendResponse.json();
        console.log('Payment Result Route: Spring Boot 응답:', backendResult);

        // 결제 성공/실패에 따른 HTML 응답
        if (backendResult.success) {
          return new NextResponse(
            generateCloseWindowHtml('결제가 완료되었습니다.', 'success', {
              orderNo: backendResult.orderNo,
              amount: backendResult.amount
            }), 
            {
              headers: { 'Content-Type': 'text/html; charset=UTF-8' }
            }
          );
        } else {
          return new NextResponse(
            generateCloseWindowHtml(
              backendResult.message || '결제가 실패했습니다.', 
              'failed',
              {
                orderNo: orderNo,
                resultCode: resultCode,
                resultMsg: resultMsg
              }
            ), 
            {
              headers: { 'Content-Type': 'text/html; charset=UTF-8' }
            }
          );
        }
        
      } catch (backendError) {
        console.error('Payment Result Route: 백엔드 요청 실패:', backendError);
        return new NextResponse(
          generateCloseWindowHtml('결제 처리 중 오류가 발생했습니다.', 'error'), 
          {
            headers: { 'Content-Type': 'text/html; charset=UTF-8' }
          }
        );
      }
    } else {
      // 결제 데이터가 불완전한 경우
      console.error('Payment Result Route: 불완전한 결제 데이터 - resultCode:', resultCode, 'orderNo:', orderNo);
      return new NextResponse(
        generateCloseWindowHtml('결제 데이터가 불완전합니다.', 'error'), 
        {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' }
        }
      );
    }
    
  } catch (error) {
    console.error('Payment Result Route: POST 처리 오류:', error);
    return new NextResponse(
      generateCloseWindowHtml('결제 결과 처리 중 오류가 발생했습니다.', 'error'), 
      {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' }
      }
    );
  }
}

// 팝업창을 닫고 부모 창에 메시지를 전달하는 HTML 생성
function generateCloseWindowHtml(message: string, status: string, data?: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>결제 결과</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      text-align: center; 
      margin-top: 50px; 
      background-color: #f9f9f9; 
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 400px;
      margin: 0 auto;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .success { color: #10b981; }
    .failed { color: #ef4444; }
    .error { color: #f59e0b; }
    h2 { margin: 10px 0; }
    p { color: #666; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon ${status}">
      ${status === 'success' ? '✅' : status === 'failed' ? '❌' : '⚠️'}
    </div>
    <h2>${message}</h2>
    ${data?.orderNo ? `<p>주문번호: ${data.orderNo}</p>` : ''}
    <p>창이 자동으로 닫힙니다...</p>
  </div>

  <script>
    console.log('Payment result window:', {
      status: '${status}',
      message: '${message}',
      data: ${JSON.stringify(data || {})}
    });

    // 부모 창에 결제 결과 전달
    if (window.opener) {
      const result = {
        type: 'PAYMENT_COMPLETE',
        status: '${status}',
        message: '${message}',
        data: ${JSON.stringify(data || {})}
      };
      
      console.log('Sending postMessage to parent:', result);
      window.opener.postMessage(result, '*');
      
      // 2초 후 창 닫기
      setTimeout(function() {
        window.close();
      }, 2000);
    } else {
      console.log('No parent window found');
      // 부모 창이 없으면 3초 후 현재 창에서 주문 페이지로 이동
      setTimeout(function() {
        window.location.href = '/order';
      }, 3000);
    }
  </script>
</body>
</html>`;
}