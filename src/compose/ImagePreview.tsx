import React from 'react';
import { observer } from 'mobx-react';
import FastImage from 'react-native-fast-image';
import { Dimensions } from 'react-native';
import SmartImage from '../common/components/SmartImage';
import ThemedStyles from '../styles/ThemedStyles';
import ImageZoom from 'react-native-image-pan-zoom';
import { useDimensions } from '@react-native-community/hooks';

/**
 * Image preview with max and min aspect ratio support
 * @param {Object} props
 */
export default observer(function (props) {
  let { width } = useDimensions().window;

  // calculate the aspect ratio
  let aspectRatio = props.image.width / props.image.height;

  if (props.maxRatio && props.maxRatio < aspectRatio) {
    aspectRatio = props.maxRatio;
  }

  if (props.minRatio && props.minRatio > aspectRatio) {
    aspectRatio = props.minRatio;
  }

  let imageHeight = Math.round(width / aspectRatio);

  const imageStyle = props.fullscreen
    ? {
        height: '100%',
        width: '100%',
      }
    : {
        aspectRatio,
        width: '100%',
        borderRadius: 10,
      };

  // workaround: we use sourceURL for the preview on iOS because the image is not displayed with the uri
  const uri = props.image.uri || props.image.path;

  if (!props.zoom) {
    return (
      <FastImage
        key={props.image.key || 'imagePreview'}
        source={{ uri: uri + `?${props.image.key}` }} // we need to change the uri in order to force the reload of the image
        style={[
          imageStyle,
          props.style,
          props.fullscreen
            ? ThemedStyles.style.bgBlack
            : ThemedStyles.style.bgTertiaryBackground,
        ]}
        resizeMode={
          props.fullscreen
            ? FastImage.resizeMode.cover
            : FastImage.resizeMode.contain
        }
      />
    );
  } else {
    return (
      <ImageZoom
        cropWidth={Dimensions.get('window').width}
        cropHeight={Dimensions.get('window').height}
        imageWidth={Dimensions.get('window').width}
        imageHeight={imageHeight}>
        <SmartImage
          key={props.image.key || 'imagePreview'}
          source={{ uri: uri + `?${props.image.key}` }} // we need to change the uri in order to force the reload of the image
          style={[
            imageStyle,
            props.style,
            ThemedStyles.style.bgTertiaryBackground,
          ]}
          resizeMode={FastImage.resizeMode.contain}
        />
      </ImageZoom>
    );
  }
});
