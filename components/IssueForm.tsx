import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Department, IssueCategory } from '../types';
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
    evidenceUrl: '',
  });

  const [activeField, setActiveField] = useState<string | null>(null);

  // Auto-select department when category changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value as IssueCategory;
    const config = CATEGORY_CONFIG[category];
    setFormData(prev => ({
      ...prev,
      category,
      // departmentId: config.defaultDeptId // Removed auto-assignment to allow user choice
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    const deadline = calculateDeadline(formData.category);

    onAddIssue({
      ...formData,
      deadline,
      creatorId: user.id,
    });
    navigate('/issues');
  };



  return (
    <div className="max-w-4xl mx-auto animate-fadeIn font-outfit">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Report Issue</h1>
        <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
          Submit a new issue for resolution. Please provide clear details and evidence to ensure widely supported and accurate feedback.
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-indigo-500/10 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

          {/* Title Section */}
          <div className={`transition-all duration-300 ${activeField === 'title' ? 'scale-[1.02]' : ''}`}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Issue Title</label>
            <input
              type="text"
              placeholder="What is the issue?"
              className="w-full text-2xl font-bold px-6 py-5 rounded-2xl border-2 border-slate-100 bg-white/80 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 text-slate-800"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              onFocus={() => setActiveField('title')}
              onBlur={() => setActiveField(null)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category & Department */}
            <div className="space-y-6">
              <div className={`transition-all duration-300 ${activeField === 'category' ? 'scale-[1.02]' : ''}`}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                <div className="relative">
                  <select
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white/80 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    onFocus={() => setActiveField('category')}
                    onBlur={() => setActiveField(null)}
                  >
                    {Object.values(IssueCategory).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className={`transition-all duration-300 ${activeField === 'department' ? 'scale-[1.02]' : ''}`}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assigned Department</label>
                <div className="relative">
                  <select
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white/80 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                    value={formData.departmentId}
                    onChange={e => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                    onFocus={() => setActiveField('department')}
                    onBlur={() => setActiveField(null)}
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className={`transition-all duration-300 ${activeField === 'description' ? 'scale-[1.02]' : ''}`}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Detailed Description</label>
            <textarea
              rows={6}
              placeholder="Provide a detailed explanation of the issue..."
              className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 bg-white/80 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none font-medium text-slate-700 leading-relaxed"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onFocus={() => setActiveField('description')}
              onBlur={() => setActiveField(null)}
              required
            />
          </div>

          <div className={`transition-all duration-300 ${activeField === 'evidence' ? 'scale-[1.02]' : ''}`}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Evidence Link (Optional)</label>
            <div className="relative">
              <input
                type="url"
                placeholder="Paste link to Google Drive, Dropbox, etc."
                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 bg-white/80 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-sm text-indigo-600"
                value={formData.evidenceUrl}
                onChange={e => setFormData(prev => ({ ...prev, evidenceUrl: e.target.value }))}
                onFocus={() => setActiveField('evidence')}
                onBlur={() => setActiveField(null)}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 flex items-start gap-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">Reputation Impact</h4>
              <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
                Submitting this issue will utilize your credibility score ({user.credibility}). High-quality reports that are resolved successfully will increase your score, while false reports will result in penalties.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all uppercase tracking-widest text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-grow bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30 transition-all uppercase tracking-[0.15em] text-xs transform active:scale-[0.98]"
            >
              Submit Issue Report
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default IssueForm;
