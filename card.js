// Shopping Cart Module
const Cart = (() => {
  // Private variables
  let cart = [];
  const CART_STORAGE_KEY = 'shoppingCart';

  // Private methods
  const saveCart = () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  };

  const updateCartCount = () => {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
    document.getElementById('cart-count').style.display = totalItems > 0 ? 'inline' : 'none';
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 0);
    }, 0);
  };

  // Public API
  return {
    init() {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
      }
    },

    addItem(product) {
      const existingItem = cart.find(item => 
        item.id === product.id && item.size === product.size
      );

      if (existingItem) {
        existingItem.quantity += product.quantity;
      } else {
        cart.push({...product});
      }

      saveCart();
      updateCartCount();
      showNotification(`${product.name} added to cart!`);
    },

    removeItem(index) {
      if (index >= 0 && index < cart.length) {
        const removedItem = cart.splice(index, 1)[0];
        saveCart();
        updateCartCount();
        showNotification(`${removedItem.name} removed from cart`);
        return true;
      }
      return false;
    },

    updateQuantity(index, newQuantity) {
      if (index >= 0 && index < cart.length && newQuantity > 0) {
        cart[index].quantity = newQuantity;
        saveCart();
        return true;
      }
      return false;
    },

    getCart() {
      return [...cart];
    },

    getTotal() {
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    clearCart() {
      cart = [];
      saveCart();
      updateCartCount();
    }
  };
})();

// UI Controller Module
const UIController = (() => {
  // Cache DOM elements
  const elements = {
    cartIcon: document.getElementById('cart-icon'),
    cartModal: document.getElementById('cart-modal'),
    closeCartBtn: document.getElementById('close-cart'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    productItems: document.querySelectorAll('.product-item'),
    modalAddToCart: document.getElementById('modalAddToCart'),
    quantityInput: document.getElementById('quantityInput'),
    menuOpenButton: document.getElementById('menu-open-button'),
    menuCloseButton: document.getElementById('menu-close-button'),
    navLinks: document.querySelectorAll('.nav-link')
  };

  // Private methods
  const renderCart = () => {
    const cart = Cart.getCart();
    elements.cartItems.innerHTML = '';
    
    if (cart.length === 0) {
      elements.cartItems.innerHTML = '<li class="cart-item">Your cart is empty</li>';
      elements.cartTotal.textContent = '0.00';
      return;
    }
    
    cart.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'cart-item d-flex align-items-center mb-3';
      li.innerHTML = `
        <div class="flex-shrink-0">
          <img src="${item.image}" alt="${item.name}" width="60" class="img-thumbnail">
        </div>
        <div class="flex-grow-1 ms-3">
          <h6 class="mb-1">${item.name}</h6>
          <small class="text-muted">Size: ${item.size}</small>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <div class="quantity-controls">
              <button class="btn btn-sm btn-outline-secondary decrease-quantity" data-index="${index}">-</button>
              <span class="mx-2">${item.quantity}</span>
              <button class="btn btn-sm btn-outline-secondary increase-quantity" data-index="${index}">+</button>
            </div>
            <div class="price">$${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        </div>
        <button class="btn btn-sm btn-danger remove-item ms-3" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
        
      `;
      elements.cartItems.appendChild(li);
    });

    elements.cartTotal.textContent = Cart.getTotal().toFixed(2);
  };

  const getProductFromModal = () => {
    const modal = document.getElementById('myModal');
    return {
      id: modal.dataset.productId || Date.now().toString(),
      name: modal.querySelector('.modal-body h2').textContent,
      price: parseFloat(modal.querySelector('.current-price').textContent.replace(/[^\d.]/g, '')),
      image: modal.querySelector('#mainProductImage').src,
      size: modal.querySelector('.btn-group input:checked')?.nextElementSibling.textContent || 'M',
      quantity: parseInt(elements.quantityInput.value) || 1
    };
  };

  const getProductFromCard = (card) => {
    return {
      id: card.dataset.productId || Date.now().toString(),
      name: card.querySelector('.name').textContent,
      price: parseFloat(card.querySelector('.discount').textContent.replace(/[^\d.]/g, '')),
      image: card.querySelector('img').src,
      size: 'M',
      quantity: 1
    };
  };

  // Public API
  return {
    init() {
      // Initialize event listeners
      elements.cartIcon.addEventListener('click', () => {
        renderCart();
        elements.cartModal.classList.remove('hidden');
      });

      elements.closeCartBtn.addEventListener('click', () => {
        elements.cartModal.classList.add('hidden');
      });

      elements.productItems.forEach(item => {
        item.querySelector('.add-to-cart').addEventListener('click', (e) => {
          e.preventDefault();
          Cart.addItem(getProductFromCard(item));
        });
      });

      if (elements.modalAddToCart) {
        elements.modalAddToCart.addEventListener('click', () => {
          Cart.addItem(getProductFromModal());
          bootstrap.Modal.getInstance(document.getElementById('myModal')).hide();
        });
      }

      // Delegated events for cart items
      elements.cartItems.addEventListener('click', (e) => {
        const target = e.target.closest('.remove-item') || 
                      e.target.closest('.decrease-quantity') || 
                      e.target.closest('.increase-quantity');
        
        if (!target) return;

        const index = parseInt(target.dataset.index);
        const cart = Cart.getCart();
        
        if (target.classList.contains('remove-item')) {
          Cart.removeItem(index);
          renderCart();
        } 
        else if (target.classList.contains('decrease-quantity')) {
          const currentQty = cart[index].quantity;
          if (currentQty > 1) {
            Cart.updateQuantity(index, currentQty - 1);
            renderCart();
          } else {
            Cart.removeItem(index);
            renderCart();
          }
        } 
        else if (target.classList.contains('increase-quantity')) {
          Cart.updateQuantity(index, cart[index].quantity + 1);
          renderCart();
        }
      });
    },

    changeImage(element) {
      const mainImage = document.getElementById('mainProductImage');
      mainImage.src = element.src;
      
      document.querySelectorAll('.thumbnail-images .img-thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
      });
      element.classList.add('active');
    },

    updateQuantity(direction) {
      const quantityInput = document.getElementById('quantityInput');
      const currentValue = parseInt(quantityInput.value);
      if (direction === 'increase') {
        quantityInput.value = currentValue + 1;
      } else if (direction === 'decrease' && currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    }
  };
})();

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
  UIController.init();
  
  const productModal = document.getElementById('myModal');
  if (productModal) {
    productModal.addEventListener('show.bs.modal', function(event) {
      // Modal shown event
    });
  }
});

// Global functions for HTML onclick attributes
function changeImage(element) {
  UIController.changeImage(element);
}

function increaseQuantity() {
  UIController.updateQuantity('increase');
}

function decreaseQuantity() {
  UIController.updateQuantity('decrease');
}


