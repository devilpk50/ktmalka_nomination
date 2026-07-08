document.addEventListener('DOMContentLoaded', async () => {
    const indicatorsContainer = document.getElementById('heroCarouselIndicators');
    const innerContainer = document.getElementById('heroCarouselInner');
    if (!indicatorsContainer || !innerContainer) return;

    try {
        const res = await fetch(`${window.location.origin}/api/sliders`);
        if (!res.ok) throw new Error('Failed to fetch sliders');
        
        let sliders = await res.json();
        // Filter active only
        sliders = sliders.filter(s => s.is_active);

        // If no active sliders, we can optionally provide a fallback
        if (sliders.length === 0) {
            console.warn('No active sliders found.');
            return;
        }

        indicatorsContainer.innerHTML = '';
        innerContainer.innerHTML = '';

        sliders.forEach((slider, index) => {
            // Indicator
            const indicator = document.createElement('button');
            indicator.type = 'button';
            indicator.dataset.bsTarget = '#heroCarousel';
            indicator.dataset.bsSlideTo = index.toString();
            if (index === 0) indicator.classList.add('active');
            indicatorsContainer.appendChild(indicator);

            // Inner item
            const item = document.createElement('div');
            item.className = `carousel-item ${index === 0 ? 'active' : ''}`;

            let buttonsHtml = '';
            if (slider.btn1_text || slider.btn2_text) {
                buttonsHtml = `<div class="mt-4 hero-buttons">`;
                if (slider.btn1_text) {
                    buttonsHtml += `<a href="${slider.btn1_url || '#'}" class="btn hero-btn-primary">${slider.btn1_text}</a>\n`;
                }
                if (slider.btn2_text) {
                    buttonsHtml += `<a href="${slider.btn2_url || '#'}" class="btn hero-btn-secondary">${slider.btn2_text}</a>`;
                }
                buttonsHtml += `</div>`;
            }

            let textWrapperHtml = '';
            if (slider.title || slider.tagline) {
                textWrapperHtml = `
                    <div class="hero-text-wrapper">
                        ${slider.title ? `<h1 class="hero-headline">${slider.title}</h1>` : ''}
                        ${(slider.title && slider.tagline) ? '<div class="hero-tagline-divider"></div>' : ''}
                        ${slider.tagline ? `<p class="hero-tagline">${slider.tagline}</p>` : ''}
                    </div>
                `;
            }

            let captionHtml = '';
            if (textWrapperHtml || buttonsHtml) {
                captionHtml = `
                <div class="carousel-caption d-flex flex-column justify-content-center h-100">
                    ${textWrapperHtml}
                    ${buttonsHtml}
                </div>
                `;
            }

            item.innerHTML = `
                <div class="carousel-image" style="background-image: url('${slider.image_url}'); background-position: center; background-size: cover; background-repeat: no-repeat;"></div>
                ${captionHtml}
            `;
            innerContainer.appendChild(item);
        });

    } catch (error) {
        console.error('Error fetching sliders:', error);
    }
});
