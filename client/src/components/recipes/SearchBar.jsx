import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../lib/api';
import Tag from '../ui/Tag';
import Button from '../ui/Button';

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState('');
  const [tags, setTags] = useState([]);
  const [pm, setPm] = useState('');
  const [pM, setPM] = useState('');
  const [cm, setCm] = useState('');
  const [cM, setCM] = useState('');
  const [sort, setSort] = useState('created_at');
  const [dir, setDir] = useState('desc');
  const [exp, setExp] = useState(false);

  const [allTags, setAllTags] = useState([]);
  const [inp, setInp] = useState('');
  const [show, setShow] = useState(false);
  const tip = useRef(null);

  const [qSlow, setQSlow] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setQSlow(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    apiFetch('/tags')
      .then((data) => setAllTags((data || []).map((t) => t.label)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (qSlow.trim()) p.set('q', qSlow.trim());
    if (tags.length > 0) p.set('tags', tags.join(','));
    if (pm) p.set('prep_time_min', pm);
    if (pM) p.set('prep_time_max', pM);
    if (cm) p.set('cook_time_min', cm);
    if (cM) p.set('cook_time_max', cM);
    p.set('sort_by', sort);
    p.set('sort_order', dir);
    onSearch('/recipes/search?' + p.toString());
  }, [qSlow, tags, pm, pM, cm, cM, sort, dir]);

  const sug = !show || !inp.trim() ? [] : allTags
    .filter((t) => t.toLowerCase().includes(inp.trim().toLowerCase()))
    .filter((t) => !tags.includes(t))
    .slice(0, 6);

  const add = (label) => {
    const c = label.trim().toLowerCase();
    if (!c || tags.length >= 10) return;
    if (!tags.includes(c)) setTags([...tags, c]);
    setInp('');
    setShow(false);
  };

  const rem = (label) => setTags(tags.filter((t) => t !== label));

  const dirty = q || tags.length > 0 || pm || pM || cm || cM;

  const raz = () => {
    setQ('');
    setTags([]);
    setPm('');
    setPM('');
    setCm('');
    setCM('');
    setSort('created_at');
    setDir('desc');
    setExp(false);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '200px' }}>
          <input
            className="ui-form-input"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une recette..."
            style={{ paddingRight: '36px' }}
          />
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', fontSize: '1.1rem' }}>
            &#128269;
          </span>
        </div>

        <Button
          variant="secondary"
          onClick={() => setExp(!exp)}
          style={{ padding: '10px 16px', fontSize: 'var(--font-size-sm)' }}
        >
          {exp ? 'Filtres ▲' : 'Filtres ▼'}
        </Button>

        {dirty && (
          <Button
            variant="ghost"
            onClick={raz}
            style={{ padding: '10px 16px', fontSize: 'var(--font-size-sm)', color: 'var(--color-border-error)' }}
          >
            Effacer
          </Button>
        )}
      </div>

      {exp && (
        <div style={{ marginTop: '12px', padding: '16px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="ui-form-group" style={{ position: 'relative' }}>
              <label className="ui-form-label">Tags</label>
              <div
                className="ui-form-input"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', minHeight: '2.75rem', cursor: 'text' }}
                onClick={() => tip.current?.focus()}
              >
                {tags.map((t) => (
                  <Tag key={t} variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {t}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); rem(t); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontWeight: 700, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </Tag>
                ))}
                <input
                  ref={tip}
                  type="text"
                  value={inp}
                  onChange={(e) => setInp(e.target.value)}
                  onFocus={() => setShow(true)}
                  onBlur={() => setTimeout(() => setShow(false), 150)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(inp); } }}
                  placeholder={tags.length === 0 ? 'filtrer par tag...' : ''}
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: '1 1 80px', minWidth: '60px', color: 'var(--color-text-primary)' }}
                />
              </div>
              {sug.length > 0 && (
                <ul style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  maxHeight: '160px', overflowY: 'auto', listStyle: 'none', padding: '4px 0', margin: '4px 0 0',
                }}>
                  {sug.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onMouseDown={() => add(s)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ui-form-group">
              <label className="ui-form-label">Temps préparation (min)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input className="ui-form-input" type="number" min="0" value={pm} onChange={(e) => setPm(e.target.value)} placeholder="Min" style={{ flex: 1 }} />
                <span style={{ color: 'var(--color-text-muted)' }}>à</span>
                <input className="ui-form-input" type="number" min="0" value={pM} onChange={(e) => setPM(e.target.value)} placeholder="Max" style={{ flex: 1 }} />
              </div>
            </div>

            <div className="ui-form-group">
              <label className="ui-form-label">Temps cuisson (min)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input className="ui-form-input" type="number" min="0" value={cm} onChange={(e) => setCm(e.target.value)} placeholder="Min" style={{ flex: 1 }} />
                <span style={{ color: 'var(--color-text-muted)' }}>à</span>
                <input className="ui-form-input" type="number" min="0" value={cM} onChange={(e) => setCM(e.target.value)} placeholder="Max" style={{ flex: 1 }} />
              </div>
            </div>

            <div className="ui-form-group">
              <label className="ui-form-label">Trier par</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="ui-form-input"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="created_at">Date</option>
                  <option value="title">Titre</option>
                  <option value="prep_time">Temps prep.</option>
                  <option value="cook_time">Temps cuisson</option>
                </select>
                <select
                  className="ui-form-input"
                  value={dir}
                  onChange={(e) => setDir(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="desc">Décroissant</option>
                  <option value="asc">Croissant</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {dirty && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {qSlow.trim() && (
            <Tag variant="primary" style={{ cursor: 'pointer' }} onClick={() => setQ('')}>
              "{qSlow.trim()}" ×
            </Tag>
          )}
          {tags.map((t) => (
            <Tag key={t} variant="secondary" style={{ cursor: 'pointer' }} onClick={() => rem(t)}>
              {t} ×
            </Tag>
          ))}
          {(pm || pM) && (
            <Tag variant="warm" style={{ cursor: 'pointer' }} onClick={() => { setPm(''); setPM(''); }}>
              Prep {pm || '0'}-{pM || '∞'} min ×
            </Tag>
          )}
          {(cm || cM) && (
            <Tag variant="warm" style={{ cursor: 'pointer' }} onClick={() => { setCm(''); setCM(''); }}>
              Cuisson {cm || '0'}-{cM || '∞'} min ×
            </Tag>
          )}
        </div>
      )}
    </div>
  );
}