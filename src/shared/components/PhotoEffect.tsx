import { useId } from 'react';
import { INK, luminance, mix, PAPER, rgb, type PhotoFilter } from '../cardStyle';

export type Effect = { filter: PhotoFilter; intensity: number; color: string };

/**
 * The photo filter, drawn over the original photo; its opacity is the filter's strength.
 * Duotone and riso are SVG colour filters; halftone and engraving threshold the photo against a dot or line screen
 * (CSS contrast over a multiplied pattern), then print it in the card's colour on paper.
 */
export function PhotoEffect({ src, effect }: { src: string; effect: Effect }) {
  const id = `fx${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { filter, intensity, color } = effect;
  if (filter === 'none' || intensity <= 0) return null;
  const opacity = Math.min(intensity, 100) / 100;

  if (filter === 'halftone' || filter === 'engraving') {
    return (
      <div className={`fx fx-screen fx-${filter}`} style={{ opacity, ['--fx-color' as string]: color }} aria-hidden>
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
          {filter === 'duotone' ? <Duotone color={color} /> : <Riso color={color} />}
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
