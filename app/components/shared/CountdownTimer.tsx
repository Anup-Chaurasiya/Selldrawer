import React, { useState, useEffect } from 'react';

interface CountdownTimerConfig {
  isActive?: boolean;
  durationMinutes?: number;
  messageText?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface CountdownTimerProps {
  config: CountdownTimerConfig;
  cartKey?: string; // Used to reset timer if cart is emptied/changed sometimes, if desired
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ config, cartKey }) => {
  if (!config || config.isActive === false) return null;

  const {
    durationMinutes = 15,
    messageText = "Your reserves expire in {time}",
    backgroundColor = "#FEF2F2",
    textColor = "#991B1B"
  } = config;

  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    // Reset timer when cartKey changes or component mounts
    let initialTime = durationMinutes * 60;
    
    // Optional: read from sessionStorage to persist across page loads
    const storedTime = sessionStorage.getItem('selldrawer_timer');
    const storedTimestamp = sessionStorage.getItem('selldrawer_timer_timestamp');
    
    if (storedTime && storedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(storedTimestamp, 10)) / 1000);
      initialTime = Math.max(0, parseInt(storedTime, 10) - elapsed);
    }
    
    setTimeLeft(initialTime);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        sessionStorage.setItem('selldrawer_timer', next.toString());
        sessionStorage.setItem('selldrawer_timer_timestamp', Date.now().toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [durationMinutes, cartKey]);

  if (timeLeft <= 0) return null; // Hide or show "Expired"

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const formattedMessage = messageText.replace('{time}', timeString);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 16px',
      backgroundColor: backgroundColor,
      color: textColor,
      borderRadius: '8px',
      marginBottom: '12px',
      fontSize: '13px',
      fontWeight: '600',
      textAlign: 'center',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
    }}>
      <svg className="selldrawer-pulse" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>{formattedMessage}</span>
    </div>
  );
};
