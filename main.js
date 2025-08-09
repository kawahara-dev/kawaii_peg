import { initEngine, drawSimulatedPath, shootBall, setupCollisionHandler, firePoint } from './engine.js';
import { playerState } from './player.js';
import { enemyState, startStage } from './enemy.js';
import { updateAmmo, selectNextBall, updatePlayerHP } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  initEngine();
  setupCollisionHandler();

  playerState.ownedBalls = ['normal', 'normal', 'normal'];
  playerState.ballLevels = { normal: 1 };
  playerState.playerMaxHP = 100 + playerState.hpLevel * 10;
  playerState.playerHP = playerState.playerMaxHP;
  updatePlayerHP();

  const menuOverlay = document.getElementById('menu-overlay');
  const startButton = document.getElementById('start-button');
  const upgradeMenuButton = document.getElementById('upgrade-menu-button');
  const resetButton = document.getElementById('reset-progress');
  const upgradeButtons = document.getElementById('upgrade-buttons');
  const mainMenu = document.getElementById('main-menu');
  const upgradeHP = document.getElementById('upgrade-hp');
  const upgradeATK = document.getElementById('upgrade-atk');
  const xpDisplay = document.getElementById('xp-value');
  const xpOverlay = document.getElementById('xp-overlay');
  const xpContinue = document.getElementById('xp-continue-button');
  const rewardOverlay = document.getElementById('reward-overlay');
  const rewardButtons = document.querySelectorAll('.reward-button');
  const eventOverlay = document.getElementById('event-overlay');
  const eventContinue = document.getElementById('event-continue-button');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const gameOverRetry = document.getElementById('game-over-retry-button');

  startButton.addEventListener('click', () => {
    menuOverlay.style.display = 'none';
    enemyState.stage = 1;
    enemyState.gameOver = false;
    startStage();
  });

  upgradeMenuButton.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    upgradeButtons.style.display = 'flex';
    xpDisplay.textContent = playerState.permXP;
  });

  resetButton.addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });

  upgradeHP.addEventListener('click', () => {
    if (playerState.permXP >= 10) {
      playerState.permXP -= 10;
      playerState.hpLevel += 1;
      localStorage.setItem('permXP', playerState.permXP);
      localStorage.setItem('hpLevel', playerState.hpLevel);
      playerState.playerMaxHP = 100 + playerState.hpLevel * 10;
      playerState.playerHP = playerState.playerMaxHP;
      updatePlayerHP();
      xpDisplay.textContent = playerState.permXP;
    }
  });

  upgradeATK.addEventListener('click', () => {
    if (playerState.permXP >= 10) {
      playerState.permXP -= 10;
      playerState.atkLevel += 1;
      localStorage.setItem('permXP', playerState.permXP);
      localStorage.setItem('atkLevel', playerState.atkLevel);
      xpDisplay.textContent = playerState.permXP;
    }
  });

  xpContinue.addEventListener('click', () => {
    xpOverlay.style.display = 'none';
    menuOverlay.style.display = 'flex';
    enemyState.stage = 1;
  });

  rewardButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      if (!playerState.ownedBalls.includes(type)) {
        playerState.ownedBalls.push(type);
        playerState.ballLevels[type] = 1;
      }
      rewardOverlay.style.display = 'none';
      enemyState.stage += 1;
      startStage();
    });
  });

  eventContinue.addEventListener('click', () => {
    eventOverlay.style.display = 'none';
    enemyState.stage += 1;
    startStage();
  });

  gameOverRetry.addEventListener('click', () => {
    gameOverOverlay.style.display = 'none';
    enemyState.stage = 1;
    enemyState.gameOver = false;
    playerState.playerMaxHP = 100 + playerState.hpLevel * 10;
    playerState.playerHP = playerState.playerMaxHP;
    updatePlayerHP();
    startStage();
  });

  window.addEventListener('mousemove', (e) => {
    if (playerState.currentBalls.length > 0 || enemyState.gameOver) return;
    const rect = document.getElementById('aim-svg').getBoundingClientRect();
    const dx = e.clientX - rect.left - firePoint.x;
    const dy = e.clientY - rect.top - firePoint.y;
    const angle = Math.atan2(dy, dx);
    drawSimulatedPath(angle, 10);
  });

  window.addEventListener('click', (e) => {
    if (playerState.currentBalls.length > 0 || enemyState.gameOver) return;
    if (playerState.ammo.length <= 0) {
      return;
    }
    const rect = document.getElementById('aim-svg').getBoundingClientRect();
    const dx = e.clientX - rect.left - firePoint.x;
    const dy = e.clientY - rect.top - firePoint.y;
    const angle = Math.atan2(dy, dx);
    const type = playerState.nextBall;
    const idx = playerState.ammo.indexOf(type);
    if (idx !== -1) playerState.ammo.splice(idx, 1);
    shootBall(angle, type);
    updateAmmo();
    playerState.nextBall = null;
    selectNextBall(firePoint);
  });
});
