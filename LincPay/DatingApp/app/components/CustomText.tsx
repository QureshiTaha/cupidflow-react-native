import React, {ReactNode} from 'react';
import {Text, StyleProp, TextStyle, TextProps} from 'react-native';

interface CustomTextProps extends TextProps {
  fontSize?: number;
  mb?: number;
  color?: string;
  fontWeight?: TextStyle['fontWeight'];
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

const CustomText: React.FC<CustomTextProps> = ({
  fontSize,
  children,
  fontWeight = '400',
  color = '#000000',
  mb,
  style,
  ...rest
}) => {
  const textStyle: StyleProp<TextStyle> = {
    fontSize,
    color,
    fontWeight,
    marginBottom: mb,
  };

  return (
    <Text style={[textStyle, style]} {...rest}>
      {children}
    </Text>
  );
};

export default CustomText;
