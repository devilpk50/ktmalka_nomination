// Admin Dashboard - load counts and animate numbers (same as home page)
function animateCount(el, target, duration = 1500) {
    const numTarget = Math.max(0, parseInt(target, 10) || 0);
    let start = 0;
    const startTime = performance.now();

    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(progress * (numTarget - start) + start);
        el.textContent = value;
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = numTarget;
        }
    }

    requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', async function () {
    const ok = await requireAdmin();
    if (!ok) return;

    document.getElementById('logoutLink').addEventListener('click', function (e) {
        e.preventDefault();
        adminLogout();
    });

    const membersEl = document.getElementById('membersCount');
    const contactEl = document.getElementById('contactCount');
    const newsletterEl = document.getElementById('newsletterCount');

    try {
        const [contactRes, membershipRes, newsletterRes] = await Promise.all([
            adminFetch(`${API_BASE}/api/contact?page=1&limit=1`),
            adminFetch(`${API_BASE}/api/membership?page=1&limit=1`),
            adminFetch(`${API_BASE}/api/newsletter/all`)
        ]);
        const contactJson = await contactRes.json();
        const membershipJson = await membershipRes.json();
        const newsletterJson = await newsletterRes.json();
        const contactTotal = contactJson.total ?? 0;
        const membershipTotal = membershipJson.total ?? 0;
        const newsletterTotal = newsletterJson.total ?? 0;

        animateCount(membersEl, membershipTotal);
        animateCount(contactEl, contactTotal);
        animateCount(newsletterEl, newsletterTotal);
    } catch (err) {
        membersEl.textContent = '0';
        contactEl.textContent = '0';
        if (newsletterEl) newsletterEl.textContent = '0';
    }
});
