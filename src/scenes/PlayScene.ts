import Phaser from 'phaser';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
  }

  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  create(): void {
    const tileSize = 64;
    const cols = 10;
    const rows = 2;
    const terrainWidth = cols * tileSize;
    const terrainHeight = rows * tileSize;
    const startX = this.scale.width / 2 - terrainWidth / 2;
    const startY = this.scale.height - terrainHeight;

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

    this.player = this.add.rectangle(
      startX + tileSize / 2,
      startY - tileSize / 2,
      tileSize,
      tileSize,
      0xff0000,
      1,
    ).setStrokeStyle(3, 0x000000);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene');
    });
  }

  update(): void {
    const tileSize = 64;
    const cols = 10;
    const terrainWidth = cols * tileSize;
    const startX = this.scale.width / 2 - terrainWidth / 2;
    const minX = startX + tileSize / 2;
    const maxX = startX + terrainWidth - tileSize / 2;
    const moveSpeed = 280;

    if (this.cursors.left?.isDown) {
      this.player.x = Phaser.Math.Clamp(this.player.x - moveSpeed * this.game.loop.delta / 1000, minX, maxX);
    }

    if (this.cursors.right?.isDown) {
      this.player.x = Phaser.Math.Clamp(this.player.x + moveSpeed * this.game.loop.delta / 1000, minX, maxX);
    }
  }
}
