// src/pages/Onboarding/OnboardingPage.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MapPin, Check } from 'lucide-react';
import { CITIES, setCity } from '../../features/location/locationSlice';
import { INTERESTS } from '../../constants/interests';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ROUTES } from '../../constants/routes';

const TOTAL_STEPS = 3;

const OnboardingPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [selectedCity, setSelectedCity] = useState(CITIES[0]);
    const [selectedInterests, setSelectedInterests] = useState([]);

    // Alert prefs ko localStorage me save karte hain — backend abhi ready nahi hai
    const [alerts, setAlerts] = useLocalStorage('sanskaar_alert_prefs', {
        push: true,
        email: true,
        whatsapp: false,
    });

    const toggleInterest = (interest) => {
        setSelectedInterests((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        );
    };

    const toggleAlert = (key) => setAlerts((prev) => ({ ...prev, [key]: !prev[key] }));

    const handleNext = () => step < TOTAL_STEPS && setStep((s) => s + 1);
    const handleBack = () => step > 1 && setStep((s) => s - 1);

    const handleFinish = () => {
        dispatch(setCity(selectedCity));
        navigate(ROUTES.HOME, { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg bg-white shadow-xl rounded-lg p-8">

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-brand-red' : s < step ? 'w-4 bg-brand-red/50' : 'w-4 bg-gray-200'
                                }`}
                        />
                    ))}
                </div>

                {/* Step 1 — City */}
                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Where are you?</h2>
                        <p className="text-sm text-gray-500 mb-6">We'll show you events happening near you.</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {CITIES.slice(0, 4).map((city) => (
                                <button
                                    key={city.name}
                                    type="button"
                                    onClick={() => setSelectedCity(city)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${selectedCity.name === city.name
                                            ? 'bg-brand-red text-white border-brand-red'
                                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    {city.name}
                                </button>
                            ))}
                        </div>

                        <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-brand-red hover:underline">
                            <MapPin size={14} /> Use my location
                        </button>
                    </div>
                )}

                {/* Step 2 — Interests */}
                {step === 2 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">What are you into?</h2>
                        <p className="text-sm text-gray-500 mb-6">Pick a few — helps us personalize your feed.</p>

                        <div className="flex flex-wrap gap-2">
                            {INTERESTS.map((interest) => {
                                const isSelected = selectedInterests.includes(interest.id);
                                return (
                                    <button
                                        key={interest.id}
                                        type="button"
                                        onClick={() => toggleInterest(interest.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors flex items-center gap-1.5 ${isSelected
                                                ? 'bg-brand-red text-white border-brand-red'
                                                : `${interest.color} border-transparent hover:border-gray-300`
                                            }`}
                                    >
                                        <span>{interest.emoji}</span>
                                        {interest.label}
                                        {isSelected && <Check size={13} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 3 — Alerts */}
                {step === 3 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Stay in the loop</h2>
                        <p className="text-sm text-gray-500 mb-6">Choose how you'd like to hear about new events.</p>

                        <div className="space-y-3">
                            {[
                                { key: 'push', label: 'Push notifications' },
                                { key: 'email', label: 'Email' },
                                { key: 'whatsapp', label: 'WhatsApp' },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={alerts[key]}
                                        onClick={() => toggleAlert(key)}
                                        className={`w-10 h-6 rounded-full transition-colors relative ${alerts[key] ? 'bg-brand-red' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${alerts[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                    {step > 1 ? (
                        <button type="button" onClick={handleBack} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
                            Back
                        </button>
                    ) : <span />}

                    {step < TOTAL_STEPS ? (
                        <button type="button" onClick={handleNext} className="rounded-lg bg-brand-red hover:bg-brand-red-hover text-white font-semibold text-sm px-6 py-2.5 transition-colors">
                            Next
                        </button>
                    ) : (
                        <button type="button" onClick={handleFinish} className="rounded-lg bg-brand-red hover:bg-brand-red-hover text-white font-semibold text-sm px-6 py-2.5 transition-colors">
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;