'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractExplainerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-gray-400 font-mono text-sm">
      <div className="text-center space-y-3">
        <p className="text-lg font-bold text-white">Smart Contract Explainer</p>
        <p>This feature is coming soon (post-hackathon).</p>
        <p>Redirecting to CAP Debugger...</p>
      </div>
    </div>
  );
}
