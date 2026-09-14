import { useState } from 'react';
import EventVideoBanner from './EventVideoBanner';

const EventMediaCarousel = ({ event }) => {
    const media = [
        ...(event.promotionalVideo?.url
            ? [{
                type: 'video',
                url: event.promotionalVideo.url,
                poster: event.promotionalVideo.thumbnailUrl || event.images?.[0],
            }]
            : []),

        ...(event.images || []).map((image) => ({
            type: 'image',
            url: image,
        })),
    ];

    const [activeIndex, setActiveIndex] = useState(0);

    if (!media.length) return null;

    const activeMedia = media[activeIndex];

    const previous = () => {
        setActiveIndex((prev) =>
            prev === 0 ? media.length - 1 : prev - 1
        );
    };

    const next = () => {
        setActiveIndex((prev) =>
            prev === media.length - 1 ? 0 : prev + 1
        );
    };

    return (
        <div className="relative w-full">
            {/* Main media */}
            <div className="relative h-64 md:h-96 overflow-hidden">
                {activeMedia.type === 'video' ? (
                    <EventVideoBanner
                        videoUrl={activeMedia.url}
                        posterUrl={activeMedia.poster}
                        className="h-full w-full"
                    />
                ) : (
                    <img
                        src={activeMedia.url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Previous */}
                {media.length > 1 && (
                    <button
                        type="button"
                        onClick={previous}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20
                       w-10 h-10 rounded-full bg-black/60 text-white"
                        aria-label="Previous media"
                    >
                        ‹
                    </button>
                )}

                {/* Next */}
                {media.length > 1 && (
                    <button
                        type="button"
                        onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20
                       w-10 h-10 rounded-full bg-black/60 text-white"
                        aria-label="Next media"
                    >
                        ›
                    </button>
                )}
            </div>

            {/* Thumbnails */}
            {media.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                    {media.map((item, index) => (
                        <button
                            key={`${item.url}-${index}`}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`relative flex-shrink-0 w-20 h-14 overflow-hidden
                border-2 ${activeIndex === index
                                    ? 'border-brand-red'
                                    : 'border-transparent'
                                }`}
                        >
                            {item.type === 'video' ? (
                                <>
                                    <img
                                        src={item.poster || event.images?.[0]}
                                        alt="Video thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                                        ▶
                                    </span>
                                </>
                            ) : (
                                <img
                                    src={item.url}
                                    alt={`${event.title} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventMediaCarousel;