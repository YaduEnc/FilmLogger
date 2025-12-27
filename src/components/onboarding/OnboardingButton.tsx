import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export function OnboardingButton() {
  const { startOnboarding } = useOnboarding();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startOnboarding}
      className="gap-2"
      title="Take a tour"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden md:inline">Tour</span>
    </Button>
  );
}

