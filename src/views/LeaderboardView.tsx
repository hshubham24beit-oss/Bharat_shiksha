import React, { useState } from "react";
import {
  Trophy,
  Flame,
  Zap,
  Award,
  Medal,
  Crown,
  Search,
  Sparkles,
  ArrowUp,
  CheckCircle2,
} from "lucide-react";
import { LeaderboardEntry, StudentProfile, ActiveView } from "../types";
import { leaderboardData } from "../data/mockData";

interface Props {
  studentProfile: StudentProfile;
  setActiveView: (view: ActiveView) => void;
}

export const LeaderboardView: React.FC<Props> = ({ studentProfile, setActiveView }) => {
  const [filterExam, setFilterExam] = useState("All India");
  const [searchFilter, setSearchFilter] = useState("");

  const filteredData = leaderboardData.filter((entry) => {
    if (searchFilter && !entry.name.toLowerCase().includes(searchFilter.toLowerCase()) && !entry.school.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/20 text-saffron-400 text-xs font-semibold border border-saffron-500/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>National Socratic Champions</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
            Bharat Academix Leaderboard
          </h1>
          <p className="text-slate-400 text-sm">
            Top academic performers ranked by Socratic checkpoints solved, accuracy, and daily streaks.
          </p>
        </div>

        {/* User Rank Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-saffron-500/40 flex items-center gap-4 shadow-xl">
          <img
            src={studentProfile.avatarUrl}
            alt={studentProfile.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-saffron-500"
          />
          <div>
            <div className="text-xs text-saffron-400 font-bold uppercase">Your Standing</div>
            <div className="text-lg font-black text-slate-100 flex items-center gap-1.5">
              <span>Rank #2</span>
              <span className="text-xs text-deep-400 font-semibold flex items-center">
                <ArrowUp className="w-3 h-3" /> +1
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">{studentProfile.xp} XP</span>
          </div>
        </div>
      </div>

      {/* Podium Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Rank 2 */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center space-y-3 relative overflow-hidden order-2 md:order-1">
          <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center font-mono">
            #2
          </div>
          <img
            src={leaderboardData[1]?.avatar}
            alt={leaderboardData[1]?.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-500 shadow-xl"
          />
          <div>
            <h3 className="font-bold text-slate-100 text-base">{leaderboardData[1]?.name}</h3>
            <p className="text-xs text-slate-400">{leaderboardData[1]?.school}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-saffron-500/20 text-saffron-300 font-bold font-mono text-xs">
            {leaderboardData[1]?.xp} XP
          </span>
        </div>

        {/* Rank 1 (Gold) */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-saffron-950/20 to-slate-900 border border-saffron-500/40 flex flex-col items-center text-center space-y-3 relative overflow-hidden order-1 md:order-2 shadow-2xl shadow-saffron-950/30">
          <div className="w-10 h-10 rounded-full bg-saffron-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-saffron-500/40">
            <Crown className="w-5 h-5 fill-slate-950" />
          </div>
          <img
            src={leaderboardData[0]?.avatar}
            alt={leaderboardData[0]?.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-saffron-400 shadow-2xl"
          />
          <div>
            <h3 className="font-extrabold text-slate-100 text-lg">{leaderboardData[0]?.name}</h3>
            <p className="text-xs text-slate-400">{leaderboardData[0]?.school}</p>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-saffron-500/20 text-saffron-300 font-bold font-mono text-sm border border-saffron-500/30">
            {leaderboardData[0]?.xp} XP 🏆
          </span>
        </div>

        {/* Rank 3 */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center space-y-3 relative overflow-hidden order-3 md:order-3">
          <div className="w-8 h-8 rounded-full bg-saffron-700/80 text-saffron-200 font-bold text-xs flex items-center justify-center font-mono">
            #3
          </div>
          <img
            src={leaderboardData[2]?.avatar}
            alt={leaderboardData[2]?.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-saffron-700 shadow-xl"
          />
          <div>
            <h3 className="font-bold text-slate-100 text-base">{leaderboardData[2]?.name}</h3>
            <p className="text-xs text-slate-400">{leaderboardData[2]?.school}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-saffron-500/20 text-saffron-300 font-bold font-mono text-xs">
            {leaderboardData[2]?.xp} XP
          </span>
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-100 font-display">National Rankings</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search student or city..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-saffron-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredData.map((user) => (
            <div
              key={user.rank}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                user.name.includes("You")
                  ? "bg-saffron-950/40 border-saffron-500/50 shadow-md font-semibold"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-center font-mono font-bold text-slate-400 text-sm">
                  #{user.rank}
                </span>
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>{user.name}</span>
                    {user.name.includes("You") && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-saffron-500 text-white">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{user.school}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-saffron-400 text-xs font-bold font-mono">
                  <Flame className="w-4 h-4 fill-saffron-500" />
                  <span>{user.streak}d</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-black text-saffron-400">{user.xp}</span>
                  <span className="text-[10px] text-slate-500 block">XP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
