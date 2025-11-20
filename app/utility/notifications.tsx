// // src/utils/notifications.ts
// import Constants from 'expo-constants';
// import * as Device from 'expo-device';
// import { Platform } from 'react-native';

// const isExpoGo = Constants.appOwnership === 'expo';

// // Use dynamic require so bundler does not load native module when in Expo Go (Android).
// // Type is any to avoid TS compile-time type errors from dynamic require.
// let Notifications: any = null;
// if (!isExpoGo) {
//   try {
//     // eslint-disable-next-line @typescript-eslint/no-var-requires
//     Notifications = require('expo-notifications');
//   } catch (e) {
//     Notifications = null;
//   }
// }

// // Keep references to listeners so we can remove them.
// let _receivedListener: any | null = null;
// let _responseListener: any | null = null;

// export async function registerForPushNotificationsAsync(): Promise<string | null> {
//   // NOTE: In Expo Go on Android this will return null and that's expected.
//   if (isExpoGo || Platform.OS === 'web' || !Notifications || !Device.isDevice) {
//     // safe early return — no crash
//     return null;
//   }

//   try {
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;
//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }
//     if (finalStatus !== 'granted') {
//       console.warn('Push permission not granted');
//       return null;
//     }

//     const tokenObj = await Notifications.getExpoPushTokenAsync();
//     const token = tokenObj?.data ?? null;
//     return token;
//   } catch (err) {
//     console.warn('registerForPushNotificationsAsync error', err);
//     return null;
//   }
// }

// /**
//  * Set a default notification handler for foreground notifications.
//  * Call this once at app startup.
//  */
// export function setDefaultNotificationHandler() {
//   if (!Notifications) return;
//   Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//       shouldShowAlert: true,
//       shouldPlaySound: false,
//       shouldSetBadge: false,
//     }),
//   });
// }

// /**
//  * Initialize notifications: sets handler, registers (gets token) and optionally POSTs token to your backend.
//  * @param saveTokenUrl - backend endpoint to receive token (POST { token, userId })
//  * @param userId - optional user id to send along with token
//  */
// export async function initNotifications(saveTokenUrl?: string, userId?: string): Promise<{ token: string | null }> {
//   setDefaultNotificationHandler();

//   const token = await registerForPushNotificationsAsync();

//   if (token && saveTokenUrl) {
//     try {
//       await fetch(saveTokenUrl, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token, userId }),
//       });
//       console.log('Saved push token to backend');
//     } catch (err) {
//       console.warn('Failed to save token to backend', err);
//     }
//   }

//   return { token };
// }

// /**
//  * Add listeners for received notifications and responses (taps).
//  * Provide callbacks for in-app handling.
//  */
// export function addNotificationListeners(
//   onNotificationReceived?: (notification: any) => void,
//   onNotificationResponse?: (response: any) => void
// ) {
//   if (!Notifications) return;

//   // Remove existing to avoid duplicates
//   removeNotificationListeners();

//   _receivedListener = Notifications.addNotificationReceivedListener((notification: any) => {
//     if (onNotificationReceived) onNotificationReceived(notification);
//   });

//   _responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
//     if (onNotificationResponse) onNotificationResponse(response);
//   });
// }

// /** Remove listeners when component unmounts */
// export function removeNotificationListeners() {
//   try {
//     if (_receivedListener && _receivedListener.remove) _receivedListener.remove();
//     if (_responseListener && _responseListener.remove) _responseListener.remove();
//   } catch (e) {
//     // some versions return subscription object with remove, some use removeSubscription
//     try {
//       if (_receivedListener && typeof _receivedListener === 'function') _receivedListener();
//       if (_responseListener && typeof _responseListener === 'function') _responseListener();
//     } catch {}
//   } finally {
//     _receivedListener = null;
//     _responseListener = null;
//   }
// }

// export default {
//   registerForPushNotificationsAsync,
//   setDefaultNotificationHandler,
//   initNotifications,
//   addNotificationListeners,
//   removeNotificationListeners,
// };






// devesh wala code 


// import { NotificationProvider } from "@/context///console.log";
// import { useColorScheme } from "@/hooks/useColorScheme";
// import { getStatus, getToken } from "@/utils/secureStore";
// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import { useFonts } from "expo-font";
// import * as Notifications from "expo-notifications";
// import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import { useEffect, useState } from "react";
// import "react-native-reanimated";
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });
// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   const [initialRoute, setInitialRoute] = useState(null);
//   const [loaded] = useFonts({
//     SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
//   });
//   useEffect(() => {
//     async function checkToken() {
//       try {
//         const token = await getToken();
//         const status = await getStatus();
//         if (token && status == "approve") {
//           setInitialRoute("auth"); // Go to biometric screen
//           // setInitialRoute("settings");
//         } else if (status == "existingUser") {
//           setInitialRoute("auth");
//         } else if (status == "new") {
//           setInitialRoute("KYC");
//         } else if (status == "pending") {
//           setInitialRoute("approval");
//         } else {
//           setInitialRoute("Login"); // Go to login screen
//         }
//       } catch (error) {
//         console.error("Error checking token:", error);
//         setInitialRoute("Login");
//       }
//     }
//     checkToken();
//   }, []);
//   // Wait until fonts and token check are done
//   if (!loaded || initialRoute === null) {
//     return null; // Or your splash/loading screen
//   }
//   return (
//     <NotificationProvider>
//       {/* <SafeAreaProvider> */}
//       <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//         <Stack initialRouteName={initialRoute}>
//           {/* <Stack> */}
//           <Stack.Screen name="index" options={{ headerShown: false }} />
//           <Stack.Screen name="auth" options={{ headerShown: false }} />
//           <Stack.Screen name="Login" options={{ headerShown: false }} />
//           <Stack.Screen name="KYC" options={{ headerShown: false }} />
//           <Stack.Screen name="approval" options={{ headerShown: false }} />
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           <Stack.Screen name="+not-found" />
//           <Stack.Screen name="PDFViewer" options={{ headerShown: false }} />
//           <Stack.Screen name="Terms" options={{ headerShown: false }} />
//           <Stack.Screen name="PrivacyPolicy" options={{ headerShown: false }} />
//           <Stack.Screen name="Downloads" options={{ headerShown: false }} />
//           <Stack.Screen name="saving" options={{ headerShown: false }} />
//           <Stack.Screen name="settings" options={{ headerShown: false }} />
//           <Stack.Screen name="notification" options={{ headerShown: false }} />
//         </Stack>
//         <StatusBar style="auto" />
//       </ThemeProvider>
//       {/* </SafeAreaProvider> */}
//     </NotificationProvider>
//   );
// }

// React

// Reply

// // 10:05
// import { registerForPushNotificationsAsync } from "@/utils/registerForPushNotificationsAsync";
// import { Subscription } from "expo-modules-core";
// import React, {
//   createContext,
//   ReactNode,
//   useContext,
//   useRef
// } from "react";
// interface NotificationContextType {
//   expoPushToken: string | null;
//   notification: Notifications.Notification | null;
//   error: Error | null;
// }
// const NotificationContext = createContext<NotificationContextType | undefined>(
//   undefined
// );
// export const useNotification = () => {
//   const context = useContext(NotificationContext);
//   if (context === undefined) {
//     throw new Error(
//       "useNotification must be used within a NotificationProvider"
//     );
//   }
//   return context;
// };
// interface NotificationProviderProps {
//   children: ReactNode;
// }
// export const NotificationProvider: React.FC<NotificationProviderProps> = ({
//   children,
// }) => {
//   const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
//   const [notification, setNotification] =
//     useState<Notifications.Notification | null>(null);
//   const [error, setError] = useState<Error | null>(null);
//   const notificationListener = useRef<Subscription>();
//   const responseListener = useRef<Subscription>();
//   useEffect(() => {
//     registerForPushNotificationsAsync().then(
//       (token) => setExpoPushToken(token),
//       (error) => setError(error)
//     );
//     notificationListener.current =
//       Notifications.addNotificationReceivedListener((notification) => {
//         setNotification(notification);
//       });
//     responseListener.current =
//       Notifications.addNotificationResponseReceivedListener((response) => {
//         // Handle the notification response here
//       });
//     return () => {
//       if (notificationListener.current) {
//         Notifications.removeNotificationSubscription(
//           notificationListener.current
//         );
//       }
//       if (responseListener.current) {
//         Notifications.removeNotificationSubscription(responseListener.current);
//       }
//     };
//   }, []);
//   return (
//     <NotificationContext.Provider
//       value={{ expoPushToken, notification, error }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };