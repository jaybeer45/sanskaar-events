// src/components/events/EventMediaCarousel.jsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import EventVideoBanner from './EventVideoBanner';
import { EVENT_CATEGORIES } from '../../constants/categories';

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

    // Events without any image or video get a night gradient with the category icon
    if (!media.length) {
        const emoji = EVENT_CATEGORIES.find((c) => c.id === event.category)?.emoji || '🎟️';
        return (
            <div
                aria-hidden="true"
                className="h-48 md:h-64 flex items-center justify-center text-6xl bg-gradient-to-br from-night via-night-soft to-night"
            >
                {emoji}
            </div>
        );
    }

    const activeMedia = media[activeIndex];

    const previous = () => {
        setActiveIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    };

    const next = () => {
        setActiveIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="surface-night bg-night">
            {/* Main media */}
            <div className="relative h-64 sm:h-80 md:h-[26rem] overflow-hidden">
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

                {media.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={previous}
                            aria-label="Previous media"
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-night flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label="Next media"
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-night flex items-center justify-center transition-colors"
                        >
                            <ChevronRight size={22} />
                        </button>

                        <span className="absolute bottom-3 left-3 z-20 rounded-pill bg-black/55 text-white text-xs font-semibold px-3 py-1">
                            {activeIndex + 1} / {media.length}
                        </span>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {media.length > 1 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto scrollbar-none">
                    {media.map((item, index) => {
                        const isActive = activeIndex === index;
                        return (
                            <button
                                key={`${item.url}-${index}`}
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                aria-label={`Show ${item.type === 'video' ? 'video' : 'photo'} ${index + 1}`}
                                aria-current={isActive}
                                className={`relative shrink-0 w-24 h-16 rounded-xl overflow-hidden transition-opacity ${isActive
                                        ? 'ring-2 ring-marigold ring-offset-2 ring-offset-night'
                                        : 'opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img
                                    src={item.type === 'video' ? item.poster || event.images?.[0] : item.url}
                                    alt=""
                                    className="w-full h-full object-cover bg-night-soft"
                                />
                                {item.type === 'video' && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                        <Play size={16} className="text-white fill-white" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EventMediaCarousel;