import { createNoise2D } from "simplex-noise";
import { alea } from "./alea";

export class Random {

  constructor(random) {
    this.random = random ?? Math.random;
    this._noise2D = null;
  }

  static from(stateOrSeed) {
    stateOrSeed = stateOrSeed instanceof Random ? stateOrSeed.random.state : stateOrSeed;
    return new Random(alea(stateOrSeed));
  }

  next() {
    return this.random();
  }

  int(min, max) {
    min = Math.ceil(min);
    if (max === undefined) {
      max = min;
      min = 0
    } else {
      max = Math.ceil(max) - min;
    }
    return Math.floor(this.random() * max + min);
  }

  float(min, max) {
    if (min === undefined) return this.random();
    if (max === undefined) {
      max = min;
      min = 0
    }
    return this.random() * (max - min) + min;
  }

  bool() {
    return this.random() >= 0.5;
  }

  pick(...args) {
    if (args.length === 1 && args[0]?.length > 0) args = args[0];
    return args[Math.floor(this.random() * args.length)];
  }

  // Fisher–Yates Shuffle from https://bost.ocks.org/mike/shuffle/
  shuffle(array) {
    var m = array.length, t, i;
    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      i = Math.floor(this.random() * m--);
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }

  get noise2D() {
    this._noise2D ??= createNoise2D(this.random);
    return this._noise2D;
  }

  noise2DNorm(x, y) {
    return (this.noise2D(x, y) + 1) * 0.5;
  }
}

// common Math.random based instance
export const rand = new Random();
