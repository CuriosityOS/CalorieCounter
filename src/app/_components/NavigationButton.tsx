'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationButtonProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export default function NavigationButton({ href, className, children, onClick }: NavigationButtonProps) {
  const router = useRouter();
  
  const handleNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Call the optional onClick handler if provided (for mobile menu close, etc.)
    if (onClick) {
      onClick();
    }
    
    // Add a small delay to allow any other handlers to complete
    setTimeout(() => {
      console.log('Navigating to:', href);
      router.push(href);
    }, 10);
  };
  
  return (
    <button 
      className={className}
      onClick={handleNavigation}
      data-href={href} // For debugging
    >
      {children}
    </button>
  );
}