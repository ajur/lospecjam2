import { FONT_HEADER, HEIGHT, TILE_SIZE, WIDTH } from "~/consts";
import { BitmapText, Container, Graphics, Ticker } from "pixi.js";
import gsap from "gsap";

import { Map } from "./Map";
import { PlayerShip } from "./PlayerShip";
import { addDebugPane } from "~/fw/debug";
import msg from "~/fw/msg.js";
import { EnemyBig, EnemySmall } from "~/game/Enemy.js";
import { rand } from "~/fw/Random.js";


const LAST_LANE = HEIGHT - 12;
const LANE_STEP = 18;
const LANES_COUNT = 3;


export class GameScene extends Container {
  constructor(game, player1controller, player2controller) {
    super();

    this.game = game;

    this.map = this.addChild(new Map({
      width: WIDTH, height: HEIGHT, tileSize: TILE_SIZE, randomize: game.settings.randomMap
    }));

    this.projectiles = this.addChild(new Container());

    this.enemies = this.addChild(new Container());
    this.lastSpawn = -2;

    this.lanes = getLanes(LANES_COUNT);

    this.player1 = player1controller && this.addChild(
      new PlayerShip({
        type: "red",
        controller: player1controller,
        lanes: this.lanes,
        freeMovement: game.settings.freeMovement,
        addProjectile: (p) => {
          console.log('add projectile', p);
          this.projectiles.addChild(p)
          console.log('projectiles: ', this.projectiles.children.length)
        }
      })
    );
    this.player2 = player2controller && this.addChild(
      new PlayerShip({
        type: "green",
        controller: player2controller,
        lanes: this.lanes,
        freeMovement: game.settings.freeMovement,
        addProjectile: (p) => this.projectiles.addChild(p)
      })
    );

    this.twoPlayersCanCollide = this.game.settings.friendlyCollisions && this.player1 && this.player2;

    this.collidersBoxes = this.addChild(new Graphics());
    this.collidersBoxes.renderable = false;

    this.isRunning = true;
    this.testCollisions = false;

    this.distance = 0;
    this.level = 0;

    this.baseSpeed = 32; // px per second
    this.speed = 0; // px per second

    this.removeDebugPane = addDebugPane("GameScene", (pane) => {
      pane.expanded = false;
      pane.addBinding(this, "baseSpeed", { min: 1, max: 256, step: 1 });
      pane.addBinding(this, "level", {min: 1, max: 256, step: 1});
      pane.addBinding(this, "distance", {readonly: true});
      pane.addBinding(this, "distanceTiles", {readonly: true});
      pane.addBinding(this, "showCollisions");
    });

    msg.on('keydown', this.onKeyDown, this);

    Ticker.shared.add(this.moveOnTick, this);

    this.startRun();
  }

  get distanceTiles() {
    return Math.floor(this.distance / TILE_SIZE);
  }

  startRun() {
    const p1Lane = this.lanes.length - (this.player2 ? 2 : 1);
    const p2Lane = this.lanes.length - 1;
    this.player1?.deploy({
      x: WIDTH / 2 - 6,
      yStart: this.lanes[p1Lane] + this.lanes.length * LANE_STEP,
      currentLane: p1Lane
    });
    this.player2?.deploy({
      x: WIDTH / 2 + 6,
      yStart: this.lanes[p2Lane] + this.lanes.length * LANE_STEP,
      currentLane: p2Lane
    });
    gsap.to(this, {speed: this.baseSpeed, duration: 1, onComplete: () => {
      this.testCollisions = true;
    }});
  }

  destroy(options) {
    msg.off('keydown', this.onKeyDown, this);
    Ticker.shared.remove(this.moveOnTick, this);
    gsap.killTweensOf(this);
    this.removeDebugPane();
    super.destroy(options);
  }

  moveOnTick({ deltaTime, deltaMS }) {
    if (this.isRunning) {
      // move map, update positions
      const dy = this.speed * deltaMS * 0.001;
      this.distance += dy;
      this.map.move(dy);
      for (const en of this.enemies.children) {
        en.update(dy);
      }
      for (const proj of this.projectiles.children) {
        proj.update(deltaTime);
      }

      // test collisions
      if (this.testCollisions) {
        if (this.twoPlayersCanCollide) {
          this.testPlayersCollisions(this.player1, this.player2);
        }
        this.player1 && this.testPlayerCollisions(this.player1);
        this.player2 && this.testPlayerCollisions(this.player2);

        this.testProjectileCollisions();

        // debug stuff
        this.drawCollisionBoxes()
      }

      // spawn enemies
      if (this.distanceTiles % 2 === 0 && this.lastSpawn !== this.distanceTiles) {
        this.lastSpawn = this.distanceTiles;
        const spawnRange = this.map.getCurrentSpawnRange();
        const EnemyCon = rand.bool() ? EnemySmall : EnemyBig;
        this.enemies.addChild(new EnemyCon({
          spawnRange,
          addProjectile: (p) => this.projectiles.addChild(p)
        }));
      }
    }
  }

  onKeyDown(key) {
    if (key === 'select') {
      if (this.isRunning) {
        this.pause();
      } else {
        this.game.mainMenu();
      }
    }
    if (!this.isRunning && this.testCollisions && (key === 'start' || key === 'primary')) {
      this.resume();
    }
  }

  resume() {
    this.isRunning = true;
    msg.emit('resume');
    this.pauseText.destroy();
    this.pauseText = null;
  }

  pause() {
    this.isRunning = false;
    msg.emit('pause');

    this.pauseText = this.addChild(
      new BitmapText({ text: "Pause", style: FONT_HEADER })
    );
    this.pauseText.x = Math.floor(WIDTH / 2 - this.pauseText.width / 2);
    this.pauseText.y = Math.floor(HEIGHT / 2 - this.pauseText.height / 2);
  }

  gameOver() {
    const go = this.addChild(
      new BitmapText({ text: "Game Over", style: FONT_HEADER })
    );
    go.x = Math.floor(WIDTH / 2 - go.width / 2);
    go.y = Math.floor(HEIGHT / 2 - go.height / 2);
    const onKeyDown = (key) => {
      if (key === "select" || key === "start") {
        msg.off("keydown", onKeyDown);
        gsap.killTweensOf(this);
        this.game.mainMenu();
      }
    };
    msg.on("keydown", onKeyDown);
  }

  shipCollided({ship, shipPart, ship2, ship2Part, enemy}) {
    this.testCollisions = false;
    ship.crash(shipPart);

    if (ship2) {
      ship2.crash(ship2Part);
    } else {
      const otherShip = ship === this.player1 ? this.player2 : this.player1;
      otherShip?.withdraw();
    }

    if (enemy) {
      enemy.crash();
    }

    this.smoothStop();
    this.gameOver();
  }

  smoothStop() {
    gsap.to(this, {speed: 0, ease: "power1.in", duration: 2, onComplete: () => {
      this.isRunning = false;
    }});
  }

  /**
   *
   * @param {PlayerShip} player1
   * @param {PlayerShip} player2
   */
  testPlayersCollisions(player1, player2) {
    const ship1Bounds = player1.getBounds();
    const ship2Bounds = player2.getBounds();

    if (ship1Bounds.rectangle.intersects(ship2Bounds)) {
      const ship1Colliders = player1.getColliders();
      const ship2Colliders = player2.getColliders();
      for (const s1col of ship1Colliders) {
        for (const s2col of ship2Colliders) {
          if (s1col.intersects(s2col)) {
            return this.shipCollided({
              ship: player1, shipPart: s1col, ship2: player2, ship2part: s2col
            });
          }
        }
      }
    }
  }

  testPlayerCollisions(player) {
    const shipBounds = player.getBounds();
    let shipColliders = player.getColliders();

    const mapColliders = this.map.getCollidersForBounds(shipBounds);
    if (mapColliders.length > 0) {
      for (const shipCol of shipColliders) {
        for (const mapCol of mapColliders) {
          if (shipCol.intersects(mapCol)) {
            this.shipCollided({ship: player, shipPart: shipCol});
            return true;
          }
        }
      }
    }

    const shipRect = shipBounds.rectangle;
    for (const enemy of this.enemies.children) {
      if (enemy.alive && shipRect.intersects(enemy.getBounds())) {
        const enemyColliders = enemy.getColliders();
        for (const enemyCol of enemyColliders) {
          for (const shipCol of shipColliders) {
            if (shipCol.intersects(enemyCol)) {
              this.shipCollided({
                ship: player, shipPart: shipCol, enemy
              });
              return true;
            }
          }
        }
      }
    }
  }

  testProjectileCollisions() {
    for (const projectile of this.projectiles.children) {
      const pRect = projectile.getCollider();
      if (this.testProjectileCollidesWithEnemy(pRect, projectile) || this.map.getCollidersForBounds(pRect).length > 0) {
        projectile.destroy({children: true});
      }
    }
  }

  testProjectileCollidesWithEnemy(pRect) {
    for (const enemy of this.enemies.children) {
      if (!enemy.alive) continue;
      for (const collider of enemy.getColliders()) {
        if (pRect.intersects(collider)) {
          enemy.crash();
          return true;
        }
      }
    }
    return false;
  }


  get showCollisions() {
    return this.collidersBoxes.renderable;
  }

  set showCollisions(value) {
    this.collidersBoxes.renderable = !!value;
  }

  drawCollisionBoxes() {
    if (!this.showCollisions) return;

    this.collidersBoxes.clear();

    const shipColliders = [];
    const mapColliders = [];

    if (this.player1) {
      shipColliders.push(...this.player1.getColliders());
      mapColliders.push(this.map.getCollidersForBounds(this.player1.getBounds()));
    }
    if (this.player2) {
      shipColliders.push(...this.player2.getColliders());
      mapColliders.push(this.map.getCollidersForBounds(this.player2.getBounds()));
    }

    for (const mapCollider of mapColliders) {
      this.collidersBoxes
        .rect(mapCollider.x, mapCollider.y, mapCollider.width, mapCollider.height)
        .fill({color: 0x00ffff, alpha: 0.3});
    }
    for (const shipCollider of shipColliders) {
      this.collidersBoxes
        .rect(shipCollider.x, shipCollider.y, shipCollider.width, shipCollider.height)
        .fill({color: 0x0000ff, alpha: 0.7});
    }
    for (const enemy of this.enemies.children) {
      const enemyColliders = enemy.getColliders();
      for (const collider of enemyColliders) {
        this.collidersBoxes
          .rect(collider.x, collider.y, collider.width, collider.height)
          .fill({color: 0x0000ff, alpha: 0.3});
      }
    }
    for (const projectile of this.projectiles.children) {
      const collider = projectile.getCollider();
      this.collidersBoxes
        .rect(collider.x, collider.y, collider.width, collider.height)
        .fill({color: 0xff0000, alpha: 0.5});
    }
  }
}


function getLanes(num) {
  return Array.from({length: num}, (_, idx) => LAST_LANE - idx * LANE_STEP).sort();
}


function testCollisions({map, players, enemies, projectiles}) {
  const [player1, player2] = players;
}
