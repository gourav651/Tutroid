import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function LoadingScreen({ message = "Loading..." }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse-slow" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container with Premium Effects */}
        <div className="relative mb-12">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-indigo-500/20 blur-2xl animate-pulse-slow" />
          </div>

          {/* Rotating Border Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-32 h-32 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 animate-spin-slow"
              style={{
                maskImage: "linear-gradient(transparent 40%, black 60%)",
                WebkitMaskImage: "linear-gradient(transparent 40%, black 60%)",
              }}
            />
          </div>

          {/* Inner Shimmer Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border border-blue-200/30 dark:border-blue-400/30 animate-ping-slow" />
          </div>

          {/* Logo */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20 dark:border-slate-700/50" />
            <div className="relative">
              {/* Animated Icon */}
              <div className="relative">
                <Sparkles
                  className="w-16 h-16 text-transparent bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text animate-pulse"
                  style={{
                    filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Orbiting Particles */}
          <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
            <div className="w-40 h-40 relative">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-sm" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-sm" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center animate-spin-reverse">
            <div className="w-40 h-40 relative">
              <div className="absolute left-0 top-1/2 w-1.5 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-sm" />
              <div className="absolute right-0 top-1/2 w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm" />
            </div>
          </div>
        </div>

        {/* Brand Name with Gradient */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-cyan-100 bg-clip-text text-transparent tracking-tight">
            Tutroid
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wider uppercase">
              Premium Learning Platform
            </p>
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          </div>
        </div>

        {/* Loading Message */}
        <div className="mb-8 text-center">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1">
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>

        {/* Premium Progress Bar */}
        <div className="w-80 relative">
          {/* Background Track */}
          <div className="h-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-300/20 dark:border-slate-700/20">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />

            {/* Progress Fill */}
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Animated Shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="mt-3 text-center">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Subtle Tagline */}
        <p className="mt-8 text-xs text-slate-500 dark:text-slate-500 tracking-wide">
          Preparing your experience...
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(20px) translateX(-10px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%,
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
