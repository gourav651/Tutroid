import React from "react";
import { Building2, MapPin, Briefcase, ArrowRight } from "lucide-react";

export default function TopInstitutions() {
  const institutions = [
    {
      name: "TechFlow Academy",
      type: "Coding Bootcamp",
      location: "Remote / Hybrid",
      courses: 12,
    },
    {
      name: "Global Leadership Inst.",
      type: "Corporate Training",
      location: "Boston, MA",
      courses: 5,
    },
    {
      name: "Design Masters",
      type: "Creative Arts School",
      location: "Berlin, DE",
      courses: 8,
    },
    {
      name: "Future Skills Hub",
      type: "Vocational Training",
      location: "Toronto, CA",
      courses: 24,
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold">Top Institutions</h2>
            <p className="text-gray-600 mt-2">
              Leading organizations hiring now.
            </p>
          </div>

          <button className="flex items-center gap-2 text-gray-700 font-medium hover:text-blue-600 transition">
            View All <ArrowRight size={18} />
          </button>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-4 gap-8">
          {institutions.map((institution, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-md
              transition-all duration-300 ease-out
              hover:-translate-y-2 hover:shadow-xl"
            >
              {/* Icon + Name */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                  <Building2 size={24} />
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{institution.name}</h3>
                  <p className="text-gray-600 text-sm">{institution.type}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center text-gray-500 text-sm mb-2">
                <MapPin size={14} className="mr-2" />
                {institution.location}
              </div>

              {/* Active Courses */}
              <div className="flex items-center text-gray-700 text-sm mb-6">
                <Briefcase size={14} className="mr-2 text-blue-600" />
                <span className="font-medium">
                  {institution.courses} Active Courses
                </span>
              </div>

              {/* Button */}
              <button className="w-full border border-gray-400 text-gray-700 py-2 rounded-lg font-medium transition hover:border-blue-600 hover:text-blue-600">
                View Institution
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
