import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react';
import { DotIndicator } from 'react-native-reanimated-indicators';
import { IconButton } from '~ui/icons';
import ThemedStyles, { useMemoStyle } from '../styles/ThemedStyles';
import MText from '../common/components/MText';

/**
 * Compose Top bar
 */
export default observer(function (props) {
  const theme = ThemedStyles.style;
  const backIconName = props.backIconName || 'close';
  const backIconSize = props.backIconSize || 30;
  const containerStyle = useMemoStyle(
    [styles.topBar, props.containerStyle],
    [props.containerStyle],
  );

  return (
    <View style={containerStyle}>
      <IconButton
        size={backIconSize}
        name={backIconName}
        style={styles.back}
        onPress={props.onPressBack}
        testID="topbarBack"
      />
      {props.leftText && (
        <MText style={styles.leftText}>{props.leftText}</MText>
      )}
      <View style={theme.flexContainer} />
      {props.store.posting ? (
        <DotIndicator
          containerStyle={styles.dotIndicatorContainerStyle}
          color={ThemedStyles.getColor('SecondaryText')}
          scaleEnabled={true}
        />
      ) : (
        props.rightText && (
          <MText
            style={styles.postButton}
            onPress={props.onPressRight}
            testID="topBarDone">
            {props.rightText}
          </MText>
        )
      )}
    </View>
  );
});

const styles = ThemedStyles.create({
  dotIndicatorContainerStyle: ['rowJustifyEnd', 'marginRight4x'],
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  leftText: [
    'textCenter',
    {
      position: 'absolute',
      textAlign: 'center',
      fontSize: 20,
    },
  ],
  postButton: {
    textAlign: 'right',
    fontSize: 18,
    paddingRight: 20,
  },
  back: ['colorIcon', 'paddingLeft2x', 'paddingRight2x'],
});
