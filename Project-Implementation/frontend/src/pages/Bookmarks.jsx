import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Bookmark,
  BookmarkCheck,
  Trash2,
  Edit2,
  Save,
  BookOpen,
  ArrowRight,
  Tag,
  Search,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Bookmarks() {
  const { showToast } = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/library/bookmarks');
      if (res.data?.success) {
        setBookmarks(res.data.data.bookmarks || []);
      }
    } catch (err) {
      showToast('Failed to load bookmarks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (bookmarkId) => {
    try {
      await api.delete(`/library/bookmarks/${bookmarkId}`);
      showToast('Bookmark removed', 'success');
      setBookmarks((prev) => prev.filter((b) => b._id !== bookmarkId));
    } catch (err) {
      showToast('Failed to remove bookmark', 'error');
    }
  };

  const handleStartEditNote = (bookmark) => {
    setEditingNoteId(bookmark._id);
    setNoteText(bookmark.notes || '');
  };

  const handleSaveNote = async (bookmarkId) => {
    try {
      const res = await api.put(`/library/bookmarks/${bookmarkId}`, {
        notes: noteText.trim(),
      });
      if (res.data?.success) {
        showToast('Notes saved!', 'success');
        setBookmarks((prev) =>
          prev.map((b) => (b._id === bookmarkId ? { ...b, notes: noteText.trim() } : b))
        );
        setEditingNoteId(null);
      }
    } catch (err) {
      showToast('Failed to save notes', 'error');
    }
  };

  const filtered = bookmarks.filter((b) => {
    const title = b.paperId?.title || '';
    const domain = b.paperId?.researchDomain || '';
    const notes = b.notes || '';
    const q = searchFilter.toLowerCase();
    return title.toLowerCase().includes(q) || domain.toLowerCase().includes(q) || notes.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <BookmarkCheck className="w-7 h-7 text-amber-400" />
            <span>Saved Bookmarks & Highlights</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Access your curated reading list and personal annotations across scholarly publications.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter saved papers or notes..."
            className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading your saved bookmarks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Bookmarks Found</p>
          <p>Click "Bookmark" on any paper card or detail view to save literature to this personal list.</p>
          <Link
            to="/discover"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition shadow"
          >
            Discover Papers
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const paper = b.paperId;
            if (!paper) return null;
            const isEditing = editingNoteId === b._id;

            return (
              <div
                key={b._id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-semibold text-indigo-400">{paper.researchDomain || 'Computer Science'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-500">{paper.publicationYear || 'Recent'}</span>
                    </div>

                    <Link
                      to={`/papers/${paper._id}`}
                      className="text-base font-bold text-white hover:text-indigo-400 transition line-clamp-2 block"
                    >
                      {paper.title}
                    </Link>

                    <p className="text-xs text-slate-400">
                      {(paper.authors || []).map((a) => a.name || a).slice(0, 3).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Link
                      to={`/papers/${paper._id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleRemoveBookmark(b._id)}
                      title="Remove bookmark"
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-850 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="pt-2 border-t border-slate-800/80">
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-indigo-300">Personal Notes / Annotation</label>
                      <textarea
                        rows={2}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add personal notes or annotations on this paper..."
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNote(b._id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save Note</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400 italic">
                        {b.notes ? `Note: "${b.notes}"` : 'No personal note attached.'}
                      </p>
                      <button
                        onClick={() => handleStartEditNote(b)}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{b.notes ? 'Edit Note' : 'Add Note'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
