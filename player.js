export const skillTree = [
  { key: 'doubleShot', cost: 15 },
  { key: 'maxHp', cost: 10 }
];

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
  baseDamage: parseFloat(localStorage.getItem('baseDamage') || '20'),
  comboBonus: parseFloat(localStorage.getItem('comboBonus') || '0.15'),
  restitution: parseFloat(localStorage.getItem('restitution') || '0'),
  shotPower: parseInt(localStorage.getItem('shotPower') || '0', 10),
  multiballCount: Math.max(1, parseInt(localStorage.getItem('multiballCount') || '1', 10)),
  critRate: parseFloat(localStorage.getItem('critRate') || '0.1'),
  critMultiplier: parseFloat(localStorage.getItem('critMultiplier') || '1.8'),
  coins: parseInt(localStorage.getItem('coins') || '0', 10),
  relics: [],
  skills: JSON.parse(localStorage.getItem('skills') || '[]')
};

export function saveBallState() {
  localStorage.setItem('ownedBalls', JSON.stringify(playerState.ownedBalls));
  localStorage.setItem('ballLevels', JSON.stringify(playerState.ballLevels));
}

export function saveSkillState() {
  localStorage.setItem('skills', JSON.stringify(playerState.skills));
}
