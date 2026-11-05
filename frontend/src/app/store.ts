import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import auth from '../features/auth/authSlice';
import { api } from '../shared/api';

export const store = configureStore({
  reducer: { auth, [api.reducerPath]: api.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});
setupListeners(store.dispatch);
let previousToken = store.getState().auth.token;
store.subscribe(() => {
  const token = store.getState().auth.token;
  if (token === previousToken) return;
  previousToken = token;
  try {
    if (token) localStorage.setItem('semester.token', token);
    else localStorage.removeItem('semester.token');
  } catch { /* Browsers without storage keep the session in memory. */ }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
