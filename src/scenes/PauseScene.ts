import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.6);
    this.add.rectangle(centerX, centerY, 420, 240, 0xffffff, 1).setStrokeStyle(4, 0x000000);

    this.add.text(centerX, centerY - 45, 'PAUSE', {
      fontFamily: 'sans-serif',
      fontSize: '40px',
      color: '#000000',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 10, 'Z: 再開', {
      fontFamily: 'sans-serif',
      fontSize: '26px',
      color: '#000000',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 55, 'X: タイトル', {
      fontFamily: 'sans-serif',
      fontSize: '26px',
      color: '#000000',
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-Z', () => {
      this.scene.resume('PlayScene');
      this.scene.stop();
    });

    this.input.keyboard?.on('keydown-X', () => {
      this.scene.stop('PauseScene');
      this.scene.stop('PlayScene');
      this.scene.start('TitleScene');
    });
  }
}
