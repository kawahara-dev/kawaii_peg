import { playerState } from './player.js';

export const relicList = [
  {
    key: 'timeLag',
    name: 'タイムラグ',
    description: '1/5の確率で敵の攻撃を1ターン遅くする',
    icon: '⏳'
  },
  {
    key: 'rebound',
    name: 'リバウンド',
    description: '1/2の確率で落下したボールが再落下する',
    icon: '🔄'
  },
  {
    key: 'killHeal',
    name: 'キルヒール',
    description: '敵撃破でHP10回復',
    icon: '💖'
  },
  {
    key: 'damageBoost',
    name: 'ダメブースト',
    description: 'ペグ破壊時に追加ダメージ1~3',
    icon: '💥'
  },
  {
    key: 'coinCharm',
    name: 'コインチャーム',
    description: '敵撃破でコイン10追加',
    icon: '💰'
  }
];

export function addRelic(key) {
  playerState.relics = playerState.relics || [];
  if (!playerState.relics.includes(key)) {
    playerState.relics.push(key);
  }
}

export function getRandomRelic() {
  return relicList[Math.floor(Math.random() * relicList.length)];
}
