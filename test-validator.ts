import { validateCapIntegration } from './src/modules/debugger/cap-validator';

const test = async () => {
  console.log("--- Running Validator Tests ---");

  // Test 1: Valid and reachable target
  console.log("\nTesting with a valid target (google.com)...");
  const result1 = await validateCapIntegration('https://www.google.com');
  console.log("Result:", result1);

  // Test 2: Unreachable target
  console.log("\nTesting with an unreachable target (invalid-url)...");
  const result2 = await validateCapIntegration('http://invalid-url-for-testing.xyz');
  console.log("Result:", result2);
  
  console.log("\n--- Tests Finished ---");
};

test();
