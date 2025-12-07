import clsx from 'clsx';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';

const highlight = (code) => Prism.highlight(code, Prism.languages.sql, 'sql');

const SQLEditor = ({ value, onChange, disabled }) => {
    return (
        <div className="relative w-full h-full flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-8 bg-transparent border-b border-white/10 flex items-center px-4 text-xs text-text-muted select-none">
                SQL Editor
            </div>
            <div
                className={clsx(
                    'w-full h-full pt-10 pb-4 px-4 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none overflow-auto',
                    disabled && 'opacity-50',
                )}
            >
                <Editor
                    value={value}
                    onValueChange={(code) => onChange(code)}
                    highlight={highlight}
                    padding={8}
                    tabSize={4}
                    disabled={disabled}
                    style={{
                        fontFamily:
                            'Consolas, "Roboto Mono", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace',
                        fontSize: 13,
                        outline: 'none',
                        background: 'transparent',
                        color: 'var(--text-main, #e5e7eb)',
                    }}
                    textareaId="sql-editor"
                />
            </div>
        </div>
    );
};

export default SQLEditor;
