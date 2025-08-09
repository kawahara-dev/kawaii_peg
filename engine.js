import { showBombExplosion, showDamageText, showHealSpark, showHitSpark, launchHeartAttack, updateCoins } from './ui.js';
import { updateCurrentBall } from './ui.js';
import { playerState } from './player.js';
import { enemyState } from './enemy.js';

const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;
const width = 880;
const height = 700;

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

  const wallOptions = { isStatic: true, render: { fillStyle: '#ff69b4' } };
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
    render: { visible: false }
  });
  World.add(world, bottomSensor);

  aimSvg = document.getElementById('aim-svg');
  createGhostEngine();
}

export function generatePegs(count) {
  initialPegCount = count;
  pegs.forEach((p) => World.remove(world, p));
  pegs = [];
  for (let i = 0; i < count - 1; i++) {
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
            texture: 'image/coin.png',
            xScale: 0.25,
            yScale: 0.25
          }
        },
        label: 'coin'
      });
    } else if (r < 0.15) {
      peg = Bodies.circle(x, y, 10, {
        isStatic: true,
        render: { fillStyle: '#808080' },
        label: 'peg-bomb'
      });
      peg.bombHits = 0;
    } else if (r < 0.35) {
      peg = Bodies.circle(x, y, 10, {
        isStatic: true,
        render: { fillStyle: '#ffd700' },
        label: 'peg-yellow'
      });
    } else {
      peg = Bodies.circle(x, y, 10, {
        isStatic: true,
        render: { fillStyle: '#ff69b4' },
        label: 'peg'
      });
    }
    pegs.push(peg);
  }
  const bx = 50 + Math.random() * (width - 100);
  const by = 150 + Math.random() * (height - 250);
  const bluePeg = Bodies.circle(bx, by, 10, {
    isStatic: true,
    render: { fillStyle: '#1e90ff' },
    label: 'peg-blue'
  });
  pegs.push(bluePeg);
  World.add(world, pegs);
}

export function drawSimulatedPath(angle, speed) {
  while (aimSvg.firstChild) aimSvg.removeChild(aimSvg.firstChild);
  if (!ghostEngine) {
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
}

export function shootBall(angle, type) {
  const power = 10;
  const lvl = playerState.ballLevels[type] || 1;
  const dmgMul = 1 + (lvl - 1) * 0.2;
  const sizeMul = 1 + (lvl - 1) * 0.1;
  if (type === 'split') {
    const offset = 0.2;
    const radius = 15 * sizeMul;
    for (let i = -1; i <= 1; i += 2) {
      const a = angle + i * offset;
      const ball = Bodies.circle(firePoint.x, firePoint.y, radius, {
        restitution: 0.9,
        render: { fillStyle: '#dda0dd' },
        label: 'ball'
      });
      ball.damageMultiplier = 0.5 * dmgMul;
      ball.ballType = 'split';
      Body.setVelocity(ball, { x: Math.cos(a) * power, y: Math.sin(a) * power });
      World.add(world, ball);
      playerState.currentBalls.push(ball);
    }
  } else {
    const base = type === 'big' ? 30 : 15;
    const radius = base * sizeMul;
    const color = type === 'big' ? '#ffa500' : (type === 'heal' ? '#90ee90' : '#00bfff');
    const ball = Bodies.circle(firePoint.x, firePoint.y, radius, {
      restitution: 0.9,
      render: { fillStyle: color },
      label: 'ball'
    });
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

export function setupCollisionHandler() {
  Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes('ball') && labels.includes('peg-bomb')) {
        const peg = pair.bodyA.label === 'peg-bomb' ? pair.bodyA : pair.bodyB;
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        if (!peg.bombHits) {
          peg.bombHits = 1;
          peg.render.fillStyle = '#ff4500';
        } else {
          explodeBomb(peg, ball);
        }
      } else if (labels.includes('ball') && labels.includes('peg-blue')) {
        const peg = pair.bodyA.label === 'peg-blue' ? pair.bodyA : pair.bodyB;
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        World.remove(world, peg);
        let damage = 10;
        damage *= ball.damageMultiplier || 1;
        damage *= 1 + playerState.atkLevel * 0.1;
        enemyState.pendingDamage += damage;
        showDamageText(peg.position.x, peg.position.y, '+' + enemyState.pendingDamage, ball.ballType === 'heal');
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
        playerState.coins += 1;
        localStorage.setItem('coins', playerState.coins);
        updateCoins();
      } else if (labels.includes('ball') && (labels.includes('peg') || labels.includes('peg-yellow'))) {
        const peg = pair.bodyA.label === 'ball' ? pair.bodyB : pair.bodyA;
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
        World.remove(world, peg);
        let damage = peg.label === 'peg-yellow' ? 20 : 10;
        damage *= ball.damageMultiplier || 1;
        damage *= 1 + playerState.atkLevel * 0.1;
        enemyState.pendingDamage += damage;
        showDamageText(peg.position.x, peg.position.y, '+' + enemyState.pendingDamage, ball.ballType === 'heal');
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
          let totalDamage = enemyState.pendingDamage;
          if (playerState.currentShotType !== 'heal') {
            totalDamage = Math.min(totalDamage, Math.max(enemyState.enemyHP, 0));
          }
          if (playerState.currentShotType === 'heal') {
            if (enemyState.enemyHP > 0) {
              enemyState.enemyAttack();
              launchHeartAttack();
            }
            playerState.playerHP = Math.min(playerState.playerMaxHP, playerState.playerHP + totalDamage);
            enemyState.updatePlayerHP();
            showDamageText(x, y, '+' + totalDamage, true);
            showHealSpark(x, y);
          } else {
            if (totalDamage > 0) {
              enemyState.enemyHP -= totalDamage;
              enemyState.updateHPBar();
              enemyState.flashEnemyDamage();
              showDamageText(x, y, '-' + totalDamage);
              showHitSpark(x, y);
            }
            if (enemyState.enemyHP > 0) {
              enemyState.enemyAttack();
              launchHeartAttack();
            }
          }
          enemyState.pendingDamage = 0;
          playerState.currentShotType = null;
          enemyState.selectNextBall();
        }
      }
    });
  });
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
        let dmg = body.label === 'peg-yellow' ? 20 : 10;
        dmg *= ball.damageMultiplier || 1;
        dmg *= 1 + playerState.atkLevel * 0.1;
        enemyState.pendingDamage += dmg;
        showDamageText(body.position.x, body.position.y, '+' + enemyState.pendingDamage, ball.ballType === 'heal');
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

