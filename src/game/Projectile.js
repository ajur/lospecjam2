import { PPPContainer } from "~/fw/pixiTools.js";
import { Rectangle, Sprite } from "pixi.js";
import { HEIGHT, WIDTH } from "~/consts.js";


const colliders = {
  'laser': new Rectangle(0, -3, 1, 6),
  'bullet': new Rectangle(-1, -1, 2, 2)
}


export class Projectile extends PPPContainer {
  constructor({kind, x, y, vx, vy}) {
    super();

    this.spr = this.addChild(Sprite.from(`projectile/${kind}`));
    this.collider = colliders[kind];

    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }

  getCollider() {
    const col = this.collider.clone();
    col.x += this.position.x;
    col.y += this.position.y;
    return col;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    if (this.x < -this.width || this.x > WIDTH + this.width || this.y < -this.height || this.y > HEIGHT + this.height) {
      this.destroy({children: true});
    }
  }
}
