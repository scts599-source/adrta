#!/usr/bin/env python3
import re
import os

BASE_DIR = r'C:\Users\xavit\Downloads\adrta'
INDEX_HTML = os.path.join(BASE_DIR, 'index.html')

# Read index.html
with open(INDEX_HTML, 'r', encoding='utf-8') as f:
    html_content = f.read()
    html_lines = html_content.split('\n')

script1_start = 2466   # 0-indexed
script1_end = 8512     # 0-indexed
script2_start = 8514
script2_end = 8514

# Extract inline JS
def strip_script_tags(block_lines):
    lines = list(block_lines)
    if not lines:
        return ''
    if lines[0].strip().startswith('<script>'):
        lines = lines[1:]
    if lines and lines[-1].strip() == '</script>':
        lines = lines[:-1]
    return '\n'.join(lines)

big_block = html_lines[script1_start:script1_end+1]
tiny_block = html_lines[script2_start:script2_end+1]

# We want to keep tiny block (page loader) inline, extract big block
js_big = strip_script_tags(big_block)
js_tiny = strip_script_tags(tiny_block)

# Extract functions preserving original signature
def extract_functions_preserve_sig(js_text):
    funcs = {}
    # Pattern: (async )?function name(params) {
    # We want to capture the full signature up to and including the opening brace
    pattern = re.compile(r'((?:async\s+)?function\s+(\w+)\s*(\([^)]*\))\s*\{)', re.DOTALL)
    for m in pattern.finditer(js_text):
        full_sig_start = m.start()
        signature = m.group(1)  # e.g., "function name(params) {"
        name = m.group(2)
        params = m.group(3)
        start = m.end()
        depth = 1
        pos = start
        while pos < len(js_text) and depth > 0:
            if js_text[pos] == '{':
                depth += 1
            elif js_text[pos] == '}':
                depth -= 1
            pos += 1
        body = js_text[start:pos-1]
        funcs[name] = {
            'signature': signature,
            'body': body,
            'full': f'{signature}\n{body}\n}}'
        }
    return funcs

inline_funcs = extract_functions_preserve_sig(js_big)
print(f"Found {len(inline_funcs)} functions in big inline JS block")

# Read all external JS files and find their functions
external_files = ['state.js', 'api.js', 'products.js', 'cart.js', 'auth.js', 'ui.js', 'app.js']
external_funcs = {}

for fname in external_files:
    fpath = os.path.join(BASE_DIR, 'js', fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    funcs = extract_functions_preserve_sig(content)
    external_funcs[fname] = funcs
    print(f"  {fname}: {len(funcs)} functions")

# Find missing functions
all_external_names = set()
for funcs in external_funcs.values():
    all_external_names.update(funcs.keys())

missing = {}
for name, data in inline_funcs.items():
    if name not in all_external_names:
        missing[name] = data

print(f"\nMissing functions: {len(missing)}")
for name in sorted(missing.keys()):
    print(f"  {name}")

# Write missing functions to a new file 'js/app-extended.js'
extended_path = os.path.join(BASE_DIR, 'js', 'app-extended.js')

# Check for undefined global variables that might cause issues
# Common ones: appliedCouponCode, appliedCouponDiscount, cartItems (from legacy)
# These should be defined in the file if used
with open(extended_path, 'w', encoding='utf-8') as f:
    f.write('// ==================== ADDITIONAL APP FUNCTIONS ====================\n\n')
    f.write('// Global variables used by functions in this file\n')
    f.write('let appliedCouponCode = null;\n')
    f.write('let appliedCouponDiscount = 0;\n\n')
    
    for name in sorted(missing.keys()):
        data = missing[name]
        f.write(f'{data["full"]}\n\n')

print(f"\nWritten missing functions to js/app-extended.js")

# Now remove big inline script block from index.html
# Keep tiny script block (page loader) inline
new_html_lines = html_lines[:script1_start]
# Insert tiny script block back
for line in tiny_block.split('\n'):
    new_html_lines.append(line)
new_html_lines.extend(html_lines[script2_end+1:])

new_html = '\n'.join(new_html_lines)

# Add script tag for new file before </body>
if '</body>' in new_html:
    new_html = new_html.replace(
        '</body>',
        '    <script src="/js/app-extended.js"></script>\n</body>'
    )

with open(INDEX_HTML, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Removed big inline script block from index.html")
print(f"New line count: {len(new_html.split(chr(10)))}")
