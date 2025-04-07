// Test Runner Script
async function runAllTests() {
    try {
        document.getElementById('mocha').innerHTML = '';
        document.getElementById('error-message').style.display = 'none';
        
        // Clear any previous console groups
        console.clear();
        
        // The test.js file will automatically run its tests
        // when it's loaded because we've defined our own simple
        // test framework that executes immediately
    } catch (error) {
        console.error('Error running tests:', error);
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = `Error running tests: ${error.message}`;
        errorDiv.style.display = 'block';
    }
}

async function clearData() {
    try {
        await chrome.storage.local.clear();
        console.log('All data cleared');
        alert('Test data cleared successfully');
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data: ' + error.message);
    }
}

async function addTestData() {
    try {
        if (window.testHelpers) {
            await window.testHelpers.addTestData();
            alert('Test data added successfully');
        } else {
            throw new Error('Test helpers not available');
        }
    } catch (error) {
        console.error('Error adding test data:', error);
        alert('Error adding test data: ' + error.message);
    }
}

// Add event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add click handlers
    document.getElementById('runTestsBtn').addEventListener('click', runAllTests);
    document.getElementById('clearDataBtn').addEventListener('click', clearData);
    document.getElementById('addDataBtn').addEventListener('click', addTestData);

    // Auto-run tests
    setTimeout(runAllTests, 500);
}); 