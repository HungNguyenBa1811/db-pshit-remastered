import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import MonacoEditor from '@monaco-editor/react';

const SQLEditor = ({ value, onChange, disabled }) => {
    const monacoRef = useRef(null);

    useEffect(() => {
        // In case consumers update value externally, Monaco will reflect via prop
    }, [value]);

    const handleMount = (editor, monaco) => {
        monacoRef.current = { editor, monaco };
        // sensible defaults
        editor.updateOptions({ tabSize: 4, insertSpaces: true });
        try {
            const keywords = [
                // core SQL
                'SELECT',
                'FROM',
                'WHERE',
                'INSERT',
                'INTO',
                'VALUES',
                'UPDATE',
                'SET',
                'DELETE',
                'JOIN',
                'LEFT',
                'RIGHT',
                'INNER',
                'OUTER',
                'CROSS',
                'NATURAL',
                'ON',
                'USING',
                'GROUP BY',
                'ORDER BY',
                'HAVING',
                'LIMIT',
                'OFFSET',
                'DISTINCT',
                'ALL',
                'AS',
                'UNION',
                'UNION ALL',
                'INTERSECT',
                'EXCEPT',

                // DDL
                'CREATE',
                'TABLE',
                'ALTER',
                'ADD',
                'DROP',
                'TRUNCATE',
                'RENAME',
                'COLUMN',
                'CONSTRAINT',
                'PRIMARY KEY',
                'FOREIGN KEY',
                'REFERENCES',
                'UNIQUE',
                'CHECK',
                'DEFAULT',
                'AUTO_INCREMENT',

                // joins / qualifiers
                'LEFT JOIN',
                'RIGHT JOIN',
                'INNER JOIN',
                'OUTER JOIN',
                'FULL JOIN',
                'CROSS JOIN',

                // CTEs and recursive
                'WITH',
                'WITH RECURSIVE',
                'RECURSIVE',

                // window / analytic
                'OVER',
                'PARTITION BY',
                'ROW_NUMBER',
                'RANK',
                'DENSE_RANK',
                'NTILE',
                'LEAD',
                'LAG',

                // conditional / expressions
                'CASE',
                'WHEN',
                'THEN',
                'ELSE',
                'END',
                'COALESCE',
                'IFNULL',
                'NVL',
                'CAST',
                'CONVERT',

                // functions (aggregates / scalar)
                'COUNT',
                'SUM',
                'AVG',
                'MIN',
                'MAX',
                'LOWER',
                'UPPER',
                'LENGTH',
                'CHAR_LENGTH',
                'SUBSTRING',
                'TRIM',
                'LTRIM',
                'RTRIM',
                'ROUND',
                'FLOOR',
                'CEIL',
                'ABS',
                'NOW',
                'CURRENT_DATE',
                'CURRENT_TIMESTAMP',

                // predicates / operators
                'AND',
                'OR',
                'NOT',
                'NULL',
                'IS',
                'IN',
                'EXISTS',
                'LIKE',
                'BETWEEN',
                'CASE WHEN',
                'DISTINCT ON',

                // schema / engine / index hints often seen in contests
                'INDEX',
                'USING',
                'ENGINE',

                // misc
                'ORDER',
                'GROUP',
                'BY',
                'HAVING',
                'LIMIT',
                'OFFSET',
                'TOP',
                'PIVOT',
                'UNPIVOT',

                // string / concat
                'CONCAT',
                '||',

                // SQL-directions common in problems
                'PREFIX',
                'SUFFIX',

                // practical helpers
                'EXTRACT',
                'DATE',
                'TIMESTAMP',
                'INTERVAL',
                'TO_CHAR',
                'TO_DATE',
            ];

            const provider = monaco.languages.registerCompletionItemProvider('sql', {
                triggerCharacters: [' ', '.', '\n', '\t', '('],
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position);
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    };

                    const suggestions = keywords.map((kw) => ({
                        label: kw,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: kw,
                        range,
                    }));

                    return { suggestions };
                },
            });

            monacoRef.current.provider = provider;
        } catch (err) {
            // ignore completion registration failures
            // (monaco may not be ready in some environments)
            // console.warn('Monaco completion setup failed', err);
        }
    };

    const handleUnmount = () => {
        try {
            if (monacoRef.current) {
                if (monacoRef.current.provider && typeof monacoRef.current.provider.dispose === 'function') {
                    monacoRef.current.provider.dispose();
                }
                monacoRef.current = null;
            }
        } catch (e) {
            // ignore
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-8 bg-transparent border-b border-white/10 flex items-center px-4 text-xs text-text-muted select-none">
                SQL Editor
            </div>
            <div
                className={clsx(
                    'w-full h-full pt-10 pb-4 px-1 bg-transparent text-gray-300 text-sm',
                    disabled && 'opacity-60',
                )}
            >
                <div className="w-full h-full bg-transparent rounded">
                    <MonacoEditor
                        height="100%"
                        defaultLanguage="sql"
                        language="sql"
                        value={value}
                        onChange={(val) => onChange(val || '')}
                        onMount={handleMount}
                        onUnmount={handleUnmount}
                        theme="vs-dark"
                        options={{
                            readOnly: !!disabled,
                            minimap: { enabled: false },
                            wordWrap: 'on',
                            fontFamily:
                                'Consolas, "Roboto Mono", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace',
                            fontSize: 18,
                            automaticLayout: true,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            folding: true,
                            renderWhitespace: 'boundary',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SQLEditor;
