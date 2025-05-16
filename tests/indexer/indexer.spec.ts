import { expect } from "chai";
import sinon from "sinon";
import { ethers, JsonRpcProvider } from "ethers";

import * as fetchPastModule from "../../src/indexer/fetchPastEvents";
import * as indexerModule from "../../src/indexer/indexer";
import * as queueModule from "../../src/queue/eventQueue";
import { MetricsWriter } from "../../src/monitoring-system/MetricsWriter";
import { fetchPastEvents, saveToQueue } from "../../src/indexer/fetchPastEvents";
import { runIndexer } from "../../src/indexer/indexer";

describe("Indexer module", () => {
  let sandbox: sinon.SinonSandbox;
  let providerStub: sinon.SinonStubbedInstance<JsonRpcProvider>;
  let fakeContract: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    providerStub = sandbox.createStubInstance(JsonRpcProvider);
    providerStub.getBlockNumber.resolves(200);

    sandbox
      .stub(fetchPastModule as any, "fetchLogsInRange")
      .resolves([
        { blockNumber: 150, data: "0xdeadbeef", topics: ["0xaaa", "0xbbb"] },
      ]);

    const iface = {
      getEvent: () => ({ fragment: { topicHash: "0xaaa" } }),
      decodeEventLog: sandbox.stub().returns({ args: ["0x01", 123, 456] }),
    };
    fakeContract = { interface: iface };
    sandbox.stub(ethers, "Contract").returns(fakeContract as any);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("saveToQueue()", () => {
    it("must add the task to the queue and call writeContractEvent()", async () => {
      const addStub = sandbox.stub(queueModule.eventQueue, "add").resolves();
      const mwStub = sandbox.createStubInstance(MetricsWriter);
      sandbox.stub(MetricsWriter, "getInstance").returns(mwStub as any);

      const sample = {
        contract: "0xCAFE",
        event: "Deposited",
        args: ["0x01", "100", "200"],
        blockNumber: 42,
      };

      await fetchPastModule.saveToQueue(sample);

      sinon.assert.calledOnceWithExactly(
        addStub,
        "contract-event",
        sinon.match.object
      );
      sinon.assert.calledOnceWithExactly(
        mwStub.writeContractEvent as sinon.SinonStub,
        sample
      );
    });
  });

  describe("fetchPastEvents()", () => {
    it("it should call fetchLogsInRange, parse logs and save them to the queue", async () => {
      const saveStub = sandbox.stub(fetchPastModule, "saveToQueue").resolves();

      await fetchPastModule.fetchPastEvents(
        providerStub as any,
        "0xDEAD",
        [] as any
      );

      sinon.assert.calledOnce(saveStub);
      const callArg = saveStub.firstCall.args[0];
      expect(callArg).to.include({
        contract: "0xDEAD",
        event: "Deposited",
        blockNumber: 150,
      });
      sinon.assert.calledOnce(
        fakeContract.interface.decodeEventLog as sinon.SinonStub
      );
    });
  });

  describe("runIndexer()", () => {
    it("it should hang the listener on events and call save To Queue when emiting", async () => {
      const onStub = sandbox.stub();
      sandbox
        .stub(indexerModule as any, "attachListeners")
        .returns({ on: onStub } as any);
      sandbox.stub(fetchPastModule, "saveToQueue").resolves();

      await indexerModule.runIndexer(providerStub as any);

      sinon.assert.calledOnce(onStub);
      sinon.assert.calledWith(onStub, "data", sinon.match.func);
    });
  });
  it('fetchPastEvents does not trigger save To Queue if there are no logs', async () => {
    sinon.restore();
    sinon.stub(global as any, 'fetchLogsInRange').resolves([]);
    const saveStub = sinon.stub();
    sinon.replace(require('../../src/indexer/fetchPastEvents'), 'saveToQueue', saveStub);
  
    await fetchPastEvents(providerStub as any, '0xDEAD', "[]");
    expect(saveStub.called).to.be.false;
  });
  it('saveToQueue does not forward, but logs in case of an error queue.add', async () => {
    const err = new Error('boom');
    sinon.stub(queueModule.eventQueue, 'add').rejects(err);
    const mw = sinon.createStubInstance(MetricsWriter);
    sinon.stub(MetricsWriter, 'getInstance').returns(mw as any);
    const logErr = sinon.stub(console, 'error');
  
    await saveToQueue({ contract: '0xC', event: 'X', data: {}, blockNumber: 1 });
    expect(logErr.calledOnce).to.be.true;
    logErr.restore();
  });
  it('When receiving data, the rum Indexer calls save To Queue', async () => {
    const onStub = sinon.stub();
    const emitter = { on: onStub };
    sinon.stub(indexerModule as any, 'attachListeners').returns(emitter);

    await runIndexer(providerStub as any);
    const [[, callback]] = onStub.getCalls()
      .filter(c => c.args[0] === 'data')
      .map(c => c.args);
  
    const saveStub = sinon.stub(require('../../src/indexer/fetchPastEvents'), 'saveToQueue').resolves();
  
    const fakeEvent = { topics: [], data: '0x', blockNumber: 123 };
    await callback(fakeEvent);
  
    expect(saveStub.calledOnce).to.be.true;
  });
});
