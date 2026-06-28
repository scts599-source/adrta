// ==================== ADDITIONAL APP FUNCTIONS ====================

function addMarqueeItem(...args) {

            const list = document.getElementById('modMarqueeItems');
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;gap:0.5rem;align-items:center;';
            div.innerHTML = `<input type="text" placeholder="NEW MARQUEE ITEM" style="flex:1;background:#0a0a0a;border:1px solid #222;color:#ccc;padding:0.6rem 0.85rem;font-size:0.78rem;outline:none;letter-spacing:0.08em;text-transform:uppercase;">
                <button style="background:#1a1a1a;color:#666;border:1px solid #222;padding:0.6rem;cursor:pointer;" onclick="removeMarqueeItem(this)">âœ•</button>`;
            list.appendChild(div);
            showModifierUnsaved();
        
}

function applyColorPreset(...args) {

            document.getElementById('modColorPrimary').value = primary;
            document.getElementById('modColorSecondary').value = secondary;
            document.getElementById('modColorAccent').value = accent;
            liveColorUpdate('primary', primary);
            liveColorUpdate('secondary', secondary);
            liveColorUpdate('accent', accent);
        
}

async function applyCoupon(...args) {


            const code = document.getElementById('couponInput').value.trim().toUpperCase();
            if (!code) {
                alert('Please enter a coupon code');
                return;
            }

            const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            try {
                const res = await fetch(`${API_BASE}/coupons/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, subtotal })
                });

                const data = await res.json();

                if (res.ok) {
                    appliedCouponCode = code;
                    appliedCouponDiscount = data.discount;

                    document.getElementById('couponMessage').innerHTML =
                        `<span class="text-green-600">âœ… Coupon applied! You saved â‚¹${data.discount}</span>`;

                    updateCheckoutTotals();
                } else {
                    document.getElementById('couponMessage').innerHTML =
                        `<span class="text-red-600">âŒ ${data.error}</span>`;

                    appliedCouponCode = null;
                    appliedCouponDiscount = 0;
                    updateCheckoutTotals();
                }
            } catch (e) {
                console.error('Coupon error:', e);
                alert('Failed to apply coupon');
            }
        
}

function applyCustomFont(...args) {

            const font = document.getElementById('modCustomFont')?.value;
            const role = document.getElementById('modCustomFontRole')?.value;
            if (!font) return;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s/g,'+')}:wght@400;600;700;800;900&display=swap`;
            document.head.appendChild(link);
            if (role === 'For Display') {
                document.querySelectorAll('.hero-title, .font-display').forEach(el => el.style.fontFamily = `'${font}',cursive`);
                document.getElementById('modDisplayPreview').style.fontFamily = `'${font}',cursive`;
            } else {
                document.body.style.fontFamily = `'${font}',sans-serif`;
            }
            showToast(`Font "${font}" applied for ${role}`, 'success');
            showModifierUnsaved();
        
}

function applyHeroImageUrl(...args) {

            const url = document.getElementById('modHeroImageUrl')?.value;
            if (!url) return;
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) heroSection.style.backgroundImage = `url('${url}')`;
            showModifierUnsaved();
            showToast('Hero image updated (preview)', 'success');
        
}

function calculateDiscount(...args) {

            if (!originalPrice || !sellingPrice || originalPrice <= sellingPrice) {
                return 0;
            }
            const discount = ((originalPrice - sellingPrice) / originalPrice) * 100;
            return Math.round(discount);
        
}

function calculateDiscountPreview(...args) {

            const mrpInput = document.getElementById('productMRP');
            const priceInput = document.getElementById('productPrice');
            const previewDiv = document.getElementById('discountPreview');
            const discountText = document.getElementById('discountText');

            if (!mrpInput || !priceInput || !previewDiv || !discountText) return;

            const mrp = parseFloat(mrpInput.value) || 0;
            const sellingPrice = parseFloat(priceInput.value) || 0;

            if (mrp > 0 && sellingPrice > 0 && mrp > sellingPrice) {
                const discount = Math.round(((mrp - sellingPrice) / mrp) * 100);
                const savings = mrp - sellingPrice;
                previewDiv.style.display = 'block';
                discountText.textContent = `${discount}% OFF (Save â‚¹${savings})`;
            } else {
                previewDiv.style.display = 'none';
            }
        
}

function cancelAddProduct(...args) {

            document.getElementById('addProductForm').style.display = 'none';
            document.getElementById('productForm').reset();
            document.getElementById('productImagePreview').innerHTML = '';

            const existingImg = document.getElementById('existingProductImages');
            if (existingImg) existingImg.value = '';

            selectedProductImages = [];
            editingProductId = null;

            const variantMgmt = document.getElementById('variantManagement');
            if (variantMgmt) variantMgmt.style.display = 'none';
        
}

function cancelAddVariant(...args) {

            const form = document.getElementById('addVariantForm');
            if (form) form.style.display = 'none';

            // Clear form fields
            const colorName = document.getElementById('variantColorName');
            const price = document.getElementById('variantPrice');
            const stock = document.getElementById('variantStock');
            const imageInput = document.getElementById('variantImageInput');
            const preview = document.getElementById('variantImagePreview');

            if (colorName) colorName.value = '';
            if (price) price.value = '';
            if (stock) stock.value = '0';
            if (imageInput) imageInput.value = '';
            if (preview) preview.innerHTML = '';

            variantImages = [];
        
}

function cancelCouponForm(...args) {

            const form = document.getElementById('addCouponForm');
            if (form) {
                form.style.display = 'none';
            }

            // Reset form fields
            const couponForm = document.querySelector('#addCouponForm form');
            if (couponForm) {
                couponForm.reset();
            }
        
}

async function changePassword(...args) {

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                alert('âŒ Passwords do not match');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/user/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('âœ… Password changed successfully!');
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                } else {
                    alert('âŒ ' + (data.error || 'Failed to change password'));
                }
            } catch (e) {
                console.error('Change password error:', e);
                alert('âŒ Failed to change password');
            }
        
}

function changeSlide(...args) {

            stopAutoSlide();
            currentSlideIndex += direction;

            if (currentSlideIndex < 0) {
                currentSlideIndex = carouselImages.length - 1;
            } else if (currentSlideIndex >= carouselImages.length) {
                currentSlideIndex = 0;
            }

            updateCarouselPosition();
            startAutoSlide();
        
}

function checkModifierAccess(...args) {

            return fetch('/api/team/verify', { credentials: 'include' })
                .then(r => r.json())
                .then(d => d.authenticated)
                .catch(() => false);
        
}

function closeCart(...args) {

            const drawer = document.getElementById('cartDrawer');
            const overlay = document.getElementById('cartOverlay');
            if (drawer) drawer.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        
}

function closeModifierLogin(...args) {

            const modal = document.getElementById('modifierLoginModal');
            if (modal) modal.style.display = 'none';
        
}

function closeOrderModal(...args) {

            const modal = document.getElementById('orderDetailModal');
            if (modal) modal.remove();
        
}

function closeUserOrderModal(...args) {

            const modal = document.getElementById('userOrderDetailModal');
            if (modal) modal.remove();
        
}

function collectModifierSettings(...args) {

            if (section === 'hero') {
                return {
                    imageUrl: document.getElementById('modHeroImageUrl')?.value,
                    title: document.getElementById('modHeroTitle')?.value,
                    subtitle: document.getElementById('modHeroSubtitle')?.value,
                    cta: document.getElementById('modHeroCta')?.value,
                    font: document.getElementById('modHeroFont')?.value,
                    overlay: document.getElementById('modHeroOverlay')?.value
                };
            }
            if (section === 'colors') {
                return {
                    primary: document.getElementById('modColorPrimary')?.value,
                    secondary: document.getElementById('modColorSecondary')?.value,
                    accent: document.getElementById('modColorAccent')?.value
                };
            }
            return {};
        
}

function copyShareableLink(...args) {

            const link = getShareableLink(page, params);

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(link).then(() => {
                    showToast('Link copied to clipboard!', 'success');
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    fallbackCopyLink(link);
                });
            } else {
                fallbackCopyLink(link);
            }
        
}

async function deleteAdminCoupon(...args) {

            if (!confirm('Delete this coupon? This action cannot be undone.')) return;

            try {
                const res = await fetch(`${API_BASE}/admin/coupons/${couponId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    alert('âœ… Coupon deleted successfully!');
                    await loadAdminCoupons();
                } else {
                    const data = await res.json();
                    alert('âŒ ' + (data.error || 'Error deleting coupon'));
                }
            } catch (e) {
                console.error('Delete coupon error:', e);
                alert('âŒ Error deleting coupon');
            }
        
}

async function deleteProduct(...args) {

            if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    alert('âœ… Product deleted successfully!');
                    await loadAdminProducts();
                } else {
                    const data = await res.json();
                    alert('âŒ ' + (data.error || 'Failed to delete product'));
                }
            } catch (e) {
                console.error('Delete product error:', e);
                alert('âŒ Error deleting product: ' + e.message);
            }
        
}

async function deleteVariant(...args) {

            if (!confirm('Delete this variant?')) return;

            try {
                const res = await fetch(`${API_BASE}/admin/variants/${variantId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    alert('Variant deleted!');
                    loadProductVariants(currentProductIdForVariants);
                } else {
                    alert('Failed to delete variant');
                }
            } catch (e) {
                console.error('Delete variant error:', e);
                alert('Error deleting variant');
            }
        
}

async function editAdminOrder(...args) {

            const newStatus = prompt('Enter new order status:\n- pending confirmation\n- confirmed\n- packed\n- shipped\n- delivered\n- cancelled');

            if (!newStatus) return;

            const trackingId = prompt('Enter tracking ID (or leave blank):');

            try {
                const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_status: newStatus,
                        tracking_id: trackingId || null
                    })
                });

                if (res.ok) {
                    alert('Order updated!');
                    loadAdminOrders();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Error updating order');
                }
            } catch (e) {
                console.error('Edit order error:', e);
                alert('Error updating order');
            }
        
}

async function editProduct(...args) {

            try {
                const res = await fetch(`${API_BASE}/products/${productId}`);
                if (!res.ok) throw new Error(`Product with ID ${productId} not found`);

                const product = await res.json();
                console.log('âœ… Product data loaded for edit:', product);

                // Populate form fields
                const nameInput = document.getElementById('productName');
                const categoryInput = document.getElementById('productCategory');
                const mrpInput = document.getElementById('productMRP');
                const priceInput = document.getElementById('productPrice');
                const stockInput = document.getElementById('productStock');
                const descInput = document.getElementById('productDescription');
                const isNewInput = document.getElementById('productIsNew');

                if (nameInput) nameInput.value = product.name || '';
                if (categoryInput) categoryInput.value = product.category || 'Hoodies';

                // Set MRP and Price
                const mrpValue = product.original_price || product.mrp || product.price || '';
                const priceValue = product.price || '';

                if (mrpInput) mrpInput.value = mrpValue;
                if (priceInput) priceInput.value = priceValue;
                if (stockInput) stockInput.value = product.stock || 0;
                if (descInput) descInput.value = product.description || '';
                if (isNewInput) isNewInput.checked = product.is_new || false;

                // Handle sizes
                document.querySelectorAll('.size-checkbox').forEach(cb => cb.checked = false);
                if (product.available_sizes) {
                    let sizes = [];
                    if (Array.isArray(product.available_sizes)) {
                        sizes = product.available_sizes;
                    } else if (typeof product.available_sizes === 'string') {
                        try {
                            sizes = JSON.parse(product.available_sizes);
                        } catch (e) {
                            console.warn('Could not parse available_sizes:', product.available_sizes);
                        }
                    }

                    if (Array.isArray(sizes)) {
                        sizes.forEach(size => {
                            const checkbox = document.querySelector(`.size-checkbox[value="${size}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                }

                // Update discount preview
                if (typeof calculateDiscountPreview === 'function') {
                    calculateDiscountPreview();
                }

                // Handle images - show existing images
                const preview = document.getElementById('imagePreviewContainer');
                if (preview) {
                    preview.innerHTML = '';

                    if (product.image) {
                        let images = [];
                        try {
                            images = JSON.parse(product.image);
                            if (!Array.isArray(images)) {
                                images = [product.image];
                            }
                        } catch (e) {
                            images = [product.image];
                        }

                        images.forEach((img, idx) => {
                            const previewItem = document.createElement('div');
                            previewItem.className = 'relative';
                            previewItem.innerHTML = `
                                <img src="${img}" alt="Existing Image ${idx + 1}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px;" onerror="this.src='${getPlaceholderImage()}'">
                                <span class="absolute bottom-1 left-1 bg-gray-800 text-white text-xs px-2 py-1 rounded">Existing ${idx === 0 ? '(Main)' : ''}</span>
                            `;
                            preview.appendChild(previewItem);
                        });

                        // Store existing images
                        window.existingProductImages = product.image;
                    } else {
                        preview.innerHTML = '<p class="text-sm text-gray-500">No current images.</p>';
                        window.existingProductImages = null;
                    }
                }

                selectedProductImages = [];
                const imageInput = document.getElementById('productImageInput');
                if (imageInput) imageInput.value = '';

                // Update form state
                editingProductId = productId;
                const formTitle = document.getElementById('productFormTitle');
                if (formTitle) {
                    formTitle.textContent = 'Edit Product (ID: #' + productId + ')';
                }

                const saveBtn = document.querySelector('#productForm button[onclick*="saveProduct"]');
                if (saveBtn) {
                    saveBtn.innerHTML = '<i class="bi bi-save mr-2"></i> Update Product';
                }

                const formContainer = document.getElementById('addProductForm');
                if (formContainer) {
                    formContainer.style.display = 'block';
                    formContainer.scrollIntoView({ behavior: 'smooth' });
                }

                if (typeof loadProductVariants === 'function') {
                    loadProductVariants(productId);
                }

            } catch (e) {
                console.error('âŒ Edit product error:', e);
                alert('Error loading product: ' + e.message + '. Check console for details.');
            }
        
}

function exportUsersCSV(...args) {

            fetch(`${API_BASE}/admin/users`)
                .then(res => res.json())
                .then(users => {
                    let csv = 'ID,Name,Email,Phone,Password(Hashed),Address,Is Admin,Is Verified,Created At\n';

                    users.forEach(u => {
                        const escapedAddress = (u.address || '').replace(/"/g, '""');
                        const escapedPassword = (u.password || '').replace(/"/g, '""');
                        csv += `${u.id},"${u.name || ''}","${u.email || ''}","${u.phone || ''}","${escapedPassword}","${escapedAddress}",${u.is_admin},${u.is_verified},"${u.created_at}"\n`;
                    });

                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `adrta_users_backup_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                })
                .catch(e => {
                    console.error('Export error:', e);
                    alert('Error exporting users');
                });
        
}

function fallbackCopyLink(text) {

            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                showToast('Link copied to clipboard!', 'success');
            } catch (err) {
                console.error('Fallback copy failed:', err);
                prompt('Copy this link:', text);
            }

            document.body.removeChild(textArea);
        
}

async function filterByCategory(...args) {

            console.log('ðŸ” Filtering by category:', category);

            // Navigate to shop page first
            navigateTo('shop');

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 100));

            // Then filter
            await filterProducts(category);
        
}

function getProductRating(...args) {

            const seed = (productName || '').length;
            // LCG-style deterministic hash from the seed
            const hash = ((seed * 1103515245) + 12345) & 0x7fffffff;
            // Rating between 4.4 and 4.9 (range of 0.5, in steps of 0.1)
            const ratingSteps = hash % 6; // 0â€“5
            const rating = (4.4 + ratingSteps * 0.1).toFixed(1);
            // Review count between 15 and 85
            const reviewCount = 15 + ((hash >> 4) % 71);
            return { rating, reviewCount };
        
}

function getShareableLink(...args) {

            const url = getUrlForPage(page, params);
            return `${BASE_URL}${url}`;
        
}

function getUrlForPage(...args) {

            switch(page) {
                case 'home':
                    return '/';
                case 'shop':
                    return '/shop';
                case 'new':
                    return '/new-arrivals';
                case 'about':
                    return '/about';
                case 'account':
                    return '/account';
                case 'orders':
                    return '/orders';
                case 'login':
                    return '/login';
                case 'signup':
                    return '/signup';
                case 'cart':
                    return '/cart';
                case 'checkout':
                    return '/checkout';
                case 'admin':
                    return '/admin';
                case 'product':
                    if (params.id) {
                        return `/product/${params.id}`;
                    }
                    return '/shop';
                default:
                    return '/';
            }
        
}

function goToSlide(...args) {

            stopAutoSlide();
            currentSlideIndex = index;
            updateCarouselPosition();
            startAutoSlide();
        
}

function handleAccountClick(...args) {

            if (currentUser) {
        // User is logged in - go to account page
                if (currentUser.is_admin) {
                    navigateTo('admin');
                } else {
                    navigateTo('account');
                }
            } else {
        // User is not logged in - show login modal
                showAuthModal('login');
            }
        
}

function handleLogout(...args) {

            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        
}

function handleModifierHeroImage(...args) {

            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const thumb = document.getElementById('modHeroImageThumb');
                const placeholder = document.getElementById('modHeroImagePlaceholder');
                if (thumb) { thumb.src = e.target.result; thumb.style.display = 'block'; }
                if (placeholder) placeholder.style.display = 'none';
                showModifierUnsaved();
            };
            reader.readAsDataURL(file);
        
}

async function handleNewsletter(event) {

            event.preventDefault();

            const form = event.target;
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value.trim();

            if (!email) {
                alert('Please enter your email');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'SUBSCRIBING...';
            submitBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('âœ… ' + (data.message || 'Successfully subscribed!'));
                    emailInput.value = '';
                } else {
                    alert('âŒ ' + (data.error || 'Subscription failed'));
                }
            } catch (e) {
                console.error('Newsletter error:', e);
                alert('âŒ Subscription failed. Please try again.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        
}

function handleSearch(event) {

            if (event.key === 'Enter') {
                performSearch();
            }
        
}

function initCarousel(...args) {

            carouselImages = images;
            currentSlideIndex = 0;
            updateCarouselPosition();
            startAutoSlide();
        
}

function liveColorUpdate(...args) {

            document.getElementById('modColor' + role.charAt(0).toUpperCase() + role.slice(1) + 'Hex').value = val;
            if (role === 'primary') document.documentElement.style.setProperty('--primary', val);
            if (role === 'secondary') document.documentElement.style.setProperty('--secondary', val);
            if (role === 'accent') document.documentElement.style.setProperty('--accent', val);
            showModifierUnsaved();
        
}

function liveUpdateHeroCta(...args) {

            const btn = document.querySelector('.hero-cta-btn');
            if (btn) btn.textContent = val;
            showModifierUnsaved();
        
}

function liveUpdateHeroSubtitle(...args) {

            const sub = document.querySelector('.hero-subtitle');
            if (sub) sub.textContent = val;
            showModifierUnsaved();
        
}

function liveUpdateHeroTitle(...args) {

            const title = document.querySelector('.hero-title');
            if (title) title.textContent = val;
            showModifierUnsaved();
        
}

function loadAccountAddresses(...args) {

            // Placeholder â€” wire to /api/user/addresses
            const container = document.getElementById('accountAddressList');
            if (container && container.children.length <= 1) {
                container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#aaa;border:1px dashed #ddd;font-size:0.85rem;">No saved addresses</div>';
            }
        
}

function loadAccountOrders(...args) {

            const container = document.getElementById('accountOrdersList');
            if (!container) return;

            fetch('/api/user/orders', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    const orders = data.orders || [];
                    if (!orders.length) {
                        container.innerHTML = `<div style="text-align:center; padding:4rem; color:#aaa; border:1px dashed #ddd;">
                            <p style="font-size:0.85rem; margin-bottom:1rem;">No orders yet</p>
                            <button onclick="navigateTo('shop')" class="btn-primary btn-sm">START SHOPPING</button>
                        </div>`;
                        return;
                    }
                    container.innerHTML = orders.map(order => `
                        <div style="background:#fff; border:1px solid #e8e8e8; margin-bottom:0.75rem;">
                            <div style="padding:1rem 1.25rem; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f5f5f5;">
                                <div style="display:flex; align-items:center; gap:1.5rem;">
                                    <div>
                                        <p style="font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:#aaa;">Order ID</p>
                                        <p style="font-weight:600; font-size:0.85rem;">#${order.id}</p>
                                    </div>
                                    <div>
                                        <p style="font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:#aaa;">Date</p>
                                        <p style="font-size:0.82rem;">${new Date(order.created_at).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</p>
                                    </div>
                                    <div>
                                        <p style="font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:#aaa;">Total</p>
                                        <p style="font-weight:600; font-size:0.85rem;">â‚¹${order.total_amount?.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p style="font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:#aaa;">Items</p>
                                        <p style="font-size:0.82rem;">${order.item_count || 1}</p>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:1rem;">
                                    <span class="status-badge status-${(order.status||'').toLowerCase().replace(/\s/g,'')}">${order.status || 'Processing'}</span>
                                    <button onclick="viewOrderDetail(${order.id})" style="background:none; border:1.5px solid #000; padding:0.45rem 1rem; font-size:0.62rem; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s;"
                                        onmouseover="this.style.background='#000';this.style.color='#fff'" onmouseout="this.style.background='none';this.style.color='#000'">
                                        VIEW
                                    </button>
                                </div>
                            </div>
                            <div style="padding:0.75rem 1.25rem; display:flex; gap:0.75rem; overflow-x:auto;">
                                ${(order.items || []).slice(0,3).map(item => `
                                    <div style="flex-shrink:0; display:flex; gap:0.6rem; align-items:center;">
                                        <img src="${item.image || ''}" style="width:48px; height:48px; object-fit:cover; background:#f5f5f5;" onerror="this.style.background='#eee'">
                                        <div>
                                            <p style="font-size:0.72rem; font-weight:500; white-space:nowrap; max-width:120px; overflow:hidden; text-overflow:ellipsis;">${item.product_name || 'Product'}</p>
                                            <p style="font-size:0.65rem; color:#aaa;">${item.size || ''} Â· Qty: ${item.quantity}</p>
                                        </div>
                                    </div>
                                `).join('')}
                                ${(order.items||[]).length > 3 ? `<div style="flex-shrink:0; display:flex; align-items:center; color:#aaa; font-size:0.72rem;">+${order.items.length - 3} more</div>` : ''}
                            </div>
                        </div>
                    `).join('');

                    // Update stats
                    const totalOrdersEl = document.getElementById('accountTotalOrders');
                    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
                })
                .catch(() => {
                    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#aaa;">Could not load orders</div>';
                });
        
}

function loadAccountProfile(...args) {

            fetch('/api/user/profile', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    if (data.user) {
                        const u = data.user;
                        const nameEl = document.getElementById('profileName');
                        const emailEl = document.getElementById('profileEmail');
                        const phoneEl = document.getElementById('profilePhone');
                        if (nameEl) nameEl.value = u.name || '';
                        if (emailEl) emailEl.value = u.email || '';
                        if (phoneEl) phoneEl.value = u.phone || '';
                    }
                }).catch(() => {});
        
}

async function loadAdminCoupons(...args) {

            try {
                const res = await fetch(`${API_BASE}/admin/coupons`);
                if (!res.ok) throw new Error('Failed to load coupons');

                const coupons = await res.json();

                const tbody = document.getElementById('couponsTableBody');
                if (!tbody) {
                    console.error('âŒ couponsTableBody not found!');
                    return;
                }

                if (coupons.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500">No coupons yet. Create your first coupon above.</td></tr>';
                    return;
                }

                tbody.innerHTML = coupons.map(c => {
                    // âœ… Format expiry date
                    let expiryDisplay = 'No expiry';
                    if (c.expiry) {
                        try {
                            const expiryDate = new Date(c.expiry);
                            expiryDisplay = expiryDate.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });
                        } catch (e) {
                            expiryDisplay = c.expiry;
                        }
                    }

                    // âœ… Format minimum order
                    const minOrder = c.min_subtotal || 0;

                    return `
                        <tr>
                            <td class="py-3 px-4"><strong>${c.code}</strong></td>
                            <td class="py-3 px-4">${c.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                            <td class="py-3 px-4">${c.type === 'percentage' ? c.value + '%' : 'â‚¹' + c.value}</td>
                            <td class="py-3 px-4">${minOrder > 0 ? 'â‚¹' + minOrder : 'No minimum'}</td>
                            <td class="py-3 px-4">${c.used_count || 0} / ${c.max_uses || 'âˆž'}</td>
                            <td class="py-3 px-4">${expiryDisplay}</td>
                            <td class="py-3 px-4">
                                <span class="px-2 py-1 rounded text-xs ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                    ${c.active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td class="py-3 px-4">
                                <button class="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm" onclick="deleteAdminCoupon(${c.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (e) {
                console.error('Load coupons error:', e);
                const tbody = document.getElementById('couponsTableBody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-600">Error loading coupons</td></tr>';
                }
            }
        
}

async function loadAdminDashboard(...args) {

            if (!currentUser || !currentUser.is_admin) {
                navigateTo('home');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/admin/stats`);
                if (!res.ok) throw new Error('Failed to load stats');

                const stats = await res.json();

                document.getElementById('totalOrders').textContent = stats.total_orders || 0;
                document.getElementById('pendingOrders').textContent = stats.pending_orders || 0;
                document.getElementById('totalRevenue').textContent = `â‚¹${stats.total_revenue || 0}`;
                document.getElementById('totalProducts').textContent = stats.total_products || 0;
            } catch (e) {
                console.error('Load admin stats error:', e);
            }
        
}

async function loadAdminOrders(...args) {

            try {
                const res = await fetch(`${API_BASE}/admin/orders`);
                if (!res.ok) throw new Error('Failed to load orders');

                const orders = await res.json();

                const container = document.getElementById('adminOrdersList');
                if (!container) return;

                if (orders.length === 0) {
                    container.innerHTML = '<p class="text-center text-muted">No orders yet</p>';
                    return;
                }

                container.innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Contact</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.map(o => `
                                    <tr>
                                        <td><strong>${o.id}</strong></td>
                                        <td>
                                            ${o.customer_name || 'N/A'}<br>
                                            <small class="text-muted">User ID: ${o.user_id || 'Guest'}</small>
                                        </td>
                                        <td>
                                            ${o.phone || 'N/A'}<br>
                                            <small class="text-muted">${o.email || 'N/A'}</small>
                                        </td>
                                        <td><strong>â‚¹${o.total_amount}</strong></td>
                                        <td>
                                            <span class="badge bg-${o.payment_method === 'UPI' ? 'info' : 'warning'}">${o.payment_method || 'N/A'}</span><br>
                                            <span class="badge bg-${o.payment_status === 'completed' ? 'success' : 'warning'} mt-1">${o.payment_status || 'pending'}</span>
                                            ${o.payment_reference ? `<br><small class="text-muted">Ref: ${o.payment_reference}</small>` : ''}
                                        </td>
                                        <td><span class="status-badge status-${(o.order_status || 'pending').toLowerCase().replace(/\s+/g, '')}">${o.order_status || 'pending'}</span></td>
                                        <td>${new Date(o.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button class="btn btn-sm btn-primary" onclick="viewAdminOrderDetail('${o.id}')">View Details</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } catch (e) {
                console.error('Load admin orders error:', e);
            }
        
}

async function loadAdminProducts(...args) {

            try {
                console.log('ðŸ“¦ Loading admin products...');

                const res = await fetch(`${API_BASE}/admin/products`);
                if (!res.ok) throw new Error('Failed to load products');

                const products = await res.json();
                console.log(`âœ… Loaded ${products.length} products for admin`);

                const tbody = document.getElementById('productsTableBody');
                if (!tbody) {
                    console.error('âŒ productsTableBody not found!');
                    return;
                }

                if (products.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" class="text-center py-8">
                                <div class="flex flex-col items-center gap-4 text-gray-500">
                                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                    </svg>
                                    <p class="text-gray-600">No products yet. Click "Add New Product" to create one.</p>
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }

                tbody.innerHTML = products.map(p => {
                    // Safe image parsing
                    let imageUrl = getPlaceholderImage();
                    try {
                        if (p.image) {
                            if (typeof p.image === 'string' && p.image.startsWith('[')) {
                                const parsed = JSON.parse(p.image);
                                imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : p.image;
                            } else {
                                imageUrl = p.image;
                            }
                        }
                    } catch (e) {
                        imageUrl = p.image || getPlaceholderImage();
                    }

                    // Calculate pricing with proper fallbacks
                    const mrp = p.original_price || p.mrp || p.price || 0;
                    const sellingPrice = p.price || 0;
                    const discount = (mrp > sellingPrice && mrp > 0)
                        ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                        : 0;

                    // Stock badge styling
                    let stockClass = 'bg-green-100 text-green-800';
                    if (p.stock <= 0) {
                        stockClass = 'bg-red-100 text-red-800';
                    } else if (p.stock <= 10) {
                        stockClass = 'bg-yellow-100 text-yellow-800';
                    }

                    return `
                        <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100">
                            <td class="py-3 px-4">
                                <span class="font-mono text-sm font-bold">#${p.id || 'N/A'}</span>
                            </td>
                            <td class="py-3 px-4">
                                <img src="${imageUrl}"
                                    class="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                                    alt="${p.name || 'Product'}"
                                    onerror="this.src='${getPlaceholderImage()}'">
                            </td>
                            <td class="py-3 px-4">
                                <div class="font-medium">${p.name || 'Unnamed Product'}</div>
                                ${p.is_new ? '<span class="inline-block px-2 py-0.5 bg-red-500 text-white text-xs rounded mt-1">NEW</span>' : ''}
                            </td>
                            <td class="py-3 px-4">
                                <span class="px-2 py-1 bg-gray-100 rounded text-sm">${p.category || 'N/A'}</span>
                            </td>
                            <td class="py-3 px-4">
                                <span class="text-gray-500 ${discount > 0 ? 'line-through' : ''}">â‚¹${mrp}</span>
                            </td>
                            <td class="py-3 px-4">
                                <span class="font-bold text-lg">â‚¹${sellingPrice}</span>
                            </td>
                            <td class="py-3 px-4">
                                ${discount > 0
                                    ? `<span class="px-2 py-1 bg-green-100 text-green-800 rounded font-bold text-sm">${discount}% OFF</span>`
                                    : '<span class="text-gray-400">â€”</span>'}
                            </td>
                            <td class="py-3 px-4">
                                <span class="px-3 py-1 rounded-full text-sm font-medium ${stockClass}">
                                    ${p.stock !== undefined ? p.stock : 0}
                                </span>
                            </td>
                            <td class="py-3 px-4">
                                <div class="flex gap-2">
                                    <button
                                        class="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                                        onclick="editProduct(${p.id})"
                                        title="Edit Product">
                                        âœï¸ Edit
                                    </button>
                                    <button
                                        class="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                                        onclick="deleteProduct(${p.id})"
                                        title="Delete Product">
                                        ðŸ—‘ï¸ Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');

                console.log('âœ… Admin products table rendered successfully');

            } catch (e) {
                console.error('âŒ Load admin products error:', e);
                console.error('Stack trace:', e.stack);

                const tbody = document.getElementById('productsTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" class="text-center py-8 text-red-600">
                                <div class="flex flex-col items-center gap-4">
                                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <p>Failed to load products. Please check the console for details.</p>
                                    <button onclick="loadAdminProducts()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                        Retry Loading
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            }
        
}

async function loadAdminUsers(...args) {

            const tbody = document.getElementById('usersTableBody');
            if (!tbody) return;

            tbody.innerHTML = '<tr><td colspan="9" class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

            try {
                const res = await fetch(`${API_BASE}/admin/users`);
                if (!res.ok) throw new Error('Failed to load users');

                const users = await res.json();

                if (users.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" class="text-center">No users found</td></tr>';
                    return;
                }

                tbody.innerHTML = users.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td>${u.name || 'N/A'}</td>
                        <td>${u.email || 'N/A'}</td>
                        <td>${u.phone || 'N/A'}</td>
                        <td><code class="small" style="word-break: break-all; font-size: 10px;">${u.password ? u.password.substring(0, 25) + '...' : 'N/A'}</code></td>
                        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${u.address || 'N/A'}</td>
                        <td>${u.is_admin ? '<span class="badge bg-danger">Yes</span>' : '<span class="badge bg-secondary">No</span>'}</td>
                        <td>${u.is_verified ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-warning">No</span>'}</td>
                        <td>${new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            } catch (e) {
                console.error('Load users error:', e);
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading users</td></tr>';
            }
        
}

async function loadAndShowProduct(...args) {

            try {
                console.log('ðŸ“¦ Loading product from URL:', productId);

                // âœ… FIXED: Use existing viewProduct function
                await viewProduct(productId);

                console.log('âœ… Product loaded successfully');

            } catch (error) {
                console.error('âŒ Error loading product:', error);
                alert('Product not found. Redirecting to shop.');
                navigateTo('shop');
            }
        
}

async function loadMaintenanceSettings(...args) {

            try {
                const res = await fetch(`${API_BASE}/admin/maintenance`);
                if (!res.ok) throw new Error('Failed to load settings');

                const settings = await res.json();

                const toggleInput = document.getElementById('maintenanceToggle');
                const msgInput = document.getElementById('maintenanceMsg');
                const endsInput = document.getElementById('maintenanceEndsInput');

                if (toggleInput) toggleInput.checked = settings.enabled || false;
                if (msgInput) msgInput.value = settings.message || '';

                if (settings.endsAt && endsInput) {
                    const endDate = new Date(settings.endsAt);
                    endsInput.value = endDate.toISOString().slice(0, 16);
                } else if (endsInput) {
                    endsInput.value = '';
                }

            } catch (e) {
                console.error('Maintenance load error:', e);
            }
        
}

function loadPageContent(...args) {

            switch(page) {
                case 'home':
                    loadNewArrivals();
                    break;
                case 'shop':
                    loadShopProducts();
                    break;
                case 'new':
                    loadNewArrivalsPage();
                    break;
                case 'account':
                    if (!currentUser) {
                        showAuthModal('login');
                    } else {
                        loadUserProfile();
                    }
                    break;
                case 'orders':
                    if (!currentUser) {
                        showAuthModal('login');
                    } else {
                        loadUserOrders();
                    }
                    break;
                case 'login':
                    showAuthModal('login');
                    break;
                case 'signup':
                    showAuthModal('signup');
                    break;
                case 'cart':
                    navigateTo('checkout');
                    break;
                case 'checkout':
                    if (!currentUser) {
                        showAuthModal('login');
                    } else {
                        // Show checkout page and load summary
                        document.querySelectorAll('.page').forEach(p => {
                            p.classList.remove('active', 'visible');
                        });
                        const checkoutPage = document.getElementById('page-checkout');
                        if (checkoutPage) {
                            checkoutPage.classList.add('active');
                            setTimeout(() => checkoutPage.classList.add('visible'), 10);
                        }
                        loadCheckoutSummary();
                    }
                    break;
                case 'product':
                    if (params.id) {
                        loadAndShowProduct(params.id);
                    } else {
                        navigateTo('shop');
                    }
                    break;
                case 'admin':
                    if (!currentUser || !currentUser.is_admin) {
                        alert('Access denied. Admin only.');
                        navigateTo('home');
                    } else {
                        loadAdminDashboard();
                        loadAdminOrders();
                        loadAdminProducts();
                        loadAdminCoupons();
                        loadMaintenanceSettings();
                    }
                    break;
                default:
                    console.log('â„¹ï¸ No special loading for page:', page);
            }
        
}

async function loadProductVariants(...args) {

            currentProductIdForVariants = productId;
            const variantMgmt = document.getElementById('variantManagement');
            if (variantMgmt) variantMgmt.style.display = 'block';

            try {
                const res = await fetch(`${API_BASE}/admin/products/${productId}/variants`);
                const variants = await res.json();

                const tbody = document.getElementById('variantsTableBody');
                if (!tbody) return;

                if (variants.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No variants yet. Add one above!</td></tr>';
                    return;
                }

                tbody.innerHTML = variants.map(v => {
                    const imageCount = v.images && v.images.length > 0 ? v.images.length : 0;
                    const imagePreview = imageCount > 0
                        ? `<img src="${v.images[0]}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">`
                        : 'No images';

                    return `
                        <tr>
                            <td><strong>${v.color_name}</strong></td>
                            <td>${v.price ? 'â‚¹' + v.price : '<span class="text-muted">Uses base price</span>'}</td>
                            <td>${v.stock}</td>
                            <td>${imagePreview} ${imageCount > 1 ? `(+${imageCount - 1} more)` : ''}</td>
                            <td>
                                <button class="btn btn-sm btn-danger" onclick="deleteVariant(${v.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (e) {
                console.error('Load variants error:', e);
            }
        
}

async function loadUserOrders(...args) {

            if (!currentUser) {
                navigateTo('login');
                return;
            }

            const container = document.getElementById('ordersContainer');
            if (!container) return;

            container.innerHTML = '<div class="text-center py-5"><div class="spinner-border"></div><p>Loading orders...</p></div>';

            try {
                const res = await fetch(`${API_BASE}/orders/user`);
                const data = await res.json();
                const orders = data.orders || [];

                if (orders.length === 0) {
                    container.innerHTML = `
                        <div class="checkout-card text-center">
                            <i class="bi bi-bag-x display-4 text-muted"></i>
                            <p class="lead mt-3">No orders yet</p>
                            <button class="btn btn-dark" onclick="navigateTo('shop')">Start Shopping</button>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = orders.map(order => `
                    <div class="checkout-card mb-3">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h5>Order #${order.id}</h5>
                                <p class="text-muted mb-1">${new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <div class="col-md-3">
                                <p class="mb-1"><strong>â‚¹${order.total}</strong></p>
                                <span class="status-badge status-${order.status.toLowerCase().replace(/\s+/g, '')}">${order.status}</span>
                            </div>
                            <div class="col-md-3 text-end">
                                <button class="btn btn-sm btn-dark" onclick="viewOrderDetail('${order.id}')">View Details</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } catch (e) {
                console.error('Load orders error:', e);
                container.innerHTML = '<div class="alert alert-danger">Error loading orders</div>';
            }
        
}

function loadUserProfile(...args) {

            const layout = document.getElementById('accountLayout');
            const prompt = document.getElementById('accountLoginPrompt');
            const heroBanner = document.getElementById('accountHeroBanner');
        
            // 1. If not logged in, show the login prompt and hide the layout
            if (!currentUser) {
                if (layout) layout.style.display = 'none';
                if (heroBanner) heroBanner.style.display = 'none';
                if (prompt) prompt.style.display = 'block';
                return;
            }

            // 2. Hide prompt, show layout
            if (layout) layout.style.display = 'grid';
            if (heroBanner) heroBanner.style.display = 'flex';
            if (prompt) prompt.style.display = 'none';
        
            // 3. Fallback for missing name
            const displayName = currentUser.name && currentUser.name.trim() !== "" 
                ? currentUser.name 
                : (currentUser.email ? currentUser.email.split('@')[0] : 'User');
        
            // 4. Update DOM Elements
            const bannerName = document.getElementById('accountBannerName');
            if (bannerName) bannerName.textContent = displayName;

            const memberSince = document.getElementById('accountMemberSince');
            if (memberSince && currentUser.created_at) {
                memberSince.textContent = new Date(currentUser.created_at).getFullYear();
            }
        
            const sidebarName = document.getElementById('accountSidebarName');
            if (sidebarName) sidebarName.textContent = displayName;

            const sidebarEmail = document.getElementById('accountSidebarEmail');
            if (sidebarEmail) sidebarEmail.textContent = currentUser.email || 'No email provided';
        
            const avatarCircle = document.getElementById('accountAvatarCircle');
            if (avatarCircle) avatarCircle.textContent = displayName.charAt(0).toUpperCase();
        
            // 5. Update Profile Form Inputs
            const profileName = document.getElementById('profileName');
            if (profileName) profileName.value = currentUser.name || '';

            const profileEmail = document.getElementById('profileEmail');
            if (profileEmail) profileEmail.value = currentUser.email || '';

            const profilePhone = document.getElementById('profilePhone');
            if (profilePhone) profilePhone.value = currentUser.phone || '';
        
            // 6. Hide any login modals
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.classList.remove('active');
        
            // 7. Load default tab
            switchAccountTab('orders');
        
}

function logoutModifier(...args) {

            navigateTo('home');
            showToast('Logged out of modifier panel', 'info');
        
}

function navigateTo(...args) {

            console.log('ðŸ” Navigating to:', page, 'with params:', params);
        
            try {
                const nav = document.getElementById('navbar');
                nav.classList.remove('on-hero');
                nav.classList.add('scrolled');
            
                const pages = document.querySelectorAll('.page');
                pages.forEach(p => {
                    p.classList.remove('active', 'visible');
                });
            
                if (page === 'modifier') {   // âœ… fixed: was `pageName`
                    fetch('/api/team/verify', { credentials: 'include' })
                        .then(r => r.json())
                        .then(data => {
                            if (data.authenticated) {
                                document.querySelectorAll('.page').forEach(p => { p.classList.remove('active', 'visible'); p.style.display = 'none'; });
                                const modPage = document.getElementById('page-modifier');
                                if (modPage) {
                                    modPage.classList.add('active');
                                    modPage.style.display = 'block';
                                    setTimeout(() => modPage.classList.add('visible'), 50);
                                }
                                window.scrollTo(0, 0);
                            } else {
                                openModifierLogin();
                            }
                        })
                        .catch(() => openModifierLogin());
                    return;
                }
            
                const targetPage = document.getElementById('page-' + page);
                if (targetPage) {
                    targetPage.classList.add('active');
                    setTimeout(() => {
                        targetPage.classList.add('visible');
                    }, 10);
                
                    let url = getUrlForPage(page, params);
                    window.history.pushState({ page: page, params: params }, '', url);
                
                    window.scrollTo(0, 0);
                    loadPageContent(page, params);
                } else {
                    console.error('âŒ Page not found:', 'page-' + page);
                    if (page !== 'home') navigateTo('home');   // âœ… guard against recursive loop
                }
            } catch (error) {
                console.error('âŒ Navigation error:', error);
                if (page !== 'home') navigateTo('home');       // âœ… guard against recursive loop
            }
        
}

function navigateWithoutPush(...args) {

            console.log('ðŸ”„ Navigating without push:', page, params);

            const nav = document.getElementById('navbar');
            nav.classList.remove('on-hero');
            nav.classList.add('scrolled');

            const pages = document.querySelectorAll('.page');
            pages.forEach(p => p.classList.remove('active', 'visible'));

            const targetPage = document.getElementById('page-' + page);
            if (targetPage) {
                targetPage.classList.add('active');
                setTimeout(() => targetPage.classList.add('visible'), 10);
                window.scrollTo(0, 0);
                loadPageContent(page, params);
            } else {
                navigateTo('home');
            }
        
}

function openCart(...args) {

            const drawer = document.getElementById('cartDrawer');
            const overlay = document.getElementById('cartOverlay');
            if (drawer) drawer.classList.add('active');
            if (overlay) overlay.classList.add('active');
            loadCart(); // Reload cart when opening
        
}

function openModifierLogin(...args) {

            const modal = document.getElementById('modifierLoginModal');
            if (modal) { modal.style.display = 'flex'; }
            setTimeout(() => document.getElementById('modifierUsername')?.focus(), 100);
        
}

function parseRoute(...args) {

            const path = window.location.pathname;
            const hash = window.location.hash.replace('#', '');

            console.log('ðŸ“ Parsing route:', path, 'hash:', hash);

            // Handle hash-based routing (backward compatibility)
            if (hash) {
                const hashPage = hash.split('/')[0];
                if (hashPage) {
                    return { page: hashPage, params: {} };
                }
            }

            // Handle path-based routing
            if (path === '/' || path === '') {
                return { page: 'home', params: {} };
            }

            // Remove leading slash
            const cleanPath = path.substring(1);

            // Check for product page
            if (cleanPath.startsWith('product/')) {
                const productId = cleanPath.split('/')[1];
                return { page: 'product', params: { id: productId } };
            }

            // Check for exact matches
            const routeMap = {
                'shop': 'shop',
                'new-arrivals': 'new',
                'about': 'about',
                'account': 'account',
                'orders': 'orders',
                'login': 'login',
                'signup': 'signup',
                'cart': 'cart',
                'checkout': 'checkout',
                'admin': 'admin'
            };

            if (routeMap[cleanPath]) {
                return { page: routeMap[cleanPath], params: {} };
            }

            // Default to home
            return { page: 'home', params: {} };
        
}

async function performSearch(...args) {

            const searchInput = document.getElementById('searchInput');
            const searchQuery = searchInput.value.trim();

            if (!searchQuery) {
                alert('Please enter a search term');
                return;
            }

            const resultsContainer = document.getElementById('searchResults');
            resultsContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Searching...</div>';

            try {
                const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(searchQuery)}`);
                if (!res.ok) throw new Error('Search failed');

                const products = await res.json();

                if (products.length === 0) {
                    resultsContainer.innerHTML = '<p class="text-center text-gray-600 py-4">No products found</p>';
                    return;
                }

                resultsContainer.innerHTML = products.map(p => `
                    <div class="flex items-center gap-4 p-4 hover:bg-gray-100 cursor-pointer transition-colors" onclick="toggleSearch(); viewProduct(${p.id});">
                        <img src="${getProductImage(p)}" alt="${p.name}" class="w-16 h-16 object-cover rounded" onerror="this.src='${getPlaceholderImage()}'">
                        <div class="flex-1">
                            <h4 class="font-medium">${p.name}</h4>
                            <p class="text-sm text-gray-600">${p.category || ''}</p>
                        </div>
                        <span class="font-bold">â‚¹${p.price}</span>
                    </div>
                `).join('');

                console.log(`âœ… Search found ${products.length} products`);
            } catch (e) {
                console.error('Search error:', e);
                resultsContainer.innerHTML = '<p class="text-center text-red-600 py-4">Search failed. Please try again.</p>';
            }
        
}

function previewLiveChanges(...args) {

            window.open('/', '_blank');
        
}

function publishAllChanges(...args) {

            const btn = document.getElementById('modifierPublishBtn');
            if (btn) { btn.textContent = 'PUBLISHING...'; btn.style.background = '#16a34a'; }
            setTimeout(() => {
                showToast('All changes published to live site', 'success');
                if (btn) { btn.textContent = 'PUBLISHED âœ“'; }
                setTimeout(() => { if (btn) btn.textContent = 'PUBLISH CHANGES'; }, 3000);
            }, 1500);
        
}

function removeMarqueeItem(btn) {

            btn.closest('div').remove();
            showModifierUnsaved();
        
}

function requestPasswordChange(...args) {

            showToast('Password reset OTP will be sent to your email', 'info');
        
}

function resetHeroImage(...args) {

            const heroSection = document.querySelector('.hero-section');
            if (heroSection) heroSection.style.backgroundImage = "url('https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1920&q=85')";
            showToast('Hero image reset to default', 'info');
            showModifierUnsaved();
        
}

function resetModifierSection(...args) {

            showToast('Reset to defaults', 'info');
        
}

async function saveCoupon(...args) {

            const codeInput = document.getElementById('couponCodeInput');
            const typeInput = document.getElementById('couponType');
            const valueInput = document.getElementById('couponValue');
            const minOrderInput = document.getElementById('couponMinOrder');
            const maxUsesInput = document.getElementById('couponMaxUses');
            const validUntilInput = document.getElementById('couponValidUntil');

            if (!codeInput || !typeInput || !valueInput) {
                alert('Form elements not found. Please refresh the page.');
                return;
            }

            const code = codeInput.value.trim().toUpperCase();
            const type = typeInput.value;
            const value = valueInput.value;
            const minOrder = minOrderInput ? minOrderInput.value : 0;
            const maxUses = maxUsesInput ? maxUsesInput.value : 100;
            const validUntil = validUntilInput ? validUntilInput.value : null;

            if (!code || !type || !value) {
                alert('Please fill all required fields');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/admin/coupons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: code,
                        type: type,
                        value: parseInt(value),
                        min_subtotal: parseInt(minOrder),  // âœ… Fixed field name
                        max_uses: parseInt(maxUses),
                        expiry: validUntil || null,  // âœ… Fixed field name
                        active: true
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('âœ… Coupon added successfully!');
                    cancelCouponForm();
                    await loadAdminCoupons();
                } else {
                    alert('âŒ ' + (data.error || 'Error adding coupon'));
                }
            } catch (e) {
                console.error('Save coupon error:', e);
                alert('âŒ Error saving coupon: ' + e.message);
            }
        
}

async function saveMaintenanceSettings(...args) {

            const settings = {
                enabled: document.getElementById('maintenanceToggle').checked,
                message: document.getElementById('maintenanceMsg').value.trim(),
                endsAt: document.getElementById('maintenanceEndsInput').value || null
            };

            try {
                const res = await fetch(`${API_BASE}/admin/maintenance`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                });

                if (res.ok) {
                    alert('âœ… Settings saved successfully!');
                    loadMaintenanceSettings();
                } else {
                    alert('âŒ Failed to save settings');
                }
            } catch (err) {
                console.error('Maintenance save error:', err);
                alert('âŒ Error saving settings');
            }
        
}

function saveModifierSection(...args) {

            const settings = collectModifierSettings(section);
            fetch('/api/modifier/save', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, settings })
            }).then(r => r.json()).then(() => {
                showToast(section.charAt(0).toUpperCase() + section.slice(1) + ' settings saved', 'success');
                const badge = document.getElementById('modifierUnsavedBadge');
                if (badge) badge.style.display = 'none';
            }).catch(() => {
                // Save to localStorage as fallback
                localStorage.setItem('adrta_modifier_' + section, JSON.stringify(settings));
                showToast('Saved locally (sync pending)', 'info');
            });
        
}

async function saveProduct(...args) {

            // 1. Gather all basic fields
            const name = document.getElementById('productName').value.trim();
            const category = document.getElementById('productCategory').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const mrp = parseFloat(document.getElementById('productMRP').value) || null;
            const stock = parseInt(document.getElementById('productStock').value);
            const description = document.getElementById('productDescription').value.trim();
            const isNew = document.getElementById('productIsNew').checked;

            // Get selected sizes
            const selectedSizes = Array.from(document.querySelectorAll('.size-checkbox:checked'))
                .map(cb => cb.value);

            // Validation
            if (!name) {
                alert('Please enter a product name');
                return;
            }
            if (!price || price <= 0) {
                alert('Please enter a valid price');
                return;
            }
            if (mrp && mrp < price) {
                alert('MRP cannot be less than selling price');
                return;
            }
            if (stock === undefined || stock < 0) {
                alert('Please enter a valid stock quantity');
                return;
            }
            if (selectedSizes.length === 0) {
                alert('Please select at least one size');
                return;
            }

            // For new products, at least one image is required
            // For editing, images are optional (keep existing)
            if (!editingProductId && selectedProductImages.length === 0) {
                alert('Please upload at least one product image');
                return;
            }

            try {
                const payload = {
                    name,
                    category,
                    original_price: mrp,
                    price,
                    mrp: mrp,
                    stock,
                    description,
                    is_new: isNew,
                    available_sizes: JSON.stringify(selectedSizes)
                };

                // Handle images
                if (selectedProductImages.length > 0) {
                    // New images uploaded
                    payload.images = selectedProductImages;
                } else if (editingProductId && window.existingProductImages) {
                    // Keep existing images when editing
                    try {
                        const existingImages = JSON.parse(window.existingProductImages);
                        payload.images = existingImages;
                    } catch (e) {
                        payload.images = [window.existingProductImages];
                    }
                }

                const url = editingProductId
                    ? `${API_BASE}/admin/products/${editingProductId}`
                    : `${API_BASE}/admin/products`;
                const method = editingProductId ? 'PUT' : 'POST';

                console.log(`ðŸ“¦ Saving product with ${payload.images ? payload.images.length : 0} images and sizes:`, selectedSizes);

                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (res.ok) {
                    const isNewProduct = !editingProductId;
                    const productId = data.product_id || editingProductId;

                    if (isNewProduct) {
                        alert('âœ… Product added successfully!');
                        currentProductIdForVariants = productId;
                        loadProductVariants(productId);
                        editingProductId = productId;
                        const formTitle = document.getElementById('productFormTitle');
                        if (formTitle) {
                            formTitle.textContent = 'Product Created - Add Variants (Optional)';
                        }
                    } else {
                        alert('âœ… Product updated successfully!');
                        if (productId) {
                            loadProductVariants(productId);
                        }
                    }

                    loadAdminProducts();

                } else {
                    console.error('Save product error:', data);
                    alert(data.error || 'Error saving product');
                }
            } catch (e) {
                console.error('Save product error:', e);
                alert('Error saving product: ' + e.message);
            }
        
}

function saveProfile(...args) {

            const name = document.getElementById('profileName')?.value;
            const phone = document.getElementById('profilePhone')?.value;
            fetch('/api/user/profile', {
                method: 'PUT',
                credentials: 'include',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ name, phone })
            }).then(r => r.json()).then(d => {
                showToast(d.message || 'Profile updated', 'success');
            }).catch(() => showToast('Could not save profile', 'error'));
        
}

 async function saveVariant(...args) {

            if (!currentProductIdForVariants) {
                alert('Please save the product first before adding variants');
                return;
            }

            const colorName = document.getElementById('variantColorName').value.trim();
            const price = document.getElementById('variantPrice').value || null;
            const stock = parseInt(document.getElementById('variantStock').value) || 0;

            if (!colorName) {
                alert('Please enter a color name');
                return;
            }

            // âœ… CRITICAL FIX: Ensure images array is properly formatted
            if (variantImages.length === 0) {
                if (!confirm('No images uploaded for this variant. Continue anyway?')) {
                    return;
                }
            }

            try {
                console.log(`ðŸ“¦ Saving variant with ${variantImages.length} images...`);

                const res = await fetch(`${API_BASE}/admin/products/${currentProductIdForVariants}/variants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        color_name: colorName,
                        price: price ? parseInt(price) : null,
                        stock: stock,
                        images: variantImages // âœ… Array of base64 strings
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('âœ… Variant added successfully!');
                    cancelAddVariant();
                    loadProductVariants(currentProductIdForVariants);
                } else {
                    alert('âŒ ' + (data.error || 'Failed to add variant'));
                }
            } catch (e) {
                console.error('Save variant error:', e);
                alert('Error saving variant: ' + e.message);
            }
        
}

function setHeroAlign(...args) {

            const heroContent = document.querySelector('.hero-section > div');
            if (!heroContent) return;
            if (align === 'left') { heroContent.style.justifyContent = 'flex-start'; heroContent.style.alignItems = 'flex-end'; }
            if (align === 'center') { heroContent.style.justifyContent = 'center'; }
            if (align === 'right') { heroContent.style.justifyContent = 'flex-end'; }
            showModifierUnsaved();
        
}

function setMarqueeSep(...args) {

            showModifierUnsaved();
            showToast('Separator set to "' + sep + '"', 'info');
        
}

function shareProduct(...args) {

            const shareUrl = getShareableLink('product', { id: productId });
            const shareText = `Check out ${productName} on ADRTA!`;

            // Check if Web Share API is available (mobile)
            if (navigator.share) {
                navigator.share({
                    title: productName,
                    text: shareText,
                    url: shareUrl
                }).then(() => {
                    console.log('âœ… Share successful');
                }).catch(err => {
                    console.log('âŒ Share cancelled or failed:', err);
                    showShareModal(shareUrl, productName);
                });
            } else {
                // Desktop: Show share modal
                showShareModal(shareUrl, productName);
            }
        
}

function showAddAddressForm(...args) {

            showToast('Address form â€” coming in next update', 'info');
        
}

function showAddCouponForm(...args) {

            const form = document.getElementById('addCouponForm');
            if (form) {
                form.style.display = 'block';

                // Reset all fields
                const codeInput = document.getElementById('couponCodeInput');
                const typeInput = document.getElementById('couponType');
                const valueInput = document.getElementById('couponValue');
                const minOrderInput = document.getElementById('couponMinOrder');
                const maxUsesInput = document.getElementById('couponMaxUses');
                const validUntilInput = document.getElementById('couponValidUntil');

                if (codeInput) codeInput.value = '';
                if (typeInput) typeInput.value = 'percentage';
                if (valueInput) valueInput.value = '';
                if (minOrderInput) minOrderInput.value = '0';
                if (maxUsesInput) maxUsesInput.value = '100';
                if (validUntilInput) validUntilInput.value = '';

                // Scroll to form
                setTimeout(() => {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        
}

function showAddProductForm(...args) {

            console.log('ðŸ†• Opening Add Product Form');
            editingProductId = null;

            const form = document.getElementById('productForm');
            if (form) form.reset();

            const preview = document.getElementById('productImagePreview');
            if (preview) preview.innerHTML = '';

            const existingImage = document.getElementById('existingProductImages');
            if (existingImage) existingImage.value = '';

            const title = document.getElementById('productFormTitle');
            if (title) title.textContent = 'Add New Product';

            selectedProductImages = [];
            document.querySelectorAll('.size-checkbox').forEach(cb => cb.checked = false);

            const formContainer = document.getElementById('addProductForm');
            if (formContainer) {
                formContainer.style.display = 'block';
                setTimeout(() => formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }

            const variantMgmt = document.getElementById('variantManagement');
            if (variantMgmt) variantMgmt.style.display = 'none';

            // Reset button text
            const saveBtn = document.querySelector('#productForm .btn-primary');
            if (saveBtn) saveBtn.textContent = 'Save Product';
        
}

function showAddVariantForm(...args) {

            const form = document.getElementById('addVariantForm');
            if (form) {
                form.style.display = 'block';

                // Setup image preview if not already done
                setupVariantImagePreview();
            }
        
}

function showAdminTab(...args) {

            console.log('ðŸ“Š Switching to admin tab:', tabName);

    // Hide all tab contents
            document.querySelectorAll('.admin-tab-content').forEach(tab => {
                tab.style.display = 'none';
            });

    // Remove active class from all buttons
            document.querySelectorAll('.admin-tab-btn').forEach(btn => {
                btn.classList.remove('bg-white/20');
            });

    // Show selected tab
            const targetId = 'admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
            const targetTab = document.getElementById(targetId);

            if (targetTab) {
                targetTab.style.display = 'block';
            } else {
                console.error('âŒ Admin tab not found:', targetId);
            }

    // Highlight active button
            const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeBtn) {
                activeBtn.classList.add('bg-white/20');
            }

    // Load data for specific tabs
            if (tabName === 'orders') {
                loadAdminOrders();
            } else if (tabName === 'products') {
                loadAdminProducts();
            } else if (tabName === 'users') {
                loadAdminUsers();
            } else if (tabName === 'coupons') {
                loadAdminCoupons();
            } else if (tabName === 'maintenance') {
                loadMaintenanceSettings();
            }
        
}

function showModifierUnsaved(...args) {

            const badge = document.getElementById('modifierUnsavedBadge');
            if (badge) badge.style.display = 'block';
        
}

function showShareModal(url, productName) {

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">Share ${productName}</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-black">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div class="mb-4">
                        <input type="text" value="${url}" readonly
                            class="w-full p-3 border rounded-lg bg-gray-50 text-sm"
                            id="shareUrlInput">
                    </div>

                    <div class="flex gap-2 mb-4">
                        <button onclick="copyShareableLink('product', {id: '${productName.split(' ')[0]}'}); this.closest('.fixed').remove();"
                            class="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                            Copy Link
                        </button>
                        <a href="https://wa.me/?text=${encodeURIComponent(url)}" target="_blank"
                            class="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-center">
                            WhatsApp
                        </a>
                    </div>

                    <div class="flex gap-2">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank"
                            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center text-sm">
                            Facebook
                        </a>
                        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(productName)}" target="_blank"
                            class="flex-1 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition text-center text-sm">
                            Twitter
                        </a>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        
}

function showToast(...args) {

            // Remove any existing toasts
            const existingToasts = document.querySelectorAll('.quick-toast');
            existingToasts.forEach(toast => toast.remove());

            // Create new toast
            const toast = document.createElement('div');
            toast.className = `quick-toast ${type}`;
            toast.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-weight: 500;
                animation: slideInRight 0.3s ease;
                max-width: 300px;
            `;
            toast.textContent = message;

            // Add animation keyframes if not already added
            if (!document.getElementById('toastAnimations')) {
                const style = document.createElement('style');
                style.id = 'toastAnimations';
                style.textContent = `
                    @keyframes slideInRight {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    @keyframes slideOutRight {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(toast);

            // Auto remove after 3 seconds
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        
}

function startAutoSlide(...args) {

            stopAutoSlide();
            if (carouselImages.length > 1) {
                autoSlideInterval = setInterval(() => {
                    changeSlide(1);
                }, 5000);
            }
        
}

function stopAutoSlide(...args) {

            if (autoSlideInterval) {
                clearInterval(autoSlideInterval);
                autoSlideInterval = null;
            }
        
}

function submitModifierLogin(...args) {

            const username = document.getElementById('modifierUsername')?.value?.trim();
            const password = document.getElementById('modifierPassword')?.value?.trim();
            const errEl = document.getElementById('modifierLoginError');
            const btn = document.getElementById('modifierLoginBtn');

            if (!username || !password) {
                if (errEl) { errEl.textContent = 'Please enter credentials'; errEl.style.display = 'block'; }
                return;
            }

            if (btn) { btn.textContent = 'VERIFYING...'; btn.disabled = true; }

            fetch('/api/team/login', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            }).then(r => r.json()).then(data => {
                if (data.success) {
                    closeModifierLogin();
                    showToast('Welcome to Modifier Panel', 'success');
                    navigateTo('modifier');
                } else {
                    if (errEl) { errEl.textContent = data.message || 'Invalid credentials'; errEl.style.display = 'block'; }
                    if (btn) { btn.textContent = 'ACCESS PANEL'; btn.disabled = false; }
                }
            }).catch(() => {
                if (errEl) { errEl.textContent = 'Connection error. Try again.'; errEl.style.display = 'block'; }
                if (btn) { btn.textContent = 'ACCESS PANEL'; btn.disabled = false; }
            });
        
}

function switchAccountTab(...args) {

            // Hide all tabs
            document.querySelectorAll('.account-content-tab').forEach(t => t.style.display = 'none');
            // Show selected
            const el = document.getElementById('accountTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
            if (el) { el.style.display = 'block'; }

            // Update sidebar buttons
            if (btnEl) {
                document.querySelectorAll('.account-tab-btn').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = '#333';
                    b.style.borderLeft = 'none';
                });
                btnEl.style.background = '#000';
                btnEl.style.color = '#fff';
            }

            // Lazy-load data
            if (tab === 'orders') loadAccountOrders();
            if (tab === 'addresses') loadAccountAddresses();
            if (tab === 'profile') loadAccountProfile();
        
}

function switchModifierTab(tab, event) {

            document.querySelectorAll('.modifier-tab-content').forEach(t => t.style.display = 'none');
            const el = document.getElementById('modTab-' + tab);
            if (el) el.style.display = 'block';

            document.querySelectorAll('.modifier-nav-btn').forEach(b => {
                b.classList.remove('active-mod');
                b.style.background = 'transparent';
                b.style.color = '#666';
                b.style.borderLeft = '2px solid transparent';
            });
            event.currentTarget.classList.add('active-mod');
            event.currentTarget.style.background = '#1a1a1a';
            event.currentTarget.style.color = '#fff';
            event.currentTarget.style.borderLeft = '2px solid #fff';
        
}

function toggleMobileMenu(...args) {

            const menu = document.getElementById('mobileMenu');
            if (menu) {
                menu.classList.toggle('active');
            }
        
}

function toggleNotifPref(...args) {

            console.log('Notification pref:', type, val);
        
}

function toggleSearch(...args) {

            const modal = document.getElementById('searchModal');
            if (modal) {
                modal.classList.toggle('active');
                if (modal.classList.contains('active')) {
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) searchInput.focus();
                }
            }
        
}

function updateCarouselPosition(...args) {

            const track = document.getElementById('carouselTrack');
            if (track && carouselImages.length > 0) {
                track.style.transform = `translateX(-${currentSlideIndex * (100 / carouselImages.length)}%)`;
            }

            document.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
                if (idx === currentSlideIndex) {
                    dot.classList.remove('bg-white/50', 'w-2.5');
                    dot.classList.add('bg-white', 'w-8');
                } else {
                    dot.classList.remove('bg-white', 'w-8');
                    dot.classList.add('bg-white/50', 'w-2.5');
                }
            });
        
}

function updateHeroBlur(...args) {

            document.getElementById('modHeroBlurVal').textContent = val + 'px';
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) heroSection.style.backdropFilter = `blur(${val}px)`;
            showModifierUnsaved();
        
}

function updateHeroFont(...args) {

            const title = document.querySelector('.hero-title');
            if (title) title.style.fontFamily = val;
            showModifierUnsaved();
        
}

function updateHeroOverlay(...args) {

            document.getElementById('modHeroOverlayVal').textContent = val + '%';
            showModifierUnsaved();
        
}

function updateHeroPosition(...args) {
 showModifierUnsaved(); 
}

function updateHeroSize(...args) {

            document.getElementById('modHeroSizeVal').textContent = val + '%';
            const title = document.querySelector('.hero-title');
            if (title) title.style.fontSize = `clamp(3rem, ${val * 0.14}vw, ${val * 0.15}rem)`;
            showModifierUnsaved();
        
}

function updateMaintenancePreview(...args) {

            const isEnabled = document.getElementById('maintenanceToggle').checked;
            document.getElementById('maintenanceSettings').style.display = isEnabled ? 'block' : 'none';
        
}

function updateMarqueeBg(...args) {

            document.getElementById('modMarqueeBgHex').value = val;
            const marquee = document.querySelector('.marquee');
            if (marquee) marquee.style.background = val;
            showModifierUnsaved();
        
}

function updateMarqueeSpeed(...args) {

            document.getElementById('modMarqueeSpeedVal').textContent = val + 's';
            const marqueeContent = document.querySelector('.marquee-content');
            if (marqueeContent) marqueeContent.style.animationDuration = val + 's';
            showModifierUnsaved();
        
}

function updateMarqueeText(...args) {

            document.getElementById('modMarqueeTextHex').value = val;
            document.querySelectorAll('.marquee-content span').forEach(s => s.style.color = val);
            showModifierUnsaved();
        
}

async function updateOrderStatus(...args) {

            const orderStatus = document.getElementById('updateOrderStatus').value;
            const paymentStatus = document.getElementById('updatePaymentStatus').value;
            const trackingId = document.getElementById('updateTrackingId').value;

            try {
                const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_status: orderStatus,
                        payment_status: paymentStatus,
                        tracking_id: trackingId || null
                    })
                });

                if (res.ok) {
                    alert('Order updated successfully!');
                    bootstrap.Modal.getInstance(document.getElementById('orderDetailModal')).hide();
                    loadAdminOrders();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to update order');
                }
            } catch (e) {
                console.error('Update order error:', e);
                alert('Error updating order');
            }
        
}

async function updateProfile(...args) {

            const name = document.getElementById('profileName').value;
            const phone = document.getElementById('profilePhone').value;
            const address = document.getElementById('profileAddress').value;

            try {
                const res = await fetch(`${API_BASE}/user/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, address })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('âœ… Profile updated successfully!');
                    await loadCurrentUser();
                } else {
                    alert('âŒ ' + (data.error || 'Failed to update profile'));
                }
            } catch (e) {
                console.error('Update profile error:', e);
                alert('âŒ Failed to update profile');
            }
        
}

async function viewAdminOrderDetail(...args) {

            try {
                const res = await fetch(`${API_BASE}/admin/orders/${orderId}`);

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `HTTP ${res.status}`);
                }

                const order = await res.json();

                const itemsHTML = (order.items || []).map(item => `
                    <tr>
                        <td>${item.product_name || 'Unknown'}</td>
                        <td>${item.variant_info || '-'}</td>
                        <td>${item.selected_size || 'N/A'}</td>
                        <td>${item.quantity || 0}</td>
                        <td>â‚¹${item.unit_price || 0}</td>
                        <td><strong>â‚¹${item.total_price || 0}</strong></td>
                    </tr>
                `).join('');

                const detailHTML = `
                    <div class="modal fade show" id="orderDetailModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5); position: fixed; inset: 0; z-index: 9999;">
                        <div class="modal-dialog modal-lg" style="max-width: 900px; margin: 2rem auto;">
                            <div class="modal-content" style="background: white; border-radius: 8px; max-height: 90vh; overflow-y: auto;">
                                <div class="modal-header" style="padding: 1.5rem; border-bottom: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center;">
                                    <h5 class="modal-title" style="font-size: 1.5rem; font-weight: bold; margin: 0;">Order #${order.id}</h5>
                                    <button type="button" class="btn-close" onclick="closeOrderModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0.5rem;">&times;</button>
                                </div>
                                <div class="modal-body" style="padding: 1.5rem;">
                                    <div class="row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                                        <div>
                                            <h6 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 1rem;">Customer Information</h6>
                                            <p style="margin: 0.5rem 0;"><strong>Name:</strong> ${order.customer_name || 'N/A'}</p>
                                            <p style="margin: 0.5rem 0;"><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
                                            <p style="margin: 0.5rem 0;"><strong>Email:</strong> ${order.email || 'N/A'}</p>
                                            <p style="margin: 0.5rem 0;"><strong>Address:</strong> ${order.address || 'N/A'}</p>
                                            ${order.user_info ? `
                                                <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #e5e5e5;">
                                                <h6 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 1rem;">Registered User Details</h6>
                                                <p style="margin: 0.5rem 0;"><strong>User ID:</strong> ${order.user_info.id}</p>
                                                <p style="margin: 0.5rem 0;"><strong>Verified:</strong> ${order.user_info.is_verified ? 'Yes âœ“' : 'No'}</p>
                                                <p style="margin: 0.5rem 0;"><strong>Registered:</strong> ${new Date(order.user_info.registered_at).toLocaleDateString()}</p>
                                            ` : '<p class="text-muted" style="color: #666;">Guest checkout</p>'}
                                        </div>
                                        <div>
                                            <h6 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 1rem;">Order Details</h6>
                                            <p style="margin: 0.5rem 0;"><strong>Order Status:</strong> <span class="status-badge status-${(order.order_status || '').toLowerCase().replace(/\s+/g, '')}">${order.order_status || 'pending'}</span></p>
                                            <p style="margin: 0.5rem 0;"><strong>Payment Method:</strong> ${order.payment_method || 'N/A'}</p>
                                            <p style="margin: 0.5rem 0;"><strong>Payment Status:</strong> <span class="badge bg-${order.payment_status === 'completed' ? 'success' : 'warning'}" style="padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">${order.payment_status || 'pending'}</span></p>
                                            ${order.payment_reference ? `<p style="margin: 0.5rem 0;"><strong>Payment Ref:</strong> ${order.payment_reference}</p>` : ''}
                                            ${order.tracking_id ? `<p style="margin: 0.5rem 0;"><strong>Tracking ID:</strong> ${order.tracking_id}</p>` : ''}
                                            <p style="margin: 0.5rem 0;"><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>

                                            <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #e5e5e5;">
                                            <h6 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 1rem;">Update Order</h6>
                                            <div class="mb-2" style="margin-bottom: 0.75rem;">
                                                <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Order Status</label>
                                                <select class="form-select form-select-sm" id="updateOrderStatus" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                                                    <option value="pending confirmation" ${order.order_status === 'pending confirmation' ? 'selected' : ''}>Pending Confirmation</option>
                                                    <option value="confirmed" ${order.order_status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                                    <option value="packed" ${order.order_status === 'packed' ? 'selected' : ''}>Packed</option>
                                                    <option value="shipped" ${order.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                                    <option value="delivered" ${order.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                                    <option value="cancelled" ${order.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                                </select>
                                            </div>
                                            <div class="mb-2" style="margin-bottom: 0.75rem;">
                                                <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Payment Status</label>
                                                <select class="form-select form-select-sm" id="updatePaymentStatus" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                                                    <option value="pending" ${order.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
                                                    <option value="completed" ${order.payment_status === 'completed' ? 'selected' : ''}>Completed</option>
                                                    <option value="failed" ${order.payment_status === 'failed' ? 'selected' : ''}>Failed</option>
                                                </select>
                                            </div>
                                            <div class="mb-2" style="margin-bottom: 0.75rem;">
                                                <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Tracking ID</label>
                                                <input type="text" class="form-control form-control-sm" id="updateTrackingId" value="${order.tracking_id || ''}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                                            </div>
                                            <button class="btn btn-sm btn-success w-100" onclick="updateOrderStatus('${order.id}')" style="width: 100%; padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 0.5rem;">Save Changes</button>
                                        </div>
                                    </div>
                                    <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #e5e5e5;">
                                    <h6 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 1rem;">Order Items</h6>
                                    <table class="table table-sm" style="width: 100%; border-collapse: collapse;">
                                        <thead>
                                            <tr style="border-bottom: 2px solid #e5e5e5;">
                                                <th style="padding: 0.75rem; text-align: left;">Product</th>
                                                <th style="padding: 0.75rem; text-align: left;">Variant</th>
                                                <th style="padding: 0.75rem; text-align: left;">Size</th>
                                                <th style="padding: 0.75rem; text-align: left;">Quantity</th>
                                                <th style="padding: 0.75rem; text-align: left;">Unit Price</th>
                                                <th style="padding: 0.75rem; text-align: left;">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${itemsHTML}
                                        </tbody>
                                    </table>
                                    <div style="text-align: right; margin-top: 1rem;">
                                        <p style="margin: 0.5rem 0;"><strong>Subtotal:</strong> â‚¹${order.subtotal || 0}</p>
                                        <p style="margin: 0.5rem 0;"><strong>Shipping:</strong> â‚¹${order.shipping || 0}</p>
                                        <p style="margin: 0.5rem 0;"><strong>Discount:</strong> -â‚¹${order.discount || 0}</p>
                                        <h5 style="margin-top: 1rem; font-size: 1.25rem;"><strong>Total: â‚¹${order.total_amount || 0}</strong></h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const existingModal = document.getElementById('orderDetailModal');
                if (existingModal) existingModal.remove();

                document.body.insertAdjacentHTML('beforeend', detailHTML);

            } catch (e) {
                console.error('âŒ View order detail error:', e);
                alert(`Error loading order details: ${e.message}`);
            }
        
}

async function viewOrderDetail(...args) {

            try {
                const res = await fetch(`${API_BASE}/orders/${orderId}`);

                if (!res.ok) {
                    throw new Error('Failed to load order details');
                }

                const order = await res.json();

                const itemsHTML = (order.items || []).map(item => `
                    <div class="flex items-center justify-between py-3 border-b">
                        <div>
                            <p class="font-medium">${item.product_name || 'Unknown Product'}</p>
                            ${item.variant_info ? `<p class="text-sm text-gray-600">${item.variant_info}</p>` : ''}
                            ${item.selected_size ? `<p class="text-sm text-gray-600">Size: ${item.selected_size}</p>` : ''}
                            <p class="text-sm text-gray-600">Qty: ${item.quantity || 0}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold">â‚¹${item.total_price || 0}</p>
                            <p class="text-sm text-gray-600">â‚¹${item.unit_price || 0} each</p>
                        </div>
                    </div>
                `).join('');

                const detailHTML = `
                    <div class="modal fade show" id="userOrderDetailModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5); position: fixed; inset: 0; z-index: 9999;">
                        <div class="modal-dialog modal-lg" style="max-width: 700px; margin: 2rem auto;">
                            <div class="modal-content" style="background: white; border-radius: 12px; max-height: 90vh; overflow-y: auto;">
                                <div style="padding: 1.5rem; border-bottom: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center;">
                                    <h3 style="font-size: 1.5rem; font-weight: bold; margin: 0;">Order #${order.id}</h3>
                                    <button onclick="closeUserOrderModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0.5rem;">&times;</button>
                                </div>
                                <div style="padding: 1.5rem;">
                                    <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                        <p style="margin: 0.5rem 0;"><strong>Status:</strong> <span class="status-badge status-${(order.order_status || '').toLowerCase().replace(/\s+/g, '')}">${order.order_status || 'pending'}</span></p>
                                        <p style="margin: 0.5rem 0;"><strong>Payment Status:</strong> <span style="padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.8rem; background: ${order.payment_status === 'completed' ? '#10b981' : '#f59e0b'}; color: white;">${order.payment_status || 'pending'}</span></p>
                                        <p style="margin: 0.5rem 0;"><strong>Payment Method:</strong> ${order.payment_method || 'N/A'}</p>
                                        ${order.tracking_id ? `<p style="margin: 0.5rem 0;"><strong>Tracking ID:</strong> ${order.tracking_id}</p>` : ''}
                                        <p style="margin: 0.5rem 0;"><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <h4 style="font-size: 1.1rem; font-weight: bold; margin: 1.5rem 0 1rem;">Shipping Address</h4>
                                    <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                        <p style="margin: 0.25rem 0;">${order.customer_name || 'N/A'}</p>
                                        <p style="margin: 0.25rem 0;">${order.phone || 'N/A'}</p>
                                        <p style="margin: 0.25rem 0;">${order.email || 'N/A'}</p>
                                        <p style="margin: 0.25rem 0;">${order.address || 'N/A'}</p>
                                    </div>

                                    <h4 style="font-size: 1.1rem; font-weight: bold; margin: 1.5rem 0 1rem;">Order Items</h4>
                                    <div>
                                        ${itemsHTML}
                                    </div>

                                    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid #e5e5e5;">
                                        <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                            <span>Subtotal:</span>
                                            <span class="font-bold">â‚¹${order.subtotal || 0}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                            <span>Shipping:</span>
                                            <span class="font-bold">â‚¹${order.shipping || 0}</span>
                                        </div>
                                        ${order.discount > 0 ? `
                                        <div style="display: flex; justify-content: space-between; margin: 0.5rem 0; color: #10b981;">
                                            <span>Discount:</span>
                                            <span class="font-bold">-â‚¹${order.discount}</span>
                                        </div>
                                        ` : ''}
                                        <div style="display: flex; justify-content: space-between; margin-top: 1rem; font-size: 1.25rem; font-weight: bold;">
                                            <span>Total:</span>
                                            <span>â‚¹${order.total_amount || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const existingModal = document.getElementById('userOrderDetailModal');
                if (existingModal) existingModal.remove();

                document.body.insertAdjacentHTML('beforeend', detailHTML);

            } catch (e) {
                console.error('âŒ View order detail error:', e);
                alert(`Error loading order details: ${e.message}`);
            }
        
}

// Alias for cancelProductForm (called from HTML)
function cancelProductForm(...args) {
    cancelAddProduct(...args);
}

function hideVariantManagement(...args) {
    const variantMgmt = document.getElementById('variantManagement');
    if (variantMgmt) variantMgmt.style.display = 'none';
}

function showForgotPassword(...args) {
    // Show forgot password modal or navigate to forgot password page
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.display = 'block';
        // Switch to forgot password mode if the modal supports it
        if (typeof switchAuthMode === 'function') {
            switchAuthMode('forgot');
        }
    } else {
        // If no modal, navigate to a forgot password page or show inline form
        console.log('Show forgot password form');
    }
}
