import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Department, IssueCategory } from '../types';
import FeedbackState from './FeedbackState';
import { CATEGORY_CONFIG } from '../constants';
import { calculateDeadline } from '../utils/priority';
import ThemedDropdown from './ThemedDropdown';

interface IssueFormProps {
  user: User;
  departments: Department[];
  onAddIssue: (issue: any) => void;
}

import { classifyIssue } from '../utils/classifier';

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
  const [isCategoryManual, setIsCategoryManual] = useState(false);
  const [isDeptManual, setIsDeptManual] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Auto-selection effect with debounce
  React.useEffect(() => {
    if (!formData.description.trim() || (isCategoryManual && isDeptManual)) return;

    const timer = setTimeout(() => {
      const suggestion = classifyIssue(formData.description);

      setFormData(prev => ({
        ...prev,
        category: isCategoryManual ? prev.category : suggestion.category,
        departmentId: isDeptManual ? prev.departmentId : suggestion.departmentId
      }));
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.description, isCategoryManual, isDeptManual]);

  // Handle manual category change
  const handleCategoryChange = (val: string) => {
    const category = val as IssueCategory;
    setIsCategoryManual(true);
    setFormData(prev => ({
      ...prev,
      category
    }));
  };

  // Handle manual department change
  const handleDeptChange = (val: string) => {
    setIsDeptManual(true);
    setFormData(prev => ({
      ...prev,
      departmentId: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setSubmitStatus('LOADING');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const deadline = calculateDeadline(formData.category);
      onAddIssue({
        ...formData,
        deadline,
        creatorId: user.id,
      });
      setSubmitStatus('SUCCESS');
    } catch (err) {
      setSubmitStatus('ERROR');
    }
  };



  if (submitStatus === 'SUCCESS') {
    return (
      <div className="pt-32">
        <FeedbackState type="success" primaryActionLink="/activity" primaryActionText="View My Reports" />
      </div>
    );
  }

  if (submitStatus === 'ERROR') {
    return (
      <div className="pt-32">
        <FeedbackState type="error" onRetry={() => setSubmitStatus('IDLE')} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-32 pb-16 page-enter font-outfit">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-display font-bold text-[#E5E7EB] tracking-tight uppercase mb-3">Share a <span className="text-[#0B5F5A]">Report</span></h1>
        <p className="text-[#9CA3AF] text-lg font-medium max-w-2xl mx-auto tracking-wide">
          Notice something that needs attention? Share the details below so we can work on a solution together.
        </p>
      </div>

      <div className="bg-[#0F172A]/60 backdrop-blur-[24px] rounded-2xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#14B8A6]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0B5F5A]/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

          {/* Title Section */}
          <div className={`transition-all duration-300 ${activeField === 'title' ? 'scale-[1.01]' : ''}`}>
            <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-2 ml-1">Issue Overview</label>
            <input
              type="text"
              placeholder="What is the issue?"
              className="w-full text-2xl font-display font-bold px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-[#E5E7EB] focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all placeholder:text-[#475569] shadow-inner"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              onFocus={() => setActiveField('title')}
              onBlur={() => setActiveField(null)}
              required
            />
          </div>

          {/* Category & Department row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ThemedDropdown
              label="Category"
              value={formData.category}
              onChange={handleCategoryChange}
              options={Object.values(IssueCategory).map(cat => ({ value: cat, label: cat }))}
              placeholder="Select Category"
            />

            <ThemedDropdown
              label="Assigned Department"
              value={formData.departmentId}
              onChange={handleDeptChange}
              options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
              placeholder="Select Department"
            />
          </div>

          <div className={`transition-all duration-300 ${activeField === 'description' ? 'scale-[1.01]' : ''}`}>
            <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-2 ml-1">Tell us what's happening</label>
            <textarea
              rows={6}
              placeholder="Provide a detailed explanation of the issue..."
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-[#E5E7EB] font-medium leading-relaxed focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all placeholder:text-[#475569] shadow-inner"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onFocus={() => setActiveField('description')}
              onBlur={() => setActiveField(null)}
              required
            />
          </div>

          <div className={`transition-all duration-300 ${activeField === 'evidence' ? 'scale-[1.01]' : ''}`}>
            <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-2 ml-1">Evidence or Photos (Optional Link)</label>
            <div className="relative">
              <input
                type="url"
                placeholder="Paste link to Google Drive, Dropbox, etc."
                className="w-full pl-11 pr-5 py-4 rounded-xl bg-white/5 border border-white/10 text-[#14B8A6] font-mono text-xs focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all placeholder:text-[#475569] shadow-inner"
                value={formData.evidenceUrl}
                onChange={e => setFormData(prev => ({ ...prev, evidenceUrl: e.target.value }))}
                onFocus={() => setActiveField('evidence')}
                onBlur={() => setActiveField(null)}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex items-start gap-3">
            <div className="w-10 h-10 bg-[#14B8A6]/10 text-[#14B8A6] rounded-xl shrink-0 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Community Trust</h4>
              <p className="text-sm text-[#94A3B8] leading-relaxed font-medium">
                Submitting this issue will utilize your credibility score ({user.credibility}). High-quality reports that are resolved successfully will increase your score, while false reports will result in penalties.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-4 rounded-xl font-bold text-[#475569] hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest text-[10px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitStatus === 'LOADING'}
              className={`flex-grow bg-[#14B8A6] text-white font-black py-4 rounded-xl shadow-btn-teal btn-elevate uppercase tracking-[0.2em] text-[10px] active:scale-[0.98] ${submitStatus === 'LOADING' ? 'button-disabled animate-pulse' : ''}`}
            >
              {submitStatus === 'LOADING' ? 'Sharing Report...' : 'Submit My Report'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default IssueForm;
