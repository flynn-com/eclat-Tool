import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--neu-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo replaces title + icon box */}
        <div className="flex justify-center mb-10">
          <Image
            src="/logo-full.png"
            alt="éclat studios"
            width={220}
            height={80}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <div className="neu-raised p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
