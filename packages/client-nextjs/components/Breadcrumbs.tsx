"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
    const pathname = usePathname(); // Get the current path
    const pathSegments = pathname.split("/").filter((segment) => segment !== ""); // Split and filter empty segments

    // Generate breadcrumb links
    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join("/")}`; // Build href dynamically
        const name = segment.replace(/-/g, " "); // Replace dashes with spaces
        const isLast = index === pathSegments.length - 1; // Check if it's the last breadcrumb
        return (
            <span key={href}>
                {isLast ? (
                    <span className="text-gray-500 capitalize">{name}</span>
                ) : (
                    <Link href={href} className="text-blue-500 hover:underline capitalize">
                        {name}
                    </Link>
                )}
                {!isLast && <span className="mx-2 text-gray-400">/</span>}
            </span>
        );
    });

    return (
        <nav className="mb-4 text-sm text-gray-500">
            <Link href="/" className="text-blue-500 hover:underline">
                Home
            </Link>
            {pathSegments.length > 0 && <span className="mx-2 text-gray-400">/</span>}
            {breadcrumbs}
        </nav>
    );
}
