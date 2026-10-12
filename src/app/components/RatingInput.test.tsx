import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_SCORES, overall, RatingInput, scoresComplete } from './RatingInput';

afterEach(cleanup);

describe('scores', () => {
  it('averages only the criteria that apply', () => {
    expect(overall(EMPTY_SCORES)).toBeNull();
    expect(overall({ vibe: 5, offer: 4, service: null, value: null })).toBe(4.5);
    expect(overall({ vibe: 5, offer: 4, service: 3, value: 4 })).toBe(4);
  });

  it('needs the two required criteria', () => {
    expect(scoresComplete({ ...EMPTY_SCORES, vibe: 3 })).toBe(false);
    expect(scoresComplete({ ...EMPTY_SCORES, vibe: 3, offer: 2 })).toBe(true);
  });
});

describe('RatingInput', () => {
  it('sets a score and clears an optional one', () => {
    const onChange = vi.fn();
    render(<RatingInput value={{ vibe: 2, offer: null, service: 4, value: null }} onChange={onChange} />);
    expect(screen.getByText('3,0')).toBeTruthy(); // the total

    fireEvent.click(screen.getByRole('button', { name: 'Oferta: 5 na 5' }));
    expect(onChange).toHaveBeenLastCalledWith({ vibe: 2, offer: 5, service: 4, value: null });

    fireEvent.click(screen.getAllByRole('button', { name: 'N/D' })[0]!);
    expect(onChange).toHaveBeenLastCalledWith({ vibe: 2, offer: null, service: null, value: null });
  });
});
