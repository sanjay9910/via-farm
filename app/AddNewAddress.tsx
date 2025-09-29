import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddNewAddress = () => {
    const navigation = useNavigation();

    const [formData, setFormData] = useState({
        name: '',
        mobileNo: '',
        pincode: '',
        houseNumber: '',
        locality: '',
        city: '',
        district: ''
    });

    const [isDefaultAddress, setIsDefaultAddress] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        // Validation
        if (!formData.name || !formData.mobileNo || !formData.pincode ||
            !formData.houseNumber || !formData.locality || !formData.city || !formData.district) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        // Save logic here - you can replace with your API call
        console.log('Saving address:', { ...formData, isDefaultAddress });

        // Navigate back after save
        navigation.goBack();
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    const handleUseCurrentLocation = () => {
        // Implement current location logic
        Alert.alert('Info', 'Current location feature will be implemented');
    };

    const handleSearchLocation = () => {
        // Implement search location logic
        Alert.alert('Info', 'Search location feature will be implemented');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Address</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Contact Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Details</Text>
                    {/* Name */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Name*"
                            value={formData.name}
                            onChangeText={(value) => handleInputChange('name', value)}
                            placeholderTextColor="#999"
                        />
                    </View>
                    {/* Mobile No */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Number*"
                            keyboardType="phone-pad"
                            value={formData.mobileNo}
                            onChangeText={(value) => handleInputChange('mobileNo', value)}
                            placeholderTextColor="#999"
                            maxLength={10}
                        />
                    </View>
                </View>

                {/* Address Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Address</Text>

                    {/* Location Buttons */}
                    <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation}>
                        <Ionicons name="location" size={20} color="#3b82f6" />
                        <Text style={styles.locationButtonText}>Use my current location</Text>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.searchLocationButton} onPress={handleSearchLocation}>
                        <Ionicons name="search" size={20} color="#3b82f6" />
                        <Text style={styles.searchLocationButtonText}>Search Location</Text>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    {/* Address Input Fields */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter pin code"
                            keyboardType="number-pad"
                            value={formData.pincode}
                            onChangeText={(value) => handleInputChange('pincode', value)}
                            placeholderTextColor="#999"
                            maxLength={6}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter house number/block/street"
                            value={formData.houseNumber}
                            onChangeText={(value) => handleInputChange('houseNumber', value)}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter locality/town"
                            value={formData.locality}
                            onChangeText={(value) => handleInputChange('locality', value)}
                            placeholderTextColor="#999"
                        />
                    </View>
                    <View style={styles.CityDistrict}>
                        <View style={styles.inputContainerC}>
                            <TextInput
                                style={styles.textInputC}
                                placeholder="city*"
                                value={formData.city}
                                onChangeText={(value) => handleInputChange('city', value)}
                                placeholderTextColor="rgba(77, 77, 77, 0.35)"
                            />
                        </View>

                        <View style={styles.inputContainerC}>
                            <TextInput
                                style={styles.textInputC}
                                placeholder="district*"
                                value={formData.district}
                                onChangeText={(value) => handleInputChange('district', value)}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>


                    {/* Default Address Switch */}
                    <View style={styles.switchContainer}>
                        <Switch
                            value={isDefaultAddress}
                            onValueChange={setIsDefaultAddress}
                            trackColor={{ false: '#f0f0f0', true: '#3b82f6' }}
                            thumbColor={isDefaultAddress ? '#fff' : '#f4f3f4'}
                        />
                        <Text style={styles.switchLabel}>Make this as my default address</Text>
                    </View>
                </View>

                {/* Bottom Space */}
                <View style={styles.bottomSpace} />
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(249, 249, 249, 1)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: 'rgba(249, 249, 249, 1)',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    headerRight: {
        width: 24,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    section: {
        marginTop: 14,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
    },
    CityDistrict: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
    },
    inputContainer: {
        marginBottom: 10,
    },
    inputContainerC: {
        width: '50%',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textInputC: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight:'600',
         backgroundColor: 'rgba(77, 77, 77, 0.35)',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    locationButtonText: {
        flex: 1,
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '500',
        marginLeft: 8,
    },
    searchLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    searchLocationButtonText: {
        flex: 1,
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '500',
        marginLeft: 8,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginLeft: 12,
    },
    bottomSpace: {
        height: 100,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderWidth:2,
        borderColor: 'rgba(76, 175, 80, 1)',
        borderRadius: 8,
        marginRight: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(76, 175, 80, 1)',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(76, 175, 80, 1)',
        borderRadius: 8,
        marginLeft: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default AddNewAddress;