document.addEventListener('DOMContentLoaded', () => {
    // Apply preferred theme
    setupTheme();
    
    // DOM Elements
    const addDateBtn = document.getElementById('addDateBtn');
    const addDateModal = document.getElementById('addDateModal');
    const addDateForm = document.getElementById('addDateForm');
    const cancelAddBtn = document.getElementById('cancelAdd');
    const datesList = document.getElementById('datesList');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Event Listeners
    addDateBtn.addEventListener('click', () => {
        addDateModal.style.display = 'block';
    });

    cancelAddBtn.addEventListener('click', () => {
        addDateModal.style.display = 'none';
        addDateForm.reset();
    });

    addDateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveDate();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterDates(btn.dataset.filter);
        });
    });

    // Load dates on popup open
    loadDates();

    // Initialize toggle state from storage
    const newTabToggle = document.getElementById('newTabViewToggle');
    if (newTabToggle) {
        // Load state from storage
        chrome.storage.local.get(['newTabEnabled'], function(result) {
            // Default to true if setting doesn't exist
            newTabToggle.checked = result.newTabEnabled !== false;
            console.log('RightOnTime: Initial toggle state:', newTabToggle.checked);
            
            // Add change listener with proper event handling
            newTabToggle.addEventListener('change', function(event) {
                handleToggleChange(event);
            });
        });
    } else {
        console.error('RightOnTime: Toggle element not found in popup');
    }

    // Theme setup function
    function setupTheme() {
        // Set dark theme by default
        document.body.classList.add('dark-theme');
        
        // Save theme preference to storage
        chrome.storage.local.set({ theme: 'dark' }, function() {
            console.log('RightOnTime: Theme set to dark mode');
        });
    }

    // Functions
    function saveDate() {
        const dateData = {
            type: document.getElementById('dateType').value,
            for: document.getElementById('dateFor').value,
            expiryDate: document.getElementById('expiryDate').value,
            notes: document.getElementById('notes').value,
            notifications: Array.from(document.querySelectorAll('.notifications input[type="checkbox"]:checked'))
                .map(cb => parseInt(cb.value)),
            id: Date.now(),
            createdAt: new Date().toISOString()
        };

        chrome.storage.local.get(['dates'], (result) => {
            const dates = result.dates || [];
            dates.push(dateData);
            chrome.storage.local.set({ dates }, () => {
                addDateModal.style.display = 'none';
                addDateForm.reset();
                loadDates();
                setupNotifications(dateData);
            });
        });
    }

    function loadDates() {
        chrome.storage.local.get(['dates'], (result) => {
            const dates = result.dates || [];
            displayDates(dates);
        });
    }

    function displayDates(dates) {
        datesList.innerHTML = '';
        
        if (dates.length === 0) {
            datesList.innerHTML = '<div class="empty-state">No dates added yet</div>';
            return;
        }

        dates.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
            .forEach(date => {
                const daysUntil = getDaysUntil(date.expiryDate);
                const urgencyClass = getUrgencyClass(daysUntil);
                
                const dateElement = document.createElement('div');
                dateElement.className = `date-item ${urgencyClass}`;
                dateElement.innerHTML = `
                    <div class="header">
                        <span class="title">${getDateTypeLabel(date.type)}</span>
                        <span class="expiry">${formatDate(date.expiryDate)}</span>
                    </div>
                    <div class="meta">
                        <span class="tag">${date.for}</span>
                        <span class="tag">${getDaysUntilText(daysUntil)}</span>
                    </div>
                    ${date.notes ? `<p class="notes">${date.notes}</p>` : ''}
                `;

                dateElement.addEventListener('click', () => showDateDetails(date));
                datesList.appendChild(dateElement);
            });
    }

    function filterDates(filter) {
        chrome.storage.local.get(['dates'], (result) => {
            let filteredDates = result.dates || [];

            switch (filter) {
                case 'personal':
                    filteredDates = filteredDates.filter(d => d.for === 'self');
                    break;
                case 'family':
                    filteredDates = filteredDates.filter(d => d.for !== 'self');
                    break;
                case 'urgent':
                    filteredDates = filteredDates.filter(d => {
                        const daysUntil = getDaysUntil(d.expiryDate);
                        return daysUntil <= 90;
                    });
                    break;
            }

            displayDates(filteredDates);
        });
    }

    function setupNotifications(dateData) {
        const expiryDate = new Date(dateData.expiryDate);
        
        dateData.notifications.forEach(days => {
            const notificationDate = new Date(expiryDate);
            notificationDate.setDate(notificationDate.getDate() - days);
            
            if (notificationDate > new Date()) {
                chrome.alarms.create(`${dateData.id}-${days}`, {
                    when: notificationDate.getTime()
                });
            }
        });
    }

    function showDateDetails(date) {
        // Implement date details view
        console.log('Show date details:', date);
    }

    // Utility functions
    function getDaysUntil(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const diffTime = date - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function getDaysUntilText(days) {
        if (days < 0) return 'Expired';
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `${days} days left`;
    }

    function getUrgencyClass(days) {
        if (days <= 30) return 'urgent-high';
        if (days <= 60) return 'urgent-medium';
        if (days <= 90) return 'urgent-low';
        return '';
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function getDateTypeLabel(type) {
        const labels = {
            h1b: 'H1B',
            f1: 'F1',
            opt: 'OPT',
            stemopt: 'STEM OPT',
            visa: 'Visa Stamping',
            i94: 'I-94',
            passport: 'Passport',
            ead: 'EAD/AP',
            dl: 'Driver\'s License',
            i140: 'I-140',
            i485: 'I-485',
            other: 'Other'
        };
        return labels[type] || type;
    }

    // Function to handle toggle change
    function handleToggleChange(event) {
        if (!event || !event.target) {
            console.error('RightOnTime: Invalid event in handleToggleChange');
            return;
        }

        // Explicitly convert to boolean
        const enabled = event.target.checked === true;
        console.log('RightOnTime: Toggle changed to', enabled);
        
        // Save to storage
        chrome.storage.local.set({ newTabEnabled: enabled }, () => {
            if (chrome.runtime.lastError) {
                console.error('RightOnTime: Error saving toggle state', chrome.runtime.lastError);
                showFeedback('Error saving setting', 'error');
                return;
            }
            
            console.log('RightOnTime: Toggle state saved to storage');
            
            // Notify background script
            chrome.runtime.sendMessage({ 
                action: 'toggleNewTab', 
                enabled: enabled 
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('RightOnTime: Error sending message', chrome.runtime.lastError);
                    showFeedback('Error updating setting', 'error');
                    return;
                }
                
                if (response && response.success) {
                    console.log('RightOnTime: Background script confirmed toggle update');
                    showFeedback(`Dashboard ${enabled ? 'enabled' : 'disabled'}`, 'success');
                } else {
                    console.error('RightOnTime: Background script failed to update toggle');
                    showFeedback('Error updating setting', 'error');
                }
            });
        });
    }

    // Function to show feedback message
    function showFeedback(message, type = 'info') {
        // Create feedback element if it doesn't exist
        let feedbackElement = document.getElementById('feedback-message');
        if (!feedbackElement) {
            feedbackElement = document.createElement('div');
            feedbackElement.id = 'feedback-message';
            document.body.appendChild(feedbackElement);
        }
        
        // Set message and class
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback ${type}`;
        
        // Show the feedback
        feedbackElement.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
    }
}); 