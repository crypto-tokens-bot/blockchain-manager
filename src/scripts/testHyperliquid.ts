import "dotenv/config";
import { HyperliquidConnector, OrderParams } from "../blockchain/wrapppers/hyperliquidConnector";
import { getAssetData } from "../blockchain/utils/hyperliquidUtils";

async function testHyperliquidOrders() {
  const connector = new HyperliquidConnector(
    process.env.PRIVATE_KEY! as `0x${string}`,
    process.env.HYPERLIQUID_API_KEY! as `0x${string}`,
    process.env.HYPERLIQUID_API_SECRET! as `0x${string}`,
    process.env.HYPERLIQUID_BASE_URL!, //  "https://api.hyperliquid.xyz"
    false,
  );

  console.log("=== Testing Hyperliquid orders on testnet ===");
  const sui = await connector.getAssetData("SUI");
  console.log("sui:", sui);
  
  try {
    const leverage = await connector.updateLeverage(sui, 3);
    console.log("Leverage Response:", leverage);
  } catch (error) {
    console.error("Limit Order Error:", error);
  }

  let position = await connector.getPosition("SUI");
  console.log("position:", position);

  let balance = await connector.getBalance();
  console.log("balance:", balance);
  return;
  try {
    const limitOrderParams: OrderParams = {
      symbol: "SUI",
      side: "SELL",
      type: "LIMIT",
      quantity: 17,
      price: "2",
      leverage: 3,
    };

    const limitOrderResponse = await connector.createLimitOrder(limitOrderParams);
    console.log("Limit Order Response:", limitOrderResponse);
  } catch (error) {
    console.error("Limit Order Error:", error);
  }

  try {
    const marketOrderParams: OrderParams = {
      symbol: "AXS/USDT",
      side: "SELL",
      type: "MARKET",
      quantity: 10,
      leverage: 1,
    };

    const marketOrderResponse = await connector.createMarketOrder(marketOrderParams);
    console.log("Market Order Response:", marketOrderResponse);
  } catch (error) {
    console.error("Market Order Error:", error);
  }

//   
//   try {
//     const balance = await connector.getBalance();
//     console.log("Account Balance:", balance);
//   } catch (error) {
//     console.error("Balance Error:", error);
//   }

//  
//   try {
//     const testOrderId = 123;
//     const cancelResponse = await connector.cancelOrder(1, testOrderId);
//     console.log("Cancel Order Response:", cancelResponse);
//   } catch (error) {
//     console.error("Cancel Order Error:", error);
//   }
}

testHyperliquidOrders()
  .then(() => {
    console.log("=== Tests completed ===");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
