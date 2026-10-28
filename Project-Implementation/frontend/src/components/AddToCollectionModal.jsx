import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Folder, Plus, Check, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function AddToCollectionModal({ paper, isOpen, onClose }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get('/library/collections')
        .then((res) => {
          if (res.data?.success) {
            setCollections(res.data.data.collections || []);
          }
        })
        .catch((err) => {
          console.error('Failed to load collections:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen || !paper) return null;

  const paperId = paper._id || paper.id;

  const handleAddToCollection = async (collectionId, collectionName) => {
    setSubmitting(true);
    try {
      // If external paper, make sure it is imported first
      let targetPaperId = paperId;
      if (!/^[0-9a-fA-F]{24}$/.test(paperId)) {
        const impRes = await api.post('/search/import', paper);
        if (impRes.data?.data?.paper?._id) {
          targetPaperId = impRes.data.data.paper._id;
        }
      }

      await api.post(`/library/collections/${collectionId}/papers`, {
        paperId: targetPaperId,
      });

      showToast(`Added to "${collectionName}" successfully!`, 'success');
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to add paper to collection', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/library/collections', {
        name: newCollectionName.trim(),
        description: 'Created from paper details',
      });

      if (res.data?.success) {
        const createdCol = res.data.data.collection;
        setCollections((prev) => [createdCol, ...prev]);
        setNewCollectionName('');
        setShowCreateForm(false);
        showToast(`Created collection "${createdCol.name}"!`, 'success');

        // Automatically add paper
        handleAddToCollection(createdCol._id, createdCol.name);
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to create collection', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add to Collection</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{paper.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Collections List */}
        <div className="p-5 flex-1 max-h-80 overflow-y-auto space-y-2">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
              Loading your research collections...
            </div>
          ) : collections.length === 0 && !showCreateForm ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-3">
              <Folder className="w-8 h-8 text-slate-600 mx-auto" />
              <p>You have not created any research collections yet.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/30 transition"
              >
                Create your first collection
              </button>
            </div>
          ) : (
            collections.map((col) => {
              const containsPaper = (col.paperIds || []).some(
                (p) => (typeof p === 'string' ? p : p?._id) === paperId
              );
              return (
                <button
                  key={col._id}
                  disabled={submitting || containsPaper}
                  onClick={() => handleAddToCollection(col._id, col.name)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition ${
                    containsPaper
                      ? 'bg-slate-950/40 border-slate-800 opacity-60 cursor-default'
                      : 'bg-slate-950/80 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color || '#6366f1' }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate">{col.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {col.paperIds?.length || 0} {(col.paperIds?.length || 0) === 1 ? 'paper' : 'papers'}
                      </p>
                    </div>
                  </div>
                  {containsPaper ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Already Added</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-indigo-400 font-semibold hover:underline">
                      + Add
                    </span>
                  )}
                </button>
              );
            })
          )}

          {/* Inline Create Collection */}
          {showCreateForm ? (
            <form onSubmit={handleCreateCollection} className="mt-4 p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
              <label className="text-[11px] font-semibold text-indigo-300">New Collection Name</label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Cloud Kubernetes Autoscaling"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newCollectionName.trim()}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                >
                  Create & Add
                </button>
              </div>
            </form>
          ) : (
            !loading && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-2.5 mt-2 border border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl text-xs font-semibold text-slate-400 hover:text-indigo-400 flex items-center justify-center space-x-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Collection</span>
              </button>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
