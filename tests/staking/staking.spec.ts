import { expect } from "chai";
import sinon from "sinon";
import fs from "fs/promises";
import { ethers, JsonRpcProvider } from "ethers";

import {
  stakeAXStokens,
  swapRONforAXS,
  unstakeAXS,
  unstakeAllAXS,
} from "../../src/blockchain/staking/axs-staking";
import * as stakingModule from "../../src/blockchain/staking/axs-staking";
import { MetricsWriter } from "../../src/monitoring-system/MetricsWriter";

const fakeProvider = {
  getBalance: sinon.stub(),
} as any as JsonRpcProvider;

const fakeWalletAddress = "0xUSER";

describe("Staking scripts", () => {
  let sandbox: sinon.SinonSandbox;
  let metricsStub: sinon.SinonStubbedInstance<MetricsWriter>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    process.env.USER_ADDRESS = fakeWalletAddress;
    metricsStub = sandbox.createStubInstance(MetricsWriter);
    sandbox.stub(MetricsWriter, "getInstance").returns(metricsStub as any);

    //sandbox.stub(stakingModule, "provider").value(fakeProvider);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("stakeAXStokens()", () => {
    it("should return false if the balance is < 0.01 AXS", async () => {
      sandbox.stub(stakingModule, "stakeAXStokens").value({
        balanceOf: sinon.stub().resolves(ethers.parseEther("0.005")),
      } as any);
      const result = await stakeAXStokens();
      expect(result).to.be.false;
    });

    it("it should drain, save the file and push the metric, return true", async () => {
      sandbox.stub(stakingModule, "stakeAXStokens").value({
        balanceOf: sinon.stub().resolves(ethers.parseEther("1.0")),
      } as any);

      const fakeTx = {
        hash: "0xTX",
        wait: sinon.stub().resolves({ blockNumber: 123 }),
      };
      sandbox.stub(stakingModule, "stakeAXStokens").value({
        stake: sinon.stub().resolves(fakeTx),
      } as any);

      fakeProvider.getBalance("0x");

      (stakingModule as any).axsContract = {
        balanceOf: sinon.stub().resolves(ethers.parseEther("0.0")),
      };

      sandbox.stub(fs, "readFile").rejects({ code: "ENOENT" });
      const writeStub = sandbox.stub(fs, "writeFile").resolves();

      const ok = await stakeAXStokens();
      expect(ok).to.be.true;

      sinon.assert.calledOnce(writeStub);
      sinon.assert.calledOnce(metricsStub.writeStakingInfo);
    });
  });

  describe("swapRONforAXS()", () => {
    it("should return false if amount < 0.04", async () => {
      const ok = await swapRONforAXS(0.01);
      expect(ok).to.be.false;
    });

    it("I have to cook and write the metric, return true", async () => {
      // 1) getAmountsOut
      const amounts = [
        ethers.parseEther("1"),
        ethers.parseEther("0.5"),
        ethers.parseEther("0.2"),
      ];
      sandbox.stub(stakingModule, "swapRONforAXS").value({
        getAmountsOut: sinon.stub().resolves(amounts),
        swapExactRONForTokens: sinon.stub().resolves({
          hash: "0xSWAP",
          wait: sinon.stub().resolves({ gasUsed: ethers.parseEther("0.001") }),
        }),
      } as any);

      const ok = await swapRONforAXS(0.1);
      expect(ok).to.be.true;
      sinon.assert.calledOnce(metricsStub.writeSwapInfo);
    });
  });

  describe("unstakeAXS()", () => {
    it("should return false if nothing is blocked.", async () => {
      // getStakingAmount -> 0
      sandbox.stub(stakingModule, "stakeAXStokens").value({
        getStakingAmount: sinon.stub().resolves(0n),
      } as any);
      const ok = await unstakeAXS(50, true);
      expect(ok).to.be.false;
    });

    it("should return false if the percentage is incorrect.", async () => {
      sandbox.stub(stakingModule, "stakeAXStokens").value({
        getStakingAmount: sinon.stub().resolves(ethers.parseEther("1")),
      } as any);
      const okLow = await unstakeAXS(0, true);
      const okHigh = await unstakeAXS(150, true);
      expect(okLow).to.be.false;
      expect(okHigh).to.be.false;
    });

    it("дI have to partially undo and write the metric", async () => {
      // getStakingAmount -> 1 AXS
      const stakeAmt = ethers.parseEther("1");
      const getAmt = sinon.stub().resolves(stakeAmt);
      const fakeUnstakeTx = {
        hash: "0xU",
        wait: sinon.stub().resolves({ blockNumber: 321 }),
      };
      sandbox.stub(stakingModule, "stakeAXStokens").value({
        getStakingAmount: getAmt,
        unstake: sinon.stub().resolves(fakeUnstakeTx),
      } as any);

      (stakingModule as any).axsContract = {
        balanceOf: sinon.stub().resolves(ethers.parseEther("0.5")),
      };

      // stub storeUnstakeInfo fs & metrics
      sandbox.stub(fs, "readFile").rejects({ code: "ENOENT" });
      sandbox.stub(fs, "writeFile").resolves();

      const ok = await unstakeAXS(50, true);
      expect(ok).to.be.true;
      sinon.assert.calledOnce(metricsStub.writeUnstakingInfo);
    });
  });

  describe("unstakeAllAXS()", () => {
    it("must return false if there are no funds", async () => {
      sandbox.stub(stakingModule, "unstakeAXS").value({
        getStakingAmount: sinon.stub().resolves(0n),
      } as any);
      const ok = await unstakeAllAXS();
      expect(ok).to.be.false;
    });

    it("I have to undo everything and write a metric.", async () => {
      const stakeAmt = ethers.parseEther("2");
      const getAmt = sinon.stub().resolves(stakeAmt);
      const fakeTx = {
        hash: "0xALL",
        wait: sinon.stub().resolves({ blockNumber: 999 }),
      };
      sandbox.stub(stakingModule, "unstakeAllAXS").value({
        getStakingAmount: getAmt,
        unstakeAll: sinon.stub().resolves(fakeTx),
      } as any);

      (stakingModule as any).axsContract = {
        balanceOf: sinon.stub().resolves(ethers.parseEther("2")),
      };

      sandbox.stub(fs, "readFile").rejects({ code: "ENOENT" });
      sandbox.stub(fs, "writeFile").resolves();

      const ok = await unstakeAllAXS();
      expect(ok).to.be.true;
      sinon.assert.calledOnce(metricsStub.writeUnstakingInfo);
    });
  });
});