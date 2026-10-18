import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setModalOpen, deleteInvestigationById } from '../store/slices/investigationsListSlice';
import { loadInvestigation } from '../store/slices/investigationSlice';
import { X, FolderOpen, Trash2, Search, ArrowRight, Calendar, Tag } from 'lucide-react';

export default function SavedInvestigationsModal() {
  const dispatch = useDispatch();
  const { items, isModalOpen, loading } = useSelector((state) => state.investigationsList);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isModalOpen) return null;

  const filtered = items.filter(item => 
    item.deviation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batch_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (inv) => {
    dispatch(loadInvestigation(inv));
    dispatch(setModalOpen(false));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this investigation from the database?')) {
      dispatch(deleteInvestigationById(id));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Saved Quality Investigations</h3>
              <p className="text-[11px] text-slate-400">PostgreSQL Database Records</p>
            </div>
          </div>
          <button 
            onClick={() => dispatch(setModalOpen(false))}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by deviation number, product, batch, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* List of Records */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading saved investigations...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved investigations found in the database.</p>
              <p className="text-[11px] text-slate-500 mt-1">Run an AI analysis and click <strong>Save Record</strong> to persist an investigation.</p>
            </div>
          ) : (
            filtered.map((inv) => (
              <div
                key={inv.id}
                onClick={() => handleSelect(inv)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 cursor-pointer transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {inv.deviation_number}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      inv.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.severity}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {inv.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {inv.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Product: <strong className="text-slate-700">{inv.product_name}</strong></span>
                    <span>Batch: <span className="font-mono text-slate-700">{inv.batch_number}</span></span>
                    {inv.updated_at && (
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="h-3 w-3" />
                        {new Date(inv.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleDelete(e, inv.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="p-1.5 text-slate-400 group-hover:text-teal-600 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={() => dispatch(setModalOpen(false))}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
