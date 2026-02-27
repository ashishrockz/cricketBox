import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { Colors, FontSize } from '../theme';

interface Props {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible, message }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={Colors.accent} />
          {message ? <Text style={styles.msg}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    minWidth: 140,
  },
  msg: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
