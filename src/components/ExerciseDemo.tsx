import { useEffect, useState } from 'react';
import { demoFrames } from '../plan/exercises';
import type { ExerciseInfo } from '../plan/types';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Loops the start and end photos so the movement is visible. Tap to pause. */
export function DemoPlayer({ exercise }: { exercise: ExerciseInfo }) {
  const [start, end] = demoFrames(exercise);
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => setFrame((f) => 1 - f), 1200);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  if (reduced) {
    return (
      <div className="demo-pair">
        <figure style={{ margin: 0 }}><img src={start} alt={`${exercise.name}: start position`} loading="lazy" /><figcaption className="tiny muted">Start</figcaption></figure>
        <figure style={{ margin: 0 }}><img src={end} alt={`${exercise.name}: end position`} loading="lazy" /><figcaption className="tiny muted">End</figcaption></figure>
      </div>
    );
  }
  return (
    <div
      className="demo"
      role="img"
      aria-label={`${exercise.name} demo, moving between start and end position. Tap to ${paused ? 'play' : 'pause'}.`}
      onClick={() => setPaused((p) => !p)}
    >
      <img src={start} alt="" style={{ opacity: frame === 0 ? 1 : 0 }} />
      <img src={end} alt="" style={{ opacity: frame === 1 ? 1 : 0 }} />
      <span className="badge">{paused ? 'Paused - tap to play' : frame === 0 ? 'Start' : 'End'}</span>
    </div>
  );
}

export function HowTo({ exercise }: { exercise: ExerciseInfo }) {
  return (
    <div className="stack">
      <DemoPlayer exercise={exercise} />
      <p className="small muted">Works: {exercise.muscles}</p>
      <div>
        <h3>How to do it</h3>
        <ol className="how">
          {exercise.how.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </div>
      <div>
        <h3>Avoid</h3>
        <ul className="avoid">
          {exercise.avoid.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
      <p className="tiny muted">Photos: Free Exercise DB (public domain).</p>
    </div>
  );
}
