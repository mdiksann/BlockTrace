<div align="center">
  <img src="logo.svg" alt="BlockTrace Logo" width="700" />

> AI-powered diagnostic agent for CAP (CROO Agent Protocol) integrations.
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Hackathon:** CROO Agent Hackathon 2026 · Developer Tooling Track  
**Protocol:** CAP (CROO Agent Protocol)  
**Settlement:** USDC on EVM (on-chain via CAP)

---

## What is BlockTrace?

BlockTrace is an AI-powered diagnostic agent deployed on the CROO Agent Store. It helps developers and other agents diagnose, validate, and fix their CAP integrations.

Any developer (or another agent via A2A) can hire BlockTrace to audit a target agent endpoint or wallet address. It runs a structured diagnostic suite and returns an actionable report with fix recommendations.

BlockTrace itself is a CAP-native agent — every diagnostic job is hired and paid for in USDC, settled on-chain.

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **CAP Integration Validator** | Validates endpoint reachability, CAP handshake compliance, and required method exposure (`hire`, `execute`, `settle`) |
| 2 | **On-chain Settlement Verifier** | Checks wallet address validity, USDC balance, transaction history, ETH gas reserves via ethers.js + Alchemy RPC |
| 3 | **A2A Composability Tester** | Tests if a target agent can be reliably hired by other agents — mock hire request, response structure, latency |
| 4 | **Diagnostic Report Generator** | Aggregates all check results into a unified report with prioritized fix recommendations (JSON + Markdown output) |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/<your-username>/blocktrace
cd blocktrace

# 2. Install backend dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in: OPENROUTER_API_KEY, ALCHEMY_API_KEY, CAP_AGENT_WALLET, CAP_AGENT_PRIVATE_KEY

# 4. Build & run
npm run build
npm start

# Or run in dev mode (auto-reload):
npm run dev
```

The agent starts on `http://localhost:3000` by default.

---

## API Endpoints

### `GET /` — Health Check & Agent Metadata

Returns agent name, version, capabilities, pricing, and available endpoints.

### `POST /hire` — Hire the Agent

Request a diagnostic job. Returns a `job_id` and pricing.

```json
{
  "target": "https://your-agent-endpoint.com",
  "mode": "full"
}
```

**Response:**
```json
{
  "status": "accepted",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Job accepted. Send target payload to POST /execute with this job_id.",
  "pricing": { "amount": "2.00", "token": "USDC" }
}
```

### `POST /execute` — Run Diagnostics

Execute the diagnostic job. Requires `job_id` from `/hire`.

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "target": "https://your-agent-endpoint.com",
  "mode": "full",
  "output_format": "json"
}
```

**Modes:** `full` (all 3 checks), `cap`, `settlement`, `a2a`  
**Output formats:** `json` (default), `markdown`

### `POST /settle` — Confirm Settlement

Confirm on-chain USDC payment after job completion.

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "transaction_hash": "0xabc123..."
}
```

---

## CAP SDK Methods Used

BlockTrace implements the three core CAP lifecycle methods:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `hire()` | `POST /hire` | Accepts job requests with USDC pricing |
| `execute()` | `POST /execute` | Runs diagnostic checks and returns structured report |
| `settle()` | `POST /settle` | Verifies on-chain USDC settlement transaction |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js (REST API) |
| LLM Provider | OpenRouter API (model-agnostic gateway) |
| Blockchain RPC | Ethers.js v6 + Alchemy |
| On-chain Settlement | USDC on EVM (CAP-native) |
| Frontend (demo) | Next.js 14 App Router |

---

## Project Structure

```
blocktrace/
├── src/
│   ├── index.ts                  # Express entry point + CAP routes
│   ├── cap/
│   │   ├── hire.ts               # hire() handler
│   │   ├── execute.ts            # execute() orchestrator
│   │   └── settle.ts             # settle() + on-chain confirmation
│   ├── modules/
│   │   └── debugger/
│   │       ├── cap-validator.ts  # Feature 1: CAP Integration Validator
│   │       ├── settlement.ts     # Feature 2: On-chain Settlement Verifier
│   │       ├── a2a-tester.ts     # Feature 3: A2A Composability Tester
│   │       ├── report.ts         # Feature 4: Report Generator
│   │       └── recommendations.ts # Recommendation engine
│   ├── llm/
│   │   └── openrouter.ts         # OpenRouter API client wrapper
│   ├── utils/
│   │   ├── validate.ts           # Input schema validation
│   │   ├── logger.ts             # Structured JSON logging
│   │   └── errors.ts             # Error codes + factory
│   └── types/
│       └── index.ts              # TypeScript interfaces
├── frontend/                     # Next.js demo dashboard
├── full-system.test.ts           # Integration tests
├── .env.example
├── CONTEXT.md                    # Agent specification
├── PROJECT.MD                    # Product requirements
└── package.json
```

---

## Environment Variables

```bash
# Required
OPENROUTER_API_KEY=       # OpenRouter API key (LLM gateway)
OPENROUTER_MODEL=         # e.g. "anthropic/claude-sonnet-4"
ALCHEMY_API_KEY=          # Alchemy RPC key
CAP_AGENT_WALLET=         # Agent's own EVM wallet address
CAP_AGENT_PRIVATE_KEY=    # Agent's signing key for CAP settlement

# Optional
PORT=3000
LOG_LEVEL=info            # debug | info | warn | error
MAX_JOB_TIMEOUT_MS=30000
```

---

## Running Tests

```bash
npm test
```

---

## Pricing

| Service | Price | Estimated Time |
|---------|-------|----------------|
| Full Debug (all 3 checks) | 2.00 USDC | ~25s |
| CAP Integration only | 0.75 USDC | ~8s |
| Settlement Verify only | 0.75 USDC | ~5s |
| A2A Composability only | 1.00 USDC | ~15s |

---

## Frontend Dashboard (Demo)

A minimal Next.js dashboard is included for demo purposes:

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:3001`. Proxies API calls to the backend at `localhost:3000`.

---

## License

MIT
