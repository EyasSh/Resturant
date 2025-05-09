import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

/**
 * A `View` component that changes its background color based on the active theme.
 *
 * @param {{ children: React.ReactNode, style: ViewStyle, lightColor?: string, darkColor?: string }} props
 * @param {React.ReactNode} props.children - The content of the view.
 * @param {ViewStyle} props.style - Additional style to apply to the view.
 * @param {string} [props.lightColor] - The background color to use in light theme.
 * @param {string} [props.darkColor] - The background color to use in dark theme.
 *
 * @returns {React.ReactElement}
 */
export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
