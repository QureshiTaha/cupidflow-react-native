import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Feather } from "@expo/vector-icons";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

export interface OptionItemProps {
  icon: FeatherName;
  text: string;
  subtext?: string;
  coinIcon?: boolean;
  color?: string; // applies to icon + main text
  onPress: () => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const OptionItemComponent: React.FC<OptionItemProps> = ({
  icon,
  text,
  subtext,
  coinIcon,
  color = "#000",
  onPress,
  disabled = false,
  containerStyle,
  testID,
}) => {
  return (
    <TouchableWithoutFeedback onPressOut={Keyboard.dismiss} accessible={false}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        android_ripple={{ color: "rgba(0,0,0,0.08)" }}
        hitSlop={8}
        style={({ pressed }) => [
          styles.optionItem,
          pressed && styles.pressed,
          disabled && styles.disabled,
          containerStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityHint={subtext}
      >
        <Feather
          name={icon}
          size={24}
          color={color}
          style={styles.optionIcon}
        />

        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionText, { color }]} numberOfLines={1}>
            {text}
          </Text>

          {subtext ? (
            <View style={styles.subtextContainer}>
              {coinIcon && <View style={styles.coinIcon} />}
              <Text style={styles.subtext} numberOfLines={1}>
                {subtext}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </TouchableWithoutFeedback>
  );
};

// Prevent unnecessary re-renders
const OptionItem = memo(
  OptionItemComponent,
  (prev, next) =>
    prev.icon === next.icon &&
    prev.text === next.text &&
    prev.subtext === next.subtext &&
    prev.coinIcon === next.coinIcon &&
    prev.color === next.color &&
    prev.onPress === next.onPress &&
    prev.disabled === next.disabled &&
    prev.containerStyle === next.containerStyle
);

const styles = StyleSheet.create({
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 180,
    borderRadius: 10,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
  },
  subtextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  coinIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e91e63",
    marginRight: 5,
  },
  subtext: {
    fontSize: 12,
    color: "#666",
  },
});

export default OptionItem;
