import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
    TouchableOpacity,
    ViewStyle,
    Image,
    TextStyle,
} from 'react-native';
import { color } from '../const/color';
import Ionicons from "react-native-vector-icons/Ionicons";

interface CustomTextInputProps {
    label?: string;
    fieldType?: 'number' | 'email' | 'default';
    placeholder?: string;
    name?: string;
    formik?: any;
    secureTextEntry?: boolean;
    multiline?: boolean;
    showCountryCode?: boolean;
    numberOfLines?: number;
    val?: any;
    mt?: any;
    disabled?: boolean;
    customStyling?: ViewStyle;
    customInputStyle?: TextStyle;
    percentageDigits?: any;
    borderred?: boolean;
    required?: boolean;
    keyboardType?:
    | 'default'
    | 'email-address'
    | 'number-pad'
    | 'url'
    | 'decimal-pad';
}

const getNestedValue = (obj: any, path: string) => {
    return path
        ?.split('.')
        .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const CustomTextInput: React.FC<CustomTextInputProps> = ({
    label,
    placeholder = 'Enter your text',
    name,
    val,
    formik,
    secureTextEntry = false,
    multiline = false,
    showCountryCode = false,
    keyboardType = 'default',
    numberOfLines,
    percentageDigits,
    mt = 12,
    disabled = false,
    borderred = true,
    required = true,
    customStyling,
    customInputStyle,
}) => {
    const [isPasswordVisible, setPasswordVisible] = useState(false);

    const value = getNestedValue(formik?.values, name);
    const error = formik?.errors[name];
    const touched = getNestedValue(formik?.touched, name);

    const handleInputChange = (text: string) => {
        if (percentageDigits) {
            const sanitizedText = text.replace(/[^0-9]/g, '');
            const limitedText = sanitizedText.slice(0, 2);
            formik.setFieldValue(name, limitedText);
        } else {
            formik.setFieldValue(name, text);
        }
    };

    const isRequired = formik?.validationSchema?.fields?.[name]?._exclusive?.required === true;

    return (
        <View style={[styles.container, { marginTop: mt }]}>
            {label && (
                <Text style={styles.label}>
                    {label} {required && <Text style={{ color: 'red' }}>*</Text>}
                </Text>
            )}


            <View style={[styles.rowContainer, customStyling]}>
                <TextInput
                    style={[
                        styles.input,
                        customInputStyle,
                        showCountryCode ? styles.inputWithCountryCode : styles.fullWidthInput,
                        {
                            textAlignVertical: numberOfLines ? 'top' : 'center',
                            paddingRight: secureTextEntry ? 40 : 12,
                        },
                        disabled ? { backgroundColor: '#f0f0f0' } : {},
                        borderred && error && touched ? { borderColor: 'red' } : {},   // <--- border red case
                    ]}

                    placeholder={placeholder}
                    placeholderTextColor={color.placeholderColor || '#888'}
                    value={typeof value === 'number' ? value.toString() : value || val}
                    onChangeText={handleInputChange}
                    onBlur={() => formik?.setFieldTouched(name)}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={multiline ? numberOfLines : 1}
                    editable={!disabled}
                //   ellipsizeMode="tail"
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setPasswordVisible(!isPasswordVisible)}
                        style={{
                            position: 'absolute',
                            right: 12,
                            height: '100%',
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                        }}>
                        {isPasswordVisible ? (
                            <Ionicons name="eye-off" size={20} color="grey" />
                        ) : (
                            <Ionicons name="eye" size={20} color="grey" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
            {!borderred && error && touched ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        color: '#000',
        fontWeight: '600',
        marginBottom: 4,
        marginLeft: 2,
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        borderColor: color.placeholderColor || '#ccc',
        paddingHorizontal: 8,
        paddingVertical: Platform.OS === 'ios' ? 0 : 8,
        marginRight: 4,
    },
    callingCodeText: {
        color: '#000',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        borderColor: color.placeholderColor || '#ccc',
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#000',
        height: 40,
    },
    inputWithCountryCode: {
        flex: 1,
    },
    fullWidthInput: {
        width: '100%',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
});

export default CustomTextInput;
