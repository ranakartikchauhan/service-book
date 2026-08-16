import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../i18n';
import { COLORS } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Worker Screens
import WorkerJobBrowseScreen from '../screens/worker/JobBrowseScreen';
import WorkerJobDetailScreen from '../screens/worker/JobDetailScreen';
import WorkerMyApplicationsScreen from '../screens/worker/MyApplicationsScreen';
import WorkerProfileScreen from '../screens/worker/ProfileScreen';
import WorkerVerificationScreen from '../screens/worker/VerificationScreen';
import WorkerEarningsScreen from '../screens/worker/EarningsScreen';

// Poster Screens
import PosterPostJobScreen from '../screens/poster/PostJobScreen';
import PosterMyJobsScreen from '../screens/poster/MyJobsScreen';
import PosterApplicantsScreen from '../screens/poster/ApplicantsScreen';
import PosterActiveJobScreen from '../screens/poster/ActiveJobScreen';

// Shared Screens
import ChatScreen from '../screens/shared/ChatScreen';
import ReviewScreen from '../screens/shared/ReviewScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import SubscriptionScreen from '../screens/shared/SubscriptionScreen';
import NotificationCenterScreen from '../screens/shared/NotificationCenterScreen';
import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import EmergencyContactScreen from '../screens/shared/EmergencyContactScreen';
import ContactSupportScreen from '../screens/shared/ContactSupportScreen';
import TrainingVideosScreen from '../screens/worker/TrainingVideosScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HeaderNotificationBell({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('NotificationCenter')}
      style={styles.bellBtn}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
      <View style={styles.bellBadge} />
    </TouchableOpacity>
  );
}

// ─── Auth Stack ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ─── Worker Tabs ──────────────────────────────────────────────────────────────
function WorkerTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: COLORS.textPrimary,
        headerRight: () => <HeaderNotificationBell navigation={navigation} />,
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={WorkerJobBrowseScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
          ),
          tabBarLabel: 'Find Work',
        }}
      />
      <Tab.Screen
        name="MyApplications"
        component={WorkerMyApplicationsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />
          ),
          tabBarLabel: 'Applied',
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={WorkerEarningsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
          ),
          tabBarLabel: 'Earnings',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={WorkerProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Poster Tabs ──────────────────────────────────────────────────────────────
function PosterTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: COLORS.textPrimary,
        headerRight: () => <HeaderNotificationBell navigation={navigation} />,
      }}
    >
      <Tab.Screen
        name="MyJobs"
        component={PosterMyJobsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'reader' : 'reader-outline'} size={22} color={color} />
          ),
          tabBarLabel: 'My Jobs',
        }}
      />
      <Tab.Screen
        name="PostJob"
        component={PosterPostJobScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={COLORS.primary} />
          ),
          tabBarLabel: 'Post Job',
        }}
      />
      <Tab.Screen
        name="PosterProfile"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Main App Navigator ───────────────────────────────────────────────────────
function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: COLORS.textPrimary,
      }}
    >
      {user?.currentMode === 'worker' ? (
        <Stack.Screen name="WorkerTabs" component={WorkerTabs} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="PosterTabs" component={PosterTabs} options={{ headerShown: false }} />
      )}
      {/* Screens accessible from both modes */}
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave a Review' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscriptions & Plans' }} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ title: 'Notification Settings' }} />
      <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} options={{ title: 'Emergency Contact' }} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} options={{ title: 'Customer Support & Help' }} />
      <Stack.Screen name="TrainingVideos" component={TrainingVideosScreen} options={{ title: 'Training & Academy' }} />
      <Stack.Screen name="WorkerVerification" component={WorkerVerificationScreen} options={{ title: 'ID Verification' }} />
      <Stack.Screen name="WorkerJobDetail" component={WorkerJobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="PosterApplicants" component={PosterApplicantsScreen} options={{ title: 'Applicants' }} />
      <Stack.Screen name="PosterActiveJob" component={PosterActiveJobScreen} options={{ title: 'Active Job Session' }} />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <NavigationContainer>
        {user ? <AppNavigator /> : <AuthStack />}
      </NavigationContainer>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.surfaceBorder,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.surfaceBorder,
    borderBottomWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bellBtn: {
    marginRight: 16,
    padding: 6,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
