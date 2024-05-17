import { AnimatedSprite, Assets } from "pixi.js";
import { ANIMATIONS_SPRITESHEET } from "~/consts";


export function createAnimation(name, {speed = 0.15, loop = true, autoplay = true, visible = true, onComplete, tint} = {}) {
  const animFrames = Assets.get(ANIMATIONS_SPRITESHEET).animations[name];
  const spr = new AnimatedSprite(animFrames);
  spr.animationSpeed = speed;
  spr.loop = loop;
  spr.visible = visible;
  onComplete != null && (spr.onComplete = onComplete);
  tint != null && (spr.tint = tint);
  autoplay && spr.play();
  return spr;
}

export function checkCollideR(a, b) {
  return a.collideR && b.collideR && ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.collideR + b.collideR) ** 2);
}
