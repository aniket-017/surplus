import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  cloneElement,
  isValidElement,
} from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

import { spacing } from '@/src/constants/theme';

type KeyboardScrollContextValue = {
  scrollIntoView: (view: View | null) => void;
};

const KeyboardScrollContext = createContext<KeyboardScrollContextValue | null>(null);

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  children: ReactNode;
  keyboardVerticalOffset?: number;
};

export function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  ...scrollProps
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const pendingScrollTargetRef = useRef<View | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollIntoView = useCallback(
    (view: View | null) => {
      if (!view || !scrollRef.current) return;

      pendingScrollTargetRef.current = view;

      const performScroll = () => {
        view.measureInWindow((_x, y, _width, height) => {
          const windowHeight = Dimensions.get('window').height;
          const keyboardInset = keyboardHeight || 280;
          const visibleBottom =
            windowHeight - keyboardInset - keyboardVerticalOffset - spacing.lg;

          if (y + height > visibleBottom) {
            const offset = y + height - visibleBottom + spacing.md;
            scrollRef.current?.scrollTo({
              y: scrollYRef.current + offset,
              animated: true,
            });
          }
        });
      };

      requestAnimationFrame(performScroll);
      setTimeout(performScroll, Platform.OS === 'ios' ? 250 : 100);
    },
    [keyboardHeight, keyboardVerticalOffset],
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);

      const target = pendingScrollTargetRef.current;
      if (target) {
        requestAnimationFrame(() => {
          target.measureInWindow((_x, y, _width, height) => {
            const windowHeight = Dimensions.get('window').height;
            const visibleBottom =
              windowHeight - event.endCoordinates.height - keyboardVerticalOffset - spacing.lg;

            if (y + height > visibleBottom) {
              const offset = y + height - visibleBottom + spacing.md;
              scrollRef.current?.scrollTo({
                y: scrollYRef.current + offset,
                animated: true,
              });
            }
          });
        });
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      pendingScrollTargetRef.current = null;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardVerticalOffset]);

  return (
    <KeyboardScrollContext.Provider value={{ scrollIntoView }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          onScroll={(event) => {
            scrollYRef.current = event.nativeEvent.contentOffset.y;
            scrollProps.onScroll?.(event);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            contentContainerStyle,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + spacing.xl },
          ]}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardScrollContext.Provider>
  );
}

export function ScrollIntoView({ children, style }: ViewProps) {
  const context = useContext(KeyboardScrollContext);
  const viewRef = useRef<View>(null);

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<TextInputProps>, {
        onFocus: (event) => {
          const input = children as ReactElement<TextInputProps>;
          input.props.onFocus?.(event);
          context?.scrollIntoView(viewRef.current);
        },
      })
    : children;

  return (
    <View ref={viewRef} style={style}>
      {child}
    </View>
  );
}

const styles = {
  flex: { flex: 1 },
};
