# Assets Directory Structure

This directory contains all static assets for the MeowMap app.

## Directory Structure

```
assets/
├── images/          # General images (PNG, JPG) used in the app
│   ├── backgrounds/ # Background images
│   ├── illustrations/ # Illustrations and graphics
│   └── photos/      # Photo assets
├── icons/           # App-specific UI icons
│   └── ui-icons/    # Small icons used in the app UI
├── svgs/            # SVG files (vector graphics)
│   ├── logos/       # SVG logos
│   ├── icons/       # SVG icons
│   └── illustrations/ # SVG illustrations
├── fonts/           # Custom font files (if needed)
├── icon.png         # Main app icon (keep at root for app.json)
├── splash-icon.png  # Splash screen icon (keep at root for app.json)
├── adaptive-icon.png # Android adaptive icon (keep at root for app.json)
└── favicon.png      # Web favicon (keep at root for app.json)
```

## App Icons (Root Level)

**Keep these files in the root of `assets/`** because they're referenced by `app.json`:
- `icon.png` - Main app icon
- `splash-icon.png` - Splash screen icon
- `adaptive-icon.png` - Android adaptive icon
- `favicon.png` - Web favicon

## Usage

### Images (PNG/JPG)

```javascript
import { Image } from 'react-native';

// Using require()
<Image source={require('../assets/images/background.png')} />

// Or using static path
<Image source={{ uri: './assets/images/illustration.jpg' }} />
```

### SVGs

For SVG support, install `react-native-svg`:
```bash
npx expo install react-native-svg
```

Then use SVG files:
```javascript
import SvgComponent from '../assets/svgs/logo.svg';

<SvgComponent width={100} height={100} />
```

Or convert SVG to React component using tools like:
- [react-native-svg-transformer](https://github.com/kristerkari/react-native-svg-transformer)
- [SVG to React Native Converter](https://react-svgr.com/playground/)

### Recommended Organization

- **images/**: Photos, illustrations, background images
- **icons/**: App-specific icons, small UI icons
- **svgs/**: Vector graphics, logos that need to scale
- **fonts/**: Custom typography files

## Naming Conventions

- Use kebab-case for file names: `user-profile-icon.png`
- Be descriptive: `login-background.jpg` not `bg1.jpg`
- Include size/density if needed: `icon-24.png`, `icon-48.png`

