// Projects Status Checker - Updates project status based on dates
document.addEventListener('DOMContentLoaded', function() {
    const currentYear = new Date().getFullYear();
    
    // Project date mappings (project ID -> end year and whether it's explicitly ongoing)
    const projectDates = {
        1: { endYear: 2025, isOngoing: true }, // 2024-2025 (Ongoing)
        2: { endYear: 2025, isOngoing: true }, // 2024-2025 (Ongoing)
        3: { endYear: 2024, isOngoing: true }, // 2024 (Ongoing) - explicitly ongoing
        4: { endYear: 2024, isOngoing: false }, // 2024 - already completed
        5: { endYear: 2025, isOngoing: true }, // 2024-2025 (Ongoing)
        6: { endYear: 2024, isOngoing: false }  // 2024 - should be completed
    };
    
    // Function to check if project should be completed
    // Since we're in 2026, all projects ending in 2025 or earlier are completed
    function isProjectCompleted(projectId) {
        const projectDate = projectDates[projectId];
        if (!projectDate) return false;
        
        // If end year is before current year (2026), it's completed
        if (projectDate.endYear < currentYear) {
            return true;
        }
        
        return false;
    }
    
    // Update status badges on projects page
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        const projectId = index + 1; // Projects are 1-indexed
        // Find the badge container and get the status badge (last badge, not the category badge)
        const badgeContainer = card.querySelector('.mt-3');
        if (badgeContainer) {
            const badges = badgeContainer.querySelectorAll('.badge');
            // The status badge is the last one (second badge) - skip category badges
            // Only update badges that are status badges (contain "Ongoing" or "Completed" text)
            badges.forEach(badge => {
                const badgeText = badge.textContent.trim();
                if (badgeText === 'Ongoing' || badgeText === 'Completed') {
                    // This is the status badge
                    if (isProjectCompleted(projectId)) {
                        badge.textContent = 'Completed';
                        badge.className = 'badge bg-secondary';
                    } else {
                        badge.textContent = 'Ongoing';
                        badge.className = 'badge bg-success';
                    }
                }
            });
        }
    });
});
