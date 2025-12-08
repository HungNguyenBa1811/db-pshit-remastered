import { Link } from 'react-router-dom';
import { Database, CheckCircle2, BarChart3, Users, XCircle, Clock, MinusCircle } from 'lucide-react';
import clsx from 'clsx';

const QuestionCard = ({ question, status }) => {
    const getLevelColor = (level) => {
        switch (level?.toUpperCase()) {
            case 'EASY':
                return 'text-success bg-success/10 border-success/20';
            case 'MEDIUM':
                return 'text-warning bg-warning/10 border-warning/20';
            case 'HARD':
                return 'text-error bg-error/10 border-error/20';
            default:
                return 'text-text-muted bg-white/5 border-white/10';
        }
    };

    return (
        <Link
            to={`/problem/${question.questionCode}`}
            className="group relative flex flex-col p-5 rounded-xl glass-panel hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:-translate-y-1"
        >
            <div className="flex items-start justify-between mb-4">
                <span
                    className={clsx(
                        'px-2.5 py-1 rounded-md text-xs font-semibold border',
                        getLevelColor(question.level),
                    )}
                >
                    {question.level}
                </span>
                <div className="flex items-center gap-2">
                    {status === 'AC' ? (
                        <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-success"
                            title="Accepted"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            AC
                        </span>
                    ) : status === 'WA' ? (
                        <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-error"
                            title="Wrong Answer"
                        >
                            <XCircle className="w-4 h-4" />
                            WA
                        </span>
                    ) : status === 'TLE' ? (
                        <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-error"
                            title="Time Limit Exceeded"
                        >
                            <XCircle className="w-4 h-4" />
                            TLE
                        </span>
                    ) : status === 'CE' ? (
                        <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-error"
                            title="Compile Error"
                        >
                            <XCircle className="w-4 h-4" />
                            CE
                        </span>
                    ) : (
                        // Default: Not Attempted (2-letter code NA) with icon
                        <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-text-muted"
                            title="Not attempted"
                        >
                            <MinusCircle className="w-4 h-4" />
                            NA
                        </span>
                    )}

                    <span className="text-xs font-mono text-text-muted bg-white/5 px-2 py-1 rounded">
                        {question.questionCode}
                    </span>
                    {question.type && (
                        <span
                            className="text-xs font-mono text-text-muted bg-white/3 px-2 py-1 rounded ml-1"
                            title={`Type: ${question.type}`}
                        >
                            {String(question.type).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {question.title}
            </h3>

            <div className="mt-auto pt-4 flex items-center justify-between text-sm text-text-muted">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5" title="Acceptance Rate">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span>{question.acceptance}%</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Total Submissions">
                        <Users className="w-4 h-4" />
                        <span>{question.totalSub}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5" title="Database Types">
                    <Database className="w-4 h-4" />
                    <span>{question.questionDetails?.length || 1}</span>
                </div>
            </div>
        </Link>
    );
};

export default QuestionCard;
