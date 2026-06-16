// Productos de la tienda
const products = [
    {
        id: 1,
        name: "Camiseta Kairos - Negro",
        price: 12,
        image: "imagenes/Camiseta_logo2.png",
        description: "Camiseta 100% algodón orgánico. Corte regular, cuello redondo. El momento de lucir sencillo pero impecable."
    },
    {
        id: 2,
        name: "Camiseta Kairos - Blanco",
        price: 12,
        image: "imagenes/Camiseta_logo1.png",
        description: "Camiseta 100% algodón orgánico. Corte regular, cuello redondo. La prenda básica que nunca falla."
    },
    {
        id: 3,
        name: "Sudadera Kairos - Gris",
        price: 69,
        image: "imagenes/sudadera-gris.jpg",
        description: "Sudadera 80% algodón, 20% poliéster. Corte oversize, capucha ajustable. Para cuando el momento pide comodidad con estilo."
    },
    {
        id: 4,
        name: "Camisa Kairos - Azul Noche",
        price: 59,
        image: "imagenes/camisa-azul.jpg",
        description: "Camisa de vestir 100% algodón. Corte slim, cuello italiano. Para el momento que requiere elegancia."
    }
];

// Carrito: { id, name, price, quantity, image }
let cart = [];

// Cargar productos en la página
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/600x800/2a2a2a/666?text=Kairos'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${product.price}€</p>
                <button class="add-to-cart" data-id="${product.id}">AÑADIR AL CARRITO</button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
    
    // Añadir eventos a los botones
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(button.dataset.id);
            addToCart(productId);
        });
    });
    
    // Añadir evento de click en la tarjeta para ir al detalle
    document.querySelectorAll('.product-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            window.location.href = `product.html?id=${products[index].id}`;
        });
    });
}

// Añadir al carrito (incrementa cantidad si ya existe)
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.image
        });
    }
    
    updateCartUI();
    saveCart();
    showNotification(`${product.name} añadido al carrito`);
}

// Eliminar producto del carrito
function removeFromCart(productId) {
    const product = cart.find(item => item.id === productId);
    if (!product) return;
    
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCart();
    showNotification(`${product.name} eliminado del carrito`);
}

// Actualizar cantidad de un producto
function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        updateCartUI();
        saveCart();
    }
}

// Actualizar interfaz del carrito (modal y contador)
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Actualizar contador del ícono
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Actualizar contenido del modal
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #888;">Tu carrito está vacío</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price}€</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="cart-qty-btn cart-decr" data-id="${item.id}">-</button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="cart-qty-btn cart-incr" data-id="${item.id}">+</button>
                        <button class="cart-remove-btn" data-id="${item.id}">🗑️</button>
                    </div>
                    <div class="cart-item-subtotal">${(item.price * item.quantity)}€</div>
                </div>
            `).join('');
        }
        
        // Añadir eventos a los botones del carrito
        document.querySelectorAll('.cart-decr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const item = cart.find(i => i.id === id);
                if (item && item.quantity > 1) {
                    updateQuantity(id, item.quantity - 1);
                } else {
                    removeFromCart(id);
                }
            });
        });
        
        document.querySelectorAll('.cart-incr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const item = cart.find(i => i.id === id);
                if (item) {
                    updateQuantity(id, item.quantity + 1);
                }
            });
        });
        
        document.querySelectorAll('.cart-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                removeFromCart(id);
            });
        });
    }
    
    // Actualizar total
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total;
    }
}

// Mostrar notificación
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #b87c4f;
        color: #0a0a0a;
        padding: 12px 20px;
        border-radius: 4px;
        font-weight: 600;
        z-index: 3000;
        animation: fadeInOut 2s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Modal del carrito
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
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showNotification('Tu carrito está vacío');
                return;
            }
            showNotification('Contáctanos por Instagram @kairos.wear para completar tu pedido');
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Newsletter
function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input').value;
            showNotification(`Gracias por apuntarte, ${email}!`);
            form.reset();
        });
    }
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem('kairosCart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('kairosCart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartUI();
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadProducts();
    initModal();
    initNewsletter();
});

// Añadir animación
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        15% { opacity: 1; transform: translateY(0); }
        85% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
    
    /* Estilos para el carrito mejorado */
    .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #2a2a2a;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .cart-item-info {
        flex: 2;
        min-width: 120px;
    }
    
    .cart-item-name {
        font-weight: 600;
        font-size: 0.9rem;
        margin-bottom: 4px;
    }
    
    .cart-item-price {
        font-size: 0.8rem;
        color: #b87c4f;
    }
    
    .cart-item-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .cart-qty-btn {
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        color: #e5e5e5;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.3s;
    }
    
    .cart-qty-btn:hover {
        background: #b87c4f;
        border-color: #b87c4f;
        color: #0a0a0a;
    }
    
    .cart-item-qty {
        min-width: 30px;
        text-align: center;
        font-weight: 600;
    }
    
    .cart-remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        opacity: 0.6;
        transition: opacity 0.3s;
    }
    
    .cart-remove-btn:hover {
        opacity: 1;
    }
    
    .cart-item-subtotal {
        min-width: 60px;
        text-align: right;
        font-weight: 600;
        color: #b87c4f;
    }
    
    @media (max-width: 600px) {
        .cart-item {
            flex-direction: column;
            align-items: flex-start;
        }
        .cart-item-subtotal {
            text-align: left;
            width: 100%;
        }
        .cart-item-controls {
            width: 100%;
            justify-content: flex-start;
        }
    }
`;
document.head.appendChild(style);