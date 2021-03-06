import React, { forwardRef, useCallback, useState } from 'react';
import {
  useBackHandler,
  useDimensions,
  useKeyboard,
} from '@react-native-community/hooks';
import {
  createStackNavigator,
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack';
import { NavigationContainer, useRoute } from '@react-navigation/native';

import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { observer, useLocalStore } from 'mobx-react';

import CommentList from './CommentList';
import CommentsStore from './CommentsStore';
import ThemedStyles from '~/styles/ThemedStyles';
import Handle from '~/common/components/bottom-sheet/Handle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const bottomSheetLocalStore = ({ autoOpen }) => ({
  isRendered: Boolean(autoOpen),
  setIsRendered(isRendered: boolean) {
    this.isRendered = isRendered;
  },
});

const renderBackdrop = backdropProps => (
  <BottomSheetBackdrop
    {...backdropProps}
    pressBehavior="close"
    opacity={0.5}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
  />
);

type PropsType = {
  commentsStore: CommentsStore;
  autoOpen?: boolean; // auto opens the bottom sheet when the component mounts
  title?: string;
  onChange?: (isOpen: number) => void;
};

const Stack = createStackNavigator();

const ScreenReplyComment = ({ navigation }) => {
  const route = useRoute<any>();

  useBackHandler(() => {
    navigation.goBack();
    return true;
  });
  const store = React.useMemo(() => {
    const s = new CommentsStore(route.params.entity);
    s.setParent(route.params.comment);
    return s;
  }, [route.params.comment, route.params.entity]);
  React.useEffect(() => {
    if (route.params.open) {
      store.setShowInput(true);
    }
  }, []);

  return <CommentList store={store} navigation={navigation} />;
};

const CommentBottomSheet = (props: PropsType, ref: any) => {
  const height = useDimensions().window.height;
  const topInsets = useSafeAreaInsets().top;
  /**
   * used to enable/disable back handler
   **/
  const [isVisible, setIsVisible] = useState(false);
  const localStore = useLocalStore(bottomSheetLocalStore, {
    onChange: props.onChange,
    autoOpen: props.autoOpen,
  });
  const { current: focusedUrn } = React.useRef(
    props.commentsStore.getFocusedUrn(),
  );

  const sheetRef = React.useRef<any>(null);
  const route = useRoute<any>();

  React.useImperativeHandle(ref, () => ({
    expand: () => {
      if (localStore.isRendered) {
        sheetRef.current?.present();
        setIsVisible(true);
      } else {
        localStore.setIsRendered(true);
      }
    },
    close: () => {
      sheetRef.current?.dismiss();
    },
  }));

  useBackHandler(
    useCallback(() => {
      if (isVisible) {
        sheetRef.current?.dismiss();
        return true;
      }

      return false;
    }, [sheetRef, isVisible]),
  );

  React.useEffect(() => {
    if (!localStore.isRendered && props.autoOpen) {
      localStore.setIsRendered(true);
    }
  }, [props.autoOpen, localStore]);

  React.useEffect(() => {
    if (localStore.isRendered) {
      sheetRef.current?.present();
    }
  }, [localStore.isRendered]);

  React.useEffect(() => {
    if (
      (props.commentsStore.parent &&
        props.commentsStore.parent['comments:count'] === 0) ||
      (route.params?.open && props.commentsStore.entity['comments:count'] === 0)
    ) {
      setTimeout(() => {
        if (props?.commentsStore) {
          props.commentsStore.setShowInput(true);
        }
      }, 500);
    }
  }, [props.commentsStore, route.params]);

  const screenOptions = React.useMemo<StackNavigationOptions>(
    () => ({
      ...TransitionPresets.SlideFromRightIOS,
      headerShown: false,
      safeAreaInsets: { top: 0 },
      // headerBackground: ThemedStyles.style.bgSecondaryBackground,
      cardStyle: [
        ThemedStyles.style.bgSecondaryBackground,
        { overflow: 'visible' },
      ],
    }),
    [],
  );

  const ScreenComment = React.useCallback(
    ({ navigation }) => (
      <CommentList store={props.commentsStore} navigation={navigation} />
    ),
    [props.commentsStore],
  );

  // renders

  const renderHandle = useCallback(
    () => <Handle style={ThemedStyles.style.bgPrimaryBackground} />,
    [],
  );
  const onDismiss = useCallback(() => {
    props.commentsStore.setShowInput(false);
    setIsVisible(false);
  }, [props.commentsStore]);

  const { keyboardShown } = useKeyboard();

  if (!localStore.isRendered) {
    return null;
  }

  return (
    <BottomSheetModal
      key="commentSheet"
      backdropComponent={renderBackdrop}
      onDismiss={onDismiss}
      handleHeight={20}
      backgroundComponent={null}
      ref={sheetRef}
      snapPoints={[keyboardShown ? height - topInsets : '85%']}
      index={0}
      enableContentPanningGesture={true}
      handleComponent={renderHandle}>
      <NavigationContainer independent={true}>
        <Stack.Navigator
          screenOptions={screenOptions}
          initialRouteName="Comments">
          <Stack.Screen
            name="Comments"
            component={ScreenComment}
            initialParams={{
              title: props.title || '',
            }}
          />
          <Stack.Screen
            name="ReplyComment"
            component={ScreenReplyComment}
            initialParams={{ focusedUrn }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BottomSheetModal>
  );
};

// @ts-ignore
export default observer(forwardRef(CommentBottomSheet));
