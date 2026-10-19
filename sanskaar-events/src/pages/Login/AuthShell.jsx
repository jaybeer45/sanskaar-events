// src/pages/Login/AuthShell.jsx
// Shared layout for the sign in and sign up pages.
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const Wordmark = () => (
    <Link
        to={ROUTES.HOME}
        aria-label="Sanskaar Events home"
        className="inline-flex items-baseline gap-1.5"
    >
        <span className="font-body font-bold text-3xl leading-tight text-white">संस्कार</span>
        <span className="font-heading font-semibold text-sm text-white/60">events</span>
    </Link>
);

const AuthShell = ({ headline, intro, points = [], children }) => (
    <div className="px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-mist bg-white shadow-card md:grid md:grid-cols-[5fr_6fr]">
            {/* Mobile brand strip */}
            <div className="surface-night bg-night px-6 py-5 text-white md:hidden">
                <Wordmark />
                <p className="mt-2 font-heading font-semibold text-lg leading-snug">{headline}</p>
            </div>

            {/* Desktop brand panel */}
            <aside className="surface-night hidden flex-col justify-between bg-night p-10 text-white md:flex">
                <div>
                    <Wordmark />
                    <p className="mt-10 font-heading font-extrabold text-4xl leading-[1.1]">{headline}</p>
                    {intro && <p className="mt-4 leading-relaxed text-white/70">{intro}</p>}
                    {points.length > 0 && (
                        <ul className="mt-8 space-y-3">
                            {points.map((point) => (
                                <li key={point} className="flex items-start gap-3 text-white/85">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-marigold text-night">
                                        <Check size={12} strokeWidth={3} />
                                    </span>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Decorative ticket stub */}
                <div aria-hidden="true" className="mt-10 flex rounded-ticket bg-white text-night">
                    <div className="flex-1 p-4">
                        <p className="text-xs text-ink/60">Admit one</p>
                        <p className="font-heading font-bold text-lg leading-snug">Your next night out</p>
                    </div>
                    <div className="relative flex w-20 shrink-0 items-center justify-center border-l-2 border-dashed border-mist">
                        <span className="absolute -top-2.5 -left-[11px] h-5 w-5 rounded-full bg-night" />
                        <span className="absolute -bottom-2.5 -left-[11px] h-5 w-5 rounded-full bg-night" />
                        <span className="font-heading font-extrabold text-2xl">01</span>
                    </div>
                </div>
            </aside>

            <div className="p-6 sm:p-10">{children}</div>
        </div>
    </div>
);

export default AuthShell;