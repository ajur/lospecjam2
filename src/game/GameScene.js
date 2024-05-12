import { HEIGHT, TILESETS_SPRITESHEET, WIDTH } from '../consts';
import { Container, Ticker, Assets, Graphics } from 'pixi.js';

import { wrap } from "../tools";
import { createAnimation } from '../pixiTools';
import { Walls } from './Map';
import { PlayerShip } from './PlayerShip';
import { addDebugPane } from '../debug';


export function createScene() {
  const gs =  new GameScene();

  gs.run();

  return gs;
}

class GameScene extends Container {
  constructor() {
    super();

    this.map = this.addChild(new Walls(WIDTH, HEIGHT));
    
    this.player = this.addChild(new PlayerShip());
    this.player.x = WIDTH / 2;
    this.player.y = HEIGHT - 24;

    this.collidersBoxes = this.addChild(new Graphics());
    this.collidersBoxes.renderable = false;

    this.isRunning = false;

    addDebugPane('GameScene', (pane) => {
      pane.expanded = false;
      pane.addBinding(this, 'showCollisions');
    });
  }

  get showCollisions() {
    return this.collidersBoxes.renderable;
  }
  set showCollisions(value) {
    this.collidersBoxes.renderable = !!value;
  }

  run() {
    this.map.move();
    this.isRunning = true;
  }

  shipCollided(ship, shipPart, mapPart) {
    ship.crash(shipPart);
    this.map.smoothStop();
    this.isRunning = false;
  }

  _onRender() {
    if (!this.isRunning) return;
    this.testPlayerCollisions(this.player);
  }

  testPlayerCollisions(player) {
    this.showCollisions && this.collidersBoxes.clear();

    const shipBounds = player.getBounds();
    const mapColliders = this.map.getCollidersForBounds(shipBounds);
    if (mapColliders.length === 0) return;
    const shipColliders = player.getColliders();
    
    let collidingMaps = [];
    let collidingParts = [];
    for (const shipCol of shipColliders) {
      for (const mapCol of mapColliders) {
        if (shipCol.intersects(mapCol)) {
          collidingMaps.push(mapCol);
          collidingParts.push(shipCol);
        }
      }
    }
    if (collidingParts.length > 0) {
      this.shipCollided(player, collidingParts[0], collidingMaps[0]);
    }
    
    if (this.showCollisions) {
      for (const mapCollider of mapColliders) {
        this.collidersBoxes.rect(mapCollider.x, mapCollider.y, mapCollider.width, mapCollider.height).fill({color: 0x00ffff, alpha: collidingMaps.indexOf(mapCollider) >= 0 ? 0.8 : 0.3});
      }
      this.collidersBoxes.rect(shipBounds.x, shipBounds.y, shipBounds.width, shipBounds.height).fill({color: 0xffff00, alpha: 0.3});
      for (const shipCollider of shipColliders) {
        this.collidersBoxes.rect(shipCollider.x, shipCollider.y, shipCollider.width, shipCollider.height).fill({color: collidingParts.indexOf(shipCollider) >= 0 ? 0xff00ff : 0x0000ff, alpha: 0.7});
      }
    }
  }
}