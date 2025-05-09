import { Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/**
 * A component that wraps Expo Router's `Link` component and adds functionality
 * to open the link in an in-app browser on native platforms.
 *
 * @param props The props for the `Link` component.
 * @param {string} props.href The URL to link to.
 *
 * @example
 * import { ExternalLink } from 'expo-router';
 *
 * <ExternalLink href="https://expo.dev">Open Expo</ExternalLink>
 */
export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href);
        }
      }}
    />
  );
}
