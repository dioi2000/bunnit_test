import type { StaticParamList } from '@react-navigation/native';
import {
  createStaticNavigation,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
export const navigationRef = createNavigationContainerRef();
// import BackupStack from './sign/BackupStack';

import { Ionicons } from '@react-native-vector-icons/ionicons';
import Calendar from '@screens/calendar';

const AppTaps = createBottomTabNavigator({
  initialRouteName: 'Calendar',
  screenOptions: {
    headerShown: false,
  },
  screens: {
    Home: {
      screen: () => null,
      options: {
        tabBarIcon: ({ focused }) => (
          <Ionicons name={focused ? 'home-sharp' : 'home-outline'} size={20} />
        ),
      },
    },
    Calendar: {
      screen: Calendar,
      options: {
        tabBarIcon: ({ focused }) => (
          <Ionicons
            name={focused ? 'calendar-sharp' : 'calendar-outline'}
            size={20}
          />
        ),
      },
    },
    Library: {
      screen: () => null,
      options: {
        tabBarIcon: ({ focused }) => (
          <Ionicons
            name={focused ? 'library-sharp' : 'library-outline'}
            size={20}
          />
        ),
      },
    },
    MyPage: {
      screen: () => null,
      options: {
        title: 'My Page',
        tabBarIcon: ({ focused }) => (
          <Ionicons
            name={focused ? 'person-sharp' : 'person-outline'}
            size={20}
          />
        ),
      },
    },
  },
});

export const AppNavigator = () => {
  const Navigation = createStaticNavigation(AppTaps);

  return <Navigation ref={navigationRef} />;
};

export type AppStackParamList = StaticParamList<typeof AppTaps>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}
