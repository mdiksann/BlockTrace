'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HexagonLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7.5V18.5L12 24L22 18.5V7.5L12 2Z" stroke="#00D9F5" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 6L6 9.3V16.7L12 20L18 16.7V9.3L12 6Z" stroke="#00F5A0" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const Navbar = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'CAP Debugger' },
    { href: '/explainer', label: 'Contract Explainer' },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-background border-b border-border-subtle">
      <div className="flex items-center space-x-12">
        <div className="flex items-center space-x-3">
          <HexagonLogo />
          <h1 className="text-xl font-bold bg-gradient-to-r from-accent-start to-accent-end text-transparent bg-clip-text font-sans tracking-tight">
            BlockTrace
          </h1>
        </div>
        <div className="flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`text-sm font-semibold pb-1.5 pt-1 border-b-2 transition-colors ${
                  isActive
                    ? 'text-white border-accent-start'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}>
                  {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Mainnet Pill */}
        <div className="flex items-center space-x-2 text-[11px] font-mono bg-transparent border border-border-subtle rounded-sm px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-start opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-start"></span>
          </span>
          <span className="text-gray-300">Mainnet</span>
        </div>

        {/* Wallet Pill */}
        <div className="flex items-center text-[11px] font-mono bg-transparent border border-border-subtle rounded-sm px-3 py-1.5">
          <span className="text-gray-300">0x4f2a...c91e</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
