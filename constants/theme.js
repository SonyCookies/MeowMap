/**
 * MeowMap Color Theme
 * 
 * Color Palette:
 * - Primary Brown: #d0854f (warm orange-brown)
 * - Accent Yellow: #f2cd89 (pale yellow/goldenrod)
 * - Beige: #dec4a9 (light beige/sandy tan)
 * - Dark Gray: #6f6d6b (dark neutral gray)
 * - Cream: #f8f1e4 (creamy off-white)
 */

export const colors = {
  // Primary Colors
  primary: '#dd7100',      // Warm orange-brown
  accent: '#f2cd89',       // Pale yellow/goldenrod
  beige: '#dec4a9',        // Light beige/sandy tan
  darkGray: '#6f6d6b',     // Dark neutral gray
  cream: '#f8f1e4',        // Creamy off-white
  
  // Semantic Colors
  background: '#f8f1e4',   // Cream background
  surface: '#ffffff',      // White for cards/surfaces
  text: '#6f6d6b',         // Dark gray for text
  textLight: '#dec4a9',    // Lighter text
  textDark: '#3a3a3a',     // Darker text for headings
  
  // Button Colors
  buttonPrimary: '#d0854f',    // Primary button color
  buttonSecondary: '#f2cd89',  // Secondary button color
  buttonDisabled: '#dec4a9',   // Disabled button color
  
  // Social Button Colors
  googleBg: '#ffffff',
  googleBorder: '#e0e0e0',
  googleText: '#333333',
  
  facebookBg: '#1877F2',
  facebookText: '#ffffff',
  
  githubBg: '#24292e',
  githubText: '#ffffff',
  
  emailBg: '#8B5CF6',       // Purple for email button
  emailText: '#ffffff',
  
  // Status Colors
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  warning: '#f2cd89',
  info: '#d0854f',
  
  // Border and Divider
  border: '#dec4a9',
  divider: '#dec4a9',
  
  // Modal
  modalOverlay: 'rgba(111, 109, 107, 0.5)',
  
  // Link
  link: '#d0854f',
};

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
    xxxxl: 80,
    xxxxxl: 96,
    xxxxxxl: 112,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    xxxl: 32,
    round: 999,
  },
  typography: {
    fontSize: {
      xs: 11,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
      xxxl: 32,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};

export default theme;

