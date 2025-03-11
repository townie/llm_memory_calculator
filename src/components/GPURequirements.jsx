import { useState } from 'react';
import Tooltip from './Tooltip';

const GPURequirements = ({ memoryRequired }) => {
  // Default to both expanded for cleaner look
  const [expandedCard, setExpandedCard] = useState('consumer');
  
  const gpuTypes = [
    { id: 'consumer', name: 'Consumer GPUs', label: 'Gaming/Desktop', cards: [
      { name: 'RTX 4090', memory: 24 },
      { name: 'RTX 3090', memory: 24 },
      { name: 'RTX 4080', memory: 16 },
      { name: 'RTX 4070', memory: 12 },
      { name: 'RTX 3080', memory: 10 },
      { name: 'RTX 3070', memory: 8 },
    ]},
    { id: 'professional', name: 'Professional GPUs', label: 'Data Center', cards: [
      { name: 'H100', memory: 80 },
      { name: 'A100', memory: 80 },
      { name: 'L40', memory: 48 },
      { name: 'A10G', memory: 24 },
    ]},
  ];
  
  const calculateGpuCount = (gpuMemory) => {
    return Math.ceil(memoryRequired / gpuMemory);
  };
  
  // Helper to generate color classes based on GPU count
  const getGpuCountColor = (count) => {
    if (count <= 1) return 'text-green-400';
    if (count <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Background color for each row based on GPU count
  const getGpuRowBgClass = (count) => {
    if (count <= 1) return 'bg-green-900/10';
    if (count <= 4) return 'bg-yellow-900/10';
    return 'bg-red-900/10';
  };
  
  return (
    <div className="mt-6">
      <div className="flex items-center mb-2">
        <h2 className="text-xl font-bold text-cyan-300">GPU Requirements</h2>
        <Tooltip content="Number of GPUs needed = Model Memory / GPU Memory">
          <span className="ml-2 text-gray-400 cursor-help">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </span>
        </Tooltip>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">
        Minimum number of GPUs needed to load this model
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gpuTypes.map((type) => (
          <div 
            key={type.id}
            className="bg-gray-900/30 rounded-lg border border-gray-700/50 overflow-hidden transition-all duration-300 shadow-sm"
          >
            <div 
              className="px-4 py-3 cursor-pointer hover:bg-gray-800/50"
              onClick={() => setExpandedCard(expandedCard === type.id ? null : type.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-white">{type.name}</h3>
                  <span className="ml-2 text-xs py-0.5 px-2 bg-cyan-900/40 text-cyan-300 rounded-full">{type.label}</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2} 
                  stroke="currentColor" 
                  className={`w-4 h-4 text-cyan-400 transition-transform ${expandedCard === type.id ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
            
            <div className={`transition-all duration-300 overflow-hidden ${
              expandedCard === type.id ? 'max-h-96' : 'max-h-0'
            }`}>
              <div className="px-4 py-3">
                <div className="space-y-2">
                  {type.cards.map((card) => {
                    const gpuCount = calculateGpuCount(card.memory);
                    const countColor = getGpuCountColor(gpuCount);
                    const rowBgClass = getGpuRowBgClass(gpuCount);
                    
                    return (
                      <div key={card.name} className={`flex justify-between items-center p-2 rounded ${rowBgClass}`}>
                        <div>
                          <span className="font-medium text-white">{card.name}</span>
                          <span className="ml-1 text-xs text-gray-400">({card.memory} GB)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`font-bold ${countColor}`}>{gpuCount}</span>
                          <span className="text-sm text-gray-300">GPU{gpuCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GPURequirements;