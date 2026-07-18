import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { FirestoreService } from '../../services/firestore';
import { useEffect, useState as useReactState } from 'react';

const CredentialSetup = () => {
  const { user, profile, updateUserProfile, setupPasswordCredential, checkUsernameAvailability, suggestUsernames } = useAuth();
  const [username, setUsername] = useReactState('');
  const [password, setPassword] = useReactState('');
  const [loading, setLoading] = useReactState(false);
  const [usernameStatus, setUsernameStatus] = useReactState(''); // 'typing', 'available', 'taken', 'invalid', ''
  const [statusMessage, setStatusMessage] = useReactState('');
  const [suggestions, setSuggestions] = useReactState([]);
  const [showPassword, setShowPassword] = useReactState(false);

  // Debounced username validation
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus('');
      setStatusMessage('');
      setSuggestions([]);
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const formatError = FirestoreService.validateUsernameFormat(cleanUsername);
    if (formatError) {
      setUsernameStatus('invalid');
      setStatusMessage(formatError);
      setSuggestions([]);
      return;
    }

    setUsernameStatus('typing');
    const timer = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailability(cleanUsername);
        if (isAvailable) {
          setUsernameStatus('available');
          setStatusMessage('Username is available ✓');
          setSuggestions([]);
        } else {
          setUsernameStatus('taken');
          setStatusMessage('Username is already taken ✗');
          const generatedSuggestions = await suggestUsernames(cleanUsername);
          setSuggestions(generatedSuggestions);
        }
      } catch (e) {
        setUsernameStatus('invalid');
        setStatusMessage('Error checking availability: ' + e.message);
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability, suggestUsernames]);
  
  // If the user signed in with OAuth, they might not have a password provider
  const hasPasswordProvider = user?.providerData?.some(p => p.providerId === 'password');
  // We'll prompt for password if they don't have one
  const needsPassword = !hasPasswordProvider;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernameStatus === 'invalid' || usernameStatus === 'taken' || usernameStatus === 'typing') {
      toast.error('Please select a valid and available username.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    setLoading(true);
    try {
      // Setup password if needed and provided
      if (needsPassword && password) {
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await setupPasswordCredential(password);
      }

      // Claim username
      await FirestoreService.setUsername(user.id, cleanUsername);
      
      // Update local profile state to trigger re-render and remove wizard
      await updateUserProfile({
        ...profile,
        username: cleanUsername
      });

      toast.success('Account setup complete!');
    } catch (error) {
      if (error.message === 'Username is already taken.') {
        toast.error('This username is already taken, please try another.');
      } else {
        toast.error('Failed to complete setup. ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetupLater = async () => {
    setLoading(true);
    try {
      // Generate a temporary unique username
      let tempUsername = `user_${Math.random().toString(36).substring(2, 10)}`;
      let isAvailable = await checkUsernameAvailability(tempUsername);
      while (!isAvailable) {
        tempUsername = `user_${Math.random().toString(36).substring(2, 10)}`;
        isAvailable = await checkUsernameAvailability(tempUsername);
      }

      await FirestoreService.setUsername(user.id, tempUsername);
      await updateUserProfile({
        ...profile,
        username: tempUsername
      });
      toast.success('Setup skipped. You can change your username in Settings later.');
    } catch (error) {
      toast.error('Failed to skip setup. ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-accent-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900/80 rounded-[2rem] shadow-2xl relative z-10 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl overflow-hidden p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="text-primary-600 dark:text-primary-400" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Welcome to StudyOS
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Let's finalize your account. Claim your unique universal ID to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              Choose your Username
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
              <input
                required
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border focus:ring-4 outline-none transition-all dark:text-white font-bold
                  ${usernameStatus === 'available' ? 'border-emerald-500 focus:border-emerald-500 ring-emerald-500/10' : 
                    usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 focus:border-red-500 ring-red-500/10' : 
                    'border-slate-200 dark:border-white/5 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 ring-primary-500/10'}
                `}
              />
            </div>
            {statusMessage ? (
              <p className={`text-xs ml-1 mt-1 font-bold ${
                usernameStatus === 'available' ? 'text-emerald-500' :
                usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-500' :
                'text-slate-400'
              }`}>
                {statusMessage}
              </p>
            ) : (
              <p className="text-xs text-slate-400 ml-1 mt-1">This will be your unique identifier on StudyOS.</p>
            )}

            {suggestions.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Available Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setUsername(s)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      @{s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {needsPassword && (
            <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Add a Password (Optional)
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {password.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex gap-1 mt-2 px-1"
                >
                  <div className={`h-1 flex-1 rounded-full ${password.length > 0 ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 6 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                </motion.div>
              )}

              <p className="text-xs text-slate-400 ml-1 mt-1">Set a password if you want to be able to sign in without your connected social account.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Complete Setup
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSetupLater}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-transparent text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              Setup Later
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CredentialSetup;
