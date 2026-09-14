// src/components/events/EventArtists.jsx

import { User, Sparkles } from 'lucide-react';

// BookMyShow-style artist section
// Shows nothing if the event has no artists.
const EventArtists = ({ artists }) => {
    if (!artists?.length) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 mb-6 shadow-sm">

            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-red-500" />
                        <h2 className="font-black text-lg md:text-xl text-gray-900">
                            {artists.length > 1 ? 'Artists' : 'Artist'}
                        </h2>
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                        Meet the artists performing at this event
                    </p>
                </div>
            </div>

            {/* Artist Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {artists.map((artist, i) => {
                    const CardWrapper = artist.socialLink ? 'a' : 'div';
                    const wrapperProps = artist.socialLink
                        ? {
                            href: artist.socialLink,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                        }
                        : {};

                    return (
                        <CardWrapper
                            key={artist._id || i}
                            {...wrapperProps}
                            className={`group text-center block ${artist.socialLink ? 'cursor-pointer' : ''}`}
                        >
                            {/* Profile Image */}
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3">
                                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-2 border-gray-100 group-hover:border-red-400 transition-all duration-300 group-hover:shadow-md">

                                    {artist.photo ? (
                                        <img
                                            src={artist.photo}
                                            alt={artist.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User
                                                size={34}
                                                className="text-gray-300"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Artist Name */}
                            <p className="font-bold text-sm text-gray-900 truncate px-1">
                                {artist.name}
                            </p>

                            {/* Artist Bio */}
                            {artist.bio && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                    {artist.bio}
                                </p>
                            )}
                        </CardWrapper>
                    );
                })}
            </div>
        </div>
    );
};

export default EventArtists;