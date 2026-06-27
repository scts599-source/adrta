// ==================== URL STRUCTURE & CONSTANTS ====================

const ROUTES = {
    home: '/',
    shop: '/shop',
    new: '/new-arrivals',
    about: '/about',
    account: '/account',
    orders: '/orders',
    login: '/login',
    signup: '/signup',
    cart: '/cart',
    checkout: '/checkout',
    admin: '/admin',
    product: '/product/:id',
};

const BASE_URL = window.location.origin;

// ==================== NAVIGATION ====================

function navigateTo(page, params = {}) {
    console.log('🔍 Navigating to:', page, 'with params:', params);

    try {
        const nav = document.getElementById('navbar');
        nav.classList.remove('on-hero');
        nav.classList.add('scrolled');

        const pages = document.querySelectorAll('.page');
        pages.forEach(p => {
            p.classList.remove('active', 'visible');
        });

        if (page === 'modifier') {
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
            console.error('❌ Page not found:', 'page-' + page);
            if (page !== 'home') navigateTo('home');
        }
    } catch (error) {
        console.error('❌ Navigation error:', error);
        if (page !== 'home') navigateTo('home');
    }
}

function getUrlForPage(page, params = {}) {
    switch(page) {
        case 'home': return '/';
        case 'shop': return '/shop';
        case 'new': return '/new-arrivals';
        case 'about': return '/about';
        case 'account': return '/account';
        case 'orders': return '/orders';
        case 'login': return '/login';
        case 'signup': return '/signup';
        case 'cart': return '/cart';
        case 'checkout': return '/checkout';
        case 'admin': return '/admin';
        case 'product':
            if (params.id) {
                return `/product/${params.id}`;
            }
            return '/shop';
        default: return '/';
    }
}

function parseRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '');

    console.log('📍 Parsing route:', path, 'hash:', hash);

    if (hash) {
        const hashPage = hash.split('/')[0];
        if (hashPage) {
            return { page: hashPage, params: {} };
        }
    }

    if (path === '/' || path === '') {
        return { page: 'home', params: {} };
    }

    const cleanPath = path.substring(1);

    if (cleanPath.startsWith('product/')) {
        const productId = cleanPath.split('/')[1];
        return { page: 'product', params: { id: productId } };
    }

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

    return { page: 'home', params: {} };
}

function loadPageContent(page, params = {}) {
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
            console.log('ℹ️ No special loading for page:', page);
    }
}

async function loadAndShowProduct(productId) {
    try {
        console.log('📦 Loading product from URL:', productId);
        await viewProduct(productId);
        console.log('✅ Product loaded successfully');
    } catch (error) {
        console.error('❌ Error loading product:', error);
        alert('Product not found. Redirecting to shop.');
        navigateTo('shop');
    }
}

window.addEventListener('popstate', (event) => {
    console.log('⬅️ Browser back/forward detected');

    if (event.state && event.state.page) {
        const { page, params } = event.state;
        navigateWithoutPush(page, params);
    } else {
        const route = parseRoute();
        navigateWithoutPush(route.page, route.params);
    }
});

function navigateWithoutPush(page, params = {}) {
    console.log('🔄 Navigating without push:', page, params);

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

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing URL routing system');
    const route = parseRoute();
    console.log('📍 Initial route:', route);
    window.history.replaceState({ page: route.page, params: route.params }, '', window.location.href);
    navigateWithoutPush(route.page, route.params);
});

// ==================== SHAREABLE LINK ====================

function getShareableLink(page, params = {}) {
    const url = getUrlForPage(page, params);
    return `${BASE_URL}${url}`;
}

function copyShareableLink(page, params = {}) {
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

function shareProduct(productId, productName) {
    const shareUrl = getShareableLink('product', { id: productId });
    const shareText = `Check out ${productName} on ADRTA!`;

    if (navigator.share) {
        navigator.share({
            title: productName,
            text: shareText,
            url: shareUrl
        }).then(() => {
            console.log('✅ Share successful');
        }).catch(err => {
            console.log('❌ Share cancelled or failed:', err);
            showShareModal(shareUrl, productName);
        });
    } else {
        showShareModal(shareUrl, productName);
    }
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

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}
