import Phaser from 'phaser';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
  }

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

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene');
    });
  }
}
