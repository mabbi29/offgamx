import React, { useState, useEffect } from 'react';
import { Star, Gamepad2, Users, Calendar, Send, Check } from 'lucide-react';
import { GameMetadata, UserReview } from '../types';

interface GameInfoProps {
  game: GameMetadata;
}

export const GameInfo: React.FC<GameInfoProps> = ({ game }) => {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [userRating, setUserRating] = useState<number>(5);
  const [userName, setUserName] = useState<string>('');
  const [userComment, setUserComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Load reviews from localStorage
  useEffect(() => {
    const storageKey = `offgamx-reviews-${game.slug}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setReviews(JSON.parse(saved));
      } catch {
        setReviews([]);
      }
    } else {
      // Seed realistic default review
      const defaultReviews: UserReview[] = [
        {
          id: '1',
          userName: 'Alex Gamer',
          rating: 5,
          comment: `Awesome wide mode gameplay! The level progression in ${game.title} is super smooth and responsive.`,
          date: '2026-03-24',
        },
        {
          id: '2',
          userName: 'CyberPilot',
          rating: 5,
          comment: 'Zero lag, great audio synth effects, and instant restart. Exactly what browser gaming needs.',
          date: '2026-03-28',
        },
      ];
      setReviews(defaultReviews);
    }
    setSubmitted(false);
  }, [game.slug, game.title]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;

    const newRev: UserReview = {
      id: Date.now().toString(),
      userName: userName.trim() || 'Anonymous Player',
      rating: userRating,
      comment: userComment.trim(),
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    localStorage.setItem(`offgamx-reviews-${game.slug}`, JSON.stringify(updated));
    setUserComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="space-y-8 mt-6">
      {/* Primary Game Header & Stats */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider">
                {game.category}
              </span>
              <span className="text-slate-600">·</span>
              <span>{game.maxLevels} Levels Campaign</span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {game.releaseDate}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {game.title}
            </h1>
            <p className="text-slate-300 text-sm mt-1">{game.tagline}</p>
          </div>

          {/* Aggregate Rating & Plays */}
          <div className="flex items-center gap-6 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/60 shrink-0">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-lg">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{game.rating.toFixed(1)}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {reviews.length + game.reviewsCount} Ratings
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-cyan-400 font-bold text-lg">
                <Users className="w-4 h-4" />
                <span>{game.playsCount.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-slate-400">Total Plays</span>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="pt-6">
          <h2 className="text-base font-bold text-white mb-2">About {game.title}</h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
            {game.description}
          </p>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Tags:</span>
            {game.tags.map((tag, i) => (
              <span key={tag} className="hover:text-cyan-400 transition-colors">
                #{tag}
                {i < game.tags.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* How to Play and Rating boxes side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: How to Play & Game Controls */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">How to Play</h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              {game.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Control Scheme
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {game.controls.map((ctrl, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60"
                >
                  <span className="text-xs text-slate-300 font-medium">{ctrl.action}</span>
                  <kbd className="px-2 py-1 text-xs font-mono font-bold text-cyan-300 bg-slate-900 rounded border border-slate-700 shadow-inner">
                    {ctrl.key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              Touch controls are automatically enabled on mobile and touchscreen devices.
            </p>
          </div>
        </div>

        {/* Right Box: Rating & Community Reviews */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h2 className="text-lg font-bold text-white">Community Rating & Reviews</h2>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {game.rating.toFixed(1)} / 5.0
              </span>
            </div>

            {/* Leave a review form */}
            <form onSubmit={handleAddReview} className="space-y-3.5 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium">Your Score:</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= userRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-1.5 font-mono">
                    {userRating}/5
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-800 text-xs text-white rounded-lg border border-slate-700 px-3 py-2 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-colors cursor-pointer"
                >
                  {submitted ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950" />
                      <span>Review Submitted!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Rating</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={2}
                placeholder="Share your thoughts, tips, or high scores..."
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="w-full bg-slate-800 text-xs text-white rounded-lg border border-slate-700 p-2.5 focus:outline-none focus:border-cyan-400"
              />
            </form>

            {/* Recent player feedback */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Player Feedback ({reviews.length})
              </h3>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{rev.userName}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
