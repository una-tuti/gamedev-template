import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.text(centerX, centerY - 60, 'TITLE', {
      fontFamily: 'sans-serif',
      fontSize: '48px',
      color: '#000000',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 20, 'Zキーでスタート', {
      fontFamily: 'sans-serif',
      fontSize: '26px',
      color: '#000000',
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-Z', () => {
      this.scene.start('PlayScene');
    });
  }
}
