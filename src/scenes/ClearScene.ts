import Phaser from 'phaser';

export class ClearScene extends Phaser.Scene {
  constructor() {
    super('ClearScene');
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.cameras.main.setBackgroundColor('#000000');

    this.add.text(centerX, centerY - 80, 'CLEAR', {
      fontFamily: 'sans-serif',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 20, 'Zキーでタイトル', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-Z', () => {
      this.scene.start('TitleScene');
    });
  }
}
