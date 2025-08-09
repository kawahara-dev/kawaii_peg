import { initEngine, drawSimulatedPath, shootBall, setupCollisionHandler, firePoint, clearSimulatedPath } from './engine.js';
import { playerState } from './player.js';
import { enemyState, startStage } from './enemy.js';
import { updateAmmo, updatePlayerHP, updateCurrentBall } from './ui.js';

export let handleShoot;

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
  const reloadOverlay = document.getElementById('reload-overlay');

  const showOverlay = (overlay) => {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
  };

  const hideOverlay = (overlay) => {
    overlay.classList.remove('show');
    overlay.addEventListener('transitionend', () => {
      overlay.style.display = 'none';
    }, { once: true });
  };

  showOverlay(menuOverlay);

  let aimTimer;

  const startReload = () => {
    reloadOverlay.style.display = 'flex';
    playerState.reloading = true;
    setTimeout(() => {
      playerState.ammo = playerState.ownedBalls.slice();
      reloadOverlay.style.display = 'none';
      updateAmmo();
      enemyState.selectNextBall();
      playerState.reloading = false;
    }, 1000);
  };

  startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    hideOverlay(menuOverlay);
    enemyState.stage = 1;
    enemyState.gameOver = false;
    startStage();
  });

  upgradeMenuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    mainMenu.style.display = 'none';
    upgradeButtons.style.display = 'flex';
    xpDisplay.textContent = playerState.permXP;
  });

  resetButton.addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.clear();
    location.reload();
  });

  upgradeHP.addEventListener('click', (e) => {
    e.stopPropagation();
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

  upgradeATK.addEventListener('click', (e) => {
    e.stopPropagation();
    if (playerState.permXP >= 10) {
      playerState.permXP -= 10;
      playerState.atkLevel += 1;
      localStorage.setItem('permXP', playerState.permXP);
      localStorage.setItem('atkLevel', playerState.atkLevel);
      xpDisplay.textContent = playerState.permXP;
    }
  });

  xpContinue.addEventListener('click', (e) => {
    e.stopPropagation();
    xpOverlay.style.display = 'none';
    showOverlay(menuOverlay);
    enemyState.stage = 1;
  });

  rewardButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
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

  eventContinue.addEventListener('click', (e) => {
    e.stopPropagation();
    eventOverlay.style.display = 'none';
    enemyState.stage += 1;
    startStage();
  });

  gameOverRetry.addEventListener('click', (e) => {
    e.stopPropagation();
    gameOverOverlay.style.display = 'none';
    enemyState.stage = 1;
    enemyState.gameOver = false;
    playerState.playerMaxHP = 100 + playerState.hpLevel * 10;
    playerState.playerHP = playerState.playerMaxHP;
    updatePlayerHP();
    startStage();
  });

  const aimSvg = document.getElementById('aim-svg');

  window.addEventListener('mousemove', (e) => {
    if (playerState.currentBalls.length > 0 || enemyState.gameOver) return;
    const rect = aimSvg.getBoundingClientRect();
    const dx = e.clientX - rect.left - firePoint.x;
    const dy = e.clientY - rect.top - firePoint.y;
    const angle = Math.atan2(dy, dx);
    drawSimulatedPath(angle, 10);
    clearTimeout(aimTimer);
    aimTimer = setTimeout(() => {
      clearSimulatedPath();
    }, 100);
  });

  window.addEventListener('mouseout', () => {
    clearTimeout(aimTimer);
    clearSimulatedPath();
  });

  handleShoot = function handleShoot(e) {
    if (playerState.currentBalls.length > 0 || enemyState.gameOver || playerState.reloading) return;
    if (playerState.ammo.length <= 0) {
      startReload();
      return;
    }
    const rect = aimSvg.getBoundingClientRect();
    const dx = e.clientX - rect.left - firePoint.x;
    const dy = e.clientY - rect.top - firePoint.y;
    const angle = Math.atan2(dy, dx);
    const type = playerState.nextBall;
    const idx = playerState.ammo.indexOf(type);
    if (idx !== -1) playerState.ammo.splice(idx, 1);
    shootBall(angle, type);
    clearTimeout(aimTimer);
    clearSimulatedPath();
    updateAmmo();
  };

  aimSvg.addEventListener('click', handleShoot);
});
