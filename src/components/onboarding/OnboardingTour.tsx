import { useEffect, useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnboardingTour() {
  const { isOnboarding, currentStep, steps, nextStep, prevStep, skipOnboarding } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isOnboarding || !currentStepData) return;

    // Find target element if specified
    if (currentStepData.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      setTargetElement(element);

      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Calculate tooltip position
        const rect = element.getBoundingClientRect();
        const position = currentStepData.position || 'bottom';

        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top - 20;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 20;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 20;
            break;
        }

        setTooltipPosition({ top, left });
      }
    } else {
      setTargetElement(null);
    }
  }, [isOnboarding, currentStep, currentStepData]);

  if (!isOnboarding || !currentStepData) return null;

  const isCenterPosition = currentStepData.position === 'center' || !currentStepData.target;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Dark overlay with cutout for target element */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Highlight target element */}
        {targetElement && (
          <div
            className="absolute border-4 border-primary rounded-lg shadow-2xl pointer-events-none animate-pulse"
            style={{
              top: targetElement.getBoundingClientRect().top - 8,
              left: targetElement.getBoundingClientRect().left - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
            }}
          />
        )}
      </div>

      {/* Tooltip/Modal */}
      <div
        className={cn(
          "fixed z-[101] pointer-events-auto",
          isCenterPosition ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""
        )}
        style={
          !isCenterPosition && targetElement
            ? {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                transform: currentStepData.position === 'bottom' || currentStepData.position === 'top'
                  ? 'translateX(-50%)'
                  : currentStepData.position === 'right'
                  ? 'translateX(20px)'
                  : 'translateX(-100%) translateX(-20px)'
              }
            : {}
        }
      >
        <div className="bg-background border-2 border-primary rounded-xl shadow-2xl p-6 max-w-md w-[90vw] md:w-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">{currentStepData.title}</h3>
            </div>
            <button
              onClick={skipOnboarding}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-muted-foreground"
            >
              Skip Tour
            </Button>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={nextStep}
                className="gap-1"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Arrow pointing to target */}
        {!isCenterPosition && targetElement && (
          <div
            className={cn(
              "absolute w-0 h-0 border-8",
              currentStepData.position === 'bottom' && "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-primary",
              currentStepData.position === 'top' && "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-primary",
              currentStepData.position === 'right' && "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-primary",
              currentStepData.position === 'left' && "right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-primary"
            )}
          />
        )}
      </div>
    </>
  );
}

