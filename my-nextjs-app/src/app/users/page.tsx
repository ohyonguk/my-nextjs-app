import UserRegistrationForm from '@/components/UserRegistrationForm';

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          회원 관리
        </h1>
        <UserRegistrationForm />
      </div>
    </div>
  );
}