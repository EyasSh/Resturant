import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * Renders an icon using the SymbolView component with specified properties.
 *
 * @param {Object} props - The properties for the icon.
 * @param {SymbolViewProps['name']} props.name - The name of the symbol to display.
 * @param {number} [props.size=24] - The size of the icon.
 * @param {string} props.color - The color of the icon.
 * @param {StyleProp<ViewStyle>} props.style - Additional style for the icon.
 * @param {SymbolWeight} [props.weight='regular'] - The weight of the symbol.
 *
 * @returns {React.ReactElement} The rendered SymbolView component.
 */

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
