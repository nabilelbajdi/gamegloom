import React from "react";
import ReviewCard from "./ReviewCard";
import reviewedGames from "../data/reviewedGames";
import "@fortawesome/fontawesome-free/css/all.min.css";

const ReviewedGames = () => {
  return (
    <section className="container mx-auto px-4 md:px-20 py-8 md:py-10">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold font-heading text-gradient">Recently Reviewed</h2>
        <p className="text-xl text-gray-400 mb-8">What our community is talking about.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviewedGames.map((review, index) => (
          <ReviewCard key={index} {...review} />
        ))}
      </div>
    </section>
  );
};

export default ReviewedGames;
