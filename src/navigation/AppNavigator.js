import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

// ── Auth / Onboarding ─────────────────────────────────────────────────────────
import SplashScreen     from '../screens/onboarding/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen      from '../screens/auth/LoginScreen';
import RegisterScreen   from '../screens/auth/RegisterScreen';

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
    borderTopColor: '#EBF1F4',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 6,
    shadowColor: '#102A38',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    backgroundColor: '#E2F0F4',
  },
});

// Tab screen options — defined after styles so styles.tabBar is available
const tabScreenOptions = {
  headerShown: false,
  tabBarStyle: styles.tabBar,
  tabBarActiveTintColor: '#206B82',
  tabBarInactiveTintColor: '#8C9DA6',
  tabBarLabelStyle: styles.tabLabel,
  tabBarHideOnKeyboard: true,
};

function tabOptions(label, activeIcon, inactiveIcon) {
  return {
    title: label,
    tabBarLabel: label,
    tabBarIcon: ({ focused, color }) => (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? activeIcon : inactiveIcon}
          size={20}
          color={focused ? '#206B82' : '#8C9DA6'}
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
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home"     component={CommunityHomeScreen} options={tabOptions('Home',     'home',         'home-outline')} />
      <Tab.Screen name="Listings" component={ListingsScreen}      options={tabOptions('Adopt',    'paw',          'paw-outline')} />
      <Tab.Screen name="Messages" component={MessagesScreen}      options={tabOptions('Messages', 'chatbubbles',  'chatbubbles-outline')} />
      <Tab.Screen name="Activity" component={ActivityScreen}      options={tabOptions('Activity', 'time',         'time-outline')} />
      <Tab.Screen name="Profile"  component={ProfileScreen}       options={tabOptions('Profile',  'person',       'person-outline')} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Advocate Tab Navigator
// ─────────────────────────────────────────────────────────────────────────────
function AdvocateTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home"         component={AdvocateHomeScreen}  options={tabOptions('Home',     'home',          'home-outline')} />
      <Tab.Screen name="RescueAlerts" component={RescueAlertsScreen}  options={tabOptions('Alerts',   'notifications', 'notifications-outline')} />
      <Tab.Screen name="MyAnimals"    component={MyAnimalsScreen}     options={tabOptions('Animals',  'paw',           'paw-outline')} />
      <Tab.Screen name="Messages"     component={MessagesScreen}      options={tabOptions('Messages', 'chatbubbles',   'chatbubbles-outline')} />
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
      <Stack.Screen name="Activity"       component={ActivityScreen} />
      <Stack.Screen name="Donate"         component={DonateScreen} />
      <Stack.Screen name="Profile"        component={ProfileScreen} />
      <Stack.Screen name="PublicProfile"  component={PublicProfileScreen} />
      <Stack.Screen name="Notifications"  component={NotificationScreen} />
      <Stack.Screen name="Listings"       component={ListingsScreen} />
      <Stack.Screen name="RescueAlerts"   component={RescueAlertsScreen} />
      <Stack.Screen name="MyAnimals"      component={MyAnimalsScreen} />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Stack
// ─────────────────────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash"     component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login"      component={LoginScreen} />
      <Stack.Screen name="Register"   component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Navigator — switches between Auth and App based on login state
// ─────────────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { currentUser } = useApp();
  return (
    <NavigationContainer>
      {currentUser ? <RootStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
