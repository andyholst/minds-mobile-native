//@ts-nocheck
import React, { Component } from 'react';

import { View, TouchableOpacity, StyleSheet } from 'react-native';

import FastImage from 'react-native-fast-image';

import { observer } from 'mobx-react';
import ExplicitImage from '../common/components/explicit/ExplicitImage';

import ExplicitOverlay from '../common/components/explicit/ExplicitOverlay';
import ThemedStyles from '../styles/ThemedStyles';
import MText from '../common/components/MText';

@observer
class DiscoveryTile extends Component {
  state = {
    error: false,
    style: null,
  };

  /**
   * Derive state from props
   * @param {object} nextProps
   * @param {object} prevState
   */
  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.size !== nextProps.size) {
      return {
        style: { width: nextProps.size, height: nextProps.size },
      };
    }

    return null;
  }

  /**
   * On press
   */
  _onPress = () => {
    if (this.props.onPress) {
      this.props.onPress(this.props.entity);
    }
  };

  setError = () => {
    this.setState({ error: true });
  };

  setActive = () => {
    // bubble event up
    this.props.onLoadEnd && this.props.onLoadEnd();
  };

  /**
   * Render
   */
  render() {
    const entity = this.props.entity;
    const theme = ThemedStyles.style;

    // this optimization have some issues with the changes of the video auto-pause
    // if (!entity.is_visible) {
    //   return null;
    // }

    const url = entity.getThumbSource();

    // load gif with lower priority
    if (entity.isGif()) {
      url.priority = FastImage.priority.low;
    }

    const show_overlay = entity.shouldBeBlured();

    const overlay = show_overlay ? (
      <ExplicitOverlay entity={entity} iconSize={45} hideText={true} />
    ) : null;

    const boundary = this.props.boundaryText ? (
      <View
        style={[
          theme.positionAbsoluteTop,
          theme.bgSeparator,
          theme.centered,
          styles.boundary,
        ]}>
        <MText>{this.props.boundaryText}</MText>
      </View>
    ) : null;

    return (
      <TouchableOpacity
        onPress={this._onPress}
        style={[this.state.style, styles.tile]}>
        <View style={[theme.flexContainer, theme.bgSeparator]}>
          {boundary}
          <ExplicitImage
            source={url}
            onLoadEnd={this.setActive}
            onError={this.setError}
          />
          {overlay}
        </View>
      </TouchableOpacity>
    );
  }
}

export default DiscoveryTile;

const styles = StyleSheet.create({
  boundary: {
    height: 20,
    width: '100%',
    zIndex: 1000,
  },
  tile: {
    paddingTop: 1,
    paddingBottom: 1,
    paddingRight: 1,
    paddingLeft: 1,
  },
});
