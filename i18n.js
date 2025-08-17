export const translations = {
  ja: {
    menu: {
      title: 'Peggy Girls',
      start: 'スタート',
      upgrade: 'アップグレード',
      skills: 'スキルツリー',
      reset: '進捗リセット',
      settings: '設定',
      credit: 'クレジット'
    },
    upgrade: {
      xp: '経験値: ',
      hp: 'HPアップ(+10) 10XP',
      atk: '攻撃アップ(+10%) 10XP',
      back: '戻る'
    },
    skillTree: {
      title: 'スキルツリー',
      back: '戻る',
      unlock: '{cost}で習得',
      unlocked: '習得済み',
      skills: {
        doubleShot: {
          name: 'ダブルショット',
          desc: '2連続で撃てるよ☆',
          cost: '15XP'
        },
        maxHp: {
          name: 'HPアップ',
          desc: '最大HPが20増えるよ♪',
          cost: '10XP'
        }
      }
    },
    hud: {
      hp: 'HP: ',
      ammo: '弾: ',
      untilAttack: '攻撃まで',
      damage: 'ダメージ',
      pause: 'ポーズ',
      resume: '再開',
      speed: '速度',
      speed1: '1x',
      speed2: '2x'
    },
    balls: {
      normal: { name: 'ノーマル', full: 'ノーマルボール' },
      split: { name: 'スプリット', full: 'スプリットボール' },
      heal: { name: 'ヒール', full: 'ヒールボール' },
      big: { name: 'ビッグ', full: 'ビッグボール' },
      penetration: { name: 'ペネトレーション', full: 'ペネトレーションボール' }
    },
    reward: {
      title: 'リザルト',
      coinSuffix: 'コインGET',
      message: '報酬ボールを選んでね',
      options: {
        split: { desc: '弾が2つに分裂するよ♪' },
        heal: { desc: '当たるとHP回復するよ☆' },
        big: { desc: '弾がでかくなるよ☆' },
        penetration: { desc: '敵を貫通するよ♡' }
      }
    },
    rareReward: { title: 'レア報酬ゲット！', continue: 'OK' },
    event: { title: 'ランダムイベント発生☆' },
    shop: {
      title: 'ショップだよ☆',
      close: 'やめる',
      buy: '購入',
      sell: '削除',
      upgrade: '強化',
      relic: 'レリック',
      buyRelic: '入手'
    },
    xp: { title: '経験値GET! +', continue: 'メニューへ' },
    gameOver: { title: 'ゲームオーバー😭', retry: 'リトライ' },
    gameClear: { title: 'ゲームクリア✨', menu: 'タイトルへ' },
    reload: { text: 'リロード中…' },
    settings: {
      title: '設定',
      language: '言語',
      options: { ja: '日本語', en: 'English' },
      close: '閉じる'
    },
    credit: { close: '閉じる' },
    progress: { randomEvent: 'ランダムイベント' },
    events: {
      spring: {
        text: 'キラキラの泉を発見したよ☆',
        choices: {
          drink: 'ゴクゴク飲む💖',
          skip: 'やめとく〜'
        },
        results: {
          drink: 'HPが20回復したよ💕',
          skip: '何も変わらなかったよ〜'
        }
      },
      powerStone: {
        text: '怪しいパワーストーン✨どのボールを強化する？',
        choiceLabel: '{type}ボール強化する〜',
        result: '{type}ボールがパワーアップしたよ✨',
        passLabel: 'やっぱパス',
        passResult: '強化しなかったよ〜'
      },
      trap: {
        text: 'トゲトゲの罠があるっぽい…',
        choices: {
          avoid: 'そっと避ける✨',
          step: '踏んでみる⁉️'
        },
        results: {
          avoid: '上手く避けたよ♪',
          step: 'イタタ…HPが20減っちゃった💦'
        }
      },
      foundBall: {
        text: '道端にノーマルボールが落ちてた！',
        choices: {
          take: '拾っちゃお🎀',
          skip: '今はいらないかも'
        },
        results: {
          take: 'ノーマルボールゲットだよ☆',
          skip: 'スルーしたよ〜'
        }
      },
      treasure: {
        text: 'キラキラの宝箱を見つけたよ☆',
        choices: {
          open: '開ける💎',
          leave: 'そのままにする'
        },
        results: {
          open: '30コインをゲットしたよ💰',
          leave: '何も起きなかった〜'
        }
      }
    },
      history: {
        title: 'バージョン履歴',
        v1_7: 'v1.7 (2025-08-17) 5人目キャラ追加',
        v1_6: 'v1.6 (2025-08-15) ボスのオーラ演出と攻撃カウントダウン追加、ボス撃破後に全回復、レア報酬改善',
        v1_5: 'v1.5 (2025-08-11) 4人目キャラ追加',
      v1_4: 'v1.4 (2025-08-10) 敵画像ファイル名の整理＆参照更新',
      v1_3: 'v1.3 (2025-08-09) 爆弾衝突のバグ修正＆コインアイコンクレジット追加',
      v1_2: 'v1.2 (2025-08-06) バージョン履歴を更新',
      v1_1: 'v1.1 (2025-08-05) メニュー画面＆スタートボタン、弾数アイコンと特殊弾選択、ステージ進行と敵HPスケール、リロード演出、ステージ5で経験値＆スキル強化を追加',
      v1_0: 'v1.0 (2025-08-05) ステージ5クリアで経験値獲得＆スキル強化追加',
      v0_9_2: 'v0.9.2 (2025-08-05) プレイヤーHP0で敗北オーバーレイ表示',
      v0_9_1: 'v0.9.1 (2025-08-05) 初期ボール数を3に設定',
      v0_9: 'v0.9 (2025-08-05) 弾数制限とリロードを実装',
      v0_8: 'v0.8 (2025-08-05) 爆弾ペグ追加',
      v0_7: 'v0.7 (2025-08-04) 敗北オーバーレイとランダム画像',
      v0_6: 'v0.6 (2025-08-04) ペグのランダム化と黄色ペグのダブルダメージ',
      v0_5: 'v0.5 (2025-08-04) 勝利画像とリトライボタン',
      v0_4: 'v0.4 (2025-08-04) 累積ダメージ表示、着地時にダメージ確定',
      v0_3: 'v0.3 (2025-08-04) ボール落下ダメージとエフェクト',
      v0_2: 'v0.2 (2025-08-04) 敵ダメージ時に画像を一瞬切り替え',
      v0_1: 'v0.1 (2025-08-03) 初期リリース'
    },
    common: { ok: 'OK' }
  },
  en: {
    menu: {
      title: 'Peggy Girls',
      start: 'Start',
      upgrade: 'Upgrade',
      skills: 'Skill Tree',
      reset: 'Reset Progress',
      settings: 'Settings',
      credit: 'Credits'
    },
    upgrade: {
      xp: 'XP: ',
      hp: 'HP Up (+10) 10XP',
      atk: 'ATK Up (+10%) 10XP',
      back: 'Back'
    },
    skillTree: {
      title: 'Skill Tree',
      back: 'Back',
      unlock: 'Unlock for {cost}',
      unlocked: 'Unlocked',
      skills: {
        doubleShot: {
          name: 'Double Shot',
          desc: 'Shoot twice in a row♪',
          cost: '15XP'
        },
        maxHp: {
          name: 'HP Up',
          desc: 'Increase max HP by 20☆',
          cost: '10XP'
        }
      }
    },
    hud: {
      hp: 'HP: ',
      ammo: 'Ammo: ',
      untilAttack: 'Until Attack',
      damage: 'Damage',
      pause: 'Pause',
      resume: 'Resume',
      speed: 'Speed',
      speed1: '1x',
      speed2: '2x'
    },
    balls: {
      normal: { name: 'Normal', full: 'Normal Ball' },
      split: { name: 'Split', full: 'Split Ball' },
      heal: { name: 'Heal', full: 'Heal Ball' },
      big: { name: 'Big', full: 'Big Ball' },
      penetration: { name: 'Penetration', full: 'Penetration Ball' }
    },
    reward: {
      title: 'Result',
      coinSuffix: 'Coins',
      message: 'Choose your reward ball',
      options: {
        split: { desc: 'Splits into two♪' },
        heal: { desc: 'Restores HP on hit☆' },
        big: { desc: 'Becomes bigger☆' },
        penetration: { desc: 'Pierces enemies♡' }
      }
    },
    rareReward: { title: 'Rare Reward!', continue: 'OK' },
    event: { title: 'Random Event☆' },
    shop: {
      title: 'Shop Time☆',
      close: 'Leave',
      buy: 'Buy',
      sell: 'Remove',
      upgrade: 'Upgrade',
      relic: 'Relic',
      buyRelic: 'Buy'
    },
    xp: { title: 'XP Gained! +', continue: 'Menu' },
    gameOver: { title: 'Game Over😭', retry: 'Retry' },
    gameClear: { title: 'Game Clear✨', menu: 'Back to Title' },
    reload: { text: 'Reloading…' },
    settings: {
      title: 'Settings',
      language: 'Language',
      options: { ja: 'Japanese', en: 'English' },
      close: 'Close'
    },
    credit: { close: 'Close' },
    progress: { randomEvent: 'Random Event' },
    events: {
      spring: {
        text: 'You found a sparkling spring☆',
        choices: {
          drink: 'Drink it💖',
          skip: 'Leave it'
        },
        results: {
          drink: 'Recovered 20 HP💕',
          skip: 'Nothing happened~'
        }
      },
      powerStone: {
        text: 'A suspicious power stone✨ Which ball will you enhance?',
        choiceLabel: 'Enhance the {type} ball',
        result: 'The {type} ball powered up✨',
        passLabel: 'Pass',
        passResult: 'Didn\u2019t enhance~'
      },
      trap: {
        text: 'Looks like a spiky trap…',
        choices: {
          avoid: 'Carefully avoid✨',
          step: 'Step on it⁉️'
        },
        results: {
          avoid: 'Dodged safely♪',
          step: 'Ouch... Lost 20 HP💦'
        }
      },
      foundBall: {
        text: 'A normal ball was lying on the road!',
        choices: {
          take: 'Pick it up🎀',
          skip: 'Maybe not now'
        },
        results: {
          take: 'Got a normal ball☆',
          skip: 'Skipped it~'
        }
      },
      treasure: {
        text: 'You spot a shiny treasure chest☆',
        choices: {
          open: 'Open it💎',
          leave: 'Leave it'
        },
        results: {
          open: 'Got 30 coins💰',
          leave: 'Nothing happened~'
        }
      }
    },
      history: {
        title: 'Version History',
        v1_7: 'v1.7 (2025-08-17) Added 5th character',
        v1_6: 'v1.6 (2025-08-15) Added boss aura and attack countdown, fully heal after boss defeat, and improved rare rewards',
        v1_5: 'v1.5 (2025-08-11) Added 4th character',
        v1_4: 'v1.4 (2025-08-10) Organized enemy image filenames and updated references',
        v1_3: 'v1.3 (2025-08-09) Fixed bomb collision bug and added coin icon credit',
        v1_2: 'v1.2 (2025-08-06) Updated version history',
        v1_1: 'v1.1 (2025-08-05) Added menu screen & start button, ammo icons and special ball selection, stage progression and enemy HP scale, reload animation, and XP & skill upgrade at stage 5',
        v1_0: 'v1.0 (2025-08-05) Added XP and skill upgrade for clearing stage 5',
      v0_9_2: 'v0.9.2 (2025-08-05) Show defeat overlay when player HP reaches 0',
      v0_9_1: 'v0.9.1 (2025-08-05) Set initial ball count to 3',
      v0_9: 'v0.9 (2025-08-05) Implemented ammo limit and reload',
      v0_8: 'v0.8 (2025-08-05) Added bomb pegs',
      v0_7: 'v0.7 (2025-08-04) Defeat overlay and random images',
      v0_6: 'v0.6 (2025-08-04) Randomized pegs and yellow peg double damage',
      v0_5: 'v0.5 (2025-08-04) Victory image and retry button',
      v0_4: 'v0.4 (2025-08-04) Cumulative damage display and damage confirmation on landing',
      v0_3: 'v0.3 (2025-08-04) Ball drop damage and effect',
      v0_2: 'v0.2 (2025-08-04) Temporary image change on enemy damage',
      v0_1: 'v0.1 (2025-08-03) Initial release'
    },
    common: { ok: 'OK' }
  }
};

let currentLang = 'ja';

export function t(key) {
  return key.split('.').reduce((o, k) => (o ? o[k] : undefined), translations[currentLang]) || key;
}

export function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const txt = t(key);
    if (txt !== undefined) {
      el.textContent = txt;
    }
  });
  const historyEl = document.getElementById('version-history');
  if (historyEl) {
    const history = translations[currentLang].history;
    const titleEl = historyEl.querySelector('h3');
    const listEl = historyEl.querySelector('ul');
    if (history) {
      if (titleEl) titleEl.textContent = history.title || '';
      if (listEl) {
        listEl.innerHTML = '';
        Object.keys(history)
          .filter(k => k !== 'title')
          .forEach(k => {
            const li = document.createElement('li');
            li.textContent = history[k];
            listEl.appendChild(li);
          });
      }
    }
  }
  localStorage.setItem('lang', lang);
}
