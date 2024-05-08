import { Sprite, Texture } from 'pixi.js';

export class PPSprite extends Sprite {

  constructor(...args) {
    super(...args);
    this.__x = this.position.x;
  }

  static from(source) {
    if (source instanceof Texture) {
      return new PPSprite(source);
    }

    return new PPSprite(Texture.from(source));
  }

  get x() {
    return this.__x;
  }
  set x(value) {
    this.__x = value;
    this._position.x = Math.round(value);
  }
}
