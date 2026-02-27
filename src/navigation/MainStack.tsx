import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import { Colors } from '../theme';

import BottomTabNavigator    from './BottomTabNavigator';
import JoinRoomScreen        from '../screens/match/JoinRoomScreen';
import RoomLobbyScreen       from '../screens/match/RoomLobbyScreen';
import AddPlayersScreen      from '../screens/match/AddPlayersScreen';
import TossScreen            from '../screens/match/TossScreen';
import ScoringScreen         from '../screens/match/ScoringScreen';
import WicketModalScreen     from '../screens/match/WicketModalScreen';
import LiveViewerScreen      from '../screens/match/LiveViewerScreen';
import MatchResultScreen     from '../screens/match/MatchResultScreen';
import MatchDetailScreen     from '../screens/match/MatchDetailScreen';
import ToolDetailScreen      from '../screens/tools/ToolDetailScreen';
import PlansScreen           from '../screens/subscription/PlansScreen';
import PlanDetailScreen      from '../screens/subscription/PlanDetailScreen';
import EnterpriseScreen      from '../screens/enterprise/EnterpriseScreen';
import CreateEnterpriseScreen from '../screens/enterprise/CreateEnterpriseScreen';
import MembersScreen         from '../screens/enterprise/MembersScreen';
import FriendsScreen         from '../screens/social/FriendsScreen';
import UserSearchScreen      from '../screens/social/UserSearchScreen';
import EditProfileScreen      from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen  from '../screens/profile/ChangePasswordScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs"              component={BottomTabNavigator} />
      <Stack.Screen name="JoinRoom"          component={JoinRoomScreen} />
      <Stack.Screen name="RoomLobby"         component={RoomLobbyScreen} />
      <Stack.Screen name="AddPlayers"        component={AddPlayersScreen} />
      <Stack.Screen name="Toss"              component={TossScreen} />
      <Stack.Screen name="Scoring"           component={ScoringScreen} />
      <Stack.Screen
        name="WicketModal"
        component={WicketModalScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="LiveViewer"        component={LiveViewerScreen} />
      <Stack.Screen name="MatchResult"       component={MatchResultScreen} />
      <Stack.Screen name="MatchDetail"       component={MatchDetailScreen} />
      <Stack.Screen name="ToolDetail"        component={ToolDetailScreen} />
      <Stack.Screen name="Plans"             component={PlansScreen} />
      <Stack.Screen name="PlanDetail"        component={PlanDetailScreen} />
      <Stack.Screen name="Enterprise"        component={EnterpriseScreen} />
      <Stack.Screen name="CreateEnterprise"  component={CreateEnterpriseScreen} />
      <Stack.Screen name="Members"           component={MembersScreen} />
      <Stack.Screen name="Friends"           component={FriendsScreen} />
      <Stack.Screen name="UserSearch"        component={UserSearchScreen} />
      <Stack.Screen name="EditProfile"       component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword"    component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}
