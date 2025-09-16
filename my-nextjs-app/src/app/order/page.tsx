'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import OrderForm from '@/components/OrderForm';

interface User {
  userId: number;
  email: string;
  name: string;
  phoneNumber: string;
  points: number;
}

export default function OrderPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        validateToken(token, userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        handleLogout();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string, userData: User) => {
    try {
      const response = await fetch('http://localhost:8081/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const freshUserData = await response.json();
        setUser(freshUserData);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {user ? '주문하기' : '로그인 후 주문하기'}
        </h1>
        
        {user ? (
          <div>
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => router.push('/order-history')}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                주문 내역 보기
              </button>
              <button
                onClick={() => router.push('/payment-history')}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                결제 내역 보기
              </button>
            </div>
            <OrderForm user={user} onLogout={handleLogout} />
          </div>
        ) : (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </div>
  );
}
