export const playerState = {
  currentBalls: [],
  currentShotType: null,
  playerHP: 100,
  playerMaxHP: 100,
  ammo: [],
  shotQueue: [],
  ownedBalls: JSON.parse(localStorage.getItem('ownedBalls') || '["normal","normal","normal"]'),
  ballLevels: JSON.parse(localStorage.getItem('ballLevels') || '{"normal":1}'),
  nextBall: null,
  reloading: false,
  permXP: parseInt(localStorage.getItem('permXP') || '0', 10),
  hpLevel: parseInt(localStorage.getItem('hpLevel') || '0', 10),
  atkLevel: parseInt(localStorage.getItem('atkLevel') || '0', 10),
  coins: parseInt(localStorage.getItem('coins') || '0', 10),
  relics: []
};

export function saveBallState() {
  localStorage.setItem('ownedBalls', JSON.stringify(playerState.ownedBalls));
  localStorage.setItem('ballLevels', JSON.stringify(playerState.ballLevels));
}
