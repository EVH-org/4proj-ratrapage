import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, getToken } from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ChevronLeft, ChevronRight, ShoppingBasket, Plus, X, Trash2 } from 'lucide-react';

function monday(d) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d);
  r.setDate(r.getDate() + diff);
  return r;
}

function addDays(date, n) {
  const r = new Date(date);
  r.setDate(r.getDate() + n);
  return r;
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function same(d1, d2) {
  return fmt(d1) === fmt(d2);
}

const SLOTS = ['midi', 'soir'];

export default function Planning() {
  const [weekStart, setWeekStart] = useState(() => monday(new Date()));
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(true);
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [shoppingBusy, setShoppingBusy] = useState(false);
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('supmeal_shopping_checked') || '{}'); } catch { return {}; }
  });

  const [editingCell, setEditingCell] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const startStr = fmt(weekStart);
  const endStr = fmt(weekEnd);

  useEffect(() => {
    if (!getToken()) return;
    setBusy(true);
    apiFetch(`/planning?start=${startStr}&end=${endStr}`)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [startStr, endStr]);

  const toggleShopping = () => {
    if (!showShopping) {
      setShoppingBusy(true);
      apiFetch(`/planning/shopping-list?start=${startStr}&end=${endStr}`)
        .then(setShoppingItems)
        .catch(() => {})
        .finally(() => setShoppingBusy(false));
    }
    setShowShopping(!showShopping);
  };

  const toggleCheck = (key) => {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('supmeal_shopping_checked', JSON.stringify(next));
      return next;
    });
  };

  const doSearch = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchBusy(true);
    try {
      const data = await apiFetch(`/recipes/search?q=${encodeURIComponent(q.trim())}&page_size=8`);
      setSearchResults(data);
    } catch { setSearchResults([]); }
    finally { setSearchBusy(false); }
  };

  const addToSlot = async (recipeId) => {
    if (!editingCell) return;
    try {
      await apiFetch('/planning', {
        method: 'POST',
        body: { date: fmt(editingCell.day), slot: editingCell.slot, recipe_id: recipeId },
      });
      setEditingCell(null);
      setSearchQ('');
      setSearchResults([]);
      setBusy(true);
      const data = await apiFetch(`/planning?start=${startStr}&end=${endStr}`);
      setEntries(data);
      setBusy(false);
    } catch (e) {
      alert(e.message || 'Erreur');
    }
  };

  const removeEntry = async (entryId) => {
    if (!window.confirm('Supprimer cette entrée ?')) return;
    await apiFetch(`/planning/${entryId}`, { method: 'DELETE' });
    setBusy(true);
    const data = await apiFetch(`/planning?start=${startStr}&end=${endStr}`);
    setEntries(data);
    setBusy(false);
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const entryMap = {};
  for (const e of entries) {
    entryMap[`${e.date}_${e.slot}`] = e;
  }

  const isToday = (d) => same(d, new Date());

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: 'var(--color-text-primary)', margin: '0 0 4px', fontSize: 'var(--font-size-2xl)' }}>Planning</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
            {fmt(weekStart)} — {fmt(weekEnd)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft size={16} /> Préc.
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Suiv. <ChevronRight size={16} />
          </Button>
          <Button variant={showShopping ? 'primary' : 'secondary'} onClick={toggleShopping}>
            <ShoppingBasket size={16} style={{ marginRight: 6 }} />
            Courses
          </Button>
        </div>
      </div>

      {busy && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>Chargement...</p>}

      {!busy && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4, minWidth: 750 }}>
            <thead>
              <tr>
                <th style={{ width: 60 }} />
                {days.map((d) => (
                  <th key={fmt(d)} style={{
                    padding: '8px 4px', textAlign: 'center', fontWeight: 600,
                    fontSize: 'var(--font-size-xs)', borderRadius: 'var(--radius-md)',
                    background: isToday(d) ? 'var(--color-primary-light)' : 'transparent',
                    color: isToday(d) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}>
                    <div style={{ textTransform: 'capitalize' }}>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot}>
                  <td style={{
                    fontWeight: 600, fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-primary)', textAlign: 'right',
                    padding: '0 8px 0 0', verticalAlign: 'middle',
                  }}>
                    {slot === 'midi' ? 'Midi' : 'Soir'}
                  </td>
                  {days.map((d) => {
                    const key = `${fmt(d)}_${slot}`;
                    const entry = entryMap[key];
                    const isEditing = editingCell && fmt(editingCell.day) === fmt(d) && editingCell.slot === slot;

                    if (isEditing) {
                      return (
                        <td key={key} style={{ padding: 2, verticalAlign: 'top' }}>
                          <Card style={{ padding: 8, margin: 0 }}>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                              <input
                                className="ui-form-input"
                                placeholder="Recette..."
                                value={searchQ}
                                onChange={(e) => { setSearchQ(e.target.value); doSearch(e.target.value); }}
                                autoFocus
                                style={{ flex: 1, padding: '4px 8px', fontSize: 'var(--font-size-xs)' }}
                              />
                              <button
                                onClick={() => { setEditingCell(null); setSearchQ(''); setSearchResults([]); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                            {searchBusy && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>...</p>}
                            {searchResults.map((r) => (
                              <div
                                key={r.id}
                                onClick={() => addToSlot(r.id)}
                                style={{
                                  padding: '6px 8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                                  fontSize: 'var(--font-size-xs)', borderBottom: '1px solid var(--color-border-subtle)',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-light)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                {r.title}
                              </div>
                            ))}
                            {!searchBusy && searchQ && searchResults.length === 0 && (
                              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center', padding: 8 }}>Aucun résultat</p>
                            )}
                          </Card>
                        </td>
                      );
                    }

                    if (entry) {
                      return (
                        <td key={key} style={{ padding: 2, verticalAlign: 'top' }}>
                          <Card style={{
                            padding: '8px 10px', margin: 0, minHeight: 48, fontSize: 'var(--font-size-sm)',
                            background: isToday(d) ? 'var(--color-primary-light)' : undefined,
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{entry.recipe_title}</div>
                            <button
                              onClick={() => removeEntry(entry.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: 3 }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-border-error)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                            >
                              <Trash2 size={11} /> Retirer
                            </button>
                          </Card>
                        </td>
                      );
                    }

                    return (
                      <td key={key} style={{ padding: 2, verticalAlign: 'top' }}>
                        <button
                          onClick={() => setEditingCell({ day: d, slot })}
                          style={{
                            width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 4, border: '1px dashed var(--color-border-subtle)', borderRadius: 'var(--radius-md)',
                            background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          <Plus size={14} /> Ajouter
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showShopping && (
        <Card style={{ marginTop: 32, padding: 'var(--space-xl)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 'var(--font-size-xl)' }}>
            <ShoppingBasket size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Liste de courses
          </h2>
          {shoppingBusy && <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>}
          {!shoppingBusy && shoppingItems.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>Aucun ingrédient.</p>
          )}
          {!shoppingBusy && shoppingItems.map((item, idx) => {
            const ck = `${item.name}_${item.unit || 'none'}`;
            return (
              <label key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer',
                opacity: checked[ck] ? 0.4 : 1,
              }}>
                <input type="checkbox" checked={!!checked[ck]} onChange={() => toggleCheck(ck)}
                  style={{ cursor: 'pointer', width: 18, height: 18, accentColor: 'var(--color-accent-fresh)' }} />
                <span style={{ color: 'var(--color-text-primary)', textDecoration: checked[ck] ? 'line-through' : 'none' }}>
                  {item.name}
                  {item.quantity != null && <span style={{ color: 'var(--color-text-muted)' }}> — {item.quantity} {item.unit || ''}</span>}
                </span>
              </label>
            );
          })}
        </Card>
      )}
    </div>
  );
}