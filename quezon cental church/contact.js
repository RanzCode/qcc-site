// ============================================================
// EMAILJS CONFIGURATION
// ------------------------------------------------------------
// Steps to activate email delivery to qccfsda@gmail.com:
//
// 1. Sign up for a free account at https://www.emailjs.com
//
// 2. Add an Email Service:
//    Dashboard → Email Services → Add New Service → Gmail
//    Connect the qccfsda@gmail.com Gmail account.
//    Copy the resulting Service ID and paste it below.
//
// 3. Create an Email Template:
//    Dashboard → Email Templates → Create New Template
//    Set "To Email" to: qccfsda@gmail.com
//    Use these exact template variables in the template body:
//      {{first_name}}   — sender's first name
//      {{last_name}}    — sender's last name
//      {{from_email}}   — sender's email address
//      {{phone}}        — sender's phone number
//      {{subject}}      — selected subject
//      {{message}}      — message body
//    Copy the resulting Template ID and paste it below.
//
// 4. Copy your Public Key:
//    Dashboard → Account → API Keys → Public Key
//    Paste it below.
//
// 5. Save this file — the form will start sending live emails.
// ============================================================

const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ← replace with your Public Key
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ← replace with your Service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // ← replace with your Template ID

// Initialize EmailJS with your public key
(function () {
    emailjs.init(EMAILJS_PUBLIC_KEY);
})();

// ============================================================
// CONTACT FORM
// ============================================================
document.addEventListener('DOMContentLoaded', function () {

    const contactForm   = document.getElementById('contactForm');
    const submitBtn     = document.getElementById('contactSubmitBtn');
    const statusBox     = document.getElementById('contactStatus');
    const newsletterForm = document.getElementById('newsletterForm');

    // --------------------------------------------------------
    // Contact form submission
    // --------------------------------------------------------
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Collect field values
            const data = {
                firstName : contactForm.firstName.value.trim(),
                lastName  : contactForm.lastName.value.trim(),
                email     : contactForm.email.value.trim(),
                phone     : contactForm.phone.value.trim(),
                subject   : contactForm.subject.value,
                message   : contactForm.message.value.trim(),
            };

            // Validate before sending
            if (!validateContactForm(data)) return;

            // Show loading state
            const restoreBtn = setLoadingState(submitBtn, 'Sending...');
            hideStatus(statusBox);

            // Map form values to EmailJS template variables.
            // These keys must match the {{variable}} names in your EmailJS template.
            const templateParams = {
                first_name : data.firstName,
                last_name  : data.lastName,
                from_email : data.email,
                phone      : data.phone || 'Not provided',
                subject    : data.subject,
                message    : data.message,
            };

            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
                .then(function () {
                    showStatus(
                        statusBox,
                        'success',
                        '<strong>Thank you!</strong> Your message has been sent successfully. We\'ll get back to you as soon as possible.'
                    );
                    contactForm.reset();
                })
                .catch(function (err) {
                    console.error('EmailJS error:', err);
                    showStatus(
                        statusBox,
                        'error',
                        'Something went wrong and your message could not be sent. Please try again, or email us directly at <a href="mailto:qccfsda@gmail.com">qccfsda@gmail.com</a>.'
                    );
                })
                .finally(function () {
                    restoreBtn();
                });
        });
    }

    // --------------------------------------------------------
    // Newsletter form — basic UX only (no backend required)
    // --------------------------------------------------------
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (!isValidEmail(emailInput.value.trim())) {
                alert('Please enter a valid email address.');
                return;
            }
            // TODO: wire this up to your preferred newsletter service
            alert('Thank you for subscribing! We\'ll keep you updated.');
            newsletterForm.reset();
        });
    }
});

// ============================================================
// VALIDATION HELPERS
// ============================================================

function validateContactForm(data) {
    const requiredFields = [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName',  label: 'Last Name'  },
        { key: 'email',     label: 'Email'       },
        { key: 'subject',   label: 'Subject'     },
        { key: 'message',   label: 'Message'     },
    ];

    for (const field of requiredFields) {
        if (!data[field.key]) {
            focusField(field.key);
            alert(`Please fill in the "${field.label}" field.`);
            return false;
        }
    }

    if (!isValidEmail(data.email)) {
        focusField('email');
        alert('Please enter a valid email address.');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function focusField(name) {
    const el = document.querySelector(`[name="${name}"]`);
    if (el) el.focus();
}

// ============================================================
// UI HELPERS
// ============================================================

/**
 * Disables the button and shows a loading label.
 * Returns a function that restores the original state.
 */
function setLoadingState(btn, loadingText) {
    const original = btn.textContent;
    btn.disabled    = true;
    btn.textContent = loadingText;
    return function () {
        btn.disabled    = false;
        btn.textContent = original;
    };
}

/**
 * Shows a styled success or error message in the status box.
 * @param {HTMLElement} box
 * @param {'success'|'error'} type
 * @param {string} html  — message content (HTML allowed)
 */
function showStatus(box, type, html) {
    box.innerHTML = html;
    box.style.display  = 'block';
    box.style.color    = type === 'success' ? '#1a5c2e' : '#7f1d1d';
    box.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
    box.style.border   = `1px solid ${type === 'success' ? '#86efac' : '#fca5a5'}`;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideStatus(box) {
    box.style.display = 'none';
    box.innerHTML = '';
}
