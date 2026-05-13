import React from 'react';

const GamificationShowcase: React.FC = () => {
  return (
    <div className="relative z-10 py-32 px-4 max-w-6xl mx-auto border-t-2 border-dark-700">
      <div className="flex flex-col md:flex-row items-center gap-16">
        
        {/* Left UI Preview */}
        <div className="md:w-1/2 w-full flex justify-center">
           <div className="w-full max-w-md duo-card p-0 overflow-hidden border-b-8">
             <div className="bg-dark-700/50 p-6 flex justify-between items-center border-b-2 border-dark-700">
               <h4 className="font-extrabold text-2xl text-white">Daily Quests</h4>
               <span className="text-accent-500 font-bold">12 hrs</span>
             </div>
             <div className="p-8 space-y-8">
                {/* Quest 1 */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center">
                    <span className="text-4xl">🎸</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <h5 className="font-extrabold text-white text-lg">Play 3 power chords</h5>
                      <span className="text-orange-500 font-bold">2/3</span>
                    </div>
                    <div className="w-full h-5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-orange-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Quest 2 */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <h5 className="font-extrabold text-white text-lg">Get 90% accuracy</h5>
                      <span className="text-primary-500 font-bold">0/1</span>
                    </div>
                    <div className="w-full h-5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-primary-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
             </div>
           </div>
        </div>

        {/* Right Text */}
        <div className="md:w-1/2 text-center md:text-left">
          <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-white">
            Level up your <br/>
            <span className="text-primary-500">guitar skills.</span>
          </h2>
          <p className="text-2xl text-gray-400 mb-10 font-bold max-w-lg">
            Make progress quickly with our gamified approach. Earn XP, complete daily quests, and compete with friends on the leaderboard.
          </p>
          <button className="btn-duo btn-duo-accent py-4 px-10 text-xl">
            EXPLORE FEATURES
          </button>
        </div>

      </div>
    </div>
  );
};

export default GamificationShowcase;
