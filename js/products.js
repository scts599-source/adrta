// ==================== HELPER FUNCTION FOR IMAGE DISPLAY - FIXED ====================
/**
 * Safely parses the product image data and returns the URL of the main image.
 * Used for displaying thumbnails in the main shop view, quick view, etc.
 * @param {Object} product - The product object which has an 'image' property.
 * @returns {string} The URL of the first image or a placeholder URL.
 */
function getProductImage(product) {
    let images = [];
    const imageData = product.image;

    if (imageData) {
        if (Array.isArray(imageData)) {
            images = imageData;
        } else if (typeof imageData === 'string') {
            try {
                // 1. Attempt to parse JSON string (the most common format from the backend)
                const parsed = JSON.parse(imageData);
                if (Array.isArray(parsed)) {
                    images = parsed;
                } else if (typeof parsed === 'string' && parsed.startsWith('http')) {
                    images = [parsed];
                }
            } catch (e) {
                // 2. Fallback: Treat as a single non-JSON URL string
                if (imageData.startsWith('http') || imageData.startsWith('/static')) {
                    images = [imageData];
                }
            }
        }
    }

    // Return the first valid URL found, or the placeholder
    return images.length > 0 ? images[0] : getPlaceholderImage();
}

function getPlaceholderImage() {
    return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E';
}

// ==================== PRODUCTS ====================

function renderProductCard(product) {
    let priceHtml = '';
    const originalPrice = product.original_price || product.mrp;
    const productPrice = parseFloat(product.price) || 0;

    if (originalPrice && originalPrice > productPrice) {
        priceHtml = `
            <span class="text-gray-400 line-through text-xs mr-2">₹${originalPrice}</span>
            <span class="text-gray-900 font-semibold tracking-wide">₹${productPrice}</span>
        `;
    } else {
        priceHtml = `<span class="text-gray-900 font-semibold tracking-wide">₹${productPrice}</span>`;
    }

    let badgeHtml = '';
    if (originalPrice && originalPrice > productPrice) {
        badgeHtml = `<div class="absolute top-2 left-2 bg-black border border-[#39ff14] text-[#39ff14] text-[0.55rem] font-bold tracking-[0.2em] px-2 py-1 uppercase z-10">[ CLASSIFIED_PRICE ]</div>`;
    } else if (product.is_new) {
        badgeHtml = `<div class="absolute top-2 left-2 bg-black border border-white/40 text-white text-[0.55rem] font-bold tracking-[0.2em] px-2 py-1 uppercase z-10">[ ARCHIVE_01 ]</div>`;
    }

    let imageUrl = getPlaceholderImage();
    if (product.image) {
        try {
            const parsedImages = JSON.parse(product.image);
            imageUrl = Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : product.image;
        } catch(e) {
            imageUrl = product.image;
        }
    }

    const productName = product.name || 'Unnamed Product';
    const productCategory = (product.category || 'STREETWEAR').toUpperCase();

    return `
        <div class="group flex flex-col cursor-pointer mb-6 snap-center min-w-[75%] sm:min-w-[45%] md:min-w-0" onclick="navigateTo('product', {id: ${product.id}})">
            <div class="relative aspect-[4/5] bg-[#0f0f0f] overflow-hidden mb-3 border border-[#2a2a2a]">
                ${badgeHtml}
                <img src="${imageUrl}" 
                     alt="${productName}" 
                     loading="lazy"
                     class="archive-product-img w-full h-full object-contain transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                     onerror="this.src='${getPlaceholderImage()}'>
            </div>
            <div class="flex flex-col px-1">
                <span class="text-[0.6rem] text-gray-500 uppercase tracking-widest mb-1">// ${productCategory}</span>
                <h3 class="text-[0.85rem] font-medium text-gray-900 leading-snug truncate" title="${productName}">
                    ${productName}
                </h3>
                <div class="mt-1.5 flex items-center">
                    ${priceHtml}
                </div>
            </div>
        </div>
    `;
}

async function loadNewArrivals() {
    try {
        console.log('🆕 Fetching new arrivals...');
        const res = await fetch(`${API_BASE}/products?is_new=true`);
        if (!res.ok) throw new Error('Failed to fetch new arrivals');

        const products = await res.json();

        // Limit the display to the first 10 products
        const newProducts = products.slice(0, 4); // Limit to 4 for a curated, premium look

        const container = document.getElementById('featuredProducts');
        if (!container) {
            console.error('❌ Featured products container not found!');
            return;
        }

        if (newProducts.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No new arrivals yet. Check back soon!</p></div>';
            return;
        }

        // ✅ USE renderProductCard function
        container.innerHTML = newProducts.map(p => renderProductCard(p)).join('');

        console.log('✅ New arrivals loaded:', newProducts.length);

    } catch (e) {
        console.error('❌ Load new arrivals error:', e);
        const container = document.getElementById('featuredProducts');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-red-600">Failed to load products. Please refresh.</p>
                </div>
            `;
        }
    }
}

async function loadShopProducts() {
    try {
        console.log('🛍️ Loading shop products...');
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const products = await res.json();
        globalProducts = products;
        console.log(`📦 Fetched ${products.length} products`);
        initializeCategorySystem(products);
        const container = document.getElementById('productsGrid');
        if (!container) { console.error('❌ Products grid container not found!'); return; }
        if (products.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-16"><p style="color:#aaa;font-size:0.85rem;letter-spacing:0.05em;">NO PRODUCTS AVAILABLE</p></div>';
            return;
        }
        container.innerHTML = products.map(p => renderProductCard(p)).join('');
        updateShopProductCount(products.length);
        setupMobileFilterToggle();
        initializeShopFilterPills();
        console.log('✅ Shop products loaded:', products.length);
    } catch (e) {
        console.error('❌ Load shop products error:', e);
        const container = document.getElementById('productsGrid');
        if (container) container.innerHTML = '<div class="col-span-full text-center py-12"><p style="color:#dc2626;font-size:0.85rem;">Failed to load products. Please refresh.</p></div>';
    }
}

function updateShopProductCount(count) {
    const el = document.getElementById('shopProductCount');
    if (el) el.textContent = count + (count === 1 ? ' Product' : ' Products');
}

function setupMobileFilterToggle() {
    const btn = document.getElementById('mobileFilterToggle');
    const panel = document.getElementById('filterPanelContent');
    const isMobile = window.innerWidth < 768;

    if (btn) {
        btn.style.display = isMobile ? 'flex' : 'none';
    }

    if (panel) {
        panel.classList.toggle('mobile-open', false);
        panel.style.display = isMobile ? 'none' : 'block';
    }
}

window.addEventListener('resize', setupMobileFilterToggle);

function initializeShopFilterPills() {
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const group = pill.dataset.filterGroup;
            if (!group) return;

            document.querySelectorAll(`.filter-pill[data-filter-group="${group}"]`).forEach(button => {
                const active = button === pill;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            applyShopFilters();
        });
    });
}

function toggleMobileFilters() {
    const panel = document.getElementById('filterPanelContent');
    const icon = document.getElementById('filterToggleIcon');
    if (!panel) return;
    panel.classList.toggle('mobile-open');
    icon.textContent = panel.classList.contains('mobile-open') ? '-' : '+';
}

function applyShopFilters() {
    if (!globalProducts.length) return;
    const category = document.querySelector('.filter-pill[data-filter-group="shopCategory"].active')?.dataset.filterValue || document.querySelector('input[name="shopCategory"]:checked')?.value || 'all';
    const gender = document.querySelector('.filter-pill[data-filter-group="shopGender"].active')?.dataset.filterValue || document.querySelector('input[name="shopGender"]:checked')?.value || 'all';
    const price = document.querySelector('.filter-pill[data-filter-group="shopPrice"].active')?.dataset.filterValue || document.querySelector('input[name="shopPrice"]:checked')?.value || 'all';
    const inStockOnly = document.getElementById('inStockOnly')?.checked || false;
    const newOnly = document.getElementById('newArrivalsOnly')?.checked || false;

    let filtered = [...globalProducts];

    if (category !== 'all') {
        filtered = filtered.filter(p => (p.category || '').toLowerCase().includes(category.toLowerCase()));
    }
    if (gender !== 'all') {
        filtered = filtered.filter(p => (p.gender || p.category || '').toUpperCase().includes(gender));
    }
    if (price !== 'all') {
        const [minP, maxP] = price.split('-').map(Number);
        filtered = filtered.filter(p => { const pr = parseFloat(p.price) || 0; return pr >= minP && pr <= maxP; });
    }
    if (inStockOnly) {
        filtered = filtered.filter(p => (p.stock || 0) > 0);
    }
    if (newOnly) {
        filtered = filtered.filter(p => p.is_new || (p.category || '').toUpperCase().includes('NEW'));
    }

    const container = document.getElementById('productsGrid');
    if (!container) return;
    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-span-full" style="padding: 4rem 0; text-align: center;"><p style="color:#aaa;font-size:0.82rem;letter-spacing:0.08em;text-transform:uppercase;">No products match your filters</p><button onclick="clearShopFilters()" style="margin-top:1rem;background:none;border:1.5px solid #000;padding:0.6rem 1.5rem;font-size:0.68rem;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;">Clear Filters</button></div>';
    } else {
        container.innerHTML = filtered.map(p => renderProductCard(p)).join('');
    }
    updateShopProductCount(filtered.length);
}

function clearShopFilters() {
    ['shopCategory', 'shopGender', 'shopPrice'].forEach(group => {
        document.querySelectorAll(`.filter-pill[data-filter-group="${group}"]`).forEach(btn => {
            const active = btn.dataset.filterValue === 'all';
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    });
    const inStock = document.getElementById('inStockOnly');
    const newOnly = document.getElementById('newArrivalsOnly');
    if (inStock) inStock.checked = false;
    if (newOnly) newOnly.checked = false;
    applyShopFilters();
}

// Keep old filterMainCategory working (called from home page category tiles)
async function filterMainCategoryLegacy(mainCategory) {
    navigateTo('shop');
    setTimeout(() => {
        if (mainCategory === 'MEN' || mainCategory === 'WOMEN') {
            document.querySelectorAll('.filter-pill[data-filter-group="shopGender"]').forEach(btn => {
                const active = btn.dataset.filterValue === mainCategory;
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
        } else if (mainCategory === 'NEW ARRIVALS') {
            const newEl = document.getElementById('newArrivalsOnly');
            if (newEl) newEl.checked = true;
        }
        applyShopFilters();
    }, 300);
}

// ✅ NEW: Initialize the category system with actual product data
function initializeCategorySystem(products) {
    console.log('🔧 Initializing category system...');

    // Reset to "ALL" category on load
    currentMainCategory = 'all';
    currentSubCategory = null;

    // Make sure ALL tab is active
    document.querySelectorAll('#mainCategoryTabs .main-category-tab').forEach(tab => {
        if (tab.getAttribute('data-category') === 'all') {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Hide subcategories initially and reset buttons
    const subCategoryContainer = document.getElementById('subCategoryTabs');
    if (subCategoryContainer) {
        subCategoryContainer.style.display = 'none';
        subCategoryContainer.innerHTML = '';
    }

    updateShopProductCount(products.length);
    console.log('✅ Category system initialized');
}

const CATEGORY_STRUCTURE = {
    'MEN': {
        subcategories: [
            { name: 'Men T-Shirts' },
            { name: 'Men Hoodies' }
        ]
    },
    'WOMEN': {
        subcategories: [
            { name: 'Women T-Shirts' },
            { name: 'Women Hoodies'}
        ]
    },
    'NEW ARRIVALS': {
        emoji: '✨',
        subcategories: []
    }
};

let currentMainCategory = 'all';
let currentSubCategory = null;
let globalProducts = []; // Store all products for filtering

async function filterMainCategory(mainCategory) {
    console.log('🔍 Filtering main category:', mainCategory);

    currentMainCategory = mainCategory;
    currentSubCategory = null;

    // Update active tab styling
    document.querySelectorAll('#mainCategoryTabs .main-category-tab').forEach(tab => {
        if (tab.getAttribute('data-category') === mainCategory) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    const subCategoryContainer = document.getElementById('subCategoryTabs');
    const container = document.getElementById('productsGrid');

    if (!container) {
        console.error('❌ Products grid not found!');
        return;
    }

    // Show loading state
    container.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div><p class="mt-2 text-gray-600">Loading...</p></div>';

    try {
        if (mainCategory === 'all') {
            // Hide subcategories, show all products
            if (subCategoryContainer) {
                subCategoryContainer.style.display = 'none';
            }

            const res = await fetch(`${API_BASE}/products`);
            if (!res.ok) throw new Error('Failed to fetch products');

            const products = await res.json();
            globalProducts = products;

            if (products.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No products available</p></div>';
            } else {
                container.innerHTML = products.map(p => renderProductCard(p)).join('');
            }

            updateShopProductCount(products.length);
            console.log(`✅ Showing all ${products.length} products`);
            return;
        }

        if (mainCategory === 'NEW ARRIVALS') {
            // Hide subcategories, show only new products
            if (subCategoryContainer) {
                subCategoryContainer.style.display = 'none';
            }

            const res = await fetch(`${API_BASE}/products?is_new=true`);
            if (!res.ok) throw new Error('Failed to fetch new arrivals');

            const products = await res.json();
            globalProducts = products;

            if (products.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No new arrivals yet. Check back soon!</p></div>';
            } else {
                container.innerHTML = products.map(p => renderProductCard(p)).join('');
            }

            updateShopProductCount(products.length);
            console.log(`✅ Showing ${products.length} new arrivals`);
            return;
        }

        // Handle MEN or WOMEN with subcategories
        const categoryConfig = CATEGORY_STRUCTURE[mainCategory];

        if (categoryConfig && categoryConfig.subcategories.length > 0) {
            // Show subcategories
            if (subCategoryContainer) {
                subCategoryContainer.style.display = 'flex';

                // Build subcategory buttons with proper category names
                subCategoryContainer.innerHTML = categoryConfig.subcategories.map(sub => `
                    <button class="sub-category-tab"
                            data-subcategory="${sub.name}"
                            onclick="filterSubCategory('${mainCategory}', '${sub.name}')">
                        ${sub.emoji || ''} ${sub.name}
                    </button>
                `).join('');

                console.log(`✅ Showing subcategories for ${mainCategory}`);
            }

            // Fetch all products
            const res = await fetch(`${API_BASE}/products`);
            if (!res.ok) throw new Error('Failed to fetch products');

            const allProducts = await res.json();
            globalProducts = allProducts;

            // Get subcategory names
            const subcategoryNames = categoryConfig.subcategories.map(sub => sub.name);

            // Filter products by matching category name
            const filteredProducts = allProducts.filter(p => {
                const productCategory = (p.category || '').trim().toLowerCase();
                return subcategoryNames.some(subName =>
                    productCategory === subName.toLowerCase()
                );
            });

            console.log('🔍 Filtering:', {
                mainCategory,
                subcategoryNames,
                totalProducts: allProducts.length,
                filteredCount: filteredProducts.length,
                sampleCategories: allProducts.slice(0, 3).map(p => p.category)
            });

            if (filteredProducts.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No products found in this category</p></div>';
            } else {
                container.innerHTML = filteredProducts.map(p => renderProductCard(p)).join('');
            }

            updateShopProductCount(filteredProducts.length);
            console.log(`✅ Showing ${filteredProducts.length} products in ${mainCategory}`);
        }

    } catch (e) {
        console.error('❌ Filter main category error:', e);
        container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-600">Failed to load products</p></div>';
    }
}

async function filterSubCategory(mainCategory, subCategory) {
    console.log(`🔍 Filtering subcategory: ${mainCategory} > ${subCategory}`);

    currentSubCategory = subCategory;

    // Update active subcategory styling
    document.querySelectorAll('.sub-category-tab').forEach(tab => {
        if (tab.getAttribute('data-subcategory') === subCategory) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    const container = document.getElementById('productsGrid');
    if (!container) return;

    // Show loading
    container.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div><p class="mt-2 text-gray-600">Loading...</p></div>';

    try {
        // ✅ CRITICAL FIX: Fetch ALL products and filter client-side for EXACT matches
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');

        const allProducts = await res.json();

        // ✅ Filter products with EXACT category match
        const products = allProducts.filter(p => {
            const productCategory = (p.category || '').trim().toLowerCase();
            return productCategory === subCategory.toLowerCase();
        });

        console.log(`📦 Found ${products.length} products in ${subCategory} (filtered from ${allProducts.length} total)`);
        console.log(`🔍 Sample categories:`, allProducts.slice(0, 5).map(p => p.category));

        if (products.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No products found in this category</p></div>';
            updateShopProductCount(0);
            return;
        }

        container.innerHTML = products.map(p => renderProductCard(p)).join('');
        updateShopProductCount(products.length);

        console.log(`✅ Rendered ${products.length} products for ${subCategory}`);

    } catch (e) {
        console.error('❌ Filter subcategory error:', e);
        container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-600">Failed to load products</p></div>';
    }
}

// ✅ Helper: Filter by main category only (all subcategories)
async function filterByMainCategory(mainCategory) {
    try {
        const categoryConfig = CATEGORY_STRUCTURE[mainCategory];
        if (!categoryConfig) return;

        // Get all subcategory names
        const subcategoryNames = categoryConfig.subcategories.map(sub => sub.name);

        // Fetch products for all subcategories
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');

        const allProducts = await res.json();

        // Filter products that match any subcategory
        const filteredProducts = allProducts.filter(p =>
            subcategoryNames.includes(p.category)
        );

        console.log(`📦 Found ${filteredProducts.length} products in ${mainCategory}`);

        const container = document.getElementById('productsGrid');
        if (!container) return;

        if (filteredProducts.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No products found</p></div>';
            return;
        }

        container.innerHTML = filteredProducts.map(p => renderProductCard(p)).join('');

    } catch (e) {
        console.error('❌ Filter main category error:', e);
    }
}

// ✅ Helper: Load all products
async function loadAllProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');

        const products = await res.json();

        const container = document.getElementById('productsGrid');
        if (!container) return;

        container.innerHTML = products.map(p => renderProductCard(p)).join('');

    } catch (e) {
        console.error('❌ Load all products error:', e);
    }
}

// ✅ Helper: Load only new arrivals
async function loadNewArrivalsFiltered() {
    try {
        const res = await fetch(`${API_BASE}/products?is_new=true`);
        if (!res.ok) throw new Error('Failed to fetch new arrivals');

        const products = await res.json();

        const container = document.getElementById('productsGrid');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No new arrivals yet</p></div>';
            return;
        }

        container.innerHTML = products.map(p => renderProductCard(p)).join('');

    } catch (e) {
        console.error('❌ Load new arrivals error:', e);
    }
}

// ==================== LOAD NEW ARRIVALS PAGE (Dedicated New Arrivals Page) ====================
async function loadNewArrivalsPage() {
    try {
        console.log('🆕 Loading new arrivals page...');

        // Fetch products marked as new
        const res = await fetch(`${API_BASE}/products?is_new=true`);
        if (!res.ok) throw new Error('Failed to fetch products');

        const products = await res.json();

        // Get the container element
        const container = document.getElementById('newArrivalsGrid');
        if (!container) {
            console.error('❌ New arrivals grid container not found!');
            return;
        }

        if (products.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No new arrivals yet. Check back soon!</p></div>';
            return;
        }

        // ✅ USE renderProductCard function - Render all new products
        container.innerHTML = products.map(p => renderProductCard(p)).join('');

        console.log('✅ New arrivals page loaded:', products.length);
    } catch (e) {
        console.error('❌ Load new arrivals page error:', e);
        // Display error message in the grid container
        const container = document.getElementById('newArrivalsGrid');
        if (container) {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-600">Failed to load products. Please refresh the page.</p></div>';
        }
    }
}

function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const sort = document.getElementById('sortFilter').value;

    let url = `${API_BASE}/products`;
    if (category) {
        url += `?category=${encodeURIComponent(category)}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(products => {
            // Sort products
            if (sort === 'low-high') {
                products.sort((a, b) => a.price - b.price);
            } else if (sort === 'high-low') {
                products.sort((a, b) => b.price - a.price);
            }

            const container = document.getElementById('shopProductsContainer');
            if (!container) return;

            container.innerHTML = products.map(p => `
                <div class="col-md-4">
                    <div class="product-card">
                        <div class="product-image">
                            <img src="${getProductImage(p)}" alt="${p.name}" onerror="this.src='${getPlaceholderImage()}'">
                            ${p.is_new ? '<span class="product-badge">NEW</span>' : ''}
                        </div>
                        <div class="product-info">
                            <h5 class="product-name">${p.name}</h5>
                            <div class="product-price">₹${p.price}</div>
                            <button class="btn-add-cart" onclick="viewProduct(${p.id})">View Details</button>
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(e => console.error('Filter error:', e));
}

async function filterProducts(category) {
    console.log('🔍 Filtering by category:', category);

    // Update active tab styling
    document.querySelectorAll('.main-category-tab').forEach(tab => {
        if (tab.getAttribute('data-category') === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    try {
        let url = `${API_BASE}/products`;
        if (category !== 'all') {
            url += `?category=${encodeURIComponent(category)}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch products');

        const products = await res.json();
        console.log(`📦 Found ${products.length} products in category: ${category}`);

        const container = document.getElementById('productsGrid');
        if (!container) {
            console.error('❌ Products grid container not found!');
            return;
        }

        if (products.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-600">No products found in this category</p></div>';
            return;
        }

        // ✅ USE renderProductCard function
        container.innerHTML = products.map(p => renderProductCard(p)).join('');

        console.log(`✅ Displayed ${products.length} products for category: ${category}`);
    } catch (e) {
        console.error('❌ Filter products error:', e);
        const container = document.getElementById('productsGrid');
        if (container) {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-600">Failed to filter products</p></div>';
        }
    }
}