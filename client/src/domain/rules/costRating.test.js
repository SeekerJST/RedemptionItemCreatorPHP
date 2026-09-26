import { describe, expect, it } from 'vitest';
import { costRating } from './costRating.js';

// itemsize rows as the API returns them (item_creation_rules.md §3)
const SIZES = {
    Tiny: { BasePoints: 25, IncrementPoints: 10, BaseCR: 0 },
    Small: { BasePoints: 50, IncrementPoints: 25, BaseCR: 0 },
    Medium: { BasePoints: 100, IncrementPoints: 50, BaseCR: 1 },
    Large: { BasePoints: 300, IncrementPoints: 100, BaseCR: 3 },
    Huge: { BasePoints: 600, IncrementPoints: 200, BaseCR: 6 },
    Colossal: { BasePoints: 1200, IncrementPoints: 400, BaseCR: 9 },
};

describe('Cost Rating (§4)', () => {
    it('only full increments over budget raise CR (the book\'s Huge example)', () => {
        expect(costRating(811, SIZES.Huge)).toBe(7); // 211 over -> +1
        expect(costRating(1321, SIZES.Huge)).toBe(9); // 721 over -> +3
        expect(costRating(1441, SIZES.Huge)).toBe(10); // 841 over -> +4
        expect(costRating(799, SIZES.Huge)).toBe(6); // 199 over -> +0
    });

    it('steps down the same way under budget', () => {
        expect(costRating(390, SIZES.Huge)).toBe(5); // 210 under -> -1
        expect(costRating(401, SIZES.Huge)).toBe(6); // 199 under -> 0
    });

    it('can go negative, but never below -2', () => {
        expect(costRating(5, SIZES.Small)).toBe(-1); // Knife: 45 under
        expect(costRating(25, SIZES.Small)).toBe(-1); // Quality Gauss Pistol
        expect(costRating(45, SIZES.Small)).toBe(0); // Concealable Pistol
        expect(costRating(-500, SIZES.Small)).toBe(-2);
    });

    it.each([
        ['Tiny', -2],
        ['Small', -2],
        ['Medium', -1],
        ['Large', 0],
        ['Huge', 3],
        ['Colossal', 6],
    ])('%s at 0 BP is CR %i', (size, expected) => {
        expect(costRating(0, SIZES[size])).toBe(expected);
    });

    it('is null until a size is chosen', () => {
        expect(costRating(100, null)).toBeNull();
    });
});
