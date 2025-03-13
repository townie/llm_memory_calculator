import { useState } from 'react';

const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)} // For mobile support
      >
        {children}
      </div>

      {isVisible && (
        <div className="absolute z-10 bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 text-sm w-64 bg-black bg-opacity-90 text-white rounded-lg shadow-lg pointer-events-none">
          <div className="relative">
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-black border-opacity-90"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
