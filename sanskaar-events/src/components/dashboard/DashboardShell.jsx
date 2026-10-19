// src/components/dashboard/DashboardShell.jsx
// Common frame for the vendor dashboard pages: back link, title, optional action and tabs
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const DashboardShell = ({ backTo, backLabel = 'Back', title, subtitle, action, tabs, children }) => (
    <div>
        <div className="border-b border-mist bg-white">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
                {backTo && (
                    <div className="pt-3">
                        <Link
                            to={backTo}
                            className="inline-flex items-center gap-1 text-sm text-ink/60 transition-colors hover:text-night"
                        >
                            <ChevronLeft size={16} /> {backLabel}
                        </Link>
                    </div>
                )}
                <div className="flex items-end justify-between gap-4 py-5">
                    <div className="min-w-0">
                        <h1 className="font-heading text-3xl font-extrabold text-night">{title}</h1>
                        {subtitle && <p className="mt-1 text-ink/60">{subtitle}</p>}
                    </div>
                    {action}
                </div>
                {tabs}
            </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>
    </div>
);

export default DashboardShell;