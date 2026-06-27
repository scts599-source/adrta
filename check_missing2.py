#!/usr/bin/env python3
import re, os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all function-like calls from HTML event handlers
handler_pattern = re.compile(r'on(?:click|submit|change|input|keyup|keydown|keypress|focus|blur|mouseover|mouseout|mouseenter|mouseleave|scroll|resize|load|error|DOMContentLoaded)="([^"]+)"')
html_calls = set()
for m in handler_pattern.finditer(html):
    handler = m.group(1)
    calls = re.findall(r'([a-zA-Z_]\w*)\s*\(', handler)
    html_calls.update(calls)

# Filter out JS built-ins and obvious non-functions
js_builtins = {'document', 'window', 'console', 'Math', 'JSON', 'fetch', 'Promise', 'setTimeout', 'clearInterval', 'confirm', 'alert', 'navigator', 'history', 'location', 'this', 'event', 'e', 'preventDefault', 'stopPropagation', 'getElementById', 'querySelector', 'querySelectorAll', 'classList', 'style', 'value', 'innerHTML', 'textContent', 'display', 'none', 'appendChild', 'createElement', 'remove', 'reset', 'addEventListener', 'onclick', 'onerror', 'trim', 'toUpperCase', 'toLowerCase', 'split', 'replace', 'match', 'includes', 'startsWith', 'endsWith', 'length', 'push', 'pop', 'shift', 'unshift', 'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex', 'some', 'every', 'sort', 'join', 'slice', 'splice', 'concat', 'indexOf', 'lastIndexOf', 'keys', 'values', 'entries', 'from', 'isArray', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'then', 'catch', 'finally', 'throw', 'await', 'async', 'yield', 'true', 'false', 'null', 'undefined', 'void', 'delete', 'typeof', 'new', 'instanceof', 'in', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'const', 'let', 'var', 'function'}

html_calls = {c for c in html_calls if c not in js_builtins and len(c) > 1}

# Read all JS files
all_js_funcs = set()
for fname in ['state.js', 'api.js', 'products.js', 'cart.js', 'auth.js', 'ui.js', 'app.js', 'app-extended.js']:
    fpath = os.path.join('js', fname)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        funcs = set(re.findall(r'function\s+(\w+)', content))
        all_js_funcs.update(funcs)

missing = html_calls - all_js_funcs
print('Functions called from HTML but MISSING from ALL JS files:')
for name in sorted(missing):
    print(f'  {name}')
print(f'\nTotal HTML calls: {len(html_calls)}')
print(f'Total defined funcs: {len(all_js_funcs)}')
print(f'Missing: {len(missing)}')
