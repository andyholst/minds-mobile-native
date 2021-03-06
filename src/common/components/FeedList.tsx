import React, { Component } from 'react';
import {
  FlatList,
  View,
  StyleProp,
  ViewStyle,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { observer } from 'mobx-react';
import Activity from '../../newsfeed/activity/Activity';
import TileElement from '../../newsfeed/TileElement';
import { ComponentsStyle } from '../../styles/Components';
import ErrorLoading from './ErrorLoading';
import ErrorBoundary from './ErrorBoundary';
import i18n from '../services/i18n.service';
import ThemedStyles from '../../styles/ThemedStyles';
import type FeedStore from '../stores/FeedStore';
import type ActivityModel from '../../newsfeed/ActivityModel';
import ActivityIndicator from './ActivityIndicator';
import MText from './MText';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

export interface InjectItemComponentProps {
  index: number;
}

/**
 * an item to be injected in feed
 */
export interface InjectItem {
  /**
   * the indexes in the feed this item should be inserted
   */
  indexes: number[];
  /**
   * the component to render
   */
  component: (props: InjectItemComponentProps) => React.ReactNode;
}

const itemHeight = Dimensions.get('window').width / 3;

type PropsType = {
  prepend?: React.ReactNode;
  feedStore: FeedStore;
  renderTileActivity?: Function;
  renderActivity?: Function;
  emptyMessage?: React.ReactNode;
  header?: React.ReactNode;
  listComponent?: React.ComponentType;
  navigation: any;
  style?: StyleProp<ViewStyle>;
  hideItems?: boolean;
  stickyHeaderHiddenOnScroll?: boolean;
  stickyHeaderIndices?: number[];
  ListEmptyComponent?: React.ReactNode;
  /**
   * a function to call on refresh. this replaces the feedList default refresh function
   */
  onRefresh?: () => Promise<any>;
  /**
   * refreshing state. overwrites the feedList's refreshing
   */
  refreshing?: Boolean;
  onScrollBeginDrag?: () => void;
  onMomentumScrollEnd?: () => void;
  afterRefresh?: () => void;
  onScroll?: (e: any) => void;
  refreshControlTintColor?: string;
  insets?: any;
  onEndReached?: () => void;
  /**
   * a list of items to inject at various positions in the feed
   */
  injectItems?: InjectItem[];
};

/**
 * News feed list component
 */
@observer
export class FeedList<T> extends Component<PropsType> {
  listRef?: FlatList<T>;
  cantShowActivity: string = '';
  viewOpts = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  };

  /**
   * Constructor
   */
  constructor(props) {
    super(props);
    this.cantShowActivity = i18n.t('errorShowActivity');
  }

  /**
   * Scroll to top
   * @param {boolean} animated
   */
  scrollToTop(animated = true) {
    if (this.listRef) {
      this.listRef.scrollToOffset({ animated, offset: 0 });
    }
  }

  /**
   * moves scroll offset up and down
   **/
  wiggle() {
    const DISTANCE = 25;
    const currentScrollOffset = this.props.feedStore.scrollOffset;

    this.listRef?.scrollToOffset({
      animated: true,
      offset: currentScrollOffset - DISTANCE,
    });
    setTimeout(() => {
      this.listRef?.scrollToOffset({
        animated: true,
        offset: currentScrollOffset,
      });
    }, 150);
  }

  /**
   * Set list reference
   */
  setListRef = (r: FlatList<T> | undefined) => (this.listRef = r);

  onScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    this.props.feedStore.scrollOffset = e.nativeEvent.contentOffset.y;

    this.props.onScroll?.(e);
  };

  get empty(): React.ReactNode {
    if (this.props.feedStore.loaded && !this.props.feedStore.refreshing) {
      if (this.props.emptyMessage) {
        return this.props.emptyMessage;
      } else {
        return (
          <View style={ComponentsStyle.emptyComponentContainer}>
            <View style={ComponentsStyle.emptyComponent}>
              <MText style={ComponentsStyle.emptyComponentMessage}>
                {i18n.t('newsfeed.empty')}
              </MText>
            </View>
          </View>
        );
      }
    }
    return null;
  }

  /**
   * Render component
   */
  render() {
    let renderRow: Function;

    const {
      feedStore,
      renderTileActivity,
      renderActivity,
      header,
      listComponent,
      insets,
      ...passThroughProps
    } = this.props;

    const ListComponent: React.ComponentType<any> = listComponent || FlatList;

    if (feedStore.isTiled) {
      renderRow = renderTileActivity || this.renderTileActivity;
    } else {
      renderRow = renderActivity || this.renderActivity;
    }

    const items: Array<ActivityModel | { urn: string }> = !this.props.hideItems
      ? feedStore.entities.slice()
      : [];

    // We prepend a null value used to render the prepend component always with the same key (to avoid unmounting/mounting)
    if (this.props.prepend) {
      items.unshift({ urn: 'prepend' });
    }

    return (
      <ListComponent
        containerStyle={ThemedStyles.style.paddingBottom10x}
        ref={this.setListRef}
        key={feedStore.isTiled ? 't' : 'f'}
        ListHeaderComponent={header}
        ListFooterComponent={this.getFooter}
        data={items}
        renderItem={renderRow}
        keyExtractor={this.keyExtractor}
        onRefresh={this.refresh}
        refreshing={this.refreshing}
        onEndReached={this.loadMore}
        refreshControl={
          <RefreshControl
            tintColor={this.props.refreshControlTintColor}
            refreshing={this.refreshing}
            onRefresh={this.refresh}
            progressViewOffset={(insets?.top || 0) / 1.25}
          />
        }
        onEndReachedThreshold={0.2}
        numColumns={feedStore.isTiled ? 3 : 1}
        style={style}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={9}
        // removeClippedSubviews={true}
        ListEmptyComponent={!this.props.hideItems ? this.empty : null}
        viewabilityConfig={this.viewOpts}
        onViewableItemsChanged={this.onViewableItemsChanged}
        keyboardShouldPersistTaps="always"
        testID="feedlistCMP"
        {...passThroughProps}
        keyboardDismissMode="on-drag"
        onScroll={this.onScroll}
      />
    );
  }

  /**
   * Key extractor for list items
   */
  keyExtractor = (item: { boosted: any; urn: any }, index: any) => {
    return item.boosted ? `${item.urn}:${index}` : item.urn;
  };

  /**
   * Get footer
   */
  getFooter = () => {
    if (this.props.feedStore.loading && !this.props.feedStore.refreshing) {
      return (
        <View style={footerStyle} testID="ActivityIndicatorView">
          <ActivityIndicator size={'large'} />
        </View>
      );
    }
    if (this.props.feedStore.errorLoading) {
      return this.getErrorLoading();
    }
    return null;
  };

  /**
   * Get error loading component
   */
  getErrorLoading() {
    const message = this.props.feedStore.entities.length
      ? i18n.t('cantLoadMore')
      : i18n.t('cantLoad');

    return <ErrorLoading message={message} tryAgain={this.loadFeedForce} />;
  }

  /**
   * On viewable item changed
   */
  onViewableItemsChanged = (change: {
    viewableItems: any[];
    changed: any[];
  }) => {
    change.viewableItems.forEach((item: { item: any }) => {
      if (item && item.item && item.item.sendViewed) item.item.sendViewed();
    });
    change.changed.forEach(
      (c: { item: { setVisible: (arg0: any) => void }; isViewable: any }) => {
        if (c.item.setVisible) {
          c.item.setVisible(c.isViewable);
        }
      },
    );
  };

  /**
   * Load feed data
   */
  loadMore = () => {
    if (this.props.feedStore.errorLoading) return;
    this.props.feedStore.loadMore();
  };

  /**
   * Force feed load
   */
  loadFeedForce = () => {
    this.props.feedStore.reload();
  };

  /**
   * Refresh feed data
   */
  refresh = async () => {
    if (this.props.onRefresh) {
      await this.props.onRefresh();
    } else {
      await this.props.feedStore.refresh();
    }

    if (this.props.afterRefresh) {
      this.props.afterRefresh();
    }
  };

  /**
   * returns refreshing based on props or feedStore
   */
  get refreshing() {
    return typeof this.props.refreshing === 'boolean'
      ? this.props.refreshing
      : this.props.feedStore.refreshing;
  }

  /**
   * Render activity
   */
  renderActivity = (row: { index: number; item: ActivityModel }) => {
    const entity = row.item;

    return row.index === 0 && this.props.prepend ? (
      <>
        {this.props.prepend}
        {this.props.feedStore.entities.length === 0 && this.empty}
      </>
    ) : (
      <ErrorBoundary
        message={this.cantShowActivity}
        containerStyle={ThemedStyles.style.borderBottomHair}>
        <Activity
          entity={entity}
          navigation={this.props.navigation}
          autoHeight={false}
        />
        {this.props.injectItems
          ?.find(p => p?.indexes.includes(row.index))
          ?.component?.({ index: row.index })}
      </ErrorBoundary>
    );
  };

  /**
   * Render tile
   */
  renderTileActivity = (row: { item: any }) => {
    const entity = row.item;
    return (
      <TileElement
        size={itemHeight}
        entity={entity}
        navigation={this.props.navigation}
      />
    );
  };
}

const style = ThemedStyles.combine('flexContainer', 'bgPrimaryBackground');

const footerStyle = ThemedStyles.combine('centered', 'padding3x');

export default withSafeAreaInsets<PropsType>(FeedList);
