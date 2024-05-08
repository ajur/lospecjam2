
export const modulo = (a, n) => a - n * Math.floor(a / n);  // after D. Knuth
export const wrap = (x, min, max) => modulo(x - min, max - min) + min;
