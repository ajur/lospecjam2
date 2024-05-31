import { Container } from "pixi.js";
import { createAnimation } from "~/fw/pixiTools.js";
import { HEIGHT, TILE_SIZE } from "~/consts.js";
import { rand } from "~/fw/Random.js";
import { playSound } from "~/fw/audio.js";
import msg from "~/fw/msg.js";


export class Charger extends Container {

  #isCharging = false;
  #chargingSound;

  constructor({spawnRange, ...props}) {
    super(props);

    this.idle = this.addChild(createAnimation("ship/charger/idle"));
    this.charging = this.addChild(createAnimation("ship/charger/charging"));
    this.charging.visible = false;

    this.x = rand.int(spawnRange.xMin + this.width / 2, spawnRange.xMax - this.width / 2);
    this.y = spawnRange.y + TILE_SIZE / 2;

    this.alive = true;
  }

  get isCharging() {
    return this.#isCharging;
  }

  set isCharging(val) {
    if (this.#isCharging !== val) {
      this.#isCharging = val;
      this.charging.visible = val;
      this.idle.visible = val;

      if (val) {
        this.#chargingSound = playSound("charging");
        this.#chargingSound.loop = true;
        // this.#engineSound.loopStart = 0.1;
        // this.#engineSound.loopEnd = 0.95;
      } else {
        this.#chargingSound?.stop();
      }
    }
  }

  getCollider() {
    return this.getBounds().pad(-1);
  }

  update(dy) {
    this.y += dy;

    if (this.y > HEIGHT + this.height) {
      console.log('charger outside')
      this.destroy();
    }
  }

  crash() {
    const wasCharging = this.isCharging;
    this.alive = false;
    this.isCharging = false;

    this.idle.visible = false;
    const a1 = this.addChild(createAnimation('effect/explosion', {loop: false, speed: 0.1}));
    a1.y = -8;
    this._t1 = setTimeout(() => {
      this.addChild(createAnimation('effect/explosion', {loop: false, speed: 0.1}));
    }, 200);
    this._t2 = setTimeout(() => {
      const a2 = this.addChild(createAnimation('effect/explosion', {
        loop: false, speed: 0.1,
        onComplete: () => this.destroy()
      }));
      a2.y = 8;
    }, 400);

    playSound("explosionBig");

    msg.emit('chargerHit', {
      destroyed: true,
      wasCharging
    });
  }

  destroy(options) {
    if (this._t1) clearTimeout(this._t1);
    if (this._t2) clearTimeout(this._t2);
    super.destroy({children: true, ...options});
  }

}
