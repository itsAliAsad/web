"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const Lottie = dynamic(() => import("lottie-react"), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

interface LottieAnimationProps {
    animationData: any;
    className?: string;
    loop?: boolean;
    autoplay?: boolean;
}

export function LottieAnimation({ animationData, className, loop = true, autoplay = true }: LottieAnimationProps) {
    return (
        <div className={className}>
            <Lottie animationData={animationData} loop={loop} autoplay={autoplay} />
        </div>
    );
}
