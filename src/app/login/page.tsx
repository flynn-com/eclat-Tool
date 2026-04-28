import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--neu-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-14 w-14 flex items-center justify-center mx-auto mb-4 rounded-xl" style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
            <span className="font-bold text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>é</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Firmen-Tool
          </h1>
          <p style={{ color: 'var(--neu-text-secondary)' }} className="mt-1 text-sm">Melde dich an, um fortzufahren</p>
        </div>
        <div className="neu-raised-lg p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
