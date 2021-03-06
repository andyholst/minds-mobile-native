import newsfeed from '../../newsfeed/NewsfeedStore';
import boost from '../../boost/BoostStore';
import user from '../../auth/UserStore';
import blogs from '../../blogs/BlogsStore';
import wire from '../../wire/WireStore';
import groups from '../../groups/GroupsStore';
import groupView from '../../groups/GroupViewStore';
import channelSubscribersStore from '../../channel/subscribers/ChannelSubscribersStore';
import hashtag from '../../common/stores/HashtagStore';
import SubscriptionRequestStore from '../../channel/subscription/SubscriptionRequestStore';
import reportStore from '../../report/ReportStore';
import wallet from '../../wallet/WalletStore';

import sessionService from '../services/session.service';
import logService from '../services/log.service';
import DiscoveryV2Store from '../../discovery/v2/DiscoveryV2Store';

/**
 * This is initialized by /src/AppStores.ts and uses MobXProviderContext
 * to pass through to the `inject` pattern or `useLegacyStores`
 */
export function createClassStores() {
  const stores = {
    subscriptionRequest: new SubscriptionRequestStore(),
    newsfeed: new newsfeed(),
    user: new user(),
    blogs: new blogs(),
    wire: new wire(),
    boost: new boost(),
    groups: new groups(),
    groupView: new groupView(),
    channelSubscribersStore: new channelSubscribersStore(),
    hashtag: new hashtag(),
    reportstore: new reportStore(),
    discoveryV2Store: new DiscoveryV2Store(),
    mindsPlusV2Store: new DiscoveryV2Store(true),
    wallet: new wallet(),
  };
  sessionService.onLogout(() => {
    for (const id in stores) {
      if (stores[id].reset) {
        logService.info(`Reseting legacy store ${id}`);
        stores[id].reset();
      }
    }
  });
  return stores;
}

export type TLegacyStores = ReturnType<typeof createClassStores>;
