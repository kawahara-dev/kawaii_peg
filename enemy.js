import { playerState } from './player.js';
import { firePoint, generatePegs } from './engine.js';
import { updateAmmo, updateHPBar, updatePlayerHP, flashEnemyDamage, showDamageOverlay, shakeContainer, updateProgress, selectNextBall as uiSelectNextBall } from './ui.js';

export const enemyState = {
  stage: 1,
  maxEnemyHP: 100,
  enemyHP: 100,
  pendingDamage: 0,
  gameOver: false,
  progressSteps: [
    'ステージ1', 'ランダムイベント', 'ステージ2', 'ランダムイベント', 'ステージ3', 'ランダムイベント', 'ステージ4', 'ランダムイベント', 'ステージ5'
  ],
  progressIndex: 0,
  defeatImages: ['image/enemy_defete.png', 'image/enemy_defete2.png'],
  selectNextBall: () => uiSelectNextBall(firePoint),
  updateHPBar: () => updateHPBar(enemyState),
  updatePlayerHP,
  flashEnemyDamage: () => flashEnemyDamage(enemyState),
  enemyAttack
};

export function startStage() {
  document.getElementById('enemy-girl').src = 'image/enemy_normal.png';
  generatePegs(50 + (enemyState.stage - 1) * 10);
  enemyState.maxEnemyHP = 100 + (enemyState.stage - 1) * 100;
  enemyState.enemyHP = enemyState.maxEnemyHP;
  enemyState.pendingDamage = 0;
  playerState.currentBalls = [];
  playerState.currentShotType = null;
  playerState.ammo = playerState.ownedBalls.slice();
  enemyState.updateHPBar();
  updateAmmo();
  uiSelectNextBall(firePoint);
  document.getElementById('stage-value').textContent = enemyState.stage;
  enemyState.progressIndex = (enemyState.stage - 1) * 2;
  updateProgress(enemyState);
}

export function enemyAttack() {
  if (enemyState.gameOver) {
    return;
  }
  playerState.playerHP -= 10;
  updatePlayerHP();
  showDamageOverlay();
  shakeContainer();
  if (playerState.playerHP <= 0 && !enemyState.gameOver) {
    enemyState.gameOver = true;
    document.getElementById('game-over-overlay').style.display = 'flex';
  }
}

