import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Modern High-End Login & Register Component
 * Built with React, Tailwind CSS, Lucide React, and Midjourney Video Background.
 */
export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');

  const videoUrl = 'https://cdn.midjourney.com/video/71048e88-d8e6-470e-88ef-555c01eacb12/0.mp4';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    alert(isSignUp ? `Account created for ${email}` : `Signed in as ${email}`);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0b0f1e] text-white flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden select-none">
      {/* Keyframe & Conic Gradient Styles */}
      <style>{`
        @keyframes spinConic {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .conic-gradient-border {
          background: conic-gradient(from 0deg, #00c6ff, #0072ff, #ff007a, #ff8a00, #00c6ff);
        }

        .group-hover-spin:hover .spin-target {
          animation: spinConic 3.5s linear infinite;
        }
      `}</style>

      {/* 1. Global Background Video: scaled to 105%, muted, looping, auto-playing */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105"
          src={videoUrl}
        />
        {/* Fixed Overlay: 10% black opacity and backdrop-blur-sm */}
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
      </div>

      {/* 2. Main Center Card: sits above background (z-10), flex row, max-width 1040px, min-height 650px */}
      <div className="relative z-10 w-full max-w-[1040px] min-h-[650px] bg-white rounded-[2.5rem] border border-gray-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-3 sm:p-3.5 flex flex-col md:flex-row overflow-hidden text-gray-900">
        
        {/* 3. Left Side (Video Mask Area): 45% width, #0c0c0e, rounded-[2rem], overflow-hidden */}
        <div className="relative w-full md:w-[45%] min-h-[280px] md:min-h-[620px] bg-[#0c0c0e] rounded-[2rem] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={videoUrl}
          />
        </div>

        {/* 4. Right Side (Form Area): 55% width, padded generously */}
        <div className="relative w-full md:w-[55%] p-7 sm:p-10 md:p-12 lg:p-14 flex flex-col justify-between overflow-hidden">
          {/* Decorative blurred circle in top-left corner: w-64 h-64 blur-[80px] sunset gradient (#FF512F to #F09819) at 20% opacity */}
          <div
            className="absolute -top-10 -left-10 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)',
            }}
          />

          {/* Form Content */}
          <div className="relative z-10 space-y-6">
            {/* Header: "Welcome back" (40px, semibold, tight tracking, dark text) & subtitle (sm, gray-500). Center aligned */}
            <div className="text-center space-y-1.5">
              <h1 className="text-[34px] sm:text-[40px] font-semibold tracking-tight text-gray-900 leading-tight">
                {isSignUp ? 'Create an account' : 'Welcome back'}
              </h1>
              <p className="text-sm text-gray-500 font-normal">
                {isSignUp ? 'Sign up to start your journey' : 'Sign in to your account'}
              </p>
            </div>

            {/* Social Buttons: Two full-width buttons ("Continue with Google" & "Continue with X") */}
            <div className="space-y-3 pt-2">
              {/* Continue with Google */}
              <button
                type="button"
                className="w-full p-4 rounded-[1.25rem] bg-gray-50 hover:bg-gray-100/80 border border-gray-200 flex items-center justify-between text-sm font-medium text-gray-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* Google SVG Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
              </button>

              {/* Continue with X */}
              <button
                type="button"
                className="w-full p-4 rounded-[1.25rem] bg-gray-50 hover:bg-gray-100/80 border border-gray-200 flex items-center justify-between text-sm font-medium text-gray-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* X (Twitter) SVG Logo */}
                  <svg className="w-5 h-5 fill-current text-gray-900" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Continue with X</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
              </button>
            </div>

            {/* Divider: Flex row with "OR" text (10px, uppercase, wide tracking, gray-400) flanked by 1px horizontal lines */}
            <div className="flex items-center gap-4 py-1">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                OR
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* Email Input Group: bg-gray-50, rounded-[1.25rem], padding 8px, changes to white on focus-within */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-2 rounded-[1.25rem] bg-gray-50 border border-gray-200 flex items-center justify-between focus-within:bg-white focus-within:border-gray-400 transition-all duration-200 shadow-sm">
                <div className="flex-1 pl-3 pr-2">
                  <label className="text-[11px] font-medium text-gray-500 block leading-none mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm font-medium"
                  />
                </div>

                {/* Submit Button (CRITICAL): Circular 52x52px, solid black fill, multi-colored conic border */}
                <button
                  type="submit"
                  aria-label="Submit"
                  className="relative w-[52px] h-[52px] shrink-0 flex items-center justify-center group-hover-spin cursor-pointer focus:outline-none"
                >
                  {/* Outer glowing blur of the exact same conic gradient */}
                  <div className="absolute -inset-1 rounded-full conic-gradient-border opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 spin-target" />

                  {/* Multi-colored border using conic gradient (#00c6ff, #0072ff, #ff007a, #ff8a00, #00c6ff) */}
                  <div className="absolute inset-0 rounded-full conic-gradient-border p-[2.5px] spin-target">
                    {/* Inner solid black button with inner shadow */}
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] group">
                      {/* White ArrowRight icon translates slightly to the right (translate-x-0.5) on hover */}
                      <ArrowRight className="w-5 h-5 text-white transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              </div>
            </form>
          </div>

          {/* Footer: "Don't have an account?" (gray-500) followed by "Sign up" with sunset gradient text (#FF512F to #F09819) */}
          <div className="text-center pt-8 text-sm text-gray-500 font-normal">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-semibold bg-gradient-to-r from-[#FF512F] to-[#F09819] bg-clip-text text-transparent hover:opacity-85 transition-opacity inline-block ml-1"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="font-semibold bg-gradient-to-r from-[#FF512F] to-[#F09819] bg-clip-text text-transparent hover:opacity-85 transition-opacity inline-block ml-1"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
