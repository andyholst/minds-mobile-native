import React from 'react';
import { observer } from 'mobx-react';
import { View, Text, FlatList, ViewToken } from 'react-native';
import ThemedStyles from '../../styles/ThemedStyles';
import NotificationsTopBar from './NotificationsTopBar';
import { useFocusEffect } from '@react-navigation/native';
import useApiFetch from '../../common/hooks/useApiFetch';
import i18n from '../../common/services/i18n.service';
import NotificationItem from './notification/Notification';
import { useStores } from '../../common/hooks/use-stores';
import ErrorBoundary from '../../common/components/ErrorBoundary';
import NotificationModel from './notification/NotificationModel';

type PropsType = {};

const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 300,
  waitForInteraction: false,
};

type NotificationList = {
  status: string;
  notifications: NotificationModel[];
  'load-next': string;
};

const NotificationsScreen = observer(({}: PropsType) => {
  const theme = ThemedStyles.style;
  const { notifications } = useStores();
  const {
    result,
    error,
    loading,
    fetch,
    setResult,
  } = useApiFetch<NotificationList>('api/v3/notifications/list', {
    params: {
      filter: notifications.filter,
      limit: 15,
      offset: notifications.offset,
    },
    updateState: (newData: NotificationList, oldData: NotificationList) => {
      newData.notifications = NotificationModel.createMany(
        newData.notifications,
      );
      return {
        ...newData,
        notifications: [
          ...(oldData ? oldData.notifications : []),
          ...newData.notifications,
        ],
      } as NotificationList;
    },
    persist: true,
  });

  const onFetchMore = () => {
    !loading &&
      result &&
      result['load-next'] &&
      notifications.setOffset(result['load-next']);
  };

  const refresh = React.useCallback(() => {
    notifications.setOffset('');
    setResult(null);
    fetch();
  }, [fetch, setResult, notifications]);

  useFocusEffect(
    React.useCallback(() => {
      if (notifications.unread > 0 && !loading) {
        refresh();
      }
    }, []),
  );

  const onViewableItemsChanged = React.useCallback(
    (viewableItems: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      viewableItems.viewableItems.forEach(
        (item: { item: NotificationModel }) => {
          if (!item.item.read) {
            item.item.read = true;
            notifications.markAsRead(item.item);
          }
        },
      );
    },
    [notifications],
  );

  if (error && !loading) {
    return (
      <Text
        style={[
          theme.colorSecondaryText,
          theme.textCenter,
          theme.fontL,
          theme.marginVertical4x,
        ]}
        onPress={() => fetch()}>
        {i18n.t('error') + '\n'}
        <Text style={theme.colorLink}>{i18n.t('tryAgain')}</Text>
      </Text>
    );
  }

  const data = result?.notifications || [];

  return (
    <View style={theme.flexContainer}>
      <FlatList
        data={data.slice()}
        ListHeaderComponent={
          <NotificationsTopBar store={notifications} setResult={setResult} />
        }
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={onFetchMore}
        onRefresh={refresh}
        refreshing={loading}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
});

const keyExtractor = (item: NotificationModel, index) => `${item.urn}-${index}`;

const renderItem = (row: any): React.ReactElement => {
  const notification = row.item;

  return (
    <ErrorBoundary
      message="Can't show this notification"
      containerStyle={ThemedStyles.style.borderBottomHair}>
      <NotificationItem notification={notification} />
    </ErrorBoundary>
  );
};

export default NotificationsScreen;
