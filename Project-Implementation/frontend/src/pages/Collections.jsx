import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  FolderPlus,
  Folder,
  Trash2,
  Edit3,
  Plus,
  BookOpen,
  Download,
  GitCompare,
  FileText,
  Calendar,
  X,
  Check,
  Tag,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Copy,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Collections() {
  const { showToast } = useToast();
  const [collections, setCollections] = useState([]);
  const [selectedCol, setSelectedCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colDetailsLoading, setColDetailsLoading] = useState(false);

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editColId, setEditColId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  // Literature review outline state
  const [outline, setOutline] = useState('');
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [copiedOutline, setCopiedOutline] = useState(false);

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];

  const fetchCollections = async () => {
    try {
      const res = await api.get('/library/collections');
      if (res.data?.success) {
        const list = res.data.data.collections || [];
        setCollections(list);
        if (list.length > 0 && !selectedCol) {
          fetchCollectionDetails(list[0]._id);
        }
      }
    } catch (err) {
      showToast('Failed to load collections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionDetails = async (id) => {
    setColDetailsLoading(true);
    setOutline('');
    try {
      const res = await api.get(`/library/collections/${id}`);
      if (res.data?.success) {
        setSelectedCol(res.data.data.collection);
      }
    } catch (err) {
      showToast('Failed to load collection papers', 'error');
    } finally {
      setColDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleSaveCollection = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editColId) {
        const res = await api.put(`/library/collections/${editColId}`, {
          name: name.trim(),
          description: description.trim(),
          color,
        });
        if (res.data?.success) {
          showToast('Collection updated!', 'success');
          fetchCollections();
          if (selectedCol?._id === editColId) {
            setSelectedCol((prev) => ({ ...prev, name, description, color }));
          }
        }
      } else {
        const res = await api.post('/library/collections', {
          name: name.trim(),
          description: description.trim(),
          color,
        });
        if (res.data?.success) {
          showToast('Collection created!', 'success');
          fetchCollections();
          fetchCollectionDetails(res.data.data.collection._id);
        }
      }
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Error saving collection', 'error');
    }
  };

  const handleDeleteCollection = async (id, colName) => {
    if (!window.confirm(`Are you sure you want to delete collection "${colName}"?`)) return;

    try {
      await api.delete(`/library/collections/${id}`);
      showToast('Collection deleted', 'success');
      setCollections((prev) => prev.filter((c) => c._id !== id));
      if (selectedCol?._id === id) {
        setSelectedCol(null);
      }
    } catch (err) {
      showToast('Failed to delete collection', 'error');
    }
  };

  const handleRemovePaper = async (paperId) => {
    if (!selectedCol) return;
    try {
      await api.delete(`/library/collections/${selectedCol._id}/papers/${paperId}`);
      showToast('Paper removed from collection', 'success');
      fetchCollectionDetails(selectedCol._id);
    } catch (err) {
      showToast('Failed to remove paper', 'error');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditColId(null);
    setName('');
    setDescription('');
    setColor('#6366f1');
  };

  const openEditModal = (col) => {
    setEditColId(col._id);
    setName(col.name);
    setDescription(col.description || '');
    setColor(col.color || '#6366f1');
    setShowCreateModal(true);
  };

  // Generate literature review outline from papers in collection
  const handleGenerateOutline = () => {
    if (!selectedCol || !selectedCol.paperIds || selectedCol.paperIds.length === 0) {
      showToast('Add papers to this collection first', 'info');
      return;
    }

    setOutlineLoading(true);
    const papers = selectedCol.paperIds;

    let draft = `# Literature Review Outline: ${selectedCol.name}\n\n`;
    draft += `**Prepared via:** Cloud-Native AI Research Discovery Platform\n`;
    draft += `**Corpus Size:** ${papers.length} peer-reviewed publications\n\n`;
    draft += `---\n\n`;

    draft += `## 1. Introduction & Theoretical Motivation\n`;
    draft += `- Emerging challenges and scaling bottlenecks in ${selectedCol.name}.\n`;
    draft += `- Scope of survey across recent scholarly advancements.\n\n`;

    draft += `## 2. Taxonomical Categorization of Approaches\n`;
    papers.forEach((p, i) => {
      draft += `### 2.${i + 1} ${p.title} (${p.publicationYear || 'Recent'})\n`;
      draft += `- **Authors:** ${(p.authors || []).map((a) => a.name || a).join(', ') || 'Scholarly Authors'}\n`;
      if (p.abstract) {
        draft += `- **Core Contribution:** ${p.abstract.slice(0, 200)}...\n`;
      }
      if (p.keywords && p.keywords.length > 0) {
        draft += `- **Key Concepts:** ${p.keywords.slice(0, 4).join(', ')}\n`;
      }
      draft += `\n`;
    });

    draft += `## 3. Cross-Paper Synthesis & Methodological Trade-Offs\n`;
    draft += `- Comparative analysis of algorithmic designs vs empirical evaluations.\n`;
    draft += `- Common benchmark environments and observational datasets.\n\n`;

    draft += `## 4. Open Research Gaps & Future Directions\n`;
    draft += `- Unresolved scalability, consistency, and operational latency overheads.\n`;
    draft += `- Recommended experimental testbeds for subsequent research.\n\n`;

    draft += `## 5. Bibliography\n`;
    papers.forEach((p, i) => {
      const auth = (p.authors || []).map((a) => a.name || a).join(', ') || 'Authors';
      draft += `[${i + 1}] ${auth} (${p.publicationYear || 'Recent'}). "${p.title}."\n`;
    });

    setOutline(draft);
    setOutlineLoading(false);
  };

  const handleCopyOutline = () => {
    if (outline) {
      navigator.clipboard.writeText(outline);
      setCopiedOutline(true);
      showToast('Literature review outline copied to clipboard!', 'success');
      setTimeout(() => setCopiedOutline(false), 2000);
    }
  };

  const handleExportBibliography = () => {
    if (!selectedCol?.paperIds?.length) return;
    const bibEntries = selectedCol.paperIds.map((p) => {
      const authors = (p.authors || []).map((a) => a.name || a).join(' and ') || 'Anonymous';
      const year = p.publicationYear || 2024;
      const key = `ref_${p._id.slice(-6)}`;
      return `@article{${key},\n  title = {${p.title}},\n  author = {${authors}},\n  year = {${year}}\n}`;
    }).join('\n\n');

    const blob = new Blob([bibEntries], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCol.name.toLowerCase().replace(/\s+/g, '_')}_bibliography.bib`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Bibliography exported as .bib file!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Folder className="w-7 h-7 text-indigo-400" />
            <span>Research Collections & Workspaces</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize publications by topic or project, track reading progress, generate literature reviews, and export bibliographies.
          </p>
        </div>

        <button
          onClick={() => {
            closeModal();
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Collections List */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200">Your Collections ({collections.length})</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
              Loading collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-3">
              <FolderPlus className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No collections created yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
              >
                Create First Collection
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((col) => {
                const isSelected = selectedCol?._id === col._id;
                return (
                  <div
                    key={col._id}
                    onClick={() => fetchCollectionDetails(col._id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500/60 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: col.color || '#6366f1' }}
                      />
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{col.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {col.paperIds?.length || 0} {(col.paperIds?.length || 0) === 1 ? 'paper' : 'papers'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(col)}
                        title="Edit collection"
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(col._id, col.name)}
                        title="Delete collection"
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Collection Papers & Tools */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCol ? (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Collection Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedCol.color || '#6366f1' }}
                    />
                    <h2 className="text-lg font-bold text-white">{selectedCol.name}</h2>
                  </div>
                  {selectedCol.description && (
                    <p className="text-xs text-slate-400 mt-1">{selectedCol.description}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedCol.paperIds?.length || 0} {(selectedCol.paperIds?.length || 0) === 1 ? 'paper' : 'papers'} • Created {new Date(selectedCol.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Collection Tool Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleGenerateOutline}
                    disabled={outlineLoading || !selectedCol.paperIds?.length}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Review Outline</span>
                  </button>

                  <button
                    onClick={handleExportBibliography}
                    disabled={!selectedCol.paperIds?.length}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export BibTeX</span>
                  </button>

                  {selectedCol.paperIds?.length >= 2 && (
                    <Link
                      to={`/compare?ids=${selectedCol.paperIds.map((p) => p._id).join(',')}`}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Compare All</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Generated Literature Review Outline Box */}
              {outline && (
                <div className="p-5 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Generated Literature Review Outline</span>
                    </span>
                    <button
                      onClick={handleCopyOutline}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg flex items-center space-x-1 hover:bg-indigo-500 transition"
                    >
                      {copiedOutline ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOutline ? 'Copied' : 'Copy Outline'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                    {outline}
                  </pre>
                </div>
              )}

              {/* Papers in Collection */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Papers in this Collection ({selectedCol.paperIds?.length || 0})
                </h3>

                {colDetailsLoading ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Loading collection papers...
                  </div>
                ) : !selectedCol.paperIds || selectedCol.paperIds.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs space-y-3 bg-slate-900/40 rounded-xl border border-slate-800/80 p-6">
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>No papers added to this collection yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Browse your Library or Discover Research and click "Add to Collection" to populate this workspace.
                    </p>
                    <Link
                      to="/discover"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition"
                    >
                      Discover Research
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {selectedCol.paperIds.map((paper) => (
                      <div
                        key={paper._id}
                        className="py-3.5 px-2 flex items-start justify-between hover:bg-slate-900/60 rounded-xl transition group gap-4"
                      >
                        <div className="overflow-hidden">
                          <Link
                            to={`/papers/${paper._id}`}
                            className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition line-clamp-1"
                          >
                            {paper.title}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {(paper.authors || []).map((a) => a.name || a).slice(0, 3).join(', ')} • {paper.publicationYear || 'Recent'}
                          </p>
                          {paper.abstract && (
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                              {paper.abstract}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0 pt-1">
                          <Link
                            to={`/papers/${paper._id}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => handleRemovePaper(paper._id)}
                            title="Remove from collection"
                            className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs space-y-3">
              <Folder className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-300">Select a Collection</p>
              <p className="max-w-sm mx-auto">
                Choose a collection from the left or create a new one to organize and synthesize your research literature.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editColId ? 'Edit Collection' : 'Create Research Collection'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Cloud-Native Mesh"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Research project objectives, scope, or course module..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Color Tag</label>
                <div className="flex space-x-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition transform ${
                        color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition shadow-md shadow-indigo-600/30"
                >
                  {editColId ? 'Save Changes' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
