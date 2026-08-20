import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const titleText = this.add.text(640, 240, 'タイトル', {
      fontFamily: 'sans-serif',
      fontSize: '48px',
      color: '#000000',
      align: 'center',
    });
    titleText.setOrigin(0.5);

    const startText = this.add.text(640, 360, 'zキーでスタート', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      color: '#000000',
      align: 'center',
    });
    startText.setOrigin(0.5);

    this.input.keyboard.on('keydown-Z', () => {
      this.scene.start('PlayScene');
    });
  }
}
