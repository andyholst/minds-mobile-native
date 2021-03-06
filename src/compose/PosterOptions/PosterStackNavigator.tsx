import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import React from 'react';
import featuresService from '~/common/services/features.service';
import AccessSelector from './AccessSelector';
import LicenseSelector from './LicenseSelector';
import MonetizeScreen from './monetize/MonetizeScreen';
import PlusMonetizeScreen from './monetize/PlusMonetizeScreen';
import MonetizeSelector from './MonetizeSelector';
import NsfwSelector from './NsfwSelector';
import PermawebSelector from './PermawebSelector';
import PosterOptions from './PosterOptions';
import ScheduleSelector from './ScheduleSelector';
import TagSelector from './TagSelector';
import MembershipMonetizeScreen from './monetize/MembershipMonetizeScreen';
// import CustomMonetizeScreen from '../compose/PosterOptions/monetize/CustomMonetizeScreen';

export type PosterStackParamList = {
  PosterOptions: {};
  TagSelector: {};
  NsfwSelector: {};
  PermawebSelector: {};
  ScheduleSelector: {};
  MonetizeSelector: {};
  LicenseSelector: {};
  AccessSelector: {};
  PlusMonetize: {};
  MembershipMonetize: {};
  CustomMonetize: {};
};

const Stack = createStackNavigator<PosterStackParamList>();
const screenOptions = {
  ...TransitionPresets.SlideFromRightIOS,
  headerShown: false,
  safeAreaInsets: { top: 0 },
};

export default function PosterStackNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PosterOptions" component={PosterOptions} />
      <Stack.Screen name="TagSelector" component={TagSelector} />
      <Stack.Screen name="NsfwSelector" component={NsfwSelector} />
      <Stack.Screen name="PermawebSelector" component={PermawebSelector} />
      <Stack.Screen name="ScheduleSelector" component={ScheduleSelector} />
      <Stack.Screen
        name="MonetizeSelector"
        component={
          featuresService.has('paywall-2020')
            ? MonetizeScreen
            : MonetizeSelector
        }
      />
      <Stack.Screen name="LicenseSelector" component={LicenseSelector} />
      <Stack.Screen name="AccessSelector" component={AccessSelector} />
      <Stack.Screen name="PlusMonetize" component={PlusMonetizeScreen} />
      <Stack.Screen
        name="MembershipMonetize"
        component={MembershipMonetizeScreen}
      />
    </Stack.Navigator>
  );
}
