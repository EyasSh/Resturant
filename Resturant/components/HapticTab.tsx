import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

/**
 * A haptic-enabled version of the default BottomTabBar button component.
 * This adds a light haptic feedback on iOS when pressing down on the tabs.
 *
 * This component is identical to `PlatformPressable` except on iOS, where it
 * adds a haptic feedback on `onPressIn`.
 *
 * @param props Props to pass to the underlying `PlatformPressable` component.
 * @returns A `PlatformPressable` component with haptic feedback on iOS.
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
