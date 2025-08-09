import { playerState } from './player.js';
import { handleShoot } from './main.js';
import { healBallPath } from './constants.js';

const hpFill = document.getElementById('hp-fill');
const hpText = document.getElementById('hp-text');
const hpDisplay = document.getElementById('hp-display');
const playerHpValue = document.getElementById('player-hp-value');
const playerHpMaxText = document.getElementById('player-hp-max');
const playerHpFill = document.getElementById('player-hp-fill');
const ammoValue = document.getElementById('ammo-value');
const coinValue = document.getElementById('coin-value');
const currentBallEl = document.getElementById('current-ball');
const enemyGirl = document.getElementById('enemy-girl');
const victoryOverlay = document.getElementById('victory-overlay');
const victoryImg = document.getElementById('victory-img');
const retryButton = document.getElementById('retry-button');
const rewardOverlay = document.getElementById('reward-overlay');
const xpOverlay = document.getElementById('xp-overlay');
const xpGained = document.getElementById('xp-gained');
const progressIndicator = document.getElementById('progress-indicator');
const shopOverlay = document.getElementById('shop-overlay');
const shopOptions = document.getElementById('shop-options');
const shopClose = document.getElementById('shop-close');

export { enemyGirl };

export function updateHPBar(enemyState) {
  const percent = Math.max(0, (enemyState.enemyHP / enemyState.maxEnemyHP) * 100);
  hpFill.style.width = `${percent}%`;
  const hp = Math.max(0, enemyState.enemyHP);
  hpText.textContent = `${hp}`;
  hpDisplay.textContent = `${hp} / ${enemyState.maxEnemyHP}`;
  if (enemyState.enemyHP <= 0 && !enemyState.gameOver) {
    enemyState.gameOver = true;
    setTimeout(() => {
      victoryImg.src = enemyState.defeatImages[Math.floor(Math.random() * enemyState.defeatImages.length)];
      victoryOverlay.style.display = 'flex';
      document.getElementById('aim-svg').removeEventListener('click', handleShoot);
      const proceed = () => {
        victoryOverlay.style.display = 'none';
        enemyState.gameOver = false;
        document.getElementById('aim-svg').addEventListener('click', handleShoot);
        if (enemyState.stage >= 5) {
          const gained = 10;
          playerState.permXP += gained;
          localStorage.setItem('permXP', playerState.permXP);
          xpGained.textContent = gained;
          updateProgress(enemyState);
          xpOverlay.style.display = 'flex';
        } else {
          rewardOverlay.style.display = 'flex';
        }
      };
      victoryOverlay.addEventListener('click', (e) => { e.stopPropagation(); proceed(); }, { once: true });
      retryButton.addEventListener('click', (e) => { e.stopPropagation(); proceed(); }, { once: true });
    }, 200);
  }
}

export function updatePlayerHP() {
  const percent = Math.max(0, (playerState.playerHP / playerState.playerMaxHP) * 100);
  playerHpValue.textContent = `${playerState.playerHP}`;
  playerHpMaxText.textContent = `${playerState.playerMaxHP}`;
  playerHpFill.style.width = `${percent}%`;
  const hpBox = document.getElementById('player-hp-container');
  hpBox.classList.add('flash-effect');
  setTimeout(() => hpBox.classList.remove('flash-effect'), 300);
}

export function updateAmmo() {
  ammoValue.innerHTML = '';
  playerState.ammo.forEach(type => {
    const icon = document.createElement('span');
    icon.className = 'ammo-ball';
    if (type === 'split') icon.style.background = '#dda0dd';
    else if (type === 'heal') {
      icon.style.backgroundImage = `url("${healBallPath}")`;
      icon.style.backgroundSize = 'cover';
      icon.style.backgroundRepeat = 'no-repeat';
    }
    else if (type === 'big') icon.style.background = '#ffa500';
    const lvl = playerState.ballLevels[type] || 1;
    if (lvl > 1) {
      const badge = document.createElement('span');
      badge.className = 'level-badge';
      badge.textContent = `+${lvl - 1}`;
      icon.appendChild(badge);
    }
    ammoValue.appendChild(icon);
  });
}

export function updateCoins() {
  coinValue.textContent = playerState.coins;
}

const shopData = {
  normal: { label: 'ノーマル', buy: 5, sell: 5, upgrade: 8 },
  split: { label: '分裂', buy: 10, sell: 10, upgrade: 15 },
  heal: { label: '回復', buy: 10, sell: 10, upgrade: 15 },
  big: { label: 'デカ', buy: 10, sell: 10, upgrade: 15 }
};

export function showShopOverlay(onDone) {
  shopOverlay.style.display = 'flex';
  shopOptions.innerHTML = '';
  Object.entries(shopData).forEach(([type, data]) => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const label = document.createElement('span');
    label.textContent = `${data.label}ボール`;
    const buyBtn = document.createElement('button');
    buyBtn.className = 'shop-buy';
    buyBtn.dataset.type = type;
    buyBtn.textContent = `購入(${data.buy})`;
    const sellBtn = document.createElement('button');
    sellBtn.className = 'shop-sell';
    sellBtn.dataset.type = type;
    sellBtn.textContent = `削除(${data.sell})`;
    const upBtn = document.createElement('button');
    upBtn.className = 'shop-upgrade';
    upBtn.dataset.type = type;
    upBtn.textContent = `強化(${data.upgrade})`;
    div.appendChild(label);
    div.appendChild(buyBtn);
    div.appendChild(sellBtn);
    div.appendChild(upBtn);
    shopOptions.appendChild(div);
  });

  const handleClick = (e) => {
    const type = e.target.dataset.type;
    if (!type) return;
    if (e.target.classList.contains('shop-buy')) {
      if (playerState.coins >= shopData[type].buy) {
        playerState.coins -= shopData[type].buy;
        playerState.ownedBalls.push(type);
      }
    } else if (e.target.classList.contains('shop-sell')) {
      const idx = playerState.ownedBalls.indexOf(type);
      if (idx !== -1) {
        playerState.ownedBalls.splice(idx, 1);
        playerState.coins += shopData[type].sell;
      }
    } else if (e.target.classList.contains('shop-upgrade')) {
      if (playerState.coins >= shopData[type].upgrade) {
        playerState.coins -= shopData[type].upgrade;
        playerState.ballLevels[type] = (playerState.ballLevels[type] || 1) + 1;
      }
    } else {
      return;
    }
    localStorage.setItem('coins', playerState.coins);
    shopOptions.removeEventListener('click', handleClick);
    shopOverlay.style.display = 'none';
    updateAmmo();
    updateCoins();
    onDone && onDone();
  };

  shopOptions.addEventListener('click', handleClick);

  shopClose.onclick = () => {
    shopOptions.removeEventListener('click', handleClick);
    shopOverlay.style.display = 'none';
    onDone && onDone();
  };
}

export function updateCurrentBall(firePoint) {
  if (!playerState.nextBall) {
    currentBallEl.style.display = 'none';
    currentBallEl.innerHTML = '';
    return;
  }
  const lvl = playerState.ballLevels[playerState.nextBall] || 1;
  const sizeMul = 1 + (lvl - 1) * 0.1;
  const base = playerState.nextBall === 'big' ? 30 : 15;
  const radius = base * sizeMul;
  currentBallEl.style.width = `${radius * 2}px`;
  currentBallEl.style.height = `${radius * 2}px`;
  currentBallEl.style.left = `${firePoint.x}px`;
  currentBallEl.style.top = `${firePoint.y}px`;
  if (playerState.nextBall === 'heal') {
    currentBallEl.style.backgroundImage = 'url("./image/recovery_ball.png")';
    currentBallEl.style.backgroundSize = 'cover';
    currentBallEl.style.backgroundColor = 'transparent';
  } else {
    let color = '#00bfff';
    if (playerState.nextBall === 'split') color = '#dda0dd';
    else if (playerState.nextBall === 'big') color = '#ffa500';
    currentBallEl.style.backgroundImage = '';
    currentBallEl.style.background = color;
  }
  currentBallEl.style.display = 'block';
  currentBallEl.innerHTML = '';
  if (lvl > 1) {
    const badge = document.createElement('span');
    badge.className = 'level-badge';
    badge.textContent = `+${lvl - 1}`;
    currentBallEl.appendChild(badge);
  }
}

export function selectNextBall(firePoint) {
  if (playerState.ammo.length > 0) {
    const idx = Math.floor(Math.random() * playerState.ammo.length);
    playerState.nextBall = playerState.ammo[idx];
  } else {
    playerState.nextBall = null;
  }
  updateCurrentBall(firePoint);
}

export function flashEnemyDamage(enemyState) {
  enemyGirl.src = 'image/enemy_damage.png';
  setTimeout(() => {
    if (enemyState.enemyHP > 0) {
      enemyGirl.src = 'image/enemy_normal.png';
    }
  }, 500);
}

export function showDamageText(x, y, text, isHeal = false) {
  const dmg = document.createElement('div');
  dmg.className = isHeal ? 'damage-text heal-text' : 'damage-text';
  dmg.textContent = text;
  dmg.style.left = `${x}px`;
  dmg.style.top = `${y}px`;
  document.getElementById('game-wrapper').appendChild(dmg);
  setTimeout(() => dmg.remove(), 1000);
}

export function showHitSpark(x, y) {
  const spark = document.createElement('div');
  spark.className = 'hit-spark';
  spark.style.left = `${x - 10}px`;
  spark.style.top = `${y - 10}px`;
  document.getElementById('game-wrapper').appendChild(spark);
  setTimeout(() => spark.remove(), 400);
}

export function showHealSpark(x, y) {
  const spark = document.createElement('div');
  spark.className = 'heal-spark';
  spark.style.left = `${x - 10}px`;
  spark.style.top = `${y - 10}px`;
  document.getElementById('game-wrapper').appendChild(spark);
  setTimeout(() => spark.remove(), 400);
}

export function showBombExplosion(x, y) {
  const boom = document.createElement('div');
  boom.className = 'bomb-explosion';
  boom.style.left = `${x - 80}px`;
  boom.style.top = `${y - 80}px`;
  document.getElementById('game-wrapper').appendChild(boom);
  setTimeout(() => boom.remove(), 500);
}

export function showDamageOverlay() {
  let overlay = document.getElementById('damage-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'damage-overlay';
    document.getElementById('container').appendChild(overlay);
  } else if (overlay._timer) {
    clearTimeout(overlay._timer);
  }
  overlay._timer = setTimeout(() => {
    overlay.remove();
    overlay._timer = null;
  }, 300);
}

export function shakeContainer() {
  const cont = document.getElementById('container');
  cont.classList.add('shake');
  setTimeout(() => cont.classList.remove('shake'), 300);
}

export function launchHeartAttack() {
  const heart = document.createElement('div');
  heart.className = 'heart-beam';
  heart.style.left = '1050px';
  heart.style.top = '400px';
  const dx = -700 + Math.floor(Math.random() * 100) - 50;
  const dy = -300 + Math.floor(Math.random() * 60) - 30;
  heart.style.setProperty('--dx', `${dx}px`);
  heart.style.setProperty('--dy', `${dy}px`);
  document.getElementById('container').appendChild(heart);
  setTimeout(() => heart.remove(), 800);
}

export function updateProgress(enemyState) {
  progressIndicator.innerHTML = '';
  let enemyCount = 1;
  enemyState.progressSteps.forEach((step, idx) => {
    const li = document.createElement('li');
    if (idx < enemyState.progressIndex) {
      li.classList.add('done');
    } else if (idx === enemyState.progressIndex) {
      li.classList.add('current');
    }

    const circle = document.createElement('span');
    circle.classList.add('step-circle');
    if (step === 'ランダムイベント') {
      circle.textContent = '?';
    } else {
      circle.textContent = enemyCount;
      enemyCount++;
    }

    li.appendChild(circle);
    progressIndicator.appendChild(li);
  });
}

updateCoins();
