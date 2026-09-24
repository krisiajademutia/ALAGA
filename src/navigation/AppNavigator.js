import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { navigationRef, navigate } from './navigationRef';
export { navigationRef, navigate };

// ── Auth / Onboarding ─────────────────────────────────────────────────────────
import SplashScreen     from '../screens/onboarding/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen      from '../screens/auth/LoginScreen';
import RegisterScreen   from '../screens/auth/RegisterScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// ── Community screens ─────────────────────────────────────────────────────────
import CommunityHomeScreen from '../screens/community/HomeScreen';
import ReportRescueScreen  from '../screens/community/ReportRescueScreen';
import ReportDetailScreen  from '../screens/community/ReportDetailScreen';
import AllReportsScreen    from '../screens/community/AllReportsScreen';

// ── Advocate screens ──────────────────────────────────────────────────────────
import AdvocateHomeScreen      from '../screens/advocate/AdvocateHomeScreen';
import RescueAlertsScreen      from '../screens/advocate/RescueAlertsScreen';
import RescueAlertDetailScreen from '../screens/advocate/RescueAlertDetailScreen';
import MyAnimalsScreen         from '../screens/advocate/MyAnimalsScreen';
import AddAnimalScreen         from '../screens/advocate/AddAnimalScreen';
import AdvocateRequestsScreen  from '../screens/advocate/AdvocateRequestsScreen';

// ── Shared screens ────────────────────────────────────────────────────────────
import ListingsScreen     from '../screens/shared/ListingsScreen';
import AnimalDetailScreen from '../screens/shared/AnimalDetailScreen';
import MessagesScreen     from '../screens/shared/MessagesScreen';
import ChatScreen         from '../screens/shared/ChatScreen';
import ActivityScreen     from '../screens/shared/ActivityScreen';
import DonateScreen       from '../screens/shared/DonateScreen';
import ProfileScreen      from '../screens/shared/ProfileScreen';
import PublicProfileScreen from '../screens/shared/PublicProfileScreen';
import NotificationScreen  from '../screens/shared/NotificationScreen';

// ─────────────────────────────────────────────────────────────────────────────
// Styles — MUST be defined before navigator components that reference them
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DEC5',
    height: Platform.OS === 'ios' ? 88 : 76,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingTop: 8,
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.1,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  iconWrap: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: '#B8E4E5',
  },
});

// Tab screen options — defined after styles so styles.tabBar is available
const tabScreenOptions = {
  headerShown: false,
  tabBarStyle: styles.tabBar,
  tabBarActiveTintColor: '#473018',
  tabBarInactiveTintColor: '#947E68',
  tabBarLabelStyle: styles.tabLabel,
  tabBarHideOnKeyboard: true,
};

function tabOptions(label, activeIcon, inactiveIcon, badge) {
  return {
    title: label,
    tabBarLabel: label,
    tabBarBadge: badge > 0 ? badge : undefined,
    tabBarBadgeStyle: {
      backgroundColor: '#E8622A',
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      lineHeight: 16,
    },
    tabBarIcon: ({ focused }) => (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? activeIcon : inactiveIcon}
          size={20}
          color={focused ? '#473018' : '#947E68'}
        />
      </View>
    ),
  };
}

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ─────────────────────────────────────────────────────────────────────────────
// Community Tab Navigator
// ─────────────────────────────────────────────────────────────────────────────
function CommunityTabs() {
  const { getUnreadMessagesCount } = useApp();
  const unreadCount = getUnreadMessagesCount();

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home"     component={CommunityHomeScreen} options={tabOptions('Home',     'home',         'home-outline')} />
      <Tab.Screen name="Listings" component={ListingsScreen}      options={tabOptions('Adopt',    'paw',          'paw-outline')} />
      <Tab.Screen name="Messages" component={MessagesScreen}      options={tabOptions('Messages', 'chatbubbles',  'chatbubbles-outline', unreadCount)} />
      <Tab.Screen name="Activity" component={ActivityScreen}      options={tabOptions('Activity', 'time',         'time-outline')} />
      <Tab.Screen name="Profile"  component={ProfileScreen}       options={tabOptions('Profile',  'person',       'person-outline')} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Advocate Tab Navigator
// ─────────────────────────────────────────────────────────────────────────────
function AdvocateTabs() {
  const { getUnreadMessagesCount, getOpenAlertsCount } = useApp();
  const unreadCount = getUnreadMessagesCount();
  const alertsCount = getOpenAlertsCount ? getOpenAlertsCount() : 0;

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home"         component={AdvocateHomeScreen}  options={tabOptions('Home',     'home',          'home-outline')} />
      <Tab.Screen name="RescueAlerts" component={RescueAlertsScreen}  options={tabOptions('Alerts',   'notifications', 'notifications-outline', alertsCount)} />
      <Tab.Screen name="MyAnimals"    component={MyAnimalsScreen}     options={tabOptions('Animals',  'paw',           'paw-outline')} />
      <Tab.Screen name="Messages"     component={MessagesScreen}      options={tabOptions('Messages', 'chatbubbles',   'chatbubbles-outline', unreadCount)} />
      <Tab.Screen name="Profile"      component={ProfileScreen}       options={tabOptions('Profile',  'person',        'person-outline')} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Stack — wraps tabs + all push / modal screens
// ─────────────────────────────────────────────────────────────────────────────
function RootStack() {
  const { currentUser } = useApp();
  const isAdvocate = currentUser?.role === 'advocate';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={isAdvocate ? AdvocateTabs : CommunityTabs} />

      {/* Stack-only screens — pushed on top of tabs, no tab bar */}

      {/* Community */}
      <Stack.Screen name="ReportRescue" component={ReportRescueScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="AllReports"   component={AllReportsScreen} />

      {/* Advocate */}
      <Stack.Screen name="RescueAlertDetail"  component={RescueAlertDetailScreen} />
      <Stack.Screen name="AddAnimal"          component={AddAnimalScreen} />
      <Stack.Screen name="AdvocateRequests"   component={AdvocateRequestsScreen} />

      {/* Shared */}
      <Stack.Screen name="AnimalDetail"   component={AnimalDetailScreen} />
      <Stack.Screen name="Chat"           component={ChatScreen} />
      <Stack.Screen name="Donate"         component={DonateScreen} />
      <Stack.Screen name="PublicProfile"  component={PublicProfileScreen} />
      <Stack.Screen name="Notifications"  component={NotificationScreen} />

      {isAdvocate && (
        <Stack.Screen name="Activity" component={ActivityScreen} />
      )}
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Stack
// ─────────────────────────────────────────────────────────────────────────────
function AuthStack({ initialRoute = 'Login' }) {
  return (
    <Stack.Navigator
      key={initialRoute}
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Login"         component={LoginScreen} />
      <Stack.Screen name="Register"      component={RegisterScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Onboarding"    component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Navigator — switches between Auth and App based on login state
// ─────────────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { currentUser, isAuthLoading, isOnboardingCompleted } = useApp();

  if (isAuthLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {currentUser ? (
        <RootStack />
      ) : (
        <AuthStack initialRoute={isOnboardingCompleted ? 'Login' : 'Onboarding'} />
      )}
    </NavigationContainer>
  );
}
