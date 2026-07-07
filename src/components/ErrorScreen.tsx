import React from 'react';
import { ShieldAlert, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorScreenProps {
  status?: number | string;
  error?: string | Error;
  onRetry: () => void;
}

export function ErrorScreen({ status, error, onRetry }: ErrorScreenProps) {
  const isOffline = !navigator.onLine || status === 'offline';
  const errorMessage = error instanceof Error ? error.message : String(error || '');

  let title = 'An Error Occurred';
  let description = 'Something went wrong while communicating with our servers. Please try again.';
  let Icon = AlertTriangle;

  if (isOffline) {
    title = 'Connection Lost';
    description = 'You are currently offline. Please check your internet connection and try again.';
    Icon = WifiOff;
  } else if (status === 401) {
    title = 'Invalid API Key';
    description = 'The Gemini API key you provided is invalid. Please go to Settings and check your API key.';
    Icon = ShieldAlert;
  } else if (status === 403) {
    title = 'Access Denied';
    description = 'Access is forbidden. Please check your API permissions or key limits.';
    Icon = ShieldAlert;
  } else if (status === 429) {
    title = 'Rate Limit Exceeded';
    description = 'You have reached the free-tier Gemini API usage limits. Please wait a minute and retry.';
    Icon = RefreshCw;
  } else if (status === 500 || status === 503) {
    title = 'Gemini Service Issue';
    description = 'Google Gemini servers are currently experiencing issues or overloading. Please try again.';
    Icon = AlertTriangle;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 max-w-md mx-auto">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-950/30 border border-red-800/40 text-red-400 mb-6">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>

      <h3 className="text-xl font-semibold font-display tracking-tight text-text-bright text-center">
        {title}
      </h3>

      <p className="text-sm text-text-secondary mt-2 text-center leading-relaxed">
        {description}
      </p>

      {errorMessage && !isOffline && status !== 401 && (
        <div className="mt-4 p-3 bg-card border border-input-border rounded-lg text-xs font-mono text-text-secondary max-w-sm overflow-x-auto w-full text-center">
          {errorMessage}
        </div>
      )}

      <div className="mt-8 flex gap-4">
        {status === 401 ? (
          <p className="text-xs text-primary text-center">
            Go to the Settings panel at the top-right to configure a valid API key.
          </p>
        ) : (
          <Button onClick={onRetry} variant="primary" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry Action
          </Button>
        )}
      </div>
    </div>
  );
}