import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import i18n from '../../../common/services/i18n.service';
import withPreventDoubleTap from '../../../common/components/PreventDoubleTap';
import FastImage from 'react-native-fast-image';
import UserModel from '../../../channel/UserModel';
import sessionService from '../../../common/services/session.service';
import friendlyDateDiff from '../../../common/helpers/friendlyDateDiff';
import {
  bodyTextImportantStyle,
  bodyTextStyle,
  containerStyle,
  styles,
} from './styles';
import NotificationIcon from './content/NotificationIcon';
import ContentPreview from './content/ContentPreview';
import useNotificationRouter from './useNotificationRouter';
import Merged from './content/Merged';
import type Notification from './NotificationModel';

type PropsType = {
  notification: Notification;
};
const DebouncedTouchableOpacity = withPreventDoubleTap(TouchableOpacity);

const NotificationItem = ({ notification }: PropsType) => {
  const fromUser = UserModel.create(notification.from);
  const avatarSrc = fromUser.getAvatarSource();
  const router = useNotificationRouter(notification);

  if (!notification.isOfNotificationType()) {
    return null;
  }

  const navToFromChannel = () => router.navToChannel(fromUser);

  const Noun =
    notification.Noun !== '' ? (
      <Text style={bodyTextImportantStyle} onPress={router.navToEntity}>
        {' ' + notification.Noun}
      </Text>
    ) : null;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={
        notification.type === 'subscribe'
          ? navToFromChannel
          : router.navToEntity
      }>
      <View style={styles.innerContainer}>
        <View style={styles.avatarContainer}>
          {
            //@ts-ignore
            <DebouncedTouchableOpacity onPress={navToFromChannel}>
              <FastImage source={avatarSrc} style={styles.avatar} />
            </DebouncedTouchableOpacity>
          }

          <NotificationIcon type={notification.type} />
        </View>
        <View style={styles.bodyContainer}>
          <Text style={bodyTextStyle}>
            {notification.type !== 'token_rewards_summary' && (
              <Text style={bodyTextImportantStyle} onPress={navToFromChannel}>
                {fromUser.name + ' '}
              </Text>
            )}
            <Merged notification={notification} router={router} />
            {notification.Verb}
            {notification.Pronoun}
            {Noun}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={bodyTextStyle}>
            {friendlyDateDiff(notification.created_timestamp * 1000, '', false)}
          </Text>
          {notification.read === false && <View style={styles.readIndicator} />}
        </View>
      </View>
      <ContentPreview
        notification={notification}
        navigation={router.navigation}
      />
    </TouchableOpacity>
  );
};

export default NotificationItem;
