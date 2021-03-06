import React, { useRef } from 'react';
import { Linking, ScrollView, View } from 'react-native';

import { observer, useLocalStore } from 'mobx-react';
import { CheckBox } from 'react-native-elements';
import { debounce } from 'lodash';
import InputContainer from '../../common/components/InputContainer';
import i18n from '../../common/services/i18n.service';
import ThemedStyles from '../../styles/ThemedStyles';
import validatePassword from '../../common/helpers/validatePassword';
import { showNotification } from '../../../AppMessages';
import validatorService from '../../common/services/validator.service';
import Captcha from '../../common/components/Captcha';
import authService, { registerParams } from '../AuthService';
import apiService from '../../common/services/api.service';
import delay from '../../common/helpers/delay';
import logService from '../../common/services/log.service';
import sessionService from '../../common/services/session.service';
import featuresService from '../../common/services/features.service';
import PasswordInput from '../../common/components/password-input/PasswordInput';
import MText from '../../common/components/MText';
import { BottomSheetButton } from '../../common/components/bottom-sheet';
import { useNavigation } from '@react-navigation/core';
import KeyboardSpacingView from '~/common/components/keyboard/KeyboardSpacingView';
import FitScrollView from '~/common/components/FitScrollView';

type PropsType = {
  // called after registeration is finished
  onRegister?: (navigation: any) => void; // TODO type
};

const alphanumericPattern = '^[a-zA-Z0-9_]+$';

const RegisterForm = observer(({ onRegister }: PropsType) => {
  const navigation = useNavigation();
  const captchaRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>();

  const store = useLocalStore(() => ({
    focused: false,
    error: {},
    password: '',
    passwordFocused: false,
    username: '',
    email: '',
    termsAccepted: false,
    exclusivePromotions: true,
    hidePassword: true,
    inProgress: false,
    showErrors: false,
    usernameTaken: false,
    validateUser: debounce(async (username: string) => {
      const response = await apiService.get<any>('api/v3/register/validate', {
        username,
      });
      store.usernameTaken = !response.valid;
    }, 300),
    onCaptchResult: async (captcha: string) => {
      store.inProgress = true;

      captchaRef.current.hide();

      try {
        const params = {
          username: store.username,
          email: store.email,
          password: store.password,
          exclusive_promotions: store.exclusivePromotions,
          captcha,
        } as registerParams;
        await authService.register(params);
        await apiService.clearCookies();
        await delay(100);
        if (featuresService.has('onboarding-october-2020')) {
          sessionService.setInitialScreen('SelectHashtags');
        }
        try {
          await authService.login(store.username, store.password);
          i18n.setLocaleBackend();
          onRegister?.(navigation);
        } catch (err) {
          try {
            await authService.login(store.username, store.password);
          } catch (error) {
            showNotification(i18n.t('auth.failedToLoginNewAccount'));
            logService.exception(error);
          }
        }
      } catch (err) {
        showNotification(err.message, 'warning', 3000, 'top');
        logService.exception(err);
      } finally {
        store.inProgress = false;
      }
    },
    onRegisterPress() {
      this.showErrors = true;
      if (!store.termsAccepted) {
        return showNotification(
          i18n.t('auth.termsAcceptedError'),
          'info',
          3000,
          'top',
        );
      }
      if (!validatePassword(store.password).all) {
        showNotification(
          i18n.t('auth.invalidPassword'),
          'warning',
          2000,
          'top',
        );
        return;
      }
      if (
        !store.username ||
        store.usernameTaken ||
        !store.email ||
        !validatorService.email(store.email)
      ) {
        return;
      }
      captchaRef.current?.show();
    },
    // on password focus
    focus() {
      this.focused = true;
      scrollViewRef.current?.scrollToEnd();
    },
    blur() {
      this.focused = false;
    },
    setPassword(value: string) {
      store.showErrors = false;
      store.password = value;
    },
    setUsername(value: string) {
      store.showErrors = false;
      store.username = value;
      if (!store.username.match(alphanumericPattern)) {
        store.showErrors = true;
      } else {
        store.validateUser(value);
      }
    },
    setEmail(value: string) {
      store.showErrors = false;
      store.email = value;
    },
    toggleTerms() {
      store.termsAccepted = !store.termsAccepted;
    },
    toggleHidePassword() {
      store.hidePassword = !store.hidePassword;
    },
    togglePromotions() {
      store.exclusivePromotions = !store.exclusivePromotions;
    },
    emailInputBlur() {
      store.email = store.email.trim();
      if (!validatorService.email(store.email)) {
        this.showErrors = true;
      }
    },
    get usernameError() {
      if (this.usernameTaken) {
        return i18n.t('auth.userTaken');
      }

      return !this.showErrors
        ? undefined
        : !this.username
        ? i18n.t('auth.fieldRequired')
        : !this.username.match(alphanumericPattern)
        ? i18n.t('auth.matchPattern')
        : undefined;
    },
  }));

  const theme = ThemedStyles.style;

  const inputs = (
    <View>
      <InputContainer
        placeholder={i18n.t('auth.username')}
        onChangeText={store.setUsername}
        value={store.username}
        testID="usernameInput"
        error={store.usernameError}
        noBottomBorder
        autofocus
        autoCorrect={false}
        returnKeyType="next"
        keyboardType="name-phone-pad"
        autoComplete="username-new"
        textContentType="username"
      />
      <InputContainer
        placeholder={i18n.t('auth.email')}
        onChangeText={store.setEmail}
        value={store.email}
        autoComplete="email"
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        testID="emailInput"
        error={
          !store.showErrors
            ? undefined
            : !store.email
            ? i18n.t('auth.fieldRequired')
            : !validatorService.email(store.email)
            ? validatorService.emailMessage(store.email)
            : undefined
        }
        noBottomBorder
        onBlur={store.emailInputBlur}
      />
      <PasswordInput
        store={store}
        tooltipBackground={ThemedStyles.getColor('TertiaryBackground')}
        inputProps={{
          textContentType: 'newPassword',
          onSubmitEditing: store.onRegisterPress,
          error:
            store.showErrors && !validatePassword(store.password).all
              ? i18n.t('settings.invalidPassword')
              : undefined,
        }}
      />
    </View>
  );

  return (
    <KeyboardSpacingView style={theme.flexContainer} noInset>
      <FitScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps={'always'}
        contentContainerStyle={theme.paddingBottom4x}>
        {inputs}
        <View style={[theme.paddingHorizontal4x, theme.paddingVertical2x]}>
          <CheckBox
            containerStyle={styles.checkboxTerm}
            title={
              <MText style={styles.checkboxText}>
                {i18n.t('auth.accept')}{' '}
                <MText
                  style={theme.link}
                  onPress={() =>
                    Linking.openURL('https://www.minds.com/p/terms')
                  }>
                  {i18n.t('auth.termsAndConditions')}
                </MText>
              </MText>
            }
            checked={store.termsAccepted}
            onPress={store.toggleTerms}
          />
          <CheckBox
            containerStyle={styles.checkboxPromotions}
            title={
              <MText style={styles.checkboxText}>
                {i18n.t('auth.promotions')}
              </MText>
            }
            checked={store.exclusivePromotions}
            onPress={store.togglePromotions}
          />
        </View>
        <BottomSheetButton
          onPress={store.onRegisterPress}
          text={i18n.t('auth.createChannel')}
          disabled={true || store.inProgress}
          loading={store.inProgress}
          testID="registerButton"
          action
        />
        <Captcha
          ref={captchaRef}
          onResult={store.onCaptchResult}
          testID="captcha"
        />
      </FitScrollView>
    </KeyboardSpacingView>
  );
});

export default RegisterForm;

const styles = ThemedStyles.create({
  checkboxPromotions: ['checkbox', 'paddingLeft', 'margin0x'],
  checkboxTerm: ['checkbox', 'paddingLeft', 'margin0x', 'paddingBottom0x'],
  checkboxText: ['colorPrimaryText', 'fontL', 'paddingLeft2x'],
});
