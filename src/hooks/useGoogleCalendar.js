import { useStorage } from './useStorage';

const GOOGLE_CALENDAR_STORAGE_KEY = 'google_calendar_token';

/**
 * Hook to manage Google Calendar OAuth token and sync state
 */
export const useGoogleCalendar = () => {
  const [googleAccessToken, setGoogleAccessToken] = useStorage(GOOGLE_CALENDAR_STORAGE_KEY, null);
  const [syncEnabled, setSyncEnabled] = useStorage('google_calendar_sync_enabled', false);
  const isConnected = !!googleAccessToken;

  const handleGoogleSignIn = (credentialResponse) => {
    try {
      // credentialResponse contains the access token
      const accessToken = credentialResponse.credential || credentialResponse.access_token;
      setGoogleAccessToken(accessToken);
      return true;
    } catch (error) {
      console.error('Error handling Google sign-in:', error);
      return false;
    }
  };

  const disconnectGoogle = () => {
    setGoogleAccessToken(null);
    setSyncEnabled(false);
  };

  const toggleSync = (enabled) => {
    if (!isConnected) return false;
    setSyncEnabled(enabled);
    return true;
  };

  return {
    googleAccessToken,
    isConnected,
    syncEnabled,
    handleGoogleSignIn,
    disconnectGoogle,
    toggleSync
  };
};
