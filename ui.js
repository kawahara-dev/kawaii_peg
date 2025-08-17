import { playerState, saveBallState } from './player.js';
import { handleShoot, onRareRewardClick } from './main.js';
import { healBallPath } from './constants.js';
import { firePoint, pauseRunner, resumeRunner, setTimeScale } from './engine.js';
import { shuffle } from './utils.js';
import { t } from './i18n.js';
import { getRareReward } from './rewards.js';
import { relicList, addRelic } from './relics.js';

const hpFill = document.getElementById('hp-fill');
const hpText = document.getElementById('hp-text');
const hpDisplay = document.getElementById('hp-display');
const playerHpValue = document.getElementById('player-hp-value');
const playerHpMaxText = document.getElementById('player-hp-max');
const playerHpFill = document.getElementById('player-hp-fill');
const ammoValue = document.getElementById('ammo-value');
const coinValue = document.getElementById('coin-value');
const relicContainer = document.getElementById('relic-container');
const pauseButton = document.getElementById('pause-button');
const speedSelect = document.getElementById('speed-select');
const currentBallEl = document.getElementById('current-ball');
const enemyGirl = document.getElementById('enemy-girl');
const victoryOverlay = document.getElementById('victory-overlay');
const victoryImg = document.getElementById('victory-img');
const rewardOverlay = document.getElementById('reward-overlay');
const xpOverlay = document.getElementById('xp-overlay');
const xpGained = document.getElementById('xp-gained');
export { xpGained };
const shopOverlay = document.getElementById('shop-overlay');
const shopOptions = document.getElementById('shop-options');
const shopClose = document.getElementById('shop-close');
const rareRewardOverlay = document.getElementById('rare-reward-overlay');
const rareRewardDesc = document.getElementById('rare-reward-desc');
const rareRewardIcon = document.getElementById('rare-reward-icon');
const rareRewardButton = document.getElementById('rare-reward-continue');

let isPaused = false;
if (pauseButton) {
  pauseButton.addEventListener('click', () => {
    if (isPaused) {
      resumeRunner();
      isPaused = false;
      pauseButton.dataset.i18n = 'hud.pause';
    } else {
      pauseRunner();
      isPaused = true;
      pauseButton.dataset.i18n = 'hud.resume';
    }
    pauseButton.textContent = t(pauseButton.dataset.i18n);
  });
}
if (speedSelect) {
  speedSelect.addEventListener('change', (e) => {
    setTimeScale(parseFloat(e.target.value));
  });
}

const mapOverlay = document.createElement('div');
mapOverlay.id = 'map-overlay';
mapOverlay.style.display = 'none';
document.getElementById('game-wrapper').appendChild(mapOverlay);
let mapOverlayHandler;

const nodeIcons = {
  battle: '⚔️',
  event: '❓',
  shop: '🛒',
  elite: '⭐',
  boss: '👑'
};

export { enemyGirl };

export function showRareRewardOverlay(reward) {
  rareRewardDesc.innerHTML = reward.description;
  if (reward.icon) {
    rareRewardIcon.src = reward.icon;
    rareRewardIcon.alt = reward.description;
    rareRewardIcon.style.display = 'block';
  } else {
    rareRewardIcon.removeAttribute('src');
    rareRewardIcon.style.display = 'none';
  }
  rareRewardButton.disabled = false;
  rareRewardButton.addEventListener('click', onRareRewardClick, { once: true });
  rareRewardOverlay.style.display = 'flex';
}

export { rareRewardOverlay, rareRewardButton };

export function updateAttackCountdown(enemyState) {
  const timer = document.getElementById('enemy-attack-timer');
  if (timer) {
    timer.textContent = `${t('hud.untilAttack')}: ${enemyState.attackCountdown} / ${t('hud.damage')}: ${enemyState.attackDamage}`;
  }
}

export function updateHPBar(enemyState) {
  const percent = Math.max(0, (enemyState.enemyHP / enemyState.maxEnemyHP) * 100);
  hpFill.style.width = `${percent}%`;
  const hp = Math.max(0, Math.ceil(enemyState.enemyHP));
  hpText.textContent = `${hp}`;
  hpDisplay.textContent = `${hp} / ${Math.ceil(enemyState.maxEnemyHP)}`;
  if (enemyState.enemyHP <= 0 && !enemyState.gameOver) {
    enemyState.gameOver = true;
    let coinsEarned = enemyState.stage * 3;
    if (enemyState.nodeType === 'elite') {
      coinsEarned = enemyState.stage * 5;
    } else if (enemyState.nodeType === 'boss') {
      coinsEarned = enemyState.stage * 10;
    }
    if (playerState.relics && playerState.relics.includes('coinCharm')) {
      coinsEarned += 10;
    }
    playerState.coins += coinsEarned;
    updateCoins();
    document.getElementById('reward-coin-value').textContent = coinsEarned;
    localStorage.setItem('coins', playerState.coins);
    if (enemyState.nodeType === 'boss') {
      playerState.playerHP = playerState.playerMaxHP;
      updatePlayerHP();
    } else if (playerState.relics && playerState.relics.includes('killHeal')) {
      playerState.playerHP = Math.min(playerState.playerMaxHP, playerState.playerHP + 10);
      updatePlayerHP();
    }
    setTimeout(() => {
      victoryImg.src = enemyState.defeatImages[Math.floor(Math.random() * enemyState.defeatImages.length)];
      victoryOverlay.classList.add('show');
      document.getElementById('aim-svg').removeEventListener('click', handleShoot);
      const proceed = () => {
        victoryOverlay.classList.remove('show');
        enemyState.gameOver = false;
        document.getElementById('aim-svg').addEventListener('click', handleShoot);
        if (enemyState.nodeType === 'elite' || enemyState.nodeType === 'boss') {
          const reward = getRareReward(enemyState.nodeType);
          enemyState.pendingRareReward = reward;
          showRareRewardOverlay(reward);
        } else {
          rewardOverlay.classList.add('show');
        }
      };
      victoryOverlay.addEventListener('click', (e) => { e.stopPropagation(); proceed(); }, { once: true });
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
  const queue = [playerState.nextBall, ...playerState.shotQueue].filter(Boolean);
  queue.forEach((type, index) => {
    const icon = document.createElement('span');
    icon.className = 'ammo-ball';
    if (type === 'normal') {
      icon.style.backgroundImage = 'url("./image/balls/normal_ball.png")';
    } else if (type === 'split') {
      icon.style.backgroundImage = 'url("./image/balls/split_ball.png")';
    } else if (type === 'heal') {
      icon.style.backgroundImage = `url("${healBallPath}")`;
    } else if (type === 'big') {
      icon.style.backgroundImage = 'url("./image/balls/big_ball.png")';
    } else if (type === 'penetration') {
      icon.style.backgroundImage = 'url("./image/balls/penetration_ball.png")';
    }
    icon.style.backgroundSize = 'cover';
    icon.style.backgroundColor = 'transparent';
    icon.style.backgroundRepeat = 'no-repeat';
    const lvl = playerState.ballLevels[type] || 1;
    if (lvl > 1) {
      const badge = document.createElement('span');
      badge.className = 'level-badge';
      badge.textContent = `+${lvl - 1}`;
      icon.appendChild(badge);
    }
    const num = document.createElement('span');
    num.className = 'queue-number';
    num.textContent = index + 1;
    icon.appendChild(num);
    if (index === 0) {
      icon.style.outline = '2px solid yellow';
    }
    ammoValue.appendChild(icon);
  });
}

export function updateCoins() {
  coinValue.textContent = playerState.coins;
  const shopCoinValue = document.getElementById('shop-coin-value');
  if (shopCoinValue) {
    shopCoinValue.textContent = playerState.coins;
  }
}

export function updateRelicIcons() {
  if (!relicContainer) return;
  relicContainer.innerHTML = '';
  (playerState.relics || []).forEach(key => {
    const relic = relicList.find(r => r.key === key);
    if (relic && relic.icon) {
      const img = document.createElement('img');
      img.src = relic.icon;
      img.alt = relic.name;
      relicContainer.appendChild(img);
    }
  });
}

const shopData = {
  normal: { buy: 5, sell: 5, upgrade: 8 },
  split: { buy: 10, sell: 10, upgrade: 15 },
  heal: { buy: 10, sell: 10, upgrade: 15 },
  big: { buy: 10, sell: 10, upgrade: 15 },
  penetration: { buy: 10, sell: 10, upgrade: 15 }
};

const shopImageMap = {
  normal: './image/balls/normal_ball.png',
  split: './image/balls/split_ball.png',
  heal: healBallPath,
  big: './image/balls/big_ball.png',
  penetration: './image/balls/penetration_ball.png'
};

const relicShopData = {
  timeLag: 30,
  rebound: 30,
  killHeal: 40,
  damageBoost: 40,
  coinCharm: 50
};

export function showShopOverlay(onDone) {
  shopOverlay.classList.add('show');
  updateCoins();
  shopOptions.innerHTML = '';
  Object.entries(shopData).forEach(([type, data]) => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const img = document.createElement('img');
    img.src = shopImageMap[type];
    img.alt = t(`balls.${type}.full`);
    const label = document.createElement('span');
    label.textContent = t(`balls.${type}.full`);
    const buyBtn = document.createElement('button');
    buyBtn.className = 'shop-buy';
    buyBtn.dataset.type = type;
    buyBtn.textContent = `${t('shop.buy')}(${data.buy})`;
    const sellBtn = document.createElement('button');
    sellBtn.className = 'shop-sell';
    sellBtn.dataset.type = type;
    sellBtn.textContent = `${t('shop.sell')}(${data.sell})`;
    const upBtn = document.createElement('button');
    upBtn.className = 'shop-upgrade';
    upBtn.dataset.type = type;
    upBtn.textContent = `${t('shop.upgrade')}(${data.upgrade})`;
    div.appendChild(img);
    div.appendChild(label);
    div.appendChild(buyBtn);
    div.appendChild(sellBtn);
    div.appendChild(upBtn);
    shopOptions.appendChild(div);
  });

  const relicTitle = document.createElement('h3');
  relicTitle.textContent = t('shop.relic');
  shopOptions.appendChild(relicTitle);

  const relicChoices = shuffle(
    relicList.filter(r => !(playerState.relics || []).includes(r.key))
  ).slice(0, 3);

  relicChoices.forEach(relic => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const img = document.createElement('img');
    img.src = relic.icon;
    img.alt = relic.name;
    const label = document.createElement('span');
    label.textContent = relic.name;
    const desc = document.createElement('span');
    desc.textContent = relic.description;
    const buyBtn = document.createElement('button');
    buyBtn.className = 'shop-buy-relic';
    buyBtn.dataset.key = relic.key;
    buyBtn.textContent = `${t('shop.buyRelic')}(${relicShopData[relic.key]})`;
    div.appendChild(img);
    div.appendChild(label);
    div.appendChild(desc);
    div.appendChild(buyBtn);
    shopOptions.appendChild(div);
  });

  const handleClick = (e) => {
    if (e.target.classList.contains('shop-buy-relic')) {
      const key = e.target.dataset.key;
      const price = relicShopData[key];
      if (playerState.coins >= price) {
        playerState.coins -= price;
        addRelic(key);
        updateRelicIcons();
        localStorage.setItem('coins', playerState.coins);
        shopOptions.removeEventListener('click', handleClick);
        shopOverlay.classList.remove('show');
        updateCoins();
        onDone && onDone();
      }
      return;
    }
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
    playerState.ammo = playerState.ownedBalls.slice();
    playerState.shotQueue = shuffle(playerState.ammo.slice());
    saveBallState();
    localStorage.setItem('coins', playerState.coins);
    shopOptions.removeEventListener('click', handleClick);
    shopOverlay.classList.remove('show');
    selectNextBall(firePoint);
    updateCoins();
    onDone && onDone();
  };

  shopOptions.addEventListener('click', handleClick);

  shopClose.onclick = () => {
    shopOptions.removeEventListener('click', handleClick);
    shopOverlay.classList.remove('show');
    onDone && onDone();
  };
}

export function showMapOverlay(mapState, onSelect) {
  mapOverlay.innerHTML = '';
  const area = document.createElement('div');
  area.style.position = 'relative';
  area.style.width = '600px';
  area.style.height = '500px';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '600');
  svg.setAttribute('height', '500');
  svg.style.position = 'absolute';
  svg.style.left = '0';
  svg.style.top = '0';
  svg.style.pointerEvents = 'none';
  area.appendChild(svg);
  mapOverlay.appendChild(area);
  mapState.layers.forEach((layer, li) => {
    layer.forEach((node, ni) => {
      const el = document.createElement('div');
      el.className = 'map-node';
      el.textContent = nodeIcons[node.type] || '';
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      el.style.position = 'absolute';
      el.dataset.layer = li;
      el.dataset.index = ni;
      if (node.completed) {
        el.classList.add('done');
      }
      const isBossLayer = li === mapState.layers.length - 1;
      const selectable =
        mapState.currentLayer === li &&
        (!mapState.currentNode ||
          isBossLayer ||
          mapState.currentNode.connections.includes(ni));
      if (!selectable) {
        el.classList.add('disabled');
      }
      area.appendChild(el);
    });
  });

  const isActiveConnection = (a, b) => {
    for (let i = 0; i < mapState.path.length - 1; i++) {
      if (mapState.path[i] === a && mapState.path[i + 1] === b) {
        return true;
      }
    }
    return false;
  };

  mapState.layers.forEach((layer, li) => {
    if (li >= mapState.layers.length - 1) return;
    layer.forEach((node) => {
      node.connections.forEach((nextIndex) => {
        const nextNode = mapState.layers[li + 1][nextIndex];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', node.x + 20);
        line.setAttribute('y1', node.y + 20);
        line.setAttribute('x2', nextNode.x + 20);
        line.setAttribute('y2', nextNode.y + 20);
        line.classList.add('map-connection');
        if (isActiveConnection(node, nextNode)) {
          line.classList.add('active');
        }
        svg.appendChild(line);
      });
    });
  });
  if (mapOverlayHandler) {
    mapOverlay.removeEventListener('click', mapOverlayHandler);
    mapOverlay.removeEventListener('touchstart', mapOverlayHandler);
  }
  mapOverlayHandler = (e) => {
    const target = e.target.closest('.map-node');
    if (!target) return;
    const layer = parseInt(target.dataset.layer);
    if (layer !== mapState.currentLayer) return;
    mapOverlay.style.display = 'none';
    mapOverlay.removeEventListener('click', mapOverlayHandler);
    const idx = parseInt(target.dataset.index);
    onSelect && onSelect(idx);
  };
  mapOverlay.addEventListener('click', mapOverlayHandler);
  mapOverlay.addEventListener('touchstart', mapOverlayHandler, { passive: true });
  mapOverlay.style.display = 'flex';
}

export function renderMiniMap(mapState) {
  const miniMap = document.getElementById('mini-map');
  if (!miniMap) return;
  miniMap.innerHTML = '';
  const area = document.createElement('div');
  area.style.position = 'relative';
  area.style.width = '100%';
  area.style.height = '100%';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '200');
  svg.setAttribute('height', '200');
  svg.style.position = 'absolute';
  svg.style.left = '0';
  svg.style.top = '0';
  svg.style.pointerEvents = 'none';
  area.appendChild(svg);
  miniMap.appendChild(area);
  const scaleX = 200 / 600;
  const scaleY = 200 / 500;

  const isActiveConnection = (a, b) => {
    for (let i = 0; i < mapState.path.length - 1; i++) {
      if (mapState.path[i] === a && mapState.path[i + 1] === b) {
        return true;
      }
    }
    return false;
  };

  mapState.layers.forEach((layer) => {
    layer.forEach((node) => {
      const el = document.createElement('div');
      el.className = 'map-node';
      el.textContent = nodeIcons[node.type] || '';
      el.style.position = 'absolute';
      el.style.left = `${node.x * scaleX}px`;
      el.style.top = `${node.y * scaleY}px`;
      el.style.pointerEvents = 'none';
      if (node.completed) {
        el.classList.add('done');
      }
      if (mapState.currentNode === node) {
        el.classList.add('current');
      }
      area.appendChild(el);
    });
  });

  mapState.layers.forEach((layer, li) => {
    if (li >= mapState.layers.length - 1) return;
    layer.forEach((node) => {
      node.connections.forEach((nextIndex) => {
        const nextNode = mapState.layers[li + 1][nextIndex];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', node.x * scaleX + 5);
        line.setAttribute('y1', node.y * scaleY + 5);
        line.setAttribute('x2', nextNode.x * scaleX + 5);
        line.setAttribute('y2', nextNode.y * scaleY + 5);
        line.classList.add('map-connection');
        if (isActiveConnection(node, nextNode)) {
          line.classList.add('active');
        }
        svg.appendChild(line);
      });
    });
  });
}

export function updateCurrentBall(firePoint) {
  if (!playerState.nextBall) {
    currentBallEl.style.display = 'none';
    currentBallEl.innerHTML = '';
    currentBallEl.style.border = 'none';
    return;
  }
  const lvl = playerState.ballLevels[playerState.nextBall] || 1;
  const sizeMul = 1 + (lvl - 1) * 0.1;
  const base = playerState.nextBall === 'big' ? 30 : playerState.nextBall === 'penetration' ? 20 : 15;
  const radius = base * sizeMul;
  currentBallEl.style.width = `${radius * 2}px`;
  currentBallEl.style.height = `${radius * 2}px`;
  currentBallEl.style.left = `${firePoint.x - radius}px`;
  currentBallEl.style.top = `${firePoint.y - radius}px`;
  const imageMap = {
    normal: './image/balls/normal_ball.png',
    split: './image/balls/split_ball.png',
    big: './image/balls/big_ball.png',
    heal: healBallPath,
    penetration: './image/balls/penetration_ball.png'
  };
  const img = imageMap[playerState.nextBall];
  if (img) {
    currentBallEl.style.backgroundImage = `url(${img})`;
    currentBallEl.style.backgroundSize = 'cover';
    currentBallEl.style.backgroundColor = 'transparent';
  } else {
    currentBallEl.style.backgroundImage = '';
    currentBallEl.style.backgroundColor = '#00bfff';
  }
  currentBallEl.style.transform =
    playerState.nextBall === 'penetration' ? 'rotate(180deg)' : 'none';
  currentBallEl.style.border =
    playerState.nextBall === 'penetration' ? 'none' : '2px solid #ff69b4';
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
  if (playerState.shotQueue.length > 0) {
    playerState.nextBall = playerState.shotQueue.shift();
  } else {
    playerState.nextBall = null;
  }
  updateCurrentBall(firePoint);
  updateAmmo();
}

export function flashEnemyDamage(enemyState) {
  const { damageImage, normalImage, enemyHP } = enemyState;
  enemyGirl.src = damageImage;
  setTimeout(() => {
    if (enemyHP > 0) {
      enemyGirl.src = normalImage;
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

export function updateMapDisplay(state) {
  renderMiniMap(state);
}

updateCoins();
