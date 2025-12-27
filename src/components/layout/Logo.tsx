import { FC } from "react";

interface LogoProps {
    className?: string;
}

export const Logo: FC<LogoProps> = ({ className }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Circle (Film Reel Rim) */}
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" />

            {/* Crescent Moon Integration */}
            <path
                d="M50 5 C 75 5, 95 25, 95 50 C 95 75, 75 95, 50 95 C 65 80, 75 65, 75 50 C 75 35, 65 20, 50 5 Z"
                fill="currentColor"
            />

            {/* Film Reel Slots */}
            <circle cx="35" cy="35" r="8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="35" cy="65" r="8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="65" cy="50" r="12" stroke="currentColor" strokeWidth="2" />

            {/* Center Pin */}
            <circle cx="50" cy="50" r="3" fill="currentColor" />
        </svg>
    );
};
