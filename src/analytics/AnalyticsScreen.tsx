import { observer } from 'mobx-react';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import TopbarTabbar from '../common/components/topbar-tabbar/TopbarTabbar';
import i18n from '../common/services/i18n.service';
import ThemedStyles from '../styles/ThemedStyles';
import DashboardTab from './tabs/dashboard/DashboardTab';
import TokensTab from './tabs/tokens/TokensTab';
import TrendingTab from './tabs/trending/TrendingTab';

type TAnalyticsTabs =
  | 'earnings'
  | 'engagement'
  | 'traffic'
  | 'trending'
  | 'token';

interface AnalyticsScreenProps {
  navigation: any;
  route: any;
}

const AnalyticsScreen = observer(
  ({ navigation, route }: AnalyticsScreenProps) => {
    const theme = ThemedStyles.style;
    const [activeTabId, setActiveTabId] = useState<TAnalyticsTabs>('token');
    const _onTabBarChange = useCallback(
      (id: string) => setActiveTabId(id as TAnalyticsTabs),
      [],
    );
    React.useEffect(() => {
      if (route.params && route.params.type) {
        _onTabBarChange(route.params.type as TAnalyticsTabs);
      }
    }, [_onTabBarChange, route]);

    const screen = () => {
      switch (activeTabId) {
        case 'earnings':
          return (
            <DashboardTab
              key={'earnings'}
              url={'api/v2/analytics/dashboards/earnings'}
              defaultMetric={'earnings_total'}
            />
          );
        case 'engagement':
          return (
            <DashboardTab
              key={'engagement'}
              url={'api/v2/analytics/dashboards/engagement'}
              defaultMetric={'votes_up'}
            />
          );
        case 'traffic':
          return (
            <DashboardTab
              key={'traffic'}
              url={'api/v2/analytics/dashboards/traffic'}
              defaultMetric={'page_views'}
            />
          );
        case 'trending':
          return <TrendingTab navigation={navigation} />;
        case 'token':
          return <TokensTab route={route} />;
        default:
          return <View />;
      }
    };

    return (
      <View style={theme.flexContainer}>
        <Text style={title}>{i18n.t('analytics.title')}</Text>
        <TopbarTabbar
          current={activeTabId}
          onChange={_onTabBarChange}
          tabs={[
            { id: 'traffic', title: i18n.t('analytics.traffic') },
            { id: 'token', title: i18n.t('analytics.tokens.title') },
            { id: 'engagement', title: i18n.t('analytics.engagement') },
            { id: 'earnings', title: i18n.t('analytics.earnings') },
            { id: 'trending', title: i18n.t('analytics.trending.title') },
          ]}
        />
        <View style={theme.centered}>{screen()}</View>
      </View>
    );
  },
);

const title = ThemedStyles.combine('padding4x', 'titleText', 'paddingBottom2x');

export default AnalyticsScreen;
