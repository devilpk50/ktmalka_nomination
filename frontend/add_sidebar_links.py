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

new_links = """                <li class="nav-item"><a class="nav-link {active_projects}" href="/admin/projects"><i class="bi bi-briefcase me-2"></i> Projects</a></li>
                <li class="nav-item"><a class="nav-link {active_events}" href="/admin/events"><i class="bi bi-calendar-event me-2"></i> Events</a></li>"""

for file in files:
    path = os.path.join('d:/Leoweb/frontend', file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Don't add if already there
    if 'href="/admin/projects"' in content:
        print(f"Links already exist in {file}")
        continue
    
    # Insert after Pages link
    pages_link_pattern = re.compile(r'(<li class="nav-item"><a class="nav-link .*?" href="/admin/pages"><i class="bi bi-file-earmark-text me-2"></i> Pages</a></li>)')
    
    formatted_links = new_links.format(active_projects='', active_events='')
    content = pages_link_pattern.sub(r'\1\n' + formatted_links, content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Added sidebar links to {file}")
