import { Fragment, type ReactNode } from 'react';

/** Small, safe Markdown renderer for the bundled guides (no raw HTML). */

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith('**')) out.push(<strong key={k}>{inline(t.slice(2, -2), i)}</strong>);
    else if (t.startsWith('`')) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else if (t.startsWith('[')) {
      const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t)!;
      out.push(<a key={k} href={mm[2]} target="_blank" rel="noreferrer">{mm[1]}</a>);
    } else out.push(<a key={k} href={t} target="_blank" rel="noreferrer">{t}</a>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }
    if (trimmed.startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) body.push(lines[i++].trim());
      i++;
      blocks.push(<pre key={k++} className="card flat small" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{body.join('\n')}</pre>);
      continue;
    }
    if (/^---+$/.test(trimmed)) { blocks.push(<hr key={k++} style={{ border: 0, borderTop: '1px solid var(--line)', margin: '16px 0' }} />); i++; continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const content = inline(h[2], k);
      blocks.push(level <= 2 ? <h2 key={k++} style={{ marginTop: 16 }}>{content}</h2> : <h3 key={k++} style={{ marginTop: 14 }}>{content}</h3>);
      i++;
      continue;
    }
    if (trimmed.startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++]);
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      blocks.push(
        <div key={k++} className="table-wrap" style={{ margin: '8px 0' }}>
          <table className="md">
            <thead><tr>{head.map((c, j) => <th key={j}>{inline(c, j)}</th>)}</tr></thead>
            <tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, j)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (trimmed.startsWith('>')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) q.push(lines[i++].trim().replace(/^>\s?/, ''));
      blocks.push(<div key={k++} className="banner warn">{inline(q.join(' '), k)}</div>);
      continue;
    }
    const ordered = /^\d+\.\s/.test(trimmed);
    if (ordered || /^[-*]\s/.test(trimmed)) {
      const items: { text: string; sub: string[] }[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const t = l.trim();
        if (!t) {
          // a blank line ends the list unless the next line continues it
          const next = lines[i + 1]?.trim() ?? '';
          if (/^(\d+\.|[-*])\s/.test(next) || (lines[i + 1] ?? '').startsWith('   ')) { i++; continue; }
          break;
        }
        const indented = /^\s{2,}/.test(l);
        const isItem = /^(\d+\.|[-*])\s/.test(t);
        if (isItem && !indented) items.push({ text: t.replace(/^(\d+\.|[-*])\s/, ''), sub: [] });
        else if (items.length && (indented || !isItem)) {
          if (t.startsWith('```')) break;
          items[items.length - 1].sub.push(t.replace(/^(\d+\.|[-*])\s/, ''));
        } else break;
        i++;
      }
      const li = items.map((it, j) => (
        <li key={j}>
          {inline(it.text, j)}
          {it.sub.length > 0 && <ul>{it.sub.map((s, si) => <li key={si}>{inline(s, si)}</li>)}</ul>}
        </li>
      ));
      blocks.push(ordered ? <ol key={k++} className="how">{li}</ol> : <ul key={k++} className="avoid">{li}</ul>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|\||>|```|---|\d+\.\s|[-*]\s)/.test(lines[i].trim())) para.push(lines[i++].trim());
    if (para.length === 0) { i++; continue; }
    blocks.push(<p key={k++}>{inline(para.join(' '), k)}</p>);
  }
  return <Fragment>{blocks}</Fragment>;
}

/** Splits a document into its "## " sections: [title, body]. The part before the first section is returned with an empty title. */
export function splitSections(source: string): [string, string][] {
  const out: [string, string][] = [];
  let title = '';
  let buf: string[] = [];
  for (const line of source.split('\n')) {
    const m = /^##\s+(.*)$/.exec(line);
    if (m) {
      out.push([title, buf.join('\n')]);
      title = m[1];
      buf = [];
    } else buf.push(line);
  }
  out.push([title, buf.join('\n')]);
  return out.filter(([t, b]) => t || b.trim());
}
