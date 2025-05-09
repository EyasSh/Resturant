// This is a shim for web and Android where the tab bar is generally opaque.
export default undefined;

/**
 * Returns the overflow height of the bottom tab bar.
 * This is a shim for web and Android where the tab bar is generally opaque.
 * On iOS, the tab bar is positioned at the bottom of the screen and has a height
 * that is subtracted from the safe area insets.
 * @returns The overflow height of the bottom tab bar.
 */
export function useBottomTabOverflow() {
  return 0;
}
