export default function Home({ onDashboardSelect }: { onDashboardSelect: () => void }) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 text-center max-w-3xl flex flex-col gap-8 items-center">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Future-Proof Your Career.
        </h1>

        <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed">
          The Industry-Aligned SkillRadar analyzes real-time job market trends to predict tomorrow's essential skills, generating personalized learning pathways just for you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
          <button
            onClick={onDashboardSelect}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 transition-all text-white font-semibold rounded-xl text-lg shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] focus:ring-4 focus:ring-blue-500/50 outline-none"
            aria-label="Enter your personalized student dashboard"
          >
            Enter Dashboard
          </button>
          <button
            className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-semibold rounded-xl text-lg border border-neutral-700 focus:ring-4 focus:ring-neutral-500/50 outline-none"
            aria-label="Learn more about how the prediction engine works"
          >
            How it Works
          </button>
        </div>
      </div>

      {/* Feature grid */}
      <div className="z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 max-w-5xl w-full">
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 transition-colors">
          <h3 className="text-xl font-bold text-white mb-2">NLP Trend Reader</h3>
          <p className="text-neutral-400">Extracts real-time skill demands from thousands of live job descriptions.</p>
        </div>
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 transition-colors">
          <h3 className="text-xl font-bold text-white mb-2">Gamified Pathways</h3>
          <p className="text-neutral-400">Earn XP, climb leagues, and validate your skills with auto-generated assessments.</p>
        </div>
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 transition-colors">
          <h3 className="text-xl font-bold text-white mb-2">AI Career Mentor</h3>
          <p className="text-neutral-400">24/7 conversational coaching to guide your learning and interview prep.</p>
        </div>
      </div>
    </main>
  );
}
