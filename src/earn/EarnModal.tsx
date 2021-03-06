import React, { useEffect } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import UniswapWidget from '../common/components/uniswap-widget/UniswapWidget';
import ThemedStyles from '../styles/ThemedStyles';
import i18n from '../common/services/i18n.service';
import mindsConfigService from '../common/services/minds-config.service';
import { observer, useLocalStore } from 'mobx-react';
import createLocalStore from './createLocalStore';
import ModalScreen from '../common/components/ModalScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ONCHAIN_ENABLED } from '../config/Config';
import MText from '../common/components/MText';

const linkTo = (dest: string) =>
  Linking.openURL(`https://www.minds.com/${dest}`);

const onComplete = () => true;

type EarnItemPropsType = {
  content: { name: string; icon?: string; onPress: () => void };
};

const EarnItem = ({ content }: EarnItemPropsType) => {
  const theme = ThemedStyles.style;

  const body = content.icon ? (
    <View style={[theme.rowJustifyStart, theme.alignCenter]}>
      <Icon
        name={content.icon}
        color={ThemedStyles.getColor('PrimaryText')}
        size={20}
        style={[theme.centered, theme.marginRight3x]}
      />
      <MText style={[theme.fontL, theme.colorPrimaryText, theme.bold]}>
        {i18n.t(`earnScreen.${content.name}.title`)}
      </MText>
    </View>
  ) : (
    <MText style={[theme.fontL, theme.colorSecondaryText, theme.fontMedium]}>
      {i18n.t(`earnScreen.${content.name}`)}
    </MText>
  );

  return (
    <TouchableOpacity
      style={[
        theme.rowJustifySpaceBetween,
        theme.paddingLeft5x,
        theme.paddingRight5x,
        theme.marginTop5x,
      ]}
      onPress={content.onPress}>
      {body}
      <Icon
        name={'chevron-right'}
        color={ThemedStyles.getColor('SecondaryText')}
        size={24}
      />
    </TouchableOpacity>
  );
};

export default observer(function ({ navigation }) {
  const theme = ThemedStyles.style;
  const localStore = useLocalStore(createLocalStore);

  useEffect(() => {
    const settings = mindsConfigService.getSettings();
    localStore.setTokenAddress(settings.blockchain.token.address);
  }, [localStore]);

  const navTo = (screen: string, options = {}) =>
    navigation.navigate(screen, options);

  const openWithdrawal = () => navigation.navigate('WalletWithdrawal');

  const earnItems = [
    {
      name: 'pool',
      icon: 'plus-circle-outline',
      onPress: localStore.toggleUniswapWidget,
    },

    {
      name: 'create',
      icon: 'plus-box',
      onPress: () => navTo('Compose', { mode: 'text', start: true }),
    },
    {
      name: 'refer',
      icon: 'account-multiple',
      onPress: () => navTo('Referrals'),
    },
  ];

  if (ONCHAIN_ENABLED) {
    earnItems.push({
      name: 'transfer',
      icon: 'swap-horizontal',
      onPress: openWithdrawal,
    });
  }

  const resourcesItems = [
    {
      name: 'resources.rewards',
      onPress: () => linkTo('rewards'),
    },
    {
      name: 'resources.tokens',
      onPress: () => linkTo('token'),
    },
    {
      name: 'resources.earnings',
      onPress: () =>
        navTo('Tabs', { screen: 'CaptureTab', params: { screen: 'Wallet' } }),
    },
    {
      name: 'resources.analytics',
      onPress: () =>
        navTo('Tabs', {
          screen: 'CaptureTab',
          params: { screen: 'Analytics' },
        }),
    },
  ];

  const unlockItems = [
    {
      name: 'unlock.mindsPlus',
      onPress: () => navTo('UpgradeScreen', { onComplete, pro: false }),
    },
    {
      name: 'unlock.pro',
      onPress: () => navTo('UpgradeScreen', { onComplete, pro: true }),
    },
  ];

  const titleStyle = [
    styles.title,
    theme.colorPrimaryText,
    theme.marginTop5x,
    theme.paddingLeft5x,
  ];

  return (
    <>
      <ModalScreen
        source={require('../assets/withdrawalbg.jpg')}
        title={i18n.t('earnScreen.title')}>
        <MText style={titleStyle}>{i18n.t('earnScreen.increase')}</MText>
        {earnItems.map(item => (
          <EarnItem content={item} />
        ))}
        <MText style={[titleStyle, theme.paddingTop2x]}>
          {i18n.t('earnScreen.resources.title')}
        </MText>
        {resourcesItems.map(item => (
          <EarnItem content={item} />
        ))}
        <MText style={[titleStyle, theme.paddingTop2x]}>
          {i18n.t('earnScreen.unlock.title')}
        </MText>
        {unlockItems.map(item => (
          <EarnItem content={item} />
        ))}
      </ModalScreen>
      <UniswapWidget
        isVisible={localStore.showUniswapWidget}
        action={'add'}
        onCloseButtonPress={localStore.toggleUniswapWidget}
        tokenAddress={localStore.tokenAddress}
      />
    </>
  );
});

const styles = StyleSheet.create({
  title: {
    fontSize: 21,
    fontWeight: '700',
  },
  textItem: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Roboto-Medium',
  },
});
