import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.cameras.main.setBackgroundColor('#000000');

    this.add.text(centerX, centerY - 80, 'GAME OVER', {
      fontFamily: 'sans-serif',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 20, 'Zキーでリトライ', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 70, 'Xキーでタイトル', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-Z', () => {
      this.scene.start('PlayScene');
    });

    this.input.keyboard?.on('keydown-X', () => {
      this.scene.start('TitleScene');
    });
  }
}
