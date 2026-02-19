import React from 'react';
import { Link } from 'react-router-dom';

interface FeedbackStateProps {
    type: 'success' | 'error';
    title?: string;
    message?: string;
    onRetry?: () => void;
    primaryActionText?: string;
    primaryActionLink?: string;
}

const FeedbackState: React.FC<FeedbackStateProps> = ({
    type,
    title,
    message,
    onRetry,
    primaryActionText,
    primaryActionLink
}) => {
    const isSuccess = type === 'success';

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center submission-success-enter">
            <div className={`p-6 rounded-[2.5rem] mb-8 ${isSuccess ? 'bg-emerald-50 text-emerald-500 success-ripple' : 'bg-rose-50 text-rose-500'}`}>
                {isSuccess ? (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ) : (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                )}
            </div>

            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4 tracking-tight">
                {title || (isSuccess ? "Thanks for Speaking Up!" : "Something's not right")}
            </h2>

            <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
                {message || (isSuccess
                    ? "Your report has been securely shared. Our team will verify the details shortly. You can track its progress in your Activity tab."
                    : "We couldn't process your request just yet. This usually happens due to a temporary connection hiccup. Please try again.")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
                {isSuccess ? (
                    <Link
                        to={primaryActionLink || "/"}
                        className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] btn-elevate shadow-xl shadow-brand-navy/10 active:scale-95"
                    >
                        {primaryActionText || "Back to Dashboard"}
                    </Link>
                ) : (
                    <>
                        <button
                            onClick={onRetry}
                            className="px-10 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] btn-elevate shadow-xl shadow-brand-primary/20 active:scale-95"
                        >
                            Try Again
                        </button>
                        <Link
                            to="/"
                            className="px-8 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                        >
                            Cancel
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackState;
