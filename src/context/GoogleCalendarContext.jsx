import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useStorage } from '../hooks/useStorage';

const GoogleCalendarContext = createContext();

const isTokenExpired = (expiresAt) => {
  return expiresAt ? Date.now() >= expiresAt : false;
};

export const GoogleCalendarProvider = ({ children }) => {
  const [googleAuth, setGoogleAuth] = useStorage('google_calendar_token', null);
  const [syncEnabled, setSyncEnabled] = useStorage('google_calendar_sync_enabled', false);

  const readTokenData = (value) => {
    if (!value) return { accessToken: null, expiresAt: null };
    if (typeof value === 'string') return { accessToken: value, expiresAt: null };
    return {
      accessToken: value.accessToken || value.access_token || value.token || null,
      expiresAt: value.expiresAt || null
    };
  };

  const { accessToken: googleAccessToken, expiresAt } = readTokenData(googleAuth);
  const tokenExpired = useMemo(() => isTokenExpired(expiresAt), [expiresAt]);
  const isConnected = Boolean(googleAccessToken) && !tokenExpired;

  useEffect(() => {
    if (!isConnected && syncEnabled) {
      setSyncEnabled(false);
    }
  }, [isConnected, syncEnabled, setSyncEnabled]);

  const getTokenString = (tokenResponse) => {
    if (!tokenResponse) return null;
    if (typeof tokenResponse === 'string') return tokenResponse;
    return tokenResponse.access_token || tokenResponse.credential || tokenResponse.token || null;
  };

  const handleGoogleSuccess = (tokenResponse) => {
    const accessToken = getTokenString(tokenResponse);
    if (!accessToken) {
      console.error('Google login response did not include a usable token:', tokenResponse);
      setGoogleAuth(null);
      setSyncEnabled(false);
      return false;
    }

    const expiresIn = Number(tokenResponse?.expires_in || 3600);
    const expiresAt = Date.now() + Math.max(300, expiresIn) * 1000;
    setGoogleAuth({
      accessToken,
      expiresAt,
      tokenType: tokenResponse?.token_type || 'Bearer',
      scope: tokenResponse?.scope || ''
    });
    return true;
  };

  const disconnect = () => {
    setGoogleAuth(null);
    setSyncEnabled(false);
  };

  const ensureValidToken = () => {
    if (!googleAccessToken) return null;
    if (tokenExpired) {
      disconnect();
      return null;
    }
    return googleAccessToken;
  };

  const toggleSync = (enabled) => {
    if (!isConnected) return false;
    setSyncEnabled(enabled);
    return true;
  };

  return (
    <GoogleCalendarContext.Provider
      value={{
        googleAccessToken,
        isConnected,
        syncEnabled,
        tokenExpired,
        handleGoogleSuccess,
        disconnect,
        toggleSync,
        ensureValidToken
      }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  );
};

export const useGoogleCalendarContext = () => {
  const context = useContext(GoogleCalendarContext);
  if (!context) {
    throw new Error('useGoogleCalendarContext must be used within GoogleCalendarProvider');
  }
  return context;
};
