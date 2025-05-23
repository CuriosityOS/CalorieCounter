'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Menu, X, History, Settings, LogOut, Home, RefreshCw } from 'lucide-react';
import ThemeToggle from '../ui/theme-toggle';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/history', label: 'History', icon: History },
  { href: '/customize', label: 'Customize', icon: Settings },
];

export default function NavBar() {
  const { user, signOut } = useAuth();
  const refreshAll = useAppStore((state) => state.refreshAll);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Minimum visible feedback time
    }
  };

  // Don't show navbar on auth pages or landing page
  if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="CalorieCounter" width={40} height={40} className="h-10 w-auto" />
            <span className="font-bold text-xl hidden md:inline-block">CalorieCounter</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <ul className="flex space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {user && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => signOut()}
                  className="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Navigation Toggle */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <ThemeToggle />
          
          <button
            onClick={toggleMenu}
            className="ml-2 inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-foreground focus:outline-none"
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden"
        >
          <div className="space-y-1 px-4 py-3 pb-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-base font-medium w-full text-left",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {link.label}
                </a>
              );
            })}
            
            {user && (
              <>
                <button
                  onClick={() => {
                    handleRefresh();
                    setIsOpen(false);
                  }}
                  disabled={isRefreshing}
                  className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className={`mr-3 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </button>
                
                <button
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}