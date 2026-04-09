/**
 * Manual Test Script for Broadcast Error Handling
 *
 * Tests three scenarios:
 * 1. Normal Flow: Match create → Broadcast success → 201 response
 * 2. Broadcast Failure: Match create → Broadcast throws error → 201 response + error log
 * 3. WebSocket Unavailable: Match create → broadcastMatchCreated undefined → 201 response
 */

const BASE_URL = process.env.API_URL || "http://localhost:8000";

// Helper function to create a match
async function createMatch(testName, matchData) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log("=".repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matchData),
    });

    const data = await response.json();

    console.log(`✓ Response Status: ${response.status}`);
    console.log(`✓ Response Body:`, JSON.stringify(data, null, 2));

    if (response.status === 201) {
      console.log(`✓ SUCCESS: Match created with ID ${data.data.id}`);
      return { success: true, data: data.data };
    } else {
      console.log(`✗ FAILED: Expected 201, got ${response.status}`);
      return { success: false, status: response.status, data };
    }
  } catch (error) {
    console.log(`✗ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Generate unique match data
function generateMatchData(suffix) {
  const now = new Date();
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return {
    sport: "Football",
    homeTeam: `Team A ${suffix}`,
    awayTeam: `Team B ${suffix}`,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    homeScore: 0,
    awayScore: 0,
  };
}

async function runTests() {
  console.log("Starting Manual Tests for Broadcast Error Handling");
  console.log(`API Base URL: ${BASE_URL}`);

  // Test 1: Normal Flow
  const test1Result = await createMatch(
    "Scenario 1: Normal Flow (Broadcast Success)",
    generateMatchData("Normal"),
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 2: Broadcast Failure
  // Note: This requires manually modifying the broadcast function to throw an error
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST: Scenario 2: Broadcast Failure");
  console.log("=".repeat(60));
  console.log("⚠ To test this scenario:");
  console.log(
    "  1. Modify src/ws/server.js broadcastMatchCreated to throw an error",
  );
  console.log("  2. Restart the server");
  console.log("  3. Run this test again");
  console.log("  4. Verify: 201 response + error logged to console");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 3: WebSocket Unavailable
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST: Scenario 3: WebSocket Unavailable");
  console.log("=".repeat(60));
  console.log("⚠ To test this scenario:");
  console.log(
    "  1. Comment out the broadcastMatchCreated assignment in src/index.js",
  );
  console.log("  2. Restart the server");
  console.log("  3. Run this test again");
  console.log("  4. Verify: 201 response (no error)");

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(
    `Scenario 1 (Normal Flow): ${test1Result.success ? "✓ PASSED" : "✗ FAILED"}`,
  );
  console.log("Scenario 2 (Broadcast Failure): Manual test required");
  console.log("Scenario 3 (WebSocket Unavailable): Manual test required");
  console.log("\nNote: Check server console logs for broadcast error messages");
}

runTests().catch(console.error);
