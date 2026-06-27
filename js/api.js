// ==================== API BASE ====================
const API_BASE = '/api';

// ==================== MAINTENANCE CHECK ====================
async function checkMaintenanceStatus() {
    try {
        const res = await fetch(`${API_BASE}/maintenance/status`);
        const data = await res.json();

        if (data.maintenance) {
            showMaintenanceOverlay(data.message, data.endsAt);
        }
    } catch (e) {
        console.error('Maintenance check error:', e);
    }
}

function showMaintenanceOverlay(message, endsAt) {
    const overlay = document.getElementById("maintenanceOverlay");
    if (!overlay) return;
    overlay.style.display = "flex";
    document.getElementById('maintenanceMessage').textContent = message;

    if (endsAt) {
        const endTime = new Date(endsAt);
        document.getElementById('maintenanceEnds').textContent = `Expected back: ${endTime.toLocaleString()}`;
    }
}

// ==================== IMAGE PREVIEW SETUP - FIXED ====================
function setupImagePreview() {
    const imageInput = document.getElementById('productImageInput');
    if (!imageInput) return;

    imageInput.addEventListener('change', async function(e) {
        const files = Array.from(e.target.files);
        if (!files.length) {
            AppState.selectedProductImages = [];
            return;
        }

        // Check file sizes
        const maxSize = 20 * 1024 * 1024; // 20MB per image before compression
        for (let file of files) {
            if (file.size > maxSize) {
                alert(`Image ${file.name} is too large! Maximum size is 20MB per image.`);
                imageInput.value = '';
                AppState.selectedProductImages = [];
                return;
            }
        }

        AppState.selectedProductImages = [];
        const preview = document.getElementById('imagePreviewContainer');
        if (preview) {
            preview.innerHTML = '<p class="text-sm text-gray-600">Compressing images...</p>';
        }

        try {
            for (let [index, file] of files.entries()) {
                const compressed = await compressImageFile(file, 800);
                AppState.selectedProductImages.push(compressed);

                if (preview) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'relative';
                    previewItem.innerHTML = `
                        <img src="${compressed}" alt="Preview ${index + 1}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px;">
                        <button type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" onclick="removeImagePreview(${index})">×</button>
                        ${index === 0 ? '<span class="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">Main</span>' : ''}
                    `;

                    if (index === 0) {
                        preview.innerHTML = '';
                    }
                    preview.appendChild(previewItem);
                }
            }

            console.log(`✅ Loaded and compressed ${AppState.selectedProductImages.length} images`);
        } catch (error) {
            console.error('Image compression error:', error);
            alert('Error processing images. Please try again.');
            imageInput.value = '';
            AppState.selectedProductImages = [];
            if (preview) preview.innerHTML = '';
        }
    });
}

function removeImagePreview(index) {
    AppState.selectedProductImages.splice(index, 1);
    const input = document.getElementById('productImageInput');
    if (input) input.value = '';

    // Re-render preview
    const preview = document.getElementById('imagePreviewContainer');
    if (preview) {
        preview.innerHTML = '';
        AppState.selectedProductImages.forEach((img, idx) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'relative';
            previewItem.innerHTML = `
                <img src="${img}" alt="Preview ${idx + 1}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px;">
                <button type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" onclick="removeImagePreview(${idx})">×</button>
                ${idx === 0 ? '<span class="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">Main</span>' : ''}
            `;
            preview.appendChild(previewItem);
        });
    }
}

function clearImagePreview() {
    const imageInput = document.getElementById('productImageInput');
    const preview = document.getElementById('imagePreviewContainer');
    if (imageInput) imageInput.value = '';
    if (preview) preview.innerHTML = '';
    AppState.selectedProductImages = [];
}

// ==================== VARIANT IMAGE PREVIEW SETUP ====================
function setupVariantImagePreview() {
    const variantImageInput = document.getElementById('variantImageInput');
    if (!variantImageInput) return;

    variantImageInput.addEventListener('change', async function(e) {
        const files = Array.from(e.target.files);

        // Reset if no files selected
        if (!files.length) {
            AppState.variantImages = [];
            return;
        }

        // Validate: Check file count limit
        const maxImages = 5; // Maximum 5 images per variant
        if (files.length > maxImages) {
            alert(`Maximum ${maxImages} images allowed per variant. Please select fewer images.`);
            variantImageInput.value = '';
            AppState.variantImages = [];
            return;
        }

        // Validate: Check individual file sizes
        const maxSize = 20 * 1024 * 1024; // 20MB per image
        for (let file of files) {
            if (file.size > maxSize) {
                alert(`Image ${file.name} is too large! Maximum size is 20MB per image.`);
                variantImageInput.value = '';
                AppState.variantImages = [];
                return;
            }
        }

        // Initialize
        AppState.variantImages = [];
        const preview = document.getElementById('variantImagePreview');
        preview.innerHTML = '<p class="text-sm text-gray-600">⏳ Compressing images...</p>';

        try {
            // Process images sequentially with compression
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Compress image to reduce upload size (90%+ reduction)
                const compressedBase64 = await compressImage(file, 800, 0.75);
                AppState.variantImages.push(compressedBase64);
            }

            // Clear loading message
            preview.innerHTML = '';

            // Display preview thumbnails
            AppState.variantImages.forEach((base64, index) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'relative inline-block mr-2 mb-2';
                previewItem.innerHTML = `
                    <img src="${base64}"
                         alt="Variant Preview ${index + 1}"
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 2px solid #ddd;">
                    <button type="button"
                            class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            onclick="removeVariantImagePreview(${index})"
                            style="transform: translate(25%, -25%);">×</button>
                `;
                preview.appendChild(previewItem);
            });

            console.log(`✅ Loaded and compressed ${AppState.variantImages.length} variant images`);
        } catch (error) {
            console.error('❌ Image compression error:', error);
            preview.innerHTML = '<p class="text-sm text-red-600">Failed to process images. Please try again.</p>';
            alert('Failed to process images. Please try again.');
            variantImageInput.value = '';
            AppState.variantImages = [];
        }
    });
}

/**
 * Removes a specific image from variant preview
 * @param {number} index - Index of image to remove
 */
function removeVariantImagePreview(index) {
    AppState.variantImages.splice(index, 1);

    const preview = document.getElementById('variantImagePreview');
    preview.innerHTML = '';

    // Re-render remaining images
    AppState.variantImages.forEach((base64, i) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'relative inline-block mr-2 mb-2';
        previewItem.innerHTML = `
            <img src="${base64}"
                 alt="Variant Preview ${i + 1}"
                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 2px solid #ddd;">
            <button type="button"
                    class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    onclick="removeVariantImagePreview(${i})"
                    style="transform: translate(25%, -25%);">×</button>
        `;
        preview.appendChild(previewItem);
    });

    console.log(`🗑️ Removed image ${index}, ${AppState.variantImages.length} remaining`);
}

// ==================== IMAGE COMPRESSION HELPER ====================
async function compressImageFile(file, maxSizeKB = 800) {
    return new Promise((resolve, reject

        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if too large
                const maxWidth = 1920;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Try different quality levels
                let quality = 0.85;
                let result = canvas.toDataURL('image/jpeg', quality);

                // Reduce quality if still too large
                while (result.length / 1024 > maxSizeKB && quality > 0.5) {
                    quality -= 0.1;
                    result = canvas.toDataURL('image/jpeg', quality);
                }

                console.log(`✅ Compressed: ${(e.target.result.length/1024).toFixed(1)}KB → ${(result.length/1024).toFixed(1)}KB`);
                resolve(result);
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Legacy alias for backward compatibility
async function compressImage(file, maxWidth = 800, quality = 0.75) {
    return await compressImageFile(file, 800); // Using default 800KB limit
}