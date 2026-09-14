// src/components/organizer/GuidelinesSidebar.jsx
import { Info } from 'lucide-react';

const TIPS = [
    'Events must be in or near Bareilly',
    'Approval takes 24-48 hours on weekdays',
    'Include a clear event image for better visibility',
    'Free events get 2× more clicks',
    'Add a working booking URL for paid events',
    'Events with complete info are prioritised',
];

const GuidelinesSidebar = () => (
    <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-gray-200 p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
                <Info size={15} className="text-brand-red" />
                <h3 className="font-black text-sm text-gray-900">Submission Guidelines</h3>
            </div>

            <ul className="space-y-3 text-xs text-gray-600">
                {TIPS.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 shrink-0 bg-brand-red text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                        </span>
                        {tip}
                    </li>
                ))}
            </ul>

            <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-900 mb-1">Need help?</p>
                <p className="text-xs text-gray-500">
                    WhatsApp us at{' '}
                    <span className="font-semibold text-brand-red">+91 98765 43210</span>
                </p>
            </div>
        </div>
    </div>
);

export default GuidelinesSidebar;