import React, { useState } from 'react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12">
        <h1 className="text-3xl font-extrabold text-white mb-4">About OffGamX</h1>
        <p className="text-cyan-400 text-sm font-semibold mb-6">
          The Modern High-Definition Browser Gaming Portal
        </p>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <p>
            OffGamX was created with a clear objective: to restore the golden age of browser gaming with modern WebGL, HTML5 Canvas, and Web Audio technology in true edge-to-edge wide mode.
          </p>
          <p>
            Traditional gaming portals often squeeze gameplay into tiny, ad-cluttered boxes surrounded by flashing banners and intrusive video interruptions. OffGamX is engineered differently: every game launches instantaneously, scales dynamically to fill 100% of your wide screen without black margins, and retains persistent level progression directly in your browser.
          </p>

          <h2 className="text-xl font-bold text-white pt-4">Engineering Standards</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li><strong>Zero Video Interruptions:</strong> Instant play with no mandatory video pre-rolls.</li>
            <li><strong>True Wide Layouts:</strong> Dynamic aspect ratios supporting 16:9 cinematic mode, full-screen, and responsive mobile touch layouts.</li>
            <li><strong>Built-in Synthesis:</strong> Zero external audio lag thanks to procedural Web Audio synthesizers.</li>
            <li><strong>Campaign Progression:</strong> 20+ levels per title, preserved through local storage.</li>
          </ul>

          <h2 className="text-xl font-bold text-white pt-4">Contact & Inquiries</h2>
          <p>
            Have feedback, bug reports, or game suggestions? Contact the OffGamX team at <span className="text-cyan-400 font-mono">support@offgamx.site</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ContactView: React.FC = () => {
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12">
        <h1 className="text-3xl font-extrabold text-white mb-2">Contact Us</h1>
        <p className="text-slate-400 text-sm mb-8">
          Get in touch with the OffGamX engineering and editorial team.
        </p>

        {sent ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
            <h3 className="text-base font-bold text-emerald-400 mb-1">Message Sent!</h3>
            <p className="text-xs text-slate-300">Thank you! Your message has been received by our team.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                className="w-full bg-slate-800 text-sm text-white rounded-xl border border-slate-700 p-3 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                className="w-full bg-slate-800 text-sm text-white rounded-xl border border-slate-700 p-3 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="Bug Report, Suggestion, or Partnership"
                className="w-full bg-slate-800 text-sm text-white rounded-xl border border-slate-700 p-3 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
              <textarea
                rows={5}
                required
                placeholder="Write your message here..."
                className="w-full bg-slate-800 text-sm text-white rounded-xl border border-slate-700 p-3 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const PrivacyView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-6 text-slate-300 text-sm leading-relaxed">
        <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: January 1, 2026 · OffGamX (offgamx.site)</p>
        <p>
          At OffGamX, we respect your privacy. This Privacy Policy outlines the minimal information collected when you access and play games on our platform.
        </p>
        <h2 className="text-lg font-bold text-white pt-2">1. Local Storage</h2>
        <p>
          OffGamX saves your game level progress, unlocked milestones, sound preferences, and user reviews exclusively in your browser's local storage (`localStorage`). This data never leaves your device and is not tracked across third-party websites.
        </p>
        <h2 className="text-lg font-bold text-white pt-2">2. Advertising & Analytics</h2>
        <p>
          We may display non-intrusive banner advertisements through advertising partners such as Google AdSense. These partners may use cookies to serve ads based on prior visits to our website or other websites. You may opt out of personalized advertising by visiting Google Ads Settings.
        </p>
        <h2 className="text-lg font-bold text-white pt-2">3. Third-Party Links</h2>
        <p>
          Our website may contain links to external sites. We are not responsible for the privacy practices of external domains.
        </p>
      </div>
    </div>
  );
};

export const TermsView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-6 text-slate-300 text-sm leading-relaxed">
        <h1 className="text-3xl font-extrabold text-white mb-2">Terms of Service</h1>
        <p className="text-xs text-slate-500">Last Updated: January 1, 2026</p>
        <p>
          By accessing and playing games on OffGamX (offgamx.site), you agree to be bound by these Terms of Service.
        </p>
        <h2 className="text-lg font-bold text-white pt-2">1. Free Personal Use</h2>
        <p>
          All games and features on OffGamX are provided free of charge for non-commercial personal entertainment. You agree not to scrape, distribute, or reverse-engineer the site’s codebase without express authorization.
        </p>
        <h2 className="text-lg font-bold text-white pt-2">2. Disclaimer of Warranties</h2>
        <p>
          All games and services are provided "as is" without warranty of any kind, whether express or implied.
        </p>
      </div>
    </div>
  );
};

export const DmcaView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-6 text-slate-300 text-sm leading-relaxed">
        <h1 className="text-3xl font-extrabold text-white mb-2">DMCA & Copyright Notice</h1>
        <p className="text-xs text-slate-500">OffGamX Copyright Compliance</p>
        <p>
          OffGamX respects intellectual property rights. All games hosted on OffGamX are proprietary creations or open-source software compliant with appropriate licenses.
        </p>
        <p>
          If you believe any content on OffGamX infringes upon your copyright, please submit a formal DMCA notice with the title, exact URL, proof of ownership, and contact information to <span className="text-cyan-400 font-mono">dmca@offgamx.site</span>.
        </p>
      </div>
    </div>
  );
};
