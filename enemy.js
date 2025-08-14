import { playerState } from './player.js';
import { firePoint, generatePegs } from './engine.js';
import { updateHPBar, updatePlayerHP, flashEnemyDamage, showDamageOverlay, shakeContainer, updateProgress, selectNextBall as uiSelectNextBall, updateAttackCountdown } from './ui.js';
import { shuffle } from './utils.js';

export const enemyVariants = [
  {
      normalImage: 'image/enemies/enemy_normal.png',
      damageImage: 'image/enemies/enemy_damage.png',
      defeatImages: ['image/enemies/enemy_defeat.png', 'image/enemies/enemy_defeat2.png']
  },
  {
      normalImage: 'image/enemies/enemy2_normal.png',
      damageImage: 'image/enemies/enemy2_damage.png',
      defeatImages: ['image/enemies/enemy2_defeat.png', 'image/enemies/enemy2_defeat2.png', 'image/enemies/enemy2_defeat3.png']
  },
  {
      normalImage: 'image/enemies/enemy3_normal.png',
      damageImage: 'image/enemies/enemy3_damage.png',
      defeatImages: ['image/enemies/enemy3_defeat.png', 'image/enemies/enemy3_defeat2.png', 'image/enemies/enemy3_defeat3.png']
  }
];

export function enemyAttack() {
  if (enemyState.gameOver) {
    return;
  }
  playerState.playerHP = Math.max(0, playerState.playerHP - 10);
  updatePlayerHP();
  showDamageOverlay();
  shakeContainer();
  if (playerState.playerHP <= 0 && !enemyState.gameOver) {
    enemyState.gameOver = true;
    document.getElementById('game-over-overlay').style.display = 'flex';
  } else {
    enemyState.attackCountdown = Math.floor(Math.random() * 3) + 1;
    updateAttackCountdown(enemyState);
  }
}

const defaultEnemy = enemyVariants[0];

export const enemyState = {
  stage: 1,
  maxEnemyHP: 100,
  enemyHP: 100,
  pendingDamage: 0,
  attackCountdown: 0,
  gameOver: false,
  progressSteps: [1, 'event', 2, 'event', 3, 'event', 4, 'event', 5],
  progressIndex: 0,
  lastVariantIndex: -1,
  normalImage: defaultEnemy.normalImage,
  damageImage: defaultEnemy.damageImage,
  defeatImages: defaultEnemy.defeatImages.slice(),
  selectNextBall: () => uiSelectNextBall(firePoint),
  updateHPBar: () => updateHPBar(enemyState),
  updatePlayerHP,
  flashEnemyDamage: () => flashEnemyDamage(enemyState),
  enemyAttack: enemyAttack
};

export function startStage() {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * enemyVariants.length);
  } while (newIndex === enemyState.lastVariantIndex);
  const variant = enemyVariants[newIndex];
  enemyState.normalImage = variant.normalImage;
  enemyState.damageImage = variant.damageImage;
  enemyState.defeatImages = variant.defeatImages.slice();
  document.getElementById('enemy-girl').src = enemyState.normalImage;
  generatePegs(50 + (enemyState.stage - 1) * 10);
  enemyState.maxEnemyHP = 100 + (enemyState.stage - 1) * 100;
  enemyState.enemyHP = enemyState.maxEnemyHP;
  enemyState.pendingDamage = 0;
  playerState.currentBalls = [];
  playerState.currentShotType = null;
    playerState.ammo = playerState.ownedBalls.slice();
    playerState.shotQueue = shuffle(playerState.ammo.slice());
  enemyState.updateHPBar();
  uiSelectNextBall(firePoint);
  enemyState.attackCountdown = Math.floor(Math.random() * 3) + 1;
  document.getElementById('stage-value').textContent = enemyState.stage;
  enemyState.progressIndex = (enemyState.stage - 1) * 2;
  updateProgress(enemyState);
  updateAttackCountdown(enemyState);
  enemyState.lastVariantIndex = newIndex;
}

