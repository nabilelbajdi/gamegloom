import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, Gamepad2, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchHighlyRatedGames,
  updatePreferences,
  addGameToCollection,
  changeUsername,
} from "../api";

// A trimmed, non-overwhelming set of genres for taste selection.
const GENRES = [
  { title: "RPG", slug: "rpg" },
  { title: "Adventure", slug: "adventure" },
  { title: "Shooter", slug: "shooter" },
  { title: "Strategy", slug: "strategy" },
  { title: "Platform", slug: "platform" },
  { title: "Puzzle", slug: "puzzle" },
  { title: "Racing", slug: "racing" },
  { title: "Fighting", slug: "fighting" },
  { title: "Indie", slug: "indie" },
  { title: "Simulator", slug: "simulator" },
];

const STEPS = ["welcome", "genres", "games", "finish"];

// Best available wide art for a backdrop, falling back to the cover.
const backdropUrl = (g) =>
  g?.artworks?.[0] || g?.screenshots?.[0] || g?.coverImage || null;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, setOnboarded, checkAuth } = useAuth();

  const [step, setStep] = useState(0);
  const [genres, setGenres] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [backdropId, setBackdropId] = useState(null);
  const [username, setUsername] = useState(user?.username || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHighlyRatedGames()
      .then((games) => setPopularGames((games || []).slice(0, 12)))
      .catch(() => setPopularGames([]));
  }, []);

  const toggleGenre = (slug) =>
    setGenres((prev) => (prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug]));

  const toggleGame = (game) =>
    setSelectedGames((prev) =>
      prev.find((g) => g.igdb_id === game.igdb_id)
        ? prev.filter((g) => g.igdb_id !== game.igdb_id)
        : [...prev, game]
    );

  const finishOnboarding = async ({ skipped = false } = {}) => {
    setError("");
    setSaving(true);
    try {
      if (!skipped) {
        // Username first so a conflict stops before any other writes.
        if (username && username !== user?.username) {
          await changeUsername(username);
        }
        // Add chosen games to the library (best-effort each).
        await Promise.all(
          selectedGames.map((g) =>
            addGameToCollection(g.igdb_id, "want_to_play").catch(() => null)
          )
        );
      }

      const prefs = { mark_onboarded: true };
      if (!skipped) {
        prefs.favorite_genres = genres;
        const bg = selectedGames.find((g) => g.igdb_id === backdropId);
        if (bg) {
          prefs.backdrop_image = backdropUrl(bg);
          prefs.backdrop_game_id = bg.igdb_id;
        }
      }
      await updatePreferences(prefs);

      setOnboarded(true);
      await checkAuth();
      navigate("/", { replace: true });
    } catch (e) {
      setError(e.message || "Something went wrong");
      setSaving(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white flex flex-col">
      {/* Top bar: progress + skip-all */}
      <div className="w-full flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? "w-8 bg-primary" : "w-4 bg-gray-700"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => finishOnboarding({ skipped: true })}
          disabled={saving}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Skip for now
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step 0: Welcome */}
              {STEPS[step] === "welcome" && (
                <div className="text-center">
                  <Sparkles className="mx-auto h-10 w-10 text-primary mb-4" />
                  <h1 className="text-3xl font-bold mb-3">Welcome to GameGloom{user?.username ? `, ${user.username}` : ""}!</h1>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Let's set up your profile so your library and discovery feel like yours.
                    It takes under a minute — and you can skip anything.
                  </p>
                </div>
              )}

              {/* Step 1: Genres */}
              {STEPS[step] === "genres" && (
                <div>
                  <h2 className="text-2xl font-bold mb-1">What do you love to play?</h2>
                  <p className="text-gray-400 mb-6">Pick a few genres — this shapes your recommendations.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {GENRES.map((g) => {
                      const active = genres.includes(g.slug);
                      return (
                        <button
                          key={g.slug}
                          onClick={() => toggleGenre(g.slug)}
                          className={`relative py-4 px-3 rounded-xl border text-sm font-medium transition-all ${
                            active
                              ? "border-primary bg-primary/15 text-white"
                              : "border-gray-800 bg-surface-dark text-gray-300 hover:border-gray-600"
                          }`}
                        >
                          {active && <Check className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary" />}
                          {g.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Pick games */}
              {STEPS[step] === "games" && (
                <div>
                  <h2 className="text-2xl font-bold mb-1">Games you're into?</h2>
                  <p className="text-gray-400 mb-6">Tap any you like — we'll add them to your library.</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                    {popularGames.map((game) => {
                      const active = !!selectedGames.find((g) => g.igdb_id === game.igdb_id);
                      return (
                        <button
                          key={game.igdb_id}
                          onClick={() => toggleGame(game)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            active ? "border-primary" : "border-transparent hover:border-gray-600"
                          }`}
                          title={game.name}
                        >
                          <img src={game.coverImage} alt={game.name} className="w-full aspect-[3/4] object-cover" />
                          {active && (
                            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                              <Check className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Finish (backdrop + username) */}
              {STEPS[step] === "finish" && (
                <div>
                  <h2 className="text-2xl font-bold mb-1">Make it yours</h2>
                  <p className="text-gray-400 mb-6">Pick a profile backdrop and confirm your name.</p>

                  <label className="block text-xs font-medium text-gray-300 mb-1">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surface-dark text-sm text-white rounded-md px-3 py-2.5 mb-5 border border-gray-800 focus:border-primary/50 focus:outline-none"
                    placeholder="Your gamertag"
                  />

                  <p className="text-xs font-medium text-gray-300 mb-2">Profile backdrop</p>
                  {selectedGames.length === 0 ? (
                    <p className="text-sm text-gray-500">Pick some games on the previous step to choose a backdrop — or skip this.</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setBackdropId(null)}
                        className={`px-3 py-6 rounded-lg border text-sm ${
                          backdropId === null ? "border-primary bg-primary/10" : "border-gray-800 bg-surface-dark text-gray-400"
                        }`}
                      >
                        None
                      </button>
                      {selectedGames.map((g) => (
                        <button
                          key={g.igdb_id}
                          onClick={() => setBackdropId(g.igdb_id)}
                          className={`relative rounded-lg overflow-hidden border-2 w-28 ${
                            backdropId === g.igdb_id ? "border-primary" : "border-transparent hover:border-gray-600"
                          }`}
                          title={g.name}
                        >
                          <img src={backdropUrl(g)} alt={g.name} className="w-full h-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer nav */}
      <div className="w-full flex items-center justify-between px-6 py-5 border-t border-gray-800/50">
        <button
          onClick={back}
          disabled={step === 0 || saving}
          className={`flex items-center gap-1 text-sm ${step === 0 ? "invisible" : "text-gray-400 hover:text-white"}`}
        >
          <ChevronLeft size={16} /> Back
        </button>

        {STEPS[step] === "finish" ? (
          <button
            onClick={() => finishOnboarding()}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-semibold text-sm px-6 py-2.5 rounded-md disabled:opacity-60"
          >
            <Gamepad2 size={16} /> {saving ? "Setting up..." : "Enter GameGloom"}
          </button>
        ) : (
          <button
            onClick={next}
            className="bg-primary hover:bg-primary/90 text-black font-semibold text-sm px-6 py-2.5 rounded-md"
          >
            {STEPS[step] === "welcome" ? "Let's go" : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
