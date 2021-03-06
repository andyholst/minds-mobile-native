import React, { useRef } from 'react';
import ThemedStyles from '../../../../styles/ThemedStyles';
import type { WalletStoreType } from '../../../v2/createWalletStore';
import { Tooltip } from 'react-native-elements';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useDimensions } from '@react-native-community/hooks';
import BalanceInfo from './BalanceInfo';
import OnchainButton from './OnchainButton';
import TokenTabOptions from './TokenTabOptions';
import MindsTokens from '../MindsTokens';
import { Row, Spacer } from '~ui';

type PropsType = {
  walletStore: WalletStoreType;
  connectWallet: any;
  onchainStore: any;
};

const TokenTopBar = ({
  walletStore,
  connectWallet,
  onchainStore,
}: PropsType) => {
  const theme = ThemedStyles.style;
  const tooltipRef = useRef<any>();
  const screen = useDimensions().screen;
  return (
    <Spacer horizontal="M" bottom="XXL">
      <Row bottom="S">
        <Tooltip
          ref={tooltipRef}
          closeOnlyOnBackdropPress={true}
          skipAndroidStatusBar={true}
          toggleOnPress={false}
          withOverlay={true}
          overlayColor={'#00000015'}
          containerStyle={theme.borderRadius}
          width={screen.width - 20}
          height={200}
          backgroundColor={ThemedStyles.getColor('SecondaryBackground')}
          popover={<BalanceInfo walletStore={walletStore} />}>
          <TouchableOpacity
            style={[theme.bgPrimaryBorder, styles.touchable]}
            onPress={() => tooltipRef.current.toggleTooltip()}>
            <MindsTokens
              mindsPrice={walletStore.prices.minds}
              value={walletStore.balance.toString()}
              containerStyle={styles.minds}
            />
          </TouchableOpacity>
        </Tooltip>
        <TokenTabOptions
          onchainStore={onchainStore}
          walletStore={walletStore}
        />
      </Row>
      <Row align="centerStart">
        <OnchainButton
          walletStore={walletStore}
          onPress={connectWallet}
          onchainStore={onchainStore}
        />
      </Row>
    </Spacer>
  );
};

const styles = StyleSheet.create({
  minds: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  touchable: {
    borderRadius: 20,
  },
});

export default TokenTopBar;
