import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, action, children, className = '' }: CardProps) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
