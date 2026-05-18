import { configureStore } from '@reduxjs/toolkit';

import authReducer from './authSlice';

function loadAuthState() {
  try {
    const serializedState = localStorage.getItem('authState');
    if (!serializedState) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch {
    return undefined;
  }
}

function saveAuthState(state: unknown) {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('authState', serializedState);
  } catch {
    // Ignore write errors
  }
}

const preloadedState = {
  auth: loadAuthState() ?? undefined,
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  saveAuthState(store.getState().auth);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
