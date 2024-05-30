import { Rectangle } from "pixi.js";


export class ColliderRect extends Rectangle {
  constructor(x, y, width, height, name) {
    super(x, y, width, height);
    this.name = name;
  }

  offsetFrom({x, y}) {
    return new ColliderRect(this.x + x, this.y + y, this.width, this.height, this.name);
  }
}
