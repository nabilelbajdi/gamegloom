import React from "react";
import ReviewCard from "../game/ReviewCard";
import reviewedGames from "../../constants/reviewedGames";
import { ChevronRight } from "lucide-react";

const ReviewedGames = () => {
  return (
    <section className="container mx-auto px-4 md:px-20 py-12">
      {/* Section Title */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-light">Recently Reviewed</h2>
        <button className="text-sm flex items-center hover:text-primary transition-colors cursor-pointer hover:underline">
          View All <ChevronRight className="ml-1 w-4 h-4" />
        </button>
      </div>

      {/* Vertical Timeline Layout */}
      <div className="space-y-3 border-l-2 pl-6 custom-border-gradient">
        {reviewedGames.map((review, index) => (
          <ReviewCard key={index} {...review} />
        ))}
      </div>
    </section>
  );
};

export default ReviewedGames;
