// src/components/events/EventArtists.jsx

// Shows nothing if the event has no artists.
const EventArtists = ({ artists }) => {
    if (!artists?.length) return null;

    return (
        <section className="card p-6 mb-6">
            <h2 className="font-heading font-bold text-xl text-night">
                {artists.length > 1 ? 'Artists' : 'Artist'}
            </h2>
            <p className="text-sm text-ink/60 mt-1">Performing at this event</p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                {artists.map((artist, i) => {
                    const Wrapper = artist.socialLink ? 'a' : 'div';
                    const wrapperProps = artist.socialLink
                        ? {
                            href: artist.socialLink,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            'aria-label': `${artist.name}, opens their profile in a new tab`,
                        }
                        : {};

                    return (
                        <Wrapper
                            key={artist._id || i}
                            {...wrapperProps}
                            className="block text-center rounded-xl"
                        >
                            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden bg-night flex items-center justify-center ring-2 ring-marigold ring-offset-2 ring-offset-white">
                                {artist.photo ? (
                                    <img src={artist.photo} alt={artist.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-heading font-bold text-3xl text-marigold">
                                        {artist.name?.[0]?.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <p className="mt-3 font-heading font-semibold text-night truncate px-1">{artist.name}</p>

                            {artist.bio && (
                                <p className="mt-1 text-sm text-ink/60 line-clamp-2 leading-snug">{artist.bio}</p>
                            )}
                        </Wrapper>
                    );
                })}
            </div>
        </section>
    );
};

export default EventArtists;