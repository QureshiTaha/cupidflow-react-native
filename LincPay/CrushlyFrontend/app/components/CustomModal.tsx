import React, { ReactNode } from "react";
import {
  Modal,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  Image,
} from "react-native";
import { myConsole } from "../utils/myConsole";
import Ionicons from "react-native-vector-icons/Ionicons";
interface TCustomModal {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  hasBackdrop?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  customBgStyle?: StyleProp<ViewStyle>;
  showCloseIcon?: Boolean;
}

const CustomModal = ({
  visible,
  onClose,
  children,
  hasBackdrop = true,
  containerStyle,
  customBgStyle,
  showCloseIcon = false,
}: TCustomModal) => {
  const handleModalPress = () => {
    onClose?.();
  };

  const handleChildPress = (e: any) => {
    e.stopPropagation();
  };
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback
        onPress={hasBackdrop ? handleModalPress : undefined}
      >
        <View style={[styles.modalBackground, customBgStyle]}>
          <TouchableWithoutFeedback onPress={handleChildPress}>
            <View style={[styles.modalContent, containerStyle]}>
              {showCloseIcon && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="grey" />
                </TouchableOpacity>
              )}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
  },
  modalContent: {
    backgroundColor: "#fff",
    minWidth: 100,
    minHeight: 100,
    borderRadius: 20,
    padding: 20,
    paddingTop: 40,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    // backgroundColor: 'red',
    padding: 12,
  },
});

export default CustomModal;
