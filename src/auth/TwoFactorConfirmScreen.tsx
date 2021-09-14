import React from 'react';
import { observer, useLocalStore } from 'mobx-react';
import { RouteProp } from '@react-navigation/core';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ThemedStyles from '../styles/ThemedStyles';
import i18n from '../common/services/i18n.service';
import { RootStackParamList } from '../navigation/NavigationTypes';
import InputContainer from '../common/components/InputContainer';
import { SafeAreaView } from 'react-native-safe-area-context';

type ForgotScreenRouteProp = RouteProp<
  RootStackParamList,
  'TwoFactorConfirmation'
>;

type PropsType = {
  route: ForgotScreenRouteProp;
  navigation: any;
};

/**
 * Two factor confirmation modal screen
 */
const TwoFactorConfirmScreen = observer(({ route, navigation }: PropsType) => {
  const theme = ThemedStyles.style;
  const {
    onConfirm,
    title,
    onCancel,
    mfaType,
    oldCode,
    showRecovery,
  } = route.params;

  // Disable back button on Android
  React.useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', () => true);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', () => true);
  }, []);

  // Local store
  const localStore = useLocalStore(() => ({
    code: oldCode,
    recovery: false,
    error: !!oldCode,
    setCode(code: string) {
      this.code = code;
    },
    toggleRecovery() {
      this.recovery = !this.recovery;
    },
    setError(error: boolean) {
      this.error = error;
    },
    cancel: () => {
      onCancel && onCancel();
      navigation.goBack();
    },
    resend: () => {
      onConfirm('');
    },
    submit() {
      this.error = false;
      if (!this.code) {
        this.error = true;
        return;
      }
      try {
        onConfirm(this.code);
        navigation.goBack();
        this.code = '';
      } catch (err) {
        this.error = true;
      }
    },
  }));

  const description =
    mfaType === 'email'
      ? i18n.t('auth.2faEmailDescription')
      : mfaType === 'totp'
      ? i18n.t('auth.2faAppDescription')
      : i18n.t('auth.2faSmsDescription');

  return (
    <SafeAreaView style={[theme.flexContainer, theme.bgPrimaryBackground]}>
      <KeyboardAvoidingView
        style={theme.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Icon
            name="close"
            size={25}
            color={ThemedStyles.getColor('SecondaryText')}
            onPress={localStore.cancel}
          />
          <Text style={styles.titleText}>
            {title || i18n.t('auth.2faRequired')}
          </Text>
          <TouchableOpacity onPress={localStore.submit}>
            <Text style={styles.continue}>{i18n.t('verify')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>{description}</Text>
        <View style={theme.fullWidth}>
          <InputContainer
            maxLength={localStore.recovery ? undefined : 6}
            keyboardType={localStore.recovery ? undefined : 'numeric'}
            labelStyle={theme.colorPrimaryText}
            style={theme.colorPrimaryText}
            placeholder={
              localStore.recovery
                ? i18n.t('auth.recoveryCode')
                : i18n.t('auth.authCode')
            }
            onChangeText={localStore.setCode}
            error={localStore.error ? i18n.t('auth.2faInvalid') : ''}
            value={localStore.code}
          />
        </View>
        {mfaType === 'email' && (
          <Text style={styles.description} onPress={localStore.resend}>
            {i18n.t('onboarding.verifyEmailDescription2')}
            <Text style={styles.resend}> {i18n.t('onboarding.resend')}</Text>
          </Text>
        )}
        {mfaType === 'totp' && showRecovery && (
          <Text style={styles.description} onPress={localStore.toggleRecovery}>
            {i18n.t('auth.recoveryDesc')}
            <Text style={styles.resend}> {i18n.t('auth.recoveryCode')}</Text>
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

const styles = ThemedStyles.create({
  continue: ['fontL', 'fontMedium', 'colorLink', 'paddingTop'],
  resend: ['fontMedium', 'colorLink'],
  description: [
    'colorSecondaryText',
    'paddingVertical8x',
    'paddingHorizontal4x',
    'fontL',
  ],
  header: [
    'rowJustifySpaceBetween',
    'alignCenter',
    'paddingVertical3x',
    'borderBottomHair',
    'bcolorPrimaryBorder',
    'paddingHorizontal3x',
  ],
  error: {
    marginTop: 8,
    marginBottom: 8,
    color: '#c00',
    textAlign: 'center',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    flex: 7,
    textAlign: 'center',
    paddingLeft: 10,
  },
});

export default TwoFactorConfirmScreen;