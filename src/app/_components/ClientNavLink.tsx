'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClientNavLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

// Custom Link component that uses client-side navigation
export default function ClientNavLink({ href, className, children }: ClientNavLinkProps) {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(href);
  };
  
  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}