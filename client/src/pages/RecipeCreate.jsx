import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import IngredientRow from '../components/recipes/IngredientRow';
import StepRow from '../components/recipes/StepRow';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import TagInput from '../components/ui/TagInput';

export default function RecipeCreate() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState([]);

  const [scopeType, setScopeType] = useState('personal');
  const [visibility, setVisibility] = useState('public');
  const [cookbooks, setCookbooks] = useState([]);
  const [cookbookId, setCookbookId] = useState('');

  const [ingredients, setIngredients] = useState([
    { name: '', quantity: null, unit: '', note: '' },
  ]);
  const [steps, setSteps] = useState([
    { instruction: '' },
  ]);

  useEffect(() => {
    if (scopeType === 'cookbook') {
      apiFetch('/cookbooks')
        .then((data) => setCookbooks(data || []))
        .catch(() => {});
    }
  }, [scopeType]);

  function chgIng(index, field, value) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  function addIng() {
    setIngredients([...ingredients, { name: '', quantity: null, unit: '', note: '' }]);
  }

  function delIng(index) {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
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
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  }

  async function go(e) {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Le titre est obligatoire');
      return;
    }
    if (scopeType === 'cookbook' && !cookbookId) {
      setErr('Veuillez selectionner un cookbook');
      return;
    }

    const ingredientsPayload = ingredients
      .filter((ing) => ing.name.trim())
      .map((ing, i) => ({
        line_order: i,
        name: ing.name.trim(),
        quantity: ing.quantity,
        unit: ing.unit.trim() || null,
        note: ing.note.trim() || null,
      }));

    const stepsPayload = steps
      .filter((s) => s.instruction.trim())
      .map((s, i) => ({
        step_order: i + 1,
        instruction: s.instruction.trim(),
      }));

    const payload = {
      scope_type: scopeType,
      visibility: visibility,
      title: title.trim(),
      description: description.trim() || null,
      prep_time_minutes: prepTime ? parseInt(prepTime, 10) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime, 10) : null,
      servings: servings ? parseInt(servings, 10) : null,
      source_url: sourceUrl.trim() || null,
      image_url: imageUrl.trim() || null,
      ingredients: ingredientsPayload,
      steps: stepsPayload,
      tags: tags.length > 0 ? tags : null,
    };

    if (scopeType === 'cookbook') {
      payload.cookbook_id = cookbookId;
    }

    try {
      setErr('');
      setSaving(true);
      await apiFetch('/recipes', {
        method: 'POST',
        body: payload,
      });
      nav('/cookbooks', { replace: true });
    } catch (e) {
      setErr(e.message || 'Erreur lors de la creation');
    } finally {
      setSaving(false);
    }
  }

  const scopeLabel = scopeType === 'personal' ? 'Recette personnelle' : 'Recette dans un cookbook';

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem var(--space-xl)',
        backgroundColor: 'var(--color-bg-page)',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
            Nouvelle recette
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {scopeLabel}
          </p>
        </div>

        <form onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="ui-form-label">Type de recette</label>
                <select
                  className="ui-form-input"
                  value={scopeType}
                  onChange={(e) => {
                    setScopeType(e.target.value);
                    setCookbookId('');
                  }}
                  disabled={saving}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="personal">Personnelle</option>
                  <option value="cookbook">Dans un cookbook</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="ui-form-label">Visibilité</label>
                <select
                  className="ui-form-input"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  disabled={saving}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="public">Publique</option>
                  <option value="private">Privée</option>
                </select>
              </div>

              {scopeType === 'cookbook' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="ui-form-label">Cookbook</label>
                  <select
                    className="ui-form-input"
                    value={cookbookId}
                    onChange={(e) => setCookbookId(e.target.value)}
                    disabled={saving}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Selectionner un cookbook...</option>
                    {cookbooks.map((cb) => (
                      <option key={cb.id} value={cb.id}>{cb.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Titre"
                placeholder="Tarte aux pommes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                required
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="ui-form-label">Description</label>
                <textarea
                  className="ui-form-input"
                  placeholder="Une delicieuse tarte..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 120px' }}>
                  <Input
                    label="Temps prep. (min)"
                    type="number"
                    placeholder="15"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <Input
                    label="Temps cuisson (min)"
                    type="number"
                    placeholder="30"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div style={{ flex: '0 0 100px' }}>
                  <Input
                    label="Portions"
                    type="number"
                    placeholder="4"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              <Input
                label="Source (URL)"
                type="url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={saving}
              />
              <Input
                label="Image (URL)"
                type="url"
                placeholder="https://images.example.com/tarte.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={saving}
              />
              <TagInput
                label="Tags"
                value={tags}
                onChange={setTags}
                disabled={saving}
              />
            </div>
          </Card>

          <Card style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>Ingrédients</h3>
              <Button type="button" variant="secondary" onClick={addIng} disabled={saving}>
                + Ajouter
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ingredients.map((ing, i) => (
                <IngredientRow
                  key={i}
                  i={i}
                  ing={ing}
                  chg={chgIng}
                  del={delIng}
                />
              ))}
            </div>
          </Card>

          <Card style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>Étapes</h3>
              <Button type="button" variant="secondary" onClick={addStep} disabled={saving}>
                + Ajouter
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {steps.map((step, i) => (
                <StepRow
                  key={i}
                  i={i}
                  step={step}
                  chg={chgStep}
                  del={delStep}
                />
              ))}
            </div>
          </Card>

          {err && (
            <div
              style={{
                color: 'var(--color-border-error)',
                backgroundColor: 'var(--color-error-bg)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                border: '1px solid var(--color-border-error)',
              }}
            >
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => nav(-1)} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Création...' : 'Créer la recette'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}