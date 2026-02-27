import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { Colors } from '../theme';

import SplashScreen       from '../screens/auth/SplashScreen';
import OnboardingScreen   from '../screens/auth/OnboardingScreen';
import LoginScreen        from '../screens/auth/LoginScreen';
import RegisterScreen     from '../screens/auth/RegisterScreen';
import OTPVerifyScreen    from '../screens/auth/OTPVerifyScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen  from '../screens/auth/ResetPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash"          component={SplashScreen} />
      <Stack.Screen name="Onboarding"      component={OnboardingScreen} />
      <Stack.Screen name="Login"           component={LoginScreen} />
      <Stack.Screen name="Register"        component={RegisterScreen} />
      <Stack.Screen name="OTPVerify"       component={OTPVerifyScreen} />
      <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword"   component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
