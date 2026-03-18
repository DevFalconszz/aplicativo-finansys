import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' || variant === 'link' ? '#7C3AED' : '#fff'} size="small" />
      ) : (
        <>
          {children}
          {title && <Text style={textStyles}>{title}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  // Variantes
  default: {
    backgroundColor: '#7C3AED',
  },
  destructive: {
    backgroundColor: '#EF4444',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondary: {
    backgroundColor: '#F3F4F6',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
  // Tamanhos
  sizeDefault: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sizeSm: {
    height: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sizeLg: {
    height: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sizeIcon: {
    height: 48,
    width: 48,
    padding: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  // Cores de texto por variante
  defaultText: {
    color: '#FFFFFF',
  },
  destructiveText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#374151',
  },
  secondaryText: {
    color: '#374151',
  },
  ghostText: {
    color: '#374151',
  },
  linkText: {
    color: '#7C3AED',
    textDecorationLine: 'underline',
  },
  // Tamanhos de texto
  sizeDefaultText: {
    fontSize: 16,
  },
  sizeSmText: {
    fontSize: 14,
  },
  sizeLgText: {
    fontSize: 18,
  },
  sizeIconText: {
    fontSize: 14,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export { Button };
