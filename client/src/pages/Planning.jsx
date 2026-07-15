import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, getToken } from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function monday(d) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function fmtDay(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

const SLOTS = [
  { key: 'midi', label: 'Midi' },
  { key: 'soir', label: 'Soir' },
];

export default function Planning() {
  const [weekStart, setWeekStart] = useState(() => monday(new Date()));
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [shoppingBusy, setShoppingBusy] = useState(false);
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('supmeal_shopping_checked') || '{}'); } catch { return {}; }
  });
  const [picking, setPicking] = useState(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeOptions, setRecipeOptions] = useState([]);
  const [recipeSearchBusy, setRecipeSearchBusy] = useState(false);

  const weekEnd = addDays(weekStart, 6);

  const loadEntries = useCallback(() => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setErr(null);
    apiFetch(`/planning?start=${fmt(weekStart)}&end=${fmt(weekEnd)}`)
      .then(setEntries)
      .catch((e) => setErr(e.message || 'Erreur de chargement.'))
      .finally(() => setBusy(false));
  }, [weekStart, weekEnd]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const loadShopping = () => {
    setShoppingBusy(true);
    apiFetch(`/planning/shopping-list?start=${fmt(weekStart)}&end=${fmt(weekEnd)}`)
      .then(setShoppingItems)
      .catch(() => {})
      .finally(() => setShoppingBusy(false));
  };

  const toggleShopping = () => {
    const next = !showShopping;
    setShowShopping(next);
    if (next) loadShopping();
  };

  const toggleCheck = (key) => {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('supmeal_shopping_checked', JSON.stringify(next));
      return next;
    });
  };

  const openPicker = (day, slot) => {
    setPicking({ day, slot });
    setRecipeSearch('');
    setRecipeOptions([]);
  };

  const searchRecipes = async (q) => {
    if (!q.trim()) { setRecipeOptions([]); return; }
    setRecipeSearchBusy(true);
    try {
      const data = await apiFetch(`/recipes/search?q=${encodeURIComponent(q)}&page_size=10`);
      setRecipeOptions(data);
    } catch { setRecipeOptions([]); }
    finally { setRecipeSearchBusy(false); }
  };

  const pickRecipe = async (recipeId) => {
    if (!picking) return;
    try {
      await apiFetch('/planning', {
        method: 'POST',
        body: { date: fmt(picking.day), slot: picking.slot, recipe_id: recipeId },
      });
      setPicking(null);
      loadEntries();
    } catch (e) {
      alert(e.message || 'Erreur.');
    }
  };

  const removeEntry = async (entryId) => {
    if (!window.confirm('Supprimer cette entrée du planning ?')) return;
    try {
      await apiFetch(`/planning/${entryId}`, { method: 'DELETE' });
      loadEntries();
    } catch (e) {
      alert(e.message || 'Erreur.');
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const entryMap = {};
  for (const e of entries) {
    const k = `${e.date}_${e.slot}`;
    entryMap[k] = e;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ color: 'var(--color-text-primary)', margin: 0 }}>Planning</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            Semaine précédente
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Semaine suivante
          </Button>
          <Button variant={showShopping ? 'primary' : 'secondary'} onClick={toggleShopping}>
            {showShopping ? 'Masquer la liste' : 'Liste de courses'}
          </Button>
        </div>
      </div>

      <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
        {fmtDay(weekStart)} — {fmtDay(weekEnd)}
      </p>

      {busy && <p style={{ textAlign: 'center' }}>Chargement...</p>}
      {err && <p style={{ color: 'var(--color-border-error)', textAlign: 'center' }}>{err}</p>}

      {!busy && !err && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '700px',
          }}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}></th>
                {days.map((d) => (
                  <th key={fmt(d)} style={{
                    padding: '8px',
                    textAlign: 'center',
                    color: 'var(--color-text-primary)',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                    borderBottom: '2px solid var(--color-border-subtle)',
                  }}>
                    {fmtDay(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot.key}>
                  <td style={{
                    padding: '12px 8px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                  }}>
                    {slot.label}
                  </td>
                  {days.map((d) => {
                    const key = `${fmt(d)}_${slot.key}`;
                    const entry = entryMap[key];
                    return (
                      <td key={key} style={{
                        padding: '4px',
                        textAlign: 'center',
                        verticalAlign: 'top',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        minWidth: '100px',
                      }}>
                        {entry ? (
                          <Card style={{
                            padding: '8px',
                            margin: '0',
                            textAlign: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                          }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                              {entry.recipe_title || 'Recette'}
                            </div>
                            <Button
                              variant="ghost"
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                padding: '2px 8px',
                                color: 'var(--color-border-error)',
                              }}
                              onClick={() => removeEntry(entry.id)}
                            >
                              Retirer
                            </Button>
                          </Card>
                        ) : (
                          <Button
                            variant="ghost"
                            style={{
                              padding: '8px',
                              fontSize: 'var(--font-size-xs)',
                              width: '100%',
                            }}
                            onClick={() => openPicker(d, slot.key)}
                          >
                            + Ajouter
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {picking && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }} onClick={() => setPicking(null)}>
          <Card style={{
            width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto',
            padding: '24px',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '16px' }}>
              Ajouter une recette — {fmtDay(picking.day)} ({picking.slot === 'midi' ? 'Midi' : 'Soir'})
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <input
                className="ui-form-input"
                placeholder="Rechercher une recette..."
                value={recipeSearch}
                onChange={(e) => {
                  setRecipeSearch(e.target.value);
                  searchRecipes(e.target.value);
                }}
                autoFocus
              />
            </div>
            {recipeSearchBusy && <p style={{ textAlign: 'center' }}>Recherche...</p>}
            {recipeOptions.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  transition: 'background 0.15s',
                }}
                onClick={() => pickRecipe(r.id)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.title}</div>
                {r.description && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{r.description}</div>}
              </div>
            ))}
            {!recipeSearchBusy && recipeSearch && recipeOptions.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Aucune recette trouvée.</p>
            )}
          </Card>
        </div>
      )}

      {showShopping && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '16px' }}>Liste de courses</h2>
          {shoppingBusy && <p>Chargement...</p>}
          {!shoppingBusy && shoppingItems.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>Aucun ingrédient dans la liste.</p>
          )}
          {!shoppingBusy && shoppingItems.length > 0 && (
            <Card style={{ padding: 'var(--space-lg)', maxWidth: '500px' }}>
              {shoppingItems.map((item, idx) => {
                const ck = `${item.name}_${item.unit || 'none'}`;
                return (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      cursor: 'pointer',
                      textDecoration: checked[ck] ? 'line-through' : 'none',
                      opacity: checked[ck] ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!checked[ck]}
                      onChange={() => toggleCheck(ck)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: 'var(--color-text-primary)' }}>
                      {item.name}
                      {item.quantity != null && ` — ${item.quantity} ${item.unit || ''}`}
                    </span>
                  </label>
                );
              })}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}