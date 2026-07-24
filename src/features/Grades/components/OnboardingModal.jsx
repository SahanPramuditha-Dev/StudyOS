import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, ArrowRight, Sparkles, School } from 'lucide-react';

const OnboardingModal = ({ onSave }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    mode: null,
    schoolLevel: null,
    universityLevel: null,
    degreeName: '',
    major: '',
    totalCreditsRequired: 120,
    expectedGraduation: '',
    targetCgpa: 3.5
  });

  const handleSelectMode = (mode) => {
    setFormData(prev => ({ ...prev, mode }));
    setStep(2);
  };

  const handleSelectLevel = (level) => {
    if (formData.mode === 'school') {
      setFormData(prev => ({ ...prev, schoolLevel: level }));
      // For school, this is the final step
      onSave({
        ...formData,
        schoolLevel: level,
        targetCgpa: 80 // School uses 100-based scale targets by default
      });
    } else {
      setFormData(prev => ({ ...prev, universityLevel: level }));
      setStep(3);
    }
  };

  const handleUniSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 p-48 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 p-48 bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden"
      >
        {/* Step indicators */}
        <div className="flex gap-2 justify-center mb-8">
          <div className={`h-1.5 w-8 rounded-full transition-all ${step >= 1 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`h-1.5 w-8 rounded-full transition-all ${step >= 2 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
          {formData.mode === 'university' && (
            <div className={`h-1.5 w-8 rounded-full transition-all ${step >= 3 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
          )}
        </div>

        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Welcome to Grade Center</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">To personalize your academic intelligence module, select your education path.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => handleSelectMode('school')}
                className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 rounded-3xl transition-all group text-center"
              >
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 shadow-sm transition-colors mb-4">
                  <School size={24} />
                </div>
                <span className="font-black text-lg text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">School Student</span>
                <span className="text-xs text-slate-500 mt-1">Grade 1 to O/L / A/L</span>
              </button>

              <button
                onClick={() => handleSelectMode('university')}
                className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 rounded-3xl transition-all group text-center"
              >
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 shadow-sm transition-colors mb-4">
                  <GraduationCap size={24} />
                </div>
                <span className="font-black text-lg text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">University Student</span>
                <span className="text-xs text-slate-500 mt-1">Diploma, Degree, Postgraduate</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Select Your Level</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Which stage are you currently enrolled in?</p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              {formData.mode === 'school' ? (
                <>
                  {['Primary (Grade 1-5)', 'O/L (Ordinary Level)', 'A/L (Advanced Level)'].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => handleSelectLevel(lvl)}
                      className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl text-left font-bold text-slate-800 dark:text-slate-200 transition-all flex justify-between items-center group"
                    >
                      {lvl}
                      <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all text-blue-500" />
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {['Diploma / Higher Diploma', 'Undergraduate Degree', 'Postgraduate (Masters / PhD)'].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => handleSelectLevel(lvl)}
                      className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl text-left font-bold text-slate-800 dark:text-slate-200 transition-all flex justify-between items-center group"
                    >
                      {lvl}
                      <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all text-blue-500" />
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleUniSubmit} className="space-y-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Academic Details</h2>
              <p className="text-sm text-slate-500 font-medium">Configure your university program settings.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Degree Programme Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. BSc in Computer Science"
                  value={formData.degreeName}
                  onChange={e => setFormData(prev => ({ ...prev, degreeName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Major / Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineering"
                    value={formData.major}
                    onChange={e => setFormData(prev => ({ ...prev, major: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target CGPA (4.0 Scale)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="4.0"
                    value={formData.targetCgpa}
                    onChange={e => setFormData(prev => ({ ...prev, targetCgpa: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Degree Credits</label>
                  <input
                    type="number"
                    value={formData.totalCreditsRequired}
                    onChange={e => setFormData(prev => ({ ...prev, totalCreditsRequired: parseInt(e.target.value) || 120 }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Expected Graduation</label>
                  <input
                    type="text"
                    placeholder="e.g. Spring 2028"
                    value={formData.expectedGraduation}
                    onChange={e => setFormData(prev => ({ ...prev, expectedGraduation: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight size={18} />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
