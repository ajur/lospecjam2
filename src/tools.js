
export const modulo = (a, n) => a - n * Math.floor(a / n);  // after D. Knuth
export const wrap = (x, min, max) => modulo(x - min, max - min) + min;
export const clamp = (x, min, max) => Math.max(Math.min(x, max), min);
