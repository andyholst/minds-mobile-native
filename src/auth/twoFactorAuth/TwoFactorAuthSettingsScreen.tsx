import { useNavigation } from '@react-navigation/native';
import { observer, useLocalStore } from 'mobx-react';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MenuItem from '../../common/components/menus/MenuItem';
import i18n from '../../common/services/i18n.service';
import ThemedStyles from '../../styles/ThemedStyles';
import createTwoFactorStore, { Options } from './createTwoFactorStore';
import settingsService from '../../settings/SettingsService';
import requirePhoneValidation from '../../common/hooks/requirePhoneValidation';
import { showNotification } from '../../../AppMessages';
import MText from '../../common/components/MText';

const TwoFactorAuthSettingsScreen = observer(() => {
  const theme = ThemedStyles.style;
  const navigation = useNavigation();
  const localStore = useLocalStore(createTwoFactorStore);

  useEffect(() => {
    const getSettings = async () => {
      const settings: any = await settingsService.getSettings();
      if (settings && settings.channel) {
        localStore.has2fa(settings.channel.has2fa);
      }
    };
    getSettings();
  }, [localStore]);

  const items = [
    {
      id: 'app' as Options,
      enabled: localStore.appAuthEnabled,
    },
    {
      id: 'sms' as Options,
      enabled: localStore.smsAuthEnabled,
    },
  ];

  const onConfirmPasswordSuccess = async (password: string) => {
    const screen =
      localStore.selectedOption === 'app'
        ? 'VerifyAuthAppScreen'
        : localStore.selectedOption === 'sms'
        ? 'VerifyPhoneNumberScreen'
        : 'DisableTFA';
    if (screen === 'VerifyPhoneNumberScreen') {
      const response = await requirePhoneValidation(
        i18n.t('settings.TFAVerifyPhoneDesc1'),
      );
      if (response) {
        navigation.goBack();
        showNotification(i18n.t('settings.TFAEnabled'));
      }
    } else {
      navigation.navigate(screen, {
        store: localStore,
        password,
      });
    }
  };

  const confirmPassword = () => {
    navigation.navigate('PasswordConfirmation', {
      title: i18n.t('settings.TFA'),
      onConfirm: onConfirmPasswordSuccess,
    });
  };

  return (
    <View>
      <MText style={[styles.description, theme.colorSecondaryText]}>
        {i18n.t('settings.TFAdescription')}
      </MText>
      {items.map(item => (
        <MenuItem
          item={{
            onPress: () => {
              if (localStore.has2faEnabled) {
                return false;
              }
              localStore.setSelected(item.id);
              confirmPassword();
            },
            title: <ItemTitle id={item.id} enabled={item.enabled} />,
            noIcon: localStore.has2faEnabled,
          }}
          titleStyle={styles.titleContainer}
        />
      ))}
      {localStore.has2faEnabled && (
        <MenuItem
          item={{
            onPress: () => {
              localStore.setSelected('disable');
              confirmPassword();
            },
            title: i18n.t('settings.TFADisable'),
          }}
        />
      )}
    </View>
  );
});

const ItemTitle = ({ id, enabled }) => {
  const theme = ThemedStyles.style;
  const enabledColors = {
    backgroundColor: ThemedStyles.theme ? '#FFFFFF' : '#242A30',
    color: ThemedStyles.theme ? '#43434D' : '#FFFFFF',
  };
  return (
    <View style={styles.container}>
      <View style={[theme.rowJustifyStart, theme.marginBottom2x]}>
        <MText style={styles.title}>
          {i18n.t(`settings.TFAOptions.${id}Title`)}
        </MText>
        {enabled && (
          <MText style={[styles.enabled, enabledColors]}>
            {i18n.t('enabled')}
          </MText>
        )}
      </View>
      <MText style={[theme.colorSecondaryText, theme.fontL]}>
        {i18n.t(`settings.TFAOptions.${id}Description`)}
      </MText>
    </View>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    marginTop: Platform.select({ ios: 20, android: 10 }),
    paddingTop: 0,
  },
  description: {
    fontSize: 15,
    paddingLeft: 21,
    paddingRight: 23,
    marginVertical: 30,
  },
  container: {
    width: 300,
  },
  title: {
    fontWeight: '500',
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
  },
  enabled: {
    marginLeft: 18,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 14,
    fontWeight: '700',
    borderRadius: 3,
  },
});

export default TwoFactorAuthSettingsScreen;
