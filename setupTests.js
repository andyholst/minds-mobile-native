import React from 'react';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import moment from 'moment-timezone';
import i18n from './src/common/services/i18n.service';

require('./node_modules/react-native-gesture-handler/jestSetup.js');

const XMLHttpRequest = {
  open: jest.fn(),
  abort: jest.fn(),
  onerror: jest.fn(),
};
global.XMLHttpRequest = XMLHttpRequest;

configure({ adapter: new Adapter() });

jest.mock('@react-native-cookies/cookies', () => ({
  set: jest.fn(),
}));

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('./src/common/services/analytics.service');
jest.mock('./src/newsfeed/NewsfeedService');

jest.mock('react-native-localize');
// jest.mock('react-native-device-info', () =>
//   require('./node_modules/react-native-device-info/jest/react-native-device-info-mock'),
// );
// jest.mock('@snowplow/react-native-tracker');
// jest.mock('mobx-react', () => require('mobx-react/custom'));

jest.mock('./AppStores');
jest.useFakeTimers();

jest.doMock('moment', () => {
  moment.tz.setDefault('America/Los_Angeles');
  return moment;
});

jest.doMock('moment-timezone', () => {
  moment.tz.setDefault('America/Los_Angeles');
  return moment;
});

i18n.setLocale('en', false);

// fix for snapshots and touchables

jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity.js',
  () => {
    const { View } = require('react-native');
    const MockTouchable = props => {
      return <View {...props} />;
    };

    MockTouchable.displayName = 'TouchableOpacity';

    return MockTouchable;
  },
);

jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableHighlight.js',
  () => {
    const { View } = require('react-native');
    const MockTouchable = props => {
      return <View {...props} />;
    };

    MockTouchable.displayName = 'TouchableHighlight';

    return MockTouchable;
  },
);

jest.mock('react-native-orientation-locker', () => {
  return {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    lockToPortrait: jest.fn(),
    lockToLandscapeLeft: jest.fn(),
    lockToLandscapeRight: jest.fn(),
    unlockAllOrientations: jest.fn(),
  };
});

jest.mock('pusher-js/react-native', () => jest.fn());
jest.mock('react-native-system-setting', () => {
  return {
    getVolume: jest.fn(() => Promise.resolve()),
  };
});
jest.mock('react-native-silent-switch');
global.__reanimatedWorkletInit = jest.fn();
