import { createAnimation, PPPContainer } from "~/fw/pixiTools.js";
import { Rectangle } from "pixi.js";
import { rand } from "~/fw/Random.js";
import { HEIGHT, TILE_SIZE } from "~/consts.js";
import msg from "~/fw/msg.js";


export class Enemy extends PPPContainer {

  #moveTween;

  constructor(opts = {}) {
    super(opts);
    this.colliders = opts.colliders || [];
    this.movementRatio = opts.movementRatio || 1;

    this.isMoving = false;

    msg.on('pause', this.onPause, this);
    msg.on('resume', this.onResume, this);
  }

  initSpawn(spawnRange) {
    const [fromX, toX] = rand.shuffle([
      spawnRange.xMin + this.width / 2,
      spawnRange.xMax - this.width / 2
    ]);

    this.x = fromX;
    this.y = spawnRange.y + this.height / 2;

    this.fromX = fromX;
    this.toX = toX;

    this.alive = true;
  }

  startMoving() {
    this.#moveTween = gsap.to(this, {
      x: this.toX,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
      duration: Math.abs(this.toX - this.fromX) / TILE_SIZE / this.movementRatio
    })
    this.isMoving = true;
  }

  update(dy) {
    this.y += dy;

    if (this.y > HEIGHT + this.height) {
      this.destroy();
      return;
    }
    if (!this.isMoving && this.y > TILE_SIZE) {
      this.startMoving();
    }
  }

  destroy(options) {
    msg.off('pause', this.onPause, this);
    msg.off('resume', this.onResume, this);
    gsap.killTweensOf(this);
    super.destroy({children: true, ...options});
  }

  getColliders() {
    const {x, y} = this.position;
    return this.colliders.map((c) => {
      const r = c.clone();
      r.x += x;
      r.y += y;
      return r;
    });
  }

  crash() {
    this.alive = false;
  }

  onPause() {
    if (this.#moveTween) {
      this.#moveTween.pause();
    }
  }

  onResume() {
    if (this.#moveTween) {
      this.#moveTween.play();
    }
  }
}

export class EnemySmall extends Enemy {
  constructor(opts) {
    super({
      movementRatio: 1.2,
      colliders: [
        new Rectangle(-2, -7, 4, 14),
        new Rectangle(-7, -2, 14, 4),
        new Rectangle(-5, -5, 10, 10)
      ],
      ...opts
    });

    this.spr = this.addChild(createAnimation("enemy/1x1"));

    this.initSpawn(opts.spawnRange);
  }

  crash() {
    super.crash();
    this.spr.visible = false;
    this.addChild(createAnimation('effect/explosion', {
      loop: false, autoplay: true, speed: 0.1,
      onComplete: () => {
        this.destroy();
      }
    }));
  }

  onPause() {
    super.onPause();
    this.spr.stop();
  }
  onResume() {
    super.onResume();
    this.spr.play();
  }
}

export class EnemyBig extends Enemy {
  constructor(opts) {
    super({
      movementRatio: 0.8,
      colliders: [
        new Rectangle(-14, -8, 9, 16),
        new Rectangle(5, -8, 9, 16),
        new Rectangle(-5, -5, 10, 10)
      ],
      ...opts
    });

    this.spr = this.addChild(createAnimation("enemy/1x2"));
    this.spr.rotation = -Math.PI / 2;

    this.initSpawn(opts.spawnRange);
    this.y -= 1; // fixed y pos, possibly broken after rotation :/
  }

  crash() {
    super.crash();
    this.spr.visible = false;
    for (const x of [-8, 8]) {
      const expl = this.addChild(createAnimation('effect/explosion', {
        loop: false, autoplay: true, speed: 0.1,
        onComplete: () => {
          this.destroy();
        }
      }));
      expl.x = x;
    }

  }

  onPause() {
    super.onPause();
    this.spr.stop();
  }
  onResume() {
    super.onResume();
    this.spr.play();
  }
}
