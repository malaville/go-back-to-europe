'use client';

import { useEffect } from 'react';

const BOT_UA_PATTERNS = /bot|crawl|spider|slurp|lighthouse|pagespeed|headlesschrome|phantomjs|prerender|facebookexternalhit|bingpreview|googlebot|yandex|baidu|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|claudebot|slackbot/i;

export default function DatadogInit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (window.location.hostname !== 'skipthegulf.com') return;
    if (BOT_UA_PATTERNS.test(navigator.userAgent)) return;

    import('@datadog/browser-rum').then(({ datadogRum }) => {
      datadogRum.init({
        applicationId: '2a4b0630-6e60-4441-ba90-aaac43722678',
        clientToken: 'pub764d1bca499a1f5ebf7dc5d4d7f8e18c',
        site: 'datadoghq.eu',
        service: 'skipthegulf',
        env: 'production',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 1,
        trackUserInteractions: true,
        trackBfcacheViews: true,
        defaultPrivacyLevel: 'allow',
      });
    });

    import('@datadog/browser-logs').then(({ datadogLogs }) => {
      datadogLogs.init({
        clientToken: 'pub764d1bca499a1f5ebf7dc5d4d7f8e18c',
        site: 'datadoghq.eu',
        service: 'skipthegulf',
        env: 'production',
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
      });
    });
  }, []);

  return null;
}
