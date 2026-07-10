import React from 'react';
import { Text } from 'react-native';

const GLYPHS = {
  mail: '✉',
  lock: '🔒',
  eye: '👁',
  'eye-off': '🙈',
  x: '✕',
};

export default function FeatherIcon({ name, size = 16, color = '#ffffff', style, ...props }) {
  return (
    <Text
      {...props}
      style={[
        {
          color,
          fontSize: size,
          lineHeight: size * 1.1,
        },
        style,
      ]}
    >
      {GLYPHS[name] || '•'}
    </Text>
  );
}
