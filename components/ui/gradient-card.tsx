
import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

interface GradientCardProps extends React.ComponentProps<typeof Card> {
    variant?: "sunrise" | "ocean" | "berry"
}

function GradientCard({ className, variant = "sunrise", children, ...props }: GradientCardProps) {
    const gradientClass = {
        sunrise: "bg-gradient-sunrise text-white border-none",
        ocean: "bg-gradient-ocean text-white border-none",
        berry: "bg-gradient-berry text-white border-none",
    }

    return (
        <Card
            className={cn(
                "transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]",
                gradientClass[variant],
                className
            )}
            {...props}
        >
            {children}
        </Card>
    )
}

// Export sub-components for convenience so we can just use GradientCard.*
export { GradientCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
