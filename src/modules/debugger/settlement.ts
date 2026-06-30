import { ethers } from 'ethers';
import { CheckResult } from '../../types';
import { logger } from '../../utils/logger';
import { isValidEvmAddress } from '../../utils/validate';

// USDC contract addresses per network
const USDC_ADDRESSES: Record<string, string> = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const getProvider = (): ethers.JsonRpcProvider | null => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (alchemyKey) {
    return new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`);
  }
  logger.warn('ALCHEMY_API_KEY not set, settlement checks will be limited.');
  return null;
};

export const verifySettlement = async (address: string): Promise<CheckResult> => {
  const checks: { name: string; passed: boolean; detail: string }[] = [];
  const errors: string[] = [];
  let totalScore = 0;

  // ── Check 1: Valid EVM Address ──
  if (!isValidEvmAddress(address)) {
    return {
      status: 'FAIL',
      score: 0,
      details: `Invalid EVM address: "${address}". Must be a 42-character hex string starting with 0x.`,
      errors: ['ERR_INVALID_ADDRESS: Address does not match 0x[a-fA-F0-9]{40} pattern.'],
    };
  }
  checks.push({ name: 'Valid EVM Address', passed: true, detail: 'Address format is valid.' });
  totalScore += 20;

  // ── Check 2–5: On-chain checks (require RPC) ──
  const provider = getProvider();
  if (!provider) {
    checks.push({ name: 'RPC Connection', passed: false, detail: 'No RPC provider configured (ALCHEMY_API_KEY missing).' });
    errors.push('ERR_RPC_UNAVAILABLE: Cannot perform on-chain checks without RPC provider.');

    return {
      status: 'WARN',
      score: totalScore,
      details: `Settlement partially verified. Address format is valid but on-chain checks skipped (no RPC provider).`,
      errors,
      raw_data: { checks },
    };
  }

  // ── Check 2: USDC Balance ──
  try {
    logger.info('Settlement: checking USDC balance', { address });
    const usdcAddress = USDC_ADDRESSES['ethereum'];
    const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);
    const balance = await usdcContract.balanceOf(address);
    const decimals = await usdcContract.decimals();
    const formattedBalance = ethers.formatUnits(balance, decimals);
    const balanceNum = parseFloat(formattedBalance);

    if (balanceNum >= 1.0) {
      checks.push({ name: 'USDC Balance', passed: true, detail: `Balance: ${formattedBalance} USDC — sufficient for transactions.` });
      totalScore += 25;
    } else if (balanceNum > 0) {
      checks.push({ name: 'USDC Balance', passed: false, detail: `Balance: ${formattedBalance} USDC — low, may not cover settlement.` });
      errors.push(`Low USDC balance: ${formattedBalance} USDC. Recommend at least 1.0 USDC.`);
      totalScore += 10;
    } else {
      checks.push({ name: 'USDC Balance', passed: false, detail: 'Balance: 0 USDC — no funds for settlement.' });
      errors.push('Zero USDC balance. Wallet cannot settle any transactions.');
    }
  } catch (error: any) {
    checks.push({ name: 'USDC Balance', passed: false, detail: `Balance check failed: ${error.message}` });
    errors.push(`Balance check error: ${error.message}`);
  }

  // ── Check 3: Transaction History (at least 1 prior tx) ──
  try {
    logger.info('Settlement: checking transaction count', { address });
    const txCount = await provider.getTransactionCount(address);

    if (txCount > 0) {
      checks.push({ name: 'Transaction History', passed: true, detail: `${txCount} transactions found on-chain.` });
      totalScore += 25;
    } else {
      checks.push({ name: 'Transaction History', passed: false, detail: 'No transactions found — wallet has never been used.' });
      errors.push('No transaction history. Wallet appears unused.');
      totalScore += 5;
    }
  } catch (error: any) {
    checks.push({ name: 'Transaction History', passed: false, detail: `Tx history check failed: ${error.message}` });
    errors.push(`Transaction history error: ${error.message}`);
  }

  // ── Check 4: ETH Balance (for gas) ──
  try {
    logger.info('Settlement: checking ETH gas balance', { address });
    const ethBalance = await provider.getBalance(address);
    const formattedEth = ethers.formatEther(ethBalance);
    const ethNum = parseFloat(formattedEth);

    if (ethNum >= 0.001) {
      checks.push({ name: 'ETH Gas Balance', passed: true, detail: `ETH balance: ${formattedEth} — sufficient for gas.` });
      totalScore += 15;
    } else if (ethNum > 0) {
      checks.push({ name: 'ETH Gas Balance', passed: false, detail: `ETH balance: ${formattedEth} — very low gas reserves.` });
      errors.push('Low ETH balance for gas. May fail to submit settlement transactions.');
      totalScore += 5;
    } else {
      checks.push({ name: 'ETH Gas Balance', passed: false, detail: 'No ETH for gas fees.' });
      errors.push('Zero ETH balance. Cannot pay gas for settlement transactions.');
    }
  } catch (error: any) {
    checks.push({ name: 'ETH Gas Balance', passed: false, detail: `Gas balance check failed: ${error.message}` });
    errors.push(`Gas balance error: ${error.message}`);
  }

  // ── Check 5: Not a contract address (agents should use EOA) ──
  try {
    const code = await provider.getCode(address);
    if (code === '0x') {
      checks.push({ name: 'Address Type', passed: true, detail: 'Address is an EOA (externally owned account).' });
      totalScore += 15;
    } else {
      checks.push({ name: 'Address Type', passed: true, detail: 'Address is a smart contract (multisig or smart wallet).' });
      totalScore += 10; // Still valid, just different
    }
  } catch (error: any) {
    checks.push({ name: 'Address Type', passed: false, detail: `Address type check failed: ${error.message}` });
  }

  // ── Determine Overall Status ──
  const failedChecks = checks.filter(c => !c.passed);
  let status: CheckResult['status'];

  if (failedChecks.length === 0) {
    status = 'PASS';
  } else if (totalScore >= 50) {
    status = 'WARN';
  } else {
    status = 'FAIL';
  }

  return {
    status,
    score: totalScore,
    details: `Settlement health: ${checks.filter(c => c.passed).length}/${checks.length} checks passed. Score: ${totalScore}/100.`,
    errors: errors.length > 0 ? errors : undefined,
    raw_data: { checks },
  };
};
