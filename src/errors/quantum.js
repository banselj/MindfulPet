export class QuantumIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuantumIntegrityError';
    this.code = 'QUANTUM_INTEGRITY';
  }
}

export class QuantumDecoherenceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuantumDecoherenceError';
    this.code = 'QUANTUM_DECOHERENCE';
  }
}

export class EntanglementBreakError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EntanglementBreakError';
    this.code = 'ENTANGLEMENT_BREAK';
  }
}
