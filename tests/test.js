// RightOnTime Extension Test Suite

const TEST_DATA = {
    urgent: {
        type: 'i94',
        for: 'self',
        expiryDate: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)), // 15 days from now
        notes: 'Test urgent I-94',
        notifications: [30, 60, 90]
    },
    upcoming: {
        type: 'h1b',
        for: 'self',
        expiryDate: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000)), // 45 days from now
        notes: 'Test H1B expiration',
        notifications: [30, 60, 90]
    },
    family: {
        type: 'passport',
        for: 'spouse',
        expiryDate: new Date(Date.now() + (100 * 24 * 60 * 60 * 1000)), // 100 days from now
        notes: 'Test passport expiration',
        notifications: [30, 60, 90]
    }
};

describe('RightOnTime Extension Tests', function() {
    this.timeout(10000); // Set timeout to 10 seconds

    beforeEach(async function() {
        try {
            await chrome.storage.local.clear();
        } catch (error) {
            console.error('Error in beforeEach:', error);
            throw error;
        }
    });

    describe('Storage Tests', function() {
        it('should save and retrieve dates', async function() {
            try {
                // Save test data
                await chrome.storage.local.set({ dates: [TEST_DATA.urgent] });
                
                // Retrieve and verify
                const result = await chrome.storage.local.get('dates');
                assert.equal(result.dates.length, 1);
                assert.equal(result.dates[0].type, TEST_DATA.urgent.type);
            } catch (error) {
                console.error('Error in storage test:', error);
                throw error;
            }
        });
    });

    describe('Date Management Tests', function() {
        it('should add multiple dates', async function() {
            try {
                // Add all test dates
                const dates = Object.values(TEST_DATA);
                await chrome.storage.local.set({ dates });

                // Verify all dates are stored
                const result = await chrome.storage.local.get('dates');
                assert.equal(result.dates.length, 3);
            } catch (error) {
                console.error('Error in adding dates test:', error);
                throw error;
            }
        });

        it('should sort dates by urgency', async function() {
            try {
                // Add dates in random order
                const dates = Object.values(TEST_DATA);
                await chrome.storage.local.set({ dates });

                // Load dates and verify sorting
                const result = await chrome.storage.local.get('dates');
                const sortedDates = result.dates.sort((a, b) => 
                    new Date(a.expiryDate) - new Date(b.expiryDate)
                );
                
                assert.equal(sortedDates[0].type, 'i94'); // Most urgent should be first
            } catch (error) {
                console.error('Error in sort test:', error);
                throw error;
            }
        });
    });

    describe('Filter Tests', function() {
        beforeEach(async function() {
            try {
                // Add all test dates before each filter test
                const dates = Object.values(TEST_DATA);
                await chrome.storage.local.set({ dates });
            } catch (error) {
                console.error('Error in filter test setup:', error);
                throw error;
            }
        });

        it('should filter personal dates', async function() {
            try {
                const result = await chrome.storage.local.get('dates');
                const personalDates = result.dates.filter(date => date.for === 'self');
                assert.equal(personalDates.length, 2); // I-94 and H1B
            } catch (error) {
                console.error('Error in personal filter test:', error);
                throw error;
            }
        });

        it('should filter family dates', async function() {
            try {
                const result = await chrome.storage.local.get('dates');
                const familyDates = result.dates.filter(date => date.for !== 'self');
                assert.equal(familyDates.length, 1); // Passport
            } catch (error) {
                console.error('Error in family filter test:', error);
                throw error;
            }
        });
    });

    describe('Notification Tests', () => {
        it('should create alarms for notifications', async () => {
            // Add a date with notifications
            await chrome.storage.local.set({ 
                dates: [TEST_DATA.upcoming]
            });

            // Verify alarms are created
            const alarms = await chrome.alarms.getAll();
            assert.ok(alarms.length > 0);
        });
    });

    describe('UI Tests', () => {
        it('should update badge text for urgent items', async () => {
            // Add urgent date
            await chrome.storage.local.set({ 
                dates: [TEST_DATA.urgent]
            });

            // Verify badge text is updated
            const badgeText = await chrome.action.getBadgeText({});
            assert.equal(badgeText, '1');
        });
    });
});

// Helper functions for manual testing
window.testHelpers = {
    async addTestData() {
        try {
            const dates = Object.values(TEST_DATA);
            await chrome.storage.local.set({ dates });
            return true;
        } catch (error) {
            console.error('Error adding test data:', error);
            throw error;
        }
    },

    async clearAllData() {
        try {
            await chrome.storage.local.clear();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    },

    async getCurrentDates() {
        try {
            const result = await chrome.storage.local.get('dates');
            return result.dates || [];
        } catch (error) {
            console.error('Error getting current dates:', error);
            throw error;
        }
    }
}; 