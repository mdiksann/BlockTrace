import { verifySettlement } from './src/modules/debugger/settlement';
// This allows the test script to load environment variables from a .env file if you create one
// You can create a file named .env and add your API keys there like:
// ALCHEMY_API_KEY=your_key_here
require('dotenv').config();


const test = async () => {
  console.log("--- Running Settlement Verifier Tests ---");
  console.log(`Using RPC endpoint: ${process.env.ALCHEMY_API_KEY ? 'Alchemy' : 'Default Ethers'}`);

  if (!process.env.ALCHEMY_API_KEY) {
      console.warn("\nWARNING: ALCHEMY_API_KEY is not set. Tests will likely fail or be rate-limited.");
  }

  // Test 1: A valid, well-known address with extensive history (Vitalik Buterin's)
  const address1 = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  console.log(`\n[1] Testing a valid address with history: ${address1}`);
  try {
    const result1 = await verifySettlement(address1);
    console.log("Result:", JSON.stringify(result1, null, 2));
  } catch(e) {
    console.error("Test 1 Failed:", e);
  }


  // Test 2: A valid address format, but likely has no USDC or history
  const randomWallet = "0x1234567890123456789012345678901234567890";
  console.log(`\n[2] Testing a valid but likely empty address: ${randomWallet}`);
    try {
        const result2 = await verifySettlement(randomWallet);
        console.log("Result:", JSON.stringify(result2, null, 2));
    } catch(e) {
        console.error("Test 2 Failed:", e);
    }
  

  // Test 3: An invalid address format
  const invalidAddress = "not-a-valid-address";
  console.log(`\n[3] Testing an invalid address: ${invalidAddress}`);
  try {
    const result3 = await verifySettlement(invalidAddress);
    console.log("Result:", JSON.stringify(result3, null, 2));
  } catch(e) {
      console.error("Test 3 Failed:", e);
  }

  console.log("\n--- Tests Finished ---");
};

test();
