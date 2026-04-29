import { showBombExplosion, showComboBanner, showCriticalText, showDamageText, showHealSpark, showHitSpark, launchHeartAttack, screenShake, updateCoins, updateShotStats, updateCombatStats } from './ui.js';
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
let shotCombo = 0;
let shotTotalDamage = 0;
const MAX_ACTIVE_BALLS = 8;
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
  if (render) {
    Render.stop(render);
  }
  if (runner) {
    Runner.stop(runner);
  }
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

export function pauseRunner() {
  if (runner) {
    Runner.stop(runner);
  }
}

export function resumeRunner() {
  if (runner) {
    Runner.run(runner, engine);
  }
}

export function setTimeScale(scale) {
  if (engine) {
    engine.timing.timeScale = scale;
  }
}

export function generatePegs(count, isBoss = enemyState.nodeType === 'boss') {
  initialPegCount = count;
  pegs.forEach((p) => World.remove(world, p));
  pegs = [];
  const pegTypeConfig = {
    normal: { fillStyle: '#ff69b4', baseDamage: 10 },
    critical: { fillStyle: '#ffd700', baseDamage: 20 },
    bomb: { sprite: './image/items/bomb.png', xScale: 0.06, yScale: 0.06, baseDamage: 10 },
    split: { fillStyle: '#7fffd4', baseDamage: 10 },
    rainbow: { fillStyle: '#9b5de5', baseDamage: 10 }
  };
  const specialRate = Math.min(0.65, 0.15 + enemyState.stage * 0.03);
  const pickPegType = () => {
    if (Math.random() >= specialRate) return 'normal';
    const r = Math.random();
    if (r < 0.25) return 'critical';
    if (r < 0.5) return 'bomb';
    if (r < 0.75) return 'split';
    return 'rainbow';
  };
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
      peg.pegType = 'coin';
    } else {
      const pegType = pickPegType();
      const cfg = pegTypeConfig[pegType];
      peg = Bodies.circle(x, y, 10, {
        isStatic: true,
        render: cfg.sprite
          ? { sprite: { texture: cfg.sprite, xScale: cfg.xScale, yScale: cfg.yScale } }
          : { fillStyle: cfg.fillStyle },
        label: 'peg',
        collisionFilter: { category: pegCategory }
      });
      peg.pegType = pegType;
      peg.baseDamage = cfg.baseDamage;
      if (pegType === 'bomb') peg.bombHits = 0;
    }
    pegs.push(peg);
  }
  if (isBoss) {
    const bx = 50 + Math.random() * (width - 100);
    const by = 150 + Math.random() * (height - 250);
    const rainbowPeg = Bodies.circle(bx, by, 10, {
      isStatic: true,
      render: { fillStyle: '#9b5de5' },
      label: 'peg',
      collisionFilter: { category: pegCategory }
    });
    rainbowPeg.pegType = 'rainbow';
    rainbowPeg.baseDamage = 10;
    pegs.push(rainbowPeg);
  }
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
    coin.pegType = 'coin';
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

function canSpawnBall(count = 1) {
  return playerState.currentBalls.length + count <= MAX_ACTIVE_BALLS;
}

export function shootBall(angle, type) {
  if (!canSpawnBall()) return;
  const power = 10;
  const lvl = playerState.ballLevels[type] || 1;
  const dmgMul = 1 + (lvl - 1) * 0.2;
  const sizeMul = 1 + (lvl - 1) * 0.1;
  if (type === 'split') {
    if (!canSpawnBall(2)) return;
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


function calculateHitDamage(baseDamage, ball, pegType = 'normal') {
  const comboScale = 1 + shotCombo * (playerState.comboBonus || 0);
  const rawBaseDamage = baseDamage + (playerState.baseDamage || 0);
  const comboDamage = rawBaseDamage * comboScale;
  let damage = comboDamage * (ball.damageMultiplier || 1) * (1 + playerState.atkLevel * 0.1);
  let isCritical = false;
  if (pegType === 'critical') {
    damage *= 2;
    isCritical = true;
  }
  if (Math.random() < playerState.critRate) {
    damage *= Math.max(playerState.critMultiplier || 1, 1);
    isCritical = true;
  }
  if (playerState.relics && playerState.relics.includes('damageBoost')) {
    damage += Math.floor(Math.random() * 3) + 1;
  }
  return { damage, isCritical };
}

function spawnSplitBalls(peg, ball) {
  if (!canSpawnBall(2)) return;
  const speed = 12;
  const radius = 10;
  [-0.35, 0.35].forEach(offset => {
    const extraBall = Bodies.circle(peg.position.x, peg.position.y, radius, {
      restitution: 0.9,
      label: 'ball',
      render: ball.render
    });
    extraBall.damageMultiplier = (ball.damageMultiplier || 1) * 0.7;
    extraBall.ballType = 'split';
    Body.setVelocity(extraBall, {
      x: Math.cos(offset) * speed,
      y: -Math.abs(Math.sin(offset) * speed)
    });
    World.add(world, extraBall);
    playerState.currentBalls.push(extraBall);
  });
}

function handlePegHit(peg, ball) {
  const pegType = peg.pegType || 'normal';
  if (pegType === 'bomb') {
    if (!peg.bombHits) {
      peg.bombHits = 1;
      peg.render.sprite.texture = './image/items/bomb_2.png';
      return;
    }
    explodeBomb(peg, ball);
    return;
  }
  World.remove(world, peg);
  pegs = pegs.filter(p => p !== peg);
  applyHit(peg.baseDamage || 10, ball, peg, pegType);
  if (pegType === 'split') spawnSplitBalls(peg, ball);
  if (pegType === 'rainbow') {
    shotCombo += 5;
    updateShotStats(shotCombo, shotTotalDamage);
    updateCombatStats();
  }
}

function applyHit(baseDamage, ball, peg, pegType = 'normal') {
  currentShotHits++;
  shotCombo++;
  const { damage, isCritical } = calculateHitDamage(baseDamage, ball, pegType);
  enemyState.pendingDamage += damage;
  shotTotalDamage += damage;
  updateShotStats(shotCombo, shotTotalDamage);
  showDamageText(Math.round(peg.position.x), Math.round(peg.position.y), '+' + Math.round(enemyState.pendingDamage), ball.ballType === 'heal');
  if (isCritical) showCriticalText(Math.round(peg.position.x), Math.round(peg.position.y));
  if (shotCombo >= 10) showComboBanner(shotCombo);
  if (ball.ballType === 'heal') {
    showHealSpark(peg.position.x, peg.position.y);
  } else {
    showHitSpark(peg.position.x, peg.position.y);
  }
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
      if (peg.label === 'coin') {
        World.remove(world, peg);
        pegs = pegs.filter(p => p !== peg);
        currentShotHits++;
        shotCombo++;
        updateShotStats(shotCombo, shotTotalDamage);
        const gain = enemyState.stage;
        playerState.coins += gain;
        localStorage.setItem('coins', playerState.coins);
        updateCoins();
      } else if (peg.label === 'peg') {
        handlePegHit(peg, ball);
      }
    });
  });
}

export function setupCollisionHandler() {
  Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes('ball') && labels.includes('coin')) {
        const coin = pair.bodyA.label === 'coin' ? pair.bodyA : pair.bodyB;
        World.remove(world, coin);
        pegs = pegs.filter(p => p !== coin);
        currentShotHits++;
        shotCombo++;
        updateShotStats(shotCombo, shotTotalDamage);
        const gain = enemyState.stage;
        playerState.coins += gain;
        localStorage.setItem('coins', playerState.coins);
        updateCoins();
      } else if (labels.includes('ball') && labels.includes('peg')) {
        const peg = pair.bodyA.label === 'ball' ? pair.bodyB : pair.bodyA;
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        handlePegHit(peg, ball);
      }
      if (labels.includes('ball') && labels.includes('bottom-sensor')) {
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        shotCombo = 0;
        updateShotStats(shotCombo, shotTotalDamage);
        if (playerState.relics && playerState.relics.includes('rebound') && Math.random() < 0.5) {
          Body.setPosition(ball, { x: ball.position.x, y: 0 });
          Body.setVelocity(ball, { x: 0, y: 20 });
          return;
        }
        const { x, y } = ball.position;
        World.remove(world, ball);
        playerState.currentBalls = playerState.currentBalls.filter(b => b !== ball);
        if (playerState.currentBalls.length === 0) {
          if (currentShotHits >= comboThreshold) {
            enemyState.pendingDamage += comboBonusDamage;
            showDamageText(Math.round(x), Math.round(y), 'コンボ！');
          }
          shotCombo = 0;
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
              if (totalDamage >= enemyState.maxEnemyHP * 0.08) {
                screenShake(14, 420);
              }
            }
          }
          enemyState.pendingDamage = 0;
          shotTotalDamage = 0;
          updateShotStats(shotCombo, shotTotalDamage);
          updateCombatStats();
          playerState.currentShotType = null;
          currentShotHits = 0;
          enemyState.attackCountdown--;
          if (playerState.relics && playerState.relics.includes('timeLag') && Math.random() < 0.2) {
            enemyState.attackCountdown++;
          }
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
    if (body.label === 'peg') {
      const dx = body.position.x - x;
      const dy = body.position.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= 80) {
        handlePegHit(body, ball);
      }
    }
  });
  const bx = ball.position.x - x;
  const by = ball.position.y - y;
  const len = Math.sqrt(bx * bx + by * by) || 1;
  Body.setVelocity(ball, { x: (bx / len) * 20, y: (by / len) * 20 });
}

export { engine, world, render, runner };
