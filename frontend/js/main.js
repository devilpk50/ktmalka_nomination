// Main JavaScript for Leo Club Website

// API Configuration
const API_BASE_URL = window.location.origin; // Automatically uses current server origin
const API_ENDPOINTS = {
    membership: `${API_BASE_URL}/api/membership`,
    contact: `${API_BASE_URL}/api/contact`,
    newsletter: `${API_BASE_URL}/api/newsletter`
};

// Ensure body has top padding equal to navbar height (fixes gap under navbar)
document.addEventListener('DOMContentLoaded', function setBodyPaddingForNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    function applyPadding() {
        const h = nav.offsetHeight || 0;
        document.body.style.paddingTop = h + 'px';
    }
    applyPadding();
    window.addEventListener('resize', applyPadding);
});

// Form Submission Handlers
document.addEventListener('DOMContentLoaded', function() {
    // Membership Form Handler
    const membershipForm = document.getElementById('membershipForm');
    if (membershipForm) {
        // Set max date for DOB (must be at least 18 years old)
        const dobInput = document.getElementById('dob');
        if (dobInput) {
            const today = new Date();
            const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
            dobInput.setAttribute('max', maxDate.toISOString().split('T')[0]);

            // Real-time validation on date change
            dobInput.addEventListener('change', function() {
                validateAge(dobInput);
            });
        }

        // Phone number validation setup
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            // Allow only digits while typing
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '');
                if (this.value.length > 10) {
                    this.value = this.value.slice(0, 10);
                }
                validatePhone(this);
            });

            // Also block non-digit keys from being entered
            phoneInput.addEventListener('keypress', function(e) {
                if (!/\d/.test(e.key)) {
                    e.preventDefault();
                }
            });

            // Validate on blur
            phoneInput.addEventListener('blur', function() {
                validatePhone(this);
            });
        }

        // Phone validation function
        function validatePhone(input) {
            const phoneValue = input.value;
            const phoneError = document.getElementById('phoneError');
            if (!phoneValue) {
                input.classList.remove('is-invalid', 'is-valid');
                if (phoneError) phoneError.style.display = 'none';
                return true;
            }

            const isValid = /^\d{10}$/.test(phoneValue);
            if (!isValid) {
                input.classList.add('is-invalid');
                input.classList.remove('is-valid');
                if (phoneError) phoneError.style.display = 'block';
                return false;
            } else {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
                if (phoneError) phoneError.style.display = 'none';
                return true;
            }
        }

        // Age validation function
        function validateAge(input) {
            const dobValue = input.value;
            const dobError = document.getElementById('dobError');
            if (!dobValue) return true;

            const dob = new Date(dobValue);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            if (age < 18) {
                input.classList.add('is-invalid');
                input.classList.remove('is-valid');
                if (dobError) dobError.style.display = 'block';
                return false;
            } else {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
                if (dobError) dobError.style.display = 'none';
                return true;
            }
        }

        membershipForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Validate age before submission
            const dobField = document.getElementById('dob');
            if (!validateAge(dobField)) {
                dobField.focus();
                showAlert('danger', 'You must be at least 18 years old to apply for membership.');
                return;
            }

            // Validate phone before submission
            const phoneField = document.getElementById('phone');
            if (!validatePhone(phoneField)) {
                phoneField.focus();
                showAlert('danger', 'Please enter a valid 10-digit phone number (digits only).');
                return;
            }
            
            const formData = {
                fullName: document.getElementById('fullName').value,
                dob: document.getElementById('dob').value,
                gender: document.getElementById('gender').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('countryCode').value + ' ' + document.getElementById('phone').value,
                address: document.getElementById('address').value,
                school: document.getElementById('school').value,
                level: document.getElementById('level').value,
                year: document.getElementById('year').value,
                reason: document.getElementById('reason').value
            };

            try {
                const response = await fetch(API_ENDPOINTS.membership, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                
                if (response.ok) {
                    showAlert('success', 'Thank you! Your application has been submitted. We\'ll notify you via email about the status.');
                    membershipForm.reset();
                } else {
                    showAlert('danger', result.message || 'An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('danger', 'Network error. Please check your connection and try again.');
            }
        });
    }

    // Contact Form Handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                message: document.getElementById('contactMessage').value
            };

            try {
                const response = await fetch(API_ENDPOINTS.contact, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                
                if (response.ok) {
                    showAlert('success', 'Thank you! Your message has been sent successfully.');
                    contactForm.reset();
                } else {
                    showAlert('danger', result.message || 'An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('danger', 'Network error. Please check your connection and try again.');
            }
        });
    }
});

// Show Alert Function - displays message at bottom of screen (toast style)
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-bottom`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 5000);
}

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return; // Skip empty hash anchors
        e.preventDefault();
        try {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } catch (err) {
            console.error('Invalid selector:', href, err);
        }
    });
});

// Navbar Active State
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
    } else {
        link.classList.remove('active');
    }
});

// Initialize Carousel
const carouselElement = document.querySelector('#heroCarousel');
if (carouselElement) {
    const carousel = new bootstrap.Carousel(carouselElement, {
        interval: 5000,
        wrap: true
    });
}

// Gallery Image Modal (if needed)
function openImageModal(imageSrc) {
    // This can be enhanced with Bootstrap modal
    console.log('Opening image:', imageSrc);
}

// Form Validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Remove invalid class on input
document.addEventListener('input', function(e) {
    if (e.target.hasAttribute('required')) {
        e.target.classList.remove('is-invalid');
    }
});

// --- Additional UI enhancements: counters, back-to-top, newsletter, reveal ---

// Animate counters when they enter the viewport
function animateCount(el, duration = 1500) {
    const target = parseInt(el.getAttribute('data-target') || el.textContent.replace(/\D/g, '')) || 0;
    let start = 0;
    const startTime = performance.now();

    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(progress * (target - start) + start);
        el.textContent = value;
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = target;
        }
    }

    requestAnimationFrame(tick);
}

// Observe counters
document.addEventListener('DOMContentLoaded', function() {
    const counters = document.querySelectorAll('.count');
    if ('IntersectionObserver' in window && counters.length) {
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {threshold: 0.4});

        counters.forEach(c => obs.observe(c));
    } else {
        // Fallback: animate all immediately
        counters.forEach(c => animateCount(c));
    }

    // Reveal animations for sections
    const reveals = document.querySelectorAll('section');
    if ('IntersectionObserver' in window && reveals.length) {
        const ro = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {threshold: 0.12});

        reveals.forEach(r => r.classList.add('reveal')),
        reveals.forEach(r => ro.observe(r));
    } else {
        reveals.forEach(r => r.classList.add('reveal-visible'));
    }

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Newsletter form handler
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        const subscribeBtn = document.getElementById('subscribeBtn');
        const emailInput = document.getElementById('newsletterEmail');
        
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            
            if (!email) {
                showAlert('danger', 'Please enter a valid email address.');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAlert('danger', 'Please enter a valid email address.');
                return;
            }

            // Disable button during submission
            subscribeBtn.disabled = true;
            subscribeBtn.textContent = 'Subscribing...';

            try {
                const url = API_ENDPOINTS.newsletter + '/subscribe';
                console.log('Subscribing to newsletter:', url);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
                });

                console.log('Response status:', response.status);

                // Check if response is ok before trying to parse JSON
                let result;
                try {
                    const text = await response.text();
                    result = text ? JSON.parse(text) : {};
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    showAlert('danger', 'Server error. Please try again later.');
                    return;
                }
                
                if (response.ok) {
                    showAlert('success', result.message || 'Thank you for subscribing! Please check your email for confirmation.');
                    newsletterForm.reset();
                } else if (response.status === 400 && result.message && result.message.toLowerCase().includes('already subscribed')) {
                    showAlert('warning', 'You are already subscribed to our newsletter.');
                } else {
                    showAlert('danger', result.message || 'An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    endpoint: API_ENDPOINTS.newsletter + '/subscribe'
                });
                showAlert('danger', 'Network error. Please check your connection and try again. If the problem persists, make sure the server is running and has been restarted after adding the newsletter route.');
            } finally {
                // Re-enable button
                subscribeBtn.disabled = false;
                subscribeBtn.textContent = 'Subscribe';
            }
        });
    }
});

// --- Dynamic CMS Integration ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadDynamicMenu();
    await loadDynamicPageContent();
});

async function loadDynamicMenu() {
    const navUl = document.querySelector('.navbar-nav.ms-auto');
    if (!navUl) return;

    try {
        const response = await fetch('/api/menu');
        if (response.ok) {
            const menuItems = await response.json();
            const activeItems = menuItems.filter(item => item.is_active);
            
            if (activeItems.length > 0) {
                navUl.innerHTML = ''; // Clear hardcoded menu
                
                const parents = activeItems.filter(item => !item.parent_id);
                const children = activeItems.filter(item => item.parent_id);
                
                let currentPath = window.location.pathname.split('/').pop() || 'index.html';
                // Handle Vercel rewrite case (e.g. /about goes to /about.html or just /about)
                if (currentPath === '') currentPath = 'index.html';

                parents.forEach(parent => {
                    const childItems = children.filter(c => c.parent_id === parent.id);
                    const li = document.createElement('li');
                    
                    const parentUrlTarget = parent.url.startsWith('/') ? parent.url.substring(1) : parent.url;
                    const isActive = parentUrlTarget === currentPath || parent.url === currentPath;
                    
                    if (childItems.length > 0) {
                        li.className = 'nav-item dropdown';
                        const childActive = childItems.some(c => {
                            const childUrlTarget = c.url.startsWith('/') ? c.url.substring(1) : c.url;
                            return childUrlTarget === currentPath || c.url === currentPath;
                        });
                        
                        li.innerHTML = `
                            <a class="nav-link dropdown-toggle ${isActive || childActive ? 'active' : ''}" href="${parent.url}" id="menu-${parent.id}" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                ${parent.title}
                            </a>
                            <ul class="dropdown-menu" aria-labelledby="menu-${parent.id}">
                                ${childItems.map(child => {
                                    const childUrlTarget = child.url.startsWith('/') ? child.url.substring(1) : child.url;
                                    const isChildActive = childUrlTarget === currentPath || child.url === currentPath;
                                    return `<li><a class="dropdown-item ${isChildActive ? 'active' : ''}" href="${child.url}">${child.title}</a></li>`;
                                }).join('')}
                            </ul>
                        `;
                    } else {
                        li.className = 'nav-item';
                        li.innerHTML = `<a class="nav-link ${isActive ? 'active' : ''}" href="${parent.url}">${parent.title}</a>`;
                    }
                    navUl.appendChild(li);
                });
            }
        }
    } catch (error) {
        console.error('Error loading dynamic menu:', error);
    }
}

async function loadDynamicPageContent() {
    let path = window.location.pathname;
    let slug = path.split('/').pop().replace('.html', '');
    if (!slug) slug = 'index'; 

    try {
        const response = await fetch(`/api/pages?slug=${slug}`);
        if (response.ok) {
            const page = await response.json();
            
            if (page.html_content) {
                const nav = document.querySelector('nav.navbar');
                const footer = document.querySelector('.footer-wrapper') || document.querySelector('footer');
                
                if (nav && footer) {
                    const dynamicMain = document.createElement('main');
                    dynamicMain.id = 'dynamic-main-content';
                    dynamicMain.innerHTML = page.html_content;
                    
                    // Remove static content between nav and footer
                    let current = nav.nextElementSibling;
                    while (current && current !== footer) {
                        const next = current.nextElementSibling;
                        // Avoid removing script tags or modals if placed at bottom
                        if (current.tagName !== 'SCRIPT' && current.id !== 'backToTop') {
                            current.remove();
                        }
                        current = next;
                    }
                    
                    document.body.insertBefore(dynamicMain, footer);
                    document.title = `${page.title} - Leo Club of Kathmandu Alka`;
                    
                    // Re-initialize any dynamic components like carousel if present in the new HTML
                    const carouselElement = document.querySelector('#heroCarousel');
                    if (carouselElement && window.bootstrap) {
                        new bootstrap.Carousel(carouselElement, {
                            interval: 5000,
                            wrap: true
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading dynamic page content:', error);
    }
}

