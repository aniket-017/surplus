import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState, type ComponentProps } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/src/constants/theme';

type IconInputProps = TextInputProps & {
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const IconInput = forwardRef<TextInput, IconInputProps>(function IconInput(
  { icon, style, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, focused && styles.fieldFocused]}>
      <Ionicons name={icon} size={20} color={focused ? colors.accent : colors.muted} />
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor="#8A97A6"
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...inputProps}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 27, 45, 0.08)',
    backgroundColor: '#F6F8FA',
  },
  fieldFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textStrong,
    paddingVertical: 14,
  },
});
