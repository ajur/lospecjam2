import { FONT_HEADER, HEIGHT, WIDTH } from '~/consts';
import { BitmapText, Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';

import { Walls } from './Map';
import { PlayerShip } from './PlayerShip';
import { addDebugPane } from '~/fw/debug';
import msg from "~/fw/msg.js";
import { controllers } from "~/fw/input.js";


export class GameScene extends Container {
  constructor(game) {
    super();

    this.game = game;

    this.map = this.addChild(new Walls(WIDTH, HEIGHT));

    this.player1 = this.addChild(PlayerShip.playerOne(controllers[0]));
    this.player1.x = WIDTH / 2 - 6;
    this.player1.y = HEIGHT - 12 - 18;
    this.player2 = this.addChild(PlayerShip.playerTwo(controllers[1]));
    this.player2.x = WIDTH / 2 + 6;
    this.player2.y = HEIGHT - 12;

    this.collidersBoxes = this.addChild(new Graphics());
    this.collidersBoxes.renderable = false;

    this.isRunning = true;
    this.testCollisions = true;
    this.baseSpeed = 32;  // px per second


    this.removeDebugPane = addDebugPane('GameScene', (pane) => {
      pane.expanded = false;
      pane.addBinding(this, 'baseSpeed', {min: 1, max: 256, step: 1});
      pane.addBinding(this, 'showCollisions');
    });

    Ticker.shared.add(this.moveOnTick, this);
  }

  destroy(options) {
    Ticker.shared.remove(this.moveOnTick, this);
    this.removeDebugPane();
    super.destroy(options);
  }

  get showCollisions() {
    return this.collidersBoxes.renderable;
  }
  set showCollisions(value) {
    this.collidersBoxes.renderable = !!value;
  }

  moveOnTick({deltaMS}) {
    if (this.isRunning) {
      const dy = this.baseSpeed * deltaMS * 0.001;
      this.map.move(dy);

      if (this.testCollisions) {
        this.testPlayersCollisions(this.player1, this.player2);
        this.testPlayerCollisions(this.player1);
        this.testPlayerCollisions(this.player2);
      }
    }
  }

  run() {
    this.isRunning = true;
  }
  pause() {
    this.isRunning = false;
  }

  gameOver() {
    this.isRunning = false;
    const go = this.addChild(new BitmapText({text: 'Game Over', style: FONT_HEADER}));
    go.x = Math.floor(WIDTH / 2 - go.width / 2);
    go.y = Math.floor(HEIGHT / 2 - go.height / 2);
    const onKeyDown = (key) => {
      if (key === 'select' || key === 'start') {
        msg.off('keydown', onKeyDown);
        this.game.mainMenu();
      }
    }
    msg.on('keydown', onKeyDown);
  }

  shipCollided(ship, shipPart, ship2, ship2Part) {
    this.testCollisions = false;
    ship.crash(shipPart);

    if (ship2) {
      ship2.crash(ship2Part);
    } else {
      const otherShip = (ship === this.player1) ? this.player2 : this.player1;
      otherShip?.fallback();
    }
    this.smoothStop();
  }

  smoothStop() {
    gsap.to(this, {baseSpeed: 0, ease: "power1.in", duration: 2, onComplete: () => this.gameOver()});
  }

  /**
   *
   * @param {Container} player1
   * @param {Container} player2
   */
  testPlayersCollisions(player1, player2) {
    if (!player1 || !player2 || player1 === player2) return;
    const ship1Bounds = player1.getBounds();
    const ship2Bounds = player2.getBounds();

    if (ship1Bounds.rectangle.intersects(ship2Bounds)) {
      const ship1Colliders = player1.getColliders();
      const ship2Colliders = player2.getColliders();
      for (const s1col of ship1Colliders) {
        for (const s2col of ship2Colliders) {
          if (s1col.intersects(s2col)) {
            return this.shipCollided(player1, s1col, player2, s2col);
          }
        }
      }
    }
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
      this.shipCollided(player, collidingParts[0]);
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
