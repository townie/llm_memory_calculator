import { useState, useEffect } from 'react';
import ParameterSlider from './ParameterSlider';
import ModelPresets from './ModelPresets';
import GPURequirements from './GPURequirements';
import Tooltip from './Tooltip';
import { calculateMemory } from '../utils/calculationUtils';
const MemoryCalculator = () => {
  // Updated initial state to use Llama 3.3 70B as default
  const [modelParams, setModelParams] = useState({
    parameters: 70, // Changed from 7 to 70 for Llama 3.3 70B
    quantizationBits: 8,
    overheadFactor: 1.2
  });
  const [memoryRequired, setMemoryRequired] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Default preset ID for Llama 3.3 70B
  const defaultPresetId = 'llama3.3-70b';

  useEffect(() => {
    updateMemoryCalculation();
  }, [modelParams]);

  const updateMemoryCalculation = () => {
    setIsCalculating(true);
    // Add slight delay to show calculation animation
    setTimeout(() => {
      const memory = calculateMemory(
        modelParams.parameters,
        modelParams.quantizationBits,
        modelParams.overheadFactor
      );
      setMemoryRequired(memory);
      setIsCalculating(false);
    }, 300);
  };

  const handlePresetSelect = (preset) => {
    setModelParams({
      ...modelParams,
      parameters: preset.parameters
    });
  };

  const handleSliderChange = (name, value) => {
    setModelParams({
      ...modelParams,
      [name]: value
    });
  };

  // Format parameter display for large values
  const formatParameterDisplay = (value) => {
    if (value >= 1000) {
      return `${(value/1000).toFixed(1)}T`;
    }
    return `${value}B`;
  };

  return (
    <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 shadow-lg overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      {/* Results Section */}
      <div className="mb-10 py-6 px-4 bg-gray-900 bg-opacity-40 rounded-xl shadow-inner border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-cyan-300">Memory Required</h2>
          <Tooltip content="Memory (GB) = (Parameters * 4) * (32/Quantization) * Overhead Factor">
            <span className="text-gray-400 cursor-help flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span className="ml-1 text-xs text-gray-400">Formula</span>
            </span>
          </Tooltip>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-3">
          <div className={`transition-transform duration-300 ${isCalculating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-center">
              {memoryRequired >= 1000 ?
                `${(memoryRequired / 1000).toFixed(1)}TB` :
                `${memoryRequired.toFixed(1)}GB`}
            </div>
          </div>

          <div className="text-center md:text-left text-gray-300">
            <p className="mb-1">
              For a <span className="font-semibold text-white">{formatParameterDisplay(modelParams.parameters)}</span> parameter model
            </p>
            <p>
              at <span className="font-semibold text-white">{modelParams.quantizationBits}-bit</span> precision
            </p>
          </div>
        </div>
      </div>

      {/* Model Presets */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-cyan-300">Select Model</h2>
          <p className="text-sm text-gray-400">or adjust parameters below</p>
        </div>
        <ModelPresets
          onPresetSelect={handlePresetSelect}
          defaultPresetId={defaultPresetId}
        />
      </div>

      {/* Parameters Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-5 text-cyan-300">Model Parameters</h2>
        <div className="space-y-8">
          <ParameterSlider
            name="parameters"
            label="Model Size"
            value={modelParams.parameters}
            min={0.5}
            max={10000}
            step={0.1}
            unit="B"
            onChange={handleSliderChange}
            tooltip="The number of parameters in billions (e.g., 7 for a 7B model, 1000 for a 1T model)"
          />

          <ParameterSlider
            name="quantizationBits"
            label="Quantization"
            value={modelParams.quantizationBits}
            min={2}
            max={32}
            step={2}
            unit="bits"
            onChange={handleSliderChange}
            tooltip="The precision in bits for model weights (2, 4, 8, 16, or 32 bits)"
          />

          <ParameterSlider
            name="overheadFactor"
            label="Overhead Factor"
            value={modelParams.overheadFactor}
            min={1.0}
            max={2.0}
            step={0.05}
            unit="x"
            onChange={handleSliderChange}
            tooltip="Additional memory overhead for KV cache and other runtime requirements (1.2 = 20% overhead)"
          />
        </div>
      </div>

      <GPURequirements memoryRequired={memoryRequired} />
    </div>
  );
};
export default MemoryCalculator;
