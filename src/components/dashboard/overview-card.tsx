import Link from 'next/link';

interface OverviewCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  className?: string;
  href?: string;
}

export function OverviewCard({ title, value, description, icon, href }: OverviewCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium" style={{ color: 'var(--neu-text-secondary)' }}>{title}</h3>
        <div className="neu-raised-sm h-10 w-10 flex items-center justify-center">
          <div style={{ color: 'var(--neu-accent)' }}>{icon}</div>
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--neu-text)', fontFamily: 'var(--font-heading)' }}>{value}</p>
      {description && (
        <p className="text-sm mt-1" style={{ color: 'var(--neu-accent-mid)' }}>{description}</p>
      )}
    </>
  );

  const baseClass = 'neu-raised p-6';

  if (href) {
    return (
      <Link href={href} className={`${baseClass} block transition-all hover:opacity-90`}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
