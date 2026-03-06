import { useNavigate } from "react-router-dom";

export default function HowItWorks() {
  const navigate = useNavigate();
  const steps = [
    {
      number: 1,
      title: "Create Your Profile",
      description:
        "Showcase your expertise, certifications, and portfolio. Institutions can list their entire faculty department.",
    },
    {
      number: 2,
      title: "Intelligent Matching",
      description:
        "Our AI-driven engine matches trainers with the right students and institutions based on skills and location.",
    },
    {
      number: 3,
      title: "Secure Delivery & Payment",
      description:
        "Deliver training via our integrated LMS or your own. All payments are escrow-protected for peace of mind.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left - Illustration */}
          <div className="relative">
            {/* Illustration Container with warm orange background */}
            <div className="bg-linear-to-br from-amber-100 to-orange-100 rounded-3xl p-4 sm:p-6 relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-orange-200/30 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-yellow-200/40 rounded-full blur-xl"></div>

              {/* Illustration - Image Only */}
              <div className="relative z-10">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdOVCKokGiecqTNLOWxvfmbCSOfWK8CrrQuE0kgb2QNxZvftUwO07kLajIfvWjQj8gJWqTV7HEk3--d7Uc-cc26OQG5stOqm5BbowY3JmbWz7RQfxWc1EctHKjoeMNwnFYk_4Vk4VFJ0rDB4kuQa_yM0OQTu71PUbze8EDDRD5ssmdMrS_7CDHfNnk67g5hQOJDWgHLGMC_Rje_6jDFJ9TVBDVCKrnUjlE1MFSxycJQ26vHQ5OHDnqsOw54BsiUIpCWYx5JgG-gbE"
                  alt="Two professionals collaborating at a desk"
                  className="w-full h-auto object-cover rounded-2xl"
                />
              </div>
            </div>

            {/* Floating Card - Ready to scale - Positioned separately */}
            <div className="absolute -bottom-6 sm:-bottom-8 -right-3 sm:-right-4 z-20 bg-indigo-600 rounded-2xl p-3 sm:p-4 shadow-2xl text-white w-56 sm:w-64 h-24 sm:h-28 ">
              <h4 className="font-bold text-sm sm:text-lg mb-1">Ready to scale?</h4>
              <p className="text-indigo-200 text-xs sm:text-sm mb-3 sm:mb-4">
                Join 5,000+ businesses using our API.
              </p>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How Trainer Connect Works
            </h2>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg mb-8 sm:mb-10">
              We&apos;ve simplified the entire training lifecycle, from matching
              to certification.
            </p>

            {/* Steps */}
            <div className="space-y-6 sm:space-y-8">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-3 sm:gap-5">
                  {/* Step Number */}
                  <div
                    className={`shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-bold ${
                      step.number === 1
                        ? "bg-indigo-600 text-white"
                        : step.number === 2
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-indigo-50 text-indigo-400"
                    }`}
                  >
                    {step.number}
                  </div>

                  {/* Step Content */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Get Started Button */}
            <div className="mt-8 sm:mt-10">
              <button
                onClick={() => navigate("/signup")}
                className="w-full sm:w-40 bg-gray-900 hover:bg-gray-800 hover:scale-105 hover:shadow-lg text-white px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ease-out"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
