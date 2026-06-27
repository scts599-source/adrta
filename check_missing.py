#!/usr/bin/env python3
import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

handlers = re.findall(r'on(?:click|submit|change|input|keyup|keydown|keypress|focus|blur|mouseover|mouseout|mouseenter|mouseleave|scroll|resize|load|error|DOMContentLoaded)="([^"]+)"', html)
func_calls = set()
for h in handlers:
    names = re.findall(r'([a-zA-Z_]\w*)\s*\(', h)
    func_calls.update(names)

print('Functions called from HTML handlers:')
for name in sorted(func_calls):
    print(f'  {name}')
print(f'\nTotal: {len(func_calls)}')

# Check which exist in external files
external_files = ['state.js', 'api.js', 'products.js', 'cart.js', 'auth.js', 'ui.js', 'app.js']
all_existing = set()
for fname in external_files:
    with open(os.path.join('js', fname), 'r', encoding='utf-8') as f:
        content = f.read()
    funcs = set(re.findall(r'function\s+(\w+)', content))
    all_existing.update(funcs)

extended = set()
with open('js/app-extended.js', 'r', encoding='utf-8') as f:
    content = f.read()
    funcs = set(re.findall(r'function\s+(\w+)', content))
    extended.update(funcs)

print(f'\nIn external files: {len(all_existing)}')
print(f'In app-extended.js: {len(extended)}')

missing = func_calls - all_existing - extended
print(f'\nMISSING from ALL JS files: {len(missing)}')
for name in sorted(missing):
    print(f'  {name}')
