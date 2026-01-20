import React from 'react';
import { Text, StyleSheet } from 'react-native';

const Slogan = () => (
    <Text style={styles.slogan}>
      Des recommandations qui{"\n"}font décoller vos envies
    </Text>
);

const styles = StyleSheet.create({
  slogan: {
    fontSize: 22,
    color: '#0b3f4f',
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: 0.6,
  }
});

export default Slogan;