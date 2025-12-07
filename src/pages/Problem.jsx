import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { localProblemsApi } from '../services/problemsData';
import { executorApi, questionApi } from '../services/api';
import SQLEditor from '../components/SQLEditor';
import ResultTable from '../components/ResultTable';
import {
    Play,
    Send,
    Loader2,
    Database,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    GripHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Problem = () => {
    const { id } = useParams();
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sql, setSql] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDbId, setSelectedDbId] = useState(null);
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [outputHeight, setOutputHeight] = useState(200);
    const [isResizing, setIsResizing] = useState(false);

    // Handle resize for output panel
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const container = document.getElementById('right-pane');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const newHeight = containerRect.bottom - e.clientY;
                // Min 80px, max là chiều cao container trừ đi toolbar (50px) + editor min (240px) + gaps (32px)
                const maxHeight = containerRect.height - 322;
                setOutputHeight(Math.max(80, Math.min(newHeight, maxHeight)));
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                setLoading(true);

                let response = null;

                // resolve mapping using local data first
                const all = await localProblemsApi.getAll();
                const found = (all.data || []).find((p) => p.id === id || p.questionCode === id);

                if (found) {
                    try {
                        response = await questionApi.getDetail(found.id);
                    } catch (err) {
                        response = await localProblemsApi.getDetail(found.id);
                    }
                } else {
                    try {
                        response = await localProblemsApi.getDetail(id);
                    } catch (err) {}
                }

                if (response && response.data) {
                    setQuestion(response.data);
                    if (response.data.questionDetails?.length > 0) {
                        setSelectedDbId(response.data.questionDetails[0].typeDatabase.id);
                    }
                    setSql(
                        `-- ${response.data.title}\n-- ID: ${response.data.questionCode}\n\nSELECT * FROM table_name;`,
                    );
                } else {
                    toast.error('Failed to load question details');
                }
            } catch (error) {
                toast.error('Failed to load question details');
            } finally {
                setLoading(false);
            }
        };

        fetchQuestion();
    }, [id]);

    const handleRun = async () => {
        if (!sql.trim() || !selectedDbId) return;

        setExecuting(true);
        setError(null);
        setResult(null);
        setSubmissionStatus(null);

        try {
            const payloadSql = sql.replace(/\r\n/g, '\n');
            const response = await executorApi.dryRun({
                questionId: question.id,
                sql: payloadSql,
                typeDatabaseId: selectedDbId,
            });

            if (response.data.status === 1) {
                setResult(response.data.result);
                toast.success(`Query executed in ${response.data.timeExec}s`);
            } else {
                const errorData = response.data.result;
                if (typeof errorData === 'object' && errorData !== null) {
                    setError(errorData.description || JSON.stringify(errorData));
                } else {
                    setError(errorData || 'Unknown error occurred');
                }
                toast.error('Query execution failed');
            }
        } catch (err) {
            setError(err.message || 'Network error');
            toast.error('Failed to execute query');
        } finally {
            setExecuting(false);
        }
    };

    const checkSubmissionResult = async (questionId) => {
        try {
            const response = await executorApi.checkComplete([questionId]);
            const result = response.data?.find((r) => r.questionId === questionId);

            if (result) {
                setSubmissionStatus({
                    status: result.status,
                    message: result.completed === 'done' ? 'Submission completed' : 'Processing...',
                });

                if (result.status === 'AC') {
                    toast.success('Accepted!');
                } else if (result.status === 'WA') {
                    toast.error('Wrong Answer');
                } else if (result.status === 'TLE') {
                    toast.error('Time Limit Exceeded');
                } else if (result.status === 'RTE') {
                    toast.error('Runtime Error');
                } else if (result.status === 'CE') {
                    toast.error('Compilation Error');
                }
            } else {
                setSubmissionStatus({ status: 'PENDING', message: 'Still processing...' });
            }
        } catch (err) {
            console.error('Check complete error:', err);
            setSubmissionStatus({ status: 'ERROR', message: 'Failed to check result' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!sql.trim() || !selectedDbId) return;

        setSubmitting(true);
        setSubmissionStatus({ status: 'PENDING', message: 'Queued...' });
        setResult(null);
        setError(null);

        try {
            const payloadSql = sql.replace(/\r\n/g, '\n');
            await executorApi.submit({
                questionId: question.id,
                sql: payloadSql,
                typeDatabaseId: selectedDbId,
            });
            // Submission sent successfully, wait 3 seconds then check result
            toast.success('Submission queued');
            setTimeout(() => checkSubmissionResult(question.id), 3000);
        } catch (err) {
            setSubmissionStatus({ status: 'ERROR', message: 'Network error' });
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!question) return <div className="p-8 text-center">Question not found</div>;

    return (
        <div className="flex h-[calc(100vh-135px)] gap-4 overflow-hidden py-10">
            {/* Left Pane: Description */}
            <div className="w-1/2 flex flex-col glass-panel rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary">
                            {question.questionCode}
                        </span>
                        <h1 className="text-xl font-bold truncate" title={question.title}>
                            {question.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                        <span
                            className={clsx(
                                'font-medium',
                                question.level === 'EASY'
                                    ? 'text-success'
                                    : question.level === 'MEDIUM'
                                    ? 'text-warning'
                                    : 'text-error',
                            )}
                        >
                            {question.level}
                        </span>
                        <span>Points: {question.point}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: question.content }} />
                </div>
            </div>

            {/* Right Pane: Editor & Results */}
            <div id="right-pane" className="w-1/2 flex flex-col gap-4">
                {/* Toolbar */}
                <div className="flex items-center justify-between glass-panel p-2 rounded-xl">
                    <div className="flex items-center gap-2 px-2">
                        <Database className="w-4 h-4 text-text-muted" />
                        <select
                            value={selectedDbId || ''}
                            onChange={(e) => setSelectedDbId(e.target.value)}
                            className="bg-transparent text-sm focus:outline-none text-text-main"
                        >
                            {question.questionDetails?.map((db) => (
                                <option key={db.typeDatabase.id} value={db.typeDatabase.id} className="bg-bg-panel">
                                    {db.typeDatabase.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRun}
                            disabled={executing || submitting}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {executing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 text-success" />
                            )}
                            Run
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={executing || submitting}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover transition-colors text-sm font-medium text-white disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Submit
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 min-h-[240px] glass-panel rounded-xl overflow-hidden border border-white/10">
                    <SQLEditor value={sql} onChange={setSql} disabled={executing || submitting} />
                </div>

                {/* Results / Status */}
                <div
                    className="glass-panel rounded-xl overflow-hidden flex flex-col flex-shrink-0"
                    style={{ height: outputHeight }}
                >
                    {/* Resize Handle */}
                    <div
                        className="h-2 cursor-ns-resize bg-white/10 hover:bg-white/10 transition-colors flex items-center justify-center group"
                        onMouseDown={() => setIsResizing(true)}
                    >
                        <GripHorizontal className="w-4 h-4 text-text-muted opacity-50 group-hover:opacity-100" />
                    </div>
                    <div className="px-2 py-1 border-b border-white/10 bg-white/5 text-xs font-medium text-text-muted flex justify-between items-center">
                        <span>Output</span>
                        {submissionStatus && (
                            <span
                                className={clsx(
                                    'flex items-center gap-1.5',
                                    submissionStatus.status === 'AC'
                                        ? 'text-success'
                                        : submissionStatus.status === 'PENDING'
                                        ? 'text-warning'
                                        : 'text-error',
                                )}
                            >
                                {submissionStatus.status === 'AC' && <CheckCircle2 className="w-3 h-3" />}
                                {submissionStatus.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                {(submissionStatus.status === 'WA' || submissionStatus.status === 'RTE') && (
                                    <XCircle className="w-3 h-3" />
                                )}
                                {submissionStatus.status}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        {submissionStatus && !result && !error ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                {submissionStatus.status === 'PENDING' || submissionStatus.status === 'QUEUE' ? (
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                ) : submissionStatus.status === 'AC' ? (
                                    <CheckCircle2 className="w-12 h-12 text-success" />
                                ) : (
                                    <XCircle className="w-12 h-12 text-error" />
                                )}

                                <div className="text-center">
                                    <p className="text-lg font-medium">
                                        {submissionStatus.status === 'AC'
                                            ? 'Accepted'
                                            : submissionStatus.status === 'WA'
                                            ? 'Wrong Answer'
                                            : submissionStatus.status === 'TLE'
                                            ? 'Time Limit Exceeded'
                                            : submissionStatus.status === 'RTE'
                                            ? 'Runtime Error'
                                            : submissionStatus.status === 'CE'
                                            ? 'Compilation Error'
                                            : submissionStatus.status}
                                    </p>
                                    {submissionStatus.testPass !== undefined && (
                                        <p className="text-sm font-mono mt-1">
                                            Test cases: {submissionStatus.testPass}/{submissionStatus.totalTest}
                                        </p>
                                    )}
                                </div>

                                <p className="text-sm text-text-muted px-4 text-center">
                                    {submissionStatus.status === 'AC'
                                        ? 'Bài này đã có solution AC, check kết quả trên DB PTIT ấy hahahahaha!'
                                        : submissionStatus.message || 'Check your logic and try again.'}
                                </p>
                            </div>
                        ) : (
                            <ResultTable data={result} error={error} loading={executing} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Problem;
