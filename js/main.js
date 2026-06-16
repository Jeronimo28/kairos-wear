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
            cartItems.innerHTML = '<p style="text-align: center; color: #888; margin-top: 2rem;">Tu carrito está vacío</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-img">
                        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/100x133/2a2a2a/666?text=Kairos'">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price}€</div>
                        <div class="cart-item-controls">
                            <div class="qty-control">
                                <button class="cart-qty-btn cart-decr" data-id="${item.id}">-</button>
                                <span class="cart-item-qty">${item.quantity}</span>
                                <button class="cart-qty-btn cart-incr" data-id="${item.id}">+</button>
                            </div>
                            <button class="cart-remove-btn" data-id="${item.id}" title="Eliminar del carrito">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
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
            window.location.href = 'checkout.html';
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
