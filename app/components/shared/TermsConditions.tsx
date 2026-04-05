import React from 'react';

interface TermsConditionsProps {
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
  text?: string;
}

export const TermsConditions: React.FC<TermsConditionsProps> = ({
  isChecked,
  onToggle,
  text = 'I agree to the Terms & Conditions'
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        padding: '8px 12px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        fontSize: '13px',
        color: '#374151',
        cursor: 'pointer',
      }}
      onClick={() => onToggle(!isChecked)}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onToggle(e.target.checked)}
        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        onClick={(e) => e.stopPropagation()}
      />
      <span style={{ fontWeight: 500 }}>
        {/* Render simple text, but could support dangerouslySetInnerHTML for links */}
        <span dangerouslySetInnerHTML={{ __html: text }} />
      </span>
    </div>
  );
};
