import os
import re
import glob

html_files = glob.glob('d:/Leoweb/frontend/admin*.html')

new_link = '                <li class="nav-item"><a class="nav-link " href="/admin/sliders"><i class="bi bi-images me-2"></i> Sliders</a></li>'

for file in html_files:
    if 'admin-sliders.html' in file:
        continue
        
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'href="/admin/sliders"' in content:
        print(f"Link already exists in {os.path.basename(file)}")
        continue
        
    events_link_pattern = re.compile(r'(<li class="nav-item"><a class="nav-link .*?" href="/admin/events"><i class="bi bi-calendar-event me-2"></i> Events</a></li>)')
    
    if events_link_pattern.search(content):
        content = events_link_pattern.sub(r'\1\n' + new_link, content)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added slider link to {os.path.basename(file)}")
