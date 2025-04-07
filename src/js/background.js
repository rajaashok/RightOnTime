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
                iconUrl: '../images/icon128.png',
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

// Initialize settings on extension install/update
chrome.runtime.onInstalled.addListener(() => {
    console.log('RightOnTime: Extension installed/updated');
    
    chrome.storage.local.get(['newTabEnabled'], (result) => {
        // Check if setting exists first
        if (result.newTabEnabled === undefined) {
            console.log('RightOnTime: Initializing newTabEnabled setting to true');
            chrome.storage.local.set({ newTabEnabled: true });
            newTabEnabled = true;
        } else {
            // Then convert to boolean properly
            newTabEnabled = result.newTabEnabled === true;
            console.log('RightOnTime: Loaded newTabEnabled setting:', newTabEnabled);
        }
    });
});

// Initialize settings on browser startup
chrome.runtime.onStartup.addListener(() => {
    console.log('RightOnTime: Browser started');
    
    chrome.storage.local.get(['newTabEnabled'], (result) => {
        console.log('RightOnTime: Loaded newTabEnabled setting on startup:', result.newTabEnabled);
        newTabEnabled = result.newTabEnabled !== false; // Default to true if undefined
    });
});

// Listen for messages from the UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('RightOnTime: Message received in background script', message);
    
    // Handle toggle from newtab.js
    if (message.action === 'toggleNewTab') {
        // Convert to boolean explicitly
        const enabled = message.enabled === true;
        newTabEnabled = enabled;
        
        // Store in local storage for persistence
        chrome.storage.local.set({ newTabEnabled: enabled }, () => {
            console.log('RightOnTime: New tab setting updated to', enabled);
            
            // Handle tab redirect if coming from newtab
            if (!enabled && sender && sender.tab && sender.tab.id) {
                // Only redirect if it's our extension page
                if (sender.tab.url && sender.tab.url.includes(chrome.runtime.id)) {
                    console.log('RightOnTime: Redirecting current newtab to blank page');
                    chrome.tabs.update(sender.tab.id, {
                        url: 'data:text/html;charset=utf-8,' + encodeURIComponent(blankPageHTML)
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('RightOnTime: Failed to redirect tab', chrome.runtime.lastError);
                        }
                    });
                }
            }
            
            sendResponse({ success: true, newValue: enabled });
        });
        
        return true; // Indicate async response
    }
    
    // Handle legacy message format from popup.js (for backward compatibility)
    if (message.type === 'updateNewTabOverride') {
        // Convert to boolean explicitly
        const enabled = message.enabled === true;
        newTabEnabled = enabled;
        
        // Store in local storage for persistence
        chrome.storage.local.set({ newTabEnabled: enabled }, () => {
            console.log('RightOnTime: New tab setting updated via legacy message to', enabled);
            sendResponse({ success: true, newValue: enabled });
        });
        
        return true; // Indicate async response
    }
    
    // For any other messages
    sendResponse({ success: false, error: 'Unknown action' });
    return true; // Indicate async response
});

// Create a blank HTML page content
const blankPageHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>New Tab</title>
    <style>
        body {
            background-color: #1e293b;
            color: #f8fafc;
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .message {
            text-align: center;
            opacity: 0.5;
        }
        .message p {
            margin: 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="message">
        <p>RightOnTime dashboard is disabled</p>
    </div>
</body>
</html>
`;

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
            console.log('RightOnTime: Dashboard disabled, showing blank page');
            
            // Redirect to a blank page instead of chrome://newtab to avoid loops
            chrome.tabs.update(tab.id, { 
                url: 'data:text/html;charset=utf-8,' + encodeURIComponent(blankPageHTML)
            });
        } else {
            console.log('RightOnTime: Dashboard enabled, showing RightOnTime');
            // Let the manifest handle showing the dashboard
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