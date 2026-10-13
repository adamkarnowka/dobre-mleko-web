import { describe, expect, it } from 'vitest';
import { iconSvg, pastedIconPath } from './categories';

describe('icon paths', () => {
  it('takes the paths out of a pasted SVG and notices another grid', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2 L22 2"/>\n<path d="M2 22Z"/></svg>';
    expect(pastedIconPath(svg)).toEqual({ path: 'M2 2 L22 2 M2 22Z', grid: true });
    expect(pastedIconPath('<svg viewBox="0 0 48 48"><path d="M1 1Z"/></svg>').grid).toBe(false);
    expect(pastedIconPath('  M1 1\n  L2 2 ')).toEqual({ path: 'M1 1 L2 2', grid: true });
  });

  it('never puts anything but path commands into markup', () => {
    expect(iconSvg('M1 1 L2 2Z', '#D7301F')).toContain('d="M1 1 L2 2Z"');
    expect(iconSvg('M1 1"/><script>', '#D7301F')).toBeNull();
    expect(iconSvg('M1 1Z', 'red" onload="x')).toContain('fill="#141414"');
  });
});
