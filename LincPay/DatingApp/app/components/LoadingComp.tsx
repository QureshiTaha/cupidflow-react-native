import {ActivityIndicator, StyleSheet, View, ViewStyle} from 'react-native';
import React from 'react';
import { sizes } from '../const';
import { color } from '../const/color';
import CustomText from './CustomText';

interface LoadingCompoProps {
  minHeight?: number;
  loaderSize?: 'large' | 'small';
  backgroundColor?: string;
  style?: ViewStyle;
  message?:string;
}

const LoadingCompo: React.FC<LoadingCompoProps> = ({
  minHeight = sizes.width,
  loaderSize = 'large',
  backgroundColor = 'transparent',
  message,
  style,
}) => {
  return (
    <View style={[styles.container, {minHeight, backgroundColor}, style]}>
      <ActivityIndicator color={color.PRIMARY_COLOR} size={loaderSize} />
      {message && <CustomText style={{marginTop:12}}>{ message}</CustomText>}
    </View>
  );
};

export default LoadingCompo;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});
