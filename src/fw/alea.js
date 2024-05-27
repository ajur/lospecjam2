// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license

const stateKeys = ["c", "s0", "s1", "s2"];
export function alea(seedOrState) {
  const isAleaState = typeof seedOrState === "object" && stateKeys.every((k) => seedOrState[k] != null);
  const state = isAleaState ? seedOrState : seedState(seedOrState);
  return aleaImpl(state);
}

function seedState(seed) {
  let n = 0xefc8249d;
  const mash = (data) => {
    data = String(data);
    let i, h;
    for (i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  let s0 = mash(" ");
  let s1 = mash(" ");
  let s2 = mash(" ");

  s0 -= mash(seed);
  if (s0 < 0) s0 += 1;
  s1 -= mash(seed);
  if (s1 < 0) s1 += 1;
  s2 -= mash(seed);
  if (s2 < 0) s2 += 1;

  return { c: 1, s0, s1, s2 };
}

function aleaImpl({ c, s0, s1, s2 }) {
  const state = { c, s0, s1, s2 };

  const next = () => {
    const t = 2091639 * state.s0 + state.c * 2.3283064365386963e-10; // 2^-32
    state.s0 = state.s1;
    state.s1 = state.s2;
    return (state.s2 = t - (state.c = t | 0));
  }

  next.state = state;
  next.int32 = () => (next() * 0x100000000) | 0
  next.double = () => (next() + ((next() * 0x200000) | 0) * 1.1102230246251565e-16); // 2^-53

  return next;
}
