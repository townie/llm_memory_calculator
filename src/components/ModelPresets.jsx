import { useState } from 'react';

const ModelPresets = ({ onPresetSelect }) => {
  const [activePreset, setActivePreset] = useState(null);
  
  const presets = [
    { id: 'smollm2 1.7b', name: 'SmolLM2 1.7b', parameters: 1.7},

    { id: 'qwq-32b', name: 'QwQ 32B', parameters: 32},
    { id: 'llama3.3-70b', name: 'Llama 3.3 70B', parameters: 70 },
    { id: 'Qwen2.5-72b', name: 'Qwen2.5 72B', parameters: 72 },

    { id: 'deepseek-r1-671b', name: 'DeepSeek R1 671B', parameters: 671 },
 
    { id: 'gpt5-10t', name: 'GPT 5 10T', parameters: 10000 }
  ];

  const handlePresetClick = (preset) => {
    setActivePreset(preset.id);
    onPresetSelect(preset);
  };

  return (
    <div className="mb-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-300 ${activePreset === preset.id
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 border border-gray-700/50'
            }`}
          >
            <div className="flex flex-col items-center">
              <span>{preset.name}</span>
              <span className="text-xs opacity-70 mt-0.5">{preset.parameters}B</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelPresets;