import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

function readToken(): string | null {
  try {
    return localStorage.getItem("semester.token");
  } catch {
    return null;
  }
}
export interface AuthState {
  token: string | null;
  expired: boolean;
}
const initialState: AuthState = { token: readToken(), expired: false };
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.expired = false;
    },
    signedOut(state) {
      state.token = null;
      state.expired = false;
    },
    sessionExpired(state) {
      state.token = null;
      state.expired = true;
    },
  },
});
export const { signedIn, signedOut, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
