import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ArrowRight, Github as GithubIcon, Chrome, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        toast.error("Nice try, but those credentials are as real as your social life. Try again, genius.", {
          duration: 4000,
          icon: '🤡',
        });
      } else {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 selection:bg-primary-100 selection:text-primary-700 transition-colors duration-300">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-primary-500/10 dark:shadow-none overflow-hidden flex flex-col md:flex-row min-h-[600px] border dark:border-slate-800">
        
        {/* Left Side - Illustration/Info */}
        <div className="w-full md:w-1/2 gradient-bg p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <img
                src="/logo.svg"
                alt="StudyOs logo"
                className="w-10 h-10 rounded-xl object-cover border border-white/20 bg-white/10"
              />
              <span className="font-bold text-2xl tracking-tight">StudyOs</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Master your <br />
              <span className="text-primary-200">learning journey.</span>
            </h1>
            <p className="text-white/80 text-lg max-w-md leading-relaxed">
              Join 10,000+ scholars who use StudyOs to organize their courses, track videos, and manage knowledge.
            </p>
          </div>

          <div className="relative z-10 space-y-6 mt-12 md:mt-0">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
                  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop"
                ].map((src, i) => (
                  <img key={i} src={src} className="w-10 h-10 rounded-full border-2 border-primary-500 shadow-lg object-cover" alt="" />
                ))}
              </div>
              <p className="text-sm font-bold text-white/90">Join the scholar community</p>
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-accent-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <img
                src="/logo.svg"
                alt="StudyOs logo"
                className="mx-auto md:mx-0 w-12 h-12 mb-4 rounded-2xl object-cover"
              />
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-slate-400 font-medium">
                {isLogin ? 'Enter your details to access your OS' : 'Get started with your personalized learning OS'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                      <input 
                        required
                        type="text"
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    required
                    type="email"
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Password</label>
                  {isLogin && <button type="button" className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:text-primary-700 dark:hover:text-primary-300 transition-colors">Forgot?</button>}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-100 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? 'Processing...' : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">or continue with</span>
                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
              </div>

              <div className="w-full">
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  <Chrome size={18} className="text-slate-600 dark:text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Google</span>
                </button>
              </div>

              <p className="text-sm font-medium text-slate-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary-600 dark:text-primary-400 font-black hover:text-primary-700 dark:hover:text-primary-300 transition-colors underline decoration-2 underline-offset-4"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
