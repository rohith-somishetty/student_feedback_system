
import React from 'react';
import { User, UserRole } from '../types';

interface CredibilityStatsProps {
  users: User[];
}

const CredibilityStats: React.FC<CredibilityStatsProps> = ({ users }) => {
  const students = users
    .filter(u => u.role === UserRole.STUDENT)
    .sort((a, b) => b.credibility - a.credibility);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <header className="text-center">
        <h1 className="text-3xl font-black text-slate-900">Student Accountability Leaderboard</h1>
        <p className="text-slate-500 mt-2">Earn credibility by reporting valid issues and supporting successful resolutions.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b flex justify-between font-bold text-xs uppercase tracking-widest text-slate-400">
          <span>Student</span>
          <span>Credibility Score</span>
        </div>
        
        <div className="divide-y">
          {students.map((student, index) => (
            <div key={student.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-amber-100 text-amber-600' :
                  index === 1 ? 'bg-slate-200 text-slate-600' :
                  index === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-white border text-slate-400'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{student.name}</div>
                  <div className="text-xs text-slate-400">{student.email}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`text-xl font-black ${
                  student.credibility >= 80 ? 'text-emerald-600' :
                  student.credibility >= 50 ? 'text-indigo-600' :
                  'text-red-500'
                }`}>
                  {student.credibility}
                </div>
                <div className="w-2 h-10 bg-slate-100 rounded-full overflow-hidden">
                   <div 
                    className={`w-full transition-all duration-1000 rounded-full ${
                      student.credibility >= 80 ? 'bg-emerald-500' :
                      student.credibility >= 50 ? 'bg-indigo-500' :
                      'bg-red-500'
                    }`}
                    style={{ height: `${student.credibility}%`, marginTop: `${100 - student.credibility}%` }}
                   />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
          <h4 className="font-bold text-emerald-800 mb-2">How to gain credibility?</h4>
          <ul className="text-xs text-emerald-700 space-y-2">
            <li>• Submit issues that get marked as RESOLVED</li>
            <li>• Support issues that eventually get RESOLVED</li>
            <li>• Providing detailed evidence during report</li>
          </ul>
        </div>
        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
          <h4 className="font-bold text-red-800 mb-2">Why lose credibility?</h4>
          <ul className="text-xs text-red-700 space-y-2">
            <li>• Reporting fake or misleading issues</li>
            <li>• Maliciously contesting valid resolutions</li>
            <li>• Spamming support on invalid claims</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CredibilityStats;
