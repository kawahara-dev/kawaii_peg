import { initEngine, drawSimulatedPath, shootBall, setupCollisionHandler, firePoint, clearSimulatedPath } from './engine.js';
import { playerState } from './player.js';
import { enemyState, startStage } from './enemy.js';
import { updateAmmo, updatePlayerHP, updateCurrentBall, updateProgress, showShopOverlay, updateCoins } from './ui.js';
import { healBallPath } from './constants.js';
import { shuffle } from './utils.js';

const ballImageMap = {
  normal: './image/balls/normal_ball.png',
  split: './image/balls/split_ball.png',
  heal: healBallPath,
  big: './image/balls/big_ball.png',
  penetration: './image/balls/penetration_ball.png'
};

const randomEvents = [
  {
    text: 'キラキラの泉を発見したよ☆',
    choices: [
      {
        label: 'ゴクゴク飲む💖',
        apply() {
          playerState.playerHP = Math.min(
            playerState.playerMaxHP,
            playerState.playerHP + 20
          );
        },
        result: 'HPが20回復したよ💕'
      },
      {
        label: 'やめとく〜',
        apply() {},
        result: '何も変わらなかったよ〜'
      }
    ]
  },
  {
    text: '怪しいパワーストーン✨どのボールを強化する？',
    // choices can be dynamic based on owned ball types
    choices() {
      const types = [...new Set(playerState.ownedBalls)];
      const opts = types.map(type => ({
        type,
        label: `${type}ボール強化する〜`,
        apply() {
          playerState.ballLevels[type] = (playerState.ballLevels[type] || 1) + 1;
          updateAmmo();
          updateCurrentBall(firePoint);
        },
        result: `${type}ボールがパワーアップしたよ✨`
      }));
      opts.push({ type: null, label: 'やっぱパス', apply() {}, result: '強化しなかったよ〜' });
      return opts;
    }
  },
  {
    text: 'トゲトゲの罠があるっぽい…',
    choices: [
      {
        label: 'そっと避ける✨',
        apply() {},
        result: '上手く避けたよ♪'
      },
      {
        label: '踏んでみる⁉️',
        apply() {
          playerState.playerHP = Math.max(0, playerState.playerHP - 20);
        },
        result: 'イタタ…HPが20減っちゃった💦'
      }
    ]
  },
  {
    text: '道端にノーマルボールが落ちてた！',
    choices: [
      {
        label: '拾っちゃお🎀',
        apply() {
            playerState.ownedBalls.push('normal');
            playerState.ammo = playerState.ownedBalls.slice();
            playerState.shotQueue = shuffle(playerState.ammo.slice());
            enemyState.selectNextBall();
        },
        result: 'ノーマルボールゲットだよ☆'
      },
      {
        label: '今はいらないかも',
        apply() {},
        result: 'スルーしたよ〜'
      }
    ]
  },
  {
    type: 'shop'
  }
];

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

  const overlays = [
    menuOverlay,
    xpOverlay,
    rewardOverlay,
    eventOverlay,
    gameOverOverlay,
    reloadOverlay,
      victoryOverlay,
      shopOverlay,
      creditOverlay
    ];

  const isAnyOverlayVisible = () =>
    overlays.some(o => window.getComputedStyle(o).display !== 'none');

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

  function triggerRandomEvent() {
    enemyState.progressIndex++;
    updateProgress(enemyState);
    const skipChance = 0.2;
    if (Math.random() < skipChance) {
      enemyState.stage += 1;
      startStage();
      return;
    }
    const ev = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    if (ev.type === 'shop') {
      showShopOverlay(() => {
        enemyState.stage += 1;
        startStage();
      });
      return;
    }
    eventMessage.textContent = ev.text;
    eventOptions.innerHTML = '';
    const choices = typeof ev.choices === 'function' ? ev.choices() : ev.choices;
    choices.forEach(choice => {
      const btn = document.createElement('button');
      if (choice.type && ballImageMap[choice.type]) {
        const img = document.createElement('img');
        img.src = ballImageMap[choice.type];
        img.alt = `${choice.type}ボール`;
        btn.appendChild(img);
      }
      const span = document.createElement('span');
      span.textContent = choice.label;
      btn.appendChild(span);
      btn.addEventListener('click', e => {
        e.stopPropagation();
        choice.apply();
        updatePlayerHP();
        updateAmmo();
        eventMessage.textContent = choice.result;
        eventOptions.innerHTML = '';
        let proceeded = false;
        const proceed = () => {
          if (proceeded) return;
          proceeded = true;
          eventOverlay.style.display = 'none';
          enemyState.stage += 1;
          startStage();
        };
        let timer;
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.addEventListener('click', e2 => {
          e2.stopPropagation();
          clearTimeout(timer);
          proceed();
        });
        eventOptions.appendChild(okBtn);
        timer = setTimeout(proceed, 2000);
      });
      eventOptions.appendChild(btn);
    });
    eventOverlay.style.display = 'flex';
  }

  const startReload = () => {
    reloadOverlay.style.display = 'flex';
    playerState.reloading = true;
    setTimeout(() => {
      playerState.ammo = playerState.ownedBalls.slice();
      playerState.shotQueue = shuffle(playerState.ammo.slice());
      reloadOverlay.style.display = 'none';
      enemyState.selectNextBall();
      playerState.reloading = false;
    }, 1000);
  };

  startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    enemyState.stage = 1;
    enemyState.gameOver = false;
    playerState.coins = 0;
    localStorage.setItem('coins', playerState.coins);
    updateCoins();
    startStage();
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
      xpOverlay.style.display = 'none';
      showOverlay(menuOverlay);
      enemyState.stage = 1;
    enemyState.progressIndex = 0;
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
    updateProgress(enemyState);
    document.getElementById('stage-value').textContent = enemyState.stage;
    playerState.coins = 0;
    localStorage.setItem('coins', playerState.coins);
      updateCoins();
    });

    creditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showOverlay(creditOverlay);
    });

    creditClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideOverlay(creditOverlay);
    });

  rewardButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      playerState.ownedBalls.push(type);
      if (!playerState.ballLevels[type]) {
        playerState.ballLevels[type] = 1;
      }
      playerState.ammo = playerState.ownedBalls.slice();
      playerState.shotQueue = shuffle(playerState.ammo.slice());
      enemyState.selectNextBall();
      rewardOverlay.style.display = 'none';
      triggerRandomEvent();
    });
  });

  gameOverRetry.addEventListener('click', (e) => {
    e.stopPropagation();
    gameOverOverlay.style.display = 'none';
    enemyState.stage = 1;
    enemyState.gameOver = false;
    enemyState.progressIndex = 0;
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
    updateProgress(enemyState);
    playerState.coins = 0;
    localStorage.setItem('coins', playerState.coins);
    updateCoins();
    startStage();
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
