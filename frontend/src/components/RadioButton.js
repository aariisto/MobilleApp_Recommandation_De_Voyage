import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

const RadioButton = ({ label, value, selectedValue, onSelect }) => {
    const isSelected = selectedValue === value;
    return (
        <TouchableOpacity 
            style={styles.radioContainer} 
            onPress={() => onSelect(value)}
            activeOpacity={0.8}
        >
            <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                {isSelected && <View style={styles.radioInnerCircle} />}
            </View>
            <Text style={styles.radioText}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  radioContainer: { flexDirection: 'row', alignItems: 'center' },
  radioOuterCircle: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#777', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  radioOuterCircleSelected: { borderColor: '#004aad' },
  radioInnerCircle: { height: 9, width: 9, borderRadius: 4.5, backgroundColor: '#004aad' },
  radioText: { fontSize: 13, color: '#333' }
});

export default RadioButton;