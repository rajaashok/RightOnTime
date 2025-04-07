# RightOnTime

<div align="center">
  <img src="src/images/icon128.png" alt="RightOnTime Logo" width="100">
</div>

## Overview

RightOnTime is a Chrome extension designed to help users track and manage important immigration dates and deadlines. It provides an elegant dashboard that can replace your new tab page, offering at-a-glance visibility of your upcoming important dates.

### Features

- **Date Tracking**: Track various types of immigration documents including H1B, F1, OPT, passports, visas, and more
- **Dashboard**: Access your important dates directly on Chrome's new tab page
- **Notifications**: Get reminders about upcoming deadlines (90, 60, 30 days before expiry)
- **Family Management**: Organize dates for yourself and family members
- **Filter View**: Easily filter dates by personal, family, or urgency
- **Timeline View**: See all upcoming deadlines in a chronological timeline
- **Dark Theme**: Modern dark UI with a blue color palette for comfortable viewing

## Installation

### From Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store (link will be available when published)
2. Click "Add to Chrome"
3. Confirm the installation when prompted

### Manual Installation (Development)

1. Clone this repository:
   ```
   git clone https://github.com/rajaashok/RightOnTime.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the RightOnTime folder
5. The extension is now installed and ready to use

## Usage

### Adding Dates

1. Click the RightOnTime icon in your browser toolbar or open a new tab
2. Click the "Add" button
3. Fill in the details about the document or deadline:
   - Type (H1B, passport, visa, etc.)
   - For whom (self, spouse, child, parent)
   - Name (optional)
   - Expiry date
   - Notes (optional)
   - Notification preferences
4. Click "Save"

### Managing Dates

- Your dates will be displayed in the dashboard in chronological order
- The most urgent date appears prominently at the top
- Dates are color-coded based on urgency:
  - Red: Less than 30 days remaining
  - Orange: 30-60 days remaining
  - Blue: 60-90 days remaining

### New Tab Dashboard

- By default, the RightOnTime dashboard replaces your new tab page
- You can toggle this feature on/off using the switch in the popup or on the new tab page itself

### Notifications

- The extension will send notifications at your chosen intervals before dates expire
- Click on a notification to open the dashboard and view the date details

## Privacy

RightOnTime stores all your data locally on your device. No data is sent to external servers.

## Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/rajaashok/RightOnTime](https://github.com/rajaashok/RightOnTime) 