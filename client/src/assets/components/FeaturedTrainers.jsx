import React from "react";
import { Star, MapPin, ArrowRight } from "lucide-react";

export default function FeaturedTrainers() {
  const trainers = [
    {
      name: "Sarah Jenkins",
      rating: "4.9",
      reviews: 124,
      role: "Senior Leadership Coach",
      location: "New York, NY",
      skills: ["Leadership", "Soft Skills", "Public Speaking"],
    },
    {
      name: "David Chen",
      rating: "5",
      reviews: 89,
      role: "Full Stack Developer & Mentor",
      location: "San Francisco, CA",
      skills: ["React", "Node.js", "System Design"],
    },
    {
      name: "Dr. Emily Al-Fayed",
      rating: "4.8",
      reviews: 215,
      role: "Data Science Instructor",
      location: "London, UK",
      skills: ["Python", "Machine Learning", "Statistics"],
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Featured Trainers</h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Top-rated experts ready to teach.
            </p>
          </div>

          <button className="flex items-center gap-2 text-gray-700 font-medium hover:text-blue-600 transition text-sm sm:text-base whitespace-nowrap">
            View All <ArrowRight size={18} />
          </button>
        </div>

        {/* Trainer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {trainers.map((trainer, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-md 
              transition-all duration-300 ease-out
              hover:-translate-y-2 hover:shadow-xl"
            >
              {/* Top Section */}
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-200 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-semibold text-gray-600 flex-shrink-0">
                  {trainer.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                    <h3 className="font-semibold text-base sm:text-lg break-words">{trainer.name}</h3>

                    <div className="flex items-center bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs sm:text-sm flex-shrink-0">
                      <Star size={14} className="mr-1 fill-yellow-500" />
                      {trainer.rating}
                      <span className="text-gray-500 ml-1">
                        ({trainer.reviews})
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-xs sm:text-sm mt-1">{trainer.role}</p>

                  <div className="flex items-center text-gray-500 text-xs sm:text-sm mt-1">
                    <MapPin size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{trainer.location}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                {trainer.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 text-gray-600 px-2 sm:px-3 py-1 rounded-md text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 sm:mt-6 pt-4 sm:pt-4 border-t">
                <button className="text-gray-600 text-xs sm:text-sm hover:text-blue-600 transition">
                  View Profile
                </button>

                <button className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto justify-center sm:justify-start">
                  Connect <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
