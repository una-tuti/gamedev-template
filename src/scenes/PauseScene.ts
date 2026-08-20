import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  private menuIndex = 0;
  private resumeText?: Phaser.GameObjects.Text;
  private titleText?: Phaser.GameObjects.Text;

  constructor() {
    super('PauseScene');
  }

  create(): void {
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6);
    overlay.setDepth(0);

    const pausedText = this.add.text(640, 220, 'ポーズ中', {
      fontFamily: 'sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      align: 'center',
    });
    pausedText.setOrigin(0.5);
    pausedText.setDepth(1);

    this.resumeText = this.add.text(500, 360, '再開', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
    });
    this.resumeText.setOrigin(0.5);
    this.resumeText.setDepth(1);

    this.titleText = this.add.text(780, 360, 'タイトル', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      color: '#888888',
      align: 'center',
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(1);

    this.updateSelection();

    this.input.keyboard.on('keydown-ESC', () => {
      this.resumeGame();
    });

    this.input.keyboard.on('keydown-Z', () => {
      if (this.menuIndex === 0) {
        this.resumeGame();
      } else {
        this.goToTitle();
      }
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      this.menuIndex = 1;
      this.updateSelection();
    });

    this.input.keyboard.on('keydown-LEFT', () => {
      this.menuIndex = 0;
      this.updateSelection();
    });
  }

  private updateSelection(): void {
    if (!this.resumeText || !this.titleText) {
      return;
    }

    this.resumeText.setColor(this.menuIndex === 0 ? '#ffffff' : '#888888');
    this.titleText.setColor(this.menuIndex === 1 ? '#ffffff' : '#888888');
  }

  private resumeGame(): void {
    this.scene.stop('PauseScene');
    this.scene.resume('PlayScene');
  }

  private goToTitle(): void {
    this.scene.stop('PauseScene');
    this.scene.stop('PlayScene');
    this.scene.start('TitleScene');
  }
}
