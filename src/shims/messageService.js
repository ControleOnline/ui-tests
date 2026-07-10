import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const MessageContext = createContext({
  showSuccess() {},
  showError() {},
  showInfo() {},
  showWarning() {},
});

const DEFAULT_DURATION = 4000;

function normalizeText(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

function MessageToast({ message }) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={[
          styles.toast,
          message.type === 'error' && styles.toastError,
          message.type === 'success' && styles.toastSuccess,
          message.type === 'warning' && styles.toastWarning,
          message.type === 'info' && styles.toastInfo,
        ]}
      >
        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.text}>{message.text}</Text>
      </View>
    </View>
  );
}

export function MessageProvider({ children }) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const pushMessage = useCallback(
    (type, text, options = {}) => {
      clearTimer();

      const nextDuration =
        typeof options.duration === 'number' && options.duration >= 0
          ? options.duration
          : DEFAULT_DURATION;

      setMessage({
        type,
        title:
          type === 'success'
            ? 'Sucesso'
            : type === 'warning'
              ? 'Aviso'
              : type === 'info'
                ? 'Info'
                : 'Erro',
        text: normalizeText(text),
      });

      if (nextDuration > 0) {
        timerRef.current = setTimeout(() => {
          setMessage(null);
          timerRef.current = null;
        }, nextDuration);
      }
    },
    [clearTimer],
  );

  const contextValue = useMemo(
    () => ({
      showSuccess: (text, options) => pushMessage('success', text, options),
      showError: (text, options) => pushMessage('error', text, options),
      showInfo: (text, options) => pushMessage('info', text, options),
      showWarning: (text, options) => pushMessage('warning', text, options),
    }),
    [pushMessage],
  );

  return (
    <MessageContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}
        <MessageToast message={message} />
      </View>
    </MessageContext.Provider>
  );
}

export function useMessage() {
  return React.useContext(MessageContext);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    zIndex: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  toastError: {
    borderColor: 'rgba(248, 113, 113, 0.38)',
    backgroundColor: 'rgba(69, 10, 10, 0.96)',
  },
  toastSuccess: {
    borderColor: 'rgba(74, 222, 128, 0.34)',
    backgroundColor: 'rgba(6, 78, 59, 0.96)',
  },
  toastWarning: {
    borderColor: 'rgba(251, 191, 36, 0.32)',
    backgroundColor: 'rgba(120, 53, 15, 0.96)',
  },
  toastInfo: {
    borderColor: 'rgba(56, 189, 248, 0.32)',
    backgroundColor: 'rgba(8, 47, 73, 0.96)',
  },
  title: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  text: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
});
