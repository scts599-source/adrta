// ==================== VIEW PRODUCT FUNCTION ====================
async function viewProduct(productId) {
    try {
        // Reset selected size globally before fetching new product data
        window.selectedProductSize = null;
        window.selectedVariant = null;

        console.log('🔍 Loading product:', productId);

        const res = await fetch(`${API_BASE}/products/${productId}`);
        if (!res.ok) throw new Error('Product not found');

        AppState.currentProduct = await res.json();

        console.log('✅ Product loaded:', AppState.currentProduct.name);

        const container = document.getElementById('productDetail');
        if (!container) {
            console.error('❌ Product detail container not found!');
            return;
        }

        // Parse sizes
        let availableSizes = [];
        const sizesData = AppState.currentProduct.available_sizes;
        if (sizesData) {
            if (Array.isArray(sizesData)) {
                availableSizes = sizesData;
            } else if (typeof sizesData === 'string') {
                try {
                    const parsed = JSON.parse(sizesData);
                    if (Array.isArray(parsed)) {
                        availableSizes = parsed;
                    }
                } catch (e) {
                    console.error('❌ Size parse failure:', e);
                }
            }
        }

        // Parse images array
        let productImages = [];
        if (AppState.currentProduct.image) {
            try {
                productImages = JSON.parse(AppState.currentProduct.image);
                if (!Array.isArray(productImages)) {
                    productImages = [AppState.currentProduct.image];
                }
            } catch (e) {
                productImages = [AppState.currentProduct.image];
            }
        }

        const mainImage = productImages.length > 0 ? productImages[0] : getPlaceholderImage();
        const totalStock = AppState.currentProduct.stock || 0;

        // ✅ PROFESSIONAL STOCK DISPLAY LOGIC
        let stockDisplay = '';
        if (totalStock > 10) {
            stockDisplay = '<span class="stock-indicator in-stock">In Stock</span>';
        } else if (totalStock > 0) {
            stockDisplay = '<span class="stock-indicator low-stock">Low Stock - Order Soon</span>';
        } else {
            stockDisplay = '<span class="stock-indicator out-of-stock">Out of Stock</span>';
        }

        // ✅ Check if product has variants
        const hasVariants = AppState.currentProduct.variants && AppState.currentProduct.variants.length > 0;

        // ✅ Build variant selector HTML
        let variantSelectorHTML = '';

        if (hasVariants) {
            variantSelectorHTML = `
                <div class="mb-6">
                    <label class="block font-medium text-lg mb-3">Select Color/Variant:</label>
                    <div class="flex gap-3 flex-wrap" id="variantSelector">
                        ${AppState.currentProduct.variants.map(variant => {
                            const variantImage = variant.images && variant.images.length > 0
                                ? variant.images[0]
                                : mainImage;

                            // ✅ CRITICAL FIX: Properly escape JSON for onclick
                            const imagesJson = JSON.stringify(variant.images || [])
                                                            .replace(/"/g, '&quot;')
                                                            .replace(/'/g, '&#39;');
                            return `
                                <button
                                    type="button"
                                    class="variant-option relative border-2 border-gray-300 rounded-lg p-2 hover:border-black transition-all duration-200 group"
                                    data-variant-id="${variant.id}"
                                    data-variant-price="${variant.price || AppState.currentProduct.price}"
                                    data-variant-stock="${variant.stock || 0}"
                                    data-variant-color="${variant.color_name}"
                                    onclick="selectVariant(${variant.id}, ${variant.price || AppState.currentProduct.price}, ${variant.stock || 0}, '${variant.color_name}', ${imagesJson})">
                                    <img src="${variantImage}"
                                         class="w-16 h-16 object-cover rounded"
                                         alt="${variant.color_name}"
                                         onerror="this.src='${getPlaceholderImage()}'">
                                    <p class="text-xs mt-1 text-center font-medium">${variant.color_name}</p>
                                    <p class="text-xs text-gray-600 text-center">₹${variant.price || AppState.currentProduct.price}</p>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // ✅ RENDER HTML WITH PROPER ENCODING
        container.innerHTML = `
            <div class="flex flex-col md:flex-row gap-0 md:gap-12">
                <!-- LEFT: Image Carousel (Full bleed on mobile) -->
                <div class="relative w-full md:w-1/2">
                    <div class="relative overflow-hidden bg-[#f5f5f5] aspect-square md:aspect-[4/5]">
                        <div id="carouselTrack" class="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" style="width:${productImages.length * 100}%;">
                            ${productImages.map((img, idx) => `
                                <div class="h-full flex-shrink-0" style="width:${100 / productImages.length}%;">
                                    <img src="${img}"
                                         alt="${AppState.currentProduct.name} - Image ${idx + 1}"
                                         class="w-full h-full object-contain p-6 md:p-10"
                                         onerror="this.src='${getPlaceholderImage()}'>
                                </div>
                            `).join('')}
                        </div>

                        ${productImages.length > 1 ? `
                            <button onclick="changeSlide(-1)" class="absolute left-2 top-1/2 -translate-y-1/2 transition-transform active:scale-95 z-10" style="background:#000; border:1px solid rgba(255,255,255,0.35); padding:0.6rem; display:flex; align-items:center; justify-content:center;">
                                <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                            </button>
                            <button onclick="changeSlide(1)" class="absolute right-2 top-1/2 -translate-y-1/2 transition-transform active:scale-95 z-10" style="background:#000; border:1px solid rgba(255,255,255,0.35); padding:0.6rem; display:flex; align-items:center; justify-content:center;">
                                <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                            </button>
                            <div class="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
                                ${productImages.map((_, idx) => `
                                    <button onclick="goToSlide(${idx})" class="carousel-dot w-2 h-2 rounded-full transition-all duration-300 ${idx === 0 ? 'bg-black w-6' : 'bg-black/30 hover:bg-black/50'}" data-slide="${idx}"></button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- RIGHT: Product Details (Sticky on Desktop) -->
                <div class="relative pt-8 md:pt-0 md:w-1/2">
                    <div class="md:sticky md:top-28 flex flex-col gap-6">
                        
                        <!-- Header -->
                        <div class="border-b border-gray-200 pb-6">
                            <p class="text-[0.65rem] tracking-widest text-gray-500 uppercase mb-3">${AppState.currentProduct.category || 'Streetwear'}</p>
                            <div class="flex items-start justify-between gap-4">
                                <h1 class="font-display text-3xl md:text-4xl tracking-wider text-gray-900 leading-tight uppercase">${AppState.currentProduct.name}</h1>
                                <button onclick="shareProduct('${productId}', '${AppState.currentProduct.name.replace(/'/g, "\\'")}')" class="p-2 text-gray-400 hover:text-black transition-colors bg-gray-50 rounded-full" title="Share">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684z"/></svg>
                                </button>
                            </div>
                            <div class="mt-4 text-2xl font-medium text-gray-900 tracking-wide" id="displayPrice">&#8377;${AppState.currentProduct.price}</div>
                        </div>

                        <!-- Description -->
                        <p class="text-sm text-gray-600 leading-relaxed">${AppState.currentProduct.description || 'HEAVYWEIGHT ARCHIVE GARMENT. CLASSIFIED SPEC.'}</p>

                        <div id="stockDisplayContainer" class="mt-2">${stockDisplay}</div>

                        ${variantSelectorHTML}

                        ${availableSizes.length > 0 ? `
                            <div id="sizeSelectionSection" class="mt-2">
                                <div class="flex justify-between items-end mb-4">
                                    <label class="text-xs font-bold tracking-widest uppercase text-gray-900">Select Size</label>
                                    <a href="#" onclick="navigateTo('size-guide'); return false;" class="text-[0.65rem] uppercase tracking-widest text-gray-500 hover:text-black transition-colors border-b border-gray-300 hover:border-black pb-0.5">Size Guide</a>
                                </div>
                                <div class="flex gap-3 flex-wrap" id="sizeSelector">
                                    ${availableSizes.map(size => `
                                        <button class="size-option w-12 h-12 flex items-center justify-center border border-gray-300 text-sm font-medium hover:border-black transition-all duration-200" data-size="${size}" onclick="selectSize('${size.replace(/'/g, "\\'")}')">
                                            ${size}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${totalStock > 0 ? `
                            <div class="flex items-center gap-6 mt-4 pdp-desktop-row">
                                <label class="text-xs font-bold tracking-widest uppercase text-gray-900">Quantity</label>
                                <div class="flex items-center border border-gray-300 h-12 w-28">
                                    <button onclick="decreaseQuantity()" class="flex-1 h-full text-gray-500 hover:text-black transition-colors">-</button>
                                    <input type="number" id="productQuantity" value="1" min="1" max="${totalStock}" class="w-10 text-center text-base font-medium border-none p-0 focus:ring-0 appearance-none bg-transparent">
                                    <button onclick="increaseQuantity()" class="flex-1 h-full text-gray-500 hover:text-black transition-colors">+</button>
                                </div>
                            </div>
                            <!-- Desktop Add to Cart + Buy Now -->
                            <div class="mt-6 pdp-desktop-row gap-3 pb-8">
                                <button onclick="addToCartWithSize(${AppState.currentProduct.id})" style="flex:1; background:#0a0a0a; color:#fff; border:1.5px solid #0a0a0a; height:3.25rem; font-family:'Space Grotesk','Inter',sans-serif; font-size:0.7rem; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; cursor:pointer; transition:background 0.2s, color 0.2s;" onmouseover="this.style.background='#fff';this.style.color='#0a0a0a'" onmouseout="this.style.background='#0a0a0a';this.style.color='#fff'">
                                    Add to Cart
                                </button>
                                <button onclick="buyNowWithSize(${AppState.currentProduct.id})" style="flex:1; background:#fff; color:#0a0a0a; border:1.5px solid #0a0a0a; height:3.25rem; font-family:'Space Grotesk','Inter',sans-serif; font-size:0.7rem; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; cursor:pointer; transition:background 0.2s, color 0.2s;" onmouseover="this.style.background='#0a0a0a';this.style.color='#fff'" onmouseout="this.style.background='#fff';this.style.color='#0a0a0a'">
                                    Buy Now
                                </button>
                            </div>
                        ` : `
                            <div class="mt-6 pb-8 pdp-desktop-block">
                                <button class="w-full bg-transparent text-gray-400 border border-gray-300 h-14 text-xs font-medium tracking-widest uppercase cursor-not-allowed" style="font-family:'Space Grotesk','Inter',sans-serif; letter-spacing:0.18em;">
                                    Out of Stock
                                </button>
                            </div>
                        `}

                        <!-- Product Details -->
                        <div style="border-top:1px solid #e8e8e8; padding-top:1.25rem; margin-top:auto;">
                            <p style="font-size:0.6rem; letter-spacing:0.2em; color:#aaa; text-transform:uppercase; margin-bottom:0.85rem; font-family:'Space Grotesk','Inter',sans-serif;">Details</p>
                            <div style="display:flex; flex-direction:column; gap:0;">
                                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0f0f0; padding:0.6rem 0;">
                                    <span style="font-size:0.78rem; color:#888;">Fabric</span>
                                    <span style="font-size:0.78rem; color:#111; font-weight:500;">Premium Heavyweight</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0f0f0; padding:0.6rem 0;">
                                    <span style="font-size:0.78rem; color:#888;">Fit</span>
                                    <span style="font-size:0.78rem; color:#111; font-weight:500;">Oversized</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0;">
                                    <span style="font-size:0.78rem; color:#888;">Build</span>
                                    <span style="font-size:0.78rem; color:#111; font-weight:500;">Durable Construction</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Sticky Bottom Bar (Only visible on mobile screens) -->
            ${totalStock > 0 ? `
            <div class="mobile-cart-bar">
                <div class="flex flex-col mcb-price">
                    <span style="font-size:0.58rem; color:#aaa; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; font-family:'Space Grotesk','Inter',sans-serif;">Price</span>
                    <span style="font-size:1.05rem; font-weight:700; color:#fff; line-height:1.1; margin-top:0.1rem; font-family:'Space Grotesk','Inter',sans-serif;">&#8377;${AppState.currentProduct.price}</span>
                </div>
                <div class="mcb-actions">
                    <button onclick="addToCartWithSize(${AppState.currentProduct.id})" style="background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,0.5); height:2.75rem; font-size:0.68rem; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; font-family:'Space Grotesk','Inter',sans-serif; cursor:pointer; transition:border-color 0.2s;">
                        Add to Cart
                    </button>
                    <button onclick="buyNowWithSize(${AppState.currentProduct.id})" style="background:#fff; color:#000; border:1.5px solid #fff; height:2.75rem; font-size:0.68rem; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; font-family:'Space Grotesk','Inter',sans-serif; cursor:pointer;">
                        Buy Now
                    </button>
                </div>
            </div>
            ` : `
            <div class="mobile-cart-bar">
                <button class="w-full cursor-not-allowed" style="background:#f0f0f0; color:#aaa; border:none; height:2.75rem; font-size:0.68rem; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; font-family:'Space Grotesk','Inter',sans-serif;">
                    Out of Stock
                </button>
            </div>
            `}
        `;

        // Load related products
        loadRelatedProducts(AppState.currentProduct.category, AppState.currentProduct.id);
        // Initialize carousel
        initCarousel(productImages);

        // Auto-select first size if available
        if (availableSizes.length > 0) {
            const firstSize = availableSizes[0];
            setTimeout(() => {
                selectSize(firstSize);
            }, 150);
        }

    } catch (e) {
        console.error('❌ View product error:', e);
        alert('Error loading product details');
    }
}

// ==================== FIXED selectVariant FUNCTION ====================

function selectVariant(variantId, price, stock, colorName, images) {
    console.log('🎨 selectVariant called:', { variantId, price, stock, colorName, images });

    // Parse images if it's a string
    let imageArray = [];
    if (typeof images === 'string') {
        try {
            imageArray = JSON.parse(images);
        } catch (e) {
            console.warn('Failed to parse images:', e);
            imageArray = [];
        }
    } else if (Array.isArray(images)) {
        imageArray = images;
    }

    // ✅ Check if clicking the same variant (deselect)
    const selectedBtn = document.querySelector(`.variant-option[data-variant-id="${variantId}"]`);
    const isAlreadySelected = selectedBtn && selectedBtn.classList.contains('selected');

    if (isAlreadySelected) {
        // ✅ DESELECT: Reset to original product
        console.log('📌 Deselecting variant, returning to original product');

        window.selectedVariant = null;

        // Remove selection styling
        document.querySelectorAll('.variant-option').forEach(btn => {
            btn.classList.remove('border-black', 'bg-gray-100', 'selected');
            btn.classList.add('border-gray-300');
        });

        // ✅ FIXED: Reset to original product values WITH PROPER HTML ENTITY
        const priceEl = document.getElementById('displayPrice');
        if (priceEl && AppState.currentProduct) {
            priceEl.innerHTML = `&#8377;${AppState.currentProduct.price}`;
        }

        // Reset stock display
        const stockContainer = document.getElementById('stockDisplayContainer');
        if (stockContainer && AppState.currentProduct) {
            let stockHTML = '';
            if (AppState.currentProduct.stock > 10) {
                stockHTML = '<span class="stock-indicator in-stock">In Stock</span>';
            } else if (AppState.currentProduct.stock > 0) {
                stockHTML = '<span class="stock-indicator low-stock">Low Stock - Order Soon</span>';
            } else {
                stockHTML = '<span class="stock-indicator out-of-stock">Out of Stock</span>';
            }
            stockContainer.innerHTML = stockHTML;
        }

        // ✅ Reset to original product images
        const mainImg = document.getElementById('mainProductImage');
        if (mainImg && AppState.currentProduct) {
            let originalImages = [];
            try {
                originalImages = JSON.parse(AppState.currentProduct.image);
                if (!Array.isArray(originalImages)) {
                    originalImages = [AppState.currentProduct.image];
                }
            } catch (e) {
                originalImages = [AppState.currentProduct.image];
            }

            if (originalImages.length > 0) {
                mainImg.src = originalImages[0];
            }

            // ✅ Rebuild thumbnail gallery with original images
            rebuildImageGallery(originalImages);
        }

        // Reset quantity input
        const qtyInput = document.getElementById('productQuantity');
        if (qtyInput && AppState.currentProduct) {
            qtyInput.max = AppState.currentProduct.stock || 0;
            if (parseInt(qtyInput.value) > AppState.currentProduct.stock) {
                qtyInput.value = AppState.currentProduct.stock > 0 ? 1 : 0;
            }
        }

        // Reset add to cart button
        const addToCartBtn = document.querySelector('button[onclick*="addToCartWithSize"]');
        if (addToCartBtn && AppState.currentProduct) {
            if (AppState.currentProduct.stock <= 0) {
                addToCartBtn.disabled = true;
                addToCartBtn.style.opacity = '0.5';
                addToCartBtn.style.cursor = 'not-allowed';
                addToCartBtn.innerHTML = 'OUT OF STOCK';
            } else {
                addToCartBtn.disabled = false;
                addToCartBtn.style.opacity = '1';
                addToCartBtn.style.cursor = 'pointer';
                addToCartBtn.innerHTML = 'ADD TO CART';
            }
        }

        return; // Exit function after deselection
    }

    // ✅ SELECT NEW VARIANT: Store selected variant globally
    window.selectedVariant = {
        id: variantId,
        price: price,
        stock: stock,
        colorName: colorName,
        images: imageArray
    };

    console.log('✅ Variant selected:', window.selectedVariant);

    // 1. Update visual selection - remove selection from all buttons
    document.querySelectorAll('.variant-option').forEach(btn => {
        btn.classList.remove('border-black', 'bg-gray-100', 'selected');
        btn.classList.add('border-gray-300');
    });

    // 2. Add selection to clicked button
    if (selectedBtn) {
        selectedBtn.classList.add('border-black', 'bg-gray-100', 'selected');
        selectedBtn.classList.remove('border-gray-300');
        console.log('✅ Button visual state updated');
    }

    // 3. ✅ FIXED: Update price display WITH PROPER HTML ENTITY
    const priceEl = document.getElementById('displayPrice');
    if (priceEl) {
        priceEl.innerHTML = `&#8377;${price}`;
        console.log('✅ Price updated to:', price);
    }

    // 4. ✅ Update stock display with professional indicator
    const stockContainer = document.getElementById('stockDisplayContainer');
    if (stockContainer) {
        let stockHTML = '';
        if (stock > 10) {
            stockHTML = '<span class="stock-indicator in-stock">In Stock</span>';
        } else if (stock > 0) {
            stockHTML = '<span class="stock-indicator low-stock">Low Stock - Order Soon</span>';
        } else {
            stockHTML = '<span class="stock-indicator out-of-stock">Out of Stock</span>';
        }
        stockContainer.innerHTML = stockHTML;
        console.log('✅ Stock updated to:', stock);
    }

    // 5. ✅ Update main image AND rebuild gallery
    if (imageArray && imageArray.length > 0) {
        const mainImg = document.getElementById('mainProductImage');
        if (mainImg) {
            mainImg.src = imageArray[0];
            console.log('✅ Main image updated');
        }

        // ✅ Rebuild thumbnail gallery with variant images
        rebuildImageGallery(imageArray);
    }

    // 6. Update quantity input max value
    const qtyInput = document.getElementById('productQuantity');
    if (qtyInput) {
        qtyInput.max = stock;
        if (parseInt(qtyInput.value) > stock) {
            qtyInput.value = stock > 0 ? 1 : 0;
        }
        console.log('✅ Quantity input updated');
    }

    // 7. Disable/Enable add to cart button based on stock
    const addToCartBtn = document.querySelector('button[onclick*="addToCartWithSize"]');
    if (addToCartBtn) {
        if (stock <= 0) {
            addToCartBtn.disabled = true;
            addToCartBtn.style.opacity = '0.5';
            addToCartBtn.style.cursor = 'not-allowed';
            addToCartBtn.innerHTML = 'OUT OF STOCK';
        } else {
            addToCartBtn.disabled = false;
            addToCartBtn.style.opacity = '1';
            addToCartBtn.style.cursor = 'pointer';
            addToCartBtn.innerHTML = 'ADD TO CART';
        }
        console.log('✅ Button state updated');
    }
}

// ==================== HELPER FUNCTION: rebuildImageGallery ====================

function rebuildImageGallery(images) {
    console.log('🖼️ Rebuilding gallery with', images.length, 'images');

    // Find the gallery main container's parent to locate thumbnail grid
    const mainImg = document.getElementById('mainProductImage');
    if (!mainImg) return;

    const galleryContainer = mainImg.closest('div').parentElement;
    if (!galleryContainer) return;

    // Find or create thumbnail grid
    let thumbnailGrid = galleryContainer.querySelector('.grid.grid-cols-4');
    if (!thumbnailGrid) {
        // Create thumbnail grid if it doesn't exist
        thumbnailGrid = document.createElement('div');
        thumbnailGrid.className = 'grid grid-cols-4 gap-2 mt-2';
        galleryContainer.appendChild(thumbnailGrid);
    }

    // Rebuild thumbnails
    thumbnailGrid.innerHTML = images.map((img, idx) => `
        <div class="cursor-pointer border-2 ${idx === 0 ? 'border-black' : 'border-gray-200'} rounded"
            onclick="changeMainImage('${img.replace(/'/g, "\\'")}', ${idx})">
            <img src="${img}"
                 alt="Image ${idx + 1}"
                 class="w-full aspect-square object-cover rounded"
                 onerror="this.src='${getPlaceholderImage()}'>
        </div>
    `).join('');

    console.log('✅ Gallery rebuilt with', images.length, 'thumbnails');
}

function selectSize(size) {
    // 1. Set the global selected size variable FIRST (critical)
    window.selectedProductSize = size;
    console.log('✅ Size selected:', size);

    // 2. Update the visual selection (CSS classes) with safety checks
    const sizeSelector = document.getElementById('sizeSelector');

    if (!sizeSelector) {
        console.warn('⚠️ Size selector not found in DOM');
        return; // Exit gracefully if selector doesn't exist
    }

    const buttons = sizeSelector.querySelectorAll('.size-option');

    if (buttons.length === 0) {
        console.warn('⚠️ No size buttons found');
        return;
    }

    // Iterate through buttons safely
    buttons.forEach(button => {
        try {
            const dataSize = button.getAttribute('data-size');

            if (dataSize === size) {
                // This is the selected size - highlight it
                button.classList.add('bg-black', 'text-white', 'border-black');
                button.classList.remove('border-gray-300', 'hover:border-black');
            } else {
                // This is not selected - reset to default
                button.classList.remove('bg-black', 'text-white', 'border-black');
                button.classList.add('border-gray-300', 'hover:border-black');
            }
        } catch (err) {
            console.error('❌ Error updating size button:', err);
        }
    });
}

function changeMainImage(imageSrc, index) {
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg) {
        mainImg.src = imageSrc;
    }

    // âœ… FIXED: Update thumbnail borders (works for both original and variant galleries)
    const galleryContainer = mainImg ? mainImg.closest('div').parentElement : null;
    if (!galleryContainer) return;

    const thumbnails = galleryContainer.querySelectorAll('.grid > div');
    thumbnails.forEach((thumb, idx) => {
        if (idx === index) {
            thumb.classList.add('border-black');
            thumb.classList.remove('border-gray-200');
        } else {
            thumb.classList.remove('border-black');
            thumb.classList.add('border-gray-200');
        }
    });
}

async function loadRelatedProducts(category, currentProductId) {
    try {
        console.log('🔍 Loading related products for category:', category);

        const res = await fetch(`${API_BASE}/products?category=${encodeURIComponent(category)}`);

        if (!res.ok) {
            throw new Error('Failed to fetch related products');
        }

        const products = await res.json();
        console.log(`📦 Found ${products.length} products in category`);

        // Filter out current product and get 4 random products
        const related = products
            .filter(p => p.id !== currentProductId)
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);

        console.log(`✅ Showing ${related.length} related products`);

        const container = document.getElementById('relatedProducts');
        if (!container) {
            console.error('❌ relatedProducts container not found!');
            return;
        }

        if (related.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-500">No related products found</div>';
            return;
        }

        // ✅ USE renderProductCard function
        container.innerHTML = related.map(p => renderProductCard(p)).join('');

        console.log('✅ Related products rendered successfully');
    } catch (e) {
        console.error('❌ Load related products error:', e);
        const container = document.getElementById('relatedProducts');
        if (container) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-500">Failed to load related products</div>';
        }
    }
}

// ==================== CART - COMPLETELY FIXED ====================

async function addToCartWithSize(productId) {
    // 1. Check authentication
    if (!AppState.currentUser) {
        alert('Please login to add items to cart');
        showAuthModal('login');
        return;
    }

    // 2. Check if size is selected
    if (!window.selectedProductSize) {
        alert('⚠️ Please select a size before adding to cart');
        const sizeSelector = document.getElementById('sizeSelector');
        if (sizeSelector) {
            sizeSelector.style.border = '3px solid red';
            sizeSelector.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
            sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                sizeSelector.style.border = '';
                sizeSelector.style.boxShadow = '';
            }, 3000);
        }
        return;
    }

    // 3. Get quantity
    const quantityEl = document.getElementById('productQuantity');
    const quantity = quantityEl ? parseInt(quantityEl.value) : 1;

    if (!quantity || quantity < 1) {
        alert('Please select a valid quantity');
        return;
    }

    try {
        console.log(`📦 Adding to cart - Product: ${productId}, Size: ${window.selectedProductSize}, Qty: ${quantity}`);

        // ✅ NEW: Include variant ID if selected
        const payload = {
            product_id: productId,
            quantity: quantity,
            selected_size: window.selectedProductSize
        };

        // Add variant if selected
        if (window.selectedVariant && window.selectedVariant.id) {
            payload.product_variant_id = window.selectedVariant.id;
            console.log(`🎨 Adding variant: ${window.selectedVariant.colorName}`);
        }

        const res = await fetch(`${API_BASE}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            let message = `✅ Added to cart!\nSize: ${window.selectedProductSize}\nQuantity: ${quantity}`;
            if (window.selectedVariant) {
                message += `\nColor: ${window.selectedVariant.colorName}`;
            }
            alert(message);

            // Reset selection
            window.selectedProductSize = null;
            window.selectedVariant = null;

            // Reset UI
            document.querySelectorAll('.size-option').forEach(btn => {
                btn.classList.remove('selected', 'bg-black', 'text-white', 'border-black');
                btn.classList.add('border-gray-300');
            });

            document.querySelectorAll('.variant-option').forEach(btn => {
                btn.classList.remove('border-black', 'bg-gray-100');
                btn.classList.add('border-gray-300');
            });

            await loadCart();
        } else {
            alert(data.error || 'Error adding to cart');
        }
    } catch (e) {
        console.error('❌ Add to cart error:', e);
        alert('Error adding to cart. Please try again.');
    }
}

async function buyNowWithSize(productId) {
    if (!AppState.currentUser) {
        alert('Please login to continue');
        showAuthModal('login');
        return;
    }
    if (!window.selectedProductSize) {
        alert('⚠️ Please select a size before checkout');
        const sizeSelector = document.getElementById('sizeSelector');
        if (sizeSelector) {
            sizeSelector.style.border = '3px solid red';
            sizeSelector.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
            sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                sizeSelector.style.border = '';
                sizeSelector.style.boxShadow = '';
            }, 3000);
        }
        return;
    }

    const quantityEl = document.getElementById('productQuantity');
    const quantity = quantityEl ? parseInt(quantityEl.value) : 1;
    if (!quantity || quantity < 1) {
        alert('Please select a valid quantity');
        return;
    }

    try {
        const payload = {
            product_id: productId,
            quantity: quantity,
            selected_size: window.selectedProductSize
        };
        if (window.selectedVariant && window.selectedVariant.id) {
            payload.product_variant_id = window.selectedVariant.id;
        }

        const res = await fetch(`${API_BASE}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
            await loadCart();
            navigateTo('checkout');
        } else {
            alert(data.error || 'Error processing your order');
        }
    } catch (e) {
        console.error('❌ Buy now error:', e);
        alert('Error processing your order. Please try again.');
    }
}

function decreaseQuantity() {
    const qty = document.getElementById('productQuantity');
    if (qty && parseInt(qty.value) > 1) {
        qty.value = parseInt(qty.value) - 1;
    }
}

function increaseQuantity() {
    const qty = document.getElementById('productQuantity');
    if (qty && AppState.currentProduct) {
        const maxStock = AppState.currentProduct.stock;
        if (parseInt(qty.value) < maxStock) {
            qty.value = parseInt(qty.value) + 1;
        }
    }
}

function goBack() {
    // Check if we can safely go back within the app's history
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        // Default to navigating to the main shop page (product list)
        navigateTo('shop');
    }
}

// ✅ FIXED: Make this a global variable accessible everywhere
window.selectedProductSize = null;

// Legacy function for backward compatibility
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
            // ✅ CRITICAL FIX: Reload cart and update immediately
            await loadCart();
            updateCartBadge();

            // ✅ Show empty cart message if no items left
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
        // ✅ NEW: Force summary to zero
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
                // ✅ FIX: Safely get image URL
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
                            onerror="this.src='${getPlaceholderImage()}'>
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

    // ✅ CRITICAL FIX: Calculate subtotal and item count from actual cart items
    const subtotal = AppState.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = AppState.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Update item count
    if (itemCountEl) {
        itemCountEl.textContent = totalItems + (totalItems === 1 ? ' item' : ' items');
    }

    // ✅ FIX: If cart is empty, set everything to zero/default
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

    // NEW RULE: Free shipping if cart value is 999 or above (otherwise ₹49)
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
