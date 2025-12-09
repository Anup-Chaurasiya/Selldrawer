/**
 * Shared Savings Display Component
 * Used in both production cart drawer and Remix preview
 */

import React from 'react';

interface SavingsDisplayProps {
  message: string;
  amount: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

export const SavingsDisplay: React.FC<SavingsDisplayProps> = ({
  message,
  amount,
  backgroundColor = '#dcfce7',
  textColor = '#15803d',
  borderColor = '#ffffff',
}) => {
  if (amount <= 0) {
    return null;
  }

  // Format money (amount is in cents)
  const formatMoney = (cents: number) => {
    const rupees = Math.floor(cents / 100);
    return `₹${rupees}`;
  };

  const formattedMessage = message.replace('{amount}', formatMoney(amount));

  return (
    <div style={{
      backgroundColor: backgroundColor,
      color: textColor,
      padding: '12px 16px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center',
      border: `2px solid ${borderColor}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    }}>
      {formattedMessage}
    </div>
  );
};

