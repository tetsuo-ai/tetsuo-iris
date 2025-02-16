import { FC } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AlertErrorMessageProps {
  message: string;
  className?: string;
}

export const AlertErrorMessage: FC<AlertErrorMessageProps> = ({ message, className = "" }) => (
  <Alert variant="destructive" className={className}>
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);
