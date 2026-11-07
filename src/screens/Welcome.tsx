import { useRef, useState, type PointerEvent } from 'react';
import { IconCheck, IconChevronRight } from '../components/icons';

const TAGS: { text: string; top: string; left?: string; right?: string; side: 'left' | 'right' }[] = [
  { text: '1,800 KCAL A DAY', top: '24%', left: '50%', side: 'right' },
  { text: '160 G PROTEIN', top: '42%', right: '48%', side: 'left' },
  { text: '96 TO 83 KG', top: '58%', left: '46%', side: 'right' },
];

/** First-run welcome screen. Slide (or tap) "Let's start" to enter the app. */
export function Welcome({ onStart }: { onStart: () => void }) {
  const track = useRef<HTMLButtonElement>(null);
  const [x, setX] = useState(0);
  const drag = useRef<{ startX: number; max: number } | null>(null);

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    const el = track.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX - x, max: el.clientWidth - 72 };
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    setX(Math.max(0, Math.min(drag.current.max, e.clientX - drag.current.startX)));
  };
  const up = () => {
    if (!drag.current) return;
    const done = x > drag.current.max * 0.6;
    drag.current = null;
    if (done) {
      setX(track.current ? track.current.clientWidth - 72 : x);
      window.setTimeout(onStart, 180);
    } else setX(0);
  };

  return (
    <div className="welcome" role="dialog" aria-label="Welcome to Hashan Fit">
      <img className="photo" src="/hero.jpg" alt="" />
      <div className="tint" />
      <div className="fade" />
      {TAGS.map((t) => (
        <div key={t.text} className={`tag ${t.side}`} style={{ top: t.top, left: t.left, right: t.right }} aria-hidden="true">
          <span className="dot" />
          <span className="stem" />
          <span className="text">{t.text}</span>
        </div>
      ))}
      <div className="inner">
        <div className="brand">HASHAN FIT</div>
        <h1>Your Plan,<br />Made for You</h1>
        <p className="lead">13 weeks to 83 kg. Meals, Body Masters workouts with how-to demos, sleep and Fitbit, all in one place.</p>
        <button
          ref={track}
          className="slider"
          aria-label="Let's start"
          onClick={() => drag.current === null && x === 0 && onStart()}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <span className="knob" style={{ transform: `translateX(${x}px)`, transition: drag.current ? 'none' : 'transform .2s ease' }}>
            <IconChevronRight />
          </span>
          Let&apos;s start
          <span className="end"><IconCheck width={18} height={18} /></span>
        </button>
      </div>
    </div>
  );
}
