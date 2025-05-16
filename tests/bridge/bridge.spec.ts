import { expect } from "chai";
import sinon from "sinon";
import { ethers } from "ethers";

import * as bridgeModule from "../../src/blockchain/bridge/EthereumToRonin";
import { bridgeNativeTokens } from "../../src/blockchain/bridge/EthereumToRonin";

import logger from "../../src/utils/logger";

describe("bridgeNativeTokens()", () => {
  let sandbox: sinon.SinonSandbox;
  let fakeTx: { hash: string; wait: sinon.SinonStub };

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // create a fake tx where wait() returns a fake receipt
    fakeTx = {
      hash: "0xFAKETX",
      wait: sinon.stub(),
    };

    // stub bridgeContract.ccipSend to resolve with our fakeTx
    sandbox
      .stub(bridgeModule, "bridgeNativeTokens")
      .value({ ccipSend: sinon.stub().resolves(fakeTx) } as any);

    // mute real logging
    sandbox.stub(console, "error");
    sandbox.stub(logger, "info");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should return false if amount is less than fee (0.01 ETH)", async () => {
    // 0.005 < 0.01, so bridgeNativeTokens must throw before sending
    const result = await bridgeNativeTokens(0.005);
    expect(result).to.be.false;
    // ccipSend should not have been called
    sinon.assert.notCalled(
      (bridgeModule.bridgeContract as any).ccipSend
    );
  });

  it("should succeed and return true when transaction receipt.status === 1", async () => {
    // simulate a successful receipt
    fakeTx.wait.resolves({ status: 1 });
    const result = await bridgeNativeTokens(0.5);

    expect(result).to.be.true;
    // verify that ccipSend and wait() were called
    sinon.assert.calledOnce(
      (bridgeModule.bridgeContract as any).ccipSend
    );
    sinon.assert.calledOnce(fakeTx.wait);
  });

  it("should return false when transaction receipt.status !== 1", async () => {
    // simulate a failed receipt
    fakeTx.wait.resolves({ status: 0 });
    const result = await bridgeNativeTokens(0.2);
    expect(result).to.be.false;
  });

  it("should catch errors and return false on RPC failure", async () => {
    // force ccipSend to reject
    (bridgeModule.bridgeContract as any).ccipSend.rejects(
      new Error("RPC error")
    );
    const result = await bridgeNativeTokens(1);
    expect(result).to.be.false;

    // console.error should have been called once
    sinon.assert.calledOnce(console.error as any);
  });
});