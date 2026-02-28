import { useState, useRef } from 'react';
import { Upload, X, ChevronRight, CheckCircle2 } from 'lucide-react';

interface OnboardingProps {
    user: any;
    onComplete: () => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
    const [name, setName] = useState(user?.username?.startsWith('Guest_') ? '' : (user?.username || ''));
    const [skills, setSkills] = useState<string[]>([]);
    const [customSkill, setCustomSkill] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/resume/parse', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to parse resume');

            // Merge detected skills with existing ones, avoiding duplicates
            const newSkills = Array.from(new Set([...skills, ...(data.extracted_skills || [])]));
            setSkills(newSkills);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addCustomSkill = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customSkill.trim()) return;
        const normalized = customSkill.trim().toLowerCase();
        if (!skills.includes(normalized)) {
            setSkills([...skills, normalized]);
        }
        setCustomSkill('');
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleSave = async () => {
        if (skills.length === 0) {
            setError('Please add at least one skill to continue.');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/user/skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ skills, name })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to save skills');
            }

            onComplete();
        } catch (err: any) {
            setError(err.message);
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-3xl w-full bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-10 shadow-2xl relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Map Your Skills
                    </h1>
                    <p className="text-neutral-400 text-lg">
                        Let's build your AI skill profile. Upload your resume or add your skills manually.
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400">
                        {error}
                    </div>
                )}

                <div className="mb-8 bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Your Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Input Methods */}
                    <div className="flex flex-col gap-6">
                        {/* Resume Upload */}
                        <div
                            className="border-2 border-dashed border-neutral-700 hover:border-blue-500/50 hover:bg-neutral-800/50 rounded-2xl p-8 transition-all text-center cursor-pointer group relative"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            <div className="w-16 h-16 bg-neutral-800 group-hover:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                                <Upload className={`w-8 h-8 ${isUploading ? 'text-blue-400 animate-bounce' : 'text-neutral-400 group-hover:text-blue-400'}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {isUploading ? 'Analyzing Resume...' : 'Upload Resume'}
                            </h3>
                            <p className="text-sm text-neutral-500">
                                PDF or DOCX up to 5MB
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-neutral-600">
                            <div className="h-px bg-neutral-800 flex-1"></div>
                            <span className="text-xs uppercase font-bold tracking-wider">OR</span>
                            <div className="h-px bg-neutral-800 flex-1"></div>
                        </div>

                        {/* Manual Entry */}
                        <form onSubmit={addCustomSkill}>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Add Skill Manually</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customSkill}
                                    onChange={(e) => setCustomSkill(e.target.value)}
                                    placeholder="e.g. Python, React, AWS..."
                                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!customSkill.trim()}
                                    className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Skill Review */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            Detected Skills ({skills.length})
                        </h3>

                        <div className="flex-1 overflow-y-auto min-h-[200px] mb-6">
                            {skills.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-sm">
                                    <p>No skills added yet.</p>
                                    <p>Upload a resume to auto-populate.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 content-start">
                                    {skills.map((skill, index) => (
                                        <div
                                            key={index}
                                            className="bg-neutral-800 border border-neutral-700 text-neutral-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm capitalize group hover:bg-neutral-700 transition-colors"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => removeSkill(skill)}
                                                className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving || skills.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:shadow-none"
                        >
                            {isSaving ? 'Saving Profile...' : 'Save & Dashboard'}
                            {!isSaving && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
