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
  private dashTimer = 0;
  private dashDirection = 0;
  private facingDirection = 1;
  private maxHp = 100;
  private currentHp = 100;
  private lastSafeTileTop = { x: 0, y: 0 };
  private hpBarFrame!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;

  create(): void {
    const tileSize = 64;
    const cols = 10;
    const rows = 2;
    const terrainWidth = cols * tileSize;
    const terrainHeight = rows * tileSize;
    const extensionCols = 6;
    const extensionPadding = 4 * tileSize;
    const totalWidth = terrainWidth + extensionPadding + extensionCols * tileSize;
    const startX = this.scale.width / 2 - terrainWidth / 2;
    const startY = this.scale.height - terrainHeight;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * tileSize;
        const y = startY + row * tileSize;
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

    const extensionStartX = startX + terrainWidth + tileSize * 4;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < extensionCols; col++) {
        const x = extensionStartX + col * tileSize;
        const y = startY + row * tileSize;
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

    this.player = this.add.rectangle(
      startX + tileSize / 2,
      startY - tileSize / 2,
      tileSize,
      tileSize,
      0xff0000,
      1,
    ).setStrokeStyle(3, 0x000000);
    this.lastSafeTileTop = {
      x: startX + tileSize / 2,
      y: startY - tileSize / 2,
    };

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
    this.setHp(this.maxHp);

    const worldWidth = startX + totalWidth + tileSize;
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
    const cols = 10;
    const extensionCols = 6;
    const terrainWidth = cols * tileSize;
    const extensionPadding = 4 * tileSize;
    const totalWidth = terrainWidth + extensionPadding + extensionCols * tileSize;
    const startX = this.scale.width / 2 - terrainWidth / 2;
    const minX = startX + tileSize / 2;
    const maxX = startX + totalWidth - tileSize / 2;
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

    if (this.player.y > fallThreshold) {
      this.setHp(this.currentHp - 20);
      this.respawnToLastSafePosition();
      return;
    }

    if (this.cursors.left?.isDown) {
      this.facingDirection = -1;
    }

    if (this.cursors.right?.isDown) {
      this.facingDirection = 1;
    }

    if (Phaser.Input.Keyboard.JustDown(this.dashKey) && this.dashTimer <= 0) {
      this.dashDirection = this.cursors.left?.isDown ? -1 : this.cursors.right?.isDown ? 1 : this.facingDirection;
      this.dashTimer = dashDuration;
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

    if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      this.playerVelocityY = -jumpVelocity;
      this.jumpStartY = this.player.y;
      this.jumpHoldTimer = 0;
    }

    if (this.dashTimer > 0) {
      this.playerVelocityY = 0;
    } else if (this.playerVelocityY < 0 && this.player.y <= this.jumpStartY - jumpHeight) {
      this.playerVelocityY = 0;
      this.jumpHoldTimer = 0.2;
    } else if (this.jumpHoldTimer > 0) {
      this.jumpHoldTimer = Math.max(0, this.jumpHoldTimer - deltaSeconds);
      this.playerVelocityY = 0;
    } else {
      this.playerVelocityY += gravity * deltaSeconds;
    }

    const previousY = this.player.y;
    this.player.y += this.playerVelocityY * deltaSeconds;

    this.resolveVerticalCollisions(previousY);
  }
}
