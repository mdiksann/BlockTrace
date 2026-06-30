import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t border-border-subtle bg-background mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-6 text-[11px] font-mono text-gray-400">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <span className="text-sm font-bold font-sans text-white">BlockTrace</span>
          <span className="hidden md:inline-block">© 2024 BlockTrace Labs. System Status: Optimal.</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
          <Link href="#" className="hover:text-white transition-colors">API Reference</Link>
          <Link href="#" className="hover:text-white transition-colors">Status</Link>
          <Link href="#" className="hover:text-white transition-colors">Support</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
