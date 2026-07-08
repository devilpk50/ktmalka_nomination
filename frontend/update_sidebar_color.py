import os

files = [
    'admin.html',
    'admin-members.html',
    'admin-contacts.html',
    'admin-newsletter.html',
    'admin-menu.html',
    'admin-pages.html'
]

for file in files:
    path = os.path.join('d:/Leoweb/frontend', file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Change background class of sidebar
    content = content.replace('nav id="sidebar" class="bg-dark text-white', 'nav id="sidebar" class="bg-light text-dark')
    
    # Change text-white to text-dark for brand and links (some are hardcoded in html)
    content = content.replace('class="navbar-brand text-white', 'class="navbar-brand text-dark')
    content = content.replace('hr class="text-white-50"', 'hr class="text-secondary"')
    content = content.replace('class="nav-link text-white', 'class="nav-link text-dark')
    
    # Update the CSS block for sidebar link colors
    old_css = """#sidebar .nav-link { color: rgba(255,255,255,0.8); border-radius: 6px; margin-bottom: 5px; }
        #sidebar .nav-link:hover, #sidebar .nav-link.active { color: #fff; background: rgba(255,255,255,0.1); }"""
    
    new_css = """#sidebar .nav-link { color: #495057; border-radius: 6px; margin-bottom: 5px; font-weight: 500; }
        #sidebar .nav-link:hover { color: #0d6efd; background: rgba(13, 110, 253, 0.05); }
        #sidebar .nav-link.active { color: #0d6efd; background: rgba(13, 110, 253, 0.1); font-weight: 600; }"""
    
    content = content.replace(old_css, new_css)
    
    # Also fix background color of the sidebar explicitly in CSS in case bg-light isn't enough
    content = content.replace('#sidebar { min-width: 250px;', '#sidebar { min-width: 250px; background-color: #f8f9fa; border-right: 1px solid #dee2e6;')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated sidebar color in {file}")
