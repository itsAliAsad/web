"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<"buyer" | "seller">("buyer");
    const [bio, setBio] = useState("");
    const [university, setUniversity] = useState("");
    const router = useRouter();
    const updateUser = useMutation(api.users.update);

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        try {
            // Note: We need to update the schema to allow setting role via mutation if not already there.
            // For now, we update bio and university.
            // Ideally we'd have a specific onboarding mutation.
            await updateUser({ bio, university });
            toast.success("Profile updated!");
            router.push(role === "buyer" ? "/dashboard/buyer" : "/dashboard/seller");
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
            <Card className="w-full max-w-lg glass-card">
                <CardHeader>
                    <CardTitle>Welcome to Path</CardTitle>
                    <CardDescription>Let's set up your profile in a few steps.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Progress value={progress} className="w-full" />

                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">How do you plan to use Path?</h3>
                            <RadioGroup value={role} onValueChange={(v) => setRole(v as "buyer" | "seller")}>
                                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="buyer" id="buyer" />
                                    <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                                        <div className="font-semibold">I want to hire</div>
                                        <div className="text-sm text-muted-foreground">Post requests and find talent.</div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="seller" id="seller" />
                                    <Label htmlFor="seller" className="flex-1 cursor-pointer">
                                        <div className="font-semibold">I want to work</div>
                                        <div className="text-sm text-muted-foreground">Offer services and earn money.</div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Tell us about yourself</h3>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Input
                                    id="bio"
                                    placeholder="I am a..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="university">University (Optional)</Label>
                                <Input
                                    id="university"
                                    placeholder="e.g. LUMS, NUST"
                                    value={university}
                                    onChange={(e) => setUniversity(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 text-center">
                            <h3 className="text-lg font-medium">You're all set!</h3>
                            <p className="text-muted-foreground">
                                Click finish to go to your dashboard.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setStep(step - 1)}
                        disabled={step === 1}
                    >
                        Back
                    </Button>
                    <Button onClick={handleNext} className="neo-button">
                        {step === totalSteps ? "Finish" : "Next"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
