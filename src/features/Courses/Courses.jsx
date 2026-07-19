import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  ExternalLink,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  Archive,
  BarChart3,
  PlayCircle,
  StickyNote,
  Video,
  Flag,
  X,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { toggleSelectionId, toggleSelectAll, softArchiveByIds, restoreByIds, hardDeleteByIds } from '../../utils/entityOps';
import { courseCompletedNotification } from '../../utils/notificationBuilders';
import { useReminders } from '../../context/ReminderContext';

import CourseItem from './components/CourseItem';
import CourseFilter from './components/CourseFilter';
import CourseForm from './components/CourseForm';
import CourseDetailSidebar from './components/CourseDetailSidebar';
import ConfirmModal from '../../components/ConfirmModal';
import BulkActionBar from '../../components/BulkActionBar';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Select from '../../components/ui/Select';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const MODULE_STATUSES = ['Not Started', 'In Progress', 'Completed'];

const safeString = (value) => (typeof value === 'string' ? value : '');

const sanitizeUrl = (url) => {
  const value = safeString(url).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const parseTags = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
};

const timeToSeconds = (time) => {
  if (!time) return 0;
  const parts = String(time).split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

const secondsToClock = (totalSeconds) => {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const daysBetween = (a, b) => {
  if (!a || !b) return null;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
};

const createActivityEntry = (type, message) => ({
  id: nanoid(),
  type,
  message,
  createdAt: new Date().toISOString()
});

const normalizeModule = (module, index, courseId) => {
  const status = MODULE_STATUSES.includes(module?.status)
    ? module.status
    : module?.completed
      ? 'Completed'
      : 'Not Started';

  return {
    id: safeString(module?.id) || `${courseId || 'course'}-module-${index + 1}`,
    title: safeString(module?.title) || `Module ${index + 1}`,
    status,
    duration: safeString(module?.duration),
    completed: status === 'Completed',
    notesLink: safeString(module?.notesLink),
    resourceLink: safeString(module?.resourceLink),
    videoUrl: safeString(module?.videoUrl),
    notesIds: Array.isArray(module?.notesIds) ? module.notesIds : [],
    resourceIds: Array.isArray(module?.resourceIds) ? module.resourceIds : []
  };
};

const normalizeCourseModel = (course) => {
  const id = safeString(course?.id) || nanoid();
  const modules = Array.isArray(course?.modules)
    ? course.modules.map((module, index) => normalizeModule(module, index, id))
    : [];

  const completedModules = modules.filter((module) => module.status === 'Completed').length;
  const totalModules = modules.length || Math.max(1, Number(course?.moduleTracking?.total || 1));

  const trackingType = ['percentage', 'time', 'modules'].includes(course?.trackingType)
    ? course.trackingType
    : 'percentage';

  const timeTracking = {
    current: safeString(course?.timeTracking?.current) || '00:00:00',
    total: safeString(course?.timeTracking?.total) || '00:00:00'
  };

  const moduleTracking = {
    completed: modules.length ? completedModules : Math.max(0, Number(course?.moduleTracking?.completed || 0)),
    total: modules.length ? Math.max(1, modules.length) : totalModules
  };

  let progress = Math.max(0, Math.min(100, Number(course?.progress || 0)));

  if (trackingType === 'time') {
    const currentSeconds = timeToSeconds(timeTracking.current);
    const totalSeconds = timeToSeconds(timeTracking.total);
    progress = totalSeconds > 0 ? Math.round((currentSeconds / totalSeconds) * 100) : 0;
  }

  if (trackingType === 'modules') {
    progress = moduleTracking.total > 0 ? Math.round((moduleTracking.completed / moduleTracking.total) * 100) : 0;
  }

  return {
    id,
    title: safeString(course?.title),
    platform: safeString(course?.platform),
    category: safeString(course?.category),
    difficulty: DIFFICULTIES.includes(course?.difficulty) ? course.difficulty : 'Beginner',
    priority: PRIORITIES.includes(course?.priority) ? course.priority : 'Medium',
    status: ['Active', 'Paused', 'Completed'].includes(course?.status) ? course.status : 'Active',
    courseHours: safeString(course?.courseHours),
    trackingType,
    progress,
    tags: parseTags(course?.tags),
    courseUrl: safeString(course?.courseUrl),
    certificateUrl: safeString(course?.certificateUrl),
    playlistUrl: safeString(course?.playlistUrl),
    startDate: safeString(course?.startDate),
    targetDate: safeString(course?.targetDate),
    examDate: safeString(course?.examDate),
    certificateDeadline: safeString(course?.certificateDeadline),
    modules,
    linkedNoteIds: Array.isArray(course?.linkedNoteIds) ? course.linkedNoteIds : [],
    linkedResourceIds: Array.isArray(course?.linkedResourceIds) ? course.linkedResourceIds : [],
    linkedAssignmentIds: Array.isArray(course?.linkedAssignmentIds) ? course.linkedAssignmentIds : [],
    linkedVideoIds: Array.isArray(course?.linkedVideoIds) ? course.linkedVideoIds : [],
    timeTracking,
    moduleTracking,
    activityLog: Array.isArray(course?.activityLog) ? course.activityLog : [],
    syllabus: safeString(course?.syllabus),
    archived: Boolean(course?.archived),
    createdAt: safeString(course?.createdAt),
    updatedAt: safeString(course?.updatedAt)
  };
};

const appendActivity = (course, entry) => ({
  ...course,
  activityLog: [entry, ...(course.activityLog || [])].slice(0, 80)
});

const getPriorityWeight = (priority) => {
  if (priority === 'Critical') return 4;
  if (priority === 'High') return 3;
  if (priority === 'Medium') return 2;
  return 1;
};

const Courses = () => {
  const [courses, setCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const { addNotification } = useReminders();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');

  const [editingCourse, setEditingCourse] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '', title: '' });
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkStatus, setBulkStatus] = useState('Active');
  const [bulkPriority, setBulkPriority] = useState('Medium');

  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [showArchived, setShowArchived] = useState(false);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(true);

  const [moduleDraft, setModuleDraft] = useState({ title: '', duration: '', notesLink: '', resourceLink: '', videoUrl: '' });
  const [todayReference] = useState(() => new Date());

  const nowRef = useRef(0);
  const [studyTimer, setStudyTimer] = useState({ isRunning: false, seconds: 0, startTime: null, course: null });

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    setVisibleCount(12); // Reset when filters change
  }, [searchTerm, filterStatus, filterCategory, filterDifficulty, sortBy, viewMode, showArchived]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    setCourses((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      // We will save the order explicitly
      return newItems.map((item, index) => ({ ...item, order: index }));
    });
  };

  useEffect(() => {
    nowRef.current = Date.now();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setShowInitialSkeleton(false), 450);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let interval;
    if (studyTimer.isRunning) {
      interval = setInterval(() => {
        setStudyTimer((prev) => ({ ...prev, seconds: Math.floor((Date.now() - prev.startTime) / 1000) }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [studyTimer.isRunning]);

  useEffect(() => {
    setCourses((prev) => {
      if (!Array.isArray(prev)) return prev;
      let changed = false;
      const normalized = prev.map((course) => {
        const next = normalizeCourseModel(course);
        const missing =
          course.priority === undefined ||
          course.courseUrl === undefined ||
          course.modules === undefined ||
          course.activityLog === undefined ||
          course.linkedVideoIds === undefined ||
          course.startDate === undefined;
        if (missing) changed = true;
        return missing ? next : course;
      });
      return changed ? normalized : prev;
    });
  }, [setCourses]);

  const getDefaultFormData = () => ({
    title: '',
    platform: '',
    category: '',
    difficulty: 'Beginner',
    priority: 'Medium',
    status: 'Active',
    courseHours: '',
    trackingType: 'percentage',
    progress: 0,
    tags: '',
    courseUrl: '',
    playlistUrl: '',
    certificateUrl: '',
    startDate: '',
    targetDate: '',
    examDate: '',
    certificateDeadline: '',
    modules: [],
    linkedNoteIds: [],
    linkedResourceIds: [],
    linkedAssignmentIds: [],
    linkedVideoIds: [],
    timeTracking: { current: '00:00:00', total: '00:00:00' },
    moduleTracking: { total: 1, completed: 0 },
    activityLog: [],
    syllabus: '',
    archived: false
  });

  const [formData, setFormData] = useState(getDefaultFormData());

  const normalizedCourses = useMemo(
    () => (Array.isArray(courses) ? courses.map((course) => normalizeCourseModel(course)) : []),
    [courses]
  );

  const deriveHealth = (course, expectedProgress, daysLeft) => {
    if (course.status === 'Completed') return 'Completed';
    if (course.status === 'Paused') return 'Paused';
    if (daysLeft !== null && daysLeft < 0) return 'At Risk';
    if (daysLeft !== null && daysLeft <= 7 && course.progress + 10 < expectedProgress) return 'At Risk';
    if (course.progress + 6 < expectedProgress) return 'Behind';
    return 'On Track';
  };

  const getCourseMeta = useCallback((course) => {
    const courseAssignments = assignments.filter((assignment) => assignment.courseId === course.id);
    const courseNotes = notes.filter((note) => note.courseId === course.id || note.subject === course.title);
    const courseResources = resources.filter((resource) => resource.associatedType === 'Course' && resource.associatedId === course.id);
    const courseVideos = videos.filter((video) => video.courseId === course.id);

    const moduleTotal = course.modules.length || Math.max(1, Number(course.moduleTracking?.total || 1));
    const moduleCompleted = course.modules.length
      ? course.modules.filter((module) => module.status === 'Completed').length
      : Math.max(0, Number(course.moduleTracking?.completed || 0));

    const targetDate = parseDate(course.targetDate);
    const startDate = parseDate(course.startDate);
    const totalDays = startDate && targetDate ? Math.max(1, daysBetween(startDate, targetDate)) : null;
    const elapsedDays = startDate && totalDays ? Math.max(0, daysBetween(startDate, todayReference)) : null;
    const expectedProgress = totalDays !== null && elapsedDays !== null
      ? Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)))
      : course.progress;

    const daysLeft = targetDate ? daysBetween(todayReference, targetDate) : null;

    let scheduleLabel = '';
    if (daysLeft !== null) {
      if (course.status === 'Completed') {
        scheduleLabel = daysLeft >= 0 ? 'Completed early' : 'Completed late';
      } else if (daysLeft < 0) {
        scheduleLabel = `${Math.abs(daysLeft)}d overdue`;
      } else if (daysLeft === 0) {
        scheduleLabel = 'Due today';
      } else if (daysLeft <= 7) {
        scheduleLabel = `Due in ${daysLeft}d`;
      }
    }

    const health = deriveHealth(course, expectedProgress, daysLeft);

    const nextPendingModule = (course.modules || []).find((module) => module.status !== 'Completed');
    const nextAssignment = courseAssignments
      .filter((assignment) => assignment.status !== 'Submitted' && assignment.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0] || null;

    let nextAction = 'Add modules or resources to keep this course moving.';
    if (course.status === 'Paused') {
      nextAction = 'Resume this course to maintain momentum.';
    } else if (nextAssignment) {
      nextAction = `Finish assignment: ${nextAssignment.title || 'Untitled'}.`;
    } else if (nextPendingModule) {
      nextAction = `Continue module: ${nextPendingModule.title}.`;
    } else if (course.playlistUrl || course.courseUrl) {
      nextAction = 'Open your course link and continue learning.';
    }

    return {
      assignmentCount: courseAssignments.length,
      noteCount: courseNotes.length,
      resourceCount: courseResources.length,
      videoCount: courseVideos.length,
      moduleTotal,
      moduleCompleted,
      health,
      scheduleLabel,
      expectedProgress,
      daysLeft,
      nextAction,
      nextPendingModule,
      nextAssignment,
      courseAssignments,
      courseNotes,
      courseResources,
      courseVideos
    };
  }, [assignments, notes, resources, videos, todayReference]);

  const courseMetaById = useMemo(() => {
    const map = {};
    normalizedCourses.forEach((course) => {
      map[course.id] = getCourseMeta(course);
    });
    return map;
  }, [normalizedCourses, getCourseMeta]);

  const availableCategories = useMemo(
    () => [...new Set(normalizedCourses.map((course) => course.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [normalizedCourses]
  );

  const availableDifficulties = useMemo(
    () => [...new Set(normalizedCourses.map((course) => course.difficulty).filter(Boolean))],
    [normalizedCourses]
  );

  const filteredAndSortedCourses = useMemo(() => {
    const result = normalizedCourses.filter((course) => {
      const query = searchTerm.toLowerCase();
      const isArchived = course.archived === true;
      if (filterStatus === 'Archived' && !isArchived) return false;
      if (filterStatus !== 'Archived' && !showArchived && isArchived) return false;

      const matchesSearch =
        course.title.toLowerCase().includes(query) ||
        course.platform.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query) ||
        (course.tags || []).some((tag) => tag.toLowerCase().includes(query));

      const matchesStatus = filterStatus === 'All'
        ? true
        : filterStatus === 'Archived'
          ? isArchived
          : course.status === filterStatus;

      const matchesCategory = filterCategory === 'All' ? true : course.category === filterCategory;
      const matchesDifficulty = filterDifficulty === 'All' ? true : course.difficulty === filterDifficulty;

      return matchesSearch && matchesStatus && matchesCategory && matchesDifficulty;
    });

    return result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform);
      if (sortBy === 'priority') return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (sortBy === 'updated') return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      if (sortBy === 'custom') {
        return (a.order ?? 0) - (b.order ?? 0);
      }
      return 0;
    });
  }, [normalizedCourses, searchTerm, filterStatus, showArchived, filterCategory, filterDifficulty, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = { All: normalizedCourses.length, Active: 0, Paused: 0, Completed: 0, Archived: 0 };
    normalizedCourses.forEach((course) => {
      if (course.archived) counts.Archived += 1;
      if (counts[course.status] !== undefined) counts[course.status] += 1;
    });
    return counts;
  }, [normalizedCourses]);

  const courseStats = useMemo(() => {
    const active = normalizedCourses.filter((course) => course.status === 'Active' && !course.archived).length;
    const completed = normalizedCourses.filter((course) => course.status === 'Completed' && !course.archived).length;
    const archived = normalizedCourses.filter((course) => course.archived).length;
    const progressPool = normalizedCourses.filter((course) => !course.archived);
    const avgProgress = progressPool.length
      ? Math.round(progressPool.reduce((sum, course) => sum + Number(course.progress || 0), 0) / progressPool.length)
      : 0;
    const studyHours = normalizedCourses.reduce((sum, course) => sum + (timeToSeconds(course.timeTracking?.current) / 3600), 0);
    return { active, completed, archived, avgProgress, studyHours: Number(studyHours.toFixed(1)) };
  }, [normalizedCourses]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    filterStatus !== 'All' ||
    filterCategory !== 'All' ||
    filterDifficulty !== 'All' ||
    showArchived;

  const persistCourseMutation = (courseId, mutator) => {
    const timestamp = new Date().toISOString();
    setCourses((prev) => prev.map((item) => {
      if (item.id !== courseId) return item;
      const normalized = normalizeCourseModel(item);
      const mutated = mutator(normalized);
      return normalizeCourseModel({ ...mutated, updatedAt: timestamp });
    }));

    setSelectedCourseDetail((prev) => {
      if (!prev || prev.id !== courseId) return prev;
      const normalized = normalizeCourseModel(prev);
      const mutated = mutator(normalized);
      return normalizeCourseModel({ ...mutated, updatedAt: timestamp });
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const title = safeString(formData.title).trim();
    const platform = safeString(formData.platform).trim();
    const category = safeString(formData.category).trim();
    const difficulty = safeString(formData.difficulty || 'Beginner').trim();
    const status = safeString(formData.status || 'Active').trim();
    const trackingType = safeString(formData.trackingType || 'percentage').trim();
    const priority = safeString(formData.priority || 'Medium').trim();

    if (!title || title.length < 3) {
      toast.error('Course title should be at least 3 characters');
      return;
    }

    if (!platform) {
      toast.error('Platform is required');
      return;
    }

    if (!category) {
      toast.error('Category is required');
      return;
    }

    const isDuplicate = normalizedCourses.some((course) => {
      if (editingCourse && course.id === editingCourse.id) return false;
      return course.title.trim().toLowerCase() === title.toLowerCase() && course.platform.trim().toLowerCase() === platform.toLowerCase();
    });

    if (isDuplicate) {
      toast.error('A course with the same title + platform already exists');
      return;
    }

    const validateTime = (time) => /^\d{1,3}:[0-5]\d:[0-5]\d$/.test(String(time || '00:00:00').trim());

    if (trackingType === 'time') {
      if (!validateTime(formData.timeTracking?.current) || !validateTime(formData.timeTracking?.total)) {
        toast.error('Time format must be HH:MM:SS (e.g. 12:30:00)');
        return;
      }
    }

    const now = new Date().toISOString();
    const tags = parseTags(formData.tags);

    const existingModules = Array.isArray(formData.modules)
      ? formData.modules.map((module, index) => normalizeModule(module, index, editingCourse?.id || 'course'))
      : [];

    const courseBase = normalizeCourseModel({
      ...formData,
      title,
      platform,
      category,
      difficulty,
      status,
      priority,
      trackingType,
      tags,
      courseUrl: sanitizeUrl(formData.courseUrl),
      playlistUrl: sanitizeUrl(formData.playlistUrl),
      certificateUrl: sanitizeUrl(formData.certificateUrl),
      syllabus: safeString(formData.syllabus),
      modules: existingModules,
      archived: Boolean(formData.archived),
      updatedAt: now
    });

    if (editingCourse) {
      const next = appendActivity(courseBase, createActivityEntry('updated', 'Course details updated'));
      setCourses((prev) => prev.map((course) => (course.id === editingCourse.id ? { ...next, id: editingCourse.id } : course)));
      setSelectedCourseDetail((prev) => (prev?.id === editingCourse.id ? { ...next, id: editingCourse.id } : prev));
      toast.success('Course updated');

      if (editingCourse.status !== 'Completed' && next.status === 'Completed') {
        addNotification(courseCompletedNotification(next.title));
      }
    } else {
      const created = appendActivity(
        { ...courseBase, id: nanoid(), createdAt: now, updatedAt: now },
        createActivityEntry('created', 'Course created')
      );
      setCourses((prev) => [created, ...prev]);
      toast.success('Course created');

      if (created.status === 'Completed') {
        addNotification(courseCompletedNotification(created.title));
      }
    }

    setIsModalOpen(false);
    setEditingCourse(null);
    setFormData(getDefaultFormData());
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData(getDefaultFormData());
    setIsModalOpen(true);
  };

  const handleEdit = (course) => {
    const normalized = normalizeCourseModel(course);
    setEditingCourse(normalized);
    setFormData({
      ...normalized,
      tags: normalized.tags.join(', '),
      modules: normalized.modules,
      trackingType: normalized.trackingType,
      timeTracking: normalized.timeTracking,
      moduleTracking: normalized.moduleTracking
    });
    setIsModalOpen(true);
  };

  const toggleCourseSelection = (courseId) => {
    setSelectedCourseIds((prev) => toggleSelectionId(prev, courseId));
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredAndSortedCourses.map((course) => course.id);
    setSelectedCourseIds((prev) => toggleSelectAll(prev, visibleIds));
  };

  const clearSelection = () => setSelectedCourseIds([]);

  const applyBulkStatus = () => {
    if (!selectedCourseIds.length) return;
    const selected = new Set(selectedCourseIds);
    setCourses((prev) => prev.map((course) => {
      if (!selected.has(course.id)) return course;
      const normalized = normalizeCourseModel(course);
      return appendActivity(
        { ...normalized, status: bulkStatus, archived: false, updatedAt: new Date().toISOString() },
        createActivityEntry('status', `Status changed to ${bulkStatus}`)
      );
    }));
    toast.success(`Updated ${selectedCourseIds.length} course(s)`);
    clearSelection();
  };

  const applyBulkPriority = () => {
    if (!selectedCourseIds.length) return;
    const selected = new Set(selectedCourseIds);
    setCourses((prev) => prev.map((course) => {
      if (!selected.has(course.id)) return course;
      const normalized = normalizeCourseModel(course);
      return appendActivity(
        { ...normalized, priority: bulkPriority, updatedAt: new Date().toISOString() },
        createActivityEntry('priority', `Priority set to ${bulkPriority}`)
      );
    }));
    toast.success(`Updated priority for ${selectedCourseIds.length} course(s)`);
  };

  const applyBulkTag = () => {
    const tag = bulkTagInput.trim().toLowerCase();
    if (!selectedCourseIds.length || !tag) return;
    const selected = new Set(selectedCourseIds);
    setCourses((prev) => prev.map((course) => {
      if (!selected.has(course.id)) return course;
      const normalized = normalizeCourseModel(course);
      const tags = Array.isArray(normalized.tags) ? normalized.tags : [];
      const nextTags = tags.includes(tag) ? tags : [...tags, tag];
      return appendActivity(
        { ...normalized, tags: nextTags, updatedAt: new Date().toISOString() },
        createActivityEntry('tag', `Tag added: ${tag}`)
      );
    }));
    toast.success(`Tagged ${selectedCourseIds.length} course(s)`);
    setBulkTagInput('');
  };

  const applyBulkArchive = () => {
    if (!selectedCourseIds.length) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Archive Courses',
      message: `Archive ${selectedCourseIds.length} selected course(s)?`,
      onConfirm: () => {
        setCourses((prev) => softArchiveByIds(prev, selectedCourseIds));
        toast.success('Courses archived');
        clearSelection();
      }
    });
  };

  const applyBulkRestore = () => {
    if (!selectedCourseIds.length) return;
    setCourses((prev) => restoreByIds(prev, selectedCourseIds));
    toast.success(`Restored ${selectedCourseIds.length} course(s)`);
    clearSelection();
  };

  const applyBulkHardDelete = () => {
    if (!selectedCourseIds.length) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Permanently',
      message: `Permanently delete ${selectedCourseIds.length} selected course(s)? This cannot be undone.`,
      onConfirm: () => {
        setCourses((prev) => hardDeleteByIds(prev, selectedCourseIds));
        toast.success('Courses deleted permanently');
        clearSelection();
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Course',
      message: 'Permanently delete this course? This cannot be undone.',
      onConfirm: () => {
        setCourses((prev) => hardDeleteByIds(prev, [id]));
        toast.success('Course deleted permanently');
      }
    });
  };

  const handleToggleArchive = (course) => {
    const nextArchived = !(course.archived === true);
    persistCourseMutation(course.id, (current) =>
      appendActivity(
        { ...current, archived: nextArchived },
        createActivityEntry(nextArchived ? 'archived' : 'restored', nextArchived ? 'Course archived' : 'Course restored')
      )
    );
    toast.success(nextArchived ? 'Course archived' : 'Course restored');
  };

  const openCourseDetail = (course, tab = 'overview') => {
    const normalized = normalizeCourseModel(course);
    setSelectedCourseDetail(normalized);
    setDetailTab(tab);
    setModuleDraft({ title: '', duration: '', notesLink: '', resourceLink: '', videoUrl: '' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setFilterCategory('All');
    setFilterDifficulty('All');
    setShowArchived(false);
    setSortBy('updated');
  };

  const handleResetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Knowledge Base',
      message: 'Reset knowledge base to defaults? Current progress will be overwritten.',
      onConfirm: () => {
        const defaults = [
          normalizeCourseModel({
            id: nanoid(),
            title: 'Fullstack Web Development',
            platform: 'Udemy',
            category: 'Development',
            difficulty: 'Intermediate',
            priority: 'High',
            tags: ['React', 'Node', 'Database'],
            progress: 45,
            status: 'Active',
            trackingType: 'modules',
            modules: [
              { id: nanoid(), title: 'Intro & Setup', status: 'Completed', completed: true, duration: '45m' },
              { id: nanoid(), title: 'React Components', status: 'Completed', completed: true, duration: '2h' },
              { id: nanoid(), title: 'State Management', status: 'In Progress', completed: false, duration: '3h' },
              { id: nanoid(), title: 'API Integration', status: 'Not Started', completed: false, duration: '2h' }
            ],
            courseUrl: 'https://www.udemy.com/',
            startDate: new Date().toISOString().slice(0, 10),
            targetDate: '',
            timeTracking: { current: '10:00:00', total: '22:00:00' }
          }),
          normalizeCourseModel({
            id: nanoid(),
            title: 'Cloud Security Essentials',
            platform: 'AWS Skill Builder',
            category: 'Cloud',
            difficulty: 'Beginner',
            priority: 'Medium',
            tags: ['AWS', 'Security'],
            progress: 20,
            status: 'Active',
            trackingType: 'percentage',
            courseUrl: 'https://skillbuilder.aws/',
            startDate: '',
            targetDate: '',
            timeTracking: { current: '02:30:00', total: '12:00:00' }
          })
        ];
        setCourses(defaults);
        toast.success('Knowledge base reset');
      }
    });
  };

  const toggleStudySession = (courseToStart = null) => {
    if (studyTimer.isRunning) {
      const elapsed = studyTimer.seconds;
      const runningCourse = studyTimer.course;

      if (elapsed > 60 && runningCourse) {
        const currentSeconds = timeToSeconds(runningCourse.timeTracking?.current || '00:00:00');
        const newCurrent = secondsToClock(currentSeconds + elapsed);

        persistCourseMutation(runningCourse.id, (current) => {
          const next = {
            ...current,
            timeTracking: { ...current.timeTracking, current: newCurrent }
          };
          return appendActivity(next, createActivityEntry('study', `Study session logged (${Math.round(elapsed / 60)} min)`));
        });

        toast.success(`Added ${Math.round(elapsed / 60)} minutes to ${runningCourse.title}`);
      } else {
        toast.success('Session ended (under 1 min, not saved).');
      }

      setStudyTimer({ isRunning: false, seconds: 0, startTime: null, course: null });
      return;
    }

    if (courseToStart) {
      setStudyTimer({ isRunning: true, seconds: 0, startTime: nowRef.current, course: courseToStart });
      persistCourseMutation(courseToStart.id, (current) =>
        appendActivity(current, createActivityEntry('study', 'Study session started'))
      );
      toast.success(`Study session started for ${courseToStart.title}`);
    }
  };

  const addModuleToSelectedCourse = () => {
    if (!selectedCourseDetail) return;
    const title = moduleDraft.title.trim();
    if (!title) {
      toast.error('Module title is required');
      return;
    }

    const newModule = normalizeModule(
      {
        id: nanoid(),
        title,
        duration: moduleDraft.duration,
        notesLink: sanitizeUrl(moduleDraft.notesLink),
        resourceLink: sanitizeUrl(moduleDraft.resourceLink),
        videoUrl: sanitizeUrl(moduleDraft.videoUrl),
        status: 'Not Started',
        completed: false
      },
      (selectedCourseDetail.modules || []).length,
      selectedCourseDetail.id
    );

    persistCourseMutation(selectedCourseDetail.id, (current) => {
      const nextModules = [...(current.modules || []), newModule];
      return appendActivity({ ...current, modules: nextModules }, createActivityEntry('module', `Module added: ${newModule.title}`));
    });

    setModuleDraft({ title: '', duration: '', notesLink: '', resourceLink: '', videoUrl: '' });
    toast.success('Module added');
  };

  const updateModuleInSelectedCourse = (moduleId, updater, message) => {
    if (!selectedCourseDetail) return;

    persistCourseMutation(selectedCourseDetail.id, (current) => {
      const nextModules = (current.modules || []).map((module) => {
        if (module.id !== moduleId) return module;
        const nextModule = updater(module);
        return normalizeModule(nextModule, 0, current.id);
      });
      return appendActivity({ ...current, modules: nextModules }, createActivityEntry('module', message));
    });
  };

  const removeModuleFromSelectedCourse = (moduleId) => {
    if (!selectedCourseDetail) return;

    persistCourseMutation(selectedCourseDetail.id, (current) => {
      const target = (current.modules || []).find((module) => module.id === moduleId);
      const nextModules = (current.modules || []).filter((module) => module.id !== moduleId);
      return appendActivity(
        { ...current, modules: nextModules },
        createActivityEntry('module', `Module removed: ${target?.title || 'Untitled module'}`)
      );
    });

    toast.success('Module removed');
  };

  const resolveContinueTarget = (course) => {
    const meta = courseMetaById[course.id] || {};

    const pendingModule = meta.nextPendingModule;
    if (pendingModule?.videoUrl) return { type: 'url', url: pendingModule.videoUrl };
    if (pendingModule?.resourceLink) return { type: 'url', url: pendingModule.resourceLink };
    if (pendingModule?.notesLink) return { type: 'url', url: pendingModule.notesLink };

    const recentVideo = (meta.courseVideos || [])
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];

    if (recentVideo?.url) return { type: 'url', url: recentVideo.url };
    if (course.playlistUrl) return { type: 'url', url: course.playlistUrl };
    if (course.courseUrl) return { type: 'url', url: course.courseUrl };

    return { type: 'detail', tab: pendingModule ? 'modules' : 'overview' };
  };

  const handleContinueCourse = (course) => {
    const target = resolveContinueTarget(course);
    if (target.type === 'url' && target.url) {
      window.open(target.url, '_blank', 'noopener,noreferrer');
      persistCourseMutation(course.id, (current) =>
        appendActivity(current, createActivityEntry('continue', 'Continue action launched external resource'))
      );
      return;
    }

    openCourseDetail(course, target.tab || 'overview');
  };

  const applyCourseTemplate = (template) => {
    setEditingCourse(null);
    setFormData({
      ...getDefaultFormData(),
      title: template.title,
      platform: template.platform,
      category: template.category,
      difficulty: template.difficulty,
      priority: template.priority || 'Medium',
      tags: template.tags.join(', '),
      trackingType: 'modules',
      modules: template.modules || []
    });
    setIsModalOpen(true);
  };

  const recommendedTemplates = [
    {
      title: 'React Basics',
      platform: 'YouTube',
      category: 'Development',
      difficulty: 'Beginner',
      priority: 'High',
      tags: ['react', 'frontend', 'javascript'],
      modules: [
        { id: nanoid(), title: 'Introduction', status: 'Completed', completed: true, duration: '20m' },
        { id: nanoid(), title: 'Components', status: 'Completed', completed: true, duration: '40m' },
        { id: nanoid(), title: 'Props', status: 'Not Started', completed: false, duration: '35m' }
      ]
    },
    {
      title: 'Statistics Foundations',
      platform: 'Coursera',
      category: 'Mathematics',
      difficulty: 'Intermediate',
      priority: 'Medium',
      tags: ['statistics', 'data', 'analysis']
    },
    {
      title: 'Cloud Security Essentials',
      platform: 'AWS Skill Builder',
      category: 'Cloud',
      difficulty: 'Beginner',
      priority: 'Critical',
      tags: ['cloud', 'security', 'devops']
    }
  ];

  const selectedDetailMeta = selectedCourseDetail ? courseMetaById[selectedCourseDetail.id] : null;

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12">
      <PageHeader
        title="Learning Streams"
        description="Manage your courses as a focused learning hub"
        icon={<BookOpen size={32} />}
        className="mb-8"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Courses', value: normalizedCourses.length, icon: BookOpen, tint: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Active', value: courseStats.active, icon: PlayCircle, tint: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Completed', value: courseStats.completed, icon: CheckCircle2, tint: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Avg Progress', value: `${courseStats.avgProgress}%`, icon: BarChart3, tint: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'Study Hours', value: `${courseStats.studyHours}h`, icon: Clock, tint: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <CourseFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onReset={handleResetData}
        onAdd={openCreateModal}
        courseCount={filteredAndSortedCourses.length}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        statusCounts={statusCounts}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterDifficulty={filterDifficulty}
        setFilterDifficulty={setFilterDifficulty}
        availableCategories={availableCategories}
        availableDifficulties={availableDifficulties}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {selectedCourseIds.length > 0 && (
        <BulkActionBar selectedCount={selectedCourseIds.length} onSelectVisible={toggleSelectAllVisible} onClear={clearSelection} className="mb-6">
          <Select variant="ghost" value={bulkStatus} onChange={(val) => setBulkStatus(val)} options={[
            { label: 'Active', value: 'Active' },
            { label: 'Paused', value: 'Paused' },
            { label: 'Completed', value: 'Completed' }
          ]} />
          <button onClick={applyBulkStatus} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">Set status</button>

          <Select variant="ghost" value={bulkPriority} onChange={(val) => setBulkPriority(val)} options={PRIORITIES.map((priority) => ({ label: priority, value: priority }))} />
          <button onClick={applyBulkPriority} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-100 text-violet-700">Set priority</button>

          <input value={bulkTagInput} onChange={(e) => setBulkTagInput(e.target.value)} placeholder="tag" className="px-2 py-1 rounded-lg text-xs w-28" />
          <button onClick={applyBulkTag} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700">Add tag</button>

          <button onClick={applyBulkRestore} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">Restore</button>
          <button onClick={applyBulkArchive} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">Archive</button>
          <button onClick={applyBulkHardDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white">Hard delete</button>
        </BulkActionBar>
      )}

      {viewMode === 'grid' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredAndSortedCourses.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' }}>
              <AnimatePresence mode="popLayout">
                {filteredAndSortedCourses.slice(0, visibleCount).map((course) => (
                  <CourseItem
                    key={course.id}
                    course={course}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleArchive={handleToggleArchive}
                    onViewResources={(target) => openCourseDetail(target, 'resources')}
                    onOpenDetail={(target) => openCourseDetail(target, 'overview')}
                    onContinue={handleContinueCourse}
                    assignments={assignments}
                    meta={courseMetaById[course.id] || {}}
                    selected={selectedCourseIds.includes(course.id)}
                    onToggleSelect={toggleCourseSelection}
                  />
                ))}
              </AnimatePresence>

              {showInitialSkeleton && normalizedCourses.length === 0 &&
                [...Array(3)].map((_, index) => (
                  <div key={`skeleton-${index}`} className="rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse">
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
                    <div className="h-7 w-3/4 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
                    <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800 mb-6" />
                    <div className="h-20 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5" />
                    <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800 mb-3" />
                    <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
            </div>
            
            {visibleCount < filteredAndSortedCourses.length && (
              <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center mt-6">
                <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              </div>
            )}
          </SortableContext>
        </DndContext>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Sel</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCourses.slice(0, visibleCount).map((course) => {
                const meta = courseMetaById[course.id] || {};
                const targetDate = parseDate(course.targetDate);
                return (
                  <tr key={course.id} className="border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(course.id)}
                        onChange={() => toggleCourseSelection(course.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold">{course.title}</td>
                    <td className="px-4 py-3">{course.platform}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500" style={{ width: `${course.progress}%` }} />
                        </div>
                        <span className="text-xs font-black text-primary-500">{course.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{course.status}</td>
                    <td className="px-4 py-3">{course.priority}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {targetDate ? targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No target'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleContinueCourse(course)} className="px-2.5 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold">Continue</button>
                        <button onClick={() => openCourseDetail(course)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">Details</button>
                        {meta.nextAssignment?.deadline && (
                          <span className="text-[10px] font-black text-amber-500">{meta.scheduleLabel}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {visibleCount < filteredAndSortedCourses.length && (
            <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center border-t border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      )}

      {!showInitialSkeleton && filteredAndSortedCourses.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <EmptyState
            icon={<BookOpen size={48} className="text-slate-200 dark:text-slate-700" />}
            title={hasActiveFilters ? 'No Streams Match Your Filters' : 'No Streams Found'}
            description={hasActiveFilters
              ? 'Try clearing filters or search to reveal more courses.'
              : 'Launch a new course or use a template to start your learning map.'}
            actions={(
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={openCreateModal} className="px-8 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all active:scale-95">
                  Start Your First Path
                </button>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black transition-all active:scale-95">
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          />
        </motion.div>
      )}

      {filteredAndSortedCourses.length > 0 && filteredAndSortedCourses.length < 3 && !searchTerm.trim() && filterStatus !== 'Archived' && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Suggested Next Courses</h3>
            <p className="text-xs font-semibold text-slate-400">One-click templates</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendedTemplates.map((template) => (
              <div key={template.title} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <p className="text-sm font-black text-slate-800 dark:text-white">{template.title}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">{template.platform} - {template.difficulty}</p>
                <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                  {template.tags.map((tag) => (
                    <span key={`${template.title}-${tag}`} className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button onClick={() => applyCourseTemplate(template)} className="w-full px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-primary-500/10 text-primary-600 dark:text-primary-300 hover:bg-primary-500/20 transition-colors">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <CourseForm
            editingCourse={editingCourse}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={() => {
              setIsModalOpen(false);
              setEditingCourse(null);
              setFormData(getDefaultFormData());
            }}
          />
        )}
      </AnimatePresence>

      <CourseDetailSidebar
        selectedCourseDetail={selectedCourseDetail}
        selectedDetailMeta={selectedDetailMeta}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        handleContinueCourse={handleContinueCourse}
        studyTimer={studyTimer}
        toggleStudySession={toggleStudySession}
        handleEdit={handleEdit}
        setSelectedCourseDetail={setSelectedCourseDetail}
        updateModuleInSelectedCourse={updateModuleInSelectedCourse}
        removeModuleFromSelectedCourse={removeModuleFromSelectedCourse}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title={confirmConfig.title}
      />

      <AnimatePresence>
        {studyTimer.isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-slate-700 dark:border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center animate-pulse">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Session</p>
                <p className="text-sm font-bold truncate max-w-[150px]">{studyTimer.course?.title}</p>
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums tracking-tight">{secondsToClock(studyTimer.seconds)}</div>
            <button
              onClick={() => toggleStudySession()}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
            >
              End
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Courses;
