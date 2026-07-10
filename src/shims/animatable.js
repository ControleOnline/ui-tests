import React from 'react';
import { Text as RNText, View as RNView } from 'react-native';

function createPassthroughComponent(BaseComponent) {
  return React.forwardRef(({ children, ...props }, ref) => (
    <BaseComponent ref={ref} {...props}>
      {children}
    </BaseComponent>
  ));
}

export const View = createPassthroughComponent(RNView);
export const Text = createPassthroughComponent(RNText);

const Animatable = {
  View,
  Text,
};

export default Animatable;
