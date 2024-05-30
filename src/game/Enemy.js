import { createAnimation } from "~/fw/pixiTools.js";
import { Container, Graphics } from "pixi.js";
import { rand } from "~/fw/Random.js";
import { HEIGHT, TILE_SIZE } from "~/consts.js";
import msg from "~/fw/msg.js";
import { ColliderRect } from "~/game/ColliderRect.js";


export class Enemy extends Container {

  #moveTween;

  constructor(opts = {}) {
    super(opts);
    this.isEnemy = true;
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
    return this.colliders.map(c => c.offsetFrom(this));
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
        new ColliderRect(-2, -7, 4, 14, "hull"),
        new ColliderRect(-7, -2, 14, 4, "hull"),
        new ColliderRect(-5, -5, 10, 10, "hull")
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
    msg.emit('enemyHit', {
      destroyed: true,
      size: 'small'
    });
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
        new ColliderRect(-15, -8, 11, 16, "leftWing"),
        new ColliderRect(4, -8, 11, 16, "rightWing"),
        new ColliderRect(-2, -5, 4, 10, "hull")
      ],
      ...opts
    });

    this.spr = this.addChild(createAnimation("enemy/1x2"));
    this.spr.rotation = -Math.PI / 2;

    this.initSpawn(opts.spawnRange);
    this.y -= 1; // fixed y pos, possibly broken after rotation :/

    this.damagedPart = null;
  }

  crash(part) {
    if (this.damagedPart || part.name === 'hull') {
      super.crash();
      this.spr.visible = false;
      for (const coll of this.colliders) {
        const expl = this.addChild(createAnimation('effect/explosion', {
          loop: false, autoplay: true, speed: 0.1,
          onComplete: () => {
            this.destroy();
          }
        }));
        expl.x = Math.round(coll.x + coll.width / 2);
        expl.y = Math.round(coll.y + coll.height / 2);
      }

      msg.emit('enemyHit', {
        destroyed: true,
        wasDamaged: this.damagedPart !== null,
        size: 'big'
      });
    }
    else {
      const damagedPartIndex = this.colliders.findIndex(p => p.name === part.name);
      this.damagedPart = this.colliders[damagedPartIndex];
      this.colliders.splice(damagedPartIndex, 1);
      const bounds = this.getLocalBounds();
      const mask = new Graphics();
      mask.rect(bounds.x, bounds.y, bounds.width, bounds.height).fill(0xff0000);
      mask.rect(this.damagedPart.x, this.damagedPart.y, this.damagedPart.width, this.damagedPart.height).cut();
      this.spr.mask = this.addChild(mask);

      const expl = this.addChild(createAnimation('effect/explosion', {
        loop: false, autoplay: true, speed: 0.1, removeOnComplete: true
      }));
      expl.x = Math.round(this.damagedPart.x + this.damagedPart.width / 2);
      expl.y = Math.round(this.damagedPart.y + this.damagedPart.height / 2);

      msg.emit('enemyHit', {
        destroyed: false,
        wasDamaged: false,
        size: 'big'
      });
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
