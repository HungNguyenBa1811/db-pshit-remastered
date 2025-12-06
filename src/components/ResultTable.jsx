import clsx from 'clsx';

const ResultTable = ({ data, error, loading }) => {
    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
                Running query...
            </div>
        );
    }

    if (error) {
        const errorMessage = typeof error === 'object' ? (error.description || JSON.stringify(error, null, 2)) : error;
        return (
            <div className="w-full h-full p-4 text-error font-mono text-sm whitespace-pre-wrap overflow-auto">
                {errorMessage}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
                No results to display
            </div>
        );
    }

    const columns = Object.keys(data[0]);

    return (
        <div className="w-full h-full overflow-auto">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/5 sticky top-0 z-10">
                    <tr>
                        {columns.map((col) => (
                            <th key={col} className="p-3 font-medium text-text-muted border-b border-white/10 whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                            {columns.map((col) => (
                                <td key={`${idx}-${col}`} className="p-3 text-text-main whitespace-nowrap font-mono text-xs">
                                    {row[col] === null ? <span className="text-text-muted italic">NULL</span> : String(row[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResultTable;
