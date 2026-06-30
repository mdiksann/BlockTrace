# Product Requirements Document
# BlockTrace

> **Hackathon:** CROO Agent Hackathon 2026
> **Track:** Developer Tooling
> **Version:** 2.0 · June 2026
> **License:** MIT

---

## 1. Product Overview

| Field | Detail |
|---|---|
| Project Name | BlockTrace |
| Hackathon | CROO Agent Hackathon 2026 |
| Primary Track | Developer Tooling |
| Prize Pool | ~$10,200 USD + $CROO airdrop whitelist |
| Deadline | July 12, 2026 — 16:00 UTC |
| Team Size | 1 (Solo) |
| License | MIT |

### 1.1 Problem Statement

Thousands of developers are building AI Agents on the CROO ecosystem using CAP (CROO Agent Protocol). However, when integrations fail — broken settlement, malformed CAP calls, incorrect wallet configurations — there is no dedicated tooling to diagnose the root cause. Developers are left guessing through raw logs and on-chain explorers.

This creates friction that slows adoption of the CAP standard and increases time-to-ship for new agent builders.

### 1.2 Solution

**BlockTrace** is an AI-powered diagnostic agent, deployed on CROO Agent Store, that any developer (or another agent) can hire to audit and debug their CAP integration. It accepts a target agent endpoint or wallet address, runs a structured diagnostic suite, and returns a human-readable + machine-parseable report with actionable fix recommendations.

BlockTrace itself is a CAP-native agent — every diagnostic job is hired and paid for in USDC, settled on-chain, proving the same composability it helps other developers achieve.

### 1.3 Target Users

- Developers building agents with CAP integration who need to validate their setup
- Teams submitting to the CROO hackathon who need a fast sanity-check tool
- Other agents (A2A) that need to verify a dependency agent before hiring it

---

## 2. Goals & Success Metrics

### 2.1 Hackathon Goals

- Ship a fully functional agent on CROO Agent Store by July 12, 2026
- Pass all 5 submission requirements: listed on Store, CAP-integrated, open source, demo video, BUIDL on DoraHacks
- Achieve minimum 5 unique buyer wallets and 3 unique counterparty agents (anti-sybil threshold)
- Qualify for the Developer Tooling track prize

### 2.2 Product Success Metrics

| Metric | Target |
|---|---|
| Unique wallets that hire the agent | ≥ 5 by deadline |
| A2A calls (other agents hiring this agent) | ≥ 3 |
| Avg. diagnostic report generation time | < 30 seconds |
| User rating on Agent Store | ≥ 4.0 / 5.0 |
| GitHub repo stars | ≥ 10 by submission |
| Demo video views | ≥ 50 by submission |

---

## 3. Feature Specifications

### Feature 1: CAP Integration Validator `P0`

Validates whether a target agent correctly implements the CAP specification.

- **Input:** target agent endpoint URL or CAP agent ID
- **Checks:** endpoint reachability, CAP handshake compliance, required method exposure (`hire`, `execute`, `settle`)
- **Output:** PASS / WARN / FAIL per check with detailed error messages

### Feature 2: On-chain Settlement Verifier `P0`

Verifies that the agent's USDC settlement is correctly configured and functional.

- **Input:** agent wallet address (EVM)
- **Checks:** wallet has valid USDC balance, settlement transaction history exists, no failed txs in last 10 interactions
- **Output:** Settlement health score (0–100) + transaction log summary

### Feature 3: A2A Composability Tester `P1`

Tests whether the agent can be properly called by another agent as a dependency.

- **Input:** agent endpoint
- **Checks:** agent responds to A2A hire request, returns structured output, handles concurrent calls
- **Output:** composability score + latency report

### Feature 4: Diagnostic Report Generator `P0`

Aggregates all check results into a unified, structured report.

- **Output formats:** JSON (machine-readable for A2A), Markdown (human-readable)
- **Includes:** executive summary, per-check results, prioritized fix recommendations, estimated fix effort

---

## 4. User Stories

| ID | As a... | I want to... | So that... | Priority |
|---|---|---|---|---|
| US-01 | Developer | validate my CAP endpoint before submitting to hackathon | I catch integration errors early and avoid DQ | P0 |
| US-02 | Developer | verify my agent's USDC settlement is working | I know buyers can successfully pay and transact | P0 |
| US-03 | Agent (A2A) | hire this debugger to audit a dependency agent | I only compose with reliable, verified agents | P0 |
| US-04 | Developer | receive a structured JSON diagnostic report | I can programmatically process the results in my pipeline | P1 |
| US-05 | Developer | see latency and composability scores for an agent | I make informed choices about which agents to depend on | P1 |

---

## 5. Technical Architecture

### 5.1 Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js (REST API) + CAP SDK |
| LLM Provider | OpenRouter API (model-agnostic LLM gateway) |
| Blockchain RPC | Ethers.js v6 + Alchemy / Infura |
| On-chain Settlement | USDC on EVM (CAP-native) |
| Database | None — stateless per-request |
| Deployment | Railway / Render |
| Frontend (optional) | Next.js 14 App Router — minimal dashboard, built only for demo purposes, not a core deliverable |

### 5.2 System Flow

```
Client (human / agent)
  │
  ▼ CAP hire() + USDC payment
Agent Entry Point (Express)
  │
  ▼
Debugger Orchestrator
  ├── CAP Integration Validator (F1)
  ├── Settlement Verifier (F2)
  └── A2A Composability Tester (F3)
        │
        ▼
  Report Generator (F4) → JSON + Markdown
  │
  ▼ CAP settle() — on-chain confirmation
Client receives structured report
```

### 5.3 CAP Integration Requirements

- Implement `hire()` method accepting USDC payment
- Implement `execute()` method with structured job payload
- Implement `settle()` method for on-chain confirmation
- Register agent on CROO Agent Store with public metadata
- Expose agent via public HTTPS endpoint (no auth required for CAP calls)

### 5.4 API Contract

```typescript
// Job Payload Schema
interface JobPayload {
  target: string;                                   // endpoint URL, CAP agent ID, or EVM wallet
  mode?: "full" | "cap" | "settlement" | "a2a";      // default: "full"
  output_format?: "json" | "markdown";               // default: "json"
}

// Debug Report Output
interface DebugReport {
  job_id: string;
  target: string;
  summary: "PASS" | "WARN" | "FAIL";
  overall_score: number; // 0–100
  checks: {
    cap_integration:   CheckResult;
    settlement:        CheckResult;
    a2a_composability: CheckResult;
  };
  recommendations: Recommendation[];
  generated_at: string; // ISO 8601
  execution_time_ms: number;
}

interface CheckResult {
  status: "PASS" | "WARN" | "FAIL";
  score: number;   // 0–100
  details: string;
  errors?: string[];
}

interface Recommendation {
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  check: string;
  issue: string;
  fix: string;
}
```

---

## 6. Development Roadmap

| Period | Sprint Goal | Key Deliverables |
|---|---|---|
| Week 1 · Day 1–3 | Foundation & CAP Setup | Project scaffold, CAP SDK integration, basic hire/execute/settle loop, deploy to staging |
| Week 1 · Day 4–7 | Core Debugger Features | CAP Integration Validator (F1), Settlement Verifier (F2), basic report output (F4) |
| Week 2 · Day 8–10 | A2A + Polish | A2A Composability Tester (F3), report formatting, error handling hardening |
| Week 2 · Day 11–12 | Submit | Optional demo dashboard, demo video, README, list on Agent Store, submit DoraHacks |

---

## 7. Hackathon Submission Checklist

- [ ] Listed on CROO Agent Store (discoverable by humans + agents)
- [ ] Integrated with CAP (callable, settles on-chain in USDC)
- [ ] Open source — public GitHub repo with MIT license
- [ ] Demo video (max 5 min) uploaded and linked
- [ ] README with setup instructions + SDK methods used
- [ ] BUIDL filed on DoraHacks with all required fields
- [ ] ≥ 5 unique buyer wallets
- [ ] ≥ 3 unique counterparty agents (A2A)

---

## 8. UI Design Prompt (for Stitch — optional/demo only)

Paste this prompt verbatim into [Google Stitch](https://stitch.withgoogle.com) to generate the dashboard UI:

```
Design a dark Web3 developer dashboard called "BlockTrace" for the CROO blockchain ecosystem.

Color palette: primary background #070B14 (near-black navy), card surfaces #0A1020, accent gradient from #00F5A0 (neon mint) to #00D9F5 (cyan), warning amber #F59E0B, danger red #EF4444. All text on dark surfaces.

Typography: Space Grotesk for UI labels and headings, JetBrains Mono for all addresses, code, and report output. Font sizes small and dense — this is a developer tool, not a consumer app.

Top navigation bar: left-aligned hexagonal block-chain logo mark with "BlockTrace" in gradient text (mint to cyan). Right-aligned wallet chip showing "0x4f2a…c91e — Connected" with a pulsing green dot.

Main screen: below the nav, a dark input bar with a monospace text field ("Enter agent endpoint or CAP Agent ID") and a gradient "Run Diagnostics →" button. Below that, three diagnostic cards in a horizontal row — each card has a 2px top accent line (green for PASS, amber for WARN, red for FAIL), a small uppercase label, a status dot + status text in the accent color, a monospace subtitle, and a thin progress bar. Cards show: (1) CAP Integration — PASS, "Handshake OK", score bar 94%; (2) Settlement — WARN, "Low Balance", score bar 58%; (3) A2A Composability — PASS, "3 Agents OK", score bar 88%.

Below the cards, a full-width terminal-style report card with a dark header showing "DIAGNOSTIC REPORT" label + "↓ JSON" and "↓ MD" ghost buttons. The body shows syntax-highlighted JSON with line numbers: keys in cyan, PASS values in neon green, WARN values in amber, string values in soft purple.

Bottom bar: left shows a circular score ring (72, amber, conic gradient fill) with "Overall Score" and "1 warning · fix required". Right shows "Share report" ghost button and a cyan-bordered "Hire via A2A" button with a bolt icon.

Global feel: no gradients on backgrounds (flat dark surfaces only), subtle 1px border lines in #1A2540, top accent lines on cards for status color. Hex-grid background pattern at very low opacity on the main surface. Everything feels like a premium Web3 dev tool — dense, precise, dark, and technical.
```

---

*— End of Document —*