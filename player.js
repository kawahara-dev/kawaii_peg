export const playerState = {
  currentBalls: [],
  currentShotType: null,
  playerHP: 100,
  playerMaxHP: 100,
  ammo: [],
  shotQueue: [],
  ownedBalls: [],
  ballLevels: { normal: 1 },
  nextBall: null,
  reloading: false,
  permXP: parseInt(localStorage.getItem('permXP') || '0', 10),
  hpLevel: parseInt(localStorage.getItem('hpLevel') || '0', 10),
  atkLevel: parseInt(localStorage.getItem('atkLevel') || '0', 10),
  coins: parseInt(localStorage.getItem('coins') || '0', 10),
  relics: []
};
