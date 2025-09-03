/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppNavigator } from '@navigators';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

function App() {
  return (
    <GestureHandlerRootView>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

export default App;
