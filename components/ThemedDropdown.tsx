
import React, { useState, useRef, useEffect } from 'react';

interface ThemedDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    label?: string;
    className?: string;
}

const ThemedDropdown: React.FC<ThemedDropdownProps> = ({ value, onChange, options, placeholder, label, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-5 py-4 rounded-xl text-sm font-bold tracking-wide transition-all border
          ${isOpen
                        ? 'bg-white/15 border-[#14B8A6] text-[#FFFFFF] shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-[#E5E7EB]'
                    }`}
            >
                <span className={!selectedOption ? 'text-[#475569]' : ''}>{selectedOption ? selectedOption.label : placeholder}</span>
                <svg
                    className={`w-4 h-4 ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#14B8A6]' : 'text-[#475569]'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-[#0F172A] rounded-2xl shadow-dropdown border border-white/10 overflow-hidden z-[100] dropdown-enter p-2 backdrop-blur-xl">
                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider dropdown-item
                  ${value === opt.value
                                        ? 'bg-[#14B8A6] text-white'
                                        : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemedDropdown;
