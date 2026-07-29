import * as Sentry from '@sentry/nextjs';

export async function register() {
  const commonConfig = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : 0.05,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.extra) delete event.extra;
      if (event.contexts) {
        if (event.contexts.state) delete event.contexts.state;
      }
      if (event.request) {
        if (event.request.data) delete event.request.data;
        if (event.request.cookies) delete event.request.cookies;
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => 
          !['console', 'xhr', 'fetch', 'ui.input'].includes(breadcrumb.type || '')
        );
      }
      return event;
    },
    beforeSendTransaction(event) {
      if (event.extra) delete event.extra;
      if (event.contexts) {
        if (event.contexts.state) delete event.contexts.state;
      }
      if (event.request) {
        if (event.request.data) delete event.request.data;
        if (event.request.cookies) delete event.request.cookies;
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => 
          !['console', 'xhr', 'fetch', 'ui.input'].includes(breadcrumb.type || '')
        );
      }
      return event;
    },
  };

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(commonConfig);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(commonConfig);
  }
}
