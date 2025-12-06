import clsx from 'clsx';

const SQLEditor = ({ value, onChange, disabled }) => {
    return (
        <div className="relative w-full h-full flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/10 flex items-center px-4 text-xs text-text-muted select-none">
                SQL Editor
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                spellCheck="false"
                className={clsx(
                    "w-full h-full pt-10 pb-4 px-4 bg-[#1e1e1e] text-gray-300 font-mono text-sm resize-none focus:outline-none",
                    "selection:bg-primary/30",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                placeholder="-- Write your SQL query here..."
            />
        </div>
    );
};

export default SQLEditor;
