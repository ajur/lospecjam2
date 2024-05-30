import { COLOR_STEEL_BLUE, FONT_HEADER, HEIGHT, TILE_SIZE, WIDTH } from "~/consts";
import { BitmapText, Container, Graphics, Ticker } from "pixi.js";
import gsap from "gsap";

import { Map } from "./Map";
import { PlayerShip } from "./PlayerShip";
import { addDebugPane } from "~/fw/debug";
import msg from "~/fw/msg.js";
import { EnemyBig, EnemySmall } from "~/game/Enemy.js";
import { rand } from "~/fw/Random.js";
import { PPPContainer } from "~/fw/pixiTools.js";
import { Menu } from "~/ui/Menu.js";
import { HUD } from "~/ui/HUD.js";
import { Background } from "~/game/Background.js";


const LAST_LANE = HEIGHT - 12;
const LANE_STEP = 18;
const LANES_COUNT = 3;


export class GameScene extends PPPContainer {

  constructor(game) {
    super();

    this.game = game;

    this.bkg = this.addChild(new Background({
      width: WIDTH, height: HEIGHT, tileSize: TILE_SIZE
    }));

    this.map = this.addChild(new Map({
      width: WIDTH, height: HEIGHT, tileSize: TILE_SIZE, randomize: game.settings.randomMap
    }));

    this.projectiles = this.addChild(new Container());

    this.enemies = this.addChild(new Container());
    this.spawnEveryNTile = 3;
    this.lastSpawn = -2;


    this.lanes = getLanes(LANES_COUNT);

    this.player1 = game.player1controller && this.addChild(
      new PlayerShip({
        type: "red",
        controller: game.player1controller,
        lanes: this.lanes,
        freeMovement: game.settings.freeMovement,
        addProjectile: (p) => this.projectiles.addChild(p),
        onEnergyChanged: (v) => this.hud.setPlayer1Energy(v)
      })
    );
    this.player2 = game.player2controller && this.addChild(
      new PlayerShip({
        type: "green",
        controller: game.player2controller,
        lanes: this.lanes,
        freeMovement: game.settings.freeMovement,
        addProjectile: (p) => this.projectiles.addChild(p),
        onEnergyChanged: (v) => this.hud.setPlayer2Energy(v)
      })
    );

    this.twoPlayersCanCollide = this.game.settings.friendlyCollisions && this.player1 && this.player2;

    this.collidersBoxes = this.addChild(new Graphics());
    this.collidersBoxes.renderable = false;

    this.hud = this.addChild(new HUD({game}));

    this.isRunning = true;
    this.testCollisions = false;

    this.distance = 0;
    this.level = 0;
    this.score = 0;

    this.baseSpeed = 32; // px per second
    this.speed = 0; // px per second

    this.removeDebugPane = addDebugPane("GameScene", (pane) => {
      pane.expanded = false;
      pane.addBinding(this, "baseSpeed", { min: 1, max: 256, step: 1 });
      pane.addBinding(this, "level", {readonly: true});
      pane.addBinding(this, "score", {readonly: true});
      pane.addBinding(this, "distance", {readonly: true});
      pane.addBinding(this, "distanceTiles", {readonly: true});
      pane.addBinding(this, "showCollisions");
    });

    msg.on('keydown', this.onKeyDown, this);
    msg.on('enemyHit', this.onEnemyHit, this);

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

  addPoints(val) {
    this.score += val;
    this.hud.setScore(this.score);
  }

  destroy(options) {
    msg.off('keydown', this.onKeyDown, this);
    msg.off('enemyHit', this.onEnemyHit, this);
    Ticker.shared.remove(this.moveOnTick, this);
    gsap.killTweensOf(this);
    this.removeDebugPane();
    super.destroy(options);
  }

  moveOnTick({ deltaTime, deltaMS }) {
    if (this.isRunning) {
      // move map, update positions
      const dy = this.speed * deltaMS * 0.001;
      const dTiles = this.distanceTiles;

      this.bkg.move(dy);
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
      if (this.distanceTiles % this.spawnEveryNTile === 0 && this.lastSpawn !== this.distanceTiles) {
        this.lastSpawn = this.distanceTiles;
        const spawnRange = this.map.getCurrentSpawnRange();
        const EnemyCon = rand.bool() ? EnemySmall : EnemyBig;
        this.enemies.addChild(new EnemyCon({
          spawnRange,
          addProjectile: (p) => this.projectiles.addChild(p)
        }));
      }

      // points for travel
      this.distance += dy;
      const ddTiles = this.distanceTiles - dTiles;
      if (ddTiles > 0) {
        this.addPoints(ddTiles);
      }
    }
  }

  onKeyDown(key) {
    if (this.game.inTransition) return;
    if (this.isRunning && key === 'select') {
      this.pause();
    }
  }

  resume() {
    this.isRunning = true;
    msg.emit('resume');
    this.pauseMenu.destroy();
  }

  pause() {
    this.isRunning = false;
    msg.emit('pause');

    this.pauseMenu = this.addChild(new Menu({
      title: "Paused",
      isSubMenu: false,
      game: this.game,
      background: true,
      entriesSpec: [
        {label: "Resume", action: () => this.resume()},
        {label: "Withdraw", action: () => this.game.gotoMainMenu()}
      ]
    }));
    this.pauseMenu.x = Math.floor(WIDTH / 2);
    this.pauseMenu.y = 96;
  }

  gameOver() {
    this.isRunning = false;
    this.projectiles.visible = false;

    const menu = this.addChild(new Menu({
      title: "Game Over",
      isSubMenu: false,
      background: true,
      game: this.game,
      innerText: new BitmapText({
        text: "" + this.score,
        style: {...FONT_HEADER, fill: COLOR_STEEL_BLUE}
      }),
      entriesSpec: [{
        label: "Main menu",
        action: () => {
          gsap.killTweensOf(this);
          this.game.gotoMainMenu();
        }},
      ],
      delayInput: 500
    }));
    menu.x = Math.floor(WIDTH / 2);
    menu.y = 96;
  }

  shipCollided({ship, shipPart, ship2, ship2Part, enemy, enemyPart}) {
    this.testCollisions = false;
    ship.crash(shipPart);

    if (ship2) {
      ship2.crash(ship2Part);
    } else {
      const otherShip = ship === this.player1 ? this.player2 : this.player1;
      otherShip?.withdraw();
    }

    if (enemy) {
      this.enemyCollided({enemy, enemyPart});
    }

    this.smoothStop();
    this.gameOver();
  }

  enemyCollided({enemy, enemyPart}) {
    enemy.crash(enemyPart);
  }

  onEnemyHit({destroyed = false, wasDamaged = false, size}) {
    let pointsToAdd = 5;
    if (destroyed) {
      if (size === "small") pointsToAdd += 5;
      if (size === "big") pointsToAdd +=  wasDamaged ? 10 : 20;
    }
    this.addPoints(pointsToAdd);
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
              ship: player1, shipPart: s1col, ship2: player2, ship2Part: s2col
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
                ship: player, shipPart: shipCol, enemy, enemyPart: enemyCol
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

      let collision = this.testProjectileCollidesWithPlayers(pRect, projectile.shooter);
      !collision && !projectile.shooter?.isEnemy && (collision = this.testProjectileCollidesWithEnemy(pRect));
      !collision && (collision = this.map.getCollidersForBounds(pRect).length > 0);

      if (collision?.ship) this.shipCollided(collision);
      if (collision?.enemy) this.enemyCollided(collision);
      if (collision) projectile.destroy({children: true});
    }
  }

  testProjectileCollidesWithPlayers(pRect, dontCollideWith) {
    for (const player of [this.player1, this.player2]) {
      if (player && player !== dontCollideWith) {
        for (const collider of player.getColliders()) {
          if (pRect.intersects(collider)) {
            return {ship: player, shipPart: collider};
          }
        }
      }
    }
    return false;
  }

  testProjectileCollidesWithEnemy(pRect) {
    for (const enemy of this.enemies.children) {
      if (!enemy.alive) continue;
      for (const collider of enemy.getColliders()) {
        if (pRect.intersects(collider)) {
          return {enemy, enemyPart: collider};
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
