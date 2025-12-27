import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn("font-serif text-3xl md:text-4xl font-medium tracking-tight", className)}>
      {children}
    </h1>
  );
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("font-serif text-2xl md:text-3xl font-medium tracking-tight", className)}>
      {children}
    </h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn("font-medium text-lg", className)}>
      {children}
    </h3>
  );
}

export function H4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn("font-medium text-base", className)}>
      {children}
    </h4>
  );
}

export function Paragraph({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-base leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function Lead({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-lg md:text-xl text-muted-foreground leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function Small({ children, className }: TypographyProps) {
  return (
    <small className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </small>
  );
}

export function Mono({ children, className }: TypographyProps) {
  return (
    <span className={cn("font-mono text-sm", className)}>
      {children}
    </span>
  );
}
