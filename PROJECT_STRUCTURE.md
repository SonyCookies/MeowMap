# MeowMap Project Structure

This document outlines the folder structure and organization conventions for the MeowMap React Native project.

## 📁 Folder Structure

```
MeowMap/
├── assets/                 # Static assets (images, icons, fonts)
│   ├── images/            # Image files (PNG, JPG)
│   ├── icons/             # Icon files
│   └── fonts/             # Custom fonts
│
├── components/            # Reusable React components
│   └── auth/              # Authentication-related components
│       ├── EmailInput.js
│       ├── PasswordInput.js
│       ├── PasswordStrengthIndicator.js
│       ├── RememberMeCheckbox.js
│       ├── ErrorModal.js
│       ├── SuccessModal.js
│       ├── TermsModal.js
│       └── PrivacyModal.js
│
├── constants/             # Constants and configuration
│   └── theme.js           # Color theme, spacing, typography
│
├── contexts/              # React Context providers
│   └── AuthContext.js     # Authentication context
│
├── hooks/                 # Custom React hooks
│   ├── useBiometricAuth.js
│   └── useLoginAttempts.js
│
├── lib/                   # Third-party library configurations
│   └── supabase.js        # Supabase client configuration
│
├── screens/               # Screen components (main app screens)
│   ├── AuthScreen.js      # Authentication screen
│   └── HomeScreen.js      # Home screen
│
├── utils/                 # Utility functions and helpers
│   ├── emailValidation.js
│   ├── passwordStrength.js
│   └── cooldown.js
│
├── email-templates/       # Email HTML templates
│
└── [config files]         # package.json, app.json, etc.
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
- **Modals**: `ErrorModal`, `SuccessModal`, `TermsModal`, `PrivacyModal`

## 📱 Screen Components

### Location: `screens/`
- Main app screens
- Should be lean and compose smaller components
- Handle navigation and screen-specific logic
- Maximum recommended size: ~500 lines (ideally less)

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

