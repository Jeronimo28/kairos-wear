// ============================================================
// PRODUCTOS — stock por talla
// ============================================================
const products = [
    {
        id: 1,
        name: "Camiseta Kairos - Negro",
        price: 12,
        image: "imagenes/Camiseta_logo2.png",
        description: "Camiseta 100% algodón orgánico. Corte regular, cuello redondo. El momento de lucir sencillo pero impecable.",
        stock: { XS: 5, S: 8, M: 10, L: 8, XL: 5, XXL: 3 }
    },
    {
        id: 2,
        name: "Camiseta Kairos - Blanco",
        price: 12,
        image: "imagenes/Camiseta_logo1.png",
        description: "Camiseta 100% algodón orgánico. Corte regular, cuello redondo. La prenda básica que nunca falla.",
        stock: { XS: 4, S: 7, M: 10, L: 7, XL: 4, XXL: 2 }
    },
    {
        id: 3,
        name: "Sudadera Kairos - Gris",
        price: 69,
        image: "imagenes/sudadera-gris.jpg",
        description: "Sudadera 80% algodón, 20% poliéster. Corte oversize, capucha ajustable. Para cuando el momento pide comodidad con estilo.",
        stock: { XS: 3, S: 5, M: 8, L: 6, XL: 4, XXL: 2 }
    },
    {
        id: 4,
        name: "Camisa Kairos - Azul Noche",
        price: 59,
        image: "imagenes/camisa-azul.jpg",
        description: "Camisa de vestir 100% algodón. Corte slim, cuello italiano. Para el momento que requiere elegancia.",
        stock: { XS: 2, S: 4, M: 6, L: 5, XL: 3, XXL: 1 }
    }
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Carrito: { id, name, price, size, quantity, image }
let cart = [];

// ============================================================
// GRID DE PRODUCTOS (index.html)
// ============================================================
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/600x800/2a2a2a/666?text=Kairos'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${product.price}€</p>
                <div class="size-selector" data-product-id="${product.id}">
                    ${SIZES.map(s => {
                        const inStock = product.stock[s] > 0;
                        return `<button class="size-btn${inStock ? '' : ' out-of-stock'}" data-size="${s}" ${inStock ? '' : 'disabled'} title="${inStock ? '' : 'Sin stock'}">${s}</button>`;
                    }).join('')}
                </div>
                <button class="add-to-cart" data-id="${product.id}">SELECCIONA UNA TALLA</button>
            </div>
        `;
        productsGrid.appendChild(card);

        // Lógica selección de talla
        const sizeButtons = card.querySelectorAll('.size-btn');
        const addBtn = card.querySelector('.add-to-cart');

        sizeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                sizeButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                addBtn.textContent = 'AÑADIR AL CARRITO';
                addBtn.dataset.selectedSize = btn.dataset.size;
            });
        });

        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedSize = addBtn.dataset.selectedSize;
            if (!selectedSize) {
                addBtn.classList.add('shake');
                addBtn.textContent = '← ELIGE UNA TALLA';
                setTimeout(() => {
                    addBtn.classList.remove('shake');
                    addBtn.textContent = 'SELECCIONA UNA TALLA';
                    delete addBtn.dataset.selectedSize;
                }, 1800);
                return;
            }
            addToCart(product.id, selectedSize);
            // Reset
            sizeButtons.forEach(b => b.classList.remove('selected'));
            delete addBtn.dataset.selectedSize;
            addBtn.textContent = 'SELECCIONA UNA TALLA';
        });

        // Click en la tarjeta → detalle
        card.addEventListener('click', () => {
            window.location.href = `product.html?id=${product.id}`;
        });
    });
}

// ============================================================
// CARRITO
// ============================================================
function addToCart(productId, size, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Clave única: id + talla
    const key = `${productId}-${size}`;
    const existingItem = cart.find(item => item.key === key);

    // Comprobar stock disponible
    const stockAvailable = product.stock[size] || 0;
    const inCartQty = existingItem ? existingItem.quantity : 0;

    if (inCartQty + quantity > stockAvailable) {
        showNotification(`Solo quedan ${stockAvailable} unidades en talla ${size}`);
        return;
    }

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            key,
            id: product.id,
            name: product.name,
            price: product.price,
            size,
            quantity,
            image: product.image
        });
    }

    updateCartUI();
    saveCart();
    showNotification(`${product.name} (${size}) añadido`);
}

function removeFromCart(key) {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    cart = cart.filter(i => i.key !== key);
    updateCartUI();
    saveCart();
    showNotification(`${item.name} (${item.size}) eliminado`);
}

function updateQuantity(key, newQuantity) {
    if (newQuantity <= 0) { removeFromCart(key); return; }
    const item = cart.find(i => i.key === key);
    if (!item) return;

    const product = products.find(p => p.id === item.id);
    const stockAvailable = product ? (product.stock[item.size] || 0) : 99;
    if (newQuantity > stockAvailable) {
        showNotification(`Stock máximo: ${stockAvailable}`);
        return;
    }

    item.quantity = newQuantity;
    updateCartUI();
    saveCart();
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (cartCount) {
        cartCount.textContent = cart.reduce((s, i) => s + i.quantity, 0);
    }

    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align:center;color:#888;padding:1rem 0">Tu carrito está vacío</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item" data-key="${item.key}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-meta">Talla: <strong>${item.size}</strong> · ${item.price}€/ud</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="cart-qty-btn cart-decr" data-key="${item.key}">−</button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="cart-qty-btn cart-incr" data-key="${item.key}">+</button>
                        <button class="cart-remove-btn" data-key="${item.key}">🗑️</button>
                    </div>
                    <div class="cart-item-subtotal">${item.price * item.quantity}€</div>
                </div>
            `).join('');
        }

        document.querySelectorAll('.cart-decr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = btn.dataset.key;
                const item = cart.find(i => i.key === key);
                if (item) updateQuantity(key, item.quantity - 1);
            });
        });
        document.querySelectorAll('.cart-incr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = btn.dataset.key;
                const item = cart.find(i => i.key === key);
                if (item) updateQuantity(key, item.quantity + 1);
            });
        });
        document.querySelectorAll('.cart-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromCart(btn.dataset.key);
            });
        });
    }

    if (cartTotal) {
        cartTotal.textContent = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    }
}

// ============================================================
// NOTIFICACIÓN
// ============================================================
function showNotification(message) {
    const n = document.createElement('div');
    n.textContent = message;
    n.style.cssText = `
        position:fixed;bottom:20px;right:20px;
        background:#b87c4f;color:#0a0a0a;
        padding:12px 20px;border-radius:4px;
        font-weight:600;z-index:3000;
        animation:fadeInOut 2s ease;
    `;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
}

// ============================================================
// MODAL CARRITO
// ============================================================
function initModal() {
    const modal = document.getElementById('cartModal');
    const cartIcon = document.getElementById('cartIcon');
    const closeBtn = document.querySelector('.close');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            updateCartUI();
            modal.style.display = 'block';
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) { showNotification('Tu carrito está vacío'); return; }
            modal.style.display = 'none';
            window.location.href = 'checkout.html';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

// ============================================================
// NEWSLETTER
// ============================================================
function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input').value;
            showNotification(`¡Apuntado, ${email}!`);
            form.reset();
        });
    }
}

// ============================================================
// PERSISTENCIA
// ============================================================
function saveCart() { localStorage.setItem('kairosCart', JSON.stringify(cart)); }
function loadCart() {
    const saved = localStorage.getItem('kairosCart');
    if (saved) { cart = JSON.parse(saved); updateCartUI(); }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadProducts();
    initModal();
    initNewsletter();
});

// ============================================================
// ESTILOS INYECTADOS
// ============================================================
const style = document.createElement('style');
style.textContent = `
@keyframes fadeInOut {
    0%   { opacity:0; transform:translateY(20px); }
    15%  { opacity:1; transform:translateY(0); }
    85%  { opacity:1; transform:translateY(0); }
    100% { opacity:0; transform:translateY(-20px); }
}
@keyframes shake {
    0%,100% { transform:translateX(0); }
    25%      { transform:translateX(-6px); }
    75%      { transform:translateX(6px); }
}
.shake { animation: shake 0.3s ease; }

/* Selector de tallas */
.size-selector {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 0.8rem;
}
.size-btn {
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    color: #e5e5e5;
    padding: 4px 10px;
    border-radius: 3px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
}
.size-btn:hover:not(:disabled) {
    border-color: #b87c4f;
    color: #b87c4f;
}
.size-btn.selected {
    background: #b87c4f;
    border-color: #b87c4f;
    color: #0a0a0a;
}
.size-btn.out-of-stock {
    opacity: 0.3;
    cursor: not-allowed;
    text-decoration: line-through;
}

/* Carrito mejorado */
.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #2a2a2a;
    gap: 10px;
    flex-wrap: wrap;
}
.cart-item-info { flex: 2; min-width: 120px; }
.cart-item-name { font-weight:600; font-size:0.9rem; margin-bottom:3px; }
.cart-item-meta { font-size:0.78rem; color:#888; }
.cart-item-controls { display:flex; align-items:center; gap:8px; }
.cart-qty-btn {
    background:#2a2a2a; border:1px solid #3a3a3a; color:#e5e5e5;
    width:28px; height:28px; border-radius:4px; cursor:pointer;
    font-size:1rem; transition:all 0.2s; font-family:inherit;
}
.cart-qty-btn:hover { background:#b87c4f; border-color:#b87c4f; color:#0a0a0a; }
.cart-item-qty { min-width:30px; text-align:center; font-weight:600; }
.cart-remove-btn {
    background:none; border:none; cursor:pointer;
    font-size:1.1rem; opacity:0.5; transition:opacity 0.2s;
}
.cart-remove-btn:hover { opacity:1; }
.cart-item-subtotal { min-width:55px; text-align:right; font-weight:600; color:#b87c4f; }

@media (max-width:600px) {
    .cart-item { flex-direction:column; align-items:flex-start; }
    .cart-item-subtotal { text-align:left; width:100%; }
    .cart-item-controls { width:100%; }
}
`;
document.head.appendChild(style);
