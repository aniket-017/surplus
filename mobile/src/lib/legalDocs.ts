import { useEffect, useState } from 'react';

import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  parseLegalText,
  type LegalDoc,
  type LegalKind,
} from '@/src/constants/legal';
import { getLegalConfig } from '@/src/lib/api';

const FETCH_TIMEOUT_MS = 5000;
const REFRESH_INTERVAL_MS = 60_000;

const docs: Record<LegalKind, LegalDoc> = {
  terms: TERMS_OF_SERVICE,
  privacy: PRIVACY_POLICY,
};
let lastFetchedAt = 0;
let inflight: Promise<void> | null = null;

export function getLegalDoc(kind: LegalKind) {
  return docs[kind];
}

/** Pulls the superadmin-edited copies; keeps the current ones if offline. */
export function refreshLegalDocs(): Promise<void> {
  if (inflight) return inflight;
  if (Date.now() - lastFetchedAt < REFRESH_INTERVAL_MS) return Promise.resolve();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  inflight = getLegalConfig(controller.signal)
    .then(({ termsOfService, privacyPolicy }) => {
      if (termsOfService?.content?.trim()) {
        docs.terms = parseLegalText('terms', termsOfService.content, termsOfService.updatedAt);
      }
      if (privacyPolicy?.content?.trim()) {
        docs.privacy = parseLegalText('privacy', privacyPolicy.content, privacyPolicy.updatedAt);
      }
      lastFetchedAt = Date.now();
    })
    .catch(() => {})
    .finally(() => {
      clearTimeout(timeout);
      inflight = null;
    });

  return inflight;
}

/** The doc for `kind` (bundled copy first), swapped for the server copy once it loads. */
export function useLegalDoc(kind: LegalKind | null) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!kind) return;
    let active = true;
    void refreshLegalDocs().then(() => {
      if (active) setVersion((value) => value + 1);
    });
    return () => {
      active = false;
    };
  }, [kind]);

  return kind ? getLegalDoc(kind) : null;
}
