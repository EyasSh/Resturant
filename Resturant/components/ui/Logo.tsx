import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

const Logo = () => {
  return (
    <Svg
      style={styles.simple}
      width="50em"
      height="50em"
      viewBox="0 0 512 512"
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
    </Svg>
  );
};

export default Logo;
const styles = StyleSheet.create({
    simple:{
        marginBottom: 10,
    }
});