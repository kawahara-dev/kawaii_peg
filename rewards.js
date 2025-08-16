import { playerState, saveBallState } from './player.js';
import { shuffle } from './utils.js';
import { addRelic, getRandomRelic } from './relics.js';

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
        saveBallState();
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
};

export function getRareReward(type) {
  if (type === 'boss') {
    const relic = getRandomRelic();
    return {
      description: `${relic.name}を入手！<br>${relic.description}`,
      icon: relic.icon,
      apply() {
        addRelic(relic.key);
      }
    };
  }
  const pool = rareRewardPools[type] || [];
  const reward = pool[Math.floor(Math.random() * pool.length)];
  if (reward.type === 'relic') {
    const relic = getRandomRelic();
    return {
      description: `${relic.name}を入手！<br>${relic.description}`,
      icon: relic.icon,
      apply() {
        addRelic(relic.key);
      }
    };
  }
  return reward;
}

export function applyRareReward(reward) {
  if (reward && typeof reward.apply === 'function') {
    reward.apply();
  }
}
