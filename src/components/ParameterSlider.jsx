import { useState } from 'react';
import Tooltip from './Tooltip';

const ParameterSlider = ({ name, label, value, min, max, step, unit, onChange, tooltip }) => {
  const [isActive, setIsActive] = useState(false);
  
  const handleChange = (e) => {
    onChange(name, parseFloat(e.target.value));
  };

  // Calculate percentage for the gradient
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="w-full transition-all duration-200 p-4 rounded-lg hover:bg-gray-800/40">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <label htmlFor={name} className="text-gray-200 font-medium">
            {label}
          </label>
          {tooltip && (
            <Tooltip content={tooltip}>
              <span className="text-gray-400 cursor-help inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </span>
            </Tooltip>
          )}
        </div>
        <div 
          className={`text-lg font-semibold px-3 py-1 rounded-lg transition-all duration-300 ${isActive ? 'bg-cyan-600/80 text-white scale-105 shadow-lg shadow-cyan-500/20' : 'bg-gray-700/50 text-cyan-300'}`}
        >
          {value} {unit}
        </div>
      </div>
      
      <div className="relative mt-1 px-1">
        <input
          type="range"
          id={name}
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseDown={() => setIsActive(true)}
          onMouseUp={() => setIsActive(false)}
          onTouchStart={() => setIsActive(true)}
          onTouchEnd={() => setIsActive(false)}
          className="w-full h-1.5 bg-gray-700/70 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgb(34, 211, 238) 0%, rgb(6, 182, 212) ${percentage}%, rgb(31, 41, 55) ${percentage}%, rgb(31, 41, 55) 100%)`
          }}
        />
        <div className="flex justify-between mt-2">
          <div className="text-xs text-gray-400">{min}</div>
          <div className="text-xs text-gray-400">{max}</div>
        </div>
      </div>
    </div>
  );
};

export default ParameterSlider;