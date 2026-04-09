import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  ArrowRight, 
  Chrome, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
    } catch (error) {
      // Errors are already shown via toast in AuthContext (login / signup).
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      // loginWithGoogle already shows authErrorMessage toast before throwing
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      toast.error('Enter your email address first.');
      return;
    }

    try {
      await resetPassword(formData.email);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-0 md:p-6 selection:bg-primary-500/30 selection:text-primary-700 overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-7xl h-full md:h-[95vh] bg-white dark:bg-slate-900/50 md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative z-10 border border-slate-200/50 dark:border-white/5 backdrop-blur-2xl">
        
        {/* Left Side: Visual Experience */}
        <div className="hidden md:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col p-12 justify-between">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-950 to-slate-950"></div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/20">
                <GraduationCap className="text-primary-600" size={24} />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">Study<span className="text-primary-400">OS</span></span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="text-4xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                Architect Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-300">Intellectual</span> <br />
                Empire.
              </h1>
              <p className="text-slate-300 text-lg max-w-md leading-relaxed font-medium">
                The unified workspace for modern students. Organize knowledge, master concepts, and transcend ordinary learning.
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 grid grid-cols-2 gap-4"
          >
            {[
              { icon: Zap, label: "Pro-Grade Analytics", color: "text-amber-400" },
              { icon: ShieldCheck, label: "Cloud Persistence", color: "text-emerald-400" },
              { icon: BookOpen, label: "Resource Library", color: "text-blue-400" },
              { icon: Sparkles, label: "Smart Notes", color: "text-purple-400" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 group cursor-default">
                <div className={`p-1.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors ${feature.color}`}>
                  <feature.icon size={16} />
                </div>
                <span className="text-xs font-bold text-slate-300">{feature.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Decorative 3D elements */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent-500/20 rounded-full blur-[80px]"></div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-1/2 h-full flex flex-col p-4 md:p-8 lg:p-12">
          <div className="md:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={20} />
            </div>
            <span className="text-lg font-black tracking-tighter dark:text-white uppercase">Study<span className="text-primary-500">OS</span></span>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="mb-6">
              <motion.div
                key={isLogin ? 'login-head' : 'signup-head'}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2"
              >
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-widest border border-primary-100 dark:border-primary-500/20">
                  <Sparkles size={10} />
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  {isLogin 
                    ? 'Enter your credentials to re-enter your workspace.' 
                    : 'Initialize your personal learning operating system.'}
                </p>
              </motion.div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Universal ID / Name</label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                          required
                          type="text"
                          placeholder="Commander John Doe"
                          className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white font-bold text-sm"
                          value={formData.name}
                          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Neural Mailbox</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={16} />
                  <input
                    required
                    type="email"
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white font-bold text-sm"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Secure Passkey</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:text-primary-700 transition-colors"
                    >
                      Forgotten?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={16} />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white font-bold text-sm"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-100 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isLogin ? 'Authenticate' : 'Initialize'}
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 dark:bg-white/5 flex-1"></div>
                <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Social Integration</span>
                <div className="h-px bg-slate-200 dark:bg-white/5 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 disabled:opacity-50 group"
                >
                  <div className="bg-white p-1 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c1.61-3.21 2.53-7.69 2.53-11.31z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">Continue with Google</span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-400">
                  {isLogin ? "New to the system?" : "Identity already exists?"}{' '}
                  <button
                    onClick={() => setIsLogin((prev) => !prev)}
                    className="text-primary-600 dark:text-primary-400 font-black hover:text-primary-700 transition-colors relative inline-block group text-xs"
                  >
                    {isLogin ? 'Create Account' : 'Sign In'}
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </button>
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-4 text-center">
            <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">
              &copy; 2026 StudyOS System v2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

