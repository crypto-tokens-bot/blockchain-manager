/// <reference types="mocha" />
// @ts-nocheck 

import { expect } from "chai";
import sinon from "sinon";

import * as indexerModule from "../src/indexer/indexer";
import { CONTRACTS_TO_INDEX } from "../src/indexer/registry";
// import { after, before } from "cheerio/lib/api/manipulation";

describe("Indexer Module", function () {
  const fakeProvider = {} as any;
  let setupStub: sinon.SinonStub;

  before(function () {
    setupStub = sinon.stub(indexerModule, "setupContractListener");
  });

  after(function () {
    setupStub.restore();
  });

  it("runIndexer должен вызвать setupContractListener для каждого контракта", async function () {
    await indexerModule.runIndexer(fakeProvider);

    expect(setupStub.callCount).to.equal(CONTRACTS_TO_INDEX.length);

    for (let i = 0; i < CONTRACTS_TO_INDEX.length; i++) {
      const call = setupStub.getCall(i);
      expect(call.args[0]).to.equal(fakeProvider);
      expect(call.args[1]).to.deep.equal(CONTRACTS_TO_INDEX[i]);
    }
  });
});