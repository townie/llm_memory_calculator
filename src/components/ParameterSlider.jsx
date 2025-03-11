import { useState, useEffect } from 'react';
import Tooltip from './Tooltip';

const ParameterSlider = ({ name, label, value, min, max, step, unit, onChange, tooltip }) => {
  const [isActive, setIsActive] = useState(false);
  const [sliderValue, setSliderValue] = useState(50); // Middle of slider range
  
  // For parameter slider with non-linear scale
  const isParamSlider = name === 'parameters';
  // For quantization with specific values
  const isQuantizationSlider = name === 'quantizationBits';
  
  // Constants for the three-segment scale
  const MAX_PARAM_VALUE = 10000; // 10T parameters
  const LOW_THRESHOLD = 3;      // End of logarithmic section
  const HIGH_THRESHOLD = 10;    // Start of exponential section
  
  // Each section gets 1/3 of the slider
  const LOW_SECTION_PERCENT = 33.33;
  const MID_SECTION_PERCENT = 33.33;
  const HIGH_SECTION_PERCENT = 33.34;

  // Quantization specific values
  const quantizationValues = [2, 4, 8, 16, 32];
  
  // Convert actual parameter value to slider position (0-100)
  useEffect(() => {
    if (isParamSlider) {
      // Cap the value for display purposes
      const cappedValue = Math.min(value, MAX_PARAM_VALUE);
      // Convert from real parameter value to slider position
      setSliderValue(paramToSlider(cappedValue));
    } else if (isQuantizationSlider) {
      // For quantization slider, map the discrete values to positions
      const position = quantizationToSlider(value);
      setSliderValue(position);
    } else {
      // For regular linear sliders
      setSliderValue(((value - min) / (max - min)) * 100);
    }
  }, [value, min, max, isParamSlider, isQuantizationSlider]);

  // Convert quantization value to slider position
  const quantizationToSlider = (value) => {
    const index = quantizationValues.indexOf(value);
    if (index === -1) {
      // If not found, find the nearest value
      const nearest = quantizationValues.reduce((prev, curr) => 
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
      );
      return quantizationValues.indexOf(nearest) * (100 / (quantizationValues.length - 1));
    }
    return index * (100 / (quantizationValues.length - 1));
  };

  // Convert slider position to quantization value
  const sliderToQuantization = (position) => {
    const segmentWidth = 100 / (quantizationValues.length - 1);
    const index = Math.round(position / segmentWidth);
    return quantizationValues[Math.max(0, Math.min(quantizationValues.length - 1, index))];
  };

  // Convert from parameter value to slider position (0-100)
  const paramToSlider = (paramValue) => {
    if (paramValue <= LOW_THRESHOLD) {
      // Logarithmic mapping for low range (0.5-3B)
      // Use log function with offset to handle values < 1
      const position = Math.log(paramValue + 0.5) / Math.log(LOW_THRESHOLD + 0.5);
      return position * LOW_SECTION_PERCENT;
    } else if (paramValue <= HIGH_THRESHOLD) {
      // Linear mapping for middle range (3-10B)
      const positionInSection = (paramValue - LOW_THRESHOLD) / (HIGH_THRESHOLD - LOW_THRESHOLD);
      return LOW_SECTION_PERCENT + (positionInSection * MID_SECTION_PERCENT);
    } else {
      // Exponential mapping for high range (10B-10T)
      // Use log scale to map the vast range to the remaining slider space
      const logPosition = Math.log10(paramValue / HIGH_THRESHOLD) / Math.log10(MAX_PARAM_VALUE / HIGH_THRESHOLD);
      return (LOW_SECTION_PERCENT + MID_SECTION_PERCENT) + (logPosition * HIGH_SECTION_PERCENT);
    }
  };

  // Convert from slider position (0-100) to parameter value
  const sliderToParam = (position) => {
    if (position <= LOW_SECTION_PERCENT) {
      // Logarithmic mapping for low range
      const positionRatio = position / LOW_SECTION_PERCENT;
      // Inverse of log function with offset
      return Math.pow(LOW_THRESHOLD + 0.5, positionRatio) - 0.5;
    } else if (position <= (LOW_SECTION_PERCENT + MID_SECTION_PERCENT)) {
      // Linear mapping for middle range
      const positionInSection = (position - LOW_SECTION_PERCENT) / MID_SECTION_PERCENT;
      return LOW_THRESHOLD + (positionInSection * (HIGH_THRESHOLD - LOW_THRESHOLD));
    } else {
      // Exponential mapping for high range
      const positionInSection = (position - (LOW_SECTION_PERCENT + MID_SECTION_PERCENT)) / HIGH_SECTION_PERCENT;
      return HIGH_THRESHOLD * Math.pow(10, positionInSection * Math.log10(MAX_PARAM_VALUE / HIGH_THRESHOLD));
    }
  };

  const handleChange = (e) => {
    const newSliderValue = parseFloat(e.target.value);
    setSliderValue(newSliderValue);
    
    if (isParamSlider) {
      // Convert slider position to actual parameter value
      const actualValue = sliderToParam(newSliderValue);
      
      // Format the value based on size
      let roundedValue;
      if (actualValue < 10) {
        // For small values (< 10B), show one decimal place
        roundedValue = Math.round(actualValue * 10) / 10;
      } else if (actualValue < 100) {
        // For medium values (10-100B), round to integers
        roundedValue = Math.round(actualValue);
      } else if (actualValue < 1000) {
        // For large values (100-1000B), round to nearest 10
        roundedValue = Math.round(actualValue / 10) * 10;
      } else {
        // For very large values (>1000B), round to nearest 100
        roundedValue = Math.round(actualValue / 100) * 100;
      }
      
      onChange(name, roundedValue);
    } else if (isQuantizationSlider) {
      // For quantization, snap to the nearest allowed value
      const quantValue = sliderToQuantization(newSliderValue);
      onChange(name, quantValue);
    } else {
      // Regular linear slider
      onChange(name, parseFloat(e.target.value));
    }
  };

  // For linear sliders or display purposes
  const percentage = isParamSlider || isQuantizationSlider ? sliderValue : ((value - min) / (max - min)) * 100;
  
  // Format display value with unit
  const formatDisplayValue = (val) => {
    if (isParamSlider) {
      if (val >= 1000) {
        return `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}T ${unit}`;
      } else {
        return `${val}${unit}`;
      }
    } else {
      return `${val} ${unit}`;
    }
  };
  
  // Generate tick marks for different slider types
  const renderTicks = () => {
    if (isParamSlider) {
      // Key parameter values to show as ticks
      const tickValues = [0.5, 1, 3, 10, 100, 1000, 10000];
      
      return (
        <div className="relative w-full h-6 mt-1">
          {tickValues.map(tickValue => {
            const tickPosition = paramToSlider(tickValue);
            let tickLabel = tickValue;
            if (tickValue >= 1000) {
              tickLabel = `${tickValue/1000}T`;
            }
            
            return (
              <div key={tickValue} 
                   className="absolute" 
                   style={{ 
                     left: `${tickPosition}%`,
                     transform: 'translateX(-50%)'
                   }}>
                <div className="h-2 w-0.5 bg-gray-500 mb-1 mx-auto"></div>
                <div className="text-xs text-gray-400">{tickLabel}</div>
              </div>
            );
          })}

          {/* Add section dividers to visually separate the three segments */}
          <div className="absolute h-3 w-0.5 bg-gray-600 top-0" 
               style={{ left: `${LOW_SECTION_PERCENT}%` }}></div>
          <div className="absolute h-3 w-0.5 bg-gray-600 top-0" 
               style={{ left: `${LOW_SECTION_PERCENT + MID_SECTION_PERCENT}%` }}></div>
        </div>
      );
    } else if (isQuantizationSlider) {
      // For quantization, show ticks for each allowed value
      return (
        <div className="relative w-full h-6 mt-1">
          {quantizationValues.map((tickValue, index) => {
            // Calculate the exact percentage position for perfect alignment
            const tickPosition = index * (100 / (quantizationValues.length - 1));
            
            // Adjust the tick position to account for thumb width
            return (
              <div key={tickValue} 
                   className="absolute" 
                   style={{ 
                     // Apply transform to center each tick mark with its corresponding value
                     left: `${tickPosition}%`,
                     transform: 'translateX(-50%)'
                   }}>
                <div className="h-2 w-0.5 bg-gray-500 mb-1 mx-auto"></div>
                <div className="text-xs text-gray-400">{tickValue}</div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };
  
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
          {formatDisplayValue(value)}
        </div>
      </div>
      
      <div className="relative mt-1 px-1">
        <input
          type="range"
          id={name}
          name={name}
          min={0}
          max={100}
          step={isQuantizationSlider ? 25 : 0.1}
          value={sliderValue}
          onChange={handleChange}
          onMouseDown={() => setIsActive(true)}
          onMouseUp={() => setIsActive(false)}
          onTouchStart={() => setIsActive(true)}
          onTouchEnd={() => setIsActive(false)}
          className={`
            w-full h-1.5 bg-gray-700/70 rounded-full appearance-none cursor-pointer 
            ${isParamSlider ? 'param-slider' : ''}
            ${isQuantizationSlider ? 'slider-with-steps' : ''}
          `}
          style={{
            background: `linear-gradient(to right, rgb(34, 211, 238) 0%, rgb(6, 182, 212) ${percentage}%, rgb(31, 41, 55) ${percentage}%, rgb(31, 41, 55) 100%)`
          }}
        />
        {isParamSlider || isQuantizationSlider ? (
          renderTicks()
        ) : (
          <div className="flex justify-between mt-2">
            <div className="text-xs text-gray-400">{min}</div>
            <div className="text-xs text-gray-400">{max}</div>
          </div>
        )}
      </div>
      
      {/* Add visual scale labels for Model Size slider */}
      {isParamSlider && (
        <div className="mt-4 flex justify-between px-1 text-xs text-gray-500">
          <div>Logarithmic</div>
          <div>Linear</div>
          <div>Exponential</div>
        </div>
      )}
    </div>
  );
};

export default ParameterSlider;