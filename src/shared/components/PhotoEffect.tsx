import { useId } from 'react';
import { INK, luminance, mix, PAPER, rgb, warmFor, type PhotoFilter } from '../cardStyle';

export type Effect = { filter: PhotoFilter; intensity: number; color: string };

/**
 * The photo filter, drawn over the original photo; its opacity is the filter's strength.
 * Duotone, riso, xerox, mosaic and sunset are SVG colour filters (the last three in flat palette tones, no blends);
 * halftone, engraving and hatch threshold the photo against a dot or line screen (CSS contrast over a multiplied
 * pattern), then print it in the card's colour (hatch: in ink) on paper.
 */
export function PhotoEffect({ src, effect }: { src: string; effect: Effect }) {
  const id = `fx${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { filter, intensity, color } = effect;
  if (filter === 'none' || intensity <= 0) return null;
  const opacity = Math.min(intensity, 100) / 100;

  if (filter === 'halftone' || filter === 'engraving' || filter === 'hatch') {
    const print = filter === 'hatch' ? INK : color;
    return (
      <div className={`fx fx-screen fx-${filter}`} style={{ opacity, ['--fx-color' as string]: print }} aria-hidden>
        <div className="fx-threshold">
          <img src={src} alt="" />
        </div>
      </div>
    );
  }

  return (
    <div className={`fx fx-${filter}`} style={{ opacity }} aria-hidden>
      <svg width="0" height="0" focusable="false">
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" result="gray" />
          {filter === 'duotone' && <Duotone color={color} />}
          {filter === 'riso' && <Riso color={color} />}
          {filter === 'xerox' && <Transfer type="discrete" stops={[rgb(INK), rgb(PAPER), rgb(PAPER)]} />}
          {filter === 'mosaic' && <Mosaic color={color} />}
          {filter === 'sunset' && (
            <Transfer type="discrete" stops={[rgb(INK), middle(color), rgb(warmFor(color)), rgb(PAPER)]} />
          )}
        </filter>
      </svg>
      <img src={src} alt="" style={{ filter: `url(#${id})` }} />
    </div>
  );
}

/** Shadows in ink, highlights in the colour (a dark colour goes to paper instead). */
function Duotone({ color }: { color: string }) {
  const [dark, light] = luminance(color) < 0.05 ? [rgb(color), rgb(PAPER)] : [rgb(INK), rgb(color)];
  return <Transfer type="table" stops={[dark, light]} />;
}

/** The card's colour as a middle tone; a dark card would vanish in the ink, so it becomes grey. */
const middle = (color: string) => (luminance(color) < 0.05 ? mix(rgb(INK), rgb(PAPER), 0.4) : rgb(color));

/** Square pixels (6 px), then three flat tones: ink, the card's colour, paper. */
function Mosaic({ color }: { color: string }) {
  return (
    <>
      <feFlood x="3" y="3" width="1" height="1" in="gray" />
      <feComposite width="6" height="6" />
      <feTile result="grid" />
      <feComposite in="gray" in2="grid" operator="in" />
      <feMorphology operator="dilate" radius="3" />
      <Transfer type="discrete" stops={[rgb(INK), middle(color), rgb(PAPER)]} />
    </>
  );
}

/** Four flat tones of one ink on paper, with grain. */
function Riso({ color }: { color: string }) {
  const ink = rgb(color);
  const paper = rgb(PAPER);
  return (
    <>
      <Transfer type="discrete" stops={[ink, mix(ink, paper, 0.45), mix(ink, paper, 0.75), paper]} result="tones" />
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="7" result="noise" />
      <feColorMatrix in="noise" type="saturate" values="0" result="grain" />
      <feComposite in="tones" in2="grain" operator="arithmetic" k1="0" k2="1" k3="0.16" k4="-0.08" />
    </>
  );
}

function Transfer({
  type,
  stops,
  result,
}: {
  type: 'table' | 'discrete';
  stops: [number, number, number][];
  result?: string;
}) {
  const values = (channel: number) => stops.map((s) => s[channel]!.toFixed(3)).join(' ');
  return (
    <feComponentTransfer result={result}>
      <feFuncR type={type} tableValues={values(0)} />
      <feFuncG type={type} tableValues={values(1)} />
      <feFuncB type={type} tableValues={values(2)} />
    </feComponentTransfer>
  );
}
