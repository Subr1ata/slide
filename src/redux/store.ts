"use client";

import AutomationReducer from "@/redux/slices/automation";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { combineReducers, configureStore } from "@reduxjs/toolkit";

// Reducers are pretty much like a function. It is technically a function. Based on the action we call reducer

// Imagine you had a function that listens for different type of events for example create action create Trigger or something like that right and so based on the type of action you tell that function to perform it will accordingly reduce the state okay that's why it's called a reducer it reduces the state to a different value.
const rootReducer = combineReducers({
  AutomationReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
