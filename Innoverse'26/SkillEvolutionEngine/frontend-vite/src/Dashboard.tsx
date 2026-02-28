"use client";

import { useState, useEffect, useRef } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
    TrendingUp, Trophy, Target, Briefcase, User, FileText, Upload, Plus, BookOpen, CheckCircle2, X, ExternalLink
} from "lucide-react";

export default function Dashboard({ user: initialUser, onLogout }: { user: any, onLogout: () => void }) {
    const [activeTab, setActiveTab] = useState("profile");
    const [dashboardData, setDashboardData] = useState<any>(null);

    // Profile & Skills State
    const [customSkill, setCustomSkill] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // MCQ Assessment State
    const [isAssessing, setIsAssessing] = useState(false);
    const [currentSkill, setCurrentSkill] = useState("");
    const [questions, setQuestions] = useState<any[]>([]);
    const [userAnswers, setUserAnswers] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState<any>(null);
    const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);

    const fetchDashboardItems = async () => {
        try {
            const token = localStorage.getItem('token');
            const dashRes = await fetch('http://127.0.0.1:8000/api/dashboard/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (dashRes.ok) setDashboardData(await dashRes.json());
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        }
    };

    const updateSkillsApi = async (skillsArray: string[]) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/user/skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ skills: skillsArray })
            });

            if (res.ok) {
                fetchDashboardItems(); // Refresh dashboard data instantly
            } else {
                const data = await res.json();
                setError(data.detail || 'Failed to update skills');
            }
        } catch (err: any) {
            setError(err.message || "Failed to update skills");
        }
    };

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
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to parse resume');

            const currentSkills = (dashboardData?.user?.skills || []).map((s: any) => s.skill_name.toLowerCase());
            const newSkills = Array.from(new Set([...currentSkills, ...(data.extracted_skills || [])]));

            await updateSkillsApi(newSkills);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addCustomSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customSkill.trim()) return;

        const normalized = customSkill.trim().toLowerCase();
        const currentSkills = (dashboardData?.user?.skills || []).map((s: any) => s.skill_name.toLowerCase());

        if (!currentSkills.includes(normalized)) {
            const newSkills = [...currentSkills, normalized];
            await updateSkillsApi(newSkills);
        }
        setCustomSkill('');
    };

    const removeSkill = async (skillToRemove: string) => {
        const currentSkills = (dashboardData?.user?.skills || []).map((s: any) => s.skill_name.toLowerCase());
        const newSkills = currentSkills.filter((s: string) => s !== skillToRemove.toLowerCase());
        await updateSkillsApi(newSkills);
    };

    useEffect(() => {
        fetchDashboardItems();
    }, []);

    const handleGenerateAssignment = async () => {
        // Automatically start assessment for a skill from the user's profile
        const targetSkill = user?.skills?.[0]?.skill_name || "Python";
        setActiveTab("assignments");
        startAssessment(targetSkill);
    };

    const startAssessment = async (skill: string) => {
        setIsAssessing(true);
        setCurrentSkill(skill);
        setAssessmentResult(null);
        setUserAnswers({});
        setAssessmentHistory([]);

        try {
            const token = localStorage.getItem('token');
            const [qRes, hRes] = await Promise.all([
                fetch(`http://127.0.0.1:8000/api/user/assessments/questions?skill=${skill}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://127.0.0.1:8000/api/user/assessments/history?skill=${skill}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (qRes.ok) {
                const qData = await qRes.json();
                setQuestions(qData.questions);
            }
            if (hRes.ok) {
                const hData = await hRes.json();
                setAssessmentHistory(hData);
            }
        } catch (err) {
            console.error("Failed to fetch assessment data", err);
        }
    };

    const handleOptionSelect = (qId: number, oIdx: number) => {
        setUserAnswers({ ...userAnswers, [qId]: oIdx });
    };

    const handleSubmitAssessment = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const answers = Object.entries(userAnswers).map(([qId, oIdx]) => ({
                question_id: parseInt(qId),
                selected_option: oIdx
            }));

            const res = await fetch('http://127.0.0.1:8000/api/user/assessments/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ skill: currentSkill, answers })
            });

            if (res.ok) {
                const result = await res.json();
                setAssessmentResult(result);
                // Refresh dashboard to show new XP
                fetchDashboardItems();
            }
        } catch (err) {
            console.error("Failed to submit assessment", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const user = dashboardData?.user || initialUser;
    const trendData = dashboardData?.trends || [];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 flex">
            {/* Sidebar Navigation */}
            <nav
                className="w-64 bg-neutral-900 border-r border-neutral-800 p-6 flex flex-col gap-8"
                aria-label="Main Navigation"
            >
                <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    SkillRadar
                </div>

                <div className="flex flex-col gap-2">
                    {["profile", "overview", "recommendations", "assignments", "jobs"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-left px-4 py-3 rounded-xl capitalize font-medium transition-colors flex items-center ${activeTab === tab
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                                }`}
                            aria-current={activeTab === tab ? "page" : undefined}
                        >
                            {tab === "profile" && <User className="mr-3 w-5 h-5" />}
                            {tab === "overview" && <TrendingUp className="mr-3 w-5 h-5" />}
                            {tab === "recommendations" && <BookOpen className="mr-3 w-5 h-5" />}
                            {tab === "assignments" && <Target className="mr-3 w-5 h-5" />}
                            {tab === "jobs" && <Briefcase className="mr-3 w-5 h-5" />}
                            {tab === "assignments" ? "Missions" : tab}
                        </button>
                    ))}
                </div>

                {/* Gamification Status Card */}
                <div className="mt-auto p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 flex items-center justify-center shadow-inner">
                            <Trophy className="w-5 h-5 text-slate-800" />
                        </div>
                        <div>
                            <div className="text-sm font-bold">Silver League</div>
                            <div className="text-xs text-neutral-400">4,200 XP</div>
                        </div>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-2 mt-3">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                    <div className="text-[10px] text-right mt-1 text-neutral-500">800 XP to Gold</div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome back, {user?.username || 'Pioneer'}</h1>
                        <p className="text-neutral-400">Here is your skill evolution report for today.</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onLogout}
                            className="bg-neutral-800 hover:bg-red-600/20 hover:text-red-400 border border-neutral-700 hover:border-red-500/50 text-white px-6 py-2 rounded-lg font-medium transition-all"
                        >
                            Log Out
                        </button>
                    </div>
                </header>

                {activeTab === "profile" && (
                    <div className="flex flex-col gap-8 max-w-4xl">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex items-center justify-between shadow-xl">
                            <div>
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Pioneer Profile</h2>
                                <p className="text-neutral-400 mt-2">Manage your foundational skills & rank.</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-center min-w-[120px]">
                                    <div className="text-xs text-neutral-500 font-bold uppercase mb-1">League</div>
                                    <div className="text-xl font-black text-blue-400">{user?.league || 'Unranked'}</div>
                                </div>
                                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-center min-w-[120px]">
                                    <div className="text-xs text-neutral-500 font-bold uppercase mb-1">Total XP</div>
                                    <div className="text-xl font-black text-emerald-400">{user?.total_xp || 0}</div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            {/* Skills Management */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    Active Core Skills
                                </h3>

                                <div className="flex-1 mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        {(dashboardData?.user?.skills || []).map((skillObj: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="bg-neutral-800 border border-neutral-700 text-neutral-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm capitalize group hover:bg-neutral-700 transition-colors"
                                            >
                                                {skillObj.skill_name}
                                                <button
                                                    onClick={() => removeSkill(skillObj.skill_name)}
                                                    className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {(!dashboardData?.user?.skills || dashboardData?.user?.skills.length === 0) && (
                                            <div className="text-neutral-600 text-sm py-4">No skills mapped yet.</div>
                                        )}
                                    </div>
                                </div>

                                <form onSubmit={addCustomSkill} className="mt-auto">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customSkill}
                                            onChange={(e) => setCustomSkill(e.target.value)}
                                            placeholder="Add skill (e.g. React)..."
                                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!customSkill.trim()}
                                            className="bg-neutral-800 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition-colors shrink-0"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Resume Upload Module */}
                            <div
                                className="border-2 border-dashed border-neutral-700 hover:border-blue-500/50 hover:bg-neutral-800/20 bg-neutral-900 rounded-2xl p-8 transition-all text-center flex flex-col items-center justify-center cursor-pointer group relative"
                                onClick={() => (!isUploading && fileInputRef.current) ? fileInputRef.current.click() : null}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 group-hover:bg-blue-900/30 group-hover:border-blue-500/50 rounded-full flex items-center justify-center mx-auto mb-4 transition-all">
                                    <Upload className={`w-8 h-8 ${isUploading ? 'text-blue-400 animate-bounce' : 'text-neutral-400 group-hover:text-blue-400'}`} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    {isUploading ? 'Analyzing Document...' : 'Upload Updated Resume'}
                                </h3>
                                <p className="text-sm text-neutral-500 px-4">
                                    Let our AI auto-extract and update your active skill mappings perfectly.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "recommendations" && (
                    <div className="max-w-4xl">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-400" />
                            Your Recommended Pathway
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            {(!dashboardData?.recommendations || dashboardData.recommendations.length === 0) ? (
                                <div className="col-span-2 text-center py-10 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500">
                                    No recommendations available yet. Add more skills to generate a roadmap.
                                </div>
                            ) : (
                                dashboardData.recommendations.map((course: any, idx: number) => (
                                    <a
                                        key={idx}
                                        href={course.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="col-span-1 block p-6 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-800/50 transition-all group shadow-lg shadow-black/40"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-lg leading-tight pr-4 group-hover:text-blue-400 transition-colors">{course.name}</h3>
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${course.category === 'Free' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                {course.category}
                                            </span>
                                        </div>
                                        <div className="text-sm text-neutral-400 mb-4 flex items-center gap-2">
                                            <span className="font-medium text-neutral-300">{course.platform}</span>
                                            <span className="text-neutral-600">•</span>
                                            <span>{course.duration}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-blue-500 text-sm font-medium group-hover:underline">View Course →</span>
                                            <span className="text-emerald-400 font-bold bg-emerald-900/20 px-3 py-1 border border-emerald-500/20 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.1)]">+{course.xp} XP Focus</span>
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "overview" && (
                    <div className="grid grid-cols-3 gap-6">

                        {/* Top Row: Market Forecasting Chart */}
                        <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-6">Market Demand Forecast (6 Months)</h2>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="name" stroke="#666" />
                                        <YAxis stroke="#666" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Line type="monotone" dataKey="python" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                        <Line type="monotone" dataKey="docker" stroke="#10b981" strokeWidth={3} dot={false} />
                                        <Line type="monotone" dataKey="react" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Row: Industry News */}
                        <div className="col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                Industry News
                            </h2>
                            <div className="flex flex-col gap-4 overflow-y-auto">
                                {(!dashboardData?.news || dashboardData.news.length === 0) ? (
                                    <div className="text-center py-6 text-neutral-500 text-sm">No news available.</div>
                                ) : (
                                    dashboardData.news.map((n: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={n.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-blue-500/50 hover:bg-neutral-800 transition-all group"
                                        >
                                            <div className="text-xs text-neutral-500 font-bold uppercase mb-1.5">{n.source}</div>
                                            <div className="text-sm font-medium text-neutral-300 group-hover:text-blue-400 leading-snug">{n.title}</div>
                                        </a>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === "assignments" && (
                    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
                        {!isAssessing && !assessmentResult && (
                            <div className="flex flex-col gap-6">
                                <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-3xl">
                                    <Target className="w-16 h-16 text-blue-500 mx-auto mb-6 opacity-50" />
                                    <h2 className="text-3xl font-bold mb-4">Skill Missions</h2>
                                    <p className="text-neutral-400 mb-8 px-10">
                                        Validate your skills through interactive MCQ challenges.
                                        Pass with 70% or higher to earn massive XP and unlock new leagues.
                                    </p>
                                    <button
                                        onClick={handleGenerateAssignment}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/40 text-lg hover:scale-105 active:scale-95"
                                    >
                                        Start Next Mission
                                    </button>
                                </div>

                                {dashboardData?.latest_results?.length > 0 && (
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
                                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-400" />
                                            Recent Protocol History
                                        </h3>
                                        <div className="space-y-4">
                                            {dashboardData.latest_results.map((res: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                                                    <div>
                                                        <div className="font-bold text-neutral-200 uppercase text-xs tracking-wider">{res.skill}</div>
                                                        <div className="text-[10px] text-neutral-500">{new Date(res.date).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <div className={`font-black ${res.passed ? 'text-emerald-400' : 'text-red-400'}`}>{res.score}%</div>
                                                            <div className="text-[10px] uppercase font-bold text-neutral-600">{res.passed ? 'Passed' : 'Failed'}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => startAssessment(res.skill)}
                                                            className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest"
                                                        >
                                                            Re-attempt
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {isAssessing && !assessmentResult && (
                            <div className="flex flex-col gap-8">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-blue-400 italic">Target: {currentSkill}</h2>
                                        <p className="text-sm text-neutral-500">Answer all questions to complete the mission.</p>
                                    </div>
                                    <div className="bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800 font-mono text-emerald-400">
                                        Mission Active
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {questions.length > 0 ? (
                                        questions.map((q, qIdx) => (
                                            <div key={q.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
                                                <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-4">Question {qIdx + 1}</div>
                                                <h3 className="text-xl font-medium mb-8 leading-relaxed">{q.question}</h3>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {q.options.map((opt: string, oIdx: number) => (
                                                        <button
                                                            key={oIdx}
                                                            onClick={() => handleOptionSelect(q.id, oIdx)}
                                                            className={`p-5 text-left rounded-xl border transition-all flex justify-between items-center group ${userAnswers[q.id] === oIdx
                                                                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                                                : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                                                                }`}
                                                        >
                                                            <span className="font-medium">{opt}</span>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${userAnswers[q.id] === oIdx ? "border-blue-400 bg-blue-400" : "border-neutral-700 group-hover:border-neutral-500"}`}>
                                                                {userAnswers[q.id] === oIdx && <div className="w-2 h-2 bg-neutral-950 rounded-full" />}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-neutral-950 rounded-2xl border border-neutral-800 border-dashed">
                                            <p className="text-neutral-500 italic">Synchronizing protocol questions...</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSubmitAssessment}
                                    disabled={isSubmitting || questions.length === 0 || Object.keys(userAnswers).length < questions.length}
                                    className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl ${questions.length === 0 || Object.keys(userAnswers).length < questions.length
                                        ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
                                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 hover:scale-[1.01] active:scale-[0.99]"
                                        }`}
                                >
                                    {isSubmitting ? "Processing Mission..." : "Transmit Final Answers"}
                                </button>
                            </div>
                        )}

                        {assessmentResult && (
                            <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-3xl animate-in fade-in zoom-in duration-500 px-6">
                                {assessmentResult.passed ? (
                                    <div className="mb-8">
                                        <div className="w-24 h-24 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/50">
                                            <Trophy className="w-12 h-12 text-emerald-400" />
                                        </div>
                                        <h2 className="text-4xl font-black text-emerald-400 mb-2 italic">MISSION PASSED</h2>
                                        <p className="text-neutral-400">Your expertise in {currentSkill} has been confirmed.</p>
                                    </div>
                                ) : (
                                    <div className="mb-8">
                                        <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
                                            <Target className="w-12 h-12 text-red-400" />
                                        </div>
                                        <h2 className="text-4xl font-black text-red-400 mb-2 italic">MISSION FAILED</h2>
                                        <p className="text-neutral-400">Score below protocol requirements (70%).</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-10 max-w-sm mx-auto">
                                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                                        <div className="text-neutral-500 text-xs font-bold uppercase mb-1">Score</div>
                                        <div className={`text-2xl font-black ${assessmentResult.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {assessmentResult.score}%
                                        </div>
                                    </div>
                                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                                        <div className="text-neutral-500 text-xs font-bold uppercase mb-1">XP Earned</div>
                                        <div className="text-2xl font-black text-blue-400">+{assessmentResult.xp_earned} XP</div>
                                    </div>
                                </div>

                                {assessmentHistory.length > 0 && (
                                    <div className="max-w-sm mx-auto mb-10 text-left">
                                        <div className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-4">Historical Data</div>
                                        <div className="space-y-2">
                                            {assessmentHistory.slice(0, 3).map((h, i) => (
                                                <div key={i} className="flex justify-between text-xs border-b border-neutral-800 pb-2">
                                                    <span className="text-neutral-400">{new Date(h.date).toLocaleDateString()}</span>
                                                    <span className={h.passed ? "text-emerald-500" : "text-red-500"}>{h.score}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => startAssessment(currentSkill)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/40"
                                    >
                                        Re-run Protocol
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAssessmentResult(null);
                                            setIsAssessing(false);
                                        }}
                                        className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-4 rounded-2xl font-bold transition-all border border-neutral-700 hover:border-neutral-600"
                                    >
                                        Return to Briefing
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "jobs" && (
                    <div className="flex flex-col gap-8 max-w-4xl">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-3">
                                        <Briefcase className="w-8 h-8 text-blue-400" />
                                        Job Opportunities
                                    </h2>
                                    <p className="text-neutral-400 mt-2">
                                        Based on your active skills, here are direct searches for roles on LinkedIn.
                                    </p>
                                </div>
                                {user?.skills?.length > 0 && (
                                    <a
                                        href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(user.skills.map((s: any) => s.skill_name).join(' '))}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        Search All Skills
                                    </a>
                                )}
                            </div>

                            {!user?.skills || user.skills.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500">
                                    No skills found. Please add skills in your Profile to generate job suggestions.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    {user.skills.map((skill: any, idx: number) => (
                                        <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors group">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xl font-bold capitalize">{skill.skill_name} Roles</h3>
                                                <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                                    High Demand
                                                </span>
                                            </div>
                                            <p className="text-sm text-neutral-400 mb-6">
                                                Find the latest job postings specifically looking for {skill.skill_name} expertise.
                                            </p>
                                            <a
                                                href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(skill.skill_name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-blue-600"
                                            >
                                                <span>View on LinkedIn</span>
                                                <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Placeholder for other tabs to show navigation works */}
                {!["profile", "overview", "recommendations", "assignments", "jobs"].includes(activeTab) && (
                    <div className="flex items-center justify-center h-64 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} view coming soon.
                    </div>
                )}
            </main>
        </div>
    );
}
