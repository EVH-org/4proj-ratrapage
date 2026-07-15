import React from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function StepRow({ i, step, chg, del }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
      <div style={{ flex: '0 0 30px', textAlign: 'center', paddingBottom: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
        {i + 1}
      </div>
      <div style={{ flex: 1 }}>
        <Input label={i === 0 ? 'Instruction' : ''} placeholder="Melanger la farine et les oeufs..."
          value={step.instruction} onChange={(e) => chg(i, 'instruction', e.target.value)} />
      </div>
      <Button type="button" variant="ghost" onClick={() => del(i)}
        style={{ marginBottom: i === 0 ? '0.25rem' : '0', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>X</Button>
    </div>
  );
}