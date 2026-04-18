'use client';

interface Step {
  id: string;
  title: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
}

export function ProgressIndicator({ steps, currentStep, completedSteps }: ProgressIndicatorProps) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="flex items-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                        ? 'border-2 border-blue-600 text-blue-600 bg-white'
                        : 'border-2 border-gray-300 text-gray-400 bg-white',
                  ].join(' ')}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={[
                    'mt-1 text-xs whitespace-nowrap',
                    isCurrent ? 'text-blue-600 font-medium' : isCompleted ? 'text-gray-600' : 'text-gray-400',
                  ].join(' ')}
                >
                  {step.title}
                </span>
              </div>
              {!isLast && (
                <div
                  className={[
                    'h-0.5 w-12 mx-1 -mt-5',
                    isCompleted ? 'bg-blue-600' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
