import React from "react";
import { Users, Building2, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EcosystemSection() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Trainers",
      description: "Showcase your expertise and grow your career.",
      icon: <Users size={26} />,
      iconBg: "bg-blue-600",
      button: "Join as Trainer",
      buttonStyle:
        "border border-gray-400 text-gray-700 hover:border-blue-600 hover:text-blue-600",
      points: [
        "Create professional profile",
        "Upload portfolios & case studies",
        "Post learning materials",
        "Get rated by students",
        "Analytics dashboard",
      ],
    },
    {
      title: "Institutions",
      description: "Find the perfect talent for your programs.",
      icon: <Building2 size={26} />,
      iconBg: "bg-indigo-600",
      button: "Join as Institution",
      buttonStyle:
        "border border-gray-400 text-gray-700 hover:border-indigo-600 hover:text-indigo-600",
      points: [
        "Create institutional profile",
        "Search & filter trainers",
        "Post training requirements",
        "Send hiring inquiries",
        "Manage connections",
      ],
    },
    {
      title: "Students",
      description: "Access quality education and connect with mentors.",
      icon: <GraduationCap size={26} />,
      iconBg: "bg-green-600",
      button: "Join as Student",
      buttonStyle: "bg-blue-600 text-white hover:bg-blue-700",
      points: [
        "Access free content",
        "Follow top trainers",
        "Save favorite materials",
        "Rate and review courses",
        "Connect with mentors",
      ],
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            One Platform, Three Ecosystems
          </h2>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Whether you're teaching, hiring, or learning, Tutroid provides the
            tools you need to succeed.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-md 
              transition-all duration-300 ease-out
              hover:-translate-y-2 hover:shadow-xl"
            >
              {/* Icon */}
              <div
                className={`${card.iconBg} w-12 sm:w-14 h-12 sm:h-14 flex items-center justify-center text-white rounded-xl mb-4 sm:mb-6`}
              >
                {card.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">{card.title}</h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{card.description}</p>

              {/* Bullet Points */}
              <ul className="space-y-2 mb-6 sm:mb-8 text-gray-600 text-sm sm:text-base">
                {card.points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => navigate("/signup")}
                className={`w-full py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${card.buttonStyle}`}
              >
                {card.button}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
