import { ReactNode } from 'react';

interface WidgetGridProps {
  children: ReactNode;
}

export function WidgetGrid({ children }: WidgetGridProps) {
  return (
    <div className="grid gap-6 xl:gap-8 md:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}
