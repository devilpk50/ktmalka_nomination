import os
import re

files = [
    'admin.html',
    'admin-members.html',
    'admin-contacts.html',
    'admin-newsletter.html',
    'admin-menu.html',
    'admin-pages.html',
    'admin-login.html'
]

for file in files:
    path = os.path.join('d:/Leoweb/frontend', file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix CSS
    content = content.replace('href="css/style.css"', 'href="/css/style.css"')
    # Fix logo
    content = content.replace('src="images/logo.png"', 'src="/images/logo.png"')
    # Fix JS
    content = re.sub(r'src="js/admin-([a-zA-Z0-9-]+)\.js"', r'src="/js/admin-\1.js"', content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed paths in {file}")
