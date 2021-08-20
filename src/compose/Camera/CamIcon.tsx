import React, { FC } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import type { CameraStore } from './createCameraStore';
import { observer } from 'mobx-react';
import { View } from 'moti';

type PropsType = {
  store: CameraStore;
  style: any;
};

/**
 * Camera switch Icon
 */
const CamIcon: FC<PropsType> = ({ store, style }: PropsType) => {
  // Toggle callback
  const onPress = React.useCallback(() => store.toggleCamera(), [store]);
  // Rotate the icon when changing
  const animate = React.useMemo(
    () => ({
      rotateY: store.cameraType === 'back' ? '0deg' : '180deg',
      perspective: 850,
    }),
    [store.cameraType],
  );

  return (
    <View
      animate={animate}
      transition={{
        type: 'spring',
        delay: 50,
      }}>
      <Icon
        name="md-camera-reverse-outline"
        size={30}
        style={style}
        onPress={onPress}
      />
    </View>
  );
};

export default observer(CamIcon);