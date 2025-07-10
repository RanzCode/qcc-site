// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const newsletterForm = document.getElementById('newsletterForm');

    // API base URL - update this to your backend URL
    const API_BASE_URL = 'http://localhost:3000/api';

    // Contact form submission
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // Validate form
            if (validateContactForm(data)) {
                const removeLoading = addLoadingState(contactForm.querySelector('button[type="submit"]'));
                
                try {
                    const response = await fetch(`${API_BASE_URL}/contact/submit`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                        contactForm.reset();
                    } else {
                        showNotification(result.error || 'Failed to send message. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Contact form error:', error);
                    showNotification('Network error. Please check your connection and try again.', 'error');
                } finally {
                    removeLoading();
                }
            }
        });
    }

    // Newsletter form submission
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = newsletterForm.querySelector('input[type="email"]').value;
            
            if (validateEmail(email)) {
                const removeLoading = addLoadingState(newsletterForm.querySelector('button[type="submit"]'));
                
                try {
                    const response = await fetch(`${API_BASE_URL}/contact/newsletter`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        showNotification('Successfully subscribed to our newsletter!', 'success');
                        newsletterForm.reset();
                    } else {
                        showNotification(result.error || 'Failed to subscribe. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Newsletter subscription error:', error);
                    showNotification('Network error. Please check your connection and try again.', 'error');
                } finally {
                    removeLoading();
                }
            } else {
                showNotification('Please enter a valid email address.', 'error');
            }
        });
    }
});

// Validate contact form
function validateContactForm(data) {
    const required = ['firstName', 'lastName', 'email', 'subject', 'message'];
    
    for (let field of required) {
        if (!data[field] || data[field].trim() === '') {
            showNotification(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`, 'error');
            return false;
        }
    }
    
    if (!validateEmail(data.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return false;
    }
    
    return true;
}