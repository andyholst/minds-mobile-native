import React from 'react';
import { observer } from 'mobx-react';
import type { MindsVideoStoreType } from '../createMindsVideoStore';
import Icon from 'react-native-vector-icons/Ionicons';
import type ActivityModel from '../../../../newsfeed/ActivityModel';
import type CommentModel from '../../../../comments/v2/CommentModel';
import { View, TouchableWithoutFeedback } from 'react-native';
import ThemedStyles from '../../../../styles/ThemedStyles';
import withPreventDoubleTap from '../../../../common/components/PreventDoubleTap';
import ProgressBar from '../ProgressBar';
import { styles, iconSize, playSize } from './styles';
// workaround to fix tooltips on android
// import Tooltip from 'rne-modal-tooltip';
// import MText from '../../../../common/components/MText';

type PropsType = {
  entity?: ActivityModel | CommentModel;
  localStore: MindsVideoStoreType;
  hideOverlay?: boolean;
};

// type SourceSelectorPropsType = {
//   localStore: MindsVideoStoreType;
// };

const DebouncedTouchableWithoutFeedback = withPreventDoubleTap(
  TouchableWithoutFeedback,
);

const hitSlop = { top: 20, bottom: 20, right: 20, left: 20 };
const controlColor = '#F7F7F7';

// const SourceSelector = ({ localStore }: SourceSelectorPropsType) => {
//   const theme = ThemedStyles.style;
//   if (!localStore.sources) {
//     return null;
//   }
//   return (
//     <View>
//       {localStore.sources.map((s, i) => (
//         <MText
//           style={[
//             theme.colorWhite,
//             theme.fontL,
//             theme.paddingBottom,
//             i === localStore.source ? theme.bold : null,
//           ]}
//           onPress={() => localStore.setSource(i)}>
//           {s.size}p
//         </MText>
//       ))}
//     </View>
//   );
// };

const Controls = observer(({ localStore, entity, hideOverlay }: PropsType) => {
  const theme = ThemedStyles.style;

  const mustShow = Boolean(
    !hideOverlay &&
      !localStore.forceHideOverlay &&
      (localStore.showOverlay || (localStore.paused && entity)),
  );

  if (mustShow) {
    const progressBar = (
      <View style={[theme.flexContainer, theme.columnAlignCenter]}>
        <ProgressBar store={localStore} />
      </View>
    );

    // remove source selector (we have only one source)
    // const sourceSelector = <SourceSelector localStore={localStore} />;

    return (
      <DebouncedTouchableWithoutFeedback
        hitSlop={hitSlop}
        style={styles.overlayContainer}
        onPress={localStore.openControlOverlay}>
        <View style={styles.overlayContainer}>
          <View
            style={[theme.positionAbsolute, theme.centered, theme.marginTop2x]}>
            <View style={[theme.centered, styles.playContainer]}>
              <Icon
                onPress={() =>
                  localStore.paused
                    ? localStore.play(Boolean(localStore.volume))
                    : localStore.pause()
                }
                style={[styles.videoIcon, styles.textShadow]}
                name={localStore.paused ? 'play' : 'pause'}
                size={playSize - 25}
                color={controlColor}
              />
            </View>
          </View>
          {/* {localStore.duration > 0 && entity && (
            <View style={styles.controlSettingsContainer}>
              <Tooltip
                popover={sourceSelector}
                withOverlay={false}
                height={60}
                onOpen={localStore.openControlOverlay}
                backgroundColor="rgba(48,48,48,0.7)">
                <Icon
                  name="ios-settings-sharp"
                  size={iconResSize}
                  style={[
                    theme.paddingLeft,
                    styles.textShadow,
                    theme.colorWhite,
                  ]}
                />
              </Tooltip>
            </View>
          )} */}
          {localStore.duration > 0 && (
            <View style={styles.controlBarContainer}>
              <Icon
                onPress={localStore.toggleFullScreen}
                name="ios-expand"
                size={iconSize}
                color={controlColor}
                style={theme.paddingHorizontal}
              />
              {progressBar}
              <View style={[theme.padding, theme.rowJustifySpaceEvenly]}>
                <DebouncedTouchableWithoutFeedback
                  hitSlop={hitSlop}
                  onPress={localStore.toggleVolume}>
                  <Icon
                    name={
                      localStore.volume === 0
                        ? 'ios-volume-mute'
                        : 'ios-volume-high'
                    }
                    size={iconSize}
                    color={controlColor}
                  />
                </DebouncedTouchableWithoutFeedback>
              </View>
            </View>
          )}
        </View>
      </DebouncedTouchableWithoutFeedback>
    );
  }

  return !localStore.paused && !hideOverlay ? (
    <View
      style={[
        theme.positionAbsoluteBottomRight,
        theme.padding2x,
        styles.floatingVolume,
      ]}>
      <Icon
        onPress={localStore.toggleVolume}
        name={localStore.volume === 0 ? 'ios-volume-mute' : 'ios-volume-high'}
        size={iconSize}
        color={controlColor}
      />
    </View>
  ) : null;
});

export default Controls;
