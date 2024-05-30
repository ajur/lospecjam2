import { AnimatedSprite, Assets, Container } from "pixi.js";
import { ANIMATIONS_SPRITESHEET } from "~/consts";


export function createAnimation(name, {speed = 0.15, loop = true, autoplay = true, visible = true, removeOnComplete = false, onComplete, tint} = {}) {
  const animFrames = Assets.get(ANIMATIONS_SPRITESHEET).animations[name];
  const spr = new AnimatedSprite(animFrames);
  spr.animationSpeed = speed;
  spr.loop = loop;
  spr.visible = visible;
  tint != null && (spr.tint = tint);
  autoplay && spr.play();

  if (removeOnComplete) {
    spr.onComplete = () => {
      spr.destroy();
      onComplete?.();
    }
  } else if (onComplete) {
    spr.onComplete = onComplete;
  }

  return spr;
}

export function checkCollideR(a, b) {
  return a.collideR && b.collideR && ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.collideR + b.collideR) ** 2);
}

/**
 * Pixel Perfect Positioned Container
 */
export class PPPContainer extends Container {
  #x;
  #y;

  constructor(opts) {
    super(opts);
    this.#x = this._position.x;
    this.#y = this._position.y;
  }

  get x() {
    return this.#x;
  }
  set x(value) {
    this.#x = value;
    this._position.x = Math.round(value);
  }
  get y() {
    return this.#y;
  }
  set y(value) {
    this.#y = value;
    this._position.y = Math.round(value);
  }
}
