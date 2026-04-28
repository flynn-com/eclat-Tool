import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--neu-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/éclat-studios Logo (weiß ohne st).png"
              alt="éclat studios"
              width={180}
              height={60}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
            Melde dich an, um fortzufahren
          </p>
        </div>
        <div className="neu-raised p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
