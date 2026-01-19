import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    className?: string;
}

export default function StarRating({
    rating,
    maxRating = 5,
    size = 16,
    className
}: StarRatingProps) {
    // E.g. rating = 3.7
    // fullStars = 3
    // hasHalfStar = true (0.7 >= 0.5)
    // emptyStars = 1 (5 - 3 - 1)

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = Math.max(0, maxRating - fullStars - (hasHalfStar ? 1 : 0));

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {[...Array(fullStars)].map((_, i) => (
                <Star
                    key={`full-${i}`}
                    className="fill-amber-400 text-amber-400"
                    size={size}
                />
            ))}

            {hasHalfStar && (
                <div className="relative">
                    <Star
                        className="text-amber-400/30"
                        size={size}
                    />
                    <div className="absolute inset-0 overflow-hidden w-[50%]">
                        <Star
                            className="fill-amber-400 text-amber-400"
                            size={size}
                        />
                    </div>
                </div>
            )}

            {[...Array(emptyStars)].map((_, i) => (
                <Star
                    key={`empty-${i}`}
                    className="text-amber-400/30"
                    size={size}
                />
            ))}
        </div>
    );
}
