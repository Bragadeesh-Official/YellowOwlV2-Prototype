import React from 'react';

interface StepperProps {
  steps: string[];
  current: number;
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 36 }}>
      {steps.map((label, idx) => (
        <React.Fragment key={idx}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: '50%', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: idx < current ? '#1e293b' : idx === current ? '#2AD5B4' : 'transparent',
                color: idx <= current ? '#ffffff' : '#94a3b8',
                border: idx > current ? '2px solid #e2e8f0' : 'none',
              }}
            >
              {idx < current ? '✓' : idx + 1}
            </div>
            <span
              style={{
                fontSize: 11, marginTop: 6,
                fontWeight: idx === current ? 700 : 400,
                color: idx === current ? '#1e293b' : idx < current ? '#475569' : '#94a3b8',
                textAlign: 'center',
                maxWidth: 90,
                lineHeight: 1.3,
              }}
            >
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              style={{
                flex: 1, height: 2, marginTop: 16, marginLeft: 8, marginRight: 8,
                background: idx < current ? '#1e293b' : '#e2e8f0',
                minWidth: 20,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
