import React, { useState, useEffect, useCallback } from 'react';

// Countdown hook
function useCountdown(targetDate) {
    const calculateTimeLeft = useCallback(() => {
        // If invalid date, return 0
        if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        // Ensure date object
        const target = new Date(targetDate);
        const difference = target.getTime() - new Date().getTime();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    // Return zeros during SSR to match initial client render or handle hydration
    if (!isClient) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return timeLeft;
}

// Countdown unit component
function CountdownUnit({ value, label }) {
    return (
        <div className="flex flex-col items-center">
            <span
                className="font-mono text-3xl md:text-5xl text-[var(--text-primary)] tabular-nums tracking-wide font-bold"
                aria-label={`${value} ${label}`}
            >
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs md:text-sm uppercase tracking-widest text-light/50 mt-1 font-medium">
                {label}
            </span>
        </div>
    );
}

const CountdownText = ({ targetDate }) => {
    const countdown = useCountdown(targetDate);

    return (
        <div className="flex gap-4 md:gap-8 items-start">
            <CountdownUnit value={countdown.days} label="Days" />
            <span className="text-3xl md:text-5xl text-light/30 font-light mt-1">:</span>
            <CountdownUnit value={countdown.hours} label="Hours" />
            <span className="text-3xl md:text-5xl text-light/30 font-light mt-1">:</span>
            <CountdownUnit value={countdown.minutes} label="Min" />
            <span className="text-3xl md:text-5xl text-light/30 font-light mt-1">:</span>
            <CountdownUnit value={countdown.seconds} label="Sec" />
        </div>
    );
};

export default CountdownText;
