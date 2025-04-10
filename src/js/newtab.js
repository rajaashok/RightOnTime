// Add a debug function at the top of the file
function debugStorageData() {
    chrome.storage.local.get(['dates'], (result) => {
        const dates = result.dates || [];
        console.log('RightOnTime DEBUG: Storage data:', dates);
        console.log('RightOnTime DEBUG: Date types:');
        dates.forEach((date, index) => {
            console.log(`Date ${index}:`, {
                id: date.id, 
                idType: typeof date.id,
                expiryDate: date.expiryDate,
                hasNulls: !date.id || !date.type || !date.person || !date.expiryDate
            });
        });
    });
}

// Initialize the application when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('RightOnTime: DOM loaded, initializing application');
    
    try {
        // Apply dark theme
        applyTheme();
        
        // Check if the toggle exists and add a special debug message
        const toggleExists = !!document.getElementById('new-tab-toggle');
        console.log('RightOnTime: Toggle element exists:', toggleExists);
        
        // Initialize application
        initializeDashboard();
        initializeToggleState();
        setupEventListeners();
        
        // Double-check toggle state after a short delay
        setTimeout(checkToggleState, 500);
    } catch (error) {
        console.error('RightOnTime: Error during initialization', error);
    }
});

// Function to apply theme
function applyTheme() {
    // Always apply dark theme as default
    document.body.classList.add('dark-theme');
    console.log('RightOnTime: Applied dark theme to new tab page');
    
    // Listen for theme changes from popup or storage
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.theme) {
            if (changes.theme.newValue === 'dark') {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
            }
            console.log('RightOnTime: Theme changed to', changes.theme.newValue);
        }
    });
}

// Function to check toggle state and fix if needed
function checkToggleState() {
    try {
        const toggleElement = document.getElementById('new-tab-toggle');
        if (!toggleElement) {
            console.error('RightOnTime: Toggle element not found in checkToggleState');
            return;
        }
        
        chrome.storage.local.get(['newTabEnabled'], (result) => {
            const storageValue = result.newTabEnabled;
            const elementValue = toggleElement.checked;
            
            console.log('RightOnTime: Toggle check - Storage:', storageValue, 'Element:', elementValue);
            
            // If they don't match, update UI to match storage
            if ((storageValue === true && !elementValue) || 
                (storageValue === false && elementValue)) {
                console.log('RightOnTime: Toggle state mismatch, fixing...');
                toggleElement.checked = storageValue !== false;
            }
        });
    } catch (error) {
        console.error('RightOnTime: Error in checkToggleState', error);
    }
}

// Function to initialize dashboard content
function initializeDashboard() {
    console.log('RightOnTime: Loading dashboard...');
    
    // Debug storage data on load
    debugStorageData();
    
    // DOM Elements
    const addDateButton = document.getElementById('add-date-btn');
    const modal = document.getElementById('date-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const dateForm = document.getElementById('date-form');
    const datesGrid = document.getElementById('dates-grid');
    
    // Load dates on page load
    loadDates();
    
    // Make edit and delete functions globally available
    window.editDate = function(dateId) {
        console.log('RightOnTime: Edit clicked for date', dateId, typeof dateId);
        
        // Validate dateId more strictly
        if (!dateId || dateId === 'undefined' || dateId === 'null') {
            console.error('RightOnTime: Invalid date ID in global edit function:', dateId);
            alert('Error: Cannot edit date with invalid ID');
            return;
        }
        
        openEditModal(dateId);
    };
    
    window.deleteDate = function(dateId) {
        console.log('RightOnTime: Delete clicked for date', dateId, typeof dateId);
        
        // Validate dateId more strictly
        if (!dateId || dateId === 'undefined' || dateId === 'null') {
            console.error('RightOnTime: Invalid date ID in global delete function:', dateId);
            alert('Error: Cannot delete date with invalid ID');
            return;
        }
        
        confirmAndDelete(dateId);
    };
}

// Initialize toggle state
function initializeToggleState() {
    const toggleSwitch = document.getElementById('newTabToggle');
    if (!toggleSwitch) {
        console.error('RightOnTime: Toggle switch element not found');
        return;
    }

    chrome.storage.local.get(['newTabEnabled'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('RightOnTime: Error reading toggle state', chrome.runtime.lastError);
            return;
        }

        // Default to true if not set
        const enabled = result.newTabEnabled !== false;
        console.log('RightOnTime: Initial toggle state:', enabled);
        
        toggleSwitch.checked = enabled;
    });
}

// Handle toggle change
function handleToggleChange(event) {
    if (!event || !event.target) {
        console.error('RightOnTime: Invalid event object');
        return;
    }

    const enabled = event.target.checked === true;
    console.log('RightOnTime: Toggle changed to:', enabled);

    // Save to storage
    chrome.storage.local.set({ newTabEnabled: enabled }, () => {
        if (chrome.runtime.lastError) {
            console.error('RightOnTime: Error saving toggle state', chrome.runtime.lastError);
            showFeedback('Failed to save toggle state', 'error');
            return;
        }

        // Notify background script
        chrome.runtime.sendMessage({ 
            action: 'toggleNewTab', 
            enabled: enabled 
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('RightOnTime: Error sending message', chrome.runtime.lastError);
                showFeedback('Failed to update toggle state', 'error');
                return;
            }

            if (response && response.success) {
                showFeedback(enabled ? 'Dashboard enabled' : 'Dashboard disabled', 'success');
            } else {
                console.error('RightOnTime: Failed to update toggle state', response?.error);
                showFeedback('Failed to update toggle state', 'error');
            }
        });
    });
}

// Show feedback message
function showFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `feedback-message ${type}`;
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    
    // Remove after 3 seconds
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    const toggleSwitch = document.getElementById('newTabToggle');
    if (toggleSwitch) {
        // Remove any existing listeners
        const newToggle = toggleSwitch.cloneNode(true);
        toggleSwitch.parentNode.replaceChild(newToggle, toggleSwitch);
        
        // Add new listener
        newToggle.addEventListener('change', handleToggleChange);
        console.log('RightOnTime: Toggle event listener added');
    } else {
        console.error('RightOnTime: Toggle switch element not found');
    }
}

// Helper function to set up button listeners
function setupButtonListener(id, handler, description) {
    const button = document.getElementById(id);
    if (button) {
        button.addEventListener('click', handler);
        console.log(`RightOnTime: ${description} listener added`);
    } else {
        console.warn(`RightOnTime: ${description} not found`);
    }
}

// Helper function to set up form listeners
function setupFormListener(id, description) {
    const form = document.getElementById(id);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('RightOnTime: Form submitted');
            saveDateFromForm();
        });
        console.log(`RightOnTime: ${description} listener added`);
    } else {
        console.warn(`RightOnTime: ${description} not found`);
    }
}

// Helper function to set up modal outside click listener
function setupModalOutsideClickListener() {
    const modal = document.getElementById('date-modal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
        console.log('RightOnTime: Modal outside click listener added');
    } else {
        console.warn('RightOnTime: Modal element not found');
    }
}

// Setup grid click handlers
function setupGridClickHandlers() {
    // Event delegation for buttons in the dates grid
    const datesGrid = document.getElementById('dates-grid');
    if (datesGrid) {
        datesGrid.addEventListener('click', function(e) {
            try {
                // Find if a button was clicked
                const button = e.target.closest('button');
                if (!button) return; // Not a button click
                
                console.log('RightOnTime: Button clicked in grid', button);
                
                // Extract data attributes, ensure they're strings
                const action = String(button.dataset.action || '');
                const dateId = String(button.dataset.id || '');
                
                console.log('RightOnTime: Button data', { action, dateId });
                
                if (!action || !dateId) {
                    console.error('RightOnTime: Missing action or dateId', { 
                        action: action || 'undefined', 
                        dateId: dateId || 'undefined',
                        buttonHTML: button.outerHTML
                    });
                    return;
                }
                
                if (action === 'edit') {
                    console.log('RightOnTime: Edit action triggered for', dateId);
                    openEditModal(dateId);
                } else if (action === 'delete') {
                    console.log('RightOnTime: Delete action triggered for', dateId);
                    confirmAndDelete(dateId);
                } else {
                    console.warn('RightOnTime: Unknown action', action);
                }
            } catch (error) {
                console.error('RightOnTime: Error handling grid button click', error);
            }
        });
        console.log('RightOnTime: Grid click handler added');
    } else {
        console.warn('RightOnTime: Dates grid not found');
    }
}

// Setup timeline click handlers
function setupTimelineClickHandlers() {
    // Event delegation for timeline items
    const timelineContent = document.getElementById('timeline-content');
    if (timelineContent) {
        timelineContent.addEventListener('click', function(e) {
            try {
                // Check if a timeline item or child was clicked
                const timelineItem = e.target.closest('.timeline-item');
                if (!timelineItem) return;
                
                const dateId = String(timelineItem.dataset.id || '');
                if (!dateId) {
                    console.error('RightOnTime: Timeline item clicked but no dateId found', timelineItem);
                    return;
                }
                
                console.log('RightOnTime: Timeline item clicked', dateId);
                openEditModal(dateId);
            } catch (error) {
                console.error('RightOnTime: Error handling timeline click', error);
            }
        });
        console.log('RightOnTime: Timeline click handler added');
    } else {
        console.warn('RightOnTime: Timeline content not found');
    }
}

// New function to handle direct toggle clicks
function handleToggleClick(event) {
    // Prevent default behavior to manually handle the toggle
    event.stopPropagation();
    
    // Get current state
    const toggleSwitch = event.target.closest('input[type="checkbox"]');
    if (!toggleSwitch) {
        console.error('RightOnTime: Toggle click handler called but no checkbox found');
        return;
    }
    
    console.log('RightOnTime: Toggle CLICKED, current state:', toggleSwitch.checked);
    
    // Let the change event handler take over from here
    // This function ensures the click is registered
}

// Modal Functions
function openAddModal() {
    const modal = document.getElementById('date-modal');
    const form = document.getElementById('date-form');
    const modalTitle = document.getElementById('modal-title');

    // Reset form and set mode
    form.reset();
    form.setAttribute('data-mode', 'add');
    form.removeAttribute('data-date-id');
    modalTitle.textContent = 'Add New Date';

    // Open modal
    modal.classList.add('active');
}

function openEditModal(dateId) {
    console.log('RightOnTime: Opening edit modal for date', dateId, typeof dateId);
    
    // Validate dateId
    if (!dateId || dateId === 'undefined' || dateId === 'null') {
        console.error('RightOnTime: Cannot edit date with invalid ID');
        alert('Error: Invalid date ID');
        return;
    }
    
    const modal = document.getElementById('date-modal');
    const form = document.getElementById('date-form');
    const modalTitle = document.getElementById('modal-title');

    // Reset form and set mode
    form.reset();
    form.setAttribute('data-mode', 'edit');
    form.setAttribute('data-date-id', dateId);
    modalTitle.textContent = 'Edit Date';

    // Load date data
    chrome.storage.local.get(['dates'], (result) => {
        const dates = result.dates || [];
        console.log('RightOnTime: All dates for editing:', dates);
        
        // Find the date, handling both string and object IDs
        const date = dates.find(d => {
            if (!d || !d.id) return false;
            
            // Handle cases where IDs might be strings or objects
            return d.id.toString() === dateId.toString();
        });
        
        if (date) {
            console.log('RightOnTime: Found date to edit', date);
            
            try {
                form.dateType.value = date.type || '';
                form.person.value = date.person || '';
                form.personName.value = date.personName || '';
                form.expiryDate.value = formatDateForInput(date.expiryDate);
                form.notes.value = date.notes || '';
                
                // Handle notifications object structure
                if (date.notifications) {
                    form.notify90.checked = date.notifications.days90 || false;
                    form.notify60.checked = date.notifications.days60 || false;
                    form.notify30.checked = date.notifications.days30 || false;
                } else {
                    // Default or legacy format
                    form.notify90.checked = true;
                    form.notify60.checked = true;
                    form.notify30.checked = true;
                }
                
                // Open modal after populating data
                modal.classList.add('active');
            } catch (error) {
                console.error('RightOnTime: Error populating form', error);
                alert('Error loading date data into form. Please try again.');
            }
        } else {
            console.error(`RightOnTime: Date not found for editing ID: "${dateId}"`);
            
            // Log all IDs for debugging
            console.log('RightOnTime: Available IDs:', dates.map(d => d?.id));
            
            alert('Error: Could not find the date to edit.');
        }
    });
}

function closeModal() {
    const modal = document.getElementById('date-modal');
    modal.classList.remove('active');
}

function saveDateFromForm() {
    const form = document.getElementById('date-form');
    const mode = form.getAttribute('data-mode');
    const dateId = form.getAttribute('data-date-id');
    
    console.log('RightOnTime: Saving date', {mode, dateId});

    // Validate form
    if (!form.dateType.value || !form.person.value || !form.expiryDate.value) {
        alert('Please fill in all required fields');
        return;
    }

    const dateData = {
        id: mode === 'add' ? generateId() : dateId,
        type: form.dateType.value,
        person: form.person.value,
        personName: form.personName.value || '',
        expiryDate: form.expiryDate.value,
        notes: form.notes.value,
        notifications: {
            days90: form.notify90.checked,
            days60: form.notify60.checked,
            days30: form.notify30.checked
        }
    };

    chrome.storage.local.get(['dates'], (result) => {
        let dates = result.dates || [];
        
        if (mode === 'add') {
            dates.push(dateData);
            console.log('RightOnTime: Added new date', dateData);
        } else {
            const index = dates.findIndex(d => d.id === dateId);
            if (index !== -1) {
                dates[index] = dateData;
                console.log('RightOnTime: Updated date', dateData);
            } else {
                console.error('RightOnTime: Date not found for updating', dateId);
                alert('Error: Could not find the date to update.');
                return;
            }
        }

        // Save the updated dates
        chrome.storage.local.set({ dates }, () => {
            console.log('RightOnTime: Successfully saved dates to storage');
            
            // Close modal and refresh UI
            closeModal();
            
            // Force a complete reload of all dates
            loadDates();
            
            // Update notifications
            updateNotifications(dateData);
            
            console.log('RightOnTime: Date saved successfully, UI refreshed');
        });
    });
}

function confirmAndDelete(dateId) {
    if (!dateId) {
        console.error('RightOnTime: Attempted to delete date with invalid ID');
        return;
    }
    
    if (confirm('Are you sure you want to delete this date?')) {
        console.log('RightOnTime: Deleting date', dateId);
        
        chrome.storage.local.get(['dates'], (result) => {
            const dates = result.dates || [];
            
            // Find the date before deleting for better logging
            const dateToDelete = dates.find(d => d.id === dateId);
            console.log('RightOnTime: Found date to delete', dateToDelete);
            
            const newDates = dates.filter(d => d.id !== dateId);
            
            // Save the updated dates list
            chrome.storage.local.set({ dates: newDates }, () => {
                console.log('RightOnTime: Successfully removed date from storage');
                
                // Force a complete reload of all dates
                loadDates();
                
                // Remove associated alarms
                chrome.alarms.clear(`${dateId}_90`);
                chrome.alarms.clear(`${dateId}_60`);
                chrome.alarms.clear(`${dateId}_30`);
                
                console.log('RightOnTime: Date deleted successfully, UI refreshed');
            });
        });
    }
}

// UI Functions
function loadDates() {
    console.log('RightOnTime: Loading dates from storage');
    
    chrome.storage.local.get(['dates'], (result) => {
        let dates = result.dates || [];
        
        console.log('RightOnTime: Raw dates from storage:', dates);
        
        // Remove any invalid dates (null, undefined, etc.)
        const cleanedDates = dates.filter(date => {
            if (!date) {
                console.warn('RightOnTime: Found null/undefined date entry, removing it');
                return false;
            }
            return true;
        });
        
        // Validate dates and add missing IDs
        const validDates = cleanedDates.map(date => {
            if (!date.id || date.id === 'undefined' || date.id === 'null') {
                console.warn('RightOnTime: Date missing valid ID, adding one', date);
                return { ...date, id: generateId() };
            }
            // Ensure expiryDate is valid
            if (!date.expiryDate) {
                console.warn('RightOnTime: Date missing expiryDate, setting to today', date);
                date.expiryDate = new Date().toISOString().split('T')[0];
            }
            return date;
        });
        
        // If we fixed any dates, save them back
        if (JSON.stringify(dates) !== JSON.stringify(validDates)) {
            console.log('RightOnTime: Fixed dates with issues, saving back to storage');
            chrome.storage.local.set({ dates: validDates });
        }
        
        if (validDates.length === 0) {
            displayEmptyState();
            return;
        }

        // Sort dates by expiry and display them
        displayDates(validDates);
    });
}

function displayDates(dates) {
    console.log('RightOnTime: Displaying dates', dates);
    
    const datesGrid = document.getElementById('dates-grid');
    datesGrid.innerHTML = '';
    
    // Double-check sorting to make sure the next date is truly the closest
    const sortedDates = [...dates].sort((a, b) => {
        const dateA = new Date(a.expiryDate);
        const dateB = new Date(b.expiryDate);
        return dateA - dateB;
    });
    
    console.log('RightOnTime: Sorted dates', sortedDates);

    // Display next expiring date
    if (sortedDates.length > 0) {
        const nextDate = sortedDates[0];
        console.log('RightOnTime: Next date is', nextDate);
        const nextDateEl = createNextDateElement(nextDate);
        datesGrid.appendChild(nextDateEl);

        // Display other dates
        sortedDates.slice(1).forEach(date => {
            const dateCard = createDateCard(date);
            datesGrid.appendChild(dateCard);
        });
    }
    
    // Update the timeline view
    updateTimelineView(sortedDates);
}

function createNextDateElement(date) {
    console.log('RightOnTime: Creating next date element for', date);
    
    if (!date || !date.id) {
        console.error('RightOnTime: Invalid date object for next date element', date);
        return document.createElement('div'); // Return empty div to avoid errors
    }
    
    const daysRemaining = calculateDaysRemaining(date.expiryDate);
    const urgencyClass = getUrgencyClass(daysRemaining);
    
    const element = document.createElement('div');
    element.className = `next-date ${urgencyClass}`;
    
    // Create content div
    const contentDiv = document.createElement('div');
    
    // Create date type span
    const typeSpan = document.createElement('span');
    typeSpan.className = 'date-type';
    typeSpan.textContent = getDateTypeLabel(date.type);
    contentDiv.appendChild(typeSpan);
    
    // Create countdown div
    const countdownDiv = document.createElement('div');
    countdownDiv.className = 'countdown';
    countdownDiv.textContent = `${daysRemaining} days remaining`;
    contentDiv.appendChild(countdownDiv);
    
    // Create details div with personalized name
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'details';
    const personName = getPersonDisplayName(date);
    detailsDiv.textContent = `${personName}'s ${getDateTypeLabel(date.type)} expires on ${formatDate(date.expiryDate)}`;
    contentDiv.appendChild(detailsDiv);
    
    // Add notes if they exist
    if (date.notes) {
        const notesDiv = document.createElement('div');
        notesDiv.className = 'notes';
        notesDiv.textContent = date.notes;
        contentDiv.appendChild(notesDiv);
    }
    
    // Add content div to element
    element.appendChild(contentDiv);
    
    // Create actions div
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'date-actions';
    
    // Create edit button
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'button';
    editButton.textContent = 'Edit';
    editButton.dataset.id = date.id;
    editButton.dataset.action = 'edit';
    actionsDiv.appendChild(editButton);
    
    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.dataset.id = date.id;
    deleteButton.dataset.action = 'delete';
    actionsDiv.appendChild(deleteButton);
    
    // Add actions div to element
    element.appendChild(actionsDiv);
    
    return element;
}

function createDateCard(date) {
    console.log('RightOnTime: Creating date card for', date);
    
    if (!date || !date.id) {
        console.error('RightOnTime: Invalid date object for date card', date);
        return document.createElement('div'); // Return empty div to avoid errors
    }
    
    const daysRemaining = calculateDaysRemaining(date.expiryDate);
    const urgencyClass = getUrgencyClass(daysRemaining);
    
    const element = document.createElement('div');
    element.className = `date-card ${urgencyClass}`;
    
    // Create date type span
    const typeSpan = document.createElement('span');
    typeSpan.className = 'date-type';
    typeSpan.textContent = getDateTypeLabel(date.type);
    element.appendChild(typeSpan);
    
    // Create info div
    const infoDiv = document.createElement('div');
    infoDiv.className = 'date-info';
    
    // Create person name - use custom name if available
    const personStrong = document.createElement('strong');
    personStrong.textContent = getPersonDisplayName(date);
    infoDiv.appendChild(personStrong);
    
    // Create expiry date div
    const expiryDiv = document.createElement('div');
    expiryDiv.textContent = `Expires: ${formatDate(date.expiryDate)}`;
    infoDiv.appendChild(expiryDiv);
    
    // Create days remaining div
    const daysDiv = document.createElement('div');
    daysDiv.textContent = `${daysRemaining} days remaining`;
    infoDiv.appendChild(daysDiv);
    
    // Add notes if they exist
    if (date.notes) {
        const notesDiv = document.createElement('div');
        notesDiv.className = 'notes';
        notesDiv.textContent = date.notes;
        infoDiv.appendChild(notesDiv);
    }
    
    // Add info div to element
    element.appendChild(infoDiv);
    
    // Create actions div
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'date-actions';
    
    // Create edit button
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'button';
    editButton.textContent = 'Edit';
    editButton.dataset.id = date.id;
    editButton.dataset.action = 'edit';
    actionsDiv.appendChild(editButton);
    
    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.dataset.id = date.id;
    deleteButton.dataset.action = 'delete';
    actionsDiv.appendChild(deleteButton);
    
    // Add actions div to element
    element.appendChild(actionsDiv);
    
    return element;
}

function displayEmptyState() {
    const datesGrid = document.getElementById('dates-grid');
    datesGrid.innerHTML = '';
    
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'next-date empty-state';
    
    const title = document.createElement('h2');
    title.textContent = 'No dates added yet';
    emptyDiv.appendChild(title);
    
    const message = document.createElement('p');
    message.textContent = 'Click the "Add Date" button to start tracking important dates.';
    emptyDiv.appendChild(message);
    
    const addButton = document.createElement('button');
    addButton.className = 'button primary';
    addButton.id = 'empty-add-btn';
    addButton.textContent = 'Add Your First Date';
    addButton.addEventListener('click', openAddModal);
    emptyDiv.appendChild(addButton);
    
    datesGrid.appendChild(emptyDiv);
    
    // Also update the timeline
    const timelineContent = document.getElementById('timeline-content');
    timelineContent.innerHTML = '';
    
    const timelineEmptyMessage = document.createElement('div');
    timelineEmptyMessage.className = 'empty-state';
    timelineEmptyMessage.textContent = 'No dates available for timeline view';
    timelineContent.appendChild(timelineEmptyMessage);
}

// Notification Functions
function updateNotifications(dateData) {
    // Clear existing alarms for this date
    chrome.alarms.clear(`${dateData.id}_90`);
    chrome.alarms.clear(`${dateData.id}_60`);
    chrome.alarms.clear(`${dateData.id}_30`);
    
    const expiryDate = new Date(dateData.expiryDate);
    
    if (dateData.notifications.days90) {
        createAlarm(dateData.id, expiryDate, 90);
    }
    if (dateData.notifications.days60) {
        createAlarm(dateData.id, expiryDate, 60);
    }
    if (dateData.notifications.days30) {
        createAlarm(dateData.id, expiryDate, 30);
    }
}

function createAlarm(dateId, expiryDate, days) {
    const alarmDate = new Date(expiryDate);
    alarmDate.setDate(alarmDate.getDate() - days);
    
    if (alarmDate > new Date()) {
        chrome.alarms.create(`${dateId}_${days}`, {
            when: alarmDate.getTime()
        });
    }
}

// Utility Functions
function calculateDaysRemaining(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getUrgencyClass(daysRemaining) {
    if (daysRemaining <= 30) return 'urgent-high';
    if (daysRemaining <= 60) return 'urgent-medium';
    return 'urgent-low';
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateForInput(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '';
    }
    return date.toISOString().split('T')[0];
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
        dl: "Driver's License",
        i140: 'I-140',
        i485: 'I-485',
        other: 'Other'
    };
    return labels[type] || type;
}

// Add a function to update the timeline view
function updateTimelineView(dates) {
    const timelineContent = document.getElementById('timeline-content');
    timelineContent.innerHTML = '';
    
    // Group dates by person
    const personGroups = groupDatesByPerson(dates);
    
    // If no dates, show message
    if (Object.keys(personGroups).length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        emptyMessage.textContent = 'No dates available for timeline view';
        timelineContent.appendChild(emptyMessage);
        return;
    }
    
    // Create a section for each person
    Object.keys(personGroups).forEach(personKey => {
        const group = personGroups[personKey];
        const personDates = group.dates;
        
        // Create section
        const section = document.createElement('div');
        section.className = 'timeline-section';
        
        // Add person header
        const header = document.createElement('h3');
        header.textContent = group.displayName;
        section.appendChild(header);
        
        // Add dates to timeline
        personDates.forEach(date => {
            const timelineItem = createTimelineItem(date);
            section.appendChild(timelineItem);
        });
        
        timelineContent.appendChild(section);
    });
}

// Function to group dates by person (considering custom names)
function groupDatesByPerson(dates) {
    const groups = {};
    
    dates.forEach(date => {
        // Skip invalid dates
        if (!date) return;
        
        // Use category as key, but keep track of custom names
        const personCategory = date.person || 'other';
        
        if (!groups[personCategory]) {
            groups[personCategory] = {
                displayName: personLabel(personCategory),
                dates: []
            };
        }
        
        groups[personCategory].dates.push(date);
    });
    
    // Sort each person's dates
    Object.keys(groups).forEach(person => {
        groups[person].dates.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    });
    
    return groups;
}

// Function to create a timeline item
function createTimelineItem(date) {
    const daysRemaining = calculateDaysRemaining(date.expiryDate);
    const urgencyClass = getUrgencyClass(daysRemaining);
    
    const item = document.createElement('div');
    item.className = `timeline-item ${urgencyClass}`;
    item.dataset.id = date.id;
    
    // Create label with type and custom name
    const label = document.createElement('div');
    label.className = 'timeline-label';
    const personName = getPersonDisplayName(date);
    label.textContent = `${personName}'s ${getDateTypeLabel(date.type)}`;
    item.appendChild(label);
    
    // Create expiry date
    const expiryDiv = document.createElement('div');
    expiryDiv.className = 'timeline-date';
    expiryDiv.textContent = `Expires: ${formatDate(date.expiryDate)}`;
    item.appendChild(expiryDiv);
    
    // Create days remaining
    const daysDiv = document.createElement('div');
    daysDiv.className = 'timeline-days';
    daysDiv.textContent = `${daysRemaining} days remaining`;
    item.appendChild(daysDiv);
    
    // Add click handler to edit date
    item.addEventListener('click', () => {
        openEditModal(date.id);
    });
    
    return item;
}

// Function to get a user-friendly label for person
function personLabel(person) {
    const labels = {
        'self': 'Self',
        'spouse': 'Spouse',
        'child': 'Child',
        'parent': 'Parent'
    };
    
    return labels[person] || person;
}

// Helper function to get display name for a person
function getPersonDisplayName(date) {
    if (date.personName && date.personName.trim()) {
        return date.personName.trim();
    }
    
    return personLabel(date.person);
}