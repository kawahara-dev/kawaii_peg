import { initEngine, drawSimulatedPath, shootBall, setupCollisionHandler, firePoint, clearSimulatedPath } from './engine.js';
import { playerState } from './player.js';
import { enemyState, startStage } from './enemy.js';
import { updateAmmo, updatePlayerHP, updateCurrentBall, updateMapDisplay, showShopOverlay, updateCoins, showMapOverlay, rareRewardOverlay, rareRewardButton, xpGained, updateRelicIcons } from './ui.js';
import { applyRareReward } from './rewards.js';
import { healBallPath } from './constants.js';
import { shuffle } from './utils.js';
import { setLanguage, t } from './i18n.js';

const ballImageMap = {
  normal: './image/balls/normal_ball.png',
  split: './image/balls/split_ball.png',
  heal: healBallPath,
  big: './image/balls/big_ball.png',
  penetration: './image/balls/penetration_ball.png'
};

const randomEvents = [
  {
    textKey: 'events.spring.text',
    choices: [
      {
        labelKey: 'events.spring.choices.drink',
        apply() {
          playerState.playerHP = Math.min(
            playerState.playerMaxHP,
            playerState.playerHP + 20
          );
        },
        resultKey: 'events.spring.results.drink'
      },
      {
        labelKey: 'events.spring.choices.skip',
        apply() {},
        resultKey: 'events.spring.results.skip'
      }
    ]
  },
  {
    textKey: 'events.powerStone.text',
    choices() {
      const types = [...new Set(playerState.ownedBalls)];
      const opts = types.map(type => ({
        type,
        label: t('events.powerStone.choiceLabel').replace('{type}', t(`balls.${type}.full`)),
        apply() {
          playerState.ballLevels[type] = (playerState.ballLevels[type] || 1) + 1;
          updateAmmo();
          updateCurrentBall(firePoint);
        },
        result: t('events.powerStone.result').replace('{type}', t(`balls.${type}.full`))
      }));
      opts.push({ type: null, label: t('events.powerStone.passLabel'), apply() {}, result: t('events.powerStone.passResult') });
      return opts;
    }
  },
  {
    textKey: 'events.trap.text',
    choices: [
      {
        labelKey: 'events.trap.choices.avoid',
        apply() {},
        resultKey: 'events.trap.results.avoid'
      },
      {
        labelKey: 'events.trap.choices.step',
        apply() {
          playerState.playerHP = Math.max(0, playerState.playerHP - 20);
        },
        resultKey: 'events.trap.results.step'
      }
    ]
  },
  {
    textKey: 'events.foundBall.text',
    choices: [
      {
        labelKey: 'events.foundBall.choices.take',
        apply() {
          playerState.ownedBalls.push('normal');
          playerState.ammo = playerState.ownedBalls.slice();
          playerState.shotQueue = shuffle(playerState.ammo.slice());
          enemyState.selectNextBall();
        },
        resultKey: 'events.foundBall.results.take'
      },
      {
        labelKey: 'events.foundBall.choices.skip',
        apply() {},
        resultKey: 'events.foundBall.results.skip'
      }
    ]
  },
  { type: 'shop' }
];

export let handleShoot;

export const mapState = { layers: [], currentLayer: 0, currentNode: null, path: [] };

export let worldStage = 0;

const stageSettings = [
  { layerCount: 3, nodesPerLayer: 3, bossAtEnd: true },
  { layerCount: 7, nodesPerLayer: 5, bossAtEnd: true },
  { layerCount: 7, nodesPerLayer: 7, bossAtEnd: true }
];

export function generateMap({ layerCount = 5, nodesPerLayer = 3, bossAtEnd = false } = {}) {
  mapState.layers = [];
  const width = 600;
  const height = 500;
  for (let i = 0; i < layerCount; i++) {
    const layer = [];
    const nodeCount = bossAtEnd && i === layerCount - 1 ? 1 : nodesPerLayer;
    for (let j = 0; j < nodeCount; j++) {
      let type;
      if (bossAtEnd && i === layerCount - 1) {
        type = 'boss';
      } else {
        const r = Math.random();
        if (r < 0.1) {
          type = 'shop';
        } else {
          const types = ['battle', 'event', 'elite'];
          type = types[Math.floor(Math.random() * types.length)];
        }
      }
      const x = ((j + 1) * width) / (nodeCount + 1);
      const y = ((i + 1) * height) / (layerCount + 1);
      layer.push({ type, x, y, connections: [], completed: false });
    }
    mapState.layers.push(layer);
  }
  for (let i = 0; i < mapState.layers.length - 1; i++) {
    const nextLayer = mapState.layers[i + 1];
    mapState.layers[i].forEach((node) => {
      const sorted = nextLayer
        .map((nextNode, idx) => ({ idx, diff: Math.abs(node.x - nextNode.x) }))
        .sort((a, b) => a.diff - b.diff)
        .map((obj) => obj.idx);

      const maxConnections = Math.min(nextLayer.length, 3);
      const minConnections = Math.min(nextLayer.length, 2);
      const connectionCount =
        maxConnections === minConnections
          ? maxConnections
          : minConnections + Math.floor(Math.random() * (maxConnections - minConnections + 1));

      node.connections = sorted.slice(0, connectionCount);
    });
  }
  mapState.currentLayer = 0;
  mapState.currentNode = null;
  mapState.path = [];
  return mapState;
}



window.addEventListener('DOMContentLoaded', () => {
  initEngine();
  setupCollisionHandler();

  playerState.ownedBalls = ['normal', 'normal', 'normal'];
  playerState.ballLevels = { normal: 1 };
  playerState.playerMaxHP = 100 + playerState.hpLevel * 10;
  playerState.playerHP = playerState.playerMaxHP;
  updatePlayerHP();
  updateCoins();
  updateRelicIcons();

  const menuOverlay = document.getElementById('menu-overlay');
  const startButton = document.getElementById('start-button');
  const upgradeMenuButton = document.getElementById('upgrade-menu-button');
  const resetButton = document.getElementById('reset-progress');
  const upgradeButtons = document.getElementById('upgrade-buttons');
  const mainMenu = document.getElementById('main-menu');
  const upgradeHP = document.getElementById('upgrade-hp');
  const upgradeATK = document.getElementById('upgrade-atk');
  const upgradeBack = document.getElementById('upgrade-back');
  const xpDisplay = document.getElementById('xp-value');
  const xpOverlay = document.getElementById('xp-overlay');
  const xpContinue = document.getElementById('xp-continue-button');
    const rewardOverlay = document.getElementById('reward-overlay');
    const rewardButtons = document.querySelectorAll('.reward-button');
    const eventOverlay = document.getElementById('event-overlay');
    const eventMessage = document.getElementById('event-message');
    const eventOptions = document.getElementById('event-options');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const gameOverRetry = document.getElementById('game-over-retry-button');
    const reloadOverlay = document.getElementById('reload-overlay');
    const victoryOverlay = document.getElementById('victory-overlay');
    const shopOverlay = document.getElementById('shop-overlay');
    const creditBtn = document.getElementById('credit-button');
    const creditOverlay = document.getElementById('credit-overlay');
    const creditClose = document.getElementById('credit-close');
    const settingsButton = document.getElementById('settings-button');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose = document.getElementById('settings-close');
    const languageSelect = document.getElementById('language-select');

  const overlays = [
    menuOverlay,
    xpOverlay,
    rewardOverlay,
    eventOverlay,
    gameOverOverlay,
    reloadOverlay,
      victoryOverlay,
      shopOverlay,
      creditOverlay,
      settingsOverlay
    ];

  const savedLang = localStorage.getItem('lang') || document.documentElement.lang || 'ja';
  setLanguage(savedLang);
  if (languageSelect) {
    languageSelect.value = savedLang;
    languageSelect.addEventListener('change', (e) => setLanguage(e.target.value));
  }

  const isAnyOverlayVisible = () =>
    overlays.some(o => o.classList.contains('show'));

  const showOverlay = (overlay) => {
    overlay.classList.add('show');
  };

  const hideOverlay = (overlay) => {
    overlay.classList.remove('show');
  };

  showOverlay(menuOverlay);

  let aimTimer;

  function onRewardClick(e) {
    e.stopPropagation();
    rewardButtons.forEach(b => (b.disabled = true));
    const btn = e.currentTarget;
    const type = btn.dataset.type;
    playerState.ownedBalls.push(type);
    if (!playerState.ballLevels[type]) {
      playerState.ballLevels[type] = 1;
    }
    playerState.ammo = playerState.ownedBalls.slice();
    playerState.shotQueue = shuffle(playerState.ammo.slice());
    enemyState.selectNextBall();
    hideOverlay(rewardOverlay);
    proceedToNextLayer();
  }

  function setupRewardButtons() {
    rewardButtons.forEach(btn => {
      btn.disabled = false;
      btn.addEventListener('click', onRewardClick, { once: true });
    });
  }

  function onRareRewardClick(e) {
    e.stopPropagation();
    rareRewardButton.disabled = true;
    rareRewardOverlay.style.display = 'none';
    if (enemyState.pendingRareReward) {
      applyRareReward(enemyState.pendingRareReward);
      updateRelicIcons();
      enemyState.pendingRareReward = null;
    }
    if (enemyState.nodeType === 'boss') {
      const gained = 10;
      playerState.permXP += gained;
      localStorage.setItem('permXP', playerState.permXP);
      xpGained.textContent = gained;
      showOverlay(xpOverlay);
    } else {
      proceedToNextLayer();
    }
  }

  function setupRareRewardButton() {
    rareRewardButton.disabled = false;
    rareRewardButton.addEventListener('click', onRareRewardClick, { once: true });
  }

  function triggerRandomEvent(onDone) {
    const ev = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    if (ev.type === 'shop') {
      showShopOverlay(() => {
        onDone && onDone();
      });
      return;
    }
    eventMessage.textContent = t(ev.textKey);
    eventOptions.innerHTML = '';
    const choices = typeof ev.choices === 'function' ? ev.choices() : ev.choices;
    choices.forEach(choice => {
      const btn = document.createElement('button');
      if (choice.type && ballImageMap[choice.type]) {
        const img = document.createElement('img');
        img.src = ballImageMap[choice.type];
        img.alt = t(`balls.${choice.type}.full`);
        btn.appendChild(img);
      }
      const span = document.createElement('span');
      span.textContent = choice.labelKey ? t(choice.labelKey) : choice.label;
      btn.appendChild(span);
      btn.addEventListener('click', e => {
        e.stopPropagation();
        btn.disabled = true;
        choice.apply();
        updatePlayerHP();
        updateAmmo();
        eventMessage.textContent = choice.resultKey ? t(choice.resultKey) : choice.result;
        eventOptions.innerHTML = '';
        const okBtn = document.createElement('button');
        okBtn.textContent = t('common.ok');
        okBtn.addEventListener('click', e2 => {
          e2.stopPropagation();
          okBtn.disabled = true;
          hideOverlay(eventOverlay);
          onDone && onDone();
        }, { once: true });
        eventOptions.appendChild(okBtn);
      }, { once: true });
      eventOptions.appendChild(btn);
    });
    showOverlay(eventOverlay);
  }

  function proceedToNextLayer() {
    const current = mapState.path[mapState.path.length - 1];
    if (current) {
      current.completed = true;
      updateMapDisplay(mapState);
    }
    const maxLayerIndex = mapState.layers.length - 1;
    mapState.currentLayer = Math.min(
      mapState.currentLayer + 1,
      maxLayerIndex
    );
    mapState.currentNode = current;
    if (
      mapState.currentLayer >= 0 &&
      mapState.currentLayer < mapState.layers.length
    ) {
      showMapOverlay(mapState, handleNodeSelection);
    }
    setupRewardButtons();
    setupRareRewardButton();
  }

  function handleNodeSelection(index) {
    const node = mapState.layers[mapState.currentLayer][index];
    mapState.currentNode = node;
    node.completed = false;
    mapState.path.push(node);
    updateMapDisplay(mapState);
    if (node.type === 'event') {
      triggerRandomEvent(() => {
        proceedToNextLayer();
      });
    } else if (node.type === 'shop') {
      showShopOverlay(() => {
        proceedToNextLayer();
      });
    } else {
      enemyState.stage += 1;
      startStage(node.type);
    }
  }

  const startReload = () => {
    showOverlay(reloadOverlay);
    playerState.reloading = true;
    setTimeout(() => {
      playerState.ammo = playerState.ownedBalls.slice();
      playerState.shotQueue = shuffle(playerState.ammo.slice());
      hideOverlay(reloadOverlay);
      enemyState.selectNextBall();
      playerState.reloading = false;
    }, 1000);
  };

  document.addEventListener('ballsCleared', () => {
    if (playerState.ammo.length === 0 && !playerState.reloading) {
      startReload();
    }
  });

  startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    worldStage = 0;
    enemyState.stage = 0;
    enemyState.gameOver = false;
    playerState.coins = 0;
    localStorage.setItem('coins', playerState.coins);
    updateCoins();
    updateRelicIcons();
    generateMap(stageSettings[worldStage]);
    updateMapDisplay(mapState);
    showMapOverlay(mapState, handleNodeSelection);
    hideOverlay(menuOverlay);
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

  upgradeBack.addEventListener('click', (e) => {
    e.stopPropagation();
    upgradeButtons.style.display = 'none';
    mainMenu.style.display = 'flex';
  });

    xpContinue.addEventListener('click', (e) => {
      e.stopPropagation();
      hideOverlay(xpOverlay);
      worldStage += 1;
      enemyState.stage = 0;
      mapState.currentLayer = 0;
      mapState.currentNode = null;
      mapState.path = [];
    playerState.ownedBalls = ['normal', 'normal', 'normal'];
    playerState.ballLevels = { normal: 1 };
    playerState.playerMaxHP = 100 + playerState.hpLevel * 10;
    playerState.playerHP = playerState.playerMaxHP;
    playerState.ammo = playerState.ownedBalls.slice();
    playerState.shotQueue = shuffle(playerState.ammo.slice());
    playerState.currentBalls = [];
    playerState.currentShotType = null;
    playerState.nextBall = null;
    playerState.reloading = false;
    updatePlayerHP();
    enemyState.selectNextBall();
    if (worldStage > 2) {
        showOverlay(menuOverlay);
        playerState.coins = 0;
        localStorage.setItem('coins', playerState.coins);
        updateCoins();
        updateRelicIcons();
    } else {
        generateMap(stageSettings[worldStage]);
        updateMapDisplay(mapState);
        document.getElementById('stage-value').textContent = enemyState.stage;
        updateCoins();
        updateRelicIcons();
        showMapOverlay(mapState, handleNodeSelection);
    }
    });

    creditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showOverlay(creditOverlay);
    });

    creditClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideOverlay(creditOverlay);
    });

    settingsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      showOverlay(settingsOverlay);
    });

    settingsClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideOverlay(settingsOverlay);
    });

  setupRewardButtons();
  setupRareRewardButton();

  gameOverRetry.addEventListener('click', (e) => {
    e.stopPropagation();
    hideOverlay(gameOverOverlay);
    worldStage = 0;
    enemyState.stage = 0;
    enemyState.gameOver = false;
    playerState.ownedBalls = ['normal', 'normal', 'normal'];
    playerState.ballLevels = { normal: 1 };
    playerState.playerMaxHP = 100 + playerState.hpLevel * 10;
    playerState.playerHP = playerState.playerMaxHP;
    playerState.ammo = playerState.ownedBalls.slice();
    playerState.shotQueue = shuffle(playerState.ammo.slice());
    playerState.currentBalls = [];
    playerState.currentShotType = null;
    playerState.nextBall = null;
    playerState.reloading = false;
    updatePlayerHP();
    enemyState.selectNextBall();
    playerState.coins = 0;
    localStorage.setItem('coins', playerState.coins);
    updateCoins();
    updateRelicIcons();
    generateMap(stageSettings[worldStage]);
    updateMapDisplay(mapState);
    showMapOverlay(mapState, handleNodeSelection);
  });

  const aimSvg = document.getElementById('aim-svg');

  window.addEventListener('mousemove', (e) => {
    if (playerState.currentBalls.length > 0 || enemyState.gameOver || isAnyOverlayVisible()) return;
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
    if (!playerState.nextBall) {
      enemyState.selectNextBall();
      if (!playerState.nextBall) return;
    }
    if (playerState.currentBalls.length > 0 || enemyState.gameOver || playerState.reloading || isAnyOverlayVisible()) return;
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
    enemyState.selectNextBall();
  };

  aimSvg.addEventListener('click', handleShoot);
});
