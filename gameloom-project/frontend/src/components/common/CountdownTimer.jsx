import React, { useState, useEffect } from "react";

const CountdownTimer = ({ releaseDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(releaseDate) - new Date();
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60)
        };
      }
      
      return {
        days: 0,
        hours: 0,
        minutes: 0
      };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [releaseDate]);

  const formatNumber = (num) => {
    if (num === timeLeft.days) {
      return num.toString();
    }
    return num.toString().padStart(2, '0');
  };
  
  const renderDigits = (number, label) => {
    const digits = formatNumber(number).split('');
    
    return (
      <div className="flex flex-col items-center mx-1">
        <div className="flex">
          {digits.map((digit, index) => (
            <div 
              key={`${label}-${index}`} 
              className="flex items-center justify-center w-7 h-9 bg-gray-300/90 border border-gray-400 mx-0.5 rounded-sm text-gray-800 font-mono text-lg font-bold relative overflow-hidden shadow-md"
            >
              <span className="animate-pulse-subtle drop-shadow-sm">{digit}</span>
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent"></div>
            </div>
          ))}
        </div>
        <div className="text-xs uppercase text-white mt-1 text-center font-medium">{label}</div>
      </div>
    );
  };

  const renderColon = () => {
    return (
      <div className="flex flex-col items-center mx-0.5">
        <div className="flex items-center justify-center h-9">
          <div className="text-gray-400 font-bold text-2xl">:</div>
        </div>
        <div className="text-xs mt-1 opacity-0">.</div>
      </div>
    );
  };

  return (
    <div className="flex items-end justify-center drop-shadow-lg">
      {renderDigits(timeLeft.days, "Days")}
      {renderColon()}
      {renderDigits(timeLeft.hours, "Hrs")}
      {renderColon()}
      {renderDigits(timeLeft.minutes, "Min")}
    </div>
  );
};

export default CountdownTimer; 