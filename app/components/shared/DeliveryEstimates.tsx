import React from 'react';

interface DeliveryEstimatesProps {
  processingDaysMin?: number;
  processingDaysMax?: number;
  transitDaysMin?: number;
  transitDaysMax?: number;
  message?: string;
}

export const DeliveryEstimates: React.FC<DeliveryEstimatesProps> = ({
  processingDaysMin = 1,
  processingDaysMax = 2,
  transitDaysMin = 3,
  transitDaysMax = 5,
  message = 'Estimated delivery: {date}'
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateRange = () => {
    const today = new Date();
    
    const minArrival = new Date(today);
    minArrival.setDate(today.getDate() + processingDaysMin + transitDaysMin);
    
    const maxArrival = new Date(today);
    maxArrival.setDate(today.getDate() + processingDaysMax + transitDaysMax);
    
    if (minArrival.toDateString() === maxArrival.toDateString()) {
      return formatDate(minArrival);
    }
    
    return `${formatDate(minArrival)} - ${formatDate(maxArrival)}`;
  };

  const range = calculateRange();
  const formattedMessage = message.replace('{date}', range);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      padding: '10px 14px',
      backgroundColor: '#eff6ff',
      borderRadius: '8px',
      border: '1px solid #bfdbfe',
      fontSize: '13px',
      color: '#1e40af',
      fontWeight: 500,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
      <span>{formattedMessage}</span>
    </div>
  );
};
