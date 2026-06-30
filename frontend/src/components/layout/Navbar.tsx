'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HexagonLogo = () => (
  <svg width="28" height="28" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00F5A0"/>
        <stop offset="100%" stopColor="#00D9F5"/>
      </linearGradient>
    </defs>
    <polygon points="80,0 150,40 150,120 80,160 10,120 10,40" fill="url(#hexGrad)"/>
    <polyline points="35,95 60,95 70,65 90,115 100,80 125,80" fill="none" stroke="#070B14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="35" cy="95" r="5" fill="#070B14"/>
    <circle cx="125" cy="80" r="5" fill="#070B14"/>
  </svg>
);

const Navbar = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'CAP Debugger' },
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


      </div>
    </nav>
  );
};

export default Navbar;
