import { BybitAdapter } from "../blockchain/exchanges/BybitAdapter";
import * as dotenv from "dotenv";
import { OrderSide } from "../blockchain/exchanges/IExchangeAdapter";

dotenv.config();

async function testBybitMarketOrder() {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error(
      "Error: BYBIT_API_KEY and BYBIT_API_SECRET must be set in .env file"
    );
    process.exit(1);
  }

  console.log("Creating Bybit adapter...");
  const bybitAdapter = new BybitAdapter(apiKey, apiSecret);

  const symbol = "AXS/USDT";
  const baseSize = 2;
  const side = OrderSide.Sell;

  console.log(
    `Creating market ${side} order for ${baseSize} ${symbol}...`
  );

  try {
    const result = await bybitAdapter.createMarket({
      symbol,
      baseSize,
      side,
      category: "linear",
      positionIdx: 0,
      reduceOnly: false,
    });

    console.log("Market order created successfully:");
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error("Error creating market order:", error);
    throw error;
  }
}

console.log("Starting Bybit adapter test...");
testBybitMarketOrder()
  .then(() => {
    console.log("Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed with error:", error);
    process.exit(1);
  });
