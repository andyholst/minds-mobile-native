import React from 'react';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { View } from 'react-native';
import ThemedStyles from '../../styles/ThemedStyles';
import Comment from './Comment';
import type CommentsStore from './CommentsStore';
import CommentListHeader from './CommentListHeader';
import LoadMore from './LoadMore';
import { useFocusEffect } from '@react-navigation/native';
import { CommentInputContext } from './CommentInput';

// types
type PropsType = {
  header?: any;
  parent?: any;
  keyboardVerticalOffset?: any;
  store: CommentsStore;
  user?: any;
  scrollToBottom?: boolean;
  onInputFocus?: Function;
  onCommentFocus?: Function;
};

/**
 * Comments List
 * @param props
 */
const CommentList: React.FC<PropsType> = (props: PropsType) => {
  const theme = ThemedStyles.style;
  const ref = React.useRef<any>(null);
  const provider = React.useContext(CommentInputContext);

  useFocusEffect(
    React.useCallback(() => {
      provider.setStore(props.store);
    }, [props.store, provider]),
  );

  React.useEffect(() => {
    props.store.loadComments(true).then(() => {
      setTimeout(() => ref.current?.scrollToEnd(), 600);
    });
  }, [props.store]);

  const renderItem = React.useCallback(
    (row: any): React.ReactElement => {
      const comment = row.item;

      // add the editing observable property
      comment.editing = observable.box(false);

      return <Comment comment={comment} store={props.store} />;
    },
    [props.store],
  );

  const Header = React.useCallback(() => {
    return <LoadMore store={props.store} />;
  }, [props.store]);

  const Footer = React.useCallback(() => {
    return <LoadMore store={props.store} next={true} />;
  }, [props.store]);

  return (
    <View style={[theme.flexContainer, theme.backgroundPrimary]}>
      <CommentListHeader store={props.store} />
      <BottomSheetFlatList
        ref={ref}
        data={props.store.comments.slice()}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={[theme.flexContainer, theme.backgroundPrimary]}
        contentContainerStyle={[theme.backgroundPrimary, theme.paddingBottom3x]}
      />
    </View>
  );
};

const keyExtractor = (item) => item.guid;

export default observer(CommentList);