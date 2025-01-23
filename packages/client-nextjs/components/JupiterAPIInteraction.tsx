"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

interface JupiterAPIInteractionProps {
    endpoint: string;
    parameters: Record<string, string>; // Parameter name as key and placeholder text as value
}

const JupiterAPIInteraction: React.FC<JupiterAPIInteractionProps> = ({ endpoint, parameters }) => {
    const [inputData, setInputData] = useState<Record<string, string | number>>({});
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (key: string, value: string | number) => {
        setInputData({ ...inputData, [key]: value });
    };

    const handleSubmit = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            console.log("Request Payload:", inputData);

            const res = await fetch(`/api/v1/jupiter/${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(inputData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData?.error || "An error occurred");
                return;
            }

            const data = await res.json();
            setResponse(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Error:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg uppercase font-semibold">{endpoint}</h2>

            {Object.keys(parameters).map((key) => (
                <div key={key}>
                    <label className="block text-sm font-medium">{parameters[key]}</label>
                    <Input
                        placeholder={parameters[key]}
                        value={inputData[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full"
                    />
                </div>
            ))}

            <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
            </Button>

            {error && <AlertErrorMessage message={error} />}
            {response && (
                <Textarea value={response} readOnly className="w-full" />
            )}
        </div>
    );
};

export default JupiterAPIInteraction;
