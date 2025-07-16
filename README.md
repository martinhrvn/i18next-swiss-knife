# i18n Swiss Knife

A powerful Electron-based desktop application for managing translation files and internationalization (i18n) workflows. Edit, organize, and maintain your JSON translation files with an intuitive interface.

## Features

### 🗂️ **Project Management**
- **Smart File Discovery**: Automatically scan folders and detect translation files using customizable patterns
- **Multi-language Support**: Load and manage multiple language files simultaneously
- **Project Configuration**: Save and restore project settings including folder paths and file patterns

### 📝 **Translation Editing**
- **Tree View Navigation**: Browse translation keys in an organized hierarchical structure
- **Inline Editing**: Edit translations directly with real-time preview
- **Multi-language Editor**: Edit multiple language variants side-by-side
- **Auto-save**: Automatic saving with reload-on-save functionality

### 🔍 **Search & Filter**
- **Key Search**: Find specific translation keys quickly
- **Value Search**: Search through translation values across all languages
- **Filter Options**: Show/hide missing translations and completed entries
- **Smart Navigation**: Navigate through search results efficiently

### 💾 **Data Management**
- **Local Storage**: Automatic state persistence across sessions
- **File Watching**: Real-time synchronization with file system changes
- **Backup & Restore**: Safe editing with automatic backups
- **Export Support**: Work with standard JSON translation files

### ⚙️ **User Experience**
- **Setup Wizard**: Guided project setup for new users
- **Responsive Design**: Clean, modern interface that adapts to your workflow
- **Keyboard Shortcuts**: Efficient navigation with hotkeys (Ctrl+S to save)
- **Progress Tracking**: Visual indicators for translation completion status

## Installation

### Download Pre-built Binaries
Download the latest release for your platform from the [Releases](../../releases) page:
- **Windows**: `i18n Swiss Knife Setup 1.0.0.exe`
- **macOS**: `i18n Swiss Knife-1.0.0.dmg`
- **Linux**: `i18n-Swiss-Knife-1.0.0.AppImage` or `i18n-swiss-knife_1.0.0_amd64.deb`

### Development Setup

#### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

#### Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd i18n-swiss-knife
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. For production build:
   ```bash
   npm run build
   npm start
   ```

## Usage

### Getting Started
1. **Launch the application** and you'll see the setup wizard
2. **Select a folder** containing your translation files
3. **Define a file pattern** (e.g., `{lang}.json` or `locale-{lang}.json`)
4. **Choose files** to include in your project
5. **Start editing** your translations!

### File Pattern Examples
- `{lang}.json` → `en.json`, `fr.json`, `de.json`
- `locale-{lang}.json` → `locale-en.json`, `locale-fr.json`
- `i18n/{lang}/messages.json` → `i18n/en/messages.json`, `i18n/fr/messages.json`

### Keyboard Shortcuts
- `Ctrl+S` - Save current changes
- `Ctrl+F` - Focus search input
- `Escape` - Close modals/clear selections

### Project Structure
The application expects JSON translation files with nested object structures:
```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "submit": "Submit"
    },
    "messages": {
      "welcome": "Welcome to our application!",
      "goodbye": "Thank you for using our service"
    }
  },
  "errors": {
    "validation": "Please check your input",
    "network": "Connection failed"
  }
}
```

## Technical Details

### Architecture
- **Frontend**: React 19 with TypeScript
- **Desktop**: Electron 37
- **Build System**: Vite 6
- **State Management**: React Context API with useReducer
- **Styling**: CSS with custom properties for theming

### Key Components
- **SetupWizard**: Initial project configuration
- **TranslationEditor**: Main editing interface
- **TreeView**: Hierarchical navigation of translation keys
- **SearchInputs**: Real-time search and filtering
- **MasterFileSelector**: Language switching interface

### Data Flow
1. Files are loaded through Electron's main process
2. Translation data is parsed and flattened into a tree structure
3. Changes are tracked in React state
4. On save, changes are written back to files via Electron IPC
5. Files are automatically reloaded to ensure UI consistency

## Development

### Project Structure
```
src/
├── components/           # React components
│   ├── Layout/          # Main layout components
│   ├── Modals/          # Modal dialogs
│   └── SetupWizard/     # Initial setup flow
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Adding New Features
1. Follow the existing component structure
2. Use TypeScript for type safety
3. Leverage the context API for state management
4. Add proper error handling and logging
5. Update this README with new features

### Building for Distribution

To create distributable packages of the application:

#### Prerequisites for Building
- All development dependencies installed
- Platform-specific requirements:
  - **Windows builds**: Can be built on any platform
  - **macOS builds**: Must be built on macOS (Apple restriction)
  - **Linux builds**: Can be built on any platform

#### Build Commands

**Create unpacked build (for testing):**
```bash
npm run pack
```

**Create platform-specific installers:**
```bash
# Build for your current platform
npm run dist-linux    # Creates AppImage and .deb
npm run dist-mac       # Creates .dmg (macOS only)
npm run dist-win       # Creates .exe installer

# Build for all platforms (where possible)
npm run dist
```

#### Output Files
Built applications will be created in the `dist-electron/` directory:
- **Linux**: `i18n-Swiss-Knife-1.0.0.AppImage`, `i18n-swiss-knife_1.0.0_amd64.deb`
- **macOS**: `i18n Swiss Knife-1.0.0.dmg`
- **Windows**: `i18n Swiss Knife Setup 1.0.0.exe`

#### Adding Custom Icons (Optional)
Create an `assets/` directory with:
- `icon.icns` (macOS, 512x512)
- `icon.ico` (Windows, 256x256)
- `icon.png` (Linux, 512x512)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including built packages)
5. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Support

If you encounter issues or have feature requests, please open an issue on the project repository.