import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  BrainCircuit,
  Trash2,
  Edit3,
  Play,
  Share2,
  Tag,
  AlertCircle,
  Folder,
  ArrowRight,
  ChevronRight,
  ListPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { isCardDue, getDeckStats } from '../../utils/sm2';
import { generateStructuredFlashcards } from '../../services/aiService';

import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import StudySession from './components/StudySession';

const SAMPLE_DECKS = [
  {
    id: 'deck-sample-algorithms',
    title: 'Data Structures & Algorithms Core',
    description: 'Essential time complexities, tree traversals, and dynamic programming patterns.',
    category: 'Computer Science',
    color: '#0ea5e9',
    tags: ['algorithms', 'cs', 'interview'],
    createdAt: new Date().toISOString(),
    cards: [
      {
        id: 'card-1',
        front: 'What is the average and worst-case time complexity of QuickSort?',
        back: 'Average: O(n log n)\nWorst: O(n²) when pivot selection is poor (already sorted array with naive pivot).',
        hint: 'Think about unbalanced partitions vs balanced divide-and-conquer.',
        repetitions: 1,
        interval: 3,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        totalReviews: 2,
        successReviews: 2
      },
      {
        id: 'card-2',
        front: 'What property makes a Binary Search Tree (BST) valid?',
        back: 'For every node: all keys in the left subtree are strictly less, and all keys in the right subtree are strictly greater.',
        hint: 'In-order traversal produces a strictly sorted sequence.',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        totalReviews: 0,
        successReviews: 0
      },
      {
        id: 'card-3',
        front: 'Dijkstra\'s algorithm cannot handle which type of graph edges?',
        back: 'Negative edge weights. For negative weights, use the Bellman-Ford algorithm.',
        hint: 'Greedy choice property breaks if paths can become cheaper later.',
        repetitions: 2,
        interval: 6,
        easeFactor: 2.6,
        dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
        totalReviews: 2,
        successReviews: 2
      }
    ]
  },
  {
    id: 'deck-sample-webdev',
    title: 'Modern Frontend & React Concepts',
    description: 'Hooks lifecycle, reconciliation, virtual DOM, and memoization.',
    category: 'Web Development',
    color: '#8b5cf6',
    tags: ['react', 'javascript', 'frontend'],
    createdAt: new Date().toISOString(),
    cards: [
      {
        id: 'card-4',
        front: 'What is the difference between useMemo and useCallback?',
        back: 'useMemo caches the RESULT of a computation function.\nuseCallback caches the FUNCTION INSTANCE itself across renders.',
        hint: 'One memoizes values, the other memoizes callbacks.',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        totalReviews: 0,
        successReviews: 0
      }
    ]
  }
];

const Flashcards = () => {
  const [decks, setDecks] = useStorage(STORAGE_KEYS.FLASHCARDS, SAMPLE_DECKS);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeStudyDeck, setActiveStudyDeck] = useState(null);

  // Deck modal state
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);
  const [deckForm, setDeckForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    color: '#0ea5e9'
  });

  // Card editor modal state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedDeckForCard, setSelectedDeckForCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [cardForm, setCardForm] = useState({
    front: '',
    back: '',
    hint: ''
  });

  // AI Deck Generator Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [cardCount, setCardCount] = useState(5);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Confirm delete modal
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const stats = useMemo(() => getDeckStats(decks), [decks]);

  const categories = useMemo(() => {
    const set = new Set();
    decks.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return ['All', ...Array.from(set)];
  }, [decks]);

  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchSearch =
        deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deck.tags || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCategory === 'All' || deck.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [decks, searchTerm, selectedCategory]);

  // Handle SM-2 card updates
  const handleUpdateCard = (deckId, updatedCard) => {
    setDecks((prev) =>
      prev.map((d) => {
        if (d.id !== deckId) return d;
        const nextCards = (d.cards || []).map((c) => (c.id === updatedCard.id ? updatedCard : c));
        return { ...d, cards: nextCards };
      })
    );
  };

  // Create / Edit Deck
  const handleOpenDeckModal = (deck = null) => {
    if (deck) {
      setEditingDeck(deck);
      setDeckForm({
        title: deck.title,
        description: deck.description || '',
        category: deck.category || '',
        tags: (deck.tags || []).join(', '),
        color: deck.color || '#0ea5e9'
      });
    } else {
      setEditingDeck(null);
      setDeckForm({
        title: '',
        description: '',
        category: '',
        tags: '',
        color: '#0ea5e9'
      });
    }
    setIsDeckModalOpen(true);
  };

  const handleSaveDeck = (e) => {
    e.preventDefault();
    if (!deckForm.title.trim()) {
      toast.error('Deck title is required');
      return;
    }

    const tagsArray = deckForm.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (editingDeck) {
      setDecks((prev) =>
        prev.map((d) =>
          d.id === editingDeck.id
            ? {
                ...d,
                title: deckForm.title.trim(),
                description: deckForm.description.trim(),
                category: deckForm.category.trim() || 'General',
                tags: tagsArray,
                color: deckForm.color
              }
            : d
        )
      );
      toast.success('Deck updated');
    } else {
      const newDeck = {
        id: nanoid(),
        title: deckForm.title.trim(),
        description: deckForm.description.trim(),
        category: deckForm.category.trim() || 'General',
        tags: tagsArray,
        color: deckForm.color,
        createdAt: new Date().toISOString(),
        cards: []
      };
      setDecks((prev) => [newDeck, ...prev]);
      toast.success('New deck created');
    }

    setIsDeckModalOpen(false);
  };

  const handleDeleteDeck = (deck) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Deck',
      message: `Are you sure you want to delete "${deck.title}" and its ${deck.cards?.length || 0} card(s)?`,
      onConfirm: () => {
        setDecks((prev) => prev.filter((d) => d.id !== deck.id));
        toast.success('Deck deleted');
      }
    });
  };

  // Card Management
  const handleOpenCardModal = (deck, card = null) => {
    setSelectedDeckForCard(deck);
    if (card) {
      setEditingCard(card);
      setCardForm({
        front: card.front,
        back: card.back,
        hint: card.hint || ''
      });
    } else {
      setEditingCard(null);
      setCardForm({
        front: '',
        back: '',
        hint: ''
      });
    }
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (e) => {
    e.preventDefault();
    if (!cardForm.front.trim() || !cardForm.back.trim()) {
      toast.error('Both front concept and back answer are required');
      return;
    }

    setDecks((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDeckForCard.id) return d;
        let nextCards = d.cards || [];

        if (editingCard) {
          nextCards = nextCards.map((c) =>
            c.id === editingCard.id
              ? {
                  ...c,
                  front: cardForm.front.trim(),
                  back: cardForm.back.trim(),
                  hint: cardForm.hint.trim()
                }
              : c
          );
          toast.success('Card updated');
        } else {
          const newCard = {
            id: nanoid(),
            front: cardForm.front.trim(),
            back: cardForm.back.trim(),
            hint: cardForm.hint.trim(),
            repetitions: 0,
            interval: 1,
            easeFactor: 2.5,
            dueDate: new Date().toISOString(),
            totalReviews: 0,
            successReviews: 0
          };
          nextCards = [...nextCards, newCard];
          toast.success('Card added to deck');
        }
        return { ...d, cards: nextCards };
      })
    );

    setIsCardModalOpen(false);
  };

  // AI Flashcard Generation
  const handleGenerateAiDeck = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim() && !selectedNoteId) {
      toast.error('Please enter a topic or select a note to generate cards from');
      return;
    }

    setIsAiGenerating(true);
    const toastId = toast.loading('Orion AI is crafting high-yield flashcards...');

    try {
      let sourceText = '';
      let topicTitle = aiTopic.trim();

      if (selectedNoteId) {
        const note = notes.find((n) => n.id === selectedNoteId);
        if (note) {
          sourceText = `${note.title}\n\n${note.content || ''}`;
          if (!topicTitle) topicTitle = note.title;
        }
      }

      const generated = await generateStructuredFlashcards({
        topic: topicTitle,
        textContent: sourceText,
        count: Number(cardCount) || 5
      });

      if (!generated || generated.length === 0) {
        throw new Error('No flashcards could be generated from the given prompt.');
      }

      const newDeck = {
        id: nanoid(),
        title: topicTitle || 'AI Study Deck',
        description: `Generated by Orion AI (${generated.length} cards)`,
        category: 'AI Generated',
        color: '#6366f1',
        tags: ['ai-generated', 'recall'],
        createdAt: new Date().toISOString(),
        cards: generated.map((c) => ({
          id: nanoid(),
          front: c.front,
          back: c.back,
          hint: c.hint || '',
          repetitions: 0,
          interval: 1,
          easeFactor: 2.5,
          dueDate: new Date().toISOString(),
          totalReviews: 0,
          successReviews: 0
        }))
      };

      setDecks((prev) => [newDeck, ...prev]);
      toast.success(`Created deck "${newDeck.title}" with ${newDeck.cards.length} cards!`, { id: toastId });
      setIsAiModalOpen(false);
      setAiTopic('');
      setSelectedNoteId('');
    } catch (err) {
      console.error('[Flashcards] AI Generation error:', err);
      toast.error(err.message || 'Failed to generate flashcards', { id: toastId });
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Spaced Repetition Flashcards"
        description="Master complex concepts and retain knowledge with the SuperMemo SM-2 algorithm"
        icon={<BrainCircuit size={32} />}
        className="mb-8"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles size={18} />
              AI Generate
            </button>
            <button
              onClick={() => handleOpenDeckModal()}
              className="px-5 py-3 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              New Deck
            </button>
          </div>
        }
      />

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Cards', value: stats.totalCards, icon: Layers, tint: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Due For Review', value: stats.dueTodayCount, icon: Clock, tint: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Mastered (21d+)', value: stats.masteredCount, icon: CheckCircle2, tint: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Retention Rate', value: `${stats.retentionRate}%`, icon: Flame, tint: 'text-rose-500', bg: 'bg-rose-500/10' }
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

      {/* 3. Search & Action Section */}
      <div className="relative z-[90] mb-8">
        <div className="rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-4 md:p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-2xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search decks by title, description, or tags..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm focus:ring-4 ring-primary-500/10 outline-none transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Deck Grid */}
      {filteredDecks.length === 0 ? (
        <EmptyState
          title="No Decks Found"
          description="Create a new flashcard deck or generate one automatically with Orion AI."
          icon={Layers}
          actionLabel="Create Deck"
          onAction={() => handleOpenDeckModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const dueCount = (deck.cards || []).filter(isCardDue).length;
            const cardCount = deck.cards?.length || 0;
            const mastered = (deck.cards || []).filter((c) => (c.interval || 0) >= 21).length;
            const progress = cardCount > 0 ? Math.round((mastered / cardCount) * 100) : 0;

            return (
              <motion.div
                key={deck.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-[2rem] border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Tags & Action dropdown */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
                        {deck.category || 'General'}
                      </span>
                      {dueCount > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-amber-500/10 text-amber-500 flex items-center gap-1">
                          <Clock size={12} />
                          {dueCount} due
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          All caught up
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenCardModal(deck)}
                        title="Add Card"
                        className="p-2 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <ListPlus size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenDeckModal(deck)}
                        title="Edit Deck"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteDeck(deck)}
                        title="Delete Deck"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-1">
                    {deck.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {deck.description || 'No description provided.'}
                  </p>

                  {/* Tags */}
                  {deck.tags && deck.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                      {deck.tags.map((tag) => (
                        <span key={tag} className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Stats & Study Action */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                      <span>{cardCount} cards ({mastered} mastered)</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveStudyDeck(deck)}
                      disabled={cardCount === 0}
                      className="flex-1 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm shadow-md shadow-primary-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={16} fill="currentColor" />
                      {dueCount > 0 ? `Study ${dueCount} Due` : 'Review All'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Active Study Session Modal */}
      {activeStudyDeck && (
        <StudySession
          deck={activeStudyDeck}
          onClose={() => setActiveStudyDeck(null)}
          onComplete={() => {
            setActiveStudyDeck(null);
            toast.success('Study session complete!');
          }}
          onUpdateCard={handleUpdateCard}
        />
      )}

      {/* Deck Modal */}
      <AnimatePresence>
        {isDeckModalOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-6"
            >
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {editingDeck ? 'Edit Deck' : 'Create New Deck'}
              </h2>

              <form onSubmit={handleSaveDeck} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Deck Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems & Concurrency"
                    value={deckForm.title}
                    onChange={(e) => setDeckForm({ ...deckForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key concepts covered in this deck..."
                    value={deckForm.description}
                    onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={deckForm.category}
                      onChange={(e) => setDeckForm({ ...deckForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="exam, threads, lock"
                      value={deckForm.tags}
                      onChange={(e) => setDeckForm({ ...deckForm, tags: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDeckModalOpen(false)}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                  >
                    {editingDeck ? 'Save Changes' : 'Create Deck'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Card Modal */}
      <AnimatePresence>
        {isCardModalOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-6"
            >
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary-500">
                  {selectedDeckForCard?.title}
                </span>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {editingCard ? 'Edit Flashcard' : 'Add Flashcard'}
                </h2>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Front (Question or Concept) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. What is Amdahl\'s Law?"
                    value={cardForm.front}
                    onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Back (Answer & Explanation) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Predicts the theoretical speedup of latency with fixed workload using multiple processors."
                    value={cardForm.back}
                    onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Hint (Optional memory hook)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Diminishing returns in parallel computing."
                    value={cardForm.hint}
                    onChange={(e) => setCardForm({ ...cardForm, hint: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                  >
                    {editingCard ? 'Save Card' : 'Add Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Orion AI Deck Generator Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                    Orion AI Flashcard Generator
                  </h2>
                  <p className="text-xs text-slate-400">Generate high-yield active recall decks instantly</p>
                </div>
              </div>

              <form onSubmit={handleGenerateAiDeck} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Topic or Concept Prompt
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Consensus (Raft vs Paxos) or Cell Respiration"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20"
                  />
                </div>

                {notes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Or Generate from an Existing Note
                    </label>
                    <select
                      value={selectedNoteId}
                      onChange={(e) => setSelectedNoteId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20"
                    >
                      <option value="">-- Choose a note (optional) --</option>
                      {notes.map((note) => (
                        <option key={note.id} value={note.id}>
                          {note.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Number of Cards (3 - 10)
                  </label>
                  <div className="flex gap-2">
                    {[3, 5, 8, 10].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setCardCount(num)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          cardCount === num
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {num} Cards
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => setIsAiModalOpen(false)}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAiGenerating}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAiGenerating ? (
                      <>
                        <Sparkles className="animate-spin" size={18} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate Deck
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Flashcards;
