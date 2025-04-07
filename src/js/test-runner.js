// Test data with fixed dates
const testData = {
    urgent: {
        type: 'H1B',
        person: 'self',
        expiryDate: '2024-04-15T00:00:00.000Z',
        notes: 'Urgent visa renewal needed',
        notifications: [90, 60, 30]
    },
    upcoming: {
        type: 'F1',
        person: 'spouse',
        expiryDate: '2024-07-01T00:00:00.000Z',
        notes: 'Student visa renewal',
        notifications: [60, 30]
    },
    family: {
        type: 'B1',
        person: 'parent',
        expiryDate: '2024-09-15T00:00:00.000Z',
        notes: 'Tourist visa renewal',
        notifications: [30]
    }
};

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Display current data from storage
function displayCurrentData() {
    chrome.storage.local.get(['dates'], function(result) {
        const resultsDiv = document.getElementById('results');
        const currentDataDiv = document.createElement('div');
        currentDataDiv.className = 'current-data';
        
        const title = document.createElement('h3');
        title.textContent = 'Current Stored Data:';
        currentDataDiv.appendChild(title);

        if (!result.dates || result.dates.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No dates currently stored.';
            currentDataDiv.appendChild(emptyMessage);
        } else {
            const list = document.createElement('ul');
            result.dates.forEach(date => {
                const item = document.createElement('li');
                item.textContent = `${date.type} (${date.person}) - Expires: ${formatDate(date.expiryDate)}`;
                list.appendChild(item);
            });
            currentDataDiv.appendChild(list);
        }

        // Remove any existing current data display
        const existingCurrentData = resultsDiv.querySelector('.current-data');
        if (existingCurrentData) {
            resultsDiv.removeChild(existingCurrentData);
        }
        resultsDiv.appendChild(currentDataDiv);
    });
}

// Run all tests
function runTests() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    chrome.storage.local.get(['dates'], function(result) {
        let allPassed = true;
        
        // Test 1: Check if data can be stored
        chrome.storage.local.set({ dates: [testData.urgent] }, function() {
            const test1 = document.createElement('div');
            test1.className = 'test-result pass';
            test1.textContent = '✓ Test 1: Data storage successful';
            resultsDiv.appendChild(test1);
            
            // Test 2: Check if data can be retrieved
            chrome.storage.local.get(['dates'], function(result) {
                const test2 = document.createElement('div');
                if (result.dates && result.dates.length > 0) {
                    test2.className = 'test-result pass';
                    test2.textContent = '✓ Test 2: Data retrieval successful';
                } else {
                    test2.className = 'test-result fail';
                    test2.textContent = '✗ Test 2: Data retrieval failed';
                    allPassed = false;
                }
                resultsDiv.appendChild(test2);
                
                // Test 3: Check if multiple dates can be stored
                const multipleDates = [testData.urgent, testData.upcoming, testData.family];
                chrome.storage.local.set({ dates: multipleDates }, function() {
                    chrome.storage.local.get(['dates'], function(result) {
                        const test3 = document.createElement('div');
                        if (result.dates && result.dates.length === 3) {
                            test3.className = 'test-result pass';
                            test3.textContent = '✓ Test 3: Multiple dates storage successful';
                        } else {
                            test3.className = 'test-result fail';
                            test3.textContent = '✗ Test 3: Multiple dates storage failed';
                            allPassed = false;
                        }
                        resultsDiv.appendChild(test3);
                        
                        // Display final result
                        const finalResult = document.createElement('div');
                        finalResult.className = `test-result ${allPassed ? 'pass' : 'fail'}`;
                        finalResult.textContent = allPassed ? 
                            '✓ All tests passed!' : 
                            '✗ Some tests failed. Check the results above.';
                        resultsDiv.appendChild(finalResult);
                        
                        // Display current data after tests
                        displayCurrentData();
                    });
                });
            });
        });
    });
}

// Clear all test data
function clearTestData() {
    chrome.storage.local.clear(function() {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<div class="test-result pass">✓ All data cleared successfully</div>';
        displayCurrentData();
    });
}

// Add sample test data
function addTestData() {
    const sampleDates = [testData.urgent, testData.upcoming, testData.family];
    chrome.storage.local.set({ dates: sampleDates }, function() {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<div class="test-result pass">✓ Sample data added successfully</div>';
        displayCurrentData();
    });
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('runTestsBtn').addEventListener('click', runTests);
    document.getElementById('clearDataBtn').addEventListener('click', clearTestData);
    document.getElementById('addDataBtn').addEventListener('click', addTestData);
    
    // Display initial data
    displayCurrentData();
}); 