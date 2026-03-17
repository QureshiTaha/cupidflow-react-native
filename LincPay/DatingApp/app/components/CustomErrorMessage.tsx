import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {color} from '../const/color';
import {sizes} from '../const';
import CustomText from './CustomText';

interface CustomErrorMessageProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
  height?: number;
}

const CustomErrorMessage: React.FC<CustomErrorMessageProps> = ({
  message,
  onRetry,
  style,
  height = sizes.height - 40,
}) => {
  return (
    <View style={[styles.container, style, {height}]}>
      {message && <CustomText style={styles.errorText}>{message}</CustomText>}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomErrorMessage;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: sizes.height - 40,
  },
  errorText: {
    fontSize: 16,
    color: color.PRIMARY_COLOR,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor:"#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth:1,borderColor:color.PRIMARY_COLOR
  },
  retryText: {
    color: color.PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
