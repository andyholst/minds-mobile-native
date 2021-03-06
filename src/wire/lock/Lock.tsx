import React, { PureComponent } from 'react';

import { View, Alert, StyleSheet } from 'react-native';

import { Icon } from 'react-native-elements';
import FastImage from 'react-native-fast-image';

import currency from '../../common/helpers/currency';
import Button from '../../common/components/Button';

import { MINDS_ASSETS_CDN_URI, MINDS_CDN_URI } from '../../config/Config';

import i18n from '../../common/services/i18n.service';
import type ActivityModel from '../../newsfeed/ActivityModel';
import ThemedStyles from '../../styles/ThemedStyles';
import MText from '../../common/components/MText';

type PropsType = {
  entity: ActivityModel;
  navigation: any;
};

const imageStyle = { height: 200, width: '100%' };
const iconStyle = { fontSize: 22 };

/**
 * Wire lock component
 */
export default class Lock extends PureComponent<PropsType> {
  state = {
    unlocking: false,
  };

  /**
   * Render
   */
  render() {
    const entity = this.props.entity;
    const theme = ThemedStyles.style;

    if (entity.isOwner()) {
      return (
        <View style={[theme.padding2x, theme.rowJustifyCenter, theme.centered]}>
          <View style={styles.textContainer}>
            <MText style={theme.fontS}>{this.getOwnerIntro()}</MText>
          </View>
          <View style={[theme.rowJustifyCenter, theme.centered]}>
            <Icon
              reverse
              name="ios-flash"
              type="ionicon"
              size={8}
              iconStyle={iconStyle}
              color="#4caf50"
            />
            <MText style={[theme.fontM, ThemedStyles.style.colorPrimaryText]}>
              {i18n.t('locked')}
            </MText>
          </View>
        </View>
      );
    }

    const intro = this.getIntro();

    const imageUri = { uri: this.getBackground() };

    return (
      <View>
        <View
          style={[
            theme.paddingLeft,
            theme.paddingRight,
            theme.rowJustifyCenter,
            theme.centered,
          ]}>
          <View style={styles.textContainer}>
            <MText>{intro}</MText>
          </View>
          <Button
            loading={this.state.unlocking}
            text={i18n.t('unlock').toUpperCase()}
            color="white"
            containerStyle={theme.rowJustifyCenter}
            onPress={this.unlock}>
            <Icon name="ios-flash" type="ionicon" size={22} color="white" />
          </Button>
        </View>
        <FastImage source={imageUri} style={imageStyle} />
        <View style={[theme.centered, theme.padding2x, styles.mask]}>
          <Icon name="ios-flash" type="ionicon" size={55} color="white" />
          <MText
            style={[theme.colorWhite, theme.fontXXXL, theme.paddingBottom2x]}>
            {i18n.t('wire.amountMonth', { amount: this.getFormatedAmount() })}
          </MText>
          <MText style={[theme.colorWhite, theme.fontS, theme.textCenter]}>
            {i18n.t('wire.amountMonthDescription', {
              amount: this.getFormatedAmount().toUpperCase(),
              name: entity.ownerObj.name.toUpperCase(),
            })}
          </MText>
        </View>
      </View>
    );
  }

  /**
   * Unlock
   */
  unlock = () => {
    this.setState({ unlocking: true });

    this.props.entity.unlock(true).then(result => {
      this.setState({ unlocking: false });
      if (result) return;
      this.props.navigation.navigate('WireFab', {
        owner: this.props.entity.ownerObj,
        default: this.props.entity.wire_threshold,
        onComplete: (resultComplete: any) => {
          if (resultComplete && resultComplete.payload.method === 'onchain') {
            setTimeout(() => {
              Alert.alert(
                i18n.t('wire.weHaveReceivedYourTransaction'),
                i18n.t('wire.pleaseTryUnlockingMessage'),
              );
            }, 400);
          } else {
            this.props.entity.unlock();
          }
        },
      });
    });
  };

  /**
   * Get lock background image uri
   */
  getBackground() {
    const entity = this.props.entity;

    if (entity._preview) {
      return entity.ownerObj.merchant.exclusive._backgroundPreview;
    }

    let background = entity.get('ownerObj.merchant.exclusive.background');

    if (!background) {
      return (
        MINDS_ASSETS_CDN_URI + 'front/dist/assets/photos/andromeda-galaxy.jpg'
      );
    }
    return (
      MINDS_CDN_URI +
      'fs/v1/paywall/preview/' +
      entity.ownerObj.guid +
      '/' +
      background
    );
  }

  /**
   * Get intro for owners
   */
  getOwnerIntro() {
    return i18n.t('wire.onlySupportersWhoWire', {
      amount: this.getFormatedAmount(),
    });
  }

  /**
   * Get intro
   */
  getIntro() {
    const entity = this.props.entity;

    let intro = entity.get('ownerObj.merchant.exclusive.intro');
    if (intro) return intro;

    intro = i18n.t('wire.wireMeOver', { amount: this.getFormatedAmount() });
    return intro;
  }

  /**
   * Get the formated amount
   */
  getFormatedAmount(): string {
    const entity = this.props.entity;
    if (
      entity.wire_threshold &&
      'min' in entity.wire_threshold &&
      entity.wire_threshold.min
    ) {
      return currency(
        entity.wire_threshold.min,
        entity.wire_threshold.type,
        'suffix',
      );
    }
    return '0';
  }
}

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    padding: 8,
  },
  mask: {
    position: 'absolute',
    bottom: 0,
    height: 200,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
