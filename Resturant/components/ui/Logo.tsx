import React, { useRef, useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

// Wrap Svg with Animated
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

/**
 * A spinning logo component that uses a gradient and animation.
 *
 * The logo is a white circle with a gradient going from blue to purple.
 * The animation makes the logo spin 360 degrees every 4 seconds.
 *
 * @returns {JSX.Element} The spinning logo component.
 */
export default function Logo  () {
  // Animated value for rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Infinite rotation loop
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  // Interpolate animated value to rotation degrees
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <AnimatedSvg
      width="50em"
      height="50em"
      viewBox="0 0 512 512"
      style={[styles.simple, { transform: [{ rotate: spin }] }]}
    >
      <Defs>
        <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#66afe9" />
          <Stop offset="100%" stopColor="#804fff" />
        </LinearGradient>
      </Defs>
      <Path
        fill="url(#grad1)"
        d="M447.1 86.2C400.3 33.4 332.2 0 256 0C114.6 0 0 114.6 0 256h64c0-106.1 85.9-192 192-192c58.5 0 110.4 26.5 145.5 67.8L341.3 192H512V21.3zM256 448c-58.5 0-110.4-26.5-145.5-67.8l60.2-60.2H0v170.7l64.9-64.9c46.8 52.8 115 86.2 191.1 86.2c141.4 0 256-114.6 256-256h-64c0 106.1-85.9 192-192 192"
      />
    </AnimatedSvg>
  );
};

const styles = StyleSheet.create({
  simple: {
    marginBottom: 10,
  },
});

