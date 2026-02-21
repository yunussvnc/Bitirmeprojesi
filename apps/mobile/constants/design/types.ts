/**
 * Design System Type Definitions
 * 
 * Type-safe definitions for the design system tokens.
 * Ensures consistency across the application.
 */

/**
 * Color theme type - represents a complete color palette
 */
export type ColorTheme = {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
  };
  surface: {
    default: string;
    hover: string;
    pressed: string;
    border: string;
    elevated: string;
  };
  accent: {
    primary: string;
    primaryHover: string;
    primaryPressed: string;
    onPrimary: string; // Text/icon on accent.primary background (e.g. white on green)
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
    onDarkBackground: string; // Icon/text on dark overlays (e.g. video, dark gradients)
  };
  overlay: {
    light: string;
    medium: string;
    dark: string;
  };
};

/**
 * Typography scale type
 */
export type TypographyScale = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  letterSpacing: number;
};

/**
 * Typography system type
 */
export type TypographySystem = {
  fontFamily: {
    ios: string;
    android: string;
    web: string;
    default: string;
  };
  weight: {
    regular: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
    heavy: '800';
  };
  scale: {
    display: TypographyScale;
    title: TypographyScale;
    heading: TypographyScale;
    body: TypographyScale;
    bodySmall: TypographyScale;
    caption: TypographyScale;
    label: TypographyScale;
  };
};

/**
 * Spacing system type
 */
export type SpacingSystem = {
  xs: number;
  sm: number;
  md: number;
  base: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  screenPadding: number;
  cardPadding: number;
  cardGap: number;
  sectionGap: number;
  elementGap: number;
};

/**
 * Shadow definition type
 */
export type ShadowDefinition = {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation?: number; // Android
};

/**
 * Animation timing type
 */
export type AnimationTiming = {
  fast: number;
  normal: number;
  slow: number;
};

/**
 * Animation easing type
 */
export type AnimationEasing = {
  easeOut: string;
  easeIn: string;
  easeInOut: string;
};

/**
 * Complete design system type
 */
export type DesignSystem = {
  colors: {
    dark: ColorTheme;
    light: ColorTheme;
  };
  typography: TypographySystem;
  spacing: SpacingSystem;
  shadows: {
    small: ShadowDefinition;
    medium: ShadowDefinition;
    large: ShadowDefinition;
  };
  animations: {
    timing: AnimationTiming;
    easing: AnimationEasing;
  };
};
