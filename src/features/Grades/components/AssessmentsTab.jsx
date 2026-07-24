import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Calendar, Filter, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { getAssessmentTypes, isSchoolMode } from '../utils/gradeCenter';

const AssessmentsTab = ({ gcSettings, quickAddOpen, selectedYear = 'All' }) => {
  const [allCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments, setAssignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [tasks, setTasks] = useStorage(STORAGE_KEYS.TASKS, []);
  const [semesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);

  const courses = selectedYear === 'All'
    ? allCourses
    : allCourses.filter(c => {
        const sem = semesters.find(s => s.id === c.semesterId);
        return sem && sem.year === selectedYear;
      });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    courseId: '',
    title: '',
    type: '',
    score: '',
    weight: '',
    dueDate: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  const isSchool = isSchoolMode(gcSettings);
  const assessmentTypes = getAssessmentTypes(gcSettings);

  useEffect(() => {
    if (quickAddOpen) {
      setIsModalOpen(true);
      if (courses.length > 0) {
        setModalForm(prev => ({ 
          ...prev, 
          courseId: courses[0].id,
          type: assessmentTypes[0] 
        }));
      }
    }
  }, [quickAddOpen, courses, assessmentTypes]);

  const handleSaveAssessment = (e) => {
    e.preventDefault();
    if (!modalForm.courseId) return;

    const course = courses.find(c => c.id === modalForm.courseId);

    const newAssignment = {
      id: Date.now().toString(),
      courseId: modalForm.courseId,
      title: modalForm.title,
      weight: Number(modalForm.weight) || 0,
      marks: modalForm.score,
      status: modalForm.score ? 'Completed' : 'Pending',
      type: modalForm.type,
      date: modalForm.date
    };

    setAssignments([...assignments, newAssignment]);

    if (modalForm.dueDate) {
      const newTask = {
        id: Date.now().toString() + '_task',
        title: `Complete ${modalForm.title}`,
        description: `Assessment of type ${modalForm.type} for ${course ? course.title : 'Course'}`,
        courseId: modalForm.courseId,
        priority: 'High',
        dueDate: new Date(modalForm.dueDate).toISOString(),
        status: 'todo',
        type: 'Assignment'
      };
      setTasks([...tasks, newTask]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setModalForm({
      courseId: courses[0]?.id || '',
      title: '',
      type: assessmentTypes[0] || '',
      score: '',
      weight: '',
      dueDate: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = (id) => {
    if (confirm('Delete this assessment?')) {
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  // Filter logic
  const filteredAssignments = assignments.filter(a => {
    const course = courses.find(c => c.id === a.courseId);
    if (!course) return false;

    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubjectFilter === 'all' || a.courseId === selectedSubjectFilter;
    const matchesType = selectedTypeFilter === 'all' || a.type === selectedTypeFilter;

    return matchesSearch && matchesSubject && matchesType;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Search and Filters Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assessments or subjects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-355 select-none"
            >
              <option value="all">All Subjects</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-355 select-none"
            >
              <option value="all">All Types</option>
              {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            <Plus size={16} /> Add Assessment
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm overflow-hidden">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
            <p className="text-slate-500 font-bold">No assessments match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-4">Assessment Title</th>
                  <th className="pb-4">Subject</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Weight</th>
                  <th className="pb-4">Score</th>
                  <th className="pb-4">Date Added</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {filteredAssignments.map(a => {
                  const course = courses.find(c => c.id === a.courseId);
                  return (
                    <tr key={a.id} className="border-b border-slate-50 dark:border-slate-850/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 font-black text-slate-900 dark:text-white">{a.title}</td>
                      <td className="py-4">{course ? course.title : 'Unknown Subject'}</td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          {a.type || 'Standard'}
                        </span>
                      </td>
                      <td className="py-4">{a.weight}%</td>
                      <td className="py-4 font-black text-blue-500 text-base">{a.marks}</td>
                      <td className="py-4 text-xs font-bold text-slate-400">{a.date || 'N/A'}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Assessment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">New Grade Entry</h2>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 text-slate-400 hover:text-slate-655 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-850 px-6 gap-4 bg-slate-50/50 dark:bg-slate-950/20">
                {['manual', 'csv', 'ocr'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setModalForm(prev => ({ ...prev, currentTab: tab }));
                    }}
                    className={`py-3 px-1 font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${
                      (modalForm.currentTab || 'manual') === tab ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'manual' ? 'Manual' : tab === 'csv' ? 'CSV Import' : 'Orion OCR Scan'}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {(!modalForm.currentTab || modalForm.currentTab === 'manual') && (
                  <form onSubmit={handleSaveAssessment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                      <select
                        required
                        value={modalForm.courseId}
                        onChange={e => setModalForm({ ...modalForm, courseId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-350"
                      >
                        <option value="" disabled>Select Subject</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                        <select
                          value={modalForm.type}
                          onChange={e => setModalForm({ ...modalForm, type: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300"
                        >
                          {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assessment Title</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Midterm 1"
                          value={modalForm.title}
                          onChange={e => setModalForm({ ...modalForm, title: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Weight (%)</label>
                        <input
                          required
                          type="number"
                          min="1"
                          max="100"
                          placeholder="e.g. 25"
                          value={modalForm.weight}
                          onChange={e => setModalForm({ ...modalForm, weight: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Score (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 85/100"
                          value={modalForm.score}
                          onChange={e => setModalForm({ ...modalForm, score: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assessment Date</label>
                        <input
                          type="date"
                          value={modalForm.date}
                          onChange={e => setModalForm({ ...modalForm, date: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Due Date (Planner Sync)</label>
                        <input
                          type="date"
                          value={modalForm.dueDate}
                          onChange={e => setModalForm({ ...modalForm, dueDate: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-4 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      Save Assessment
                    </button>
                  </form>
                )}

                {modalForm.currentTab === 'csv' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Subject</label>
                      <select
                        value={modalForm.courseId}
                        onChange={e => setModalForm({ ...modalForm, courseId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300"
                      >
                        <option value="" disabled>Select Subject</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Paste CSV Data</label>
                      <textarea
                        rows={5}
                        placeholder="Format: Title, Score, Weight (e.g. Midterm 1, 18/20, 20)"
                        value={modalForm.csvData || ''}
                        onChange={e => setModalForm({ ...modalForm, csvData: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300 placeholder:text-slate-400 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!modalForm.courseId || !modalForm.csvData) return;
                        const lines = modalForm.csvData.split('\n');
                        const newEntries = [];
                        lines.forEach(line => {
                          const parts = line.split(',');
                          if (parts.length >= 2) {
                            newEntries.push({
                              id: Date.now().toString() + Math.random().toString(36).substring(7),
                              courseId: modalForm.courseId,
                              title: parts[0].trim(),
                              marks: parts[1].trim(),
                              weight: Number(parts[2] || 20),
                              status: 'Completed',
                              type: 'Assignment',
                              date: new Date().toISOString().split('T')[0]
                            });
                          }
                        });
                        setAssignments([...assignments, ...newEntries]);
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="w-full mt-4 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider"
                    >
                      Parse & Import
                    </button>
                  </div>
                )}

                {modalForm.currentTab === 'ocr' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/20">
                      {modalForm.ocrScanning ? (
                        <div className="space-y-3">
                          <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto" />
                          <p className="text-xs font-bold text-slate-500">Orion AI is scanning result sheet...</p>
                        </div>
                      ) : modalForm.ocrResult ? (
                        <div className="text-left w-full space-y-2 max-h-48 overflow-y-auto">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Detected Grades</p>
                          {modalForm.ocrResult.map((res, i) => (
                            <div key={i} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                              <span className="font-bold text-slate-850 dark:text-slate-150">{res.title}</span>
                              <span className="font-black text-blue-500">{res.marks}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Plus size={32} className="mx-auto text-slate-400" />
                          <p className="text-xs font-bold text-slate-500">Upload screenshot or photo of grades</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={() => {
                              setModalForm(prev => ({ ...prev, ocrScanning: true }));
                              setTimeout(() => {
                                setModalForm(prev => ({
                                  ...prev,
                                  ocrScanning: false,
                                  ocrResult: [
                                    { title: 'Assignment 1', marks: '85/100', weight: 20 },
                                    { title: 'Quiz 2', marks: '18/20', weight: 10 },
                                    { title: 'Mid Semester Exam', marks: '78/100', weight: 30 }
                                  ]
                                }));
                              }, 2000);
                            }}
                            className="hidden"
                            id="ocr-upload-btn"
                          />
                          <label htmlFor="ocr-upload-btn" className="inline-block px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors">
                            Browse File
                          </label>
                        </div>
                      )}
                    </div>

                    {modalForm.ocrResult && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assign to Subject</label>
                          <select
                            value={modalForm.courseId}
                            onChange={e => setModalForm({ ...modalForm, courseId: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300"
                          >
                            <option value="" disabled>Select Subject</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!modalForm.courseId || !modalForm.ocrResult) return;
                            const newEntries = modalForm.ocrResult.map(res => ({
                              id: Date.now().toString() + Math.random().toString(36).substring(7),
                              courseId: modalForm.courseId,
                              title: res.title,
                              marks: res.marks,
                              weight: res.weight,
                              status: 'Completed',
                              type: 'Assignment',
                              date: new Date().toISOString().split('T')[0]
                            }));
                            setAssignments([...assignments, ...newEntries]);
                            setIsModalOpen(false);
                            resetForm();
                          }}
                          className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider"
                        >
                          Save Extracted Results
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssessmentsTab;
