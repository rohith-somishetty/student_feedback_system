
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Department, Urgency, IssueCategory } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { calculateDeadline } from '../utils/priority';

interface IssueFormProps {
  user: User;
  departments: Department[];
  onAddIssue: (issue: any) => void;
}

const IssueForm: React.FC<IssueFormProps> = ({ user, departments, onAddIssue }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: IssueCategory.OTHER,
    departmentId: '',
    urgency: Urgency.LOW,
    evidenceUrl: '',
  });

  // Auto-select department when category changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value as IssueCategory;
    const config = CATEGORY_CONFIG[category];
    setFormData(prev => ({
      ...prev,
      category,
      departmentId: config.defaultDeptId
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    const deadline = calculateDeadline(formData.category, formData.urgency);

    onAddIssue({
      ...formData,
      deadline,
      creatorId: user.id,
    });
    navigate('/issues');
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Report an Issue</h1>
        <p className="text-slate-500">Public issues require evidence and community support to be prioritized.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Issue Title</label>
          <input
            type="text"
            placeholder="E.g., No water in Block B Hostel"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={formData.category}
              onChange={handleCategoryChange}
            >
              {Object.values(IssueCategory).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Assigned Department (Auto)</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={formData.departmentId}
              onChange={e => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Urgency Level</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={formData.urgency}
              onChange={e => setFormData(prev => ({ ...prev, urgency: parseInt(e.target.value) }))}
            >
              <option value={Urgency.LOW}>Low</option>
              <option value={Urgency.MEDIUM}>Medium</option>
              <option value={Urgency.HIGH}>High</option>
              <option value={Urgency.CRITICAL}>Critical</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Detailed Description</label>
          <textarea
            rows={5}
            placeholder="Describe the issue clearly. Mention location, impact, and how long it has been occurring."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Evidence Link (Optional)</label>
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
            value={formData.evidenceUrl}
            onChange={e => setFormData(prev => ({ ...prev, evidenceUrl: e.target.value }))}
          />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Supports Images, PDFs, Docs</p>
        </div>

        <div className="p-4 bg-indigo-50 rounded-xl flex items-start space-x-3">
          <div className="text-indigo-600 mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs text-indigo-800 leading-relaxed">
            Your current credibility score is <strong>{user.credibility}</strong>.
            Validating accurate issues improves your score. Reporting fake or malicious content will lead to a 15-point penalty.
          </div>
        </div>

        <div className="flex space-x-4 pt-2">
          <button
            type="submit"
            className="flex-grow bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            Submit Public Issue
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueForm;
