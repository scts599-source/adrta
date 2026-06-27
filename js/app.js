// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 ADRTA App Initializing...');
    
    // Hide loader immediately with a small delay for smooth transition
    const loader = document.getElementById('pageLoader');
    const loaderTimeout = setTimeout(() => {
        if (loader) {
            loader.classList.add('hidden');
        }
    }, 300);
    
    try {
        // Initialize core features
        await checkMaintenanceStatus();
        await loadCurrentUser();
        await loadCart();
        updateCartBadge();
        setupImagePreview();
        setupVariantImagePreview();

        // Load new arrivals immediately on page load
        await loadNewArrivals();
    } catch (error) {
        console.error('❌ Initialization error:', error);
        // Ensure loader is hidden even on error
        if (loader) {
            loader.classList.add('hidden');
        }
    } finally {
        // Always hide loader after initialization
        clearTimeout(loaderTimeout);
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    // Show the home page
    const homePage = document.getElementById('page-home');
    if (homePage) {
        setTimeout(() => {
            homePage.classList.add('visible');
        }, 100);
    }

    // Initialize navbar
    const nav = document.getElementById('navbar');
    if (nav) {
        nav.style.display = 'block';
        nav.style.visibility = 'visible';

        const activePage = document.querySelector('.page.active');
        if (activePage && activePage.id === 'page-home') {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
                nav.classList.remove('on-hero');
            } else {
                nav.classList.add('on-hero');
                nav.classList.remove('scrolled');
            }
        } else {
            nav.classList.remove('on-hero');
            nav.classList.add('scrolled');
        }

        console.log('Nav classes:', nav.classList.toString());
    }

    // DEBUG: Check if containers exist
    console.log('🔍 Container check:');
    console.log('  - featuredProducts:', document.getElementById('featuredProducts') ? '✅' : '❌');
    console.log('  - productsGrid:', document.getElementById('productsGrid') ? '✅' : '❌');
    console.log('  - newArrivalsGrid:', document.getElementById('newArrivalsGrid') ? '✅' : '❌');
    console.log('  - page-home:', document.getElementById('page-home') ? '✅' : '❌');
    console.log('  - page-shop:', document.getElementById('page-shop') ? '✅' : '❌');
    console.log('  - page-new:', document.getElementById('page-new') ? '✅' : '❌');
    console.log('✅ ADRTA App Ready');
});