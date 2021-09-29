import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import ThemedStyles from '../../styles/ThemedStyles';
import i18n from '../../common/services/i18n.service';
import Switch from 'react-native-switch-pro';
import settingsService from '../SettingsService';
import CenteredLoading from '../../common/components/CenteredLoading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import MText from '../../common/components/MText';

export default function () {
  const theme = ThemedStyles.style;

  const navigation = useNavigation();

  const [allowUnsubscribedContact, setValue] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Get configuration
   */
  useEffect(() => {
    async function getMatureContent() {
      const { channel } = await settingsService.getSettings();
      setValue(Boolean(channel.allow_unsubscribed_contact));
      setLoading(false);
    }
    getMatureContent();
  }, [setValue, setLoading]);

  /**
   * Save changes
   */
  const save = async val => {
    try {
      await settingsService.submitSettings({
        allow_unsubscribed_contact: val ? 1 : 0,
      });
      setValue(val);
    } catch (err) {
      setValue(!val);
    }
  };

  const navToMessengerSetup = () => navigation.navigate('RekeyScreen');

  const rowStyle = [
    styles.row,
    theme.bgSecondaryBackground,
    theme.paddingVertical3x,
    theme.paddingHorizontal3x,
    theme.bcolorPrimaryBorder,
    theme.borderBottom,
    theme.borderTop,
  ];

  const textStyle = [theme.marginLeft, theme.colorSecondaryText, theme.fontM];

  const component = loading ? (
    <CenteredLoading />
  ) : (
    <View
      style={[
        theme.flexContainer,
        theme.bgPrimaryBackground,
        theme.paddingTop4x,
      ]}>
      <View style={rowStyle}>
        <MText style={textStyle}>{i18n.t('messenger.allowContact')}</MText>
        <Switch value={allowUnsubscribedContact} onSyncPress={save} />
      </View>
      <TouchableOpacity style={rowStyle} onPress={navToMessengerSetup}>
        <MText style={textStyle}>{i18n.t('messenger.messengerRekey')}</MText>
        <Icon
          name="chevron-right"
          size={24}
          color={ThemedStyles.getColor('SecondaryText')}
        />
      </TouchableOpacity>
    </View>
  );

  return component;
}

const styles = {
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
};
