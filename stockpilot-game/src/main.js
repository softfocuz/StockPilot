import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
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

const costPerUnitMap = {
  Banana: 3,
  Strawberries: 8,
  Mango: 6,
  'Young Coconut': 10,
  Peach: 7,
  Chocolate: 15,
  Milk: 4,
  Sugar: 2
};

let customerSprite = null;
let speechBubble = null;
let speechText = null;

let currentOrder = null;
let selectedIngredients = {}; // tracks what player has "added" so far
let shakesData = [];
let moneyText, orderText, statusText;
let money = 0;

let inventoryPanelOpen = false;
let inventoryPanelElements = [];
let storeBalance = 0;
let ingredientsData = [];

let customerTimer = null;
const CUSTOMER_INTERVAL = 15000;

function preload() {}

function create() {
  const scene = this;

  statusText = this.add.text(20, 20, 'Loading...', { fontSize: '18px', color: '#000' });
  moneyText = this.add.text(600, 20, `Money: ₱0`, { fontSize: '18px', color: '#000' });
  orderText = this.add.text(20, 60, '', { fontSize: '16px', color: '#003' });

  Promise.all([
    fetch('http://127.0.0.1:8000/api/ingredients/').then(r => r.json()),
    fetch('http://127.0.0.1:8000/api/shakes/').then(r => r.json()),
    fetch('http://127.0.0.1:8000/api/store/').then(r => r.json())
  ]).then(([ingredients, shakes, storeData]) => {
    ingredientsData = ingredients;
    shakesData = shakes;
    storeBalance = parseFloat(storeData[0].balance);

    statusText.setText('Waiting for customer...');
    moneyText.setText(`Money: ₱${storeBalance.toFixed(2)}`);
    renderIngredients(scene, ingredients);

    const serveBtn = scene.add.text(600, 460, '[ Serve Shake ]', {
      fontSize: '18px', color: '#fff', backgroundColor: '#28a745', padding: { x: 10, y: 6 }
    }).setInteractive();
    serveBtn.on('pointerdown', () => serveCustomer(scene));

    const nextCustomerBtn = scene.add.text(600, 500, '[ Next Customer ]', {
      fontSize: '16px', color: '#fff', backgroundColor: '#007bff', padding: { x: 10, y: 6 }
    }).setInteractive();
    nextCustomerBtn.on('pointerdown', () => spawnCustomer(scene));

    const inventoryBtn = scene.add.text(600, 540, '[ Inventory / Restock ]', {
      fontSize: '16px', color: '#fff', backgroundColor: '#6f42c1', padding: { x: 10, y: 6 }
    }).setInteractive();
    inventoryBtn.on('pointerdown', () => toggleInventoryPanel(scene));

    spawnCustomer(scene);
    customerTimer = scene.time.addEvent({
      delay: CUSTOMER_INTERVAL,
      callback: () => spawnCustomer(scene),
      loop: true
    });
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

  if (currentOrder) {
    statusText.setText('Customer left unserved! New customer arriving...');
  }

  if (customerSprite) customerSprite.destroy();
  if (speechBubble) speechBubble.destroy();
  if (speechText) speechText.destroy();

  const randomShake = shakesData[Math.floor(Math.random() * shakesData.length)];
  currentOrder = randomShake;
  selectedIngredients = {};

  // Draw a simple customer (circle head + rectangle body as placeholder)
  const customerX = 400;
  const customerY = 150;

  customerSprite = scene.add.container(customerX, customerY);
  const body = scene.add.rectangle(0, 30, 50, 60, 0x4A90D9);
  const head = scene.add.circle(0, -10, 20, 0xFFD9B3);
  customerSprite.add([body, head]);

  // Speech bubble background
  speechBubble = scene.add.rectangle(customerX + 90, customerY - 20, 180, 50, 0xFFFFFF)
    .setStrokeStyle(2, 0x000000);

  // Speech bubble text
  speechText = scene.add.text(customerX + 10, customerY - 35, `Wants: ${randomShake.name}\n₱${randomShake.price}`, {
    fontSize: '13px',
    color: '#000',
    wordWrap: { width: 160 }
  });

  scene.time.delayedCall(currentOrder ? 800 : 0, () => {
    statusText.setText(`Customer wants: ${randomShake.name} (₱${randomShake.price})`);
  });

  updateOrderProgress(scene);
}

function toggleInventoryPanel(scene) {
  if (inventoryPanelOpen) {
    closeInventoryPanel();
  } else {
    openInventoryPanel(scene);
  }
}

function closeInventoryPanel() {
  inventoryPanelElements.forEach(el => el.destroy());
  inventoryPanelElements = [];
  inventoryPanelOpen = false;
}

function openInventoryPanel(scene) {
  inventoryPanelOpen = true;

  // Background panel
  const bg = scene.add.rectangle(400, 300, 500, 400, 0x222222, 0.95).setDepth(10);
  inventoryPanelElements.push(bg);

  const title = scene.add.text(200, 120, 'Inventory / Restock', {
    fontSize: '20px', color: '#fff'
  }).setDepth(11);
  inventoryPanelElements.push(title);

  const closeBtn = scene.add.text(650, 110, '[ X ]', {
    fontSize: '16px', color: '#fff', backgroundColor: '#dc3545', padding: { x: 6, y: 4 }
  }).setInteractive().setDepth(11);
  closeBtn.on('pointerdown', () => closeInventoryPanel());
  inventoryPanelElements.push(closeBtn);

  const balanceLabel = scene.add.text(200, 150, `Store Balance: ₱${storeBalance.toFixed(2)}`, {
    fontSize: '16px', color: '#0f0'
  }).setDepth(11);
  inventoryPanelElements.push(balanceLabel);
  inventoryPanelElements.balanceLabel = balanceLabel; 

  ingredientsData.forEach((item, index) => {
    const y = 190 + index * 35;
    const costPerUnit = costPerUnitMap[item.name] || 5; 

    const label = scene.add.text(190, y, `${item.name}: ${item.stock} ${item.unit}`, {
      fontSize: '14px', color: item.is_low_stock ? '#ff5555' : '#fff'
    }).setDepth(11);
    inventoryPanelElements.push(label);

    const buyBtn = scene.add.text(500, y, `[ Buy 10 (₱${(10 * costPerUnit).toFixed(2)}) ]`, {
      fontSize: '13px', color: '#fff', backgroundColor: '#17a2b8', padding: { x: 6, y: 4 }
    }).setInteractive().setDepth(11);
    buyBtn.on('pointerdown', () => buyIngredient(scene, item.id, 10, costPerUnit));
    inventoryPanelElements.push(buyBtn);
  });
}

function buyIngredient(scene, ingredientId, amount, costPerUnit) {
  fetch('http://127.0.0.1:8000/api/restocks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredient: ingredientId, amount: amount, cost_per_unit: costPerUnit })
  })
    .then(res => {
      if (!res.ok) return res.json().then(err => Promise.reject(err));
      return res.json();
    })
    .then(() => {
      closeInventoryPanel();
      // Refresh everything by restarting the scene
      scene.scene.restart();
    })
    .catch(err => {
      console.error(err);
      alert('Not enough money to restock this!');
    });
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

      if (customerSprite) customerSprite.destroy();
      if (speechBubble) speechBubble.destroy();
      if (speechText) speechText.destroy();

      currentOrder = null;
      orderText.setText('');

      if (customerTimer) customerTimer.remove();
      scene.time.delayedCall(1500, () => {
        scene.scene.restart();
      });
    })
    .catch(err => {
      console.error(err);
      statusText.setText('Not enough stock to serve this order!');
    });
}

new Phaser.Game(config);