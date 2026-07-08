document.addEventListener('DOMContentLoaded', async () => {
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Get project ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        document.getElementById('projectTitle').textContent = 'Project Not Found';
        document.getElementById('projectDescription').textContent = 'Please go back and select a valid project.';
        return;
    }

    try {
        const res = await fetch(`/api/projects?id=${projectId}`);
        if (!res.ok) throw new Error('Project not found');
        
        const project = await res.json();
        
        // Update Title
        const titleElement = document.getElementById('projectTitle');
        if (titleElement) titleElement.textContent = project.title;
        
        // Use Category or Signature string as Subtitle
        const subtitleElement = document.getElementById('projectSubtitle');
        if (subtitleElement) {
            subtitleElement.textContent = project.is_signature ? 'Signature Project' : (project.category || 'Project Detail');
        }
        
        // Update project image
        const projectImage = document.getElementById('projectImage');
        if (projectImage) {
            const imgUrl = project.image_url ? (project.image_url.startsWith('http') || project.image_url.startsWith('/') ? project.image_url : '/' + project.image_url) : '';
            
            if (imgUrl) {
                projectImage.style.background = 'none';
                projectImage.style.display = 'block';
                projectImage.style.alignItems = 'unset';
                projectImage.style.justifyContent = 'unset';
                projectImage.innerHTML = `<img src="${imgUrl}" alt="${project.title}" class="detail-image" onerror="this.style.display='none'; this.parentElement.style.display='flex'; this.parentElement.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; this.parentElement.innerHTML='<i class=\\'bi bi-heart-pulse text-white\\' style=\\'font-size: 80px;\\'></i>';">`;
            } else {
                projectImage.style.background = project.is_signature ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                projectImage.style.display = 'flex';
                projectImage.style.alignItems = 'center';
                projectImage.style.justifyContent = 'center';
                projectImage.innerHTML = `<i class="bi ${project.is_signature ? 'bi-heart-pulse' : 'bi-ribbon'} text-white" style="font-size: 80px;"></i>`;
            }
        }
        
        // Update description (use details if available, fallback to description)
        const descriptionElement = document.getElementById('projectDescription');
        if (descriptionElement) {
            descriptionElement.textContent = project.details || project.description || 'No description provided.';
            descriptionElement.innerHTML = descriptionElement.textContent.replace(/\n/g, '<br>');
        }
        
        // Update sidebar information
        const durationElement = document.getElementById('projectDuration');
        if (durationElement) {
            let durationText = project.date || '-';
            if (project.date_from && project.date_to) {
                durationText += ` (${formatDate(project.date_from)} - ${formatDate(project.date_to)})`;
            } else if (project.date_from) {
                durationText += ` (From ${formatDate(project.date_from)})`;
            }
            durationElement.textContent = durationText;
        }
        
        const categoryElement = document.getElementById('projectCategory');
        if (categoryElement) categoryElement.textContent = project.category || '-';
        
        const locationElement = document.getElementById('projectLocation');
        if (locationElement) locationElement.textContent = project.location || '-';
        
        // Update status badge
        const actualStatus = project.status || 'Ongoing';
        const statusBadge = actualStatus === 'Ongoing' 
            ? '<span class="badge bg-success">Ongoing</span>'
            : (actualStatus === 'Completed' ? '<span class="badge bg-primary">Completed</span>' : '<span class="badge bg-secondary">Upcoming</span>');
            
        const statusElement = document.getElementById('projectStatus');
        if (statusElement) statusElement.innerHTML = statusBadge;
        
        // Hide unused sections since they are not in our dynamic DB schema
        const impactElement = document.getElementById('projectImpact');
        if (impactElement && impactElement.parentElement) impactElement.parentElement.style.display = 'none';
        
        const objectivesElement = document.getElementById('projectObjectives');
        if (objectivesElement && objectivesElement.parentElement) {
            if (project.objectives && project.objectives.trim() !== '') {
                objectivesElement.parentElement.style.display = 'block';
                const objectivesHtml = project.objectives.split('\n')
                    .filter(obj => obj.trim() !== '')
                    .map(objective => `<li class="mb-3"><i class="bi bi-arrow-right-circle-fill text-primary me-2"></i>${objective}</li>`)
                    .join('');
                objectivesElement.innerHTML = objectivesHtml;
            } else {
                objectivesElement.parentElement.style.display = 'none';
            }
        }
        
        const activitiesElement = document.getElementById('projectActivities');
        if (activitiesElement && activitiesElement.parentElement) activitiesElement.parentElement.style.display = 'none';
        
        const partnersElement = document.getElementById('projectPartners');
        if (partnersElement && partnersElement.parentElement) partnersElement.parentElement.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading project details:', error);
        const descriptionElement = document.getElementById('projectDescription');
        if (descriptionElement) {
            descriptionElement.textContent = 'Error loading project details. Please try again later.';
        }
        document.getElementById('projectTitle').textContent = 'Project Not Found';
        document.getElementById('projectSubtitle').textContent = '';
    }
});
