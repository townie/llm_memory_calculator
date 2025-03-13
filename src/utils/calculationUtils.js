/**
 * Utility functions for memory calculations
 */

/**
 * Calculate the GPU memory required for a model
 *
 * @param {number} parameters - Model parameters in billions
 * @param {number} quantizationBits - Bits used for quantization
 * @param {number} overheadFactor - Memory overhead factor (e.g. 1.2 for 20% overhead)
 * @returns {number} Memory required in GB
 */
export const calculateMemory = (parameters, quantizationBits, overheadFactor) => {
  // Formula: M = (P * 4B) * (32/Q) * 1.2
  // M: GPU memory in GB
  // P: Model parameters in billions
  // 4B: 4 bytes per parameter
  // 32: 32 bits in 4 bytes
  // Q: Quantization bits
  // 1.2: Standard overhead factor

  const memoryGB = (((parameters * 4) / (32 / quantizationBits)) * overheadFactor);
  return memoryGB;
};
