// ==================== USER AUTHENTICATION ====================
async function loadCurrentUser() {
    try {
        const res = await fetch(`${API_BASE}/auth/current`);
        const data = await res.json();

        if (data.authenticated) {
            AppState.currentUser = data.user;
            console.log('👤 User loaded:', AppState.currentUser.name);
            updateNavigation();
        } else {
            AppState.currentUser = null;
            updateNavigation();
        }
    } catch (e) {
        console.error('Load user error:', e);
        AppState.currentUser = null;
        updateNavigation();
    }
}

function updateNavigation() {
    // Desktop navigation doesn't have separate login/logout buttons
    // Just update the account button click behavior
    const accountBtn = document.querySelector('.nav-icon:nth-child(2)');

    // Update mobile menu based on authentication status
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        const accountLink = mobileMenu.querySelector('a[onclick*="handleAccountClick"]');
        if (accountLink) {
            if (AppState.currentUser) {
                accountLink.textContent = 'My Account';
            } else {
                accountLink.textContent = 'Login';
            }
        }
    }

    console.log('✅ Navigation updated for user:', AppState.currentUser ? AppState.currentUser.name : 'Guest');
}

async function login() {
    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;

    if (!identifier || !password) {
        alert('Please enter email/phone and password');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        const data = await res.json();

        if (res.ok) {
            if (data.require2FA) {
                AppState.otpContext = {
                    purpose: 'login',
                    identifier: data.identifier,
                    userId: data.userId
                };
                showOTPModal(data.identifier);
            } else {
                AppState.currentUser = data.user;
                updateNavigation();
                closeAuthModal();
                await loadCart();
                alert('Login successful!');
            }
        } else if (res.status === 403 && data.requireVerification) {
            AppState.otpContext = {
                purpose: 'registration',
                identifier: data.identifier,
                userId: data.userId
            };
            showOTPModal(data.identifier);
            alert(data.error);
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (e) {
        console.error('Login error:', e);
        alert('Login error. Please try again.');
    }
}

async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value.trim() || null;
    const phone = document.getElementById('registerPhone').value.trim() || null;
    const password = document.getElementById('registerPassword').value;

    if (!name || !password) {
        alert('Please fill required fields');
        return;
    }

    if (!email && !phone) {
        alert('Please provide either email or phone number');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });

        const data = await res.json();

        if (res.ok) {
            AppState.otpContext = {
                purpose: 'registration',
                identifier: data.identifier,
                userId: data.userId,
            };
            let message = data.message;
            showOTPModal(data.identifier);
            alert(data.message);
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (e) {
        console.error('Register error:', e);
        alert('Registration error');
    }
}

async function handleOTPVerification(e) {
    e.preventDefault();
    const otpCodeValue = document.getElementById('otpCode').value;
    const btn = document.getElementById('otpSubmitBtn');
    const originalText = btn.innerHTML;

    if (!AppState.otpContext || !AppState.otpContext.identifier || !otpCodeValue) {
        alert("Client error: Identifier or OTP code is missing. Please restart the process.");
        return;
    }

    btn.innerHTML = 'Verifying...';
    btn.disabled = true;

    try {
        let endpoint = '';
        if (AppState.otpContext.purpose === 'registration') {
            endpoint = '/api/auth/verify-registration';
        } else if (AppState.otpContext.purpose === 'reset_password') {
            endpoint = '/api/auth/verify-reset-otp';
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: AppState.otpContext.identifier,
                otpCode: otpCodeValue
            })
        });

        const data = await res.json();

        if (res.ok) {
            if (AppState.otpContext.purpose === 'reset_password') {
                AppState.otpContext.resetToken = data.resetToken;
                alert('OTP verified! Please set your new password.');
                showResetPasswordModal();
            } else if (AppState.otpContext.purpose === 'registration') {
                await loadCurrentUser();
                updateNavigation();
                alert(data.message || 'Registration successful! You are now logged in.');
                closeAuthModal();
                await loadCart();
            }
        } else {
            alert(data.error || 'Verification failed. Check your code or try again.');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        alert('Verification error: Server connection failed.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function resendOTP() {
    try {
        const res = await fetch('/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: AppState.otpContext.identifier,
                purpose: AppState.otpContext.purpose
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert('OTP resent successfully!');
        } else {
            alert(data.error || 'Failed to resend OTP');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        alert('Error resending OTP');
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();

    // Find your input ID (it might be 'forgotPasswordInput' or 'resetEmail')
    const inputField = event.target.querySelector('input').value.trim();

    // Strict Email Regex - Rejects phone numbers
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputField)) {
        alert('Please enter a valid email address.');
        return;
    }
    const btn = document.getElementById('forgotSubmitBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Sending...';
    btn.disabled = true;

    try {
        const identifier = document.getElementById('forgotIdentifier').value;
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier })
        });

        const data = await res.json();

        if (res.ok) {
            AppState.otpContext = {
                purpose: 'reset_password',
                identifier: identifier
            };
            alert(data.message);
            showOTPModal(identifier);
        } else {
            alert(data.error || 'Failed to send OTP');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        alert('Error sending OTP');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const btn = document.getElementById('resetSubmitBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Resetting...';
    btn.disabled = true;

    try {
        const newPassword = document.getElementById('newPasswordReset').value;
        const confirmPassword = document.getElementById('confirmPasswordReset').value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resetToken: AppState.otpContext.resetToken,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message);
            showAuthModal('login');
        } else {
            alert(data.error || 'Password reset failed');
        }
    } catch (error) {
        console.error('Reset password error:', error);
        alert('Error resetting password');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
        AppState.currentUser = null;
        AppState.cartItems = [];
        updateNavigation();
        updateCartBadge();
        navigateTo('home');
        alert('Logged out successfully');
    } catch (e) {
        console.error('Logout error:', e);
    }
}

// ==================== AUTH MODAL FUNCTIONS ====================
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if(modal) {
        modal.classList.remove('hidden');
        switchAuthMode('login'); // Default to login tab

        // Slight delay to allow CSS transition to grab the DOM update
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if(modal) {
        // Fade out first
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300); // Wait for transition to finish before hiding
    }
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('tabLoginBtn');
    const registerTab = document.getElementById('tabRegisterBtn');
    const authError = document.getElementById('authError');
    
    // Clear any previous errors
    if (authError) authError.classList.add('hidden');
    
    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        loginForm.classList.add('flex');
        registerForm.classList.remove('flex');
        registerForm.classList.add('hidden');
        
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        registerForm.classList.remove('hidden');
        registerForm.classList.add('flex');
        loginForm.classList.remove('flex');
        loginForm.classList.add('hidden');
        
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    }
}

// ==================== OTP MODAL FUNCTIONS ====================
function showOTPModal(identifier) {
    const modal = document.getElementById('authModal');
    const content = document.getElementById('authContent');

    content.innerHTML = `
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="font-display text-2xl tracking-wider">VERIFY OTP</h3>
                <button onclick="closeAuthModal()" class="p-2 hover:bg-gray-100">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <p class="mb-4 text-gray-600">Enter the OTP sent to <strong>${identifier}</strong></p>
            <form onsubmit="handleOTPVerification(event);" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">OTP Code</label>
                    <input type="text" id="otpCode" class="form-input text-center text-2xl tracking-widest" maxlength="6" required>
                </div>
                <button type="submit" id="otpSubmitBtn" class="btn-primary w-full">VERIFY OTP</button>
            </form>
            <div class="mt-4 text-center">
                <button onclick="resendOTP()" class="sm text-gray-600 hover:underline">Resend OTP</button>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function showResetPasswordModal() {
    const modal = document.getElementById('authModal');
    const content = document.getElementById('authContent');

    content.innerHTML = `
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="font-display text-2xl tracking-wider">RESET PASSWORD</h3>
                <button onclick="closeAuthModal()" class="p-2 hover:bg-gray-100">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <form onsubmit="handleResetPassword(event);" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">New Password</label>
                    <input type="password" id="newPasswordReset" class="form-input" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Confirm Password</label>
                    <input type="password" id="confirmPasswordReset" class="form-input" required>
                </div>
                <button type="submit" id="resetSubmitBtn" class="btn-primary w-full">RESET PASSWORD</button>
            </form>
        </div>
    `;

    modal.classList.add('active');
}