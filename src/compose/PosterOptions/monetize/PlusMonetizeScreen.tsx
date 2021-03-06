import React, { FC, useCallback } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { observer, useLocalStore } from 'mobx-react';
import ThemedStyles from '../../../styles/ThemedStyles';
import i18n from '../../../common/services/i18n.service';
import { useLegacyStores } from '~/common/hooks/use-stores';
import Button from '../../../common/components/Button';
import Wrapper from './common/Wrapper';
import { CheckBox } from 'react-native-elements';
import MText from '../../../common/components/MText';
import { StackScreenProps } from '@react-navigation/stack';
import { PosterStackParamList } from '~/compose/PosterOptions/PosterStackNavigator';
import { useComposeContext } from '~/compose/useComposeStore';
import { AppStackParamList } from '~/navigation/NavigationTypes';

const createPlusMonetizeStore = () => {
  const store = {
    agreedTerms: false,
    setAgreedTerms() {
      this.agreedTerms = !this.agreedTerms;
    },
  };
  return store;
};

interface PlusMonetizeScreenProps
  extends FC,
    StackScreenProps<
      PosterStackParamList & AppStackParamList,
      'PlusMonetize'
    > {}

const PlusMonetizeScreen = observer(
  ({ route, navigation }: PlusMonetizeScreenProps) => {
    const { user } = useLegacyStores();
    const store = useComposeContext();
    const theme = ThemedStyles.style;

    const localStore = useLocalStore(createPlusMonetizeStore);

    const save = useCallback(() => {
      const exclusivity = null;
      store.savePlusMonetize(exclusivity);
    }, [store]);

    const onComplete = useCallback(
      (success: any) => {
        if (success) {
          user.me.togglePlus();
        }
      },
      [user],
    );

    if (!user.me.plus) {
      return (
        <Wrapper store={store} hideDone={true} onPressRight={save}>
          <View style={[theme.paddingVertical6x, theme.paddingHorizontal3x]}>
            <MText
              style={[
                theme.colorSecondaryText,
                theme.fontL,
                theme.paddingVertical2x,
              ]}>
              {i18n.t('monetize.plusMonetize.notPlus')}
            </MText>
            <Button
              text={i18n.t('monetize.plusMonetize.upgrade')}
              textStyle={styles.title}
              onPress={() =>
                navigation.push('UpgradeScreen', { onComplete, pro: false })
              }
            />
          </View>
        </Wrapper>
      );
    }

    return (
      <Wrapper
        store={store}
        doneText={i18n.t('save')}
        onPressRight={save}
        hideDone={!localStore.agreedTerms}>
        <View style={[theme.paddingVertical6x, theme.paddingHorizontal3x]}>
          <MText
            style={[
              theme.colorSecondaryText,
              theme.fontL,
              theme.paddingVertical2x,
            ]}>
            {i18n.t('monetize.plusMonetize.submit')}
          </MText>
          <CheckBox
            containerStyle={[theme.checkbox, styles.checkbox]}
            title={
              <MText style={theme.colorPrimaryText}>
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
            checked={localStore.agreedTerms}
            onPress={localStore.setAgreedTerms}
          />
        </View>
      </Wrapper>
    );
  },
);

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 17,
  },
  checkbox: {
    marginRight: 0,
    marginVertical: 15,
    paddingTop: 0,
  },
  switchText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 15,
  },
});

export default PlusMonetizeScreen;
