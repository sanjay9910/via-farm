import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'user_token';

export const saveToken = async (token) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const deleteToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};


// // app/utility/Storage.tsx
// import * as SecureStore from 'expo-secure-store';

// const TOKEN_KEY = 'user_token';

// export const saveToken = async (token) => {
//   await SecureStore.setItemAsync(TOKEN_KEY, token);
// };

// export const getToken = async () => {
//   return await SecureStore.getItemAsync(TOKEN_KEY);
// };

// export const deleteToken = async () => {
//   await SecureStore.deleteItemAsync(TOKEN_KEY);
// };

// // Fix router warning: add harmless default export
// export default function StoragePlaceholder() {
//   return null;
// }
