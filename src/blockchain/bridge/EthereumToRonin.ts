const bridgeABI = [
    // Пример сигнатуры – убедитесь, что она соответствует реальному контракту:
    "function ccipSend(uint64 destinationChainSelector, (bytes receiver, address feeToken, (uint256 amount)[] tokenAmounts, bytes extraArgs) message) external payable returns (uint256)"
  ];
  