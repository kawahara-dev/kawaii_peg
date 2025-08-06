window.addEventListener('DOMContentLoaded', () => {
  const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;
  const width = 880;
  const height = 700;
  const engine = Engine.create();
  const world = engine.world;

  const render = Render.create({
    element: document.getElementById("game-wrapper"),
    engine: engine,
    options: {
      width,
      height,
      wireframes: false,
      background: '#fff0f5'
    }
  });
  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);

  const wallOptions = { isStatic: true, render: { fillStyle: '#ff69b4' } };
  const walls = [
    Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions),
    Bodies.rectangle(width / 2, -25, width, 50, wallOptions),
    Bodies.rectangle(-25, height / 2, 50, height, wallOptions),
    Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions)
  ];
  World.add(world, walls);

  const bottomSensor = Bodies.rectangle(width / 2, height - 10, width, 20, {
    isStatic: true,
    isSensor: true,
    label: "bottom-sensor",
    render: { visible: false }
  });
  World.add(world, bottomSensor);

  let pegs = [];
  function generatePegs(count) {
    pegs.forEach((p) => World.remove(world, p));
    pegs = [];
    for (let i = 0; i < count; i++) {
      const x = 50 + Math.random() * (width - 100);
      const y = 150 + Math.random() * (height - 250);
      const r = Math.random();
      let peg;
      if (r < 0.1) {
        peg = Bodies.circle(x, y, 10, {
          isStatic: true,
          render: { fillStyle: "#808080" },
          label: "peg-bomb"
        });
        peg.bombHits = 0;
      } else if (r < 0.3) {
        peg = Bodies.circle(x, y, 10, {
          isStatic: true,
          render: { fillStyle: "#ffd700" },
          label: "peg-yellow"
        });
      } else {
        peg = Bodies.circle(x, y, 10, {
          isStatic: true,
          render: { fillStyle: "#ff69b4" },
          label: "peg"
        });
      }
      pegs.push(peg);
    }
    World.add(world, pegs);
  }

  const firePoint = { x: width / 2, y: 50 };
  const aimSvg = document.getElementById("aim-svg");
  function drawSimulatedPath(angle, speed) {
    while (aimSvg.firstChild) aimSvg.removeChild(aimSvg.firstChild);
    const ghostEngine = Engine.create({ gravity: engine.gravity });
    const ghostBall = Bodies.circle(firePoint.x, firePoint.y, 15, {
      isSensor: true,
      render: { visible: false }
    });
    Body.setVelocity(ghostBall, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    });
    World.add(ghostEngine.world, ghostBall);
    for (let i = 0; i < 20; i++) {
      Engine.update(ghostEngine, 1000 / 60);
      const { x, y } = ghostBall.position;
      if (x < 0 || x > width || y < 0 || y > height) break;
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", 3);
      dot.setAttribute("class", "aim-dot");
      aimSvg.appendChild(dot);
    }
  }

  let currentBalls = [];
  let currentShotType = null;
  let playerHP = 100;
  let playerMaxHP = 100;
  let stage = 1;
  let maxEnemyHP = 100;
  let enemyHP = maxEnemyHP;
  let pendingDamage = 0;
  let gameOver = false;
  let ammo = [];
  let ownedBalls = [];
  let ballLevels = { normal: 1 };
  let reloading = false;

  let permXP = parseInt(localStorage.getItem("permXP") || "0");
  let hpLevel = parseInt(localStorage.getItem("hpLevel") || "0");
  let atkLevel = parseInt(localStorage.getItem("atkLevel") || "0");

  const hpFill = document.getElementById("hp-fill");
  const hpText = document.getElementById("hp-text");
  const hpDisplay = document.getElementById("hp-display");
  const playerHpValue = document.getElementById("player-hp-value");
  const playerHpMaxText = document.getElementById("player-hp-max");
  const playerHpFill = document.getElementById("player-hp-fill");
  const ammoValue = document.getElementById("ammo-value");
  const stageValue = document.getElementById("stage-value");
  const enemyGirl = document.getElementById("enemy-girl");
  const victoryOverlay = document.getElementById("victory-overlay");
  const victoryImg = document.getElementById("victory-img");
  const rewardOverlay = document.getElementById("reward-overlay");
  const retryButton = document.getElementById("retry-button");
  const gameOverOverlay = document.getElementById("game-over-overlay");
  const gameOverRetryButton = document.getElementById("game-over-retry-button");
  const reloadOverlay = document.getElementById("reload-overlay");
  const menuOverlay = document.getElementById("menu-overlay");
  const startButton = document.getElementById("start-button");
  const upgradeMenuButton = document.getElementById("upgrade-menu-button");
  const resetProgressButton = document.getElementById("reset-progress");
  const xpOverlay = document.getElementById("xp-overlay");
  const xpGained = document.getElementById("xp-gained");
  const xpContinueButton = document.getElementById("xp-continue-button");
  const xpValue = document.getElementById("xp-value");
  const upgradeHpButton = document.getElementById("upgrade-hp");
  const upgradeAtkButton = document.getElementById("upgrade-atk");
  const upgradeMenu = document.getElementById("upgrade-buttons");
  const defeatImages = ["enemy_defete.png", "enemy_defete2.png"];
  retryButton.style.display = "none";
  retryButton.addEventListener("click", () => location.reload());
  gameOverRetryButton.addEventListener("click", () => location.reload());
  function updateMenu() {
    xpValue.textContent = permXP;
    upgradeHpButton.textContent = `HPアップ Lv${hpLevel} (10XP)`;
    upgradeAtkButton.textContent = `攻撃アップ Lv${atkLevel} (10XP)`;
  }
  updateMenu();

  upgradeMenuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    updateMenu();
    upgradeMenu.style.display = upgradeMenu.style.display === "flex" ? "none" : "flex";
  });

  resetProgressButton.addEventListener("click", (e) => {
    e.stopPropagation();
    localStorage.clear();
    location.reload();
  });

  upgradeHpButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (permXP >= 10) {
      permXP -= 10;
      hpLevel++;
      localStorage.setItem("permXP", permXP);
      localStorage.setItem("hpLevel", hpLevel);
      updateMenu();
    }
  });

  upgradeAtkButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (permXP >= 10) {
      permXP -= 10;
      atkLevel++;
      localStorage.setItem("permXP", permXP);
      localStorage.setItem("atkLevel", atkLevel);
      updateMenu();
    }
  });


  startButton.addEventListener("click", (e) => {
    e.stopPropagation();
    menuOverlay.style.display = "none";
    stage = 1;
    ownedBalls = ["normal", "normal", "normal"];
    ballLevels = { normal: 1 };
    playerMaxHP = 100 + hpLevel * 10;
    playerHP = playerMaxHP;
    startStage();
    updatePlayerHP();
  });
  xpContinueButton.addEventListener("click", () => location.reload());
  document.querySelectorAll(".reward-button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      rewardOverlay.style.display = "none";
      stage++;
      if (stage > 5) stage = 5;
      if (ownedBalls.includes(type)) {
        ballLevels[type] = (ballLevels[type] || 1) + 1;
      } else {
        ownedBalls.push(type);
        ballLevels[type] = 1;
      }
      startStage();
    });
  });

  function startStage() {
    enemyGirl.src = "enemy_normal.png";
    generatePegs(50 + (stage - 1) * 10);
    maxEnemyHP = 100 + (stage - 1) * 100;
    enemyHP = maxEnemyHP;
    pendingDamage = 0;
    currentBalls = [];
    currentShotType = null;
    ammo = ownedBalls.slice();
    updateHPBar();
    updateAmmo();
    stageValue.textContent = stage;
  }

  function updateHPBar() {
    const percent = Math.max(0, (enemyHP / maxEnemyHP) * 100);
    hpFill.style.width = `${percent}%`;
    hpText.textContent = `${enemyHP}`;
    hpDisplay.textContent = `${enemyHP} / ${maxEnemyHP}`;
    if (enemyHP <= 0 && !gameOver) {
      setTimeout(() => {
        victoryImg.src = defeatImages[Math.floor(Math.random() * defeatImages.length)];
        victoryOverlay.style.display = "flex";
        const proceed = () => {
          victoryOverlay.style.display = "none";
          victoryOverlay.removeEventListener("click", proceed);
          if (stage >= 5) {
            const gained = 10;
            permXP += gained;
            localStorage.setItem("permXP", permXP);
            xpGained.textContent = gained;
            xpOverlay.style.display = "flex";
          } else {
            rewardOverlay.style.display = "flex";
          }
        };
        victoryOverlay.addEventListener("click", proceed, { once: true });
      }, 200);
    }
  }

  function updatePlayerHP() {
    const percent = Math.max(0, (playerHP / playerMaxHP) * 100);
    playerHpValue.textContent = `${playerHP}`;
    playerHpMaxText.textContent = `${playerMaxHP}`;
    playerHpFill.style.width = `${percent}%`;

    const hpBox = document.getElementById("player-hp-container");
    hpBox.classList.add("flash-effect");
    setTimeout(() => hpBox.classList.remove("flash-effect"), 300);

    if (playerHP <= 0) {
      setTimeout(() => {
        gameOver = true;
        gameOverOverlay.style.display = "flex";
        Runner.stop(runner);
        Render.stop(render);
      }, 200);
    }
  }

  function updateAmmo() {
    ammoValue.innerHTML = "";
    ammo.forEach(type => {
      const icon = document.createElement("span");
      icon.className = "ammo-ball";
      if (type === "split") icon.style.background = "#dda0dd";
      else if (type === "heal") icon.style.background = "#90ee90";
      else if (type === "big") icon.style.background = "#ffa500";
      const badge = document.createElement("span");
      badge.className = "level-badge";
      badge.textContent = ballLevels[type] || 1;
      icon.appendChild(badge);
      ammoValue.appendChild(icon);
    });
  }

  function flashEnemyDamage() {
    enemyGirl.src = "enemy_damage.png";
    setTimeout(() => {
      if (enemyHP > 0) {
        enemyGirl.src = "enemy_normal.png";
      }
    }, 500);
  }

  function launchHeartAttack() {
    const heart = document.createElement("div");
    heart.className = "heart-beam";
    heart.style.left = "1050px";
    heart.style.top = "400px";
    const dx = -700 + Math.floor(Math.random() * 100) - 50;
    const dy = -300 + Math.floor(Math.random() * 60) - 30;
    heart.style.setProperty('--dx', `${dx}px`);
    heart.style.setProperty('--dy', `${dy}px`);
    document.getElementById("container").appendChild(heart);
    setTimeout(() => heart.remove(), 800);
  }

  function showDamageText(x, y, text, isHeal = false) {
    const dmg = document.createElement("div");
    dmg.className = isHeal ? "damage-text heal-text" : "damage-text";
    dmg.textContent = text;
    dmg.style.left = `${x}px`;
    dmg.style.top = `${y}px`;
    document.getElementById("game-wrapper").appendChild(dmg);
    setTimeout(() => dmg.remove(), 1000);
  }

  function showHitSpark(x, y) {
    const spark = document.createElement("div");
    spark.className = "hit-spark";
    spark.style.left = `${x - 10}px`;
    spark.style.top = `${y - 10}px`;
    document.getElementById("game-wrapper").appendChild(spark);
    setTimeout(() => spark.remove(), 400);
  }

  function showHealSpark(x, y) {
    const spark = document.createElement("div");
    spark.className = "heal-spark";
    spark.style.left = `${x - 10}px`;
    spark.style.top = `${y - 10}px`;
    document.getElementById("game-wrapper").appendChild(spark);
    setTimeout(() => spark.remove(), 400);
  }

  function showBombExplosion(x, y) {
    const boom = document.createElement("div");
    boom.className = "bomb-explosion";
    boom.style.left = `${x - 80}px`;
    boom.style.top = `${y - 80}px`;
    document.getElementById("game-wrapper").appendChild(boom);
    setTimeout(() => boom.remove(), 500);
  }

  function showDamageOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "damage-overlay";
    document.getElementById("container").appendChild(overlay);
    setTimeout(() => overlay.remove(), 300);
  }

  function shakeContainer() {
    const cont = document.getElementById("container");
    cont.classList.add("shake");
    setTimeout(() => cont.classList.remove("shake"), 300);
  }

  function enemyAttack() {
    playerHP -= 10;
    updatePlayerHP();
    showDamageOverlay();
    shakeContainer();
  }

  function reload() {
    if (reloading) return;
    reloading = true;
    reloadOverlay.style.display = "flex";
    setTimeout(() => {
      enemyAttack();
      ammo = Array(ownedBalls.length).fill("normal");
      updateAmmo();
      reloadOverlay.style.display = "none";
      reloading = false;
    }, 2000);
  }

  function explodeBomb(peg, ball) {
    const { x, y } = peg.position;
    showBombExplosion(x, y);
    const bodies = Composite.allBodies(engine.world);
    bodies.forEach(body => {
      if (["peg", "peg-yellow", "peg-bomb"].includes(body.label)) {
        const dx = body.position.x - x;
        const dy = body.position.y - y;
        if (Math.sqrt(dx * dx + dy * dy) <= 80) {
          World.remove(world, body);
          let dmg = body.label === "peg-yellow" ? 20 : 10;
          dmg *= ball.damageMultiplier || 1;
          dmg *= 1 + atkLevel * 0.1;
          pendingDamage += dmg;
          showDamageText(body.position.x, body.position.y, "+" + pendingDamage, ball.ballType === "heal");
          if (ball.ballType === "heal") {
            showHealSpark(body.position.x, body.position.y);
          } else {
            showHitSpark(body.position.x, body.position.y);
          }
        }
      }
    });
    const bx = ball.position.x - x;
    const by = ball.position.y - y;
    const len = Math.sqrt(bx * bx + by * by) || 1;
    Body.setVelocity(ball, { x: (bx / len) * 20, y: (by / len) * 20 });
  }

    window.addEventListener("mousemove", (e) => {
      const rect = aimSvg.getBoundingClientRect();
      const dx = e.clientX - rect.left - firePoint.x;
      const dy = e.clientY - rect.top - firePoint.y;
      const angle = Math.atan2(dy, dx);
      drawSimulatedPath(angle, 10);
    });

    window.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = aimSvg.getBoundingClientRect();
        const dx = touch.clientX - rect.left - firePoint.x;
        const dy = touch.clientY - rect.top - firePoint.y;
        const angle = Math.atan2(dy, dx);
        drawSimulatedPath(angle, 10);
      }
    });

    function shootBall(angle, type) {
      const power = 10;
      const lvl = ballLevels[type] || 1;
      const dmgMul = 1 + (lvl - 1) * 0.2;
      const sizeMul = 1 + (lvl - 1) * 0.1;
      if (type === "split") {
        const offset = 0.2;
        const radius = 15 * sizeMul;
        for (let i = -1; i <= 1; i += 2) {
          const a = angle + i * offset;
          const ball = Bodies.circle(firePoint.x, firePoint.y, radius, {
            restitution: 0.9,
            render: { fillStyle: "#dda0dd" },
            label: "ball"
          });
          ball.damageMultiplier = 0.5 * dmgMul;
          ball.ballType = "split";
          Body.setVelocity(ball, { x: Math.cos(a) * power, y: Math.sin(a) * power });
          World.add(world, ball);
          currentBalls.push(ball);
        }
      } else {
        const base = type === "big" ? 30 : 15;
        const radius = base * sizeMul;
        const color = type === "big" ? "#ffa500" : (type === "heal" ? "#90ee90" : "#00bfff");
        const ball = Bodies.circle(firePoint.x, firePoint.y, radius, {
          restitution: 0.9,
          render: { fillStyle: color },
          label: "ball"
        });
        ball.damageMultiplier = dmgMul;
        ball.ballType = type;
        Body.setVelocity(ball, { x: Math.cos(angle) * power, y: Math.sin(angle) * power });
        World.add(world, ball);
        currentBalls.push(ball);
      }
      currentShotType = type;
      updateAmmo();
    }

    window.addEventListener("click", (e) => {
      if (currentBalls.length > 0 || gameOver || getComputedStyle(rewardOverlay).display !== "none" || getComputedStyle(menuOverlay).display !== "none") return;
      if (ammo.length <= 0) {
        reload();
        return;
      }
      const rect = aimSvg.getBoundingClientRect();
      const dx = e.clientX - rect.left - firePoint.x;
      const dy = e.clientY - rect.top - firePoint.y;
      const angle = Math.atan2(dy, dx);
      const idx = Math.floor(Math.random() * ammo.length);
      const type = ammo.splice(idx, 1)[0];
      shootBall(angle, type);
    });

    window.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      if (currentBalls.length > 0 || gameOver || getComputedStyle(rewardOverlay).display !== "none" || getComputedStyle(menuOverlay).display !== "none") return;
      if (ammo.length <= 0) {
        reload();
        return;
      }
      const touch = e.touches[0];
      const rect = aimSvg.getBoundingClientRect();
      const dx = touch.clientX - rect.left - firePoint.x;
      const dy = touch.clientY - rect.top - firePoint.y;
      const angle = Math.atan2(dy, dx);
      const idx = Math.floor(Math.random() * ammo.length);
      const type = ammo.splice(idx, 1)[0];
      shootBall(angle, type);
    });

  Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes("ball") && labels.includes("peg-bomb")) {
        const peg = pair.bodyA.label === "peg-bomb" ? pair.bodyA : pair.bodyB;
        const ball = pair.bodyA.label === "ball" ? pair.bodyA : pair.bodyB;
        if (!peg.bombHits) {
          peg.bombHits = 1;
          peg.render.fillStyle = "#ff4500";
        } else {
          explodeBomb(peg, ball);
        }
      } else if (labels.includes("ball") && (labels.includes("peg") || labels.includes("peg-yellow"))) {
        const peg = pair.bodyA.label === "ball" ? pair.bodyB : pair.bodyA;
        const ball = pair.bodyA.label === "ball" ? pair.bodyA : pair.bodyB;
        World.remove(world, peg);
        let damage = peg.label === "peg-yellow" ? 20 : 10;
        damage *= ball.damageMultiplier || 1;
        damage *= 1 + atkLevel * 0.1;
        pendingDamage += damage;
        showDamageText(peg.position.x, peg.position.y, "+" + pendingDamage, ball.ballType === "heal");
        if (ball.ballType === "heal") {
          showHealSpark(peg.position.x, peg.position.y);
        } else {
          showHitSpark(peg.position.x, peg.position.y);
        }
      }
      if (labels.includes("ball") && labels.includes("bottom-sensor")) {
        const ball = pair.bodyA.label === "ball" ? pair.bodyA : pair.bodyB;
        const { x, y } = ball.position;
        World.remove(world, ball);
        currentBalls = currentBalls.filter(b => b !== ball);
        if (currentBalls.length === 0) {
          let totalDamage = pendingDamage;
          if (currentShotType !== "heal") {
            totalDamage = Math.min(totalDamage, Math.max(enemyHP, 0));
          }
          if (currentShotType === "heal") {
            if (enemyHP > 0) {
              enemyAttack();
              launchHeartAttack();
            }
            playerHP = Math.min(playerMaxHP, playerHP + totalDamage);
            updatePlayerHP();
            showDamageText(x, y, "+" + totalDamage, true);
            showHealSpark(x, y);
          } else {
            if (totalDamage > 0) {
              enemyHP -= totalDamage;
              updateHPBar();
              flashEnemyDamage();
              showDamageText(x, y, "-" + totalDamage);
              showHitSpark(x, y);
            }
            if (enemyHP > 0) {
              enemyAttack();
              launchHeartAttack();
            }
          }
          pendingDamage = 0;
          currentShotType = null;
        }
      }
    });
  });

});
