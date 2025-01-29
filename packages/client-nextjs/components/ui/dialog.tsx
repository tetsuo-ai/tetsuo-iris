"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                "fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-lg shadow-lg",
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="absolute top-2 right-2">
                <X className="w-6 h-6" />
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
));

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-4">
        {children}
    </div>
);

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-bold">{children}</h2>
);

const DialogDescription = ({ children }: { children: React.ReactNode }) => (
    <p className="text-gray-600">{children}</p>
);

const DialogFooter = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-4 flex justify-end gap-2">{children}</div>
);

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
