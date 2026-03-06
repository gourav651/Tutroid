import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import FeedSection from "../components/FeedSection";
import RightSidebar from "../components/RightSidebar";
import { USER_TYPES } from "../../config/dashboardConfig";
import { useTheme } from "../../context/ThemeContext";

export default function Dashboard({ userType = USER_TYPES.STUDENT }) {
  const { theme } = useTheme();

  return (
    <div className={`${theme.bg} min-h-screen transition-colors duration-300`}>
      <Navbar userType={userType} />

      {/* 3 Column Layout - Responsive */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4 md:gap-6 px-3 sm:px-4 md:px-6 mt-4 md:mt-6 pb-8 md:pb-10">
        {/* Left - Sticky Sidebar - Hidden on mobile */}
        <div className="hidden md:block md:col-span-1 lg:col-span-3">
          <div className="sticky top-16 md:top-20">
            <LeftSidebar userType={userType} />
          </div>
        </div>

        {/* Center - Scrollable Feed */}
        <div className="col-span-1 md:col-span-2 lg:col-span-6">
          <FeedSection userType={userType} />
        </div>

        {/* Right - Sticky Sidebar - Hidden on mobile */}
        <div className="hidden md:block md:col-span-1 lg:col-span-3">
          <div className="sticky top-16 md:top-20">
            <RightSidebar userType={userType} />
          </div>
        </div>
      </div>
    </div>
  );
}
