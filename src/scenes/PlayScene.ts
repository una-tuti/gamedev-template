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
  private isGrounded = false;
  private groundY = 0;
  private jumpHoldTimer = 0;
  private dashTimer = 0;
  private dashDirection = 0;
  private facingDirection = 1;

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
    this.groundY = startY;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.add.rectangle(
          startX + col * tileSize + tileSize / 2,
          startY + row * tileSize + tileSize / 2,
          tileSize,
          tileSize,
          0xffffff,
          1,
        ).setStrokeStyle(4, 0x000000);
      }
    }

    const extensionStartX = startX + terrainWidth + tileSize * 4;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < extensionCols; col++) {
        this.add.rectangle(
          extensionStartX + col * tileSize + tileSize / 2,
          startY + row * tileSize + tileSize / 2,
          tileSize,
          tileSize,
          0xffffff,
          1,
        ).setStrokeStyle(4, 0x000000);
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
    const groundTop = this.groundY - this.player.height / 2;

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

    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && this.isGrounded) {
      this.playerVelocityY = -jumpVelocity;
      this.jumpHoldTimer = 0.1;
      this.isGrounded = false;
    }

    if (this.player.y <= groundTop - jumpHeight) {
      if (this.jumpHoldTimer > 0) {
        this.jumpHoldTimer -= deltaSeconds;
        this.playerVelocityY = 0;
      } else {
        this.playerVelocityY += gravity * deltaSeconds;
      }
    } else {
      this.playerVelocityY += gravity * deltaSeconds;
    }

    this.player.y += this.playerVelocityY * deltaSeconds;

    if (this.player.y >= groundTop) {
      this.player.y = groundTop;
      this.playerVelocityY = 0;
      this.isGrounded = true;
      this.jumpHoldTimer = 0;
    } else {
      this.isGrounded = false;
    }
  }
}
