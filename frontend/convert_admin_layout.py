import os
import re

files = [
    'admin.html',
    'admin-members.html',
    'admin-contacts.html',
    'admin-newsletter.html',
    'admin-menu.html',
    'admin-pages.html'
]

sidebar_template = """
    <div id="wrapper" class="d-flex">
        <!-- Sidebar -->
        <nav id="sidebar" class="bg-dark text-white p-3 d-flex flex-column">
            <a class="navbar-brand text-white d-flex align-items-center mb-4" href="/admin">
                <img src="images/logo.png" alt="Logo" height="40" class="me-2 bg-white rounded">
                <span class="fs-5 fw-bold">Admin Panel</span>
            </a>
            <hr class="text-white-50">
            <ul class="nav nav-pills flex-column mb-auto">
                <li class="nav-item"><a class="nav-link {active_dashboard}" href="/admin"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a></li>
                <li class="nav-item"><a class="nav-link {active_members}" href="/admin/members"><i class="bi bi-people me-2"></i> Members</a></li>
                <li class="nav-item"><a class="nav-link {active_contacts}" href="/admin/contacts"><i class="bi bi-envelope me-2"></i> Contacts</a></li>
                <li class="nav-item"><a class="nav-link {active_newsletter}" href="/admin/newsletter"><i class="bi bi-newspaper me-2"></i> Newsletter</a></li>
                <li class="nav-item"><a class="nav-link {active_menu}" href="/admin/menu"><i class="bi bi-list me-2"></i> Menu</a></li>
                <li class="nav-item"><a class="nav-link {active_pages}" href="/admin/pages"><i class="bi bi-file-earmark-text me-2"></i> Pages</a></li>
            </ul>
            <hr class="text-white-50">
            <div>
                <a href="#" class="nav-link text-white" id="logoutLink"><i class="bi bi-box-arrow-right me-2"></i> Logout</a>
            </div>
        </nav>

        <!-- Page Content -->
        <div id="page-content-wrapper" class="flex-grow-1 d-flex flex-column min-vh-100">
            <!-- Top Navbar for mobile toggle -->
            <nav class="navbar navbar-light bg-light border-bottom d-md-none px-3">
                <button class="btn btn-outline-dark" id="sidebarToggle"><i class="bi bi-list fs-4"></i></button>
                <span class="navbar-brand mb-0 h1 ms-2">Admin Panel</span>
            </nav>
"""

style_addition = """
    <style>
        body { overflow-x: hidden; }
        #sidebar { min-width: 250px; max-width: 250px; min-height: 100vh; transition: all 0.3s; }
        #sidebar .nav-link { color: rgba(255,255,255,0.8); border-radius: 6px; margin-bottom: 5px; }
        #sidebar .nav-link:hover, #sidebar .nav-link.active { color: #fff; background: rgba(255,255,255,0.1); }
        #page-content-wrapper { width: 100%; }
        .admin-footer { margin-top: auto; background-color: #000; padding: 16px 20px; text-align: center; color: #fff; font-size: 0.875rem; }
        @media (max-width: 768px) {
            #sidebar { margin-left: -250px; position: fixed; z-index: 1000; }
            #sidebar.active { margin-left: 0; }
        }
"""

for file in files:
    path = os.path.join('d:/Leoweb/frontend', file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has wrapper
    if 'id="wrapper"' in content:
        print(f"Skipping {file}, already processed.")
        continue
    
    # Active states
    actives = {
        'active_dashboard': 'active' if file == 'admin.html' else '',
        'active_members': 'active' if file == 'admin-members.html' else '',
        'active_contacts': 'active' if file == 'admin-contacts.html' else '',
        'active_newsletter': 'active' if file == 'admin-newsletter.html' else '',
        'active_menu': 'active' if file == 'admin-menu.html' else '',
        'active_pages': 'active' if file == 'admin-pages.html' else ''
    }
    
    # Replace style block
    style_pattern = re.compile(r'<style>.*?</style>', re.DOTALL)
    # the existing files might have different styles for tables etc., so we should just replace the nav styles.
    # actually, let's just replace the specific nav styles.
    content = re.sub(r'\.admin-nav.*?transform: translateY\(-2px\); \}', '', content, flags=re.DOTALL)
    content = re.sub(r'\.admin-nav \.nav-link\.active.*?text-decoration: none; \}', '', content, flags=re.DOTALL)
    
    # Insert new styles at the beginning of existing <style>
    content = content.replace('<style>', style_addition, 1)
    
    # Replace the existing nav bar and body setup
    nav_pattern = re.compile(r'<nav class="navbar navbar-expand-lg navbar-light admin-nav">.*?</nav>', re.DOTALL)
    
    sidebar_html = sidebar_template.format(**actives)
    
    content = content.replace('<body class="d-flex flex-column min-vh-100">', '<body>')
    content = nav_pattern.sub(sidebar_html, content)
    
    # Need to add </div> at the end for the wrapper
    # Replace </body> with script for sidebar toggle + closing divs + </body>
    script_and_close = """
    </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const toggle = document.getElementById('sidebarToggle');
            if(toggle) {
                toggle.addEventListener('click', function() {
                    document.getElementById('sidebar').classList.toggle('active');
                });
            }
        });
    </script>
</body>"""
    content = content.replace('</body>', script_and_close)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {file}")
