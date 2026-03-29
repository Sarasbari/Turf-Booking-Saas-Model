import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';

/**
 * ErrorPage — Sentry ErrorBoundary fallback
 *
 * Shown when an unhandled React error crashes a component tree.
 * BookMyTurf-branded with a "Go back home" button and a
 * Sentry user feedback dialog trigger.
 */

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #FFF7ED 0%, #F5F5F5 50%, #FFF1E6 100%)',
    padding: '24px',
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  } as React.CSSProperties,

  card: {
    background: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  iconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: '36px',
  } as React.CSSProperties,

  heading: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#333333',
    margin: '0 0 12px',
    lineHeight: 1.3,
  } as React.CSSProperties,

  message: {
    fontSize: '15px',
    color: '#666666',
    margin: '0 0 32px',
    lineHeight: 1.6,
  } as React.CSSProperties,

  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    alignItems: 'center',
  } as React.CSSProperties,

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 200ms, box-shadow 200ms',
    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
    width: '100%',
    maxWidth: '280px',
  } as React.CSSProperties,

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 24px',
    background: 'transparent',
    color: '#ea580c',
    border: '1.5px solid #ea580c',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 200ms, color 200ms',
    width: '100%',
    maxWidth: '280px',
  } as React.CSSProperties,

  brand: {
    marginTop: '32px',
    fontSize: '13px',
    color: '#999999',
    fontWeight: 500,
  } as React.CSSProperties,
};

interface ErrorPageProps {
  error?: Error;
  componentStack?: string;
  eventId?: string;
  resetError?: () => void;
}

export function ErrorPage({ error, eventId, resetError }: ErrorPageProps) {
  let navigate: ReturnType<typeof useNavigate> | null = null;

  try {
    // useNavigate may fail if we're outside a Router context
    navigate = useNavigate();
  } catch {
    // Silently ignore — we'll use window.location instead
  }

  const handleGoHome = () => {
    if (resetError) resetError();
    if (navigate) {
      navigate('/');
    } else {
      window.location.href = '/';
    }
  };

  const handleReport = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrapper}>⚠️</div>

        <h1 style={styles.heading}>Something went wrong</h1>

        <p style={styles.message}>
          We're sorry for the inconvenience. Our team has been automatically
          notified and is looking into this issue.
          {error?.message && import.meta.env.DEV && (
            <>
              <br />
              <br />
              <code style={{ fontSize: '12px', color: '#D9534F', wordBreak: 'break-all' }}>
                {error.message}
              </code>
            </>
          )}
        </p>

        <div style={styles.buttonGroup}>
          <button
            id="error-page-home-btn"
            style={styles.primaryButton}
            onClick={handleGoHome}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(234, 88, 12, 0.35)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(234, 88, 12, 0.25)';
            }}
          >
            🏠 Go back home
          </button>

          {eventId && (
            <button
              id="error-page-report-btn"
              style={styles.secondaryButton}
              onClick={handleReport}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#FFF7ED';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              📝 Report this issue
            </button>
          )}
        </div>

        <p style={styles.brand}>BookMyTurf</p>
      </div>
    </div>
  );
}
