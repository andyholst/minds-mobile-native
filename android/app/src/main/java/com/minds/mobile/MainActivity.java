package com.minds.mobile;

import android.os.Bundle;
import com.zoontek.rnbootsplash.RNBootSplash;
import com.facebook.react.ReactActivity;

// image picker imports
import com.facebook.react.modules.core.PermissionListener;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import android.content.Intent;
import android.content.res.Configuration;
import android.content.pm.ActivityInfo;

public class MainActivity extends ReactActivity {
    private PermissionListener listener;

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Intent intent = new Intent("onConfigurationChanged");
        intent.putExtra("newConfig", newConfig);
        this.sendBroadcast(intent);
    }

   /**
    * Returns the name of the main component registered from JavaScript. This is used to schedule
    * rendering of the component.
    */
    @Override
    protected String getMainComponentName() {
        return "Minds";
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        moveTaskToBack(true);
    }

     @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
      return new ReactActivityDelegate(this, getMainComponentName()) {
        @Override
        protected ReactRootView createRootView() {
         return new RNGestureHandlerEnabledRootView(MainActivity.this);
        }
      };
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
        RNBootSplash.init(R.drawable.bootsplash, MainActivity.this);
        setRequestedOrientation(
            ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT
        );
    }


    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults)
    {
        if (listener != null)
        {
        listener.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
