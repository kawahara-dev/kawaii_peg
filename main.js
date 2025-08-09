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
  startStage();
  updatePlayerHP();

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
