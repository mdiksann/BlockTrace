'use client';

import { ArrowRight, Terminal, CheckCircle, Search, FileText, AlertTriangle, ShieldAlert, Shield, ShieldCheck, FileSearch, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

interface RiskFlagProps {
  severity: RiskLevel;
  label: string;
  description: string;
}

const riskConfig = {
  HIGH: {
    color: 'text-warning',
    borderColor: 'border-warning',
    pillText: 'text-warning',
  },
  MEDIUM: {
    color: 'text-white',
    borderColor: 'border-blue-400',
    pillText: 'text-blue-400',
  },
  LOW: {
    color: 'text-white',
    borderColor: 'border-gray-500',
    pillText: 'text-gray-400',
  },
};

const RiskFlag = ({ severity, label, description }: RiskFlagProps) => {
  const getPillStyle = (sev: string) => {
    if (sev === 'HIGH') return 'border-[#ffb4ab] text-[#ffb4ab]';
    if (sev === 'MEDIUM') return 'border-[#a1efff] text-[#a1efff]';
    return 'border-gray-500 text-gray-400';
  };

  return (
    <div className="flex-1 bg-background border border-border-subtle p-5">
      <div className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono uppercase border mb-4 ${getPillStyle(severity)}`}>
        {severity}
      </div>
      <h4 className={`font-bold text-base mb-2 text-white`}>{label}</h4>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
};

export default function ContractExplainerPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExplainContract = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          job_id: 'job_' + Date.now(),
          type: 'explain', 
          address, 
          network: 'ethereum' 
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }
      const data = await res.json();
      setReport(data.result || data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching contract explanation.');
    } finally {
      setLoading(false);
    }
  };

  const riskFlags: RiskFlagProps[] = report?.risk_flags || [
    { severity: 'HIGH', label: 'Waiting for Input', description: 'Run the explainer to view risk flags.' }
  ];

  const contractTitle = report?.name || 'Contract Analysis';
  const deployerAddress = report?.deployer || '0x0000...0000';
  const isVerified = report ? (report.verified !== false) : false;
  const summaryText = report?.summary || "Submit a contract address to generate an AI-powered logic summary and security breakdown.";

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Input Bar */}
      <div className="flex items-stretch">
        <div className="flex items-center px-4 bg-background border border-border-subtle border-r-0 flex-grow h-14">
          <Terminal size={18} className="text-gray-500 mr-3" />
          <input
            type="text"
            placeholder="Enter Contract Address (e.g. 0x71C...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplainContract()}
            className="w-full h-full bg-transparent font-mono text-sm text-white focus:outline-none placeholder-gray-600"
          />
        </div>
        <button 
          onClick={handleExplainContract}
          disabled={loading || !address}
          className="bg-gradient-to-r from-accent-start to-accent-end text-background font-bold px-8 h-14 rounded-none flex items-center justify-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? (
             <><Loader2 size={18} className="animate-spin" /><span>Analyzing...</span></>
          ) : (
             <><FileSearch size={18} /><span>Explain Contract</span></>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger p-4 text-danger font-mono text-sm flex items-center gap-3">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Result Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border-subtle rounded-none p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="max-w-[80%]">
                <h3 className="font-bold text-xl text-white mb-2 truncate">{contractTitle}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-300 bg-gray-800/50 border border-border-subtle px-2 py-0.5 uppercase">
                    {report?.network || 'EVM'}
                  </span>
                  {isVerified && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-accent-start">
                      <CheckCircle size={12}/>
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 border border-border-subtle flex shrink-0 items-center justify-center text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono block mb-1">Deployer Address</label>
                <p className="font-mono text-[13px] text-gray-300 truncate" title={deployerAddress}>{deployerAddress}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono block mb-1">Creation Info</label>
                <p className="font-mono text-[13px] text-gray-300">
                  {report?.deploy_block ? `Block ${report.deploy_block}` : 'Pending or Unknown'}
                </p>
              </div>
              {report?.key_functions && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono block mb-1">Key Functions Detected</label>
                  <p className="font-mono text-[13px] text-gray-300">{report.key_functions.length}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border-subtle rounded-none p-6 opacity-50">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-4 flex items-center gap-2">
              Interaction Stats <span className="text-[9px] bg-gray-800 px-1 py-0.5 rounded-sm">(Coming Soon)</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border-subtle p-3">
                <label className="text-[10px] text-gray-500 font-mono block mb-1 uppercase">TX Count</label>
                <p className="text-xl font-bold text-gray-600">--</p>
              </div>
              <div className="border border-border-subtle p-3">
                <label className="text-[10px] text-gray-500 font-mono block mb-1 uppercase">Users</label>
                <p className="text-xl font-bold text-gray-600">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Risks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Logic Summary */}
          <div className="bg-card border border-border-subtle rounded-none p-8 relative overflow-hidden min-h-[300px]">
            {/* Background decorative star/cross */}
            <div className="absolute top-0 right-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4 text-white">
              <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"></path>
              </svg>
            </div>
            
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <FileText className="text-accent-start" size={20} />
              <h3 className="text-lg font-bold text-accent-start">Contract Logic Summary</h3>
            </div>
            
            <div className="space-y-6 text-sm text-gray-300 leading-relaxed font-sans relative z-10 whitespace-pre-wrap">
              {summaryText}
            </div>
          </div>

          {/* Risk Flags */}
          <div className="bg-card border border-border-subtle rounded-none p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="text-gray-500" size={16} />
              <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-mono font-semibold">Security Assessment & Risk Flags</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              {riskFlags.map((flag, index) => (
                <RiskFlag key={index} severity={flag.severity as RiskLevel} label={flag.label} description={flag.description} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
