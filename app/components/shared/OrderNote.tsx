import React, { useState, useEffect, useRef } from 'react';

interface OrderNoteProps {
  initialNote?: string;
  placeholder?: string;
  onSave: (note: string) => void;
  debounceMs?: number;
}

export const OrderNote: React.FC<OrderNoteProps> = ({
  initialNote = '',
  placeholder = 'Add a note to your order...',
  onSave,
  debounceMs = 1000
}) => {
  const [note, setNote] = useState(initialNote);
  const [isExpanded, setIsExpanded] = useState(initialNote.length > 0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setNote(newVal);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(newVal);
    }, debounceMs);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#4b5563',
          fontSize: '13px',
          fontWeight: 600,
          padding: 0,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        {isExpanded ? 'Hide order note' : 'Add order note'}
      </button>

      {isExpanded && (
        <div style={{ marginTop: '8px' }}>
          <textarea
            value={note}
            onChange={handleChange}
            placeholder={placeholder}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
      )}
    </div>
  );
};
