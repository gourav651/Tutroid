import React from "react";
import { GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FooterSection() {
  const navigate = useNavigate();
  return (
    <>
      {/* ================= CTA SECTION ================= */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Ready to Start Your Journey?
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-blue-100 mb-6 sm:mb-10">
            Join thousands of professionals and students building the future of
            education together.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 flex-wrap">
            <button
              onClick={() => navigate("/signup")}
              className="bg-white text-blue-600 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold 
            transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-sm sm:text-base"
            >
              Create Free Account
            </button>

            <button
              className="border border-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold 
            transition-all duration-300 hover:bg-white hover:text-blue-600 hover:-translate-y-1 text-sm sm:text-base"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-50 py-12 sm:py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content - Three Columns (Always) */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
            
            {/* Column 1: Platform */}
            <div className="text-center">
              <h4 className="font-bold mb-4 sm:mb-6 text-gray-800 text-sm sm:text-lg lg:text-xl">Platform</h4>
              <ul className="space-y-2 sm:space-y-3 lg:space-y-4 text-gray-600 text-xs sm:text-sm lg:text-base">
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Browse Trainers
                </li>
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Top Institutions
                </li>
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Learning Resources
                </li>
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Success Stories
                </li>
              </ul>
            </div>

            {/* Column 2: Company */}
            <div className="text-center">
              <h4 className="font-bold mb-4 sm:mb-6 text-gray-800 text-sm sm:text-lg lg:text-xl">Company</h4>
              <ul className="space-y-2 sm:space-y-3 lg:space-y-4 text-gray-600 text-xs sm:text-sm lg:text-base">
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  About Us
                </li>
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Careers
                </li>
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Blog
                </li>
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Contact
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div className="text-center">
              <h4 className="font-bold mb-4 sm:mb-6 text-gray-800 text-sm sm:text-lg lg:text-xl">Legal</h4>
              <ul className="space-y-2 sm:space-y-3 lg:space-y-4 text-gray-600 text-xs sm:text-sm lg:text-base">
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Terms of Service
                </li>
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Privacy Policy
                </li>
                <li className="hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                  Cookie Policy
                </li>
              </ul>
            </div>
          </div>

          {/* Brand Section */}
          <div className="border-t pt-8 sm:pt-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Logo and Description */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg">
                    <GraduationCap size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Tutroid</h3>
                </div>
                <p className="text-gray-600 text-sm sm:text-base text-center md:text-left max-w-md">
                  Empowering learning connections. The professional network connecting trainers, institutions, and students worldwide.
                </p>
              </div>

              {/* Copyright */}
              <div className="text-center md:text-right">
                <p className="text-sm text-gray-500">
                  © {new Date().getFullYear()} Tutroid. All rights reserved.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Built with ❤️ for the learning community
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
