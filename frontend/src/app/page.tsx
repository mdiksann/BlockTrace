'use client';

import { ArrowRight, Terminal, Zap, Download, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

type Status = "PASS" | "WARN" | "FAIL" | "PENDING";

interface DiagnosticCardProps {
  id: string;
  title: string;
  status: Status;
  message: string;
  score: number;
  metricLabel: string;
  metricValue: string;
}

const DiagnosticCard = ({ id, title, status, message, score, metricLabel, metricValue }: DiagnosticCardProps) => {
  const isPass = status === 'PASS';
  const isWarn = status === 'WARN';
  const isPending = status === 'PENDING';
  
  const color = isPending ? 'text-gray-500' : isPass ? 'text-accent-start' : isWarn ? 'text-warning' : 'text-danger';
  const accent = isPending ? 'border-t-border-subtle' : isPass ? 'border-t-accent-start' : isWarn ? 'border-t-warning' : 'border-t-danger';
  const bgProgress = isPending ? 'bg-gray-800' : isPass ? 'bg-accent-start/20' : isWarn ? 'bg-warning/20' : 'bg-danger/20';
  const fgProgress = isPending ? 'bg-gray-600' : isPass ? 'bg-accent-start' : isWarn ? 'bg-warning' : 'bg-danger';

  return (
    <div className={`bg-card border border-border-subtle rounded-none flex-1 p-5 border-t-[3px] ${accent} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-mono">DIAGNOSTIC {id}</h3>
        <span className={`text-[11px] font-bold tracking-widest font-mono ${color}`}>{status}</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      <p className="text-sm text-gray-400 mb-6">{message}</p>
      
      <div className="flex items-center justify-between text-[10px] font-mono tracking-wider mb-2">
        <span className="text-gray-500 uppercase">{metricLabel}: {metricValue}</span>
        <span className={color}>{score}%</span>
      </div>
      <div className={`w-full h-1 ${bgProgress}`}>
        <div className={`h-full ${fgProgress} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
};

export default function CAPDebuggerPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunDiagnostics = async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      // Step 1: Hire — get job_id
      const hireRes = await fetch('/api/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, mode: 'full' }),
      });
      if (!hireRes.ok) {
        throw new Error(`Hire failed with status ${hireRes.status}`);
      }
      const hireData = await hireRes.json();
      const job_id = hireData.job_id;

      // Step 2: Execute — run diagnostics
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id, target, mode: 'full', output_format: 'json' }),
      });
      if (!res.ok) {
        throw new Error(`Execute failed with status ${res.status}`);
      }
      const data = await res.json();
      setReport(data.result || data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  const capCheck = report?.checks?.cap_integration;
  const setCheck = report?.checks?.settlement;
  const a2aCheck = report?.checks?.a2a_composability;

  const diagnostics: DiagnosticCardProps[] = report ? [
    { id: '01', title: 'CAP Integration', status: capCheck?.status || 'FAIL', message: capCheck?.details || 'N/A', score: capCheck?.score || 0, metricLabel: 'LATENCY', metricValue: capCheck?.raw_data?.latency_ms ? `${capCheck.raw_data.latency_ms}ms` : 'N/A' },
    { id: '02', title: 'Settlement', status: setCheck?.status || 'FAIL', message: setCheck?.details || 'N/A', score: setCheck?.score || 0, metricLabel: 'LIQUIDITY', metricValue: setCheck?.status === 'PASS' ? 'OK' : 'CRITICAL' },
    { id: '03', title: 'A2A Composability', status: a2aCheck?.status || 'FAIL', message: a2aCheck?.details || 'N/A', score: a2aCheck?.score || 0, metricLabel: 'NODES', metricValue: 'VERIFIED' },
  ] : [
    { id: '01', title: 'CAP Integration', status: 'PENDING', message: 'Ready to test', score: 0, metricLabel: 'LATENCY', metricValue: '--' },
    { id: '02', title: 'Settlement', status: 'PENDING', message: 'Ready to test', score: 0, metricLabel: 'LIQUIDITY', metricValue: '--' },
    { id: '03', title: 'A2A Composability', status: 'PENDING', message: 'Ready to test', score: 0, metricLabel: 'NODES', metricValue: '--' },
  ];

  const overallScore = report?.overall_score || 0;
  const warnings = report?.recommendations?.length || 0;

  return (
    <div className="space-y-6 pt-2">
      {/* Input Bar */}
      <div className="flex items-stretch">
        <div className="flex items-center px-4 bg-background border border-border-subtle border-r-0 flex-grow h-14">
          <Terminal size={18} className="text-gray-500 mr-3" />
          <input
            type="text"
            placeholder="Enter agent endpoint or CAP Agent ID"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunDiagnostics()}
            className="w-full h-full bg-transparent font-mono text-sm text-white focus:outline-none placeholder-gray-600"
          />
        </div>
        <button 
          onClick={handleRunDiagnostics}
          disabled={loading || !target}
          className="bg-gradient-to-r from-accent-start to-accent-end text-background font-bold px-8 h-14 rounded-none flex items-center justify-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? (
             <><Loader2 size={16} className="animate-spin" /><span>Running...</span></>
          ) : (
             <><span>Run Diagnostics</span><ArrowRight size={16} /></>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger p-4 text-danger font-mono text-sm flex items-center gap-3">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Diagnostic Cards */}
      <div className="flex gap-6 flex-col md:flex-row">
        {diagnostics.map((diag) => (
          <DiagnosticCard key={diag.id} {...diag} />
        ))}
      </div>

      {/* Report Card */}
      <div className="bg-card border border-border-subtle rounded-none flex flex-col mt-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-card">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 opacity-40">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
            </div>
            <h3 className="font-mono text-[11px] uppercase text-gray-300 font-semibold tracking-[0.2em] ml-2">Diagnostic Report</h3>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[10px] font-mono text-gray-500 hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-wider">
              <Download size={14} /> JSON
            </button>
            <button className="text-[10px] font-mono text-gray-500 hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-wider">
              <Download size={14} /> MD
            </button>
          </div>
        </div>
        <div className="p-6 font-mono text-sm bg-background overflow-x-auto min-h-[200px]">
          {report ? (
            <pre className="text-gray-300 leading-relaxed text-[13px]">{JSON.stringify(report, null, 2)}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm py-12">
              No report generated yet. Run diagnostics to view results.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-card border border-border-subtle rounded-none p-5 mt-6">
        <div className="flex items-center gap-5">
          <div className="relative w-[50px] h-[50px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-border-subtle" strokeWidth="3"></circle>
              {report && (
                <circle cx="18" cy="18" r="16" fill="none" className={report.summary === 'PASS' ? 'stroke-accent-start' : (report.summary === 'WARN' ? 'stroke-warning' : 'stroke-danger')} strokeWidth="3" strokeDasharray={`${overallScore}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-out' }}></circle>
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{overallScore}</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-200">Overall Score</h4>
            <p className={`text-[11px] font-mono mt-1 flex items-center gap-1.5 ${warnings > 0 ? 'text-warning' : 'text-accent-start'}`}>
              <AlertTriangle size={12} /> {warnings} warning{warnings !== 1 ? 's' : ''} {warnings > 0 ? '· fix required' : ''}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
