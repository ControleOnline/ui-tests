import React from 'react';
import { View } from 'react-native';

export function SafeAreaView({ children, style, ...props }) {
  return (
    <View {...props} style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
}

export function SafeAreaProvider({ children }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

export function useSafeAreaInsets() {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
}

export default {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
};
