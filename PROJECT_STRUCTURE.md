# MeowMap Project Structure

This document outlines the folder structure and organization conventions for the MeowMap React Native project.

## 📁 Folder Structure

```
MeowMap/
├── assets/                 # Static assets (images, icons, fonts)
│   ├── images/            # Image files (PNG, JPG) - app logos, backgrounds, illustrations
│   ├── icons/             # Icon files - UI icons organized by category
│   │   └── ui-icons/      # User interface icons
│   ├── fonts/             # Custom font files
│   ├── svgs/              # SVG assets organized by type
│   │   ├── icons/         # SVG icon files
│   │   ├── illustrations/ # SVG illustrations
│   │   └── logos/         # SVG logo files
│   └── README.md          # Assets documentation
│
├── components/            # Reusable React components organized by feature
│   ├── auth/              # Authentication-related components
│   │   ├── EmailInput.js              # Email input field with validation
│   │   ├── PasswordInput.js           # Password input with visibility toggle
│   │   ├── PasswordStrengthIndicator.js # Visual password strength meter
│   │   ├── RememberMeCheckbox.js      # Remember me checkbox component
│   │   ├── ErrorModal.js              # Error message modal
│   │   ├── SuccessModal.js            # Success message modal
│   │   ├── TermsModal.js              # Terms of service modal
│   │   ├── PrivacyModal.js            # Privacy policy modal
│   │   ├── ForgotPasswordModal.js     # Password reset modal
│   │   └── EmailVerificationModal.js  # Email verification prompt modal
│   ├── home/              # Home screen components
│   │   ├── FunctionCards.js            # Action cards (Map, Profile, etc.)
│   │   ├── MenuDrawer.js               # Side menu drawer component
│   │   ├── NotificationDrawer.js      # Notification panel drawer
│   │   ├── StatsBanner.js              # Statistics display banner
│   │   └── UpdatesCarousel.js          # News/updates carousel component
│   ├── map/               # Map view components
│   │   ├── CoatPatternPicker.js        # Cat coat pattern selection
│   │   ├── ColorPicker.js              # Primary color selection
│   │   ├── MapFilter.js                # Time-based filter for sightings
│   │   ├── MapLayersControl.js        # Map layers toggle (heatmap, 3D)
│   │   ├── MapMarkers.js               # Map marker components
│   │   ├── MapStyleSelector.js         # Map style selector (Street, Satellite, etc.)
│   │   ├── MapTiltControl.js           # Map pitch/tilt control buttons
│   │   ├── SightingDetailModal.js      # Cat sighting details modal
│   │   ├── SightingFormModal.js        # New sighting form modal
│   │   └── SightingMarker.js           # Individual sighting marker component
│   └── profile/           # Profile-related components
│       ├── AvatarPreviewModal.js       # Avatar preview and crop modal
│       ├── ProfileForm.js              # Profile editing form fields
│       ├── ProfileProgressIndicator.js # Profile completion progress
│       ├── ProfileSetupForm.js         # Initial profile setup form
│       └── ProfileTaskItem.js          # Profile completion task item
│
├── constants/             # Constants and configuration
│   └── theme.js           # Color theme, spacing, typography, border radius, etc.
│
├── contexts/              # React Context providers for global state
│   ├── AuthContext.js      # Authentication state and methods
│   └── NotificationContext.js # Notification state and management
│
├── hooks/                 # Custom React hooks for reusable logic
│   ├── useAvatarUpload.js      # Avatar image upload logic
│   ├── useBiometricAuth.js     # Biometric authentication (Face ID, Touch ID)
│   ├── useCooldown.js          # Cooldown timer with AsyncStorage persistence
│   ├── useImagePicker.js       # Image picker functionality (camera/gallery)
│   ├── useInfiniteScroll.js    # Infinite scroll implementation for carousels
│   ├── useLocationPermission.js # Location permission and GPS access
│   ├── useLoginAttempts.js     # Login attempt tracking and rate limiting
│   └── useProfileCheck.js      # Profile completion status checking
│
├── lib/                   # Third-party library configurations and setup
│   └── supabase.js        # Supabase client initialization and configuration
│
├── screens/               # Screen components (main app screens)
│   ├── AuthScreen.js           # Authentication screen (login/signup)
│   ├── HomeScreen.js           # Main home screen with navigation
│   ├── MapViewScreen.js        # Interactive map view with sightings
│   ├── ProfileScreen.js        # User profile viewing and editing
│   ├── ProfileSetupScreen.js   # Initial profile setup wizard
│   ├── UpdateDetailScreen.js   # Individual update/news detail view
│   └── UpdatesListScreen.js    # List of all updates/news items
│
├── services/              # API service layer for backend operations
│   ├── notificationService.js  # Notification CRUD operations
│   ├── profileService.js       # User profile CRUD operations
│   └── sightingService.js      # Cat sighting CRUD operations
│
├── utils/                 # Utility functions and helpers (pure functions)
│   ├── cooldown.js             # Cooldown timer utilities
│   ├── emailValidation.js      # Email validation functions
│   ├── notifications.js        # Notification utility functions
│   ├── passwordStrength.js     # Password strength calculation
│   ├── phoneFormatting.js      # Phone number formatting utilities
│   └── profileValidation.js    # Profile field validation functions
│
├── email-templates/       # Email HTML templates
│   ├── meowmap-email-templates.html    # General email template
│   └── reset-password-template.html    # Password reset email template
│
├── android/               # Android-specific configuration and build files
│   ├── app/               # Android app module
│   ├── gradle/            # Gradle wrapper files
│   ├── gradle.properties  # Gradle configuration
│   ├── setup-mapbox-token.ps1  # Windows script for Mapbox token setup
│   ├── setup-mapbox-token.sh    # Unix script for Mapbox token setup
│   └── SETUP.md           # Android setup instructions
│
└── [config files]         # package.json, app.json, eas.json, etc.
```

## 📝 Naming Conventions

### Files and Folders
- **Components**: PascalCase (e.g., `EmailInput.js`, `PasswordInput.js`)
- **Hooks**: camelCase starting with `use` (e.g., `useBiometricAuth.js`)
- **Utils**: camelCase (e.g., `emailValidation.js`, `passwordStrength.js`)
- **Screens**: PascalCase (e.g., `AuthScreen.js`)
- **Folders**: lowercase (e.g., `components/`, `hooks/`, `utils/`)

### Code Style
- **Components**: Use functional components with hooks
- **Exports**: Default exports for components, named exports for utilities
- **Styles**: Use StyleSheet.create() for component styles
- **Imports**: Group imports (React, React Native, third-party, local)

## 🎯 Component Organization Rules

### When to Extract Components

1. **Reusable UI Elements**: If a component is used in 2+ places, extract it
2. **Complex UI Sections**: If a section has 50+ lines of JSX, consider extracting
3. **Modals**: All modals should be in separate files
4. **Forms**: Complex form sections can be extracted to separate components
5. **Feature-Specific Components**: Group related components in feature folders (e.g., `components/auth/`)

### Component File Structure

```javascript
// 1. Imports (React, React Native, third-party, local)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

// 2. Component definition
const MyComponent = ({ prop1, prop2, onAction }) => {
  // 3. State and hooks
  // 4. Helper functions
  // 5. Render
  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
};

// 6. Styles
const styles = StyleSheet.create({
  // styles
});

// 7. Export
export default MyComponent;
```

## 🔧 Utility Functions

### Location: `utils/`
- Pure functions (no side effects)
- Single responsibility
- Well-documented with JSDoc comments
- Exported as named exports

Example:
```javascript
// utils/emailValidation.js
export const validateEmail = (email) => {
  // implementation
};
```

## 🎣 Custom Hooks

### Location: `hooks/`
- Start with `use` prefix
- Encapsulate stateful logic
- Can use other hooks
- Return values/state/functions needed by components

Example:
```javascript
// hooks/useBiometricAuth.js
export const useBiometricAuth = () => {
  const [state, setState] = useState();
  // logic
  return { state, actions };
};
```

## 🎨 Styling Guidelines

1. **Theme Constants**: Use `constants/theme.js` for colors, spacing, etc.
2. **Component Styles**: Keep styles in component files using StyleSheet
3. **Shared Styles**: If styles are shared, create a shared styles file
4. **Avoid Inline Styles**: Use StyleSheet.create() for performance

## 📦 Context Organization

### Location: `contexts/`
- One context per domain (e.g., `AuthContext`, `ThemeContext`)
- Export both Context and Provider
- Export custom hook for consuming context (e.g., `useAuth()`)

## 🔐 Authentication Components

All authentication-related components are in `components/auth/`:

- **Form Inputs**: `EmailInput`, `PasswordInput`
- **UI Elements**: `RememberMeCheckbox`, `PasswordStrengthIndicator`
- **Modals**: `ErrorModal`, `SuccessModal`, `TermsModal`, `PrivacyModal`, `ForgotPasswordModal`, `EmailVerificationModal`

## 🗺️ Map Components

All map-related components are in `components/map/`:

- **Form Components**: `SightingFormModal`, `CoatPatternPicker`, `ColorPicker`
- **Map Controls**: `MapFilter`, `MapStyleSelector`, `MapLayersControl`, `MapTiltControl`
- **Markers & Modals**: `SightingMarker`, `SightingDetailModal`, `MapMarkers`

## 🏠 Home Components

All home screen components are in `components/home/`:

- **Navigation**: `MenuDrawer`, `NotificationDrawer`
- **Content**: `StatsBanner`, `FunctionCards`, `UpdatesCarousel`

## 👤 Profile Components

All profile-related components are in `components/profile/`:

- **Forms**: `ProfileForm`, `ProfileSetupForm`
- **UI Elements**: `ProfileProgressIndicator`, `ProfileTaskItem`, `AvatarPreviewModal`

## 📱 Screen Components

### Location: `screens/`
- Main app screens that represent full-page views
- Should be lean and compose smaller components
- Handle navigation and screen-specific logic
- Maximum recommended size: ~500 lines (ideally less)
- **Current Screens:**
  - `AuthScreen.js` - Authentication (login/signup) with biometric support
  - `HomeScreen.js` - Main dashboard with stats, updates, and navigation
  - `MapViewScreen.js` - Interactive map with cat sightings, filters, and controls
  - `MySightingsScreen.js` - List view of user's own cat sightings with filters and search
  - `ProfileScreen.js` - User profile viewing and editing
  - `ProfileSetupScreen.js` - Initial profile setup wizard
  - `UpdateDetailScreen.js` - Individual update/news detail view
  - `UpdatesListScreen.js` - List view of all updates/news items

### Screen Compliance Check
✅ All screens follow the import pattern (1-5 grouping)
✅ All screens use functional components with hooks
✅ All screens use StyleSheet.create() for styles
✅ All screens use default exports
⚠️ Note: `MapViewScreen.js` (~1518 lines) and `AuthScreen.js` (~1500 lines) exceed the recommended 500-line limit but are functional and well-organized

## 🚀 Import Patterns

```javascript
// 1. React and React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 3. Local utilities and hooks
import { validateEmail } from '../../utils/emailValidation';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

// 4. Local components
import EmailInput from '../components/auth/EmailInput';
import ErrorModal from '../components/auth/ErrorModal';

// 5. Constants and contexts
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
```

## 📋 Best Practices

1. **Single Responsibility**: Each file/component should have one clear purpose
2. **DRY (Don't Repeat Yourself)**: Extract repeated code into utilities or components
3. **Component Size**: Keep components under 300 lines when possible
4. **Prop Validation**: Use PropTypes or TypeScript for prop validation
5. **Documentation**: Document complex logic and utilities
6. **Consistent Patterns**: Follow established patterns in the codebase

## 🔄 Refactoring Guidelines

When a file exceeds ~500 lines:
1. Extract reusable components to `components/`
2. Extract utility functions to `utils/`
3. Extract custom hooks to `hooks/`
4. Move constants to `constants/`
5. Consider breaking large screens into smaller sub-components

## 📚 Example: AuthScreen Refactoring

Before: `AuthScreen.js` (2258 lines)
- All modals inline
- All utility functions inline
- All hooks logic inline

After: Organized structure
- `AuthScreen.js` (~400 lines) - Main screen logic
- `components/auth/*.js` - Extracted modals and UI components
- `hooks/*.js` - Extracted custom hooks
- `utils/*.js` - Extracted utility functions

## 🎯 Key Principles

1. **Modularity**: Code should be organized into logical, reusable modules
2. **Maintainability**: Easy to find, understand, and modify code
3. **Scalability**: Structure supports growth without becoming messy
4. **Consistency**: Follow patterns consistently across the codebase
5. **Readability**: Code should be self-documenting with clear naming

---

**Last Updated**: [Auto-generated]
**Maintained By**: Development Team

