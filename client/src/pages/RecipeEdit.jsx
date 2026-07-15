import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import IngredientRow from '../components/recipes/IngredientRow';
import StepRow from '../components/recipes/StepRow';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import TagInput from '../components/ui/TagInput';

export default function RecipeEdit() {
  const { recipeId } = useParams();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [visibility, setVisibility] = useState('public');

  const [ingredients, setIngredients] = useState([{ name: '', quantity: null, unit: '', note: '' }]);
  const [steps, setSteps] = useState([{ instruction: '' }]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      nav('/login', { replace: true });
      return;
    }

    const load = async () => {
      try {
        const data = await apiFetch(`/recipes/${recipeId}`);
        setTitle(data.title);
        setDescription(data.description || '');
        setPrepTime(data.prep_time_minutes ? String(data.prep_time_minutes) : '');
        setCookTime(data.cook_time_minutes ? String(data.cook_time_minutes) : '');
        setServings(data.servings ? String(data.servings) : '');
        setSourceUrl(data.source_url || '');
        setImageUrl(data.image_url || '');
        setVisibility(data.visibility || 'public');
        setTags((data.tags || []).map((t) => t.label));
        if (data.ingredients && data.ingredients.length > 0) {
          setIngredients(data.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit || '', note: i.note || '' })));
        }
        if (data.steps && data.steps.length > 0) {
          setSteps(data.steps.map((s) => ({ instruction: s.instruction })));
        }
      } catch (e) {
        setErr(e.message || 'Erreur lors du chargement.');
      } finally {
        setBusy(false);
      }
    };

    load();
  }, [recipeId, nav]);

  function chgIng(index, field, value) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  function addIng() {
    setIngredients([...ingredients, { name: '', quantity: null, unit: '', note: '' }]);
  }

  function delIng(index) {
    if (ingredients.length > 1) setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function chgStep(index, field, value) {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  }

  function addStep() {
    setSteps([...steps, { instruction: '' }]);
  }

  function delStep(index) {
    if (steps.length > 1) setSteps(steps.filter((_, i) => i !== index));
  }

  async function go(e) {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Le titre est obligatoire');
      return;
    }

    const ingredientsPayload = ingredients.filter((ing) => ing.name.trim()).map((ing, i) => ({
      line_order: i, name: ing.name.trim(), quantity: ing.quantity,
      unit: ing.unit.trim() || null, note: ing.note.trim() || null,
    }));
    const stepsPayload = steps.filter((s) => s.instruction.trim()).map((s, i) => ({
      step_order: i + 1, instruction: s.instruction.trim(),
    }));

    try {
      setErr('');
      setSaving(true);
      await apiFetch(`/recipes/${recipeId}`, {
        method: 'PATCH',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          visibility: visibility,
          prep_time_minutes: prepTime ? parseInt(prepTime, 10) : null,
          cook_time_minutes: cookTime ? parseInt(cookTime, 10) : null,
          servings: servings ? parseInt(servings, 10) : null,
          source_url: sourceUrl.trim() || null,
          image_url: imageUrl.trim() || null,
          ingredients: ingredientsPayload,
          steps: stepsPayload,
          tags: tags.length > 0 ? tags : null,
        },
      });
      nav(`/recipes/${recipeId}`, { replace: true });
    } catch (e) {
      setErr(e.message || 'Erreur lors de la modification.');
    } finally {
      setSaving(false);
    }
  }

  if (busy) {
    return (
      <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh', padding: '2rem var(--space-xl)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}><p>Chargement...</p></div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh', padding: '2rem var(--space-xl)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }}>Modifier la recette</h2>

        <form onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Titre" placeholder="Tarte aux pommes" value={title}
                onChange={(e) => setTitle(e.target.value)} disabled={saving} required />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="ui-form-label">Description</label>
                <textarea className="ui-form-input" placeholder="Une delicieuse tarte..." value={description}
                  onChange={(e) => setDescription(e.target.value)} disabled={saving} rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 120px' }}>
                  <Input label="Temps prep. (min)" type="number" placeholder="15" value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)} disabled={saving} />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <Input label="Temps cuisson (min)" type="number" placeholder="30" value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)} disabled={saving} />
                </div>
                <div style={{ flex: '0 0 100px' }}>
                  <Input label="Portions" type="number" placeholder="4" value={servings}
                    onChange={(e) => setServings(e.target.value)} disabled={saving} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="ui-form-label">Visibilité</label>
                <select className="ui-form-input" value={visibility}
                  onChange={(e) => setVisibility(e.target.value)} disabled={saving} style={{ cursor: 'pointer' }}>
                  <option value="public">Publique</option>
                  <option value="private">Privée</option>
                </select>
              </div>
              <Input label="Source (URL)" type="url" placeholder="https://..." value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)} disabled={saving} />
              <Input label="Image (URL)" type="url" placeholder="https://..." value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)} disabled={saving} />
              <TagInput label="Tags" value={tags} onChange={setTags} disabled={saving} />
            </div>
          </Card>

          <Card style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>Ingrédients</h3>
              <Button type="button" variant="secondary" onClick={addIng} disabled={saving}>+ Ajouter</Button>
            </div>
            {ingredients.map((ing, i) => (
              <IngredientRow key={i} i={i} ing={ing}
                chg={chgIng} del={delIng} />
            ))}
          </Card>

          <Card style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>Étapes</h3>
              <Button type="button" variant="secondary" onClick={addStep} disabled={saving}>+ Ajouter</Button>
            </div>
            {steps.map((step, i) => (
              <StepRow key={i} i={i} step={step} chg={chgStep} del={delStep} />
            ))}
          </Card>

          {err && (
            <div style={{ color: 'var(--color-border-error)', backgroundColor: 'var(--color-error-bg)', padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)',
              border: '1px solid var(--color-border-error)' }}>
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => nav(-1)} disabled={saving}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}