import { observer } from 'mobx-react';
import React from 'react';
import CenteredLoading from '../../../../common/components/CenteredLoading';
import DatePicker from '../../../../common/components/controls/DatePicker';
import MText from '../../../../common/components/MText';
import i18n from '../../../../common/services/i18n.service';
import ThemedStyles from '../../../../styles/ThemedStyles';
import { WalletStoreType } from '../../../v2/createWalletStore';
import { TokensTabStore } from './createTokensTabStore';
import MindsScores from './MindsScores';
import Payout from './Payout';

type PropsType = {
  walletStore: WalletStoreType;
  store: TokensTabStore;
};

const TokensRewards = observer(({ walletStore, store }: PropsType) => {
  const theme = ThemedStyles.style;

  if (!store.rewards || !store.rewards.total) {
    return (
      <MText style={[theme.fontXL, theme.centered, theme.padding5x]}>
        {i18n.t('discovery.nothingToShow')}
      </MText>
    );
  }

  return (
    <>
      <DatePicker
        onConfirm={store.onConfirm}
        maximumDate={new Date()}
        date={store.rewardsSelectedDate}
      />
      {store.loading ? (
        <CenteredLoading />
      ) : (
        <>
          <Payout
            minds={store.rewards.total.daily}
            mindsPrice={walletStore.prices.minds}
            isToday={store.isToday}
            store={store}
          />
          <MindsScores store={store} prices={walletStore.prices} />
        </>
      )}
    </>
  );
});

export default TokensRewards;
