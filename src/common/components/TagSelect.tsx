//@ts-nocheck
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import {
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextStyle,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';

import ThemedStyles from '../../styles/ThemedStyles';
import MText from './MText';

interface PropsType {
  tagStyle?: StyleProp<ViewStyle>;
  tagSelectedStyle?: StyleProp<ViewStyle>;
  textSelectedStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  onTagDeleted: (string) => void;
  onTagAdded: (string) => void;
  tags: Array<{ value: string; selected: boolean }>;
  disableSort?: boolean;
}

/**
 * Tag Select Component
 */
@inject('hashtag')
@observer
export default class TagSelect extends Component<PropsType> {
  /**
   * Remove tag
   * @param {string} tag
   */
  async toogle(tag) {
    if (tag.selected) {
      await this.props.onTagDeleted(tag);
    } else {
      await this.props.onTagAdded(tag);
    }
    this.onChange();
  }

  /**
   * On change
   */
  onChange() {
    this.props.onChange && this.props.onChange();
  }

  toogleOne = tag => {
    const hashstore = this.props.hashtag;
    this.props.onSelectOne &&
      this.props.onSelectOne(hashstore.hashtag !== tag.value ? tag.value : '');
  };

  /**
   * Render
   */
  render() {
    const theme = ThemedStyles.style;

    let tags = this.props.tags;
    if (!this.props.disableSort) {
      tags = tags.slice().sort((a, b) => (!a.selected && b.selected ? 1 : -1));
    }
    const {
      containerStyle,
      tagStyle,
      tagSelectedStyle,
      textStyle,
      textSelectedStyle,
    } = this.props;

    return (
      <ScrollView>
        <View style={[styles.tagContainer, containerStyle]}>
          {tags.map((tag, i) => (
            <TouchableOpacity
              style={[
                styles.tag,
                theme.bgPrimaryBackground,
                tagStyle,
                tag.selected ? tagSelectedStyle : null,
                tag.value === this.props.hashtag.hashtag
                  ? [theme.bcolorPrimaryBorder, theme.border]
                  : null,
              ]}
              key={i}
              onPress={() => this.toogle(tag)}
              onLongPress={() => this.toogleOne(tag)}
              testID={tag.value + 'TestID'}>
              <MText
                style={[
                  styles.tagText,
                  textStyle,
                  tag.selected
                    ? [theme.colorIconSelected, textSelectedStyle]
                    : null,
                ]}>
                #{tag.value}
              </MText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  error: {
    fontFamily: 'Roboto',
    color: 'red',
    textAlign: 'center',
  },
  tag: {
    borderRadius: 18,
    margin: 2,
    flexDirection: 'row',
    padding: 8,
  },
  tagText: {
    fontFamily: 'Roboto',
    paddingRight: 5,
  },
  tagContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    display: 'flex',
  },
});
