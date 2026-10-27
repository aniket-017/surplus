import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AI_COLOR, AI_TINT } from '@/src/components/service-form/shared';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { checkServiceQuality } from '@/src/lib/servicesApi';
import type { ServiceFormValues, ServiceQualityIssue } from '@/src/types/service';

function localIssues(form: ServiceFormValues, photoCount: number): ServiceQualityIssue[] {
  const issues: ServiceQualityIssue[] = [];
  if (form.description.trim().length < 60) {
    issues.push({
      field: 'description',
      message: 'Add more detail: machines, materials and typical jobs you handle.',
    });
  }
  if (!form.capabilities.length) {
    issues.push({ field: 'capabilities', message: 'Add a few capabilities so buyers can match you.' });
  }
  if (!photoCount) {
    issues.push({ field: 'photos', message: 'Listings with work photos get more enquiries.' });
  }
  return issues;
}

type ServiceQualityTipsProps = {
  form: ServiceFormValues;
  photoCount: number;
};

export function ServiceQualityTips({ form, photoCount }: ServiceQualityTipsProps) {
  const { token } = useAuth();
  const [issues, setIssues] = useState<ServiceQualityIssue[] | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(form);
  formRef.current = form;
  const photoCountRef = useRef(photoCount);
  photoCountRef.current = photoCount;

  const runCheck = useCallback(async () => {
    const current = formRef.current;
    const photos = photoCountRef.current;
    if (!token) {
      setIssues(localIssues(current, photos));
      return;
    }
    setLoading(true);
    try {
      setIssues(await checkServiceQuality(token, current, photos));
    } catch {
      setIssues(localIssues(current, photos));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={14} color={AI_COLOR} />
        <Text style={styles.title}>Listing check</Text>
        <View style={styles.flex} />
        {!loading ? (
          <Pressable onPress={() => void runCheck()} hitSlop={8}>
            <Text style={styles.link}>Re-check</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={AI_COLOR} />
          <Text style={styles.muted}>Reviewing your listing…</Text>
        </View>
      ) : issues && issues.length === 0 ? (
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
          <Text style={styles.good}>Looks good. Your listing is ready to publish.</Text>
        </View>
      ) : (
        issues?.map((issue, index) => (
          <View key={`${issue.field}-${index}`} style={styles.row}>
            <Ionicons name="bulb-outline" size={15} color={AI_COLOR} />
            <Text style={styles.tip}>{issue.message}</Text>
          </View>
        ))
      )}

      {issues?.length ? (
        <Text style={styles.footnote}>Tips only. You can publish anytime.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: AI_TINT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: AI_COLOR,
    fontSize: 14,
    fontWeight: '800',
  },
  flex: {
    flex: 1,
  },
  link: {
    color: AI_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tip: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  good: {
    flex: 1,
    color: colors.accentHover,
    fontSize: 13,
    fontWeight: '600',
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
  },
  footnote: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
