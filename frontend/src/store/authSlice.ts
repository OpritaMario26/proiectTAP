import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UserSession = {
  id: number;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserSession | null;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthState>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    clearSession: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
