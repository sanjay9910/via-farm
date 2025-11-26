import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from '../Responsive';

const { height } = Dimensions.get('window');
const API_BASE = 'https://viafarm-1.onrender.com';





// ---------------- EditProfileModal ----------------



const EditProfileModal = ({ visible, onClose, initialData = {}, onUpdate }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [mobileNumber, setMobileNumber] = useState(initialData?.phone || initialData?.mobileNumber || '');
  const [upiId, setUpiId] = useState(initialData?.upiId || '');
  const [status, SetStatus] = useState(initialData?.status || 'Active');
  const [about, SetAbout] = useState(initialData?.about || '');
  const [profileImageUri, setProfileImageUri] = useState(initialData?.profilePicture || initialData?.image || null);

  const [farmImages, SetFarmImages] = useState(() => {
    const fromInitial = initialData?.farmImages || initialData?.images || [];
    if (!fromInitial) return [];
    if (Array.isArray(fromInitial)) return fromInitial.map(u => (typeof u === 'string' ? { uri: u } : u));
    if (typeof fromInitial === 'string') return [{ uri: fromInitial }];
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useEffect(() => {
    setName(initialData?.name || '');
    setMobileNumber(initialData?.phone || initialData?.mobileNumber || '');
    setUpiId(initialData?.upiId || '');
    SetStatus(initialData?.status || 'Active');
    SetAbout(initialData?.about || '');
    setProfileImageUri(initialData?.profilePicture || initialData?.image || null);

    const fromInitial = initialData?.farmImages || initialData?.images || [];
    if (!fromInitial) SetFarmImages([]);
    else if (Array.isArray(fromInitial)) SetFarmImages(fromInitial.map(u => (typeof u === 'string' ? { uri: u } : u)));
    else if (typeof fromInitial === 'string') SetFarmImages([{ uri: fromInitial }]);
  }, [initialData]);

  const getMediaTypesOption = () => {
    return ImagePicker?.MediaType?.Image || ImagePicker?.MediaTypeOptions?.Images || undefined;
  };

  // Enhanced compression with aggressive settings for large files
  const compressImage = async (uri, isFarmImage = false) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSizeInMB = fileInfo.size / (1024 * 1024);

      console.log(`Original image size: ${fileSizeInMB.toFixed(2)} MB`);

      // If less than 300KB, no compression needed
      if (fileSizeInMB < 0.3) {
        console.log('Image already small, skipping compression');
        return uri;
      }

      // Aggressive compression for farm images and large files
      let quality = 0.7;
      let maxWidth = 1200;

      if (isFarmImage) {
        // Farm images can be more compressed since they're in gallery
        maxWidth = 1000;
        if (fileSizeInMB > 10) quality = 0.3;
        else if (fileSizeInMB > 5) quality = 0.35;
        else if (fileSizeInMB > 3) quality = 0.4;
        else if (fileSizeInMB > 2) quality = 0.45;
        else if (fileSizeInMB > 1) quality = 0.5;
        else quality = 0.6;
      } else {
        // Profile picture
        if (fileSizeInMB > 5) quality = 0.4;
        else if (fileSizeInMB > 2) quality = 0.5;
        else if (fileSizeInMB > 1) quality = 0.6;
      }

      console.log(`Compressing with quality: ${quality}, max width: ${maxWidth}`);

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        { 
          compress: quality, 
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false 
        }
      );

      const compressedInfo = await FileSystem.getInfoAsync(manipResult.uri);
      const compressedSizeInMB = compressedInfo.size / (1024 * 1024);
      
      console.log(`Compressed to: ${compressedSizeInMB.toFixed(2)} MB (${((1 - compressedSizeInMB / fileSizeInMB) * 100).toFixed(1)}% reduction)`);

      // If still too large, compress again more aggressively
      if (compressedSizeInMB > 2 && isFarmImage) {
        console.log('Still too large, compressing again...');
        const secondPass = await ImageManipulator.manipulateAsync(
          manipResult.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
        );
        const finalInfo = await FileSystem.getInfoAsync(secondPass.uri);
        const finalSizeInMB = finalInfo.size / (1024 * 1024);
        console.log(`Second pass compressed to: ${finalSizeInMB.toFixed(2)} MB`);
        return secondPass.uri;
      }

      return manipResult.uri;
    } catch (err) {
      console.log('Compression error:', err);
      return uri;
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Permission to access gallery is required!');
        return;
      }

      const mediaTypesOption = getMediaTypesOption();
      const options = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      };
      if (mediaTypesOption) options.mediaTypes = mediaTypesOption;

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && Array.isArray(result.assets) && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri, false);
        setProfileImageUri(compressedUri);
      }
    } catch (err) {
      console.log('pickImage error', err);
      Alert.alert('Error', 'Could not pick image. Try again.');
    }
  };

  const ImageFarm = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Permission to access gallery is required!');
        return;
      }

      const mediaTypesOption = getMediaTypesOption();
      const pickerOptions = { 
        allowsMultipleSelection: true, 
        quality: 0.5,  // Lower initial quality for picker
      };
      if (mediaTypesOption) pickerOptions.mediaTypes = mediaTypesOption;

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && Array.isArray(result.assets)) {
        console.log(`Processing ${result.assets.length} farm images...`);
        
        const compressedPromises = result.assets.map(async (asset, idx) => {
          try {
            console.log(`Compressing farm image ${idx + 1}/${result.assets.length}`);
            const compressedUri = await compressImage(asset.uri, true);
            return { uri: compressedUri, success: true };
          } catch (err) {
            console.log(`Failed to compress farm image ${idx + 1}:`, err);
            return { uri: null, success: false };
          }
        });

        const results = await Promise.all(compressedPromises);
        const picked = results.filter(r => r.success && r.uri).map(r => ({ uri: r.uri }));
        
        console.log(`Successfully compressed ${picked.length}/${result.assets.length} images`);

        SetFarmImages(prev => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const combined = [...prevArr, ...picked];
          const unique = Array.from(new Map(combined.map(item => [item.uri, item])).values());
          const final = unique.slice(0, 5);
          console.log(`Total farm images: ${final.length}`);
          return final;
        });
      }
    } catch (err) {
      console.log('ImageFarm error', err);
      Alert.alert('Error', 'Could not pick images. Try again.');
    }
  };

  const removeImage = (index) => {
    SetFarmImages(prev => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      arr.splice(index, 1);
      return arr;
    });
  };

  const handleSubmit = async () => {
    if (!name || !mobileNumber || !upiId) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }

    setLoading(true);

    const prepareUriForUpload = async (uri) => {
      try {
        if (!uri) return null;

        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          return uri;
        }

        if (Platform.OS === 'android') {
          if (uri.startsWith('content://')) {
            const filename = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
            const dest = `${FileSystem.cacheDirectory}${filename}`;
            
            try {
              await FileSystem.copyAsync({ from: uri, to: dest });
              return dest;
            } catch (copyErr) {
              try {
                await FileSystem.downloadAsync(uri, dest);
                return dest;
              } catch (downloadErr) {
                console.log('URI preparation failed, using original', downloadErr);
                return uri;
              }
            }
          }
          return uri;
        }

        if (Platform.OS === 'ios') {
          if (uri.startsWith('file://')) {
            return uri.replace('file://', '');
          }
        }

        return uri;
      } catch (err) {
        console.log('prepareUriForUpload error:', err);
        return uri;
      }
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not authenticated.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('mobileNumber', String(mobileNumber));
      formData.append('upiId', upiId);
      formData.append('status', status);
      formData.append('about', about || '');

      // Profile picture
      if (profileImageUri && !profileImageUri.startsWith('http')) {
        console.log('Processing profile picture...');
        const prepared = await prepareUriForUpload(profileImageUri);
        const filename = `profile_${Date.now()}.jpg`;

        formData.append('profilePicture', {
          uri: Platform.OS === 'android' ? prepared : `file://${prepared}`,
          name: filename,
          type: 'image/jpeg',
        });
        console.log('Profile picture added');
      }

      // Farm images - Process each one carefully
      if (farmImages && Array.isArray(farmImages) && farmImages.length > 0) {
        console.log(`Processing ${farmImages.length} farm images...`);
        
        const newImages = farmImages.filter(img => {
          const uri = typeof img === 'string' ? img : img?.uri;
          return uri && !uri.startsWith('http://') && !uri.startsWith('https://');
        });

        console.log(`${newImages.length} new farm images to upload`);

        for (let i = 0; i < newImages.length; i++) {
          try {
            const rawUri = typeof newImages[i] === 'string' ? newImages[i] : newImages[i]?.uri;
            
            console.log(`Processing farm image ${i + 1}/${newImages.length}`);
            
            // Get file info to log size
            const fileInfo = await FileSystem.getInfoAsync(rawUri);
            const sizeInMB = fileInfo.size / (1024 * 1024);
            console.log(`Farm image ${i + 1} size: ${sizeInMB.toFixed(2)} MB`);
            
            const prepared = await prepareUriForUpload(rawUri);
            const filename = `farm_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}.jpg`;

            const imageFile = {
              uri: Platform.OS === 'android' ? prepared : `file://${prepared}`,
              name: filename,
              type: 'image/jpeg',
            };

            formData.append('farmImages', imageFile);
            console.log(`Farm image ${i + 1} added successfully`);
          } catch (imgErr) {
            console.log(`Error processing farm image ${i + 1}:`, imgErr);
            // Continue with other images even if one fails
          }
        }
      }

      console.log('Uploading to:', `${API_BASE}/api/vendor/profile`);

      const response = await axios({
        method: 'PUT',
        url: `${API_BASE}/api/vendor/profile`,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for multiple large images
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload: ${percent}%`);
          }
        },
      });

      console.log('Response:', response.status, response.data);

      if (response.data?.success) {
        const payload = response.data?.user || response.data?.data || response.data;
        onUpdate({
          name: payload?.name || name,
          mobileNumber: payload?.mobileNumber || mobileNumber,
          upiId: payload?.upiId || upiId,
          status: payload?.status || status,
          about: payload?.about || about,
          profileImageUri: payload?.profilePicture || payload?.profileImage || profileImageUri,
          farmImages: Array.isArray(payload?.farmImages)
            ? payload.farmImages
            : payload?.farmImages
            ? [payload.farmImages]
            : (farmImages || []).map((i) => (typeof i === 'string' ? i : i?.uri)),
        });

        Alert.alert('Success', 'Profile updated successfully!');
        onClose();
      } else {
        Alert.alert('Error', response.data?.message || 'Something went wrong!');
      }
    } catch (err) {
      console.log('Upload error:', err);

      if (err?.response) {
        Alert.alert('Server Error', err.response.data?.message || `Status ${err.response.status}`);
      } else if (err?.code === 'ECONNABORTED') {
        Alert.alert('Timeout', 'Upload took too long. Try fewer or smaller images.');
      } else if (err?.message?.toLowerCase().includes('network')) {
        Alert.alert('Network Error', 'Check your internet connection and try again.');
      } else {
        Alert.alert('Error', err?.message || 'Upload failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };




  const selectStatus = (value) => {
    SetStatus(value);
    setShowStatusPicker(false);
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={modalStyles.modalContainer} onStartShouldSetResponder={() => true}>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={onClose} style={modalStyles.headerIcon}>
              <Image source={require("../../assets/via-farm-img/icons/groupArrow.png")} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>Edit Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollViewContent}>
            <Text style={modalStyles.smallText}>* marks important fields</Text>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>Profile Picture</Text>
              <TouchableOpacity style={modalStyles.profileUploadBox} onPress={pickImage}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={modalStyles.uploadedImage} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={30} color="#ccc" />
                    <Text style={modalStyles.chooseFileText}>Choose a file</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>Name *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="Your Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>Mobile No. *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="9999999999"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>UPI ID *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. yourname@bank"
                placeholderTextColor="#999"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />
            </View>

            {/* Status dropdown */}
            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>Status</Text>
              <View>
                <TouchableOpacity
                  onPress={() => setShowStatusPicker(prev => !prev)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: moderateScale(12),
                    paddingVertical: moderateScale(10),
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    backgroundColor: '#fff',
                  }}
                >
                  <Text style={{ color: '#333' }}>{status || 'Select status'}</Text>
                  <Ionicons name={showStatusPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
                </TouchableOpacity>

                {showStatusPicker && (
                  <View
                    style={{
                      marginTop: moderateScale(6),
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      zIndex: 9999,
                      elevation: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <TouchableOpacity onPress={() => selectStatus('Active')} style={{ padding: moderateScale(12), borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ color: '#222' }}>Active</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => selectStatus('Inactive')} style={{ padding: moderateScale(12) }}>
                      <Text style={{ color: '#222' }}>Inactive</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>About</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="tell us more about yourself"
                placeholderTextColor="#999"
                value={about}
                onChangeText={SetAbout}
                autoCapitalize="none"
                multiline
              />
            </View>

            {/* Multi-image */}
            <View style={{ marginBottom: moderateScale(12) }}>
              <Text style={{ fontSize: normalizeFont(14), fontWeight: '600', marginBottom: moderateScale(8) }}>Add Images *</Text>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: moderateScale(12),
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  backgroundColor: '#fff',
                  opacity: (loading || (farmImages && farmImages.length >= 5)) ? 0.6 : 1,
                }}
                onPress={ImageFarm}
                disabled={loading || (farmImages && farmImages.length >= 5)}
              >
                <Ionicons name="folder-outline" size={28} color="#777" />
                <Text style={{ marginLeft: moderateScale(12), color: '#333' }}>
                  {farmImages && farmImages.length >= 5 ? 'Maximum 5 images reached' : `Add images (${farmImages ? farmImages.length : 0}/5)`}
                </Text>
              </TouchableOpacity>

              {farmImages && farmImages.length > 0 && (
                <ScrollView horizontal style={{ marginVertical: 8 }}>
                  {farmImages.map((imgObj, idx) => (
                    <View key={(imgObj.uri || '') + idx} style={{ marginRight: moderateScale(8), position: 'relative', width: scale(90), height: scale(90), borderRadius: 8, overflow: 'hidden', backgroundColor: '#f3f3f3', justifyContent: 'center', alignItems: 'center' }}>
                      <Image source={{ uri: imgObj.uri }} style={{ width: '100%', height: '100%' }} />
                      {!loading && (
                        <TouchableOpacity onPress={() => removeImage(idx)} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: moderateScale(14), width: 28, height: 28, alignItems: 'center', justifyContent: 'center', elevation: 3 }}>
                          <Ionicons name="close-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
            {/* end multi-image */}
          </ScrollView>

          <TouchableOpacity style={modalStyles.updateButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" style={{ marginRight:moderateScale(8) }} /> : <Ionicons name="reload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
            <Text style={modalStyles.updateButtonText}>{loading ? 'Updating...' : 'Update Details'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ---------------- EditLocationModal (Updated Design) ----------------


const EditLocationModal = ({ visible, onClose, onSubmit, initialData }) => {
  const [pinCode, setPinCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [deliveryRadius, setDeliveryRadius] = useState(""); // numeric input only
  const [loading, setLoading] = useState(false);

  // ✅ Prefill values when editing
  useEffect(() => {
    if (visible && initialData) {
      setPinCode(initialData.pinCode || "");
      setHouseNumber(initialData.houseNumber || "");
      setLocality(initialData.locality || "");
      setCity(initialData.city || "");
      setDistrict(initialData.district || "");
      setDeliveryRadius(
        String(initialData.deliveryRadius || "").replace("km", "")
      );
      setLatitude(initialData.latitude || null);
      setLongitude(initialData.longitude || null);
    }
  }, [visible, initialData]);

  // 🧭 Optional: Use device location (future use)
  const handleUseCurrentLocation = () => {
    Alert.alert("Location", "Fetching current location feature coming soon...");
  };

  // 🔍 Optional: Search location (future use)
  const handleSearchLocation = () => {
    Alert.alert("Search", "Search location feature coming soon...");
  };

  // ✅ Final Submit
  const handleSubmit = async () => {
    if (!pinCode || !houseNumber || !locality || !city || !district) {
      Alert.alert("Error", "Please fill all required address fields.");
      return;
    }

    // Validate radius
    const radiusInt = parseInt(deliveryRadius, 10);
    if (isNaN(radiusInt) || radiusInt < 0 || radiusInt > 10000) {
      Alert.alert(
        "Error",
        "Delivery radius must be a valid number between 0 and 10,000."
      );
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not authenticated.");
        setLoading(false);
        return;
      }

      // ✅ Properly formatted body for API
      const body = {
        pinCode,
        houseNumber,
        locality,
        city,
        district,
        latitude: latitude || 0,
        longitude: longitude || 0,
        deliveryRegion: `${radiusInt}km`,
      };

      console.log("Sending Location Update Body:", body);

      const response = await axios.put(
        `${API_BASE}/api/vendor/update-location`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Location updated successfully!");

        // Pass updated location data to parent component
        onSubmit(response.data.data);
        onClose();
      } else {
        Alert.alert("Error", response.data.message || "Something went wrong!");
      }
    } catch (error) {
      console.log("Location update error:", error);

      let errorMessage = "Failed to update location. Please try again later.";

      if (error.response) {
        console.log("Server Response:", error.response.data);
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage =
            "Invalid data submitted. Please check pin code and delivery radius.";
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity
        style={modalStyles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={modalStyles.modalContainer} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={onClose} style={modalStyles.headerIcon}>
              <Image source={require("../../assets/via-farm-img/icons/groupArrow.png")} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>Edit Location & Charges</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollViewContent}
          >
            <Text style={modalStyles.sectionTitle}>Your Address</Text>

            {/* Location Actions */}
            <TouchableOpacity
              style={modalStyles.locationButton}
              onPress={handleUseCurrentLocation}
            >
              <Ionicons name="locate" size={18} color="#00B0FF" />
              <Text style={modalStyles.locationButtonText}>Use my current location</Text>
              <Ionicons name="chevron-forward" size={16} color="#00B0FF" />
            </TouchableOpacity>

            <TextInput
              style={modalStyles.textInput}
              placeholder="Pin Code *"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
              value={pinCode}
              onChangeText={setPinCode}
            />

            <TextInput
              style={modalStyles.textInput}
              placeholder="House number/Block/Street *"
              placeholderTextColor="#999"
              value={houseNumber}
              onChangeText={setHouseNumber}
            />

            <TextInput
              style={modalStyles.textInput}
              placeholder="Locality/Town *"
              placeholderTextColor="#999"
              value={locality}
              onChangeText={setLocality}
            />

            <View style={modalStyles.row}>
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="City *"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="District *"
                placeholderTextColor="#999"
                value={district}
                onChangeText={setDistrict}
              />
            </View>

            {/* Delivery Region */}
            <Text style={modalStyles.sectionTitle}>Delivery Region</Text>
            <View style={modalStyles.deliveryRow}>
              <Text style={modalStyles.uptoText}>Upto</Text>
              <TextInput
                style={modalStyles.deliveryInput}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={deliveryRadius}
                onChangeText={setDeliveryRadius}
              />
              <Text style={modalStyles.kmsText}>kms</Text>
            </View>
          </ScrollView>

          {/* Submit */}
          <TouchableOpacity
            style={modalStyles.updateButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="reload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={modalStyles.updateButtonText}>
              {loading ? "Updating..." : "Update Details"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ---------------- VendorProfile ----------------
const VendorProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [fullUser, setFullUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editLocationModalVisible, setEditLocationModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const navigation = useNavigation();

  const getAvatarLetter = (name) => (name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U');

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const user = res.data.user;

        setFullUser(user);  

        setUserInfo({
          name: user.name,
          status: user.status,
          rating:user.rating,
          phone: user.mobileNumber,
          upiId: user.upiId,
          image: user.profilePicture,
          address: user.address || {},
        });
      }
    } catch (error) {
      console.log('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = (updatedData) => {
    setUserInfo((prev) => ({
      ...prev,
      name: updatedData.name,
      phone: updatedData.mobileNumber,
      upiId: updatedData.upiId,
      image: updatedData.profileImageUri || prev.image,
    }));
  };

  const handleLocationUpdate = (updatedAddress) => {
    setUserInfo((prev) => ({
      ...prev,
      address: updatedAddress,
    }));
  };

  const ProfileMenuItem = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={25} color="#666" />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate("VendorProfileView", { user: fullUser })}>
          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.avatarContainer}>
              {userInfo?.image ? (
                <Image source={{ uri: userInfo.image }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getAvatarLetter(userInfo?.name)}</Text>
              )}
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userInfo?.name}</Text>
              <Text style={styles.userPhone}>+91 {userInfo?.phone}</Text>
              <Text style={styles.userPhone}>{userInfo?.upiId}</Text>
              <Text style={styles.userRole}>{userInfo?.status}</Text>
            </View>
            <View>
              <TouchableOpacity style={{ borderWidth: 1, borderColor: "rgba(0, 0, 0, 0.2)", paddingHorizontal: moderateScale(6), borderRadius:7, flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: moderateScale(1) }} onPress={() => navigation.navigate("VendorProfileView", { user: fullUser })}>
                <Image source={require("../../assets/via-farm-img/icons/satar.png")} />
                 <Text style={{fontSize:normalizeFont(10)}} >{userInfo?.rating}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButtonContainer}
                onPress={() => setEditProfileModalVisible(true)}
              >
                <Image source={require("../../assets/via-farm-img/icons/editicon.png")} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.menuSection}>
          <ProfileMenuItem
            icon="location-outline"
            title="Manage Location & Charges"
            subtitle="Add/Edit your location"
            onPress={() => setEditLocationModalVisible(true)}
          />
          <ProfileMenuItem
            icon="pricetag-outline"
            title="My Coupons"
            subtitle="Your available discount coupons"
            onPress={() => navigation.navigate("MyCoupons")}
          />
          <ProfileMenuItem
            icon="language"
            title="Language"
            subtitle="Select your preferred language"
            onPress={() => navigation.navigate("Language")}
          />
          <ProfileMenuItem
            icon="headset-outline"
            title="Customer Support"
            subtitle="We are happy to assist you!"
            onPress={() => navigation.navigate("CustomerSupport")}
          />
          <ProfileMenuItem
            icon="shield-checkmark-outline"
            title="Privacy&Policy"
            subtitle="We care about your safety"
            onPress={() => navigation.navigate("Privacy&Policy")}
          />
          <ProfileMenuItem
            icon="information-circle-outline"
            title="About Us"
            subtitle="Get to know about us"
            onPress={() => navigation.navigate("AboutUs")}
          />
          <ProfileMenuItem
            icon="star-outline"
            title="Rate Us"
            subtitle="Rate your experience on Play Store"
            onPress={() => navigation.navigate("RateUs")}
          />
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              router.replace('/login');
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {userInfo && (
        <>
          <EditProfileModal
            visible={editProfileModalVisible}
            onClose={() => setEditProfileModalVisible(false)}
            initialData={userInfo}
            onUpdate={handleProfileUpdate}
          />

          <EditLocationModal
            visible={editLocationModalVisible}
            onClose={() => setEditLocationModalVisible(false)}
            initialData={userInfo?.address}
            onSubmit={handleLocationUpdate}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default VendorProfile;

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },

  profileSection: {
    backgroundColor: '#fff',
    marginHorizontal: scale(16),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: moderateScale(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(1) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(2),
  },

  profileInfo: { flexDirection: 'row', alignItems: 'center' },

  avatarContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#FFB4A2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { width: moderateScale(60), height: moderateScale(60), borderRadius: moderateScale(30) },
  avatarText: { fontSize: normalizeFont(24), fontWeight: '600', color: '#fff' },

  userInfo: { flex: 1, marginLeft: moderateScale(15) },
  userName: { fontSize: normalizeFont(scale(13)), fontWeight: '600', color: '#333', paddingVertical: moderateScale(2) },
  userPhone: { fontSize: normalizeFont(12), color: '#666', paddingVertical: moderateScale(1) },
  userRole: { fontSize: normalizeFont(11), color: '#4CAF50', fontWeight: '500', marginTop: moderateScale(2), paddingVertical: moderateScale(1) },

  editButtonContainer: { padding: moderateScale(8) ,marginTop:moderateScale(15)},

  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: scale(14),
    marginVertical: moderateScale(5),
    borderRadius: moderateScale(11),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(1) },
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    paddingVertical: moderateScale(14),
    borderBottomWidth: scale(0.5),
    borderBottomColor: '#f0f0f0',
  },

  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  iconContainer: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(50),
    backgroundColor: 'rgba(141, 110, 99, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(15),
    borderWidth: scale(1),
    borderColor: 'rgba(141, 110, 99, 0.2)',
  },

  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: normalizeFont(13), fontWeight: '500', color: '#333' },
  menuItemSubtitle: { fontSize: normalizeFont(12), color: '#666' },

  logoutSection: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(20),
    marginBottom: moderateScale(20),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(20),
  },

  logoutButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(18),
    borderRadius: moderateScale(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(3),
  },

  logoutIcon: { marginRight: moderateScale(8) },
  logoutText: { fontSize: normalizeFont(15), fontWeight: '600', color: '#fff' },
});

// ---------- Responsive modalStyles ----------
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: Math.max(moderateScale(200), height - moderateScale(80)),
    paddingBottom: moderateScale(15),
    borderTopWidth:2,
    borderLeftWidth:2,
    borderRightWidth:2,
    borderColor:'rgba(255, 202, 40, 1)'
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: scale(1),
    borderBottomColor: '#ddd',
  },
  headerIcon: { width: moderateScale(40), justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: normalizeFont(22), color: '#4CAF50', fontWeight: '600' },
  headerTitle: { fontSize: normalizeFont(14), fontWeight: '600', color: '#333' },

  scrollViewContent: { paddingVertical: moderateScale(15), paddingHorizontal: scale(20) },
  smallText: { fontSize: normalizeFont(10), color: '#999', marginBottom: moderateScale(10) },

  sectionTitle: { fontSize: normalizeFont(12), fontWeight: '600', color: '#333', marginBottom: moderateScale(15), marginTop: moderateScale(5) },

  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
    borderWidth: scale(1),
    borderColor: '#e0e0e0',
  },
  locationButtonText: {
    flex: 1,
    fontSize: normalizeFont(12),
    color: '#00B0FF',
    marginLeft: moderateScale(10),
    fontWeight: '500',
  },

  labelContainer: { marginBottom: moderateScale(15) },
  label: { fontSize: normalizeFont(12), fontWeight: '500', color: '#333', marginBottom: moderateScale(8) },

  textInput: {
    borderWidth: scale(1),
    borderColor: '#e0e0e0',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    color: '#333',
    fontSize: normalizeFont(14),
    backgroundColor: '#f9f9f9',
    marginBottom: moderateScale(15),
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', gap: moderateScale(10) },
  halfInput: { flex: 1, marginBottom: moderateScale(15) },

  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scale(2),
    borderColor: '#00B0FF',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(4),
    backgroundColor: '#fff',
    marginBottom: moderateScale(20),
  },
  uptoText: { fontSize: normalizeFont(12), color: '#666', marginRight: moderateScale(10) },
  deliveryInput: { flex: 1, fontSize: normalizeFont(14), color: '#333', paddingVertical: moderateScale(10), textAlign: 'center' },
  kmsText: { fontSize: normalizeFont(12), color: '#666', marginLeft: moderateScale(10) },

  updateButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(10),
    marginTop: moderateScale(10),
  },
  updateButtonText: { color: '#fff', fontSize: normalizeFont(14), fontWeight: '600' },

  profileUploadBox: {
    borderWidth: scale(1),
    borderColor: '#ccc',
    borderRadius: moderateScale(12),
    height: moderateScale(150),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadedImage: { width: '100%', height: '100%', borderRadius: moderateScale(8) },
  chooseFileText: { fontSize: normalizeFont(12), color: '#999', marginTop: moderateScale(8) },
});