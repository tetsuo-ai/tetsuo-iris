"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import { useWallet } from "@solana/wallet-adapter-react";

interface JupiterAPIInteractionProps {
  endpoint: string;
  parameters: Record<string, string>; // Parameter name as key and placeholder text as value
}

const JupiterAPIInteraction: React.FC<JupiterAPIInteractionProps> = ({
  endpoint,
  parameters,
}) => {
  const { publicKey } = useWallet();
  const [inputData, setInputData] = useState<Record<string, string | number>>({});
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (key: string, value: string | number) => {
    setInputData({ ...inputData, [key]: value });
  };

  const handleSubmit = async () => {
    if (!publicKey) {
      setError("Please connect your wallet first.");
      return;
    }

    setError(null);
    setResponse(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/v1/jupiter/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          ...inputData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData?.error || "An error occurred");
        return;
      }

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      <h2 className="text-lg uppercase text-zinc-200 orbitron-500">{endpoint}</h2>

      <div className="mt-6 flex flex-col gap-4">
        {Object.keys(parameters).map((key) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="block text-sm jetbrains-mono-400 text-zinc-200">{parameters[key]}</label>
            <Input
              placeholder={parameters[key]}
              value={inputData[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full border-zinc-800 focus-visible:ring-teal-600 jetbrains-mono-200"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="mt-8 bg-emerald-700 rounded orbitron-400 text-zinc-200 text-lg px-6 py-4 hover:bg-emerald-600"
      >
        {isLoading ? "Submitting..." : "Submit"}
      </Button>

      {error && <AlertErrorMessage message={error} className="mt-6 border-red-500 text-red-500 jetbrains-mono-400" />}
      {response && <Textarea value={response} readOnly className="mt-6 w-full h-[10rem] border-zinc-700 focus-visible:ring-emerald-600 jetbrains-mono-200 text-zinc-200" />}
    </div>
  );
};

export default JupiterAPIInteraction;
