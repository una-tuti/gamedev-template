import Phaser from 'phaser';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
  }

  create(): void {
    this.add.text(640, 360, 'ゲーム開始', {
      fontFamily: 'sans-serif',
      fontSize: '40px',
      color: '#000000',
      align: 'center',
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause('PlayScene');
      this.scene.launch('PauseScene');
    });
  }
}
