// ==================== CART FUNCTIONS ====================
async function addToCart(productId) {
    if (!AppState.currentUser) {
        alert('Please login to add items to cart');
        navigateTo('login');
        return;
    }

    const quantityEl = document.getElementById('productQuantity');
    const quantity = quantityEl ? parseInt(quantityEl.value) : 1;

    if (!quantity || quantity < 1) {
        alert('Please select a valid quantity');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Added to cart!');
            await loadCart();
        } else {
            alert(data.error || 'Error adding to cart');
        }
    } catch (e) {
        console.error('Add to cart error:', e);
        alert('Error adding to cart. Please try again.');
    }
}

async function removeFromCart(item_id) {
    if (!confirm('Remove this item from cart?')) return;

    try {
        const res = await fetch(`${API_BASE}/cart/${item_id}`, { method: 'DELETE' });
        if (res.ok) {
            // CRITICAL FIX: Reload cart and update immediately
            await loadCart();
            updateCartBadge();

            // Show empty cart message if no items left
            if (AppState.cartItems.length === 0) {
                const container = document.getElementById('cartItems');
                if (container) {
                    container.innerHTML = `
                        <div class="text-center py-12">
                            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                            </svg>
                            <p class="text-gray-600 mb-4">Your cart is empty</p>
                            <button onclick="closeCart(); navigateTo('shop');" class="btn-primary">START SHOPPING</button>
                        </div>
                    `;
                }
            }
        } else {
            alert('Error removing item');
        }
    } catch (e) {
        console.error('Remove from cart error:', e);
        alert('Error removing item');
    }
}

async function loadCart() {
    const container = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('cartSubtotal');
    const checkoutBtn = document.querySelector('#cartDrawer .btn-primary');

    if (!AppState.currentUser) {
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                    <p class="text-gray-600 mb-4">Please login to view your cart</p>
                    <button onclick="closeCart(); handleAccountClick();" class="btn-primary">LOGIN</button>
                </div>
            `;
        }
        AppState.cartItems = [];
        updateCartBadge();
        if (checkoutBtn) checkoutBtn.disabled = true;
        // NEW: Force summary to zero
        updateCartSummary();
        return;
    }

    try {
        console.log('🛒 Loading cart...');
        const res = await fetch(`${API_BASE}/cart/get`);

        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();
        AppState.cartItems = data.items || [];
        updateCartBadge();

        if (AppState.cartItems.length === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                        </svg>
                        <p class="text-gray-600 mb-4">Your cart is empty</p>
                        <button onclick="closeCart(); navigateTo('shop');" class="btn-primary">START SHOPPING</button>
                    </div>
                `;
            }
            if (checkoutBtn) checkoutBtn.disabled = true;
            updateCartSummary();
            return;
        }

        if (container) {
            container.innerHTML = AppState.cartItems.map(item => {
                // FIX: Safely get image URL
                let imageUrl = getPlaceholderImage();

                if (item.image) {
                    if (typeof item.image === 'string') {
                        // Check if it's base64 or a path
                        if (item.image.startsWith('data:image')) {
                            imageUrl = item.image; // Base64 image
                        } else if (item.image.startsWith('http')) {
                            imageUrl = item.image; // Full URL
                        } else if (item.image.startsWith('/static')) {
                            imageUrl = item.image; // Static path
                        } else if (item.image.startsWith('[')) {
                            // JSON array string - parse and get first image
                            try {
                                const images = JSON.parse(item.image);
                                imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : getPlaceholderImage();
                            } catch (e) {
                                console.error('Image parse error:', e);
                            }
                        } else {
                            imageUrl = '/static/' + item.image; // Relative path
                        }
                    }
                }

                return `
                    <div class="flex items-center gap-4 p-4 border-b">
                        <img src="${imageUrl}"
                            class="w-20 h-20 object-cover rounded"
                            alt="${item.name}"
                            onerror="this.src='${getPlaceholderImage()}'">
                        <div class="flex-1">
                            <h4 class="font-medium">${item.name}</h4>
                            ${item.variant_details ? `<p class="text-sm text-gray-600">${item.variant_details}</p>` : ''}
                            ${item.selected_size ? `<p class="text-sm text-gray-600">Size: <span class="font-semibold">${item.selected_size}</span></p>` : ''}
                            <p class="font-bold mt-1">₹${item.price}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})"
                                    class="w-8 h-8 flex items-center justify-center border hover:bg-gray-100">-</button>
                            <span class="w-8 text-center font-medium">${item.quantity}</span>
                            <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})"
                                    class="w-8 h-8 flex items-center justify-center border hover:bg-gray-100">+</button>
                        </div>
                        <button onclick="removeCartItem(${item.id})"
                                class="text-red-500 hover:text-red-700">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                `;
            }).join('');
        }

        updateCartSummary();
        if (checkoutBtn) checkoutBtn.disabled = false;

        console.log('✅ Cart loaded successfully with', AppState.cartItems.length, 'items');

    } catch (e) {
        console.error('❌ Load cart error:', e);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-500 mb-4">Failed to load cart</p>
                    <button onclick="loadCart()" class="btn-outline">RETRY</button>
                </div>
            `;
        }
        AppState.cartItems = [];
        updateCartBadge();
        updateCartSummary();
    }
}

async function updateCartItemQuantity(itemId, quantity) {
    if (quantity <= 0) {
        await removeCartItem(itemId);
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/cart/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
        });

        if (res.ok) {
            await loadCart();
        } else {
            const data = await res.json();
            alert(data.error || 'Error updating cart');
        }
    } catch (e) {
        console.error('Update cart error:', e);
        alert('Error updating cart');
    }
}

async function removeCartItem(itemId) {
    if (!confirm('Remove this item from cart?')) return;

    try {
        const res = await fetch(`${API_BASE}/cart/${itemId}`, { method: 'DELETE' });
        if (res.ok) {
            await loadCart();
        } else {
            alert('Error removing item');
        }
    } catch (e) {
        console.error('Remove from cart error:', e);
        alert('Error removing item');
    }
}

function updateCartBadge() {
    const desktopBadge = document.getElementById('cartCount');
    const mobileBadge = document.getElementById('cartCountMobile');

    const totalItems = AppState.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const displayCount = totalItems > 99 ? '99+' : totalItems;

    // Update desktop badge
    if (desktopBadge) {
        if (totalItems > 0) {
            desktopBadge.textContent = displayCount;
            desktopBadge.classList.remove('hidden');

            // Trigger animation on update
            desktopBadge.style.animation = 'none';
            setTimeout(() => {
                desktopBadge.style.animation = 'cartBadgeAppear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }, 10);
        } else {
            desktopBadge.classList.add('hidden');
        }
    }

    // Update mobile badge
    if (mobileBadge) {
        if (totalItems > 0) {
            mobileBadge.textContent = displayCount;
            mobileBadge.classList.remove('hidden');

            // Trigger animation on update
            mobileBadge.style.animation = 'none';
            setTimeout(() => {
                mobileBadge.style.animation = 'cartBadgeAppear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }, 10);
        } else {
            mobileBadge.classList.add('hidden');
        }
    }
}

function updateCartSummary() {
    // 1. Get all DOM elements
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartShippingEl = document.getElementById('cartShipping') || document.getElementById('cartShippingCost');
    const cartTotalEl = document.getElementById('cartTotal');
    const shipCostEl = document.getElementById('cartShippingCost'); // From update
    const itemCountEl = document.getElementById('cartItemCount'); // From update
    const progEl = document.getElementById('shippingProgress'); // From update
    const freeShippingBarEl = document.getElementById('freeShippingBar'); // From update
    const checkoutBtn = document.getElementById('checkoutBtn');

    const threshold = 999;

    // 2. CRITICAL FIX: Calculate subtotal and item count from actual cart items
    const subtotal = AppState.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = AppState.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Update item count
    if (itemCountEl) {
        itemCountEl.textContent = totalItems + (totalItems === 1 ? ' item' : ' items');
    }

    // 3. FIX: If cart is empty, set everything to zero/default
    if (AppState.cartItems.length === 0 || subtotal === 0) {
        if (cartSubtotalEl) cartSubtotalEl.textContent = '₹0';
        if (cartShippingEl) cartShippingEl.textContent = 'FREE';
        if (cartTotalEl) cartTotalEl.textContent = '₹0';
        if (shipCostEl) shipCostEl.textContent = 'Free';

        // Reset progress bar to empty state
        if (progEl) progEl.style.width = '0%';
        if (freeShippingBarEl) {
            freeShippingBarEl.querySelector('span:first-child').innerHTML = `Add <strong id="shippingRemaining">₹${threshold.toLocaleString('en-IN')}</strong> more for free shipping`;
        }

        // Disable checkout button
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.cursor = 'not-allowed';
        }

        console.log('✅ Cart summary reset to zero');
        return; // Exit early
    }

    // 4. NEW RULE: Free shipping if cart value is 999 or above (otherwise ₹49)
    const shipping = subtotal >= threshold ? 0 : 49;
    const total = subtotal + shipping;

    // Update text content with Indian number formatting
    if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    if (cartTotalEl) cartTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    
    // Handle both shipping ID variations 
    const shippingText = shipping === 0 ? 'FREE' : `₹${shipping}`;
    if (cartShippingEl) cartShippingEl.textContent = shippingText;
    if (shipCostEl) shipCostEl.textContent = shippingText;

    // Free shipping progress bar logic
    const pct = Math.min((subtotal / threshold) * 100, 100);
    if (progEl) progEl.style.width = pct + '%';
    
    if (freeShippingBarEl) {
        freeShippingBarEl.querySelector('span:first-child').innerHTML = subtotal >= threshold 
            ? '<strong>🎉 You\'ve unlocked free shipping!</strong>' 
            : `Add <strong id="shippingRemaining">₹${(threshold - subtotal).toLocaleString('en-IN')}</strong> more for free shipping`;
    }

    // Enable checkout button if cart has items
    if (checkoutBtn) {
        if (AppState.cartItems.length > 0) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.cursor = 'pointer';
        } else {
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.cursor = 'not-allowed';
        }
    }

    console.log(`✅ Cart summary updated: Subtotal=₹${subtotal}, Shipping=₹${shipping}, Total=₹${total}`);
}

// ==================== CHECKOUT ====================
async function loadCheckoutSummary() {
    if (!AppState.currentUser) {
        navigateTo('login');
        return;
    }

    if (AppState.cartItems.length === 0) {
        alert('Your cart is empty');
        navigateTo('shop');
        return;
    }

    const subtotal = AppState.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const baseShipping = subtotal >= 999 ? 0 : 0;
    // Initial display
    updateCheckoutTotalsDisplay(subtotal, baseShipping, 0);

    const itemsHtml = AppState.cartItems.map(item => {
        let imageUrl = getPlaceholderImage();

        if (item.image) {
            if (typeof item.image === 'string') {
                if (item.image.startsWith('data:image')) {
                    imageUrl = item.image;
                } else if (item.image.startsWith('http')) {
                    imageUrl = item.image;
                } else if (item.image.startsWith('/static')) {
                    imageUrl = item.image;
                } else if (item.image.startsWith('[')) {
                    try {
                        const images = JSON.parse(item.image);
                        imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : getPlaceholderImage();
                    } catch (e) {
                        console.error('Checkout image parse error:', e);
                    }
                } else {
                    imageUrl = '/static/' + item.image;
                }
            }
        }

        return `
            <div class="flex items-center gap-4 p-4 border-b">
                <img src="${imageUrl}"
                    class="w-20 h-20 object-cover rounded"
                    alt="${item.name}"
                    onerror="this.src='${getPlaceholderImage()}'">
                <div class="flex-1">
                    <p class="font-medium text-sm">${item.name}</p>
                    ${item.selected_size ? `<p class="text-xs text-gray-600">Size: ${item.selected_size}</p>` : ''}
                    <p class="text-xs text-gray-600">Qty: ${item.quantity}</p>
                </div>
                <span class="font-medium">₹${item.price * item.quantity}</span>
            </div>
        `;
    }).join('');

    document.getElementById('checkoutItems').innerHTML = itemsHtml;

    // Pre-fill form with user data
    if (AppState.currentUser) {
        const nameEl = document.getElementById('checkoutName');
        const emailEl = document.getElementById('checkoutEmail');
        const phoneEl = document.getElementById('checkoutPhone');

        if (nameEl) nameEl.value = AppState.currentUser.name || '';
        if (emailEl) emailEl.value = AppState.currentUser.email || '';
        if (phoneEl) phoneEl.value = AppState.currentUser.phone || '';
    }
}

function updateCheckoutTotals() {
    const subtotal = AppState.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const baseShipping = subtotal >= 999 ? 0 : 0;
    const codRadio = document.getElementById('paymentCOD');
    const codFee = codRadio && codRadio.checked ? 0 : 0;

    // Apply discounts
    const couponDiscount = appliedCouponDiscount || 0;

    const total = subtotal - couponDiscount + baseShipping + codFee;

    updateCheckoutTotalsDisplay(subtotal, baseShipping, codFee);
}

function updateCheckoutTotalsDisplay(subtotal, shipping, codFee) {
    const couponDiscount = appliedCouponDiscount || 0;
    const total = subtotal - couponDiscount + shipping + codFee;

    document.getElementById('checkoutSubtotal').textContent = `₹${subtotal}`;
    document.getElementById('checkoutShipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;

    // COD fee row
    let codFeeRow = document.getElementById('checkoutCODFeeRow');
    if (codFee > 0) {
        if (!codFeeRow) {
            const codHTML = `
                <div id="checkoutCODFeeRow" class="flex justify-between text-gray-600">
                    <span>COD Handling:</span>
                    <span class="font-medium text-orange-600">+₹${codFee}</span>
                </div>
            `;
            document.getElementById('checkoutShipping').parentElement.insertAdjacentHTML('afterend', codHTML);
        }
    } else if (codFeeRow) {
        codFeeRow.remove();
    }

    // Coupon discount row
    let discountRow = document.getElementById('checkoutDiscountRow');
    if (couponDiscount > 0) {
        if (!discountRow) {
            const discountHTML = `
                <div id="checkoutDiscountRow" class="flex justify-between text-gray-600">
                    <span>Discount (${appliedCouponCode}):</span>
                    <span class="font-medium text-green-600">-₹${couponDiscount}</span>
                </div>
            `;
            document.getElementById('checkoutShipping').parentElement.insertAdjacentHTML('afterend', discountHTML);
        }
    } else if (discountRow) {
        discountRow.remove();
    }

    document.getElementById('checkoutTotal').textContent = `₹${total}`;
}

function proceedToCheckout() {
    if (!AppState.currentUser) {
        alert('Please login to checkout');
        closeCart();
        showAuthModal('login');
        return;
    }

    if (AppState.cartItems.length === 0) {
        alert('Your cart is empty');
        return;
    }

    // Navigate to checkout page
    closeCart();
    navigateTo('checkout');

    // Load checkout summary after navigation
    setTimeout(() => {
        loadCheckoutSummary();
    }, 100);
}

function togglePaymentDetails() {
    // CRITICAL FIX: Recalculate totals when payment method changes
    updateCheckoutTotals();

    // Hide error message when method is selected
    const errorDiv = document.getElementById('paymentMethodError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

async function placeOrder() {
    const name = document.getElementById('checkoutName').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();
    const email = document.getElementById('checkoutEmail').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();
    const city = document.getElementById('checkoutCity').value.trim();
    const state = document.getElementById('checkoutState').value.trim();
    const pin = document.getElementById('checkoutPin').value.trim();

    if (!name || !phone || !email || !address || !city || !state || !pin) {
        alert('Please fill all required fields');
        return;
    }

    const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentMethodEl) {
        const errorDiv = document.getElementById('paymentMethodError');
        if (errorDiv) {
            errorDiv.classList.remove('hidden');
            scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        alert('Please select a payment method');
        return;
    }

    const paymentMethod = paymentMethodEl.value;
    const fullAddress = `${address}, ${city}, ${state} - ${pin}`;
    const subtotal = AppState.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate fees
    const baseShipping = subtotal >= 999 ? 0 : 0;
    const codFee = paymentMethod === 'COD' ? 0 : 0;
    const totalAmount = subtotal - appliedCouponDiscount + baseShipping + codFee;

    try {
        if (paymentMethod === 'ONLINE') {
            console.log('💳 Initiating Razorpay payment...');

            // Create Razorpay order
            const orderRes = await fetch(`${API_BASE}/razorpay/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalAmount })
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok || !orderData.success) {
                alert('Failed to initialize payment: ' + (orderData.error || 'Unknown error'));
                return;
            }

            console.log('✅ Razorpay order created:', orderData.order_id);

            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                await loadRazorpayScript();
            }

            // Open Razorpay checkout
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'ADRTA',
                description: 'Order Payment',
                order_id: orderData.order_id,
                prefill: {
                    name: name,
                    email: email,
                    contact: phone
                },
                notes: {
                    address: fullAddress
                },
                theme: {
                    color: '#000000'
                },
                handler: async function (response) {
                    console.log('💰 Payment successful:', response.razorpay_payment_id);

                    // Verify payment and create order
                    try {
                        const verifyRes = await fetch(`${API_BASE}/orders`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                customer_name: name,
                                phone: phone,
                                email: email,
                                address: fullAddress,
                                payment_method: 'ONLINE',
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                coupon_code: appliedCouponCode,
                                discount: appliedCouponDiscount || 0,
                                shipping: baseShipping,
                                cod_fee: 0
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            appliedCouponCode = null;
                            appliedCouponDiscount = 0;
                            showOrderConfirmation(verifyData.order_id, verifyData.total, false);
                        } else {
                            alert('Payment successful but order creation failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
                        }
                    } catch (error) {
                        console.error('❌ Order creation error:', error);
                        alert('Payment successful but order creation failed. Please contact support.');
                    }
                },
                modal: {
                    ondismiss: function() {
                        console.log('⚠️ Payment cancelled by user');
                        alert('Payment cancelled. Your cart is still saved.');
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } else if (paymentMethod === 'COD') {
            console.log('💵 Processing COD order...');

            const confirmCOD = confirm(
                `📦 Cash on Delivery Order Summary:\n\n` +
                `Subtotal: ₹${subtotal}\n` +
                `Shipping: ₹${baseShipping}\n` +
                `COD Fee: ₹${codFee}\n` +
                `${appliedCouponDiscount > 0 ? `Discount: -₹${appliedCouponDiscount}\n` : ''}` +
                `Total to Pay: ₹${totalAmount}\n\n` +
                `⚠️ Note: Have exact cash ready at delivery.\n` +
                `Your order will be confirmed within 24-48 hours.\n\n` +
                `Confirm order?`
            );

            if (!confirmCOD) {
                return;
            }

            const codRes = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: name,
                    phone: phone,
                    email: email,
                    address: fullAddress,
                    payment_method: 'COD',
                    coupon_code: appliedCouponCode,
                    discount: appliedCouponDiscount || 0,
                    shipping: baseShipping,
                    cod_fee: codFee
                })
            });

            const codData = await codRes.json();
            
            if (codRes.ok && codData.success) {   
                appliedCouponCode = null;
                appliedCouponDiscount = 0;
                showOrderConfirmation(codData.order_id, codData.total, true);
            } else {
                alert(codData.error || 'Failed to place COD order');
            }
        }
    } catch (e) {
        console.error('❌ Place order error:', e);
        alert('Error placing order. Please try again.');
    }
}

// Helper function to load Razorpay script dynamically
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            console.log('✅ Razorpay script loaded');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Failed to load Razorpay script');
            reject(new Error('Failed to load Razorpay'));
        };
        document.body.appendChild(script);
    });
}

// Helper function to show order confirmation
function showOrderConfirmation(orderId, total, isCOD = false) {
    const confirmationContent = document.getElementById('orderConfirmationContent');
    if (confirmationContent) {
        confirmationContent.innerHTML = `
            <div class="text-center">
                <div class="w-24 h-24 ${isCOD ? 'bg-orange-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-12 h-12 ${isCOD ? 'text-orange-600' : 'text-green-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <h1 class="font-display text-4xl tracking-wider mb-4">ORDER ${isCOD ? 'RECEIVED' : 'CONFIRMED'}!</h1>
                <p class="text-gray-600 mb-6">
                    ${isCOD
                        ? 'Your COD order has been received. We will confirm within 24-48 hours and send you a confirmation email.'
                        : 'Thank you for your order. We\'ll send you a confirmation email shortly.'}
                </p>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <p class="text-sm text-gray-600 mb-2">Order ID</p>
                    <p class="font-display text-2xl tracking-wider">${orderId}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <p class="text-sm text-gray-600 mb-2">Total Amount ${isCOD ? '(Pay on Delivery)' : ''}</p>
                    <p class="text-3xl font-bold">${isCOD ? '💵 ' : ''}₹${total}</p>
                </div>
                ${isCOD ? `
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                        <p class="text-sm font-semibold text-orange-800 mb-2">⚠️ Important COD Instructions:</p>
                        <ul class="text-sm text-orange-700 text-left space-y-1">
                            <li>• Please keep exact cash of ₹${total} ready</li>
                            <li>• Order confirmation will be sent within 24-48 hours</li>
                            <li>• You can track your order status in "My Orders"</li>
                            <li>• Do not accept tampered or damaged packages</li>
                        </ul>
                    </div>
                ` : ''}
                <button onclick="navigateTo('shop')" class="btn-primary">CONTINUE SHOPPING</button>
            </div>
        `;
    }

    AppState.cartItems = [];
    updateCartBadge();
    navigateTo('order-confirmation');
}