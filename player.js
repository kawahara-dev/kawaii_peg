export const playerState = {
  currentBalls: [],
  currentShotType: null,
  playerHP: 100,
  playerMaxHP: 100,
  ammo: [],
  ownedBalls: [],
  ballLevels: { normal: 1 },
  nextBall: null,
  reloading: false,
  permXP: parseInt(localStorage.getItem('permXP') || '0'),
  hpLevel: parseInt(localStorage.getItem('hpLevel') || '0'),
  atkLevel: parseInt(localStorage.getItem('atkLevel') || '0'),
  coins: parseInt(localStorage.getItem('coins') || '0')
};
