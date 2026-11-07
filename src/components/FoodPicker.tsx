import { useMemo, useState } from 'react';
import { FOODS, GROUP_LABEL, SLOT_LABEL, foodValues } from '../plan/foods';
import type { Food, MealItem, MealSlot, Settings } from '../plan/types';
import { NumInput, Sheet } from './ui';

type Filter = 'all' | Food['group'];
const FILTERS: Filter[] = ['all', 'go', 'home', 'careful', 'avoid'];
const QTYS = [0.5, 1, 1.5, 2];

export function FoodPicker({ slot, settings, onAdd, onClose }: {
  slot: MealSlot;
  settings: Settings;
  onAdd: (item: Omit<MealItem, 'id' | 'slot'>) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState<{ name: string; kcal?: number; protein?: number }>({ name: '' });

  const foods = useMemo(() => {
    const term = q.trim().toLowerCase();
    return FOODS.filter((f) => (filter === 'all' || f.group === filter) && (!term || f.name.toLowerCase().includes(term)));
  }, [q, filter]);

  return (
    <Sheet title={`Add to ${SLOT_LABEL[slot]}`} onClose={onClose}>
      <input type="search" placeholder="Search food" aria-label="Search food" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips" style={{ marginTop: 10 }}>
        {FILTERS.map((f) => (
          <button key={f} className={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : GROUP_LABEL[f]}
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <span className="small muted">Amount</span>
        <div className="chips">
          {QTYS.map((n) => (
            <button key={n} className={`chip${qty === n ? ' on' : ''}`} onClick={() => setQty(n)}>x{n}</button>
          ))}
        </div>
      </div>
      <ul className="list" style={{ marginTop: 6 }}>
        {foods.map((f) => {
          const v = foodValues(f, settings);
          return (
            <li key={f.id}>
              <span className={`pill ${f.group}`}>{GROUP_LABEL[f.group]}</span>
              <div className="grow">
                <div>{f.name}</div>
                <div className="tiny muted">{f.portion} - {v.kcal} kcal, {v.protein} g protein</div>
              </div>
              <button className="btn small" aria-label={`Add ${f.name}`} onClick={() => onAdd({ foodId: f.id, name: f.name, kcal: v.kcal, protein: v.protein, qty })}>Add</button>
            </li>
          );
        })}
        {foods.length === 0 && <li className="muted">No match. Add it as a custom item below.</li>}
      </ul>
      <div className="card flat">
        <h3>Custom item</h3>
        <label className="field">Name<input type="text" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="e.g. Grilled hammour" /></label>
        <div className="grid2" style={{ marginTop: 8 }}>
          <label className="field">kcal<NumInput ariaLabel="Custom kcal" value={custom.kcal} onChange={(kcal) => setCustom({ ...custom, kcal })} min={0} /></label>
          <label className="field">Protein (g)<NumInput ariaLabel="Custom protein" value={custom.protein} onChange={(protein) => setCustom({ ...custom, protein })} min={0} /></label>
        </div>
        <button
          className="btn block"
          style={{ marginTop: 10 }}
          disabled={!custom.name.trim() || custom.kcal === undefined}
          onClick={() => onAdd({ name: custom.name.trim(), kcal: custom.kcal ?? 0, protein: custom.protein ?? 0, qty })}
        >
          Add custom item
        </button>
      </div>
    </Sheet>
  );
}
