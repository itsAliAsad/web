"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import UserSync from "@/components/auth/UserSync";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Clerk appearance configuration to match the premium macOS-inspired design system
// Uses CSS variables for automatic light/dark mode support
const clerkAppearance = {
    variables: {
        // Colors - using CSS variables for theme-aware colors
        colorPrimary: "var(--primary)",
        colorDanger: "var(--destructive)",
        colorSuccess: "var(--accent-sage)",
        colorWarning: "var(--accent-amber)",
        colorBackground: "var(--card)",
        colorInputBackground: "var(--input)",
        colorNeutral: "var(--muted-foreground)",
        colorText: "var(--foreground)",
        colorTextSecondary: "var(--muted-foreground)",
        
        // Typography - using CSS variable for Geist font
        fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",
        fontFamilyButtons: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        
        // Sizing - matching the rounded premium feel
        borderRadius: "1.25rem",
        spacingUnit: "1rem",
    },
    elements: {
        // Card styling - glass-card aesthetic
        card: "bg-card/80 backdrop-blur-xl shadow-lg border border-border/50 rounded-2xl",
        rootBox: "font-sans",
        
        // Form elements
        formButtonPrimary: 
            "bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 hover:shadow-lg transition-all duration-300 font-medium h-11 px-6 active:scale-95",
        formButtonReset:
            "text-muted-foreground hover:text-foreground transition-colors",
        formFieldInput:
            "rounded-lg border-none bg-input/50 backdrop-blur-md ring-1 ring-border focus:ring-2 focus:ring-ring transition-all h-11 px-4 shadow-inner",
        formFieldLabel:
            "text-sm font-medium text-foreground",
        formFieldInputShowPasswordButton:
            "text-muted-foreground hover:text-foreground",
        
        // Social buttons
        socialButtonsBlockButton:
            "border border-input bg-background/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-300 h-11",
        socialButtonsBlockButtonText:
            "font-medium",
        
        // Divider
        dividerLine: "bg-border",
        dividerText: "text-muted-foreground text-sm",
        
        // Footer - hidden for cleaner look
        footer: "hidden",
        footerAction: "hidden",
        
        // Header
        headerTitle: "text-xl font-bold tracking-tight text-foreground",
        headerSubtitle: "text-muted-foreground text-sm",
        
        // Identity preview
        identityPreviewText: "text-foreground",
        identityPreviewEditButton: "text-primary hover:text-primary/80",
        
        // Alert
        alert: "rounded-lg border-l-4 bg-muted/50",
        alertText: "text-sm text-foreground",
        
        // Other modal elements
        modalBackdrop: "backdrop-blur-sm bg-background/80",
        modalContent: "rounded-2xl shadow-xl",
        
        // User button
        userButtonPopoverCard: "rounded-2xl shadow-xl border border-border/50 bg-card/95 backdrop-blur-xl",
        userButtonPopoverActions: "border-t border-border/50",
        userButtonPopoverActionButton: "hover:bg-accent rounded-lg transition-colors",
        userButtonPopoverFooter: "hidden",
    },
};

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <ClerkProvider appearance={clerkAppearance}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <UserSync />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}

