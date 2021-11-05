import React, { useCallback } from 'react';
import i18n from '../../../common/services/i18n.service';
import UserModel from '../../UserModel';
import { observer } from 'mobx-react';
import { Alert } from 'react-native';
import { Button, withSpacer } from '~ui';

const Subscribe = (props: { channel: UserModel; testID?: string }) => {
  const { channel } = props;

  const subscriptionText = channel.subscribed
    ? i18n.t('channel.subscribed')
    : i18n.t('channel.subscribe');

  const onSubscriptionPress = useCallback(() => {
    if (channel.subscribed) {
      Alert.alert(i18n.t('attention'), i18n.t('channel.confirmUnsubscribe'), [
        {
          text: i18n.t('yesImSure'),
          onPress: () => channel.toggleSubscription(),
        },
        { text: i18n.t('no') },
      ]);
    } else {
      return channel.toggleSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.subscribed, channel.toggleSubscription]);

  return (
    <>
      <Button
        mode="outline"
        type={channel.subscribed ? 'base' : 'action'}
        size="small"
        onPress={onSubscriptionPress}
        testID={props.testID}>
        {subscriptionText}
      </Button>
    </>
  );
};

export default withSpacer(observer(Subscribe));
