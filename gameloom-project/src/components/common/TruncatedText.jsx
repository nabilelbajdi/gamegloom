import React, { useRef, useState, useEffect } from 'react';

const TruncatedText = ({ children, className = "" }) => {
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [tooltipText, setTooltipText] = useState("");

  useEffect(() => {
    const checkOverflow = () => {
      const element = textRef.current;
      if (element) {
        const isTextOverflowing = element.scrollWidth > element.clientWidth;
        setIsOverflowing(isTextOverflowing);
        
        if (isTextOverflowing) {
          const text = element.textContent || element.innerText;
          setTooltipText(text);
        } else {
          setTooltipText("");
        }
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div 
      ref={textRef} 
      className={`truncate ${className}`}
      title={isOverflowing ? tooltipText : undefined}
    >
      {children}
    </div>
  );
};

export default TruncatedText; 