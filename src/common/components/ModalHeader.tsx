import React from 'react';
import {
  ImageBackground,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import MText from './MText';

const bannerAspectRatio = 3.5;

type PropsType = {
  title: string;
  source: ImageSourcePropType;
};

const ModalHeader = ({ title, source }: PropsType) => {
  return (
    <ImageBackground style={styles.banner} source={source} resizeMode="cover">
      <View style={styles.textContainer}>
        <MText style={styles.title}>{title}</MText>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  banner: {
    aspectRatio: bannerAspectRatio,
    width: '100%',
    borderWidth: 0,
  },
});

export default ModalHeader;
