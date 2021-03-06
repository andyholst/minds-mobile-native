import React from 'react';
import { ImageBackground, View, StyleSheet } from 'react-native';
import MText from '../common/components/MText';
import i18n from '../common/services/i18n.service';

type PropsType = {
  pro: boolean | undefined;
};

const Header = ({ pro }: PropsType) => {
  const texts = pro ? 'pro' : 'plus';
  return (
    <ImageBackground
      style={styles.banner}
      source={require('../assets/plus-image.png')}
      resizeMode="cover">
      <View style={styles.textContainer}>
        <MText style={styles.minds}>
          {i18n.t(`monetize.${texts}`).toUpperCase()}
        </MText>
        <MText style={styles.title}>{i18n.t(`monetize.${texts}Title`)}</MText>
        <MText style={styles.text}>
          {i18n.t(`monetize.${texts}Description`)}
        </MText>
      </View>
    </ImageBackground>
  );
};

const bannerAspectRatio = 1.3;

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 15,
  },
  minds: {
    color: '#FFFFFF',
    fontSize: 17,
    paddingBottom: 5,
    fontFamily: 'Roboto-Black',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
  },
  text: {
    color: '#AEB0B8',
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    marginVertical: 15,
  },
  banner: {
    aspectRatio: bannerAspectRatio,
    width: '100%',
  },
});

export default Header;
