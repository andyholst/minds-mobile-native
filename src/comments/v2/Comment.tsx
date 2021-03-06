import React from 'react';
import { observer } from 'mobx-react';
import * as entities from 'entities';
// import ReadMore from 'react-native-read-more-text';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { TouchableOpacity } from '@gorhom/bottom-sheet';

import ReplyAction from '../ReplyAction';
import CommentHeader from './CommentHeader';
import type CommentModel from './CommentModel';
import type CommentsStore from './CommentsStore';
import CommentBottomMenu from './CommentBottomMenu';
import ThemedStyles from '../../styles/ThemedStyles';
import i18n from '../../common/services/i18n.service';
import { useNavigation } from '@react-navigation/native';
import ThumbUpAction from '../../newsfeed/activity/actions/ThumbUpAction';
import ThumbDownAction from '../../newsfeed/activity/actions/ThumbDownAction';
import MediaView from '../../common/components/MediaView';
import { LIGHT_THEME } from '../../styles/Colors';
import ReadMore from '../../common/components/ReadMore';
import Translate from '../../common/components/translate/Translate';
import MText from '../../common/components/MText';
import NavigationService from '~/navigation/NavigationService';

type PropsType = {
  comment: CommentModel;
  store: CommentsStore;
  hideReply?: boolean;
  isHeader?: boolean;
};

/**
 * Comment Component
 */
export default observer(function Comment(props: PropsType) {
  const navigation = useNavigation<any>();
  const translateRef = React.useRef<any>();
  const theme = ThemedStyles.style;

  const mature = props.comment.mature && !props.comment.mature_visibility;

  const canReply = props.comment.parent_guid_l2 && !props.hideReply;
  const backgroundColor = ThemedStyles.getColor(
    props.isHeader ? 'SecondaryBackground' : 'PrimaryBackground',
  );
  const startColor = (ThemedStyles.theme ? '#242A30' : '#F5F5F5') + '00';
  const endColor = backgroundColor + 'FF';

  const renderRevealedFooter = React.useCallback(
    handlePress => {
      return (
        <TouchableOpacity onPress={handlePress}>
          <MText
            style={[
              theme.fontL,
              theme.bold,
              theme.marginTop3x,
              theme.textCenter,
            ]}>
            {i18n.t('showLess')}
          </MText>
        </TouchableOpacity>
      );
    },
    [theme],
  );

  const renderTruncatedFooter = React.useCallback(
    handlePress => {
      return (
        <TouchableOpacity onPress={handlePress} style={styles.touchable}>
          <LinearGradient
            colors={[startColor, endColor]}
            style={styles.linear}
          />
          <MText
            style={[
              theme.colorPrimaryText,
              theme.fontL,
              theme.bold,
              theme.textCenter,
              theme.marginTop2x,
            ]}>
            {i18n.t('readMore')}
          </MText>
        </TouchableOpacity>
      );
    },
    [
      startColor,
      endColor,
      theme.colorPrimaryText,
      theme.fontL,
      theme.bold,
      theme.textCenter,
      theme.marginTop2x,
    ],
  );
  const translate = React.useCallback(() => {
    // delayed until the menu is closed
    setTimeout(() => {
      translateRef.current?.show();
    }, 300);
  }, [translateRef]);

  const reply = React.useCallback(() => {
    // if we can't reply, open input and fill in owner username
    if (!props.comment.can_reply) {
      return props.store.setShowInput(
        true,
        undefined,
        `@${props.comment.ownerObj.username} `,
      );
    }

    navigation.push('ReplyComment', {
      comment: props.comment,
      entity: props.store.entity,
      open: true,
    });
  }, [navigation, props.comment, props.store.entity]);

  const viewReply = React.useCallback(() => {
    navigation.push('ReplyComment', {
      comment: props.comment,
      entity: props.store.entity,
    });
  }, [navigation, props.comment, props.store.entity]);

  return (
    <View
      style={[
        styles.container,
        props.comment.focused ? styles.focused : theme.bcolorPrimaryBorder,
      ]}>
      <CommentHeader entity={props.comment} navigation={navigation} />

      {!mature || props.comment.isOwner() ? (
        <>
          <View style={[styles.body, theme.flexContainer]}>
            {!!props.comment.description && (
              <>
                <ReadMore
                  numberOfLines={6}
                  navigation={NavigationService}
                  text={entities.decodeHTML(props.comment.description)}
                  renderTruncatedFooter={renderTruncatedFooter}
                  renderRevealedFooter={renderRevealedFooter}
                />
                <Translate ref={translateRef} entity={props.comment} />
              </>
            )}
            {(props.comment.hasMedia() ||
              Boolean(props.comment.attachment_guid)) && (
              <View style={theme.paddingTop3x}>
                <MediaView
                  entity={props.comment}
                  imageStyle={theme.borderRadius}
                  smallEmbed
                  // onPress={this.navToImage}
                />
              </View>
            )}
            {mature && (
              <View style={theme.marginTop3x}>
                <MText style={[theme.fontL, theme.colorTertiaryText]}>
                  {i18n.t('activity.explicitComment')}
                </MText>
              </View>
            )}
          </View>
          <View style={styles.actionsContainer}>
            <ThumbUpAction
              entity={props.comment}
              size="tiny"
              touchableComponent={TouchableOpacity}
            />
            <ThumbDownAction
              entity={props.comment}
              size="tiny"
              touchableComponent={TouchableOpacity}
            />
            {canReply && <ReplyAction size={16} onPressReply={reply} />}
            <View style={theme.flexContainer} />
            {!props.isHeader && (
              <CommentBottomMenu
                store={props.store}
                entity={props.store.entity}
                comment={props.comment}
                onTranslate={translate}
              />
            )}
          </View>
          {!!props.comment.replies_count && !props.hideReply && (
            <TouchableOpacity onPress={viewReply} style={theme.marginBottom3x}>
              <MText style={[styles.viewReply, theme.colorLink]}>
                {i18n.t('viewRepliesComments', {
                  count: props.comment.replies_count,
                })}
              </MText>
            </TouchableOpacity>
          )}
        </>
      ) : (
        // mature
        <View>
          <TouchableOpacity
            onPress={props.comment.toggleMatureVisibility}
            style={[theme.centered, theme.marginTop4x]}>
            <MText style={[theme.bold, theme.fontL, theme.colorSecondaryText]}>
              {i18n.t('activity.explicitComment')}
            </MText>
            <MText
              style={[
                theme.bold,
                theme.fontL,
                theme.colorLink,
                theme.paddingVertical2x,
              ]}>
              {i18n.t('confirm18')}
            </MText>
          </TouchableOpacity>
          {!props.isHeader && (
            <View style={[theme.rowJustifyEnd, theme.padding3x]}>
              <CommentBottomMenu
                store={props.store}
                entity={props.store.entity}
                comment={props.comment}
                onTranslate={translate}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  matureCloseContainer: {
    marginLeft: -29,
    marginTop: 40,
  },
  viewReply: {
    marginLeft: 65,
    fontSize: 15,
    fontWeight: '700',
  },
  matureIcon: {
    position: 'absolute',
    right: 10,
    top: 8,
  },
  body: {
    paddingVertical: 0,
    paddingLeft: 63,
    paddingRight: 20,
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 15,
    paddingTop: 8,
    paddingLeft: 50,
  },
  container: {
    padding: 5,
    paddingRight: 0,
    display: 'flex',
    // width: '100%',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  touchable: {
    position: 'relative',
    height: 100,
    width: '100%',
    top: -52,
  },
  linear: {
    height: 52,
    width: '100%',
  },
  focused: {
    borderLeftColor: LIGHT_THEME.Link,
    borderLeftWidth: 4,
  },
});
