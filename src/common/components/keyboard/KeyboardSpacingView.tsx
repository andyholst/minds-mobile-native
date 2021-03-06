import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardEventName,
  Platform,
  StatusBar,
  View,
  ViewProps,
} from 'react-native';
import { mix, useTransition } from 'react-native-redash';
import Animated from 'react-native-reanimated';
import { observer, useLocalStore } from 'mobx-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedStyles from '../../../styles/ThemedStyles';
import { useDimensions } from '@react-native-community/hooks';
import { IS_IOS } from '~/config/Config';

interface PropsType extends ViewProps {
  children: React.ReactNode;
  enabled?: boolean;
  noInset?: boolean;
  onKeyboardShown?: (height: number) => void;
}

export const screenRealHeightContext = React.createContext<number>(0);

/**
 * This components leaves room for the keyboard adding a padding bellow it
 * in order to work as expected the bottom of the view should be at the bottom of the screen
 *
 * this component is disabled on android by default (we are using the adjustResizeMode that already resize the view)
 */
export default observer(function KeyboardSpacingView({
  children,
  style,
  enabled = IS_IOS,
  onKeyboardShown,
  noInset,
  ...otherProps
}: PropsType) {
  const insets = useSafeAreaInsets();
  const windowHeight = useDimensions().window.height;
  const store = useLocalStore(
    ({ enabled: enabledProp }) => ({
      shown: false,
      height: 0,
      show(e) {
        if (enabledProp) {
          store.shown = true;
        }
        store.height =
          windowHeight -
          e.endCoordinates.screenY -
          (noInset ? insets.bottom : 0);
        if (onKeyboardShown) {
          onKeyboardShown(store.height);
        }
      },
      hide() {
        store.shown = false;
      },
    }),
    { enabled },
  );

  const transition = useTransition(store.shown, { duration: 200 });
  const paddingBottom = mix(
    transition,
    noInset ? 0 : insets.bottom,
    store.height,
  );

  useEffect(() => {
    const eventShow = Platform.select({
      android: 'keyboardDidShow',
      ios: 'keyboardWillShow',
    }) as KeyboardEventName;
    const eventHide = Platform.select({
      android: 'keyboardDidHide',
      ios: 'keyboardWillHide',
    }) as KeyboardEventName;
    Keyboard.addListener(eventShow, store.show);
    Keyboard.addListener(eventHide, store.hide);

    // cleanup function
    return () => {
      Keyboard.removeListener(eventShow, store.show);
      Keyboard.removeListener(eventHide, store.hide);
    };
  }, [store]);

  return (
    <Animated.View style={[style, { paddingBottom }]} {...otherProps}>
      {children}
    </Animated.View>
  );
});

/**
 * Screen height provider
 * It detects the real height of the screen to implement a workaround
 * for the incorrect keyboard height detection in some devices
 */
export const ScreenHeightProvider = ({ children }) => {
  const [height, setHeight] = useState(0);
  return (
    <View
      style={ThemedStyles.style.flexContainer}
      onLayout={({ nativeEvent }) =>
        setHeight(nativeEvent.layout.height + (StatusBar.currentHeight || 0))
      }>
      <screenRealHeightContext.Provider value={height}>
        {children}
      </screenRealHeightContext.Provider>
    </View>
  );
};
