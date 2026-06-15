document.addEventListener('DOMContentLoaded', () => {
    let activeUploadsCount = 0;
    window.uploadedUrls = {};
    let vercelBlobUpload = null;

    async function preloadBlobSDK() {
        try {
            const module = await import('https://esm.sh/@vercel/blob/client');
            vercelBlobUpload = module.upload;
        } catch (err) {
            console.error('Failed to preload Vercel Blob SDK:', err);
        }
    }

    function disableNavButtons(disable) {
        document.querySelectorAll('.next-step, .prev-step, button[type="submit"]').forEach(btn => {
            btn.disabled = disable;
            if (disable) {
                btn.style.opacity = '0.6';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.style.opacity = '';
                btn.style.cursor = '';
            }
        });
    }

    function updateTenureDisplays() {
        const savedTenure = localStorage.getItem('leoNominationTenure') || 'L.Y. 2025/26';
        
        // Update document title if present
        if (document.title.includes('Leo Club Nomination Form')) {
            document.title = `Leo Club Nomination Form | ${savedTenure}`;
        }
        
        // Update elements with class 'tenureText'
        document.querySelectorAll('.tenureText').forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = savedTenure;
            } else {
                el.textContent = savedTenure;
            }
        });
    }

    // Dynamic Deadline Enforcement
    const deadlineText = document.getElementById('deadlineText');
    const closedNotice = document.getElementById('closedNotice');
    const closedDeadlineVal = document.getElementById('closedDeadlineVal');
    const stepperWrapper = document.querySelector('.stepper-wrapper');
    const nominationForm = document.getElementById('nominationForm');

    function checkFormDeadline() {
        let deadlineStr = localStorage.getItem('leoNominationDeadline');
        if (!deadlineStr) {
            deadlineStr = '2026-06-17T23:59';
            localStorage.setItem('leoNominationDeadline', deadlineStr);
        }

        const deadlineDate = new Date(deadlineStr);
        
        // Format date beautifully: e.g., June 17, 2026, 11:59 PM
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
        const formattedDeadline = deadlineDate.toLocaleString('en-US', options);

        if (deadlineText) {
            deadlineText.textContent = `Deadline: ${formattedDeadline}`;
        }

        const now = new Date();
        if (now > deadlineDate) {
            if (stepperWrapper) stepperWrapper.classList.add('hidden');
            if (nominationForm) nominationForm.classList.add('hidden');
            if (closedNotice) {
                closedNotice.classList.remove('hidden');
                if (closedDeadlineVal) {
                    closedDeadlineVal.textContent = `Passed on: ${formattedDeadline}`;
                }
            }
            return true;
        }
        return false;
    }

    // Modal Logic
    const welcomeModal = document.getElementById('welcomeModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const understandBtn = document.getElementById('understandBtn');

    const closeModal = () => {
        if (welcomeModal) welcomeModal.style.display = 'none';
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (understandBtn) understandBtn.addEventListener('click', closeModal);

    // Initial load from server database
    async function initApp() {
        try {
            // Fetch settings
            const settingsRes = await fetch('/api/settings');
            if (settingsRes.ok) {
                const settings = await settingsRes.json();
                if (settings.leoNominationDeadline) {
                    localStorage.setItem('leoNominationDeadline', settings.leoNominationDeadline);
                }
                if (settings.leoNominationTenure) {
                    localStorage.setItem('leoNominationTenure', settings.leoNominationTenure);
                }
            }
            
            // Fetch members
            const membersRes = await fetch('/api/members');
            if (membersRes.ok) {
                const members = await membersRes.json();
                window.memberData = members;
            }
        } catch (err) {
            console.error('Failed to fetch initial settings/members from database:', err);
        }
        
        updateTenureDisplays();
        const isClosed = checkFormDeadline();
        
        // Show modal on page load if form is open
        if (!isClosed && welcomeModal) {
            welcomeModal.style.display = 'block';
        } else if (welcomeModal) {
            welcomeModal.style.display = 'none';
        }
        
        // Preload Vercel Blob client SDK in the background
        preloadBlobSDK();
    }

    // Call initApp to fetch settings and members
    initApp();

    // Close when clicking outside of the modal content
    window.addEventListener('click', (e) => {
        if (e.target === welcomeModal) {
            closeModal();
        }
    });

    // Slider Logic
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }

    nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    });

    prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

    const positionSelect = document.getElementById('position');
    const criteriaContainer = document.getElementById('criteriaContainer');
    const criteriaList = document.getElementById('criteriaList');
    const feeAmount = document.getElementById('feeAmount');
    const form = document.getElementById('nominationForm');
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    // Member verification elements
    const radioButtons = document.querySelectorAll('input[name="hasLeoId"]');
    const leoIdGroup = document.getElementById('leoIdGroup');
    const manualEntryGroup = document.getElementById('manualEntryGroup');
    
    const leoIdInput = document.getElementById('leoId');
    const fullNameInput = document.getElementById('fullName');
    const contactNoInput = document.getElementById('contactNo');
    const emailIdInput = document.getElementById('emailId');
    const currentPositionInput = document.getElementById('currentPosition');
    
    const idVerificationMsg = document.getElementById('idVerificationMsg');
    const memberDetailsContainer = document.getElementById('memberDetailsContainer');
    const displayName = document.getElementById('displayName');
    const displayLeoId = document.getElementById('displayLeoId');
    const displayPosition = document.getElementById('displayPosition');
    const displayEmail = document.getElementById('displayEmail');
    const displayContact = document.getElementById('displayContact');
    const duesReceiptContainer = document.getElementById('duesReceiptContainer');
    const duesReceiptInput = document.getElementById('duesReceipt');
    const transactionCodeInput = document.getElementById('transactionCode');
    const nominationReceiptInput = document.getElementById('nominationReceipt');
    const paymentStepFee = document.getElementById('paymentStepFee');

    // --- Step Wizard State & Navigation ---
    let currentStep = 1;
    const totalSteps = 6;
    const formSteps = document.querySelectorAll('.form-step');
    const stepItems = document.querySelectorAll('.step-item');
    const stepperProgressBar = document.getElementById('stepperProgressBar');

    function updateStepper() {
        formSteps.forEach((step, idx) => {
            if (idx + 1 === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        stepItems.forEach((item, idx) => {
            const stepNum = idx + 1;
            if (stepNum === currentStep) {
                item.classList.add('active');
                item.classList.remove('completed');
            } else if (stepNum < currentStep) {
                item.classList.add('completed');
                item.classList.remove('active');
            } else {
                item.classList.remove('active', 'completed');
            }
        });

        const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
        if (stepperProgressBar) {
            stepperProgressBar.style.width = `${progressPercent}%`;
        }

        // Pre-warm the database Neon instance during the final steps to bypass cold start delays
        if (currentStep >= 4) {
            fetch('/api/settings').catch(() => {});
        }
    }

    // Set up step navigation buttons event listeners
    document.querySelectorAll('.next-step').forEach(btn => {
        btn.addEventListener('click', () => {
            if (checkFormDeadline()) {
                alert('Nominations are closed. Submissions are no longer accepted.');
                return;
            }
            if (validateStep(currentStep)) {
                currentStep++;
                if (currentStep > totalSteps) currentStep = totalSteps;
                updateStepper();
                document.getElementById('nominationForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // Scroll to first error on active step
                const activeStepEl = document.querySelector('.form-step.active');
                if (activeStepEl) {
                    const firstError = activeStepEl.querySelector('.input-error');
                    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });

    document.querySelectorAll('.prev-step').forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            if (currentStep < 1) currentStep = 1;
            updateStepper();
            document.getElementById('nominationForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Initialize stepper UI
    updateStepper();


    const roleData = {
        board_director: {
            title: 'Board of Director',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        joint_treasurer: {
            title: 'Joint Treasurer',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        joint_secretary: {
            title: 'Joint Secretary',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        tamer: {
            title: 'Tamer',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        tail_twister: {
            title: 'Tail Twister',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        it_committee: {
            title: 'IT Committee',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        signature_project: {
            title: 'Signature Project Committee',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        leo_membership: {
            title: 'Leo Membership Chairperson',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        public_relation: {
            title: 'Public Relation Officer',
            fee: 350,
            criteria: [
                'Should have served at least one year for the club actively'
            ]
        },
        treasurer: {
            title: 'Treasurer',
            fee: 600,
            criteria: [
                'Should have served at least two years actively for the club',
                'A member who has worked as a joint treasurer is most preferred'
            ]
        },
        secretary: {
            title: 'Secretary',
            fee: 900,
            criteria: [
                'Should have served at least two years actively for the club',
                'A member who has worked as a joint secretary is most preferred'
            ]
        },
        vice_president: {
            title: 'Vice President',
            fee: 1000,
            criteria: [
                'Should have served at least two years actively for the club',
                'Should have served as a Secretary, Treasurer, or Board Member'
            ]
        },
        president: {
            title: 'President',
            fee: 1100,
            criteria: [
                'Should have served at least two years actively for the club',
                'Should have served as a Vice President, Secretary, or Treasurer'
            ]
        }
    };

    // --- Position Eligibility Logic ---
    // Maps keywords in current position to allowed position values
    function getEligiblePositions(currentPosition) {
        const pos = currentPosition.toLowerCase().trim();
        const boardPositions = [
            'board_director', 'joint_treasurer', 'joint_secretary',
            'tamer', 'tail_twister', 'it_committee',
            'signature_project', 'leo_membership', 'public_relation'
        ];

        if (pos === 'general member' || pos === 'member' || pos === 'leo member' || pos === 'club member' || pos.includes('general member')) {
            return { eligible: boardPositions, message: 'As a General Member/Member, you may apply for Board-level positions.' };
        }
        if (pos.includes('president') && !pos.includes('vice')) {
            // Club President → cannot apply for anything
            return { eligible: [], message: '⚠ As the current President, you are not eligible to apply for any position.' };
        }
        if (pos.includes('vice president') || pos.includes('vice-president')) {
            // Vice President → can apply for President or Board of Director only
            return { eligible: ['president', 'board_director'], message: 'As Vice President, you may apply for President or Board of Director.' };
        }
        if (pos.includes('secretary') && !pos.includes('joint')) {
            // Secretary → can apply for Vice President
            return { eligible: ['vice_president'], message: 'As Secretary, you may apply for Vice President.' };
        }
        if (pos.includes('treasurer') && !pos.includes('joint')) {
            // Treasurer → can apply for Vice President
            return { eligible: ['vice_president'], message: 'As Treasurer, you may apply for Vice President.' };
        }
        if (pos.includes('joint secretary') || pos.includes('joint treasurer')) {
            // Joint Secretary / Joint Treasurer → Board positions, excluding their own current role, plus secretary and treasurer
            const boardForJoint = boardPositions.filter(p => p !== 'joint_secretary' && p !== 'joint_treasurer');
            return { eligible: [...boardForJoint, 'secretary', 'treasurer'], message: 'As Joint Secretary/Treasurer, you may apply for Secretary, Treasurer, or Board-level positions.' };
        }
        // All other board/committee members → board positions, secretary, and treasurer
        return { eligible: [...boardPositions, 'secretary', 'treasurer'], message: 'As a Board Member, you may apply for Secretary, Treasurer, or Board-level positions.' };
    }

    function applyPositionEligibility(currentPosition) {
        const { eligible, message } = getEligiblePositions(currentPosition);
        const allOptions = positionSelect.querySelectorAll('option[value]');
        let eligibilityNote = document.getElementById('eligibilityNote');

        if (!eligibilityNote) {
            eligibilityNote = document.createElement('small');
            eligibilityNote.id = 'eligibilityNote';
            eligibilityNote.className = 'verification-msg';
            eligibilityNote.style.marginTop = '0.5rem';
            positionSelect.parentNode.appendChild(eligibilityNote);
        }

        // Reset select
        positionSelect.value = '';
        criteriaContainer.classList.add('hidden');

        if (eligible.length === 0) {
            // Cannot apply
            allOptions.forEach(opt => { opt.disabled = true; opt.style.color = '#aaa'; });
            eligibilityNote.textContent = message;
            eligibilityNote.className = 'verification-msg error';
            positionSelect.disabled = true;
        } else {
            positionSelect.disabled = false;
            allOptions.forEach(opt => {
                if (eligible.includes(opt.value)) {
                    opt.disabled = false;
                    opt.style.color = '';
                } else {
                    opt.disabled = true;
                    opt.style.color = '#aaa';
                }
            });
            eligibilityNote.textContent = '✓ ' + message;
            eligibilityNote.className = 'verification-msg success';
        }
    }

    function resetPositionEligibility() {
        const allOptions = positionSelect.querySelectorAll('option[value]');
        allOptions.forEach(opt => { opt.disabled = false; opt.style.color = ''; });
        positionSelect.disabled = false;
        const eligibilityNote = document.getElementById('eligibilityNote');
        if (eligibilityNote) eligibilityNote.textContent = '';
    }

    // Handle position change
    positionSelect.addEventListener('change', (e) => {
        const selectedRole = e.target.value;
        const data = roleData[selectedRole];

        if (data) {
            // Update fee
            feeAmount.textContent = `Rs. ${data.fee}`;
            if (paymentStepFee) {
                paymentStepFee.textContent = `Rs. ${data.fee}`;
            }

            // Update criteria list
            criteriaList.innerHTML = '';
            data.criteria.forEach(criterion => {
                const li = document.createElement('li');
                li.textContent = criterion;
                criteriaList.appendChild(li);
            });

            // Show container
            criteriaContainer.classList.remove('hidden');
            // Slight delay for animation effect
            setTimeout(() => {
                criteriaContainer.style.opacity = '1';
            }, 10);
        } else {
            criteriaContainer.classList.add('hidden');
            criteriaContainer.style.opacity = '0';
            if (paymentStepFee) {
                paymentStepFee.textContent = 'Rs. 0';
            }
        }
    });

    // Handle file input changes for custom styling and real-time validation
    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const fileNameSpan = e.target.nextElementSibling;
            const fieldId = input.id;
            clearError(fieldId);

            // Determine validation config
            let allowedTypes = ALLOWED_DOC_TYPES;
            let label = 'File';
            if (fieldId === 'formalPhoto') {
                allowedTypes = ['image/jpeg'];
                label = 'Formal Photo';
            } else if (fieldId === 'candidateSignature') {
                allowedTypes = ALLOWED_IMAGE_TYPES;
                label = 'Candidate Signature';
            } else if (fieldId === 'citizenship') {
                allowedTypes = ['application/pdf'];
                label = 'Citizenship document';
            } else if (fieldId === 'duesReceipt') {
                label = 'Club dues receipt';
            } else if (fieldId === 'nominationReceipt') {
                label = 'Nomination Fee Paid Receipt';
            } else if (fieldId === 'coverLetterFile') {
                allowedTypes = ['application/pdf'];
                label = 'Cover Letter File';
            }


            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                fileNameSpan.textContent = file.name;
                fileNameSpan.style.color = '#2c3e50';
                fileNameSpan.style.fontWeight = '500';

                const err = validateFile(input, allowedTypes, label);
                if (err) {
                    showError(fieldId, err);
                    window.uploadedUrls[fieldId] = '';
                } else {
                    // Upload file immediately
                    (async () => {
                        try {
                            activeUploadsCount++;
                            disableNavButtons(true);
                            
                            fileNameSpan.textContent = `Preparing upload...`;
                            fileNameSpan.style.color = '#3b82f6';
                            
                            if (!vercelBlobUpload) {
                                const module = await import('https://esm.sh/@vercel/blob/client');
                                vercelBlobUpload = module.upload;
                            }
                            
                            const uniqueFilename = `${Date.now()}_${fieldId}_${file.name}`;
                            
                            const blob = await vercelBlobUpload(uniqueFilename, file, {
                                access: 'public',
                                handleUploadUrl: '/api/upload',
                                onUploadProgress(progressEvent) {
                                    fileNameSpan.textContent = `Uploading... ${Math.round(progressEvent.percentage)}%`;
                                    fileNameSpan.style.color = '#3b82f6';
                                }
                            });
                            
                            window.uploadedUrls[fieldId] = blob.url;
                            fileNameSpan.textContent = `✓ Uploaded: ${file.name}`;
                            fileNameSpan.style.color = '#10b981';
                        } catch (err) {
                            console.error('File upload failed:', err);
                            window.uploadedUrls[fieldId] = '';
                            fileNameSpan.textContent = `✗ Upload failed: ${file.name}`;
                            fileNameSpan.style.color = '#ef4444';
                            showError(fieldId, 'Failed to upload file to storage database.');
                        } finally {
                            activeUploadsCount--;
                            if (activeUploadsCount === 0) {
                                disableNavButtons(false);
                            }
                        }
                    })();
                }
            } else {
                fileNameSpan.textContent = 'No file chosen';
                fileNameSpan.style.color = '#64748b';
                fileNameSpan.style.fontWeight = 'normal';
                window.uploadedUrls[fieldId] = '';

                if (input.required) {
                    showError(fieldId, `${label} is required.`);
                }
            }
        });
    });

    // Ensure button clicks always trigger file inputs (fallback for iOS)
    document.querySelectorAll('.file-input-wrapper .btn-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const fileInput = btn.parentElement.querySelector('input[type="file"]');
            if (fileInput) fileInput.click();
        });
    });

    // Handle radio toggle
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'yes') {
                leoIdGroup.classList.remove('hidden');
                leoIdInput.required = true;
                manualEntryGroup.classList.add('hidden');
                fullNameInput.required = false;
                contactNoInput.required = false;
                emailIdInput.required = false;
                currentPositionInput.required = false;
                
                if (leoIdInput.value.trim() !== '') {
                    leoIdInput.dispatchEvent(new Event('input'));
                } else {
                    resetPositionEligibility();
                }
            } else {
                leoIdGroup.classList.add('hidden');
                leoIdInput.required = false;
                leoIdInput.value = '';
                idVerificationMsg.textContent = '';
                idVerificationMsg.className = 'verification-msg';
                memberDetailsContainer.classList.add('hidden');
                manualEntryGroup.classList.remove('hidden');
                fullNameInput.required = true;
                contactNoInput.required = true;
                emailIdInput.required = true;
                currentPositionInput.required = true;
                
                const pos = currentPositionInput.value.trim();
                if (pos !== '') {
                    applyPositionEligibility(pos);
                } else {
                    resetPositionEligibility();
                }

                // Reset dues receipt requirement since we can't verify
                duesReceiptContainer.style.display = 'block';
                duesReceiptInput.required = true;
                if (document.getElementById('duesVerifiedNote')) {
                    document.getElementById('duesVerifiedNote').style.display = 'none';
                }
            }
        });
    });

    // Handle manual position input eligibility filtering dynamically
    currentPositionInput.addEventListener('input', () => {
        const hasLeoId = document.querySelector('input[name="hasLeoId"]:checked').value;
        if (hasLeoId === 'no') {
            const pos = currentPositionInput.value.trim();
            if (pos !== '') {
                applyPositionEligibility(pos);
            } else {
                resetPositionEligibility();
            }
        }
    });

    // Handle Leo ID verification
    leoIdInput.addEventListener('input', (e) => {
        const id = e.target.value.trim();
        
        if (id.length === 0) {
            idVerificationMsg.textContent = '';
            idVerificationMsg.className = 'verification-msg';
            memberDetailsContainer.classList.add('hidden');
            duesReceiptContainer.style.display = 'block';
            duesReceiptInput.required = true;
            resetPositionEligibility();
            if (document.getElementById('duesVerifiedNote')) {
                document.getElementById('duesVerifiedNote').style.display = 'none';
            }
            return;
        }

        // Check if already registered/submitted locally
        const submissions = JSON.parse(localStorage.getItem('leoNominations') || '[]');
        const isDuplicateLocal = submissions.some(sub => sub.hasLeoId === 'yes' && sub.leoId === id);
        
        if (isDuplicateLocal) {
            handleDuplicateError();
            return;
        }

        // Check backend asynchronously
        window.isCheckingLeoId = true;
        fetch('/api/nominations?checkLeoId=' + id)
            .then(res => res.json())
            .then(data => {
                if (data.hasSubmitted) {
                    window.serverDuplicateLeoId = id;
                    if (leoIdInput.value.trim() === id) {
                        handleDuplicateError();
                    }
                } else {
                    if (window.serverDuplicateLeoId === id) {
                        window.serverDuplicateLeoId = null;
                    }
                }
            })
            .catch(err => console.error('Error checking duplicate:', err))
            .finally(() => {
                if (leoIdInput.value.trim() === id) window.isCheckingLeoId = false;
            });

        function handleDuplicateError() {
            idVerificationMsg.textContent = 'Member has already submitted a nomination.';
            idVerificationMsg.className = 'verification-msg error';
            memberDetailsContainer.classList.add('hidden');
            duesReceiptContainer.style.display = 'block';
            duesReceiptInput.required = true;
            resetPositionEligibility();
            if (document.getElementById('duesVerifiedNote')) {
                document.getElementById('duesVerifiedNote').style.display = 'none';
            }
        }

        // memberData is defined in data.js
        if (typeof memberData !== 'undefined' && memberData[id]) {
            const member = memberData[id];
            
            // Auto-fill name for submission
            fullNameInput.value = member.name;
            
            // Populate and show details
            displayLeoId.textContent = id;
            displayName.textContent = member.name || 'N/A';
            displayPosition.textContent = member.position || 'N/A';
            displayEmail.textContent = member.email || 'N/A';
            displayContact.textContent = member.contact || 'N/A';
            memberDetailsContainer.classList.remove('hidden');
            memberDetailsContainer.style.opacity = '1';

            // Apply position eligibility filter
            applyPositionEligibility(member.position || '');
            
            // Show success message
            idVerificationMsg.textContent = '✓ Verified Member';
            idVerificationMsg.className = 'verification-msg success';
            
            // Check dues payment status
            if (member.duesPaid) {
                duesReceiptContainer.style.display = 'none';
                duesReceiptInput.required = false;
                
                if (!document.getElementById('duesVerifiedNote')) {
                    const note = document.createElement('div');
                    note.id = 'duesVerifiedNote';
                    note.className = 'verification-msg success';
                    note.style.marginBottom = '1.5rem';
                    note.textContent = '✓ Club Dues automatically verified. No receipt upload required.';
                    duesReceiptContainer.parentNode.insertBefore(note, duesReceiptContainer.nextSibling);
                } else {
                    document.getElementById('duesVerifiedNote').style.display = 'block';
                }
            } else {
                duesReceiptContainer.style.display = 'block';
                duesReceiptInput.required = true;
                if (document.getElementById('duesVerifiedNote')) {
                    document.getElementById('duesVerifiedNote').style.display = 'none';
                }
            }
        } else {
            // Not found
            idVerificationMsg.textContent = 'Member not found. Please check your ID.';
            idVerificationMsg.className = 'verification-msg error';
            memberDetailsContainer.classList.add('hidden');
            duesReceiptContainer.style.display = 'block';
            duesReceiptInput.required = true;
            if (document.getElementById('duesVerifiedNote')) {
                document.getElementById('duesVerifiedNote').style.display = 'none';
            }
        }
    });


    // Live checkbox validation clearing
    const criminalCheck = document.getElementById('criminalRecord');
    if (criminalCheck) {
        criminalCheck.addEventListener('change', () => {
            if (criminalCheck.checked) clearError('criminalRecord');
        });
    }

    const termsCheck = document.getElementById('termsAgreement');
    if (termsCheck) {
        termsCheck.addEventListener('change', () => {
            if (termsCheck.checked) clearError('termsAgreement');
        });
    }

    // =============================================
    // VALIDATION & SECURITY UTILITIES
    // =============================================

    // Sanitize input to prevent XSS
    function sanitize(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // Count words in text
    function getWordCount(text) {
        const trimmed = text.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).filter(word => word.length > 0).length;
    }

    // Show error on a field
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.classList.add('input-error');
        let errEl = document.getElementById('err_' + fieldId);
        if (!errEl) {
            errEl = document.createElement('small');
            errEl.id = 'err_' + fieldId;
            errEl.className = 'field-error';
            
            // If the field is a file input, insert after the file-input-wrapper flex container
            if (field.type === 'file') {
                const wrapper = field.closest('.file-input-wrapper');
                if (wrapper) {
                    wrapper.parentNode.insertBefore(errEl, wrapper.nextSibling);
                } else {
                    field.parentNode.insertBefore(errEl, field.nextSibling);
                }
            } else if (field.type === 'checkbox') {
                // Insert after the parent label element to avoid breaking custom checkbox layout
                const label = field.closest('.custom-checkbox') || field;
                label.parentNode.insertBefore(errEl, label.nextSibling);
            } else {
                field.parentNode.insertBefore(errEl, field.nextSibling);
            }
        }
        errEl.textContent = message;
    }

    // Clear error from a field
    function clearError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) field.classList.remove('input-error');
        const errEl = document.getElementById('err_' + fieldId);
        if (errEl) errEl.textContent = '';
    }

    // Clear ALL errors
    function clearAllErrors() {
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    }

    // Validate email format
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Validate phone (exactly 10 digits)
    function isValidPhone(phone) {
        return /^[0-9]{10}$/.test(phone.replace(/[\s\-\+]/g, ''));
    }

    // Validate file: type & size (limited to 5MB as standard size optimization)
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const ALLOWED_DOC_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const MAX_FILE_MB = 5;

    function validateFile(fileInput, allowedTypes, label) {
        const file = fileInput.files[0];
        if (!file) return `${label} is required.`;

        let isValidType = allowedTypes.includes(file.type);
        if (!isValidType) {
            const ext = file.name.split('.').pop().toLowerCase();
            if ((ext === 'jpg' || ext === 'jpeg') && allowedTypes.includes('image/jpeg')) isValidType = true;
            if (ext === 'png' && allowedTypes.includes('image/png')) isValidType = true;
            if (ext === 'webp' && allowedTypes.includes('image/webp')) isValidType = true;
            if (ext === 'pdf' && allowedTypes.includes('application/pdf')) isValidType = true;
        }

        if (!isValidType) {
            return `${label}: only ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} files allowed.`;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            return `${label} must be under ${MAX_FILE_MB}MB.`;
        }
        return null;
    }

    // Real-time validation on blur for text inputs
    function addRealTimeValidation(fieldId, validator) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.addEventListener('blur', () => {
            const error = validator(field.value.trim());
            if (error) showError(fieldId, error);
            else clearError(fieldId);
        });
        field.addEventListener('input', () => {
            if (field.classList.contains('input-error')) {
                const error = validator(field.value.trim());
                if (!error) clearError(fieldId);
            }
        });
    }

    // Rate limiting: max 1 submission per 30 seconds
    let lastSubmitTime = 0;

    // =============================================
    // REAL-TIME VALIDATORS
    // =============================================

    addRealTimeValidation('fullName', val => {
        if (!val) return 'Full name is required.';
        if (val.length < 3) return 'Name must be at least 3 characters.';
        if (val.length > 100) return 'Name must be under 100 characters.';
        if (!/^[A-Za-z\s.]+$/.test(val)) return 'Name must contain letters and spaces only.';
        return null;
    });

    addRealTimeValidation('contactNo', val => {
        if (!val) return 'Contact number is required.';
        if (!isValidPhone(val)) return 'Enter a valid 10-digit phone number.';
        return null;
    });

    addRealTimeValidation('emailId', val => {
        if (!val) return 'Email is required.';
        if (!isValidEmail(val)) return 'Enter a valid email address.';
        return null;
    });

    addRealTimeValidation('currentPosition', val => {
        if (!val) return 'Current position is required.';
        if (val.length > 100) return 'Position must be under 100 characters.';
        return null;
    });

    addRealTimeValidation('pastExperience', val => {
        if (!val) return 'Past experience and learning is required.';
        if (val.length < 10) return 'Please provide a more detailed response (min 10 characters).';
        return null;
    });

    addRealTimeValidation('areasOfInterest', val => {
        if (!val) return 'Areas of interest is required.';
        if (val.length < 10) return 'Please provide a more detailed response (min 10 characters).';
        return null;
    });

    addRealTimeValidation('futurePlans', val => {
        if (!val) return 'Plans with respect to the position is required.';
        if (val.length < 10) return 'Please provide a more detailed response (min 10 characters).';
        return null;
    });


    addRealTimeValidation('transactionCode', val => {
        if (!val) return 'Transaction code is required.';
        if (val.length < 4) return 'Transaction code must be at least 4 characters.';
        if (val.length > 50) return 'Transaction code must be under 50 characters.';
        if (/[<>\"'%;()&]/.test(val)) return 'Transaction code contains invalid characters.';
        return null;
    });

    // =============================================
    // FULL FORM VALIDATION ON SUBMIT
    // =============================================

    function validateStep(stepNumber) {
        let stepValid = true;
        const hasLeoId = document.querySelector('input[name="hasLeoId"]:checked').value;

        if (stepNumber === 1) {
            clearError('leoId');
            clearError('fullName');
            clearError('contactNo');
            clearError('emailId');
            clearError('currentPosition');

            // Validate Personal Information
            if (hasLeoId === 'yes') {
                const id = leoIdInput.value.trim();
                if (!id) {
                    showError('leoId', 'Leo ID is required.');
                    stepValid = false;
                } else if (typeof memberData === 'undefined' || !memberData[id]) {
                    showError('leoId', 'Leo ID not found. Only registered members can apply.');
                    stepValid = false;
                } else {
                    const submissions = JSON.parse(localStorage.getItem('leoNominations') || '[]');
                    const isDuplicate = submissions.some(sub => sub.hasLeoId === 'yes' && sub.leoId === id);
                    if (isDuplicate || window.serverDuplicateLeoId === id) {
                        showError('leoId', 'You have already submitted a nomination.');
                        stepValid = false;
                    } else if (window.isCheckingLeoId) {
                        showError('leoId', 'Checking ID status, please wait...');
                        stepValid = false;
                    }
                }
            } else {
                const name = fullNameInput.value.trim();
                if (!name || name.length < 3) {
                    showError('fullName', 'Full name is required (min 3 characters).'); stepValid = false;
                } else if (!/^[A-Za-z\s.]+$/.test(name)) {
                    showError('fullName', 'Name must contain letters and spaces only.'); stepValid = false;
                }

                const phone = contactNoInput ? contactNoInput.value.trim() : '';
                if (!phone) {
                    showError('contactNo', 'Contact number is required.'); stepValid = false;
                } else if (!isValidPhone(phone)) {
                    showError('contactNo', 'Enter a valid 10-digit phone number.'); stepValid = false;
                }

                const email = emailIdInput ? emailIdInput.value.trim() : '';
                if (!email) {
                    showError('emailId', 'Email address is required.'); stepValid = false;
                } else if (!isValidEmail(email)) {
                    showError('emailId', 'Enter a valid email address.'); stepValid = false;
                }

                const pos = currentPositionInput ? currentPositionInput.value.trim() : '';
                if (!pos) {
                    showError('currentPosition', 'Current position is required.'); stepValid = false;
                }
            }
        } else if (stepNumber === 2) {
            clearError('position');
            // Validate Position Selection
            if (!positionSelect.value) {
                showError('position', 'Please select a position to apply for.');
                stepValid = false;
            } else if (positionSelect.disabled) {
                showError('position', 'You are not eligible to apply for any position.');
                stepValid = false;
            }
        } else if (stepNumber === 3) {
            clearError('pastExperience');
            clearError('areasOfInterest');
            clearError('futurePlans');

            // Validate Candidate Statements
            const pastExp = document.getElementById('pastExperience').value.trim();
            if (!pastExp) {
                showError('pastExperience', 'Past experience and learning is required.');
                stepValid = false;
            } else if (pastExp.length < 10) {
                showError('pastExperience', 'Past experience and learning must be at least 10 characters.');
                stepValid = false;
            }

            const areas = document.getElementById('areasOfInterest').value.trim();
            if (!areas) {
                showError('areasOfInterest', 'Areas of interest is required.');
                stepValid = false;
            } else if (areas.length < 10) {
                showError('areasOfInterest', 'Areas of interest must be at least 10 characters.');
                stepValid = false;
            }

            const plans = document.getElementById('futurePlans').value.trim();
            if (!plans) {
                showError('futurePlans', 'Plans with respect to the position is required.');
                stepValid = false;
            } else if (plans.length < 10) {
                showError('futurePlans', 'Plans with respect to the position must be at least 10 characters.');
                stepValid = false;
            }
        } else if (stepNumber === 4) {
            clearError('formalPhoto');
            clearError('citizenship');
            clearError('coverLetterFile');
            clearError('duesReceipt');
            clearError('candidateSignature');

            // Validate Required Documents (File uploads)
            const photoErr = validateFile(document.getElementById('formalPhoto'), ['image/jpeg'], 'Formal Photo');
            if (photoErr) { showError('formalPhoto', photoErr); stepValid = false; }
            else if (!window.uploadedUrls['formalPhoto']) { showError('formalPhoto', 'Formal Photo upload failed or is still in progress.'); stepValid = false; }

            const sigErr = validateFile(document.getElementById('candidateSignature'), ALLOWED_IMAGE_TYPES, 'Candidate Signature');
            if (sigErr) { showError('candidateSignature', sigErr); stepValid = false; }
            else if (!window.uploadedUrls['candidateSignature']) { showError('candidateSignature', 'Candidate Signature upload failed or is still in progress.'); stepValid = false; }

            const citizenErr = validateFile(document.getElementById('citizenship'), ['application/pdf'], 'Citizenship document');
            if (citizenErr) { showError('citizenship', citizenErr); stepValid = false; }
            else if (!window.uploadedUrls['citizenship']) { showError('citizenship', 'Citizenship document upload failed or is still in progress.'); stepValid = false; }

            const coverErr = validateFile(document.getElementById('coverLetterFile'), ['application/pdf'], 'Cover Letter File');
            if (coverErr) { showError('coverLetterFile', coverErr); stepValid = false; }
            else if (!window.uploadedUrls['coverLetterFile']) { showError('coverLetterFile', 'Cover Letter File upload failed or is still in progress.'); stepValid = false; }

            const duesContainer = document.getElementById('duesReceiptContainer');
            const duesInput     = document.getElementById('duesReceipt');
            if (duesContainer && duesContainer.style.display !== 'none' && duesInput.required) {
                const duesErr = validateFile(duesInput, ALLOWED_DOC_TYPES, 'Club dues receipt');
                if (duesErr) { showError('duesReceipt', duesErr); stepValid = false; }
                else if (!window.uploadedUrls['duesReceipt']) { showError('duesReceipt', 'Club dues receipt upload failed or is still in progress.'); stepValid = false; }
            }
        } else if (stepNumber === 5) {
            clearError('nominationReceipt');
            clearError('transactionCode');

            // Validate Nomination Fee screenshot
            const nominationContainer = document.getElementById('nominationReceiptContainer');
            const nominationInput     = document.getElementById('nominationReceipt');
            if (nominationContainer && nominationInput.required) {
                const nominationErr = validateFile(nominationInput, ALLOWED_DOC_TYPES, 'Nomination Fee Paid Receipt');
                if (nominationErr) { showError('nominationReceipt', nominationErr); stepValid = false; }
                else if (!window.uploadedUrls['nominationReceipt']) { showError('nominationReceipt', 'Nomination Fee Paid Receipt upload failed or is still in progress.'); stepValid = false; }
            }

            // Validate Transaction Code
            if (transactionCodeInput && transactionCodeInput.required) {
                const val = transactionCodeInput.value.trim();
                if (!val) {
                    showError('transactionCode', 'Transaction code is required.'); stepValid = false;
                } else if (val.length < 4) {
                    showError('transactionCode', 'Transaction code must be at least 4 characters.'); stepValid = false;
                } else if (/[<>\"'%;()&]/.test(val)) {
                    showError('transactionCode', 'Transaction code contains invalid characters.'); stepValid = false;
                }
            }
        } else if (stepNumber === 6) {
            clearError('criminalRecord');
            clearError('termsAgreement');

            const criminalCheck = document.getElementById('criminalRecord');
            if (criminalCheck && !criminalCheck.checked) {
                showError('criminalRecord', 'You must confirm you have no criminal record.');
                stepValid = false;
            }

            const termsCheck = document.getElementById('termsAgreement');
            if (termsCheck && !termsCheck.checked) {
                showError('termsAgreement', 'You must agree to the terms and conditions.');
                stepValid = false;
            }
        }

        return stepValid;
    }

    function validateForm() {
        const s1 = validateStep(1);
        const s2 = validateStep(2);
        const s3 = validateStep(3);
        const s4 = validateStep(4);
        const s5 = validateStep(5);
        const s6 = validateStep(6);
        return s1 && s2 && s3 && s4 && s5 && s6;
    }

    // =============================================
    // HANDLE FORM SUBMISSION
    // =============================================

    // =============================================
    // PREVIEW & CONGRATULATIONS MODAL FLOW
    // =============================================
    const previewModal = document.getElementById('previewModal');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const cancelSubmitBtn = document.getElementById('cancelSubmitBtn');
    const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
    const previewDetails = document.getElementById('previewDetails');

    const congratulationsModal = document.getElementById('congratulationsModal');
    const congratulationsMsg = document.getElementById('congratulationsMsg');
    const doneCongratulationsBtn = document.getElementById('doneCongratulationsBtn');

    let pendingFormData = null;

    const closePreview = () => {
        previewModal.style.display = 'none';
        pendingFormData = null;
    };

    closePreviewBtn.addEventListener('click', closePreview);
    cancelSubmitBtn.addEventListener('click', closePreview);

    doneCongratulationsBtn.addEventListener('click', () => {
        congratulationsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            closePreview();
        }
        if (e.target === congratulationsModal) {
            congratulationsModal.style.display = 'none';
        }
    });

    confirmSubmitBtn.addEventListener('click', async () => {
        if (!pendingFormData) return;

        // Disable confirm button to prevent double-submit
        confirmSubmitBtn.disabled = true;
        confirmSubmitBtn.textContent = 'Submitting form...';

        try {
            const response = await fetch('/api/nominations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pendingFormData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to submit nomination to database.');
            }

            // Save to localStorage only as local backup
            let submissions = JSON.parse(localStorage.getItem('leoNominations') || '[]');
            submissions.push(pendingFormData);
            localStorage.setItem('leoNominations', JSON.stringify(submissions));

            // Reset uploaded URLs state
            window.uploadedUrls = {};

        } catch (err) {
            console.error('Submission error:', err);
            alert(err.message || 'Failed to submit nomination. Please try again.');
            confirmSubmitBtn.disabled = false;
            confirmSubmitBtn.textContent = 'Confirm & Submit';
            return;
        }

        // Prepare congratulations message
        congratulationsMsg.innerHTML = `Finally, you submitted your application for this post! The nomination committee will review your application and soon you will receive good news.`;

        // Reset state
        closePreview();
        form.reset();
        clearAllErrors();
        currentStep = 1;
        updateStepper();

        fileInputs.forEach(input => {
            const span = input.nextElementSibling;
            if (span && span.classList.contains('file-name')) {
                span.textContent = 'No file chosen';
                span.style.color = '#64748b';
                span.style.fontWeight = 'normal';
            }
        });

        criteriaContainer.classList.add('hidden');
        positionSelect.value = '';
        memberDetailsContainer.classList.add('hidden');
        resetPositionEligibility();
        if (document.getElementById('duesVerifiedNote')) {
            document.getElementById('duesVerifiedNote').style.display = 'none';
        }
        idVerificationMsg.textContent = '';
        idVerificationMsg.className = 'verification-msg';

        // Re-enable confirm button
        confirmSubmitBtn.disabled = false;
        confirmSubmitBtn.textContent = 'Confirm & Submit';

        // Show Congratulations modal
        congratulationsModal.style.display = 'block';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (checkFormDeadline()) {
            alert('Nominations are closed. Submissions are no longer accepted.');
            return;
        }

        // Rate limiting
        const now = Date.now();
        if (now - lastSubmitTime < 30000) {
            alert('Please wait 30 seconds before submitting again.');
            return;
        }

        if (!validateForm()) {
            // Find which step has the first error and switch to it
            for (let step = 1; step <= 6; step++) {
                if (!validateStep(step)) {
                    currentStep = step;
                    updateStepper();
                    break;
                }
            }
            // Scroll to first error
            const firstError = document.querySelector('.input-error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        lastSubmitTime = now;

        // Gather & sanitize data
        const hasLeoId = document.querySelector('input[name="hasLeoId"]:checked').value;
        const formData = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            hasLeoId,
            leoId:            sanitize(leoIdInput.value.trim()),
            fullName:         sanitize(fullNameInput.value.trim()),
            contactNo:        contactNoInput  ? sanitize(contactNoInput.value.trim())      : 'N/A',
            emailId:          emailIdInput    ? sanitize(emailIdInput.value.trim())        : 'N/A',
            currentPosition:  currentPositionInput ? sanitize(currentPositionInput.value.trim()) : 'N/A',
            positionApplyingFor: sanitize(positionSelect.options[positionSelect.selectedIndex].text),
            positionValue:    positionSelect.value,
            fee:              document.getElementById('feeAmount').textContent,
            transactionCode:  transactionCodeInput ? sanitize(transactionCodeInput.value.trim()) : 'N/A',
            coverLetter:      document.getElementById('coverLetterFile').files[0] ? document.getElementById('coverLetterFile').files[0].name : 'N/A',
            coverLetterName:  document.getElementById('coverLetterFile').files[0] ? document.getElementById('coverLetterFile').files[0].name : 'N/A',
            coverLetterUrl:   window.uploadedUrls['coverLetterFile'] || '',
            pastExperience:   sanitize(document.getElementById('pastExperience').value.trim()),
            areasOfInterest:  sanitize(document.getElementById('areasOfInterest').value.trim()),
            futurePlans:      sanitize(document.getElementById('futurePlans').value.trim()),
            formalPhotoName:  document.getElementById('formalPhoto').files[0] ? document.getElementById('formalPhoto').files[0].name : 'N/A',
            formalPhotoUrl:   window.uploadedUrls['formalPhoto'] || '',
            signatureName:    document.getElementById('candidateSignature').files[0] ? document.getElementById('candidateSignature').files[0].name : 'N/A',
            signatureUrl:     window.uploadedUrls['candidateSignature'] || '',
            citizenshipName:  document.getElementById('citizenship').files[0] ? document.getElementById('citizenship').files[0].name : 'N/A',
            citizenshipUrl:   window.uploadedUrls['citizenship'] || '',
            duesReceiptName:  (hasLeoId === 'yes' && typeof memberData !== 'undefined' && memberData[leoIdInput.value.trim()] && memberData[leoIdInput.value.trim()].duesPaid)
                ? 'Paid (Automatically Verified)'
                : (document.getElementById('duesReceipt').files[0] ? document.getElementById('duesReceipt').files[0].name : 'N/A'),
            duesReceiptUrl:   (hasLeoId === 'yes' && typeof memberData !== 'undefined' && memberData[leoIdInput.value.trim()] && memberData[leoIdInput.value.trim()].duesPaid)
                ? 'Paid (Automatically Verified)'
                : (window.uploadedUrls['duesReceipt'] || ''),
            nominationReceiptName: document.getElementById('nominationReceipt').files[0] ? document.getElementById('nominationReceipt').files[0].name : 'N/A',
            nominationReceiptUrl: window.uploadedUrls['nominationReceipt'] || '',
            acceptedTerms:    true,
            status:           'Pending'
        };

        // If Leo ID path, pull verified data
        if (hasLeoId === 'yes' && typeof memberData !== 'undefined' && memberData[formData.leoId]) {
            formData.emailId         = sanitize(memberData[formData.leoId].email    || 'N/A');
            formData.currentPosition = sanitize(memberData[formData.leoId].position || 'N/A');
            formData.contactNo       = sanitize(memberData[formData.leoId].contact  || 'N/A');
        }

        pendingFormData = formData;

        // Populate and show Preview Modal
        let detailsHtml = '';

        // Section 1: Member Info
        detailsHtml += '<div class="preview-section-title">1. Personal Information</div>';
        const savedTenure = localStorage.getItem('leoNominationTenure') || 'L.Y. 2025/26';
        detailsHtml += `<div class="preview-row"><span class="preview-label">Nomination Tenure</span><span class="preview-value"><strong>${savedTenure}</strong></span></div>`;
        detailsHtml += `<div class="preview-row"><span class="preview-label">Member Type</span><span class="preview-value">${formData.hasLeoId === 'yes' ? 'Registered Leo Member' : 'Non-Registered / Manual Entry'}</span></div>`;
        if (formData.hasLeoId === 'yes') {
            detailsHtml += `<div class="preview-row"><span class="preview-label">Leo ID</span><span class="preview-value">${formData.leoId}</span></div>`;
        }
        detailsHtml += `<div class="preview-row"><span class="preview-label">Full Name</span><span class="preview-value">${formData.fullName}</span></div>`;
        if (formData.contactNo && formData.contactNo !== 'N/A' && formData.contactNo.trim() !== '') {
            detailsHtml += `<div class="preview-row"><span class="preview-label">Contact No.</span><span class="preview-value">${formData.contactNo}</span></div>`;
        }
        detailsHtml += `<div class="preview-row"><span class="preview-label">Email Address</span><span class="preview-value">${formData.emailId}</span></div>`;
        detailsHtml += `<div class="preview-row"><span class="preview-label">Current Position</span><span class="preview-value">${formData.currentPosition}</span></div>`;

        // Section 2: Position Info
        detailsHtml += '<div class="preview-section-title">2. Applied Position</div>';
        detailsHtml += `<div class="preview-row"><span class="preview-label">Position</span><span class="preview-value"><strong>${formData.positionApplyingFor}</strong></span></div>`;
        detailsHtml += `<div class="preview-row"><span class="preview-label">Nomination Fee</span><span class="preview-value">${formData.fee}</span></div>`;

        // Section 3: Uploaded Files & Payment Details
        detailsHtml += '<div class="preview-section-title">3. Uploads & Payments</div>';
        
        const photoFile = document.getElementById('formalPhoto').files[0];
        detailsHtml += `<div class="preview-row"><span class="preview-label">Formal Photo</span><span class="preview-value">${photoFile ? photoFile.name : 'Not chosen'}</span></div>`;

        const sigFile = document.getElementById('candidateSignature').files[0];
        detailsHtml += `<div class="preview-row"><span class="preview-label">Candidate Signature</span><span class="preview-value">${sigFile ? sigFile.name : 'Not chosen'}</span></div>`;
        
        const citizenFile = document.getElementById('citizenship').files[0];
        detailsHtml += `<div class="preview-row"><span class="preview-label">Citizenship Document</span><span class="preview-value">${citizenFile ? citizenFile.name : 'Not chosen'}</span></div>`;

        const coverFile = document.getElementById('coverLetterFile').files[0];
        detailsHtml += `<div class="preview-row"><span class="preview-label">Cover Letter File</span><span class="preview-value">${coverFile ? coverFile.name : 'Not chosen'}</span></div>`;
        
        const duesContainer = document.getElementById('duesReceiptContainer');
        const duesFile = document.getElementById('duesReceipt').files[0];
        if (duesContainer && duesContainer.style.display !== 'none') {
            detailsHtml += `<div class="preview-row"><span class="preview-label">Club Dues Receipt</span><span class="preview-value">${duesFile ? duesFile.name : 'Not chosen'}</span></div>`;
        } else {
            detailsHtml += `<div class="preview-row"><span class="preview-label">Club Dues Status</span><span class="preview-value" style="color: var(--success-color); font-weight: 500;">✓ Automatically Verified</span></div>`;
        }

        const nominationFile = document.getElementById('nominationReceipt').files[0];
        detailsHtml += `<div class="preview-row"><span class="preview-label">Nomination Fee Receipt</span><span class="preview-value">${nominationFile ? nominationFile.name : 'Not chosen'}</span></div>`;
        detailsHtml += `<div class="preview-row"><span class="preview-label">Transaction Code</span><span class="preview-value"><code>${formData.transactionCode}</code></span></div>`;

        // Section 4: Candidate Statements
        detailsHtml += '<div class="preview-section-title">4. Candidate Statements</div>';
        detailsHtml += `<div class="preview-statement-container"><strong>Past Experience & Learning:</strong><p>${formData.pastExperience}</p></div>`;
        detailsHtml += `<div class="preview-statement-container"><strong>Areas of Interest:</strong><p>${formData.areasOfInterest}</p></div>`;
        detailsHtml += `<div class="preview-statement-container"><strong>Plans for Position:</strong><p>${formData.futurePlans}</p></div>`;

        previewDetails.innerHTML = detailsHtml;
        previewModal.style.display = 'block';
    });

    // =============================================
    // SUCCESS TOAST & ALERTS
    // =============================================

    function showCustomToast(message, isSuccess = true) {
        let toast = document.getElementById('successToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'successToast';
            toast.className = 'success-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = (isSuccess ? '&#10003; ' : '&#9888; ') + message;
        if (!isSuccess) {
            toast.style.background = 'var(--error-color)';
        } else {
            toast.style.background = '#1a7a4a';
        }
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 5000);
    }

    function showSuccessMessage() {
        showCustomToast('Nomination submitted successfully! Thank you.', true);
    }

    // =============================================
    // MEMBER DIRECTORY SEARCH SIDEBAR
    // =============================================
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const searchSidebar = document.getElementById('searchSidebar');
    const sidebarSearchInput = document.getElementById('sidebarSearchInput');
    const sidebarSearchResults = document.getElementById('sidebarSearchResults');

    function toggleSidebar(open) {
        if (open) {
            searchSidebar.classList.add('open');
            sidebarSearchInput.value = '';
            renderSidebarResults('');
            setTimeout(() => sidebarSearchInput.focus(), 150);
        } else {
            searchSidebar.classList.remove('open');
        }
    }

    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', () => toggleSidebar(true));
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
    }

    // Close when clicking outside of the sidebar content
    document.addEventListener('click', (e) => {
        if (searchSidebar && searchSidebar.classList.contains('open')) {
            if (!searchSidebar.contains(e.target) && e.target !== openSidebarBtn && !openSidebarBtn.contains(e.target)) {
                toggleSidebar(false);
            }
        }
    });

    function renderSidebarResults(query) {
        if (!sidebarSearchResults) return;
        sidebarSearchResults.innerHTML = '';
        
        const q = query.toLowerCase().trim();
        
        if (q === '') {
            sidebarSearchResults.innerHTML = `<div style="text-align: center; color: #64748b; margin-top: 2rem; font-size: 0.9rem;">Type name, email, or ID to search...</div>`;
            return;
        }
        
        let currentMembers = {};
        
        // Load custom members from localStorage if available, fallback to memberData from data.js
        const localData = localStorage.getItem('leoMemberData');
        if (localData) {
            try {
                currentMembers = JSON.parse(localData);
            } catch (e) {
                console.error('Failed to parse custom member list:', e);
                currentMembers = typeof memberData !== 'undefined' ? memberData : {};
            }
        } else {
            currentMembers = typeof memberData !== 'undefined' ? memberData : {};
        }

        const ids = Object.keys(currentMembers);
        let matches = 0;

        ids.forEach(id => {
            const member = currentMembers[id];
            // Match against ID, Name, Email, Phone contact, Position
            const isMatch = q === '' ||
                            id.toLowerCase().includes(q) ||
                            (member.name && member.name.toLowerCase().includes(q)) ||
                            (member.email && member.email.toLowerCase().includes(q)) ||
                            (member.contact && member.contact.toLowerCase().includes(q)) ||
                            (member.position && member.position.toLowerCase().includes(q));

            if (!isMatch) return;
            matches++;

            const card = document.createElement('div');
            card.className = 'member-search-card';
            
            const duesBadgeHtml = member.duesPaid 
                ? '<span class="badge-paid paid">Dues Paid</span>' 
                : '<span class="badge-paid unpaid">Dues Unpaid</span>';

            card.innerHTML = `
                <h4>${member.name}</h4>
                <p><strong>Leo ID:</strong> <code>${id}</code></p>
                <p><strong>Position:</strong> ${member.position || 'N/A'}</p>
                <p><strong>Email:</strong> ${member.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${member.contact || 'N/A'}</p>
                ${duesBadgeHtml}
                <button type="button" class="btn-sidebar-use" data-id="${id}">Use this ID</button>
            `;

            // Bind click handler for "Use this ID" button
            const useBtn = card.querySelector('.btn-sidebar-use');
            if (useBtn) {
                useBtn.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    useLeoIdFromSearch(id);
                });
            }

            // Clicking the card itself also selects the ID
            card.addEventListener('click', () => {
                useLeoIdFromSearch(id);
            });

            sidebarSearchResults.appendChild(card);
        });

        if (matches === 0) {
            sidebarSearchResults.innerHTML = `<div style="text-align: center; color: #64748b; margin-top: 2rem; font-size: 0.9rem;">No members found.</div>`;
        }
    }

    function useLeoIdFromSearch(id) {
        // Toggle "Do you have Leo ID?" to "Yes"
        const hasLeoIdRadio = document.querySelector('input[name="hasLeoId"][value="yes"]');
        if (hasLeoIdRadio) {
            hasLeoIdRadio.checked = true;
            hasLeoIdRadio.dispatchEvent(new Event('change'));
        }

        // Fill and verify ID
        if (leoIdInput) {
            leoIdInput.value = id;
            leoIdInput.dispatchEvent(new Event('input'));
        }

        // Close Sidebar Drawer
        toggleSidebar(false);
        showCustomToast('✓ Leo ID auto-filled and verified!', true);
    }

    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('input', (e) => {
            renderSidebarResults(e.target.value);
        });
    }
});

