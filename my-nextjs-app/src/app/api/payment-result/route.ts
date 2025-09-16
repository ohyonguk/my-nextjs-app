// CSR 방식으로 변경됨 - 이 API Route는 더 이상 사용하지 않습니다.
// PG사 리다이렉트 URL을 /order/payment-result-csr로 변경하세요.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // CSR 페이지로 리다이렉트
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('⚠️  SSR API Route 호출됨 - CSR 페이지로 리다이렉트');
  console.log('PG사 설정을 /order/payment-result-csr로 변경하세요.');
  
  const redirectUrl = new URL('/order/payment-result-csr', base);
  
  // FormData를 URL 파라미터로 변환
  try {
    const formData = await request.formData();
    const params = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
      params.set(key, value.toString());
    }
    
    redirectUrl.search = params.toString();
  } catch (error) {
    console.error('FormData 처리 오류:', error);
  }
  
  return NextResponse.redirect(redirectUrl.toString());
}