import { NextRequest, NextResponse } from 'next/server';

// PG사에서 POST로 보내는 결제 데이터를 처리하고 CSR 페이지로 GET 리다이렉트
export async function POST(request: NextRequest) {
  console.log('=== CSR Route: POST 요청 수신 ===');
  
  try {
    // FormData 읽기
    const formData = await request.formData();
    
    // FormData → URL 파라미터로 변환
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      params.set(key, value.toString());
    }
    
    console.log('CSR Route: FormData 변환 완료:', Object.fromEntries(params.entries()));
    
    // 베이스 URL 구성
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // CSR 페이지로 GET 리다이렉트 (URL에 파라미터 포함)
    const redirectUrl = new URL('/order/payment-result-csr-simple', baseUrl);
    redirectUrl.search = params.toString();
    
    console.log('CSR Route: 리다이렉트 URL:', redirectUrl.toString());
    
    return NextResponse.redirect(redirectUrl.toString());
    
  } catch (error) {
    console.error('CSR Route: POST 처리 오류:', error);
    
    // 오류 시 에러 페이지로 리다이렉트
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const errorUrl = new URL('/order/payment-result-csr-simple', baseUrl);
    errorUrl.searchParams.set('error', '1');
    errorUrl.searchParams.set('message', 'POST 데이터 처리 중 오류가 발생했습니다.');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}

// GET 요청도 처리 (직접 접근하는 경우)
export async function GET(request: NextRequest) {
  console.log('=== CSR Route: GET 요청 수신 ===');
  
  const { searchParams } = new URL(request.url);
  
  // 파라미터가 있으면 그대로 전달하여 리다이렉트
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUrl = new URL('/order/payment-result-csr-simple', baseUrl);
  redirectUrl.search = searchParams.toString();
  
  console.log('CSR Route: GET 리다이렉트 URL:', redirectUrl.toString());
  
  return NextResponse.redirect(redirectUrl.toString());
}