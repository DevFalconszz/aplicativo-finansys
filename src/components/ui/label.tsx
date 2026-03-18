import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { cn } from '../../lib/utils';

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  style?: TextStyle;
}

const Label: React.FC<LabelProps> = ({ children, style }) => {
  return <Text style={[styles.label, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export { Label };
