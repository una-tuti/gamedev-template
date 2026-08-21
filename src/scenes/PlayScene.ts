import Phaser from 'phaser';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
  }

  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private dashKey!: Phaser.Input.Keyboard.Key;
  private playerVelocityY = 0;
  private terrainTiles: Array<{ x: number; y: number; width: number; height: number }> = [];
  private jumpHoldTimer = 0;
  private jumpStartY = 0;
  private isJumping = false;
  private dashTimer = 0;
  private dashDirection = 0;
  private facingDirection = 1;
  private maxHp = 100;
  private currentHp = 100;
  private maxJumpPower = 2;
  private jumpPowerStock = 2;
  private jumpPowerRechargeTimers: number[] = [0, 0];
  private maxDashPower = 2;
  private dashPowerStock = 2;
  private dashPowerRechargeTimers: number[] = [0, 0];
  private lastSafeTileTop = { x: 0, y: 0 };
  private respawnDelayTimer = 0;
  private enemies: Phaser.GameObjects.Rectangle[] = [];
  private enemyShootCooldowns: number[] = [];
  private enemyProjectiles: Phaser.GameObjects.Rectangle[] = [];
  private goalFlagPole!: Phaser.GameObjects.Rectangle;
  private goalFlagTriangle!: Phaser.GameObjects.Polygon;
  private isGameCleared = false;
  private hpBarFrame!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private jumpPowerLabel!: Phaser.GameObjects.Text;
  private jumpPowerIcons: Phaser.GameObjects.Rectangle[] = [];
  private jumpPowerTimers: Phaser.GameObjects.Text[] = [];
  private dashPowerLabel!: Phaser.GameObjects.Text;
  private dashPowerIcons: Phaser.GameObjects.Rectangle[] = [];
  private dashPowerTimers: Phaser.GameObjects.Text[] = [];
  private worldStartX = 0;
  private worldWidth = 0;

  private resetRuntimeState(): void {
    this.playerVelocityY = 0;
    this.terrainTiles = [];
    this.jumpHoldTimer = 0;
    this.jumpStartY = 0;
    this.isJumping = false;
    this.dashTimer = 0;
    this.dashDirection = 0;
    this.facingDirection = 1;
    this.currentHp = 100;
    this.jumpPowerStock = 2;
    this.jumpPowerRechargeTimers = [0, 0];
    this.dashPowerStock = 2;
    this.dashPowerRechargeTimers = [0, 0];
    this.lastSafeTileTop = { x: 0, y: 0 };
    this.respawnDelayTimer = 0;
    this.enemyShootCooldowns = [];
    this.isGameCleared = false;
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.enemyProjectiles.forEach((projectile) => projectile.destroy());
    this.enemyProjectiles = [];
    if (this.goalFlagPole) {
      this.goalFlagPole.destroy();
    }
    if (this.goalFlagTriangle) {
      this.goalFlagTriangle.destroy();
    }
    if (this.player) {
      this.player.destroy();
    }
    this.cameras.main.stopFollow();
    this.jumpPowerIcons.forEach((icon) => icon.destroy());
    this.jumpPowerTimers.forEach((timerText) => timerText.destroy());
    this.dashPowerIcons.forEach((icon) => icon.destroy());
    this.dashPowerTimers.forEach((timerText) => timerText.destroy());
    this.jumpPowerIcons = [];
    this.jumpPowerTimers = [];
    this.dashPowerIcons = [];
    this.dashPowerTimers = [];

    if (this.hpBarFrame) {
      this.hpBarFrame.destroy();
    }
    if (this.hpBarFill) {
      this.hpBarFill.destroy();
    }
    if (this.hpText) {
      this.hpText.destroy();
    }
    if (this.jumpPowerLabel) {
      this.jumpPowerLabel.destroy();
    }
    if (this.dashPowerLabel) {
      this.dashPowerLabel.destroy();
    }
  }

  create(): void {
    this.resetRuntimeState();

    const tileSize = 64;
    const levelMap = [
      '...............E............................E........F......',
      '111111111111111111111111111111....11111111111111111111111111',
      '111111111111111111111111111111....11111111111111111111111111',
    ];

    const startY = this.scale.height - levelMap.length * tileSize;
    const mapWidth = levelMap[0].length * tileSize;
    const startX = 0;
    this.worldStartX = startX;
    this.worldWidth = mapWidth;

    let goalFlagX = 0;
    let goalFlagY = 0;
    let hasGoalFlag = false;
    const enemySpawns: Array<{ x: number; y: number }> = [];

    for (let row = 0; row < levelMap.length; row++) {
      for (let col = 0; col < levelMap[row].length; col++) {
        const cell = levelMap[row][col];
        const x = startX + col * tileSize;
        const y = startY + row * tileSize;

        if (cell === 'F') {
          goalFlagX = x + tileSize / 2;
          goalFlagY = y + tileSize / 2;
          hasGoalFlag = true;
          continue;
        }

        if (cell === 'E') {
          enemySpawns.push({ x: x + tileSize / 2, y: y + tileSize / 2 });
          continue;
        }

        if (cell !== '1') {
          continue;
        }

        this.add.rectangle(
          x + tileSize / 2,
          y + tileSize / 2,
          tileSize,
          tileSize,
          0xffffff,
          1,
        ).setStrokeStyle(4, 0x000000);
        this.terrainTiles.push({ x, y, width: tileSize, height: tileSize });
      }
    }

    if (!hasGoalFlag) {
      const fallbackColumn = levelMap[0].length - 5;
      goalFlagX = startX + fallbackColumn * tileSize + tileSize / 2;
      goalFlagY = startY + tileSize / 2;
    }

    const spawnX = startX + tileSize / 2;
    const spawnY = startY - tileSize / 2;
    this.player = this.add.rectangle(
      spawnX,
      spawnY,
      tileSize,
      tileSize,
      0xff0000,
      1,
    ).setStrokeStyle(3, 0x000000);
    this.lastSafeTileTop = {
      x: spawnX,
      y: spawnY,
    };

    if (enemySpawns.length === 0) {
      enemySpawns.push({
        x: this.worldStartX + this.worldWidth - 8 * tileSize - tileSize / 2,
        y: this.scale.height - 3 * tileSize + tileSize / 2,
      });
    }

    for (const spawn of enemySpawns) {
      const enemy = this.add.rectangle(
        spawn.x,
        spawn.y,
        tileSize * 0.75,
        tileSize * 0.75,
        0x6600cc,
        1,
      ).setStrokeStyle(3, 0x000000);
      this.enemies.push(enemy);
      this.enemyShootCooldowns.push(1.2);
    }

    const poleHeight = tileSize;
    const triangleHeight = poleHeight / 2;
    const triangleHalfWidth = poleHeight / 2;
    const poleCenterX = goalFlagX;
    const poleTopY = goalFlagY - poleHeight / 2;

    this.goalFlagPole = this.add.rectangle(
      poleCenterX,
      poleTopY + poleHeight / 2,
      12,
      poleHeight,
      0x3d3d3d,
      1,
    ).setStrokeStyle(2, 0x000000);
    this.goalFlagTriangle = this.add.polygon(
      poleCenterX + 12,
      poleTopY + triangleHeight + 2,
      [
        { x: 0, y: 0 },
        { x: triangleHalfWidth, y: -triangleHeight / 2 },
        { x: 0, y: -triangleHeight },
      ],
      0x00ff66,
      1,
    ).setStrokeStyle(2, 0x000000);

    const hpBarX = 26;
    const hpBarY = 26;
    const hpBarWidth = 220;
    const hpBarHeight = 20;
    const hpBarInnerWidth = hpBarWidth - 10;
    const hpBarInnerHeight = hpBarHeight - 8;
    this.hpBarFrame = this.add.rectangle(
      hpBarX + hpBarWidth / 2,
      hpBarY + hpBarHeight / 2,
      hpBarWidth,
      hpBarHeight,
      0xffffff,
      1,
    )
      .setStrokeStyle(4, 0x000000)
      .setScrollFactor(0);
    this.hpBarFill = this.add.rectangle(
      hpBarX + hpBarWidth / 2,
      hpBarY + hpBarHeight / 2,
      hpBarInnerWidth,
      hpBarInnerHeight,
      0xff0000,
      1,
    ).setScrollFactor(0);
    this.hpText = this.add.text(
      hpBarX + hpBarWidth + 18,
      hpBarY + hpBarHeight / 2,
      `${this.currentHp} / ${this.maxHp}`,
      {
        color: '#000000',
        fontSize: '22px',
      },
    )
      .setOrigin(0, 0.5)
      .setScrollFactor(0);

    const jumpPowerX = hpBarX + hpBarWidth + 18;
    const jumpPowerY = hpBarY + hpBarHeight + 18;
    const powerGroupOffsetX = 150;
    const powerGroupOffsetY = 0;

    this.jumpPowerLabel = this.add.text(
      jumpPowerX + powerGroupOffsetX,
      hpBarY + hpBarHeight + 2,
      'JP',
      {
        color: '#000000',
        fontSize: '18px',
        fontStyle: 'bold',
      },
    )
      .setOrigin(0, 0.5)
      .setScrollFactor(0);

    for (let i = 0; i < this.maxJumpPower; i++) {
      const icon = this.add.rectangle(
        jumpPowerX + powerGroupOffsetX + 34 + i * 24,
        jumpPowerY + powerGroupOffsetY,
        16,
        16,
        0x00ff00,
        1,
      )
        .setStrokeStyle(2, 0x000000)
        .setScrollFactor(0);
      this.jumpPowerIcons.push(icon);

      const timerText = this.add.text(
        jumpPowerX + powerGroupOffsetX + 34 + i * 24,
        jumpPowerY + powerGroupOffsetY + 20,
        '0.0s',
        {
          color: '#000000',
          fontSize: '10px',
        },
      )
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.jumpPowerTimers.push(timerText);
    }

    this.dashPowerLabel = this.add.text(
      jumpPowerX + powerGroupOffsetX + 120,
      hpBarY + hpBarHeight + 2,
      'DP',
      {
        color: '#000000',
        fontSize: '18px',
        fontStyle: 'bold',
      },
    )
      .setOrigin(0, 0.5)
      .setScrollFactor(0);

    for (let i = 0; i < this.maxDashPower; i++) {
      const icon = this.add.rectangle(
        jumpPowerX + powerGroupOffsetX + 154 + i * 24,
        jumpPowerY + powerGroupOffsetY,
        16,
        16,
        0x0000ff,
        1,
      )
        .setStrokeStyle(2, 0x000000)
        .setScrollFactor(0);
      this.dashPowerIcons.push(icon);

      const timerText = this.add.text(
        jumpPowerX + powerGroupOffsetX + 154 + i * 24,
        jumpPowerY + powerGroupOffsetY + 20,
        '0.0s',
        {
          color: '#000000',
          fontSize: '10px',
        },
      )
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.dashPowerTimers.push(timerText);
    }

    this.setHp(this.maxHp);
    this.updateJumpPowerUi();
    this.updateDashPowerUi();

    const worldWidth = this.worldStartX + this.worldWidth + tileSize;
    this.cameras.main.startFollow(this.player, false, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.dashKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
      keyboard.on('keydown-ESC', () => {
        this.scene.pause();
        this.scene.launch('PauseScene');
      });
    }
  }

  private updateHpBar(): void {
    const ratio = Phaser.Math.Clamp(this.currentHp / this.maxHp, 0, 1);
    const innerWidth = this.hpBarFrame.width - 10;
    const fillWidth = innerWidth * ratio;
    this.hpBarFill.displayWidth = fillWidth;
    this.hpBarFill.x = this.hpBarFrame.x - innerWidth / 2 + fillWidth / 2;
    this.hpText.setText(`${this.currentHp} / ${this.maxHp}`);
  }

  private setHp(value: number): void {
    this.currentHp = Phaser.Math.Clamp(value, 0, this.maxHp);
    this.updateHpBar();

    if (this.currentHp <= 0) {
      this.scene.stop();
      this.scene.start('GameOverScene');
    }
  }

  private updateJumpPowerUi(): void {
    this.jumpPowerLabel.setText(`JP ${this.jumpPowerStock}/${this.maxJumpPower}`);

    for (let i = 0; i < this.maxJumpPower; i++) {
      const icon = this.jumpPowerIcons[i];
      const timerText = this.jumpPowerTimers[i];
      if (!icon || !timerText) {
        continue;
      }

      const timer = this.jumpPowerRechargeTimers[i] ?? 0;
      const isAvailable = timer <= 0;
      icon.setFillStyle(isAvailable ? 0x00ff00 : 0xcccccc);
      icon.setAlpha(isAvailable ? 1 : 0.45);
      timerText.setText(isAvailable ? 'Ready' : `${timer.toFixed(1)}s`);
      timerText.setVisible(!isAvailable);
      timerText.setX(icon.x);
      timerText.setY(icon.y + 18);
    }
  }

  private consumeJumpPower(): void {
    if (this.jumpPowerStock <= 0) {
      return;
    }

    const firstReadyIndex = this.jumpPowerRechargeTimers.findIndex((timer) => timer <= 0);
    if (firstReadyIndex === -1) {
      return;
    }

    this.jumpPowerRechargeTimers[firstReadyIndex] = 2;
    this.jumpPowerStock -= 1;
    this.updateJumpPowerUi();
  }

  private updateJumpPower(deltaSeconds: number): void {
    for (let i = 0; i < this.maxJumpPower; i++) {
      const timer = this.jumpPowerRechargeTimers[i] ?? 0;
      if (timer > 0) {
        this.jumpPowerRechargeTimers[i] = Math.max(0, timer - deltaSeconds);
        if (this.jumpPowerRechargeTimers[i] === 0) {
          this.jumpPowerStock = Math.min(this.maxJumpPower, this.jumpPowerStock + 1);
        }
      }
    }

    this.updateJumpPowerUi();
  }

  private updateDashPowerUi(): void {
    this.dashPowerLabel.setText(`DP ${this.dashPowerStock}/${this.maxDashPower}`);

    for (let i = 0; i < this.maxDashPower; i++) {
      const icon = this.dashPowerIcons[i];
      const timerText = this.dashPowerTimers[i];
      if (!icon || !timerText) {
        continue;
      }

      const timer = this.dashPowerRechargeTimers[i] ?? 0;
      const isAvailable = timer <= 0;
      icon.setFillStyle(isAvailable ? 0x0000ff : 0xcccccc);
      icon.setAlpha(isAvailable ? 1 : 0.45);
      timerText.setText(isAvailable ? 'Ready' : `${timer.toFixed(1)}s`);
      timerText.setVisible(!isAvailable);
      timerText.setX(icon.x);
      timerText.setY(icon.y + 18);
    }
  }

  private consumeDashPower(): void {
    if (this.dashPowerStock <= 0) {
      return;
    }

    const firstReadyIndex = this.dashPowerRechargeTimers.findIndex((timer) => timer <= 0);
    if (firstReadyIndex === -1) {
      return;
    }

    this.dashPowerRechargeTimers[firstReadyIndex] = 2;
    this.dashPowerStock -= 1;
    this.updateDashPowerUi();
  }

  private updateDashPower(deltaSeconds: number): void {
    for (let i = 0; i < this.maxDashPower; i++) {
      const timer = this.dashPowerRechargeTimers[i] ?? 0;
      if (timer > 0) {
        this.dashPowerRechargeTimers[i] = Math.max(0, timer - deltaSeconds);
        if (this.dashPowerRechargeTimers[i] === 0) {
          this.dashPowerStock = Math.min(this.maxDashPower, this.dashPowerStock + 1);
        }
      }
    }

    this.updateDashPowerUi();
  }

  private respawnToLastSafePosition(): void {
    this.player.x = this.lastSafeTileTop.x;
    this.player.y = this.lastSafeTileTop.y;
    this.playerVelocityY = 0;
    this.jumpHoldTimer = 0;
    this.dashTimer = 0;
    this.dashDirection = 0;
  }

  private resolveHorizontalCollisions(previousX: number): void {
    const halfWidth = this.player.width / 2;

    for (const tile of this.terrainTiles) {
      const tileLeft = tile.x;
      const tileRight = tile.x + tile.width;
      const tileTop = tile.y;
      const tileBottom = tile.y + tile.height;
      const playerLeft = this.player.x - halfWidth;
      const playerRight = this.player.x + halfWidth;
      const prevLeft = previousX - halfWidth;
      const prevRight = previousX + halfWidth;
      const playerTop = this.player.y - this.player.height / 2;
      const playerBottom = this.player.y + this.player.height / 2;

      const overlapsY = playerBottom > tileTop && playerTop < tileBottom;
      if (!overlapsY) {
        continue;
      }

      if (prevRight <= tileLeft && playerRight >= tileLeft) {
        this.player.x = tileLeft - halfWidth;
      } else if (prevLeft >= tileRight && playerLeft <= tileRight) {
        this.player.x = tileRight + halfWidth;
      }
    }
  }

  private resolveVerticalCollisions(previousY: number): void {
    const halfHeight = this.player.height / 2;

    for (const tile of this.terrainTiles) {
      const tileLeft = tile.x;
      const tileRight = tile.x + tile.width;
      const tileTop = tile.y;
      const tileBottom = tile.y + tile.height;
      const playerLeft = this.player.x - this.player.width / 2;
      const playerRight = this.player.x + this.player.width / 2;
      const playerTop = this.player.y - halfHeight;
      const playerBottom = this.player.y + halfHeight;
      const prevTop = previousY - halfHeight;
      const prevBottom = previousY + halfHeight;

      const overlapsX = playerRight > tileLeft && playerLeft < tileRight;
      if (!overlapsX) {
        continue;
      }

      if (prevBottom <= tileTop && playerBottom >= tileTop && this.playerVelocityY >= 0) {
        this.player.y = tileTop - halfHeight;
        this.playerVelocityY = 0;
        this.jumpHoldTimer = 0;
        this.isJumping = false;
        this.jumpStartY = this.player.y;
        this.lastSafeTileTop = {
          x: tile.x + tile.width / 2,
          y: tileTop - halfHeight,
        };
      } else if (prevTop >= tileBottom && playerTop <= tileBottom && this.playerVelocityY < 0) {
        this.player.y = tileBottom + halfHeight;
        this.playerVelocityY = 0;
      }
    }
  }

  update(): void {
    const tileSize = 64;
    const minX = this.worldStartX + tileSize / 2;
    const maxX = this.worldStartX + this.worldWidth - tileSize / 2;
    const moveSpeed = tileSize * 6;
    const dashDistance = tileSize * 6;
    const dashDuration = 0.1;
    const dashSpeed = dashDistance / dashDuration;
    const gravity = 3200;
    const jumpCells = 4;
    const jumpHeight = tileSize * jumpCells;
    const jumpVelocity = (tileSize * jumpCells) / 0.05;
    const deltaSeconds = this.game.loop.delta / 1000;
    const fallThreshold = this.scale.height + 200;
    const respawnDelaySeconds = 0.5;

    this.updateJumpPower(deltaSeconds);
    this.updateDashPower(deltaSeconds);

    if (this.isGameCleared) {
      return;
    }

    for (let enemyIndex = 0; enemyIndex < this.enemies.length; enemyIndex++) {
      const enemy = this.enemies[enemyIndex];
      if (!enemy) {
        continue;
      }

      const cooldown = this.enemyShootCooldowns[enemyIndex] ?? 1.2;
      this.enemyShootCooldowns[enemyIndex] = Math.max(0, cooldown - deltaSeconds);

      const enemyVisibleOnScreen = enemy.x > this.cameras.main.worldView.left - 32 && enemy.x < this.cameras.main.worldView.right + 32;
      if (enemyVisibleOnScreen && this.enemyShootCooldowns[enemyIndex] <= 0) {
        const projectile = this.add.rectangle(
          enemy.x - enemy.width / 2,
          enemy.y,
          18,
          18,
          0x000000,
          1,
        ).setStrokeStyle(2, 0xffffff);
        this.enemyProjectiles.push(projectile);
        this.enemyShootCooldowns[enemyIndex] = 1.2;
      }
    }

    const projectileSpeed = 4 * tileSize;
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.enemyProjectiles[i];
      if (!projectile) {
        continue;
      }

      projectile.x -= projectileSpeed * deltaSeconds;
      const playerBounds = this.player.getBounds();
      const projectileBounds = projectile.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, projectileBounds)) {
        this.setHp(this.currentHp - 10);
        projectile.destroy();
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (projectile.x + projectile.width / 2 < this.worldStartX - 50) {
        projectile.destroy();
        this.enemyProjectiles.splice(i, 1);
      }
    }

    if (this.respawnDelayTimer > 0) {
      this.respawnDelayTimer = Math.max(0, this.respawnDelayTimer - deltaSeconds);
      if (this.respawnDelayTimer === 0) {
        this.setHp(this.currentHp - 20);
        this.respawnToLastSafePosition();
      }
      return;
    }

    if (this.player.y > fallThreshold) {
      this.respawnDelayTimer = respawnDelaySeconds;
      this.playerVelocityY = 0;
      return;
    }

    const playerLeft = this.player.x - this.player.width / 2;
    const playerRight = this.player.x + this.player.width / 2;
    const playerTop = this.player.y - this.player.height / 2;
    const playerBottom = this.player.y + this.player.height / 2;
    const flagLeft = this.goalFlagPole.x - this.goalFlagPole.width / 2 - 60;
    const flagRight = this.goalFlagPole.x + this.goalFlagPole.width / 2 + 40;
    const flagTop = this.goalFlagPole.y - this.goalFlagPole.height / 2;
    const flagBottom = this.goalFlagPole.y + this.goalFlagPole.height / 2;

    if (playerRight >= flagLeft && playerLeft <= flagRight && playerBottom >= flagTop && playerTop <= flagBottom) {
      this.isGameCleared = true;
      this.scene.stop();
      this.scene.start('ClearScene');
      return;
    }

    if (this.cursors.left?.isDown) {
      this.facingDirection = -1;
    }

    if (this.cursors.right?.isDown) {
      this.facingDirection = 1;
    }

    if (Phaser.Input.Keyboard.JustDown(this.dashKey) && this.dashTimer <= 0 && this.dashPowerStock > 0) {
      this.dashDirection = this.cursors.left?.isDown ? -1 : this.cursors.right?.isDown ? 1 : this.facingDirection;
      this.dashTimer = dashDuration;
      this.consumeDashPower();
    }

    const previousX = this.player.x;
    if (this.dashTimer > 0) {
      this.player.x += this.dashDirection * dashSpeed * deltaSeconds;
      this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
      this.dashTimer = Math.max(0, this.dashTimer - deltaSeconds);
    } else {
      if (this.cursors.left?.isDown) {
        this.player.x = Phaser.Math.Clamp(this.player.x - moveSpeed * deltaSeconds, minX, maxX);
      }

      if (this.cursors.right?.isDown) {
        this.player.x = Phaser.Math.Clamp(this.player.x + moveSpeed * deltaSeconds, minX, maxX);
      }
    }

    this.resolveHorizontalCollisions(previousX);

    const hasJumpPower = this.jumpPowerStock > 0;
    const canJump = !this.isJumping && hasJumpPower;
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && canJump) {
      this.playerVelocityY = -jumpVelocity;
      this.jumpStartY = this.player.y;
      this.jumpHoldTimer = 0;
      this.isJumping = true;
      this.consumeJumpPower();
    }

    if (this.dashTimer > 0) {
      if (this.playerVelocityY >= 0) {
        this.playerVelocityY = 0;
      }
    } else if (this.playerVelocityY < 0 && this.player.y <= this.jumpStartY - jumpHeight) {
      this.playerVelocityY = 0;
      this.jumpHoldTimer = 0.2;
    } else if (this.jumpHoldTimer > 0) {
      this.jumpHoldTimer = Math.max(0, this.jumpHoldTimer - deltaSeconds);
      this.playerVelocityY = 0;
    } else {
      this.playerVelocityY += gravity * deltaSeconds;
    }

    if (this.playerVelocityY >= 0 && this.isJumping) {
      this.isJumping = false;
    }

    const previousY = this.player.y;
    this.player.y += this.playerVelocityY * deltaSeconds;

    this.resolveVerticalCollisions(previousY);
  }
}
