import React, { useCallback, useEffect, useRef } from 'react';
import { observer, useLocalStore } from 'mobx-react';
import { Platform, Text, View } from 'react-native';
import ThemedStyles, {
  useMemoStyle,
  useStyle,
} from '../../../styles/ThemedStyles';
import capitalize from '../../../common/helpers/capitalize';
import StripeCardSelector from '../../methods/v2/StripeCardSelector';
import Switch from 'react-native-switch-pro';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/NavigationTypes';
import Button from '../../../common/components/Button';
import i18n from '../../../common/services/i18n.service';
import { UserError } from '../../../common/UserError';
import supportTiersService from '../../../common/services/support-tiers.service';
import type { SupportTiersType } from '../../WireTypes';
import UserModel from '../../../channel/UserModel';
import { DotIndicator } from 'react-native-reanimated-indicators';
import Selector from '../../../common/components/SelectorV2';
import MenuItem, {
  MenuItemItem,
} from '../../../common/components/menus/MenuItem';
import { showNotification } from '../../../../AppMessages';
import WireStore from '../../WireStore';

const isIos = Platform.OS === 'ios';

type payMethod = 'tokens' | 'usd';
type JoinMembershipScreenRouteProp = RouteProp<
  RootStackParamList,
  'JoinMembershipScreen'
>;
type JoinMembershipScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'JoinMembershipScreen'
>;

type PropsType = {
  route: JoinMembershipScreenRouteProp;
  navigation: JoinMembershipScreenNavigationProp;
  tiers?: Array<SupportTiersType>;
};

const selectValueExtractor = item => item.name;
const selectIdExtractor = item => item.urn;

const createJoinMembershipStore = ({ tiers }) => ({
  wire: new WireStore(),
  user: null as UserModel | null,
  card: '' as any,
  currentTier: tiers ? tiers[0] : (null as SupportTiersType | null),
  list: (tiers || []) as Array<SupportTiersType>,
  payMethod: 'tokens' as payMethod,
  loading: false,
  loadingData: !tiers,
  get currentItem(): MenuItemItem {
    return {
      title: this.currentTier ? capitalize(this.currentTier.name) : '',
      icon: { name: 'chevron-down', type: 'material-community' },
    };
  },
  setUser(user: UserModel) {
    this.user = user;
  },
  setCurrent(tier: SupportTiersType, isInitial = false) {
    this.currentTier = tier;
    if (isInitial) {
      this.payMethod = !isIos && tier.has_usd ? 'usd' : 'tokens';
    }
  },
  async loadList() {
    if (!this.user) {
      return;
    }
    this.setLoadingData(true);
    try {
      const response = await supportTiersService.getAllFromGuid(this.user.guid);
      this.list = response as Array<SupportTiersType>;

      if (!this.currentTier && this.list[0]) {
        this.setCurrent(this.list[0], true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoadingData(false);
    }
  },
  setLoading(loading: boolean) {
    this.loading = loading;
  },
  setLoadingData(loading: boolean) {
    this.loadingData = loading;
  },
  setPayMethod() {
    this.payMethod = this.payMethod === 'usd' ? 'tokens' : 'usd';
  },
  setCard(card: any) {
    this.card = card;
  },
});

const JoinMembershipScreen = observer(({ route, navigation }: PropsType) => {
  const theme = ThemedStyles.style;
  const switchTextStyle = [styles.switchText, theme.colorPrimaryText];
  const tiers = route.params ? route.params.tiers : undefined;
  const selectorRef = useRef<any>(null);
  const { onComplete } = route.params;
  /**
   * TODO
   * Get amounts
   * (new) Disable switch if tokens not valid payment
   * show input if tokens is selected payment
   */
  const store = useLocalStore(createJoinMembershipStore, { tiers });

  useEffect(() => {
    const { entity, user } = route.params;

    if (entity) {
      const support_tier: SupportTiersType | null =
        entity.wire_threshold && 'support_tier' in entity.wire_threshold
          ? entity.wire_threshold.support_tier
          : null;
      if (support_tier) {
        store.setCurrent(support_tier, true);
      }
      store.setUser(entity.ownerObj);
    } else if (user) {
      store.setUser(user);
    }
    // load tiers if they are not in params
    if (!tiers || tiers.length === 0) {
      store.loadList();
    }
  }, [route.params, store, tiers]);

  const complete = useCallback(() => {
    store.setLoading(false);
    if (onComplete && typeof onComplete === 'function') {
      onComplete();
    }
    navigation.goBack();
  }, [navigation, onComplete, store]);

  const openSelector = useCallback(() => {
    if (store.currentTier) {
      selectorRef.current?.show(store.currentTier.urn);
    }
  }, [store]);

  const payWithUsd = useCallback(async () => {
    if (!store.currentTier) {
      return;
    }
    try {
      if (store.currentTier.usd === '0') {
        complete();
      }
      store.wire.setAmount(parseFloat(store.currentTier.usd));
      store.wire.setCurrency('usd');
      store.wire.setOwner(store.user);
      store.wire.setRecurring(store.currentTier.public);
      store.wire.setPaymentMethodId(store.card.id);
      const done = await store.wire.send();

      if (!done) {
        throw new UserError(i18n.t('boosts.errorPayment'));
      }

      complete();
    } catch (err) {
      console.log('payWithUsd err', err);
    } finally {
      store.setLoading(false);
    }
  }, [store, complete]);

  const payWithTokens = useCallback(async () => {
    if (!store.currentTier) {
      return;
    }
    try {
      if (store.currentTier.tokens === '0') {
        complete();
      }
      store.wire.setAmount(parseFloat(store.currentTier.tokens));
      store.wire.setCurrency('tokens');
      store.wire.setOwner(store.user);
      store.wire.setRecurring(store.currentTier.public);
      const done = await store.wire.send();
      if (!done) {
        throw new UserError(i18n.t('boosts.errorPayment'));
      }
      setTimeout(complete, 500);
    } catch (err) {
      console.log('payWithTokens err', err);
    } finally {
      store.setLoading(false);
    }
  }, [complete, store]);

  const confirmSend = useCallback(async () => {
    if (!store.currentTier) {
      return;
    }
    store.setLoading(true);
    if (store.payMethod === 'usd') {
      if (!store.currentTier.has_usd) {
        store.setLoading(false);
        showNotification(i18n.t('membership.noUSD'));
      } else {
        payWithUsd();
      }
    }
    if (store.payMethod === 'tokens') {
      if (!store.currentTier.has_tokens) {
        store.setLoading(false);
        showNotification(i18n.t('membership.noTokens'));
      } else {
        payWithTokens();
      }
    }
  }, [store, payWithTokens, payWithUsd]);

  let costText;
  if (store.payMethod === 'usd') {
    if (store.currentTier?.has_usd) {
      costText = (
        <Text style={styles.costTextStyle}>
          <Text
            style={theme.colorPrimaryText}>{`$${store.currentTier.usd} `}</Text>
          per month
        </Text>
      );
    } else {
      costText = <Text style={styles.costTextStyle}>Doesn't accept USD</Text>;
    }
  }

  if (store.payMethod === 'tokens') {
    if (store.currentTier?.has_tokens) {
      costText = (
        <Text style={styles.costTextStyle}>
          <Text
            style={
              theme.colorPrimaryText
            }>{`${store.currentTier.tokens} Tokens `}</Text>
          per month
        </Text>
      );
    } else {
      costText = (
        <Text style={styles.costTextStyle}>Doesn't accept Tokens</Text>
      );
    }
  }

  const payText = store.currentTier?.public
    ? i18n.t('membership.join')
    : i18n.t('membership.pay');

  const item = store.currentItem;
  item.onPress = openSelector;

  return (
    <View>
      {!store.loadingData ? (
        <>
          {!isIos && (
            <View style={styles.headerContainer}>
              {store.currentTier?.public && (
                <Text style={styles.joinTitle}>Join a membership</Text>
              )}
              <View style={theme.flexContainer} />
              <Text style={switchTextStyle}>USD</Text>
              <Switch
                value={store.payMethod === 'tokens'}
                onSyncPress={store.setPayMethod}
                circleColorActive={ThemedStyles.getColor('SecondaryText')}
                circleColorInactive={ThemedStyles.getColor('SecondaryText')}
                backgroundActive={ThemedStyles.getColor('TertiaryBackground')}
                backgroundInactive={ThemedStyles.getColor('TertiaryBackground')}
                style={theme.marginHorizontal2x}
              />
              <Text style={switchTextStyle}>{'Tokens'}</Text>
            </View>
          )}
          <View style={theme.paddingTop4x}>
            {!!store.currentTier && <MenuItem item={store.currentItem} />}
          </View>
          <View style={theme.paddingHorizontal4x}>
            {!!store.currentTier?.description && (
              <View style={styles.descriptionWrapper}>
                <Text style={styles.descriptionText}>
                  {store.currentTier?.description}
                </Text>
              </View>
            )}
            {costText}
          </View>
          {store.payMethod === 'usd' &&
            store.currentTier &&
            store.currentTier.has_usd && (
              <View style={styles.stripeCardSelectorWrapper}>
                <StripeCardSelector onCardSelected={store.setCard} />
              </View>
            )}
          <View style={styles.alreadyAMemberWrapper}>
            <View
              style={useMemoStyle(
                [
                  store.currentTier?.subscription_urn
                    ? 'rowJustifySpaceBetween'
                    : 'rowJustifyEnd',
                  {
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  },
                ],
                [store.currentTier?.subscription_urn],
              )}>
              {!!store.currentTier?.subscription_urn && (
                <Text style={styles.alreadyAMemberText}>
                  {i18n.t('membership.alreadyMember')}
                </Text>
              )}
              <Button
                action
                onPress={confirmSend}
                text={payText}
                containerStyle={useMemoStyle(
                  [
                    'paddingVertical2x',
                    'marginHorizontal4x',
                    'alignSelfStretch',
                    store.currentTier?.subscription_urn
                      ? styles.disabled
                      : null,
                  ],
                  [store.currentTier?.subscription_urn],
                )}
                textStyle={useStyle('fontMedium', 'fontL')}
                loading={store.loading}
                disabled={!!store.currentTier?.subscription_urn}
              />
            </View>
          </View>
        </>
      ) : (
        <DotIndicator
          color={ThemedStyles.getColor('TertiaryText')}
          dotSize={10}
        />
      )}
      <Selector
        ref={selectorRef}
        onItemSelect={store.setCurrent}
        title={''}
        data={store.list}
        valueExtractor={selectValueExtractor}
        keyExtractor={selectIdExtractor}
        textStyle={theme.fontXXL}
        backdropOpacity={0.9}
      />
    </View>
  );
});

const styles = ThemedStyles.create({
  alreadyAMemberText: ['fontL', 'colorAlert'],
  alreadyAMemberWrapper: ['padding4x', 'marginTop2x'],
  stripeCardSelectorWrapper: ['marginTop6x', 'marginHorizontal3x'],
  headerContainer: [
    'rowJustifyCenter',
    'paddingHorizontal4x',
    'paddingTop4x',
    'alignCenter',
  ],
  costTextStyle: ['fontXL', 'colorSecondaryText', 'fontMedium', 'marginTop6x'],
  joinTitle: [
    'colorPrimaryText',
    {
      fontSize: 20,
      fontWeight: '800',
    },
  ],
  descriptionWrapper: [
    'marginTop6x',
    'paddingLeft2x',
    'bcolorTertiaryBackground',
    {
      borderLeftWidth: 5,
    },
  ],
  descriptionText: ['fontXL', 'colorPrimaryText'],
  disabled: {
    opacity: 0.5,
  },
  backIcon: {
    shadowOpacity: 0.4,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  container: {
    marginBottom: 10,
  },
  switchText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
  },
  costText: {
    fontFamily: 'Roboto-Medium',
    letterSpacing: 0,
  },
});

export default JoinMembershipScreen;