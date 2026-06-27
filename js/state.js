// ==================== CENTRALIZED APPLICATION STATE ====================
const AppState = {
    currentUser: null,
    cartItems: [],
    currentProduct: null,
    editingProductId: null,
    selectedProductImages: [],
    selectedProductImageBase64: null,
    otpContext: {},
    currentProductIdForVariants: null,
    variantImages: [],
    shopFilters: { category: 'all', gender: 'all', price: 'all', inStock: false, newOnly: false },
};

// Legacy aliases - remove these as you touch each function
// (keeps all existing code working without mass find-replace)
Object.defineProperties(window, {
    currentUser:                { get() { return AppState.currentUser; },                set(v) { AppState.currentUser = v; }, configurable: true },
    cartItems:                  { get() { return AppState.cartItems; },                  set(v) { AppState.cartItems = v; }, configurable: true },
    currentProduct:             { get() { return AppState.currentProduct; },             set(v) { AppState.currentProduct = v; }, configurable: true },
    editingProductId:           { get() { return AppState.editingProductId; },           set(v) { AppState.editingProductId = v; }, configurable: true },
    selectedProductImages:      { get() { return AppState.selectedProductImages; },      set(v) { AppState.selectedProductImages = v; }, configurable: true },
    selectedProductImageBase64: { get() { return AppState.selectedProductImageBase64; }, set(v) { AppState.selectedProductImageBase64 = v; }, configurable: true },
    otpContext:                 { get() { return AppState.otpContext; },                 set(v) { AppState.otpContext = v; }, configurable: true },
    currentProductIdForVariants:{ get() { return AppState.currentProductIdForVariants;}, set(v) { AppState.currentProductIdForVariants = v; }, configurable: true },
    variantImages:              { get() { return AppState.variantImages; },              set(v) { AppState.variantImages = v; }, configurable: true },
});