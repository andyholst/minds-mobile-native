import React, { ReactElement, useRef } from 'react';
import {
  WithdrawalItemPropsType,
  WithdrawalStatus,
} from './TransactionsListWithdrawalTypes';
import { Linking, Text, View } from 'react-native';
import ThemedStyles from '../../../../../styles/ThemedStyles';
import formatDate from '../../../../../common/helpers/date';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { Tooltip } from 'react-native-elements';

/**
 * Individual withdrawal row
 */
const WithdrawalEntry = ({ withdrawal }: WithdrawalItemPropsType) => {
  const theme = ThemedStyles.style;

  const tooltipRef = useRef<any>();

  const outerContainerStyle = ThemedStyles.combine(
    'flexContainer',
    'fullWidth',
    'rowJustifySpaceBetween',
  );

  const innerColumnStyle = ThemedStyles.combine(
    'flexColumn',
    'padding3x',
    'justifyCenter',
  );

  const launchButtonContainerStyle = ThemedStyles.combine(
    'flexContainer',
    'fullWidth',
    'rowJustifyStart',
    'alignCenter',
    { flexWrap: 'nowrap' },
  );

  const tooltipViewStyle = ThemedStyles.combine(
    'flexContainer',
    'fullWidth',
    'rowJustifyCenter',
    'alignCenter',
    'bgPrimaryBackground',
  );

  const inlineIconStyle = ThemedStyles.combine('colorWhite', 'marginLeft1x');

  /**
   * Truncates middle of address e.g. 0xd...10a
   * @param { string } address - address to truncate.
   * @returns { string } truncated address.
   */
  const truncateAddress = (address: string): string => {
    if (!address) {
      return '';
    }
    return address.substr(0, 3) + '...' + address.substr(-3);
  };

  /**
   * Converts gwei values to whole tokens.
   * @param { number } amount - amount in gwei.
   * @returns { number } amount in whole units.
   */
  const gweiToWholeTokens = (amount: number): number => {
    return amount / 1000000000000000000;
  };

  /**
   * Gets human readable version of a given withdrawal status.
   * @param { WithdrawalStatus } - valid withdrawal status.
   * @returns { string } - human readable version for user display.
   */
  const getHumanReadableStatus = (status: WithdrawalStatus): string => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'pending_review':
        return 'In Review';
      case 'failed':
        return 'Failed';
      case 'rejected':
        return 'Rejected';
      default:
        return '';
    }
  };

  /**
   * Navigates to the etherscan link of a given transaction.
   * @param { string } address - eth address
   * @returns { void }
   */
  const navigateToEtherscan = (address: string): void => {
    Linking.openURL(`https://etherscan.com/tx/${address}`);
  };

  /**
   * Component for the display of transaction addresses with a "launch button"
   * @param { { address: string } } object containing string eth address.
   * @returns { ReactElement }
   */
  const TransactionAddress = (props: { address: string }): ReactElement => {
    return (
      <TouchableOpacity
        style={launchButtonContainerStyle}
        onPress={() => navigateToEtherscan(props.address)}>
        <Text>{truncateAddress(withdrawal.tx)}</Text>
        <Icon name={'launch'} size={15} style={inlineIconStyle} />
      </TouchableOpacity>
    );
  };

  /**
   * Component for internal tooltip text.
   * @param { { status: WithdrawalStatus } } object containing withdrawal status in status variable.
   * @returns { ReactElement }
   */
  const TooltipText = (props: { status: WithdrawalStatus }): ReactElement => {
    let text = '';
    switch (props.status) {
      case 'approved':
        text = 'We’ve successfully paid out your withdrawal.';
        break;
      case 'pending':
        text = 'Awaiting confirmation on blockchain';
        break;
      case 'pending_review':
        text = 'Your transaction is in the queue and we’ll get to it ASAP.';
        break;
      case 'failed':
        text = 'Something went wrong on the blockchain. Please resubmit.';
        break;
      case 'rejected':
        text =
          'Following review your tokens are not available for withdrawl. TOS violation.';
        break;
    }
    return <Text style={theme.colorWhite}>{text}</Text>;
  };

  return (
    <View style={outerContainerStyle}>
      <View style={innerColumnStyle}>
        <TransactionAddress address={withdrawal.tx} />
        <Text style={theme.colorSecondaryText}>
          {formatDate(withdrawal.timestamp, 'date')}
        </Text>
      </View>
      <View style={innerColumnStyle}>
        <Text>
          {gweiToWholeTokens(withdrawal.amount)}{' '}
          <Text style={theme.colorSecondaryText}>MINDS</Text>
        </Text>
      </View>
      <View style={innerColumnStyle}>
        <TouchableOpacity onPress={() => tooltipRef.current.toggleTooltip()}>
          <Tooltip
            ref={tooltipRef}
            skipAndroidStatusBar={true}
            withOverlay={false}
            containerStyle={theme.borderRadius}
            width={250}
            height={100}
            backgroundColor={ThemedStyles.getColor('Link')}
            popover={<TooltipText status={withdrawal.status} />}
          />
          <View style={tooltipViewStyle}>
            <Text>{getHumanReadableStatus(withdrawal.status)}</Text>
            <Icon
              name={'information-variant'}
              size={15}
              style={inlineIconStyle}
            />
          </View>
        </TouchableOpacity>
        {withdrawal.completed_tx && (
          <TransactionAddress address={withdrawal.tx} />
        )}
      </View>
    </View>
  );
};

export default React.memo(WithdrawalEntry);
