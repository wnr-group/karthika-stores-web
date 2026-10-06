/**
 * Seed dates are relative to the start of today, so the dashboards always
 * show a live-looking last 90 days rather than a frozen quarter from the year
 * the seed was written. Everything is anchored to one instant per process so
 * ordering is stable between renders.
 */

const DAY = 86_400_000;

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

export const SEED_NOW = today.getTime();

/** The real moment the seed was built. Nothing seeded may be later than this. */
export const SEED_BOOT = Date.now();

export function daysAgo(days: number, hour = 10, minute = 0): string {
  const date = new Date(SEED_NOW - days * DAY);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function daysAhead(days: number, hour = 10, minute = 0): string {
  return daysAgo(-days, hour, minute);
}

/**
 * A small deterministic PRNG (mulberry32). Seed data must come out the same
 * on every boot, or an order number in one request would point at a
 * different order in the next.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)]!;
    },
    weighted<T>(items: ReadonlyArray<readonly [T, number]>): T {
      const total = items.reduce((sum, [, weight]) => sum + weight, 0);
      let roll = next() * total;
      for (const [item, weight] of items) {
        roll -= weight;
        if (roll <= 0) return item;
      }
      return items[items.length - 1]![0];
    },
    chance(probability: number) {
      return next() < probability;
    },
  };
}
