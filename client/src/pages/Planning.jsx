import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, getToken } from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ChevronLeft, ChevronRight, ShoppingBasket, Plus, Trash2 } from 'lucide-react';

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

function fmtDayShort(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

const SLOTS = [
  { key: 'midi', label: 'Midi', emoji: '☀️' },
  { key: 'soir', label: 'Soir', emoji: '🌙' },
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
  const [refresh, setRefresh] = useState(0);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const start = fmt(weekStart);
    const end = fmt(addDays(weekStart, 6));
    apiFetch(`/planning?start=${start}&end=${end}`)
      .then(setEntries)
      .catch((e) => setErr(e.message || 'Erreur de chargement.'))
      .finally(() => setBusy(false));
  }, [weekStart, refresh]);

  const loadShopping = () => {
    setShoppingBusy(true);
    const start = fmt(weekStart);
    const end = fmt(addDays(weekStart, 6));
    apiFetch(`/planning/shopping-list?start=${start}&end=${end}`)
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
      setRefresh((r) => r + 1);
    } catch (e) {
      alert(e.message || 'Erreur.');
    }
  };

  const removeEntry = async (entryId) => {
    if (!window.confirm('Supprimer cette entrée du planning ?')) return;
    try {
      await apiFetch(`/planning/${entryId}`, { method: 'DELETE' });
      setRefresh((r) => r + 1);
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

  const isToday = (d) => {
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: 'var(--color-text-primary)', margin: '0 0 4px 0', fontSize: 'var(--font-size-2xl)' }}>Planning</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
            {fmt(weekStart)} — {fmt(weekEnd)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft size={16} style={{ marginRight: '4px' }} />Précédente
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Suivante<ChevronRight size={16} style={{ marginLeft: '4px' }} />
          </Button>
          <Button variant={showShopping ? 'primary' : 'secondary'} onClick={toggleShopping}>
            <ShoppingBasket size={16} style={{ marginRight: '6px' }} />
            Liste de courses
          </Button>
        </div>
      </div>

      {busy && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0' }}>Chargement...</p>}
      {err && <p style={{ color: 'var(--color-border-error)', textAlign: 'center' }}>{err}</p>}

      {!busy && !err && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '6px',
            minWidth: '750px',
          }}>
            <thead>
              <tr>
                <th style={{ width: '70px' }}></th>
                {days.map((d) => (
                  <th key={fmt(d)} style={{
                    padding: '10px 8px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                    color: isToday(d) ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    background: isToday(d) ? 'var(--color-primary-light)' : 'transparent',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-lg)' }}>{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot.key}>
                  <td style={{
                    padding: '6px 8px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    textAlign: 'right',
                    fontSize: 'var(--font-size-sm)',
                    verticalAlign: 'middle',
                  }}>
                    {slot.label}
                  </td>
                  {days.map((d) => {
                    const key = `${fmt(d)}_${slot.key}`;
                    const entry = entryMap[key];
                    return (
                      <td key={key} style={{
                        padding: 0,
                        textAlign: 'center',
                        verticalAlign: 'top',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        {entry ? (
                          <Card style={{
                            padding: '10px',
                            margin: 0,
                            textAlign: 'left',
                            background: isToday(d) ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                            border: `1px solid ${isToday(d) ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                            minHeight: '64px',
                          }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                              {entry.recipe_title || 'Recette'}
                            </div>
                            <button
                              onClick={() => removeEntry(entry.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: 'var(--font-size-xs)',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-border-error)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                            >
                              <Trash2 size={12} />Retirer
                            </button>
                          </Card>
                        ) : (
                          <button
                            onClick={() => openPicker(d, slot.key)}
                            style={{
                              width: '100%',
                              minHeight: '64px',
                              border: `1px dashed ${isToday(d) ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                              borderRadius: 'var(--radius-md)',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--color-text-muted)',
                              fontSize: 'var(--font-size-xs)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-primary)';
                              e.currentTarget.style.color = 'var(--color-primary)';
                              e.currentTarget.style.background = 'var(--color-primary-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = isToday(d) ? 'var(--color-primary)' : 'var(--color-border-subtle)';
                              e.currentTarget.style.color = 'var(--color-text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Plus size={16} />
                            Ajouter
                          </button>
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }} onClick={() => setPicking(null)}>
          <Card style={{
            width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto',
            padding: '24px',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '4px', fontSize: 'var(--font-size-lg)' }}>
              Ajouter une recette
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px', fontSize: 'var(--font-size-sm)' }}>
              {fmtDay(picking.day)} — {picking.slot === 'midi' ? 'Midi' : 'Soir'}
            </p>
            <div style={{ marginBottom: '12px' }}>
              <Input
                placeholder="Rechercher une recette..."
                value={recipeSearch}
                onChange={(e) => {
                  setRecipeSearch(e.target.value);
                  searchRecipes(e.target.value);
                }}
              />
            </div>
            {recipeSearchBusy && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Recherche...</p>}
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {recipeOptions.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    transition: 'background 0.15s',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  onClick={() => pickRecipe(r.id)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>{r.title}</div>
                  {r.description && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {r.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!recipeSearchBusy && recipeSearch && recipeOptions.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                Aucune recette trouvée.
              </p>
            )}
          </Card>
        </div>
      )}

      {showShopping && (
        <Card style={{ marginTop: '32px', padding: 'var(--space-xl)' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '16px', fontSize: 'var(--font-size-xl)' }}>
            <ShoppingBasket size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Liste de courses
          </h2>
          {shoppingBusy && <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>}
          {!shoppingBusy && shoppingItems.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>Aucun ingrédient dans la liste.</p>
          )}
          {!shoppingBusy && shoppingItems.length > 0 && (
            <div style={{ maxWidth: '500px' }}>
              {shoppingItems.map((item, idx) => {
                const ck = `${item.name}_${item.unit || 'none'}`;
                return (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      cursor: 'pointer',
                      opacity: checked[ck] ? 0.4 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!checked[ck]}
                      onChange={() => toggleCheck(ck)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-accent-fresh)' }}
                    />
                    <span style={{
                      color: 'var(--color-text-primary)',
                      textDecoration: checked[ck] ? 'line-through' : 'none',
                    }}>
                      {item.name}
                      {item.quantity != null && (
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          {' '}— {item.quantity} {item.unit || ''}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}