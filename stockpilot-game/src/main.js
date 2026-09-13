import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#87CEEB',
  scene: { preload, create }
};

const colorMap = {
  Banana: 0xFFE135,
  Strawberry: 0xFF4C4C,
  Mango: 0xFFA500,
  Buko: 0xFFFFFF,
  Peach: 0xFFB6A3,
  Chocolate: 0x6B4226
};

let currentOrder = null;
let selectedIngredients = {}; // tracks what player has "added" so far
let shakesData = [];
let moneyText, orderText, statusText;
let money = 0;

function preload() {}

function create() {
  const scene = this;

  statusText = this.add.text(20, 20, 'Loading...', { fontSize: '18px', color: '#000' });
  moneyText = this.add.text(600, 20, `Money: ₱0`, { fontSize: '18px', color: '#000' });
  orderText = this.add.text(20, 60, '', { fontSize: '16px', color: '#003' });

  Promise.all([
    fetch('http://127.0.0.1:8000/api/ingredients/').then(r => r.json()),
    fetch('http://127.0.0.1:8000/api/shakes/').then(r => r.json())
  ]).then(([ingredients, shakes]) => {
    shakesData = shakes;
    statusText.setText('Waiting for customer...');
    renderIngredients(scene, ingredients);

    const serveBtn = scene.add.text(600, 500, '[ Serve Shake ]', {
      fontSize: '18px', color: '#fff', backgroundColor: '#28a745', padding: { x: 10, y: 6 }
    }).setInteractive();
    serveBtn.on('pointerdown', () => serveCustomer(scene));

    const nextCustomerBtn = scene.add.text(600, 550, '[ Next Customer ]', {
      fontSize: '16px', color: '#fff', backgroundColor: '#007bff', padding: { x: 10, y: 6 }
    }).setInteractive();
    nextCustomerBtn.on('pointerdown', () => spawnCustomer(scene));

    spawnCustomer(scene);
  }).catch(err => {
    console.error(err);
    statusText.setText('Failed to load data (check console)');
  });
}

function renderIngredients(scene, ingredients) {
  const startX = 80, spacing = 120;
  ingredients.forEach((item, index) => {
    const x = startX + index * spacing, y = 300;
    const color = colorMap[item.name] || 0xCCCCCC;
    const circle = scene.add.circle(x, y, 40, color).setInteractive();

    scene.add.text(x - 30, y + 50, item.name, { fontSize: '14px', color: '#000' });
    const stockText = scene.add.text(x - 20, y + 70, `Stock: ${item.stock}`, {
      fontSize: '12px', color: item.is_low_stock ? '#FF0000' : '#000'
    });

    circle.on('pointerdown', () => {
      selectedIngredients[item.id] = (selectedIngredients[item.id] || 0) + 1;
      circle.setScale(1.2);
      scene.time.delayedCall(150, () => circle.setScale(1));
      updateOrderProgress(scene);
    });
  });
}

function spawnCustomer(scene) {
  if (!shakesData.length) return;
  const randomShake = shakesData[Math.floor(Math.random() * shakesData.length)];
  currentOrder = randomShake;
  selectedIngredients = {};
  statusText.setText(`Customer wants: ${randomShake.name} (₱${randomShake.price})`);
  updateOrderProgress(scene);
}

function updateOrderProgress(scene) {
  if (!currentOrder) return;
  const needed = currentOrder.shakeingredient_set
    .map(si => `${si.ingredient_name}: ${selectedIngredients[si.ingredient] || 0}/${si.amount_required}`)
    .join('  |  ');

  const complete = isOrderComplete();
  orderText.setText(`Order progress -> ${needed}${complete ? 'Ready to serve!' : ''}`);
  orderText.setColor(complete ? '#008000' : '#003');
}

function isOrderComplete() {
  if (!currentOrder) return false;
  return currentOrder.shakeingredient_set.every(si => {
    const selected = selectedIngredients[si.ingredient] || 0;
    return selected >= si.amount_required;
  });
}

function serveCustomer(scene) {
  if (!currentOrder) {
    statusText.setText('No active customer!');
    return;
  }

  if (!isOrderComplete()) {
    statusText.setText('Order incomplete! Add the right ingredients first.');
    return;
  }

  fetch('http://127.0.0.1:8000/api/transactions/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shake: currentOrder.id, quantity: 1 })
  })
    .then(res => {
      if (!res.ok) return res.json().then(err => Promise.reject(err));
      return res.json();
    })
    .then(data => {
      money += parseFloat(data.total_price);
      moneyText.setText(`Money: ₱${money.toFixed(2)}`);
      statusText.setText(`Served! Earned ₱${data.total_price}`);
      currentOrder = null;
      orderText.setText('');
      scene.time.delayedCall(1000, () => {
        scene.scene.restart();
      });
    })
    .catch(err => {
      console.error(err);
      statusText.setText('Not enough stock to serve this order!');
    });
}

new Phaser.Game(config);