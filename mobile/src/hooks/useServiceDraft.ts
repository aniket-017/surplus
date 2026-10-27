import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LocalImage } from '@/src/types/product';
import {
  emptyServiceForm,
  type ServiceFormStep,
  type ServiceFormValues,
} from '@/src/types/service';

export type ServiceFormField = keyof ServiceFormValues;
export type ReplaceableField = 'title' | 'description';
type ServiceStep = ServiceFormStep;

type StoredDraft = {
  version: 1;
  step: ServiceStep;
  form: ServiceFormValues;
  images: LocalImage[];
  savedAt: string;
};

const DRAFT_PATH = `${FileSystem.documentDirectory ?? ''}service-draft.json`;
const AUTOSAVE_DELAY_MS = 800;
const MAX_CAPABILITIES = 12;

function hasContent(form: ServiceFormValues, images: LocalImage[]) {
  return Boolean(
    form.title.trim() ||
      form.description.trim() ||
      form.category ||
      form.capabilities.length ||
      form.price.trim() ||
      images.length,
  );
}

async function readDraft(): Promise<StoredDraft | null> {
  if (!FileSystem.documentDirectory) return null;
  try {
    const info = await FileSystem.getInfoAsync(DRAFT_PATH);
    if (!info.exists) return null;
    const parsed = JSON.parse(await FileSystem.readAsStringAsync(DRAFT_PATH)) as StoredDraft;
    if (parsed?.version !== 1 || !parsed.form) return null;

    const images: LocalImage[] = [];
    for (const image of parsed.images ?? []) {
      const imageInfo = await FileSystem.getInfoAsync(image.uri).catch(() => null);
      if (imageInfo?.exists) images.push(image);
    }

    const draft = { ...parsed, form: { ...emptyServiceForm(), ...parsed.form }, images };
    return hasContent(draft.form, draft.images) ? draft : null;
  } catch {
    return null;
  }
}

export async function clearServiceDraft() {
  if (!FileSystem.documentDirectory) return;
  await FileSystem.deleteAsync(DRAFT_PATH, { idempotent: true }).catch(() => undefined);
}

export type AiValues = Partial<Omit<ServiceFormValues, 'serviceMode'>> & {
  serviceMode?: ServiceFormValues['serviceMode'] | '';
};

type UseServiceDraftOptions = {
  initialForm?: ServiceFormValues;
  /** Resume and autosave the on-device draft. Off for one-off flows like duplicating. */
  persist?: boolean;
};

export function useServiceDraft({ initialForm, persist = true }: UseServiceDraftOptions = {}) {
  const [form, setFormState] = useState<ServiceFormValues>(initialForm ?? emptyServiceForm());
  const [images, setImages] = useState<LocalImage[]>([]);
  const [step, setStep] = useState<ServiceStep>(1);
  const [aiFields, setAiFields] = useState<Set<ServiceFormField>>(new Set());
  const [pending, setPending] = useState<Partial<Record<ReplaceableField, string>>>({});
  const [savedDraft, setSavedDraft] = useState<StoredDraft | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const formRef = useRef(form);
  const touchedRef = useRef<Set<ServiceFormField>>(new Set());
  const autosaveEnabledRef = useRef(true);

  useEffect(() => {
    if (!persist) return;
    let cancelled = false;
    readDraft().then((draft) => {
      if (!cancelled && draft) setSavedDraft(draft);
    });
    return () => {
      cancelled = true;
    };
  }, [persist]);

  useEffect(() => {
    if (!persist || !autosaveEnabledRef.current || !FileSystem.documentDirectory) return;
    if (!hasContent(form, images)) return;

    const timer = setTimeout(() => {
      if (!autosaveEnabledRef.current) return;
      const payload: StoredDraft = {
        version: 1,
        step,
        form,
        images,
        savedAt: new Date().toISOString(),
      };
      FileSystem.writeAsStringAsync(DRAFT_PATH, JSON.stringify(payload))
        .then(() => setLastSavedAt(new Date()))
        .catch(() => undefined);
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [persist, form, images, step]);

  const commitForm = useCallback((next: ServiceFormValues) => {
    formRef.current = next;
    setFormState(next);
  }, []);

  /** User edits: anything the seller changes is no longer "AI suggested". */
  const setForm = useCallback(
    (next: ServiceFormValues) => {
      const current = formRef.current;
      const changed = (Object.keys(next) as ServiceFormField[]).filter(
        (key) => JSON.stringify(next[key]) !== JSON.stringify(current[key]),
      );
      changed.forEach((key) => touchedRef.current.add(key));
      if (changed.length) {
        setAiFields((fields) => {
          if (!changed.some((key) => fields.has(key))) return fields;
          const updated = new Set(fields);
          changed.forEach((key) => updated.delete(key));
          return updated;
        });
        setPending((items) => {
          const updated = { ...items };
          changed.forEach((key) => {
            if (key === 'title' || key === 'description') delete updated[key];
          });
          return updated;
        });
      }
      commitForm(next);
    },
    [commitForm],
  );

  /**
   * AI suggestions fill empty or untouched fields directly. Title/description the seller
   * already wrote are offered as a replacement instead of being overwritten.
   */
  const applyAiValues = useCallback(
    (values: AiValues) => {
      const current = formRef.current;
      const next = { ...current };
      const filled: ServiceFormField[] = [];
      const replacements: Partial<Record<ReplaceableField, string>> = {};
      const isUserOwned = (key: ServiceFormField, value: string) =>
        touchedRef.current.has(key) && value.trim().length > 0;

      if (values.category && !isUserOwned('category', current.category)) {
        next.category = values.category;
        filled.push('category');
      }

      for (const key of ['title', 'description'] as const) {
        const value = values[key]?.trim();
        if (!value || value === current[key].trim()) continue;
        if (isUserOwned(key, current[key])) {
          replacements[key] = value;
        } else {
          next[key] = value;
          filled.push(key);
        }
      }

      if (values.turnaround?.trim() && !current.turnaround.trim()) {
        next.turnaround = values.turnaround.trim();
        filled.push('turnaround');
      }

      if (values.serviceMode && !touchedRef.current.has('serviceMode')) {
        next.serviceMode = values.serviceMode;
        filled.push('serviceMode');
      }

      if (values.capabilities?.length) {
        const existing = new Set(current.capabilities.map((item) => item.toLowerCase()));
        const additions = values.capabilities.filter((item) => !existing.has(item.toLowerCase()));
        if (additions.length) {
          next.capabilities = [...current.capabilities, ...additions].slice(0, MAX_CAPABILITIES);
          filled.push('capabilities');
        }
      }

      commitForm(next);
      setAiFields((fields) => new Set([...fields, ...filled]));
      setPending((items) => ({ ...items, ...replacements }));
    },
    [commitForm],
  );

  const acceptPending = useCallback(
    (field: ReplaceableField) => {
      const value = pending[field];
      if (value === undefined) return;
      commitForm({ ...formRef.current, [field]: value });
      setAiFields((fields) => new Set([...fields, field]));
      setPending((items) => {
        const updated = { ...items };
        delete updated[field];
        return updated;
      });
    },
    [commitForm, pending],
  );

  const dismissPending = useCallback((field: ReplaceableField) => {
    setPending((items) => {
      const updated = { ...items };
      delete updated[field];
      return updated;
    });
  }, []);

  const resumeDraft = useCallback(() => {
    if (!savedDraft) return;
    commitForm(savedDraft.form);
    setImages(savedDraft.images);
    setStep(savedDraft.step);
    (Object.keys(savedDraft.form) as ServiceFormField[]).forEach((key) =>
      touchedRef.current.add(key),
    );
    setSavedDraft(null);
  }, [commitForm, savedDraft]);

  const discardDraft = useCallback(async () => {
    setSavedDraft(null);
    await clearServiceDraft();
  }, []);

  /** Start a fresh listing, optionally keeping some values (e.g. location for "Add another"). */
  const reset = useCallback((nextForm: ServiceFormValues = emptyServiceForm()) => {
    touchedRef.current = new Set();
    commitForm(nextForm);
    setImages([]);
    setStep(1);
    setAiFields(new Set());
    setPending({});
    setLastSavedAt(null);
  }, [commitForm]);

  /** Programmatic prefill (profile location, duplicate) that shouldn't count as user edits. */
  const prefill = useCallback(
    (update: (current: ServiceFormValues) => ServiceFormValues) => {
      commitForm(update(formRef.current));
    },
    [commitForm],
  );

  const pauseAutosave = useCallback((paused: boolean) => {
    autosaveEnabledRef.current = !paused;
  }, []);

  return {
    form,
    setForm,
    prefill,
    images,
    setImages,
    step,
    setStep,
    aiFields,
    pending,
    applyAiValues,
    acceptPending,
    dismissPending,
    savedDraft,
    resumeDraft,
    discardDraft,
    lastSavedAt,
    reset,
    pauseAutosave,
  };
}
