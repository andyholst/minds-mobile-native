import React, { FC, useEffect, useRef } from 'react';
import FeedList from '~/common/components/FeedList';
import i18nService from '~/common/services/i18n.service';
import FeedStore from '~/common/stores/FeedStore';
import Topbar from '~/topbar/Topbar';

const TopNewsfeedScreen: FC<any> = ({ navigation }) => {
  const feedStore = useTopFeed();
  return (
    <>
      <Topbar
        navigation={navigation}
        title={i18nService.t('newsfeed.topPosts')}
        showBack
      />
      <FeedList feedStore={feedStore} navigation={navigation} />
    </>
  );
};

const useTopFeed = () => {
  const feedStore = useRef(
    new FeedStore(true)
      .setEndpoint('api/v3/newsfeed/feed/unseen-top')
      .setInjectBoost(true)
      .setLimit(12),
  ).current;

  useEffect(() => {
    feedStore.getMetadataService()!.setSource('top-feed').setMedium('feed');
    feedStore.fetch(false, true);
  });

  return feedStore;
};

export default TopNewsfeedScreen;
