import { showBombExplosion, showDamageText, showHealSpark, showHitSpark, launchHeartAttack, updateCoins } from './ui.js';
import { updateCurrentBall } from './ui.js';
import { updateAttackCountdown } from './ui.js';
import { playerState } from './player.js';
import { enemyState } from './enemy.js';
import { healBallPath, healBallWidth } from './constants.js';

const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;
const width = 880;
const height = 700;
const pegCategory = 0x0002;
const wallCategory = 0x0004;
const sensorCategory = 0x0008;

let engine;
let world;
let render;
let runner;
export const firePoint = { x: width / 2, y: 50 };
let aimSvg;
let pegs = [];
let initialPegCount = 0;
let ghostEngine;
let ghostBall;
let currentShotHits = 0;
const comboThreshold = 20;
const comboBonusDamage = 50;

function createGhostEngine() {
  ghostEngine = Engine.create({ gravity: engine.gravity });
  ghostBall = Bodies.circle(firePoint.x, firePoint.y, 15, {
    isSensor: true,
    render: { visible: false }
  });
  World.add(ghostEngine.world, ghostBall);
}

export function initEngine() {
  engine = Engine.create();
  world = engine.world;
  render = Render.create({
    element: document.getElementById('game-wrapper'),
    engine,
    options: { width, height, wireframes: false, background: '#fff0f5' }
  });
  Render.run(render);
  runner = Runner.create();
  Runner.run(runner, engine);

  Events.on(engine, 'beforeUpdate', () => {
    playerState.currentBalls.forEach(ball => {
      if (ball.ballType === 'penetration' && (ball.velocity.x || ball.velocity.y)) {
        const angle = Math.atan2(ball.velocity.y, ball.velocity.x) + Math.PI / 2;
        Body.setAngle(ball, angle);
      }
    });
  });

  const wallOptions = {
    isStatic: true,
    render: { fillStyle: '#ff69b4' },
    collisionFilter: { category: wallCategory }
  };
  const walls = [
    Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions),
    Bodies.rectangle(width / 2, -25, width, 50, wallOptions),
    Bodies.rectangle(-25, height / 2, 50, height, wallOptions),
    Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions)
  ];
  World.add(world, walls);

  const bottomSensor = Bodies.rectangle(width / 2, height - 10, width, 20, {
    isStatic: true,
    isSensor: true,
    label: 'bottom-sensor',
    render: { visible: false },
    collisionFilter: { category: sensorCategory }
  });
  World.add(world, bottomSensor);

  aimSvg = document.getElementById('aim-svg');
  createGhostEngine();
}

export function generatePegs(count) {
  initialPegCount = count;
  pegs.forEach((p) => World.remove(world, p));
  pegs = [];
  for (let i = 0; i < count; i++) {
    const x = 50 + Math.random() * (width - 100);
    const y = 150 + Math.random() * (height - 250);
    const r = Math.random();
    let peg;
    if (r < 0.05) {
      peg = Bodies.circle(x, y, 10, {
        isStatic: true,
        isSensor: true,
        render: {
          sprite: {
            texture: './image/items/coin.png',
            xScale: 0.04,
            yScale: 0.04
          }
        },
        label: 'coin',
        collisionFilter: { category: pegCategory }
      });
    } else if (r < 0.15) {
      peg = Bodies.circle(x, y, 10, {
        isStatic: true,
        render: {
          sprite: {
            texture: './image/items/bomb.png',
            xScale: 0.06,
            yScale: 0.06
          }
        },
        label: 'peg-bomb',
        collisionFilter: { category: pegCategory }
      });
      peg.bombHits = 0;
    } else if (r < 0.35) {
      peg = Bodies.circle(x, y, 10, {
        isStatic: true,
        render: { fillStyle: '#ffd700' },
        label: 'peg-yellow',
        collisionFilter: { category: pegCategory }
      });
    } else {
      peg = Bodies.circle(x, y, 10, {
        isStatic: true,
        render: { fillStyle: '#ff69b4' },
        label: 'peg',
        collisionFilter: { category: pegCategory }
      });
    }
    pegs.push(peg);
  }
  const bx = 50 + Math.random() * (width - 100);
  const by = 150 + Math.random() * (height - 250);
  const bluePeg = Bodies.circle(bx, by, 10, {
    isStatic: true,
    render: { fillStyle: '#1e90ff' },
    label: 'peg-blue',
    collisionFilter: { category: pegCategory }
  });
  pegs.push(bluePeg);
  World.add(world, pegs);

  const hasCoin = pegs.some(p => p.label === 'coin');
  if (!hasCoin) {
    const cx = 50 + Math.random() * (width - 100);
    const cy = 150 + Math.random() * (height - 250);
    const coin = Bodies.circle(cx, cy, 10, {
      isStatic: true,
      isSensor: true,
      render: {
        sprite: {
          texture: './image/items/coin.png',
          xScale: 0.04,
          yScale: 0.04
        }
      },
      label: 'coin',
      collisionFilter: { category: pegCategory }
    });
    pegs.push(coin);
    World.add(world, coin);
  }
}

export function drawSimulatedPath(angle, speed) {
  while (aimSvg.firstChild) aimSvg.removeChild(aimSvg.firstChild);
  if (!ghostEngine || !ghostBall) {
    createGhostEngine();
  }
  if (!ghostEngine.world.bodies.includes(ghostBall)) {
    World.add(ghostEngine.world, ghostBall);
  }
  Body.setPosition(ghostBall, firePoint);
  Body.setVelocity(ghostBall, {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed
  });
  const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  startDot.setAttribute('cx', firePoint.x);
  startDot.setAttribute('cy', firePoint.y);
  startDot.setAttribute('r', 3);
  startDot.setAttribute('class', 'aim-dot');
  aimSvg.appendChild(startDot);
  for (let i = 0; i < 20; i++) {
    Engine.update(ghostEngine, 1000 / 60);
    const { x, y } = ghostBall.position;
    if (x < 0 || x > width || y < 0 || y > height) break;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', 3);
    dot.setAttribute('class', 'aim-dot');
    aimSvg.appendChild(dot);
  }
}

export function clearSimulatedPath() {
  while (aimSvg.firstChild) aimSvg.removeChild(aimSvg.firstChild);
  if (ghostEngine) {
    World.clear(ghostEngine.world, false);
    Engine.clear(ghostEngine);
  }
  ghostEngine = null;
  ghostBall = null;
}

export function shootBall(angle, type) {
  const power = 10;
  const lvl = playerState.ballLevels[type] || 1;
  const dmgMul = 1 + (lvl - 1) * 0.2;
  const sizeMul = 1 + (lvl - 1) * 0.1;
  if (type === 'split') {
    const offset = 0.2;
    const radius = 15 * sizeMul;
    const scale = (radius * 2) / healBallWidth;
    for (let i = -1; i <= 1; i += 2) {
      const a = angle + i * offset;
      const ball = Bodies.circle(firePoint.x, firePoint.y, radius, {
        restitution: 0.9,
        render: {
          sprite: {
            texture: './image/balls/split_ball.png',
            xScale: scale,
            yScale: scale
          }
        },
        label: 'ball'
      });
      ball.damageMultiplier = 0.5 * dmgMul;
      ball.ballType = 'split';
      Body.setVelocity(ball, { x: Math.cos(a) * power, y: Math.sin(a) * power });
      World.add(world, ball);
      playerState.currentBalls.push(ball);
    }
  } else if (type === 'penetration') {
    const base = 20;
    const radius = base * sizeMul;
    const scale = (radius * 2) / healBallWidth;
    const options = {
      restitution: 0,
      friction: 0,
      label: 'ball',
      collisionFilter: { mask: wallCategory | sensorCategory },
      render: {
        sprite: {
          texture: './image/balls/penetration_ball.png',
          xScale: scale,
          yScale: scale,
          xOffset: 0.5,
          yOffset: 1
        }
      }
    };
    const ball = Bodies.circle(firePoint.x, firePoint.y, radius, options);
    ball.damageMultiplier = dmgMul;
    ball.ballType = 'penetration';
    Body.setVelocity(ball, { x: Math.cos(angle) * power, y: Math.sin(angle) * power });
    Body.setAngle(ball, Math.PI / 2);
    World.add(world, ball);
    playerState.currentBalls.push(ball);
  } else {
    const base = type === 'big' ? 30 : 15;
    const radius = base * sizeMul;
    const scale = (radius * 2) / healBallWidth;
    const options = {
      restitution: 0.9,
      label: 'ball',
      render: {
        sprite: {
          texture:
            type === 'heal'
              ? healBallPath
              : type === 'big'
              ? './image/balls/big_ball.png'
              : './image/balls/normal_ball.png',
          xScale: scale,
          yScale: scale
        }
      }
    };
    const ball = Bodies.circle(firePoint.x, firePoint.y, radius, options);
    ball.damageMultiplier = dmgMul;
    ball.ballType = type;
    Body.setVelocity(ball, { x: Math.cos(angle) * power, y: Math.sin(angle) * power });
    World.add(world, ball);
    playerState.currentBalls.push(ball);
  }
  playerState.currentShotType = type;
  playerState.nextBall = null;
  updateCurrentBall(firePoint);
}

function handlePenetrationHits() {
  const penetrationBalls = playerState.currentBalls.filter(b => b.ballType === 'penetration');
  if (penetrationBalls.length === 0) return;
  penetrationBalls.forEach(ball => {
    pegs.slice().forEach(peg => {
      const dx = ball.position.x - peg.position.x;
      const dy = ball.position.y - peg.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = (ball.circleRadius || 0) + (peg.circleRadius || 0);
      if (dist > radius) return;
      if (peg.label === 'peg-bomb') {
        if (!peg.bombHits) {
          peg.bombHits = 1;
          peg.render.sprite.texture = './image/items/bomb_2.png';
        } else {
          explodeBomb(peg, ball);
        }
      } else if (peg.label === 'peg-blue') {
        World.remove(world, peg);
        pegs = pegs.filter(p => p !== peg);
        currentShotHits++;
        let damage = 10;
        damage *= ball.damageMultiplier || 1;
        damage *= 1 + playerState.atkLevel * 0.1;
        enemyState.pendingDamage += damage;
        showDamageText(Math.round(peg.position.x), Math.round(peg.position.y), '+' + Math.round(enemyState.pendingDamage), ball.ballType === 'heal');
        if (ball.ballType === 'heal') {
          showHealSpark(peg.position.x, peg.position.y);
        } else {
          showHitSpark(peg.position.x, peg.position.y);
        }
        generatePegs(initialPegCount);
      } else if (peg.label === 'coin') {
        World.remove(world, peg);
        pegs = pegs.filter(p => p !== peg);
        currentShotHits++;
        const gain = enemyState.stage;
        playerState.coins += gain;
        localStorage.setItem('coins', playerState.coins);
        updateCoins();
      } else if (peg.label === 'peg' || peg.label === 'peg-yellow') {
        World.remove(world, peg);
        pegs = pegs.filter(p => p !== peg);
        currentShotHits++;
        let damage = peg.label === 'peg-yellow' ? 20 : 10;
        damage *= ball.damageMultiplier || 1;
        damage *= 1 + playerState.atkLevel * 0.1;
        enemyState.pendingDamage += damage;
        showDamageText(Math.round(peg.position.x), Math.round(peg.position.y), '+' + Math.round(enemyState.pendingDamage), ball.ballType === 'heal');
        if (ball.ballType === 'heal') {
          showHealSpark(peg.position.x, peg.position.y);
        } else {
          showHitSpark(peg.position.x, peg.position.y);
        }
      }
    });
  });
}

export function setupCollisionHandler() {
  Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes('ball') && labels.includes('peg-bomb')) {
        const peg = pair.bodyA.label === 'peg-bomb' ? pair.bodyA : pair.bodyB;
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        if (!peg.bombHits) {
          peg.bombHits = 1;
          peg.render.sprite.texture = './image/items/bomb_2.png';
        } else {
          explodeBomb(peg, ball);
        }
      } else if (labels.includes('ball') && labels.includes('peg-blue')) {
        const peg = pair.bodyA.label === 'peg-blue' ? pair.bodyA : pair.bodyB;
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        World.remove(world, peg);
        pegs = pegs.filter(p => p !== peg);
        currentShotHits++;
        let damage = 10;
        damage *= ball.damageMultiplier || 1;
        damage *= 1 + playerState.atkLevel * 0.1;
        enemyState.pendingDamage += damage;
        showDamageText(Math.round(peg.position.x), Math.round(peg.position.y), '+' + Math.round(enemyState.pendingDamage), ball.ballType === 'heal');
        if (ball.ballType === 'heal') {
          showHealSpark(peg.position.x, peg.position.y);
        } else {
          showHitSpark(peg.position.x, peg.position.y);
        }
        generatePegs(initialPegCount);
      } else if (labels.includes('ball') && labels.includes('coin')) {
        const coin = pair.bodyA.label === 'coin' ? pair.bodyA : pair.bodyB;
        World.remove(world, coin);
        pegs = pegs.filter(p => p !== coin);
        currentShotHits++;
        const gain = enemyState.stage;
        playerState.coins += gain;
        localStorage.setItem('coins', playerState.coins);
        updateCoins();
      } else if (labels.includes('ball') && (labels.includes('peg') || labels.includes('peg-yellow'))) {
        const peg = pair.bodyA.label === 'ball' ? pair.bodyB : pair.bodyA;
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        World.remove(world, peg);
        pegs = pegs.filter(p => p !== peg);
        currentShotHits++;
        let damage = peg.label === 'peg-yellow' ? 20 : 10;
        damage *= ball.damageMultiplier || 1;
        damage *= 1 + playerState.atkLevel * 0.1;
        enemyState.pendingDamage += damage;
        showDamageText(Math.round(peg.position.x), Math.round(peg.position.y), '+' + Math.round(enemyState.pendingDamage), ball.ballType === 'heal');
        if (ball.ballType === 'heal') {
          showHealSpark(peg.position.x, peg.position.y);
        } else {
          showHitSpark(peg.position.x, peg.position.y);
        }
      }
      if (labels.includes('ball') && labels.includes('bottom-sensor')) {
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        const { x, y } = ball.position;
        World.remove(world, ball);
        playerState.currentBalls = playerState.currentBalls.filter(b => b !== ball);
        if (playerState.currentBalls.length === 0) {
          if (currentShotHits >= comboThreshold) {
            enemyState.pendingDamage += comboBonusDamage;
            showDamageText(Math.round(x), Math.round(y), 'コンボ！');
          }
          let totalDamage = enemyState.pendingDamage;
          if (playerState.currentShotType !== 'heal') {
            totalDamage = Math.min(totalDamage, Math.max(enemyState.enemyHP, 0));
          }
          if (playerState.currentShotType === 'heal') {
            playerState.playerHP = Math.min(playerState.playerMaxHP, playerState.playerHP + totalDamage);
            enemyState.updatePlayerHP();
            showDamageText(Math.round(x), Math.round(y), '+' + Math.round(totalDamage), true);
            showHealSpark(x, y);
          } else {
            if (totalDamage > 0) {
              enemyState.enemyHP -= totalDamage;
              enemyState.updateHPBar();
              enemyState.flashEnemyDamage();
              showDamageText(Math.round(x), Math.round(y), '-' + Math.round(totalDamage));
              showHitSpark(x, y);
            }
          }
          enemyState.pendingDamage = 0;
          playerState.currentShotType = null;
          currentShotHits = 0;
          enemyState.attackCountdown--;
          if (enemyState.attackCountdown <= 0 && enemyState.enemyHP > 0) {
            enemyState.enemyAttack();
            launchHeartAttack();
          } else {
            updateAttackCountdown(enemyState);
          }
          document.dispatchEvent(new Event('ballsCleared'));
        }
      }
    });
  });
  Events.on(engine, 'afterUpdate', handlePenetrationHits);
}

export function explodeBomb(peg, ball) {
  const { x, y } = peg.position;
  showBombExplosion(x, y);
  const bodies = Composite.allBodies(engine.world);
  bodies.forEach(body => {
    if (['peg', 'peg-yellow', 'peg-bomb'].includes(body.label)) {
      const dx = body.position.x - x;
      const dy = body.position.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= 80) {
        World.remove(world, body);
        pegs = pegs.filter(p => p !== body);
        currentShotHits++;
        let dmg = body.label === 'peg-yellow' ? 20 : 10;
        dmg *= ball.damageMultiplier || 1;
        dmg *= 1 + playerState.atkLevel * 0.1;
        enemyState.pendingDamage += dmg;
        showDamageText(Math.round(body.position.x), Math.round(body.position.y), '+' + Math.round(enemyState.pendingDamage), ball.ballType === 'heal');
        if (ball.ballType === 'heal') {
          showHealSpark(body.position.x, body.position.y);
        } else {
          showHitSpark(body.position.x, body.position.y);
        }
      }
    }
  });
  const bx = ball.position.x - x;
  const by = ball.position.y - y;
  const len = Math.sqrt(bx * bx + by * by) || 1;
  Body.setVelocity(ball, { x: (bx / len) * 20, y: (by / len) * 20 });
}

export { engine, world, render, runner };

