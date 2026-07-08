import os

base_path = 'd:/Leoweb/frontend/'

with open(os.path.join(base_path, 'admin-pages.html'), 'r', encoding='utf-8') as f:
    content = f.read()

# Generate admin-projects.html
projects_content = content.replace('Manage Pages - Admin Dashboard', 'Manage Projects - Admin Dashboard')
projects_content = projects_content.replace('<h2 class="h4 mb-0">Pages Management</h2>', '<h2 class="h4 mb-0">Projects Management</h2>')
projects_content = projects_content.replace('id="addPageBtn"><i class="bi bi-plus-circle"></i> Add New Page', 'id="addProjectBtn"><i class="bi bi-plus-circle"></i> Add New Project')
projects_content = projects_content.replace('<table class="table table-hover align-middle" id="pagesTable">', '<table class="table table-hover align-middle" id="projectsTable">')
projects_content = projects_content.replace('<th>Slug</th>', '<th>Image</th>\n                                <th>Title</th>')
projects_content = projects_content.replace('<th>Last Updated</th>', '<th>Date</th>\n                                <th>Category</th>\n                                <th>Status</th>')
projects_content = projects_content.replace('src="/js/admin-pages.js"', 'src="/js/admin-projects.js"')
# Set active state
projects_content = projects_content.replace('<a class="nav-link " href="/admin/projects">', '<a class="nav-link active" href="/admin/projects">')
projects_content = projects_content.replace('<a class="nav-link active" href="/admin/pages">', '<a class="nav-link " href="/admin/pages">')

# Modify modal for Projects
modal_old = """
    <!-- Add/Edit Page Modal -->
    <div class="modal fade" id="pageModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="pageModalTitle">Add New Page</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="pageForm">
                        <div class="mb-3">
                            <label class="form-label">Page Title</label>
                            <input type="text" class="form-control" id="pageTitle" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">URL Slug (e.g., about-us)</label>
                            <input type="text" class="form-control" id="pageSlug" required>
                            <div class="form-text">Used for the page URL: /page/[slug]</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">HTML Content</label>
                            <textarea class="form-control" id="pageContent" rows="10" placeholder="<div class='container'>...</div>"></textarea>
                            <div class="form-text">You can write full HTML here. It will be injected into the main template.</div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="savePageBtn">Save Page</button>
                </div>
            </div>
        </div>
    </div>"""

modal_projects = """
    <!-- Add/Edit Project Modal -->
    <div class="modal fade" id="projectModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="projectModalTitle">Add New Project</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="projectForm">
                        <input type="hidden" id="projectId">
                        <div class="mb-3">
                            <label class="form-label">Project Title</label>
                            <input type="text" class="form-control" id="projectTitle" required>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Date/Year (e.g. L.Y. 2024/25)</label>
                                <input type="text" class="form-control" id="projectDate">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Category (e.g. Health, Education)</label>
                                <input type="text" class="form-control" id="projectCategory">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="projectStatus">
                                    <option value="Completed">Completed</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Upcoming">Upcoming</option>
                                </select>
                            </div>
                            <div class="col-md-6 d-flex align-items-center mt-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="projectIsSignature">
                                    <label class="form-check-label" for="projectIsSignature">Signature Project</label>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Image URL (e.g. images/award.jpg)</label>
                            <input type="text" class="form-control" id="projectImage">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="projectDescription" rows="4"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveProjectBtn">Save Project</button>
                </div>
            </div>
        </div>
    </div>"""

projects_content = projects_content.replace(modal_old, modal_projects)

with open(os.path.join(base_path, 'admin-projects.html'), 'w', encoding='utf-8') as f:
    f.write(projects_content)

# Generate admin-events.html
events_content = content.replace('Manage Pages - Admin Dashboard', 'Manage Events - Admin Dashboard')
events_content = events_content.replace('<h2 class="h4 mb-0">Pages Management</h2>', '<h2 class="h4 mb-0">Events Management</h2>')
events_content = events_content.replace('id="addPageBtn"><i class="bi bi-plus-circle"></i> Add New Page', 'id="addEventBtn"><i class="bi bi-plus-circle"></i> Add New Event')
events_content = events_content.replace('<table class="table table-hover align-middle" id="pagesTable">', '<table class="table table-hover align-middle" id="eventsTable">')
events_content = events_content.replace('<th>Slug</th>', '<th>Image</th>\n                                <th>Title</th>')
events_content = events_content.replace('<th>Last Updated</th>', '<th>Date</th>\n                                <th>Location</th>\n                                <th>Status</th>')
events_content = events_content.replace('src="/js/admin-pages.js"', 'src="/js/admin-events.js"')
events_content = events_content.replace('<a class="nav-link " href="/admin/events">', '<a class="nav-link active" href="/admin/events">')
events_content = events_content.replace('<a class="nav-link active" href="/admin/pages">', '<a class="nav-link " href="/admin/pages">')

modal_events = """
    <!-- Add/Edit Event Modal -->
    <div class="modal fade" id="eventModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="eventModalTitle">Add New Event</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="eventForm">
                        <input type="hidden" id="eventId">
                        <div class="mb-3">
                            <label class="form-label">Event Title</label>
                            <input type="text" class="form-control" id="eventTitle" required>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Date (e.g. Feb 2026 or Dec 10, 2024)</label>
                                <input type="text" class="form-control" id="eventDate">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Location (e.g. Kathmandu)</label>
                                <input type="text" class="form-control" id="eventLocation">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="eventStatus">
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Past Event">Past Event</option>
                                    <option value="Ongoing">Ongoing</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Image URL (e.g. images/event.jpg)</label>
                                <input type="text" class="form-control" id="eventImage">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="eventDescription" rows="4"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveEventBtn">Save Event</button>
                </div>
            </div>
        </div>
    </div>"""

events_content = events_content.replace(modal_old, modal_events)

with open(os.path.join(base_path, 'admin-events.html'), 'w', encoding='utf-8') as f:
    f.write(events_content)
