package com.bunnit_test

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

// [2025.08.31] @react-navigation
import android.os.Bundle;

// [2025.09.03] react-native-screens
// import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory;

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "bunnit_test"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // [2025.08.31] @react-navigation
  override fun onCreate(savedInstanceState: Bundle?) {
    // [2025.09.03] react-native-screens
    // supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()

    super.onCreate(null)
  }
}
