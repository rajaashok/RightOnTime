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

// Listen for messages from popup and newtab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('RightOnTime: Received message:', message);
    
    if (message.action === 'toggleNewTab') {
        const enabled = message.enabled === true;
        console.log('RightOnTime: Toggling new tab dashboard:', enabled);
        
        // Save the setting
        chrome.storage.local.set({ newTabEnabled: enabled }, () => {
            if (chrome.runtime.lastError) {
                console.error('RightOnTime: Error saving setting:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError });
                return;
            }
            
            // Update the global variable
            newTabEnabled = enabled;
            
            // If this is a new tab page and we're disabling the dashboard
            if (sender.tab && sender.tab.url === 'chrome://newtab/' && !enabled) {
                // Redirect to Google
                chrome.tabs.update(sender.tab.id, { url: 'https://www.google.com' }, (updatedTab) => {
                    if (chrome.runtime.lastError) {
                        console.error('RightOnTime: Error updating tab:', chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError });
                        return;
                    }
                    sendResponse({ success: true });
                });
            } else {
                sendResponse({ success: true });
            }
        });
        return true; // Keep the message channel open for the async response
    }
    
    sendResponse({ success: false, error: 'Unknown action' });
});

// Handle new tab creation
chrome.tabs.onCreated.addListener((tab) => {
    if (tab.url === 'chrome://newtab/') {
        chrome.storage.local.get(['newTabEnabled'], (result) => {
            if (chrome.runtime.lastError) {
                console.error('RightOnTime: Error reading setting:', chrome.runtime.lastError);
                return;
            }
            
            const enabled = result.newTabEnabled !== false;
            console.log('RightOnTime: New tab created, dashboard enabled:', enabled);
            
            if (enabled) {
                // Load our dashboard
                chrome.tabs.update(tab.id, { 
                    url: chrome.runtime.getURL('src/html/newtab.html')
                }, (updatedTab) => {
                    if (chrome.runtime.lastError) {
                        console.error('RightOnTime: Error loading dashboard:', chrome.runtime.lastError);
                    }
                });
            } else {
                // Redirect to Google
                chrome.tabs.update(tab.id, { 
                    url: 'https://www.google.com'
                }, (updatedTab) => {
                    if (chrome.runtime.lastError) {
                        console.error('RightOnTime: Error redirecting to Google:', chrome.runtime.lastError);
                    }
                });
            }
        });
    }
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