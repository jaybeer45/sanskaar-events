// src/components/creator-video/ProfileHeader.jsx
// Instagram-style header: avatar, name and tappable counts.
// Used by My Creator Videos and the public creator profile.

const Stat = ({ value, label, onClick, href }) => {
    const content = (
        <>
            <span className="block font-heading text-xl font-extrabold text-night">{value}</span>
            <span className="block text-sm text-ink/60">{label}</span>
        </>
    );
    const className = 'rounded-xl px-3 py-1.5 text-center transition-colors hover:bg-night/5';

    if (href) {
        return <a href={href} className={className}>{content}</a>;
    }
    return (
        <button type="button" onClick={onClick} className={className}>
            {content}
        </button>
    );
};

// stats: [{ label, value, onClick?, href? }]; children render under the counts (e.g. a Follow button)
const ProfileHeader = ({ name, avatar, stats = [], children }) => (
    <div className="flex items-center gap-5 sm:gap-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-night font-heading text-3xl font-extrabold text-marigold ring-2 ring-marigold ring-offset-2 ring-offset-moonlight sm:h-28 sm:w-28">
            {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
                name?.[0]?.toUpperCase() || '?'
            )}
        </div>

        <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-2xl font-extrabold text-night sm:text-3xl">{name}</h1>
            <div className="-ml-3 mt-2 flex flex-wrap items-center">
                {stats.map((s) => (
                    <Stat key={s.label} {...s} />
                ))}
            </div>
            {children && <div className="mt-3">{children}</div>}
        </div>
    </div>
);

export default ProfileHeader;