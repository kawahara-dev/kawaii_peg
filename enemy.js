import { playerState } from './player.js';
import { firePoint, generatePegs } from './engine.js';
import { updateHPBar, updatePlayerHP, flashEnemyDamage, showDamageOverlay, shakeContainer, selectNextBall as uiSelectNextBall, updateAttackCountdown } from './ui.js';
import { shuffle } from './utils.js';

export const enemyVariants = {
  normal: [
    {
      normalImage: 'image/enemies/enemy_normal.png',
      damageImage: 'image/enemies/enemy_damage.png',
      defeatImages: ['image/enemies/enemy_defeat.png', 'image/enemies/enemy_defeat2.png'],
      hpMultiplier: 1,
      attackDamage: 10
    },
    {
      normalImage: 'image/enemies/enemy4_normal.png',
      damageImage: 'image/enemies/enemy4_damage.png',
      defeatImages: ['image/enemies/enemy4_defeat.png'],
      hpMultiplier: 1,
      attackDamage: 10
    },
    {
      normalImage: 'image/enemies/enemy5_normal.png',
      damageImage: 'image/enemies/enemy5_damage.png',
      defeatImages: ['image/enemies/enemy5_defeat.png', 'image/enemies/enemy5_defeat2.png'],
      hpMultiplier: 1,
      attackDamage: 10
    }
  ],
  elite: [
    {
      normalImage: 'image/enemies/enemy2_normal.png',
      damageImage: 'image/enemies/enemy2_damage.png',
      defeatImages: ['image/enemies/enemy2_defeat.png', 'image/enemies/enemy2_defeat2.png', 'image/enemies/enemy2_defeat3.png'],
      hpMultiplier: 2,
      attackDamage: 15
    }
  ],
  boss: [
    {
      normalImage: 'image/enemies/enemy3_normal.png',
      damageImage: 'image/enemies/enemy3_damage.png',
      defeatImages: ['image/enemies/enemy3_defeat.png', 'image/enemies/enemy3_defeat2.png', 'image/enemies/enemy3_defeat3.png'],
      hpMultiplier: 4,
      attackDamage: 20
    }
  ]
};

export function enemyAttack() {
  if (enemyState.gameOver) {
    return;
  }
  playerState.playerHP = Math.max(0, playerState.playerHP - enemyState.attackDamage);
  updatePlayerHP();
  showDamageOverlay();
  shakeContainer();
  if (playerState.playerHP <= 0 && !enemyState.gameOver) {
    enemyState.gameOver = true;
    document.getElementById('game-over-overlay').classList.add('show');
  } else {
    enemyState.attackCountdown = Math.floor(Math.random() * 3) + 1;
    updateAttackCountdown(enemyState);
  }
}

const defaultEnemy = enemyVariants.normal[0];

export const enemyState = {
  stage: 1,
  maxEnemyHP: 100,
  enemyHP: 100,
  pendingDamage: 0,
  attackCountdown: 0,
  gameOver: false,
  progressSteps: [],
  progressIndex: 0,
  lastVariantIndex: -1,
  nodeType: 'battle',
  attackDamage: defaultEnemy.attackDamage,
  normalImage: defaultEnemy.normalImage,
  damageImage: defaultEnemy.damageImage,
  defeatImages: defaultEnemy.defeatImages.slice(),
  pendingRareReward: null,
  selectNextBall: () => uiSelectNextBall(firePoint),
  updateHPBar: () => updateHPBar(enemyState),
  updatePlayerHP,
  flashEnemyDamage: () => flashEnemyDamage(enemyState),
  enemyAttack: enemyAttack
};

export function startStage(nodeType = 'battle') {
  enemyState.nodeType = nodeType;
  const enemyGirl = document.getElementById('enemy-girl');
  enemyGirl.classList.remove('boss-aura');
  if (enemyState.nodeType === 'boss') {
    enemyGirl.classList.add('boss-aura');
  }
  let variants = enemyVariants.normal;
  if (nodeType === 'elite') {
    variants = enemyVariants.elite;
  } else if (nodeType === 'boss') {
    variants = enemyVariants.boss;
  }
  let newIndex;
  if (variants.length <= 1) {
    newIndex = 0;
  } else {
    do {
      newIndex = Math.floor(Math.random() * variants.length);
    } while (newIndex === enemyState.lastVariantIndex);
  }
  const variant = variants[newIndex];
  enemyState.normalImage = variant.normalImage;
  enemyState.damageImage = variant.damageImage;
  enemyState.defeatImages = variant.defeatImages.slice();
  enemyState.attackDamage = variant.attackDamage;
  document.getElementById('enemy-girl').src = enemyState.normalImage;
  generatePegs(50 + (enemyState.stage - 1) * 10, enemyState.nodeType === 'boss');
  enemyState.maxEnemyHP = (100 + (enemyState.stage - 1) * 100) * variant.hpMultiplier;
  enemyState.enemyHP = enemyState.maxEnemyHP;
  enemyState.pendingDamage = 0;
  enemyState.pendingRareReward = null;
  playerState.currentBalls = [];
  playerState.currentShotType = null;
  playerState.ammo = playerState.ownedBalls.slice();
  playerState.shotQueue = shuffle(playerState.ammo.slice());
  enemyState.selectNextBall();
  enemyState.updateHPBar();
  enemyState.attackCountdown = Math.floor(Math.random() * 3) + 1;
  updateAttackCountdown(enemyState);
  enemyState.lastVariantIndex = newIndex;
}
