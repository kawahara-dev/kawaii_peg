import { playerState } from './player.js';
import { shuffle } from './utils.js';

export const rareRewardPools = {
  elite: [
    {
      description: '貫通ボールを入手！',
      apply() {
        playerState.ownedBalls.push('penetration');
        if (!playerState.ballLevels.penetration) {
          playerState.ballLevels.penetration = 1;
        }
        playerState.ammo = playerState.ownedBalls.slice();
        playerState.shotQueue = shuffle(playerState.ammo.slice());
      }
    },
    {
      description: '20XPを獲得！',
      apply() {
        playerState.permXP += 20;
        localStorage.setItem('permXP', playerState.permXP);
      }
    },
    {
      description: 'ダブルショットを習得！',
      apply() {
        playerState.skills = playerState.skills || [];
        playerState.skills.push('doubleShot');
      }
    }
  ],
  boss: [
    {
      description: '貫通ボールを入手！',
      apply() {
        playerState.ownedBalls.push('penetration');
        if (!playerState.ballLevels.penetration) {
          playerState.ballLevels.penetration = 1;
        }
        playerState.ammo = playerState.ownedBalls.slice();
        playerState.shotQueue = shuffle(playerState.ammo.slice());
      }
    },
    {
      description: '50XPを獲得！',
      apply() {
        playerState.permXP += 50;
        localStorage.setItem('permXP', playerState.permXP);
      }
    },
    {
      description: 'メガバーストを習得！',
      apply() {
        playerState.skills = playerState.skills || [];
        playerState.skills.push('megaBlast');
      }
    }
  ]
};

export function getRareReward(type) {
  const pool = rareRewardPools[type] || [];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function applyRareReward(reward) {
  if (reward && typeof reward.apply === 'function') {
    reward.apply();
  }
}
