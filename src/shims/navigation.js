import React, { createContext, useContext, useEffect, useMemo } from 'react';

const NavigationContext = createContext({
  navigation: null,
  route: {
    name: 'SignInPage',
    params: {},
  },
});

export function NavigationProvider({ navigation, route, children }) {
  const value = useMemo(
    () => ({
      navigation,
      route: route || {
        name: 'SignInPage',
        params: {},
      },
    }),
    [navigation, route],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useRoute() {
  return useContext(NavigationContext).route;
}

export function useNavigation() {
  return useContext(NavigationContext).navigation;
}

export function useFocusEffect(effect) {
  useEffect(() => {
    if (typeof effect !== 'function') {
      return undefined;
    }

    const cleanup = effect();
    return typeof cleanup === 'function' ? cleanup : undefined;
  }, [effect]);
}
