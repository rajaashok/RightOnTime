// Listen for alarms going off
chrome.alarms.onAlarm.addListener((alarm) => {
    // Extract date ID and notification days from alarm name
    const [dateId, days] = alarm.name.split('_');
    
    // Get the date from storage
    chrome.storage.local.get(['dates'], (result) => {
        const dates = result.dates || [];
        const date = dates.find(d => d.id === dateId);
        
        if (date) {
            // Get person name (custom name or category)
            const personName = getPersonDisplayName(date);
            
            // Create notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('src/images/icon128.png'),
                title: `${date.type.toUpperCase()} Expiring Soon`,
                message: `${personName}'s ${getDateTypeLabel(date.type)} will expire in ${days} days (${formatDate(date.expiryDate)})`,
                buttons: [{ title: 'View Details' }]
            });
        }
    });
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    // Open the extension popup when notification is clicked
    chrome.tabs.create({ url: chrome.runtime.getURL('src/html/popup.html') });
});

// Global variable to track current setting
let newTabEnabled = true;

// Handle messages from popup and newtab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('RightOnTime: Received message:', message);
    
    if (message.action === 'toggleNewTab') {
        // Explicitly convert to boolean
        const enabled = message.enabled === true;
        console.log('RightOnTime: Toggling new tab dashboard:', enabled);
        
        // Save to storage
        chrome.storage.local.set({ newTabEnabled: enabled }, () => {
            if (chrome.runtime.lastError) {
                console.error('RightOnTime: Error saving toggle state', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError });
                return;
            }
            
            console.log('RightOnTime: Toggle state saved to storage');
            sendResponse({ success: true });
        });
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }
    
    // Default response for unknown actions
    sendResponse({ success: false, error: 'Unknown action' });
});

// Initialize storage with default values
chrome.runtime.onInstalled.addListener(() => {
    console.log('RightOnTime: Extension installed/updated');
    
    chrome.storage.local.get(['newTabEnabled'], (result) => {
        // Only set default if not already set
        if (result.newTabEnabled === undefined) {
            chrome.storage.local.set({ newTabEnabled: true }, () => {
                if (chrome.runtime.lastError) {
                    console.error('RightOnTime: Error setting default toggle state', chrome.runtime.lastError);
                    return;
                }
                console.log('RightOnTime: Default toggle state set to true');
            });
        }
    });
});

// Listen for tab creation and handle new tab override
chrome.tabs.onCreated.addListener((tab) => {
    // Only handle new tab pages
    if (tab.pendingUrl !== 'chrome://newtab/' && tab.url !== 'chrome://newtab/') return;
    
    console.log('RightOnTime: New tab created, checking dashboard setting...');
    
    // Always check storage for most reliable behavior
    chrome.storage.local.get(['newTabEnabled'], (result) => {
        // Default to true if not set, but strictly compare otherwise
        const showDashboard = result.newTabEnabled === undefined ? true : (result.newTabEnabled === true);
        
        // Update memory variable to stay in sync
        newTabEnabled = showDashboard;
        
        if (!showDashboard) {
            console.log('RightOnTime: Dashboard disabled, showing default new tab page');
            
            // Redirect to Google's default new tab page
            chrome.tabs.update(tab.id, { 
                url: 'https://www.google.com'
            });
        }
        // If enabled, let the manifest handle showing the dashboard
    });
});

// Utility functions
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

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Helper function to get display name for a person
function getPersonDisplayName(date) {
    if (date.personName && date.personName.trim()) {
        return date.personName.trim();
    }
    
    return personLabel(date.person);
}

// Function to get a user-friendly label for person category
function personLabel(person) {
    const labels = {
        'self': 'Self',
        'spouse': 'Spouse',
        'child': 'Child',
        'parent': 'Parent'
    };
    
    return labels[person] || person;
} 