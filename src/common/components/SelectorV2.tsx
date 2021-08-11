import React, {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text, TextStyle, View, ViewProps } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import ThemedStyles from '../../styles/ThemedStyles';
import { BottomSheet, BottomSheetButton, MenuItem } from './bottom-sheet';
import i18n from '../../common/services/i18n.service';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * a View that has two linear gradients on top and bottom
 **/
const GradientView: FC<ViewProps> = ({ children, ...props }) => {
  const backgroundColor = ThemedStyles.getColor('PrimaryBackgroundHighlight');
  const endColor = (ThemedStyles.theme ? '#242A30' : '#F5F5F5') + '00';
  const startColor = backgroundColor + 'FF';

  return (
    <View {...props}>
      {children}
      <LinearGradient
        colors={[startColor, endColor]}
        style={topGradientStyle}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[endColor, startColor]}
        style={bottomGradientStyle}
        pointerEvents="none"
      />
    </View>
  );
};

type PropsType = {
  data: Array<Object>;
  valueExtractor: (item: any) => string;
  keyExtractor: (item: any) => string;
  title?: string;
  onItemSelect: Function;
  textStyle?: TextStyle | TextStyle[];
  backdropOpacity?: number;
  children?: (onItemSelect: any) => any;
};

/**
 * Selector with BottomSheet
 *
 * It is used as such:
 * ```
 *  <Selector ...props>
 *    {show => (
 *      <Button onPress={show} />
 *    )}
 *  </Selector>
 * ```
 *
 * Or alternatively without children
 * ```
 *  <Selector ref={selectorRef} />
 *
 *  selectorRef.current.show()
 * ```
 **/
const SelectorV2: ForwardRefRenderFunction<any, PropsType> = (
  { title, data, keyExtractor, valueExtractor, onItemSelect, children },
  ref,
) => {
  // =====================| STATES |==========================>
  /**
   * Is the bottomSheet visible?
   **/
  const [shown, setShown] = useState(false);
  /**
   * Shows the currently selected item
   **/
  const [selected, setSelected] = useState('');

  // =====================| VARIABLES |==========================>
  const theme = ThemedStyles.style;
  /**
   * only show the gradient view if we had more than 5 items. this may be
   * a naive logic
   **/
  const showGradientView = data.length > 5;
  /**
   * we want to handle top and bottom paddings, and a correct
   * scrollToIndex behavior. we do this to hit two birds with
   * one stone
   **/
  const listData = useMemo(
    () => (showGradientView ? ['', ...data, ''] : data),
    [data],
  );

  // =====================| REFS |==========================>
  const bottomSheetRef = useRef<any>();
  const flatListRef = useRef<any>();

  // =====================| FUNCTIONS |==========================>
  /**
   * Shows or hides the BottomSheet while optionally receiving a an item
   * if an item was given, it makes that item selected
   * it also scrolls to the selected item
   **/
  const show = useCallback(
    (item?) => {
      setShown(true);
      setSelected(item);

      // SCROLL TO INDEX IF SELECTED
      setTimeout(() => {
        if (item) {
          const itemToScrollTo = data.find(i => keyExtractor(i) === item);
          flatListRef.current?.scrollToIndex({
            animated: true,
            index: data.indexOf(itemToScrollTo || 0),
          });
        }
      }, 500);
    },
    [selected, flatListRef, data],
  );

  /**
   * Closes the BottomSheet
   **/
  const close = useCallback(() => setShown(false), []);

  /**
   * Renders the FlatList item
   **/
  const renderItem = useCallback(
    ({ item, index }) => {
      if (item === '') {
        return <View style={{ height: gradientHeight }} key={index} />;
      }

      const isSelected = item => selected === keyExtractor(item);

      const onMenuItemPress = () => {
        onItemSelect(item);
        close();
      };

      const textStyle = isSelected(item)
        ? theme.colorLink
        : theme.colorPrimaryText;

      return (
        <MenuItem
          key={keyExtractor(item)}
          onPress={onMenuItemPress}
          textStyle={textStyle}
          title={valueExtractor(item)}
          style={styles.menuItem}
        />
      );
    },
    [selected, onItemSelect],
  );

  /**
   * This function is called when the scroll to index fails
   **/
  const onScrollToIndexFailed = useCallback(
    () => flatListRef.current?.scrollToEnd(),
    [flatListRef],
  );

  /**
   * Imperative handles to call show and close functions
   * from outside
   **/
  useImperativeHandle(ref, () => ({
    show,
    close,
  }));

  // =====================| RENDER |==========================>
  const flatList = (
    <FlatList
      data={listData}
      renderItem={renderItem}
      extraData={selected}
      style={styles.flatList}
      ref={flatListRef}
      keyExtractor={keyExtractor}
      onScrollToIndexFailed={onScrollToIndexFailed}
    />
  );

  const modal = shown ? (
    <BottomSheet ref={bottomSheetRef} autoShow onDismiss={close}>
      {Boolean(title) && <Text style={styles.title}>{title}</Text>}
      {showGradientView ? <GradientView>{flatList}</GradientView> : flatList}
      <BottomSheetButton text={i18n.t('cancel')} onPress={close} />
    </BottomSheet>
  ) : null;

  if (children) {
    return (
      <>
        {children(show)}
        {modal}
      </>
    );
  }

  return modal;
};

export default forwardRef(SelectorV2);

const gradientHeight = 100;

const styles = ThemedStyles.create({
  menuItem: ['paddingHorizontal5x', 'rowJustifyCenter'],
  flatList: { maxHeight: 300, overflow: 'scroll' },
  title: ['colorPrimaryText', 'fontXXL', 'centered', 'marginLeft5x'],
  linear: {
    height: gradientHeight,
    width: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

const topGradientStyle = ThemedStyles.combine(
  styles.linear,
  styles.topGradient,
);
const bottomGradientStyle = ThemedStyles.combine(
  styles.linear,
  styles.bottomGradient,
);
