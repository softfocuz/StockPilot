import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#87CEEB',
  scene: {
    preload,
    create
  }
};

const ingredients = [
  { name: 'Banana', color: 0xFFE135 },
  { name: 'Strawberry', color: 0xFF4C4C },
  { name: 'Mango', color: 0xFFA500 },
  { name: 'Buko', color: 0xFFFFFF },
  { name: 'Peach', color: 0xFFB6A3 },
  { name: 'Chocolate', color: 0x6B4226 }
];

function preload() {
  // Images will load here later
}

function create() {
  this.add.text(20, 20, 'StockPilot - Click an ingredient', {
    fontSize: '20px',
    color: '#000'
  });

  const startX = 80;
  const spacing = 120;

  ingredients.forEach((item, index) => {
    const x = startX + index * spacing;
    const y = 300;

    // Draw a colored circle as a placeholder sprite
    const circle = this.add.circle(x, y, 40, item.color).setInteractive();

    // Add label under it
    this.add.text(x - 30, y + 50, item.name, {
      fontSize: '14px',
      color: '#000'
    });

    // Click handler
    circle.on('pointerdown', () => {
      console.log(`Clicked: ${item.name}`);
      circle.setScale(1.2);
      this.time.delayedCall(150, () => circle.setScale(1));
    });
  });
}

new Phaser.Game(config);