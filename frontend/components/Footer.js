import React from "react";

function Footer() {
  return (
    <div className="w-full h-24 bg-pharmaGreen-800 border-t border-pharmaGreen-700">
      <footer className="h-full flex items-center justify-center">
        <div className="text-center space-y-1">
          <p className="text-sm text-white/80 leading-relaxed">
            <span className="font-semibold text-white text-base">
              Track-Pharma
            </span>
            <br />
            Team G9 &copy; 2025.
          </p>

          {/* Social Icons */}
          <div className="flex justify-center space-x-4">
            <a
              href="https://github.com/NandaniSingh69/PharmaTrack"
              className="text-white/60 hover:text-white transition"
              aria-label="GitHub"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
