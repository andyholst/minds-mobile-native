import React from 'react';

import { Linking, Platform } from 'react-native';

import { IconButtonNext } from '~ui/icons';

import ThemedStyles from '../../../styles/ThemedStyles';
import type ActivityModel from '../../ActivityModel';
import { observer, useLocalStore } from 'mobx-react';
import BottomButtonOptions, {
  ItemType,
} from '../../../common/components/BottomButtonOptions';
import i18n from '../../../common/services/i18n.service';
import SendIntentAndroid from 'react-native-send-intent';
import { ANDROID_CHAT_APP, MINDS_URI } from '../../../config/Config';
import logService from '../../../common/services/log.service';
import ShareService from '../../../share/ShareService';
import { actionsContainerStyle } from './styles';

type PropsType = {
  entity: ActivityModel;
};

export default observer(function ShareAction({ entity }: PropsType) {
  // store
  const localStore = useLocalStore(() => ({
    showMenu: false,
    onPress() {
      if (Platform.OS === 'ios') {
        localStore.share();
      } else {
        localStore.show();
      }
    },
    share() {
      ShareService.share(entity.text, MINDS_URI + 'newsfeed/' + entity.guid);
    },
    show() {
      localStore.showMenu = true;
    },
    hide() {
      localStore.showMenu = false;
    },
    async sendTo() {
      try {
        const installed = await SendIntentAndroid.isAppInstalled(
          ANDROID_CHAT_APP,
        );
        if (installed) {
          SendIntentAndroid.sendText({
            title: '',
            text: MINDS_URI + 'newsfeed/' + entity.guid,
            type: SendIntentAndroid.TEXT_PLAIN,
            package: ANDROID_CHAT_APP,
          });
        } else {
          Linking.openURL('market://details?id=com.minds.chat');
        }
      } catch (error) {
        logService.exception(error);
        console.log(error);
      }
    },
  }));

  const options: Array<Array<ItemType>> = React.useRef([
    [
      {
        title: i18n.t('sendTo'),
        onPress: () => {
          localStore.hide();
          localStore.sendTo();
        },
      },
      {
        title: i18n.t('share'),
        onPress: localStore.share,
      },
    ],
    [
      {
        title: i18n.t('cancel'),
        titleStyle: ThemedStyles.style.colorSecondaryText,
        onPress: localStore.hide,
      },
    ],
  ]).current;

  return (
    <>
      <IconButtonNext
        scale
        fill
        style={actionsContainerStyle}
        onPress={localStore.onPress}
        name="share"
        size="small"
      />
      <BottomButtonOptions
        list={options}
        isVisible={localStore.showMenu}
        onPressClose={localStore.hide}
      />
    </>
  );
});
