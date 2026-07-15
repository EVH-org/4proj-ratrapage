import React from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function IngredientRow({ i, ing, chg, del }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 120px' }}>
        <Input label={i === 0 ? 'Ingredient' : ''} placeholder="Farine"
          value={ing.name} onChange={(e) => chg(i, 'name', e.target.value)} />
      </div>
      <div style={{ flex: '0 0 70px' }}>
        <Input label={i === 0 ? 'Quantite' : ''} placeholder="200" type="number"
          value={ing.quantity ?? ''} onChange={(e) => chg(i, 'quantity', e.target.value ? parseFloat(e.target.value) : null)} />
      </div>
      <div style={{ flex: '0 0 70px' }}>
        <Input label={i === 0 ? 'Unite' : ''} placeholder="g"
          value={ing.unit ?? ''} onChange={(e) => chg(i, 'unit', e.target.value)} />
      </div>
      <div style={{ flex: '1 1 100px' }}>
        <Input label={i === 0 ? 'Note' : ''} placeholder="optionnel"
          value={ing.note ?? ''} onChange={(e) => chg(i, 'note', e.target.value)} />
      </div>
      <Button type="button" variant="ghost" onClick={() => del(i)}
        style={{ marginBottom: i === 0 ? '0.25rem' : '0', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>X</Button>
    </div>
  );
}