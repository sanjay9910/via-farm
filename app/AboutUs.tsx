// AboutUs.jsx
import { goBack } from 'expo-router/build/global-state/routing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from './Responsive';

const BASE_URL = 'https://viafarm-1.onrender.com';
const API_ENDPOINT = '/api/admin/manage-app/About-us';

const AboutUs = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('About Us');
  const [paragraphs, setParagraphs] = useState([]);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${BASE_URL}${API_ENDPOINT}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const json = await res.json();
      if (!json || !json.success || !json.data || !json.data.content) {
        throw new Error('Invalid response from server');
      }
      const raw = (json.data.content || '').replace(/\r\n/g, '\n').trim();
      const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

      if (blocks.length === 0) {
        setTitle('About Us');
        setParagraphs([]);
      } else {
        const first = blocks[0];
        const isHeading = first.split(/\s+/).length <= 8;
        if (isHeading) {
          const cleanedTitle = first.replace(/^[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2700}-\u{27BF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\s]+/u, '').trim();
          setTitle(cleanedTitle || 'About Us');
          setParagraphs(blocks.slice(1));
        } else {
          setTitle('About Us');
          setParagraphs([raw]);
        }
      }
    } catch (err) {
      console.warn('Fetch About Us error', err);
      setError(err.message || 'Failed to load content');
      setTitle('About Us');
      setParagraphs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Image source={require('../assets/via-farm-img/icons/groupArrow.png')} />
        </TouchableOpacity>

        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={styles.headerTitle}
        >
          About Us
        </Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.accentBar} />

          <View style={styles.heroContent}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#ff6b35" />
                <Text allowFontScaling={false} style={styles.loadingText}>Fetching information...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorBlock}>
                <Text allowFontScaling={false} style={styles.errorTitle}>Oops — couldn't load content</Text>
                <Text allowFontScaling={false} style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchAbout}>
                  <Text allowFontScaling={false} style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text allowFontScaling={false} style={styles.title}>{title}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.badge}>
                    <Text allowFontScaling={false} style={styles.badgeText}>ViaFarm</Text>
                  </View>
                  <Text allowFontScaling={false} style={styles.smallText}>Connecting you with local farmers</Text>
                </View>

                <View style={styles.contentSection}>
                  {Array.isArray(paragraphs) && paragraphs.length > 0 ? (
                    paragraphs.map((p, i) => (
                      <Text allowFontScaling={false} key={i} style={styles.contentText}>
                        {p}
                      </Text>
                    ))
                  ) : (
                    <Text  allowFontScaling={false} style={styles.contentText}>
                      ViaFarm connects consumers directly with local farmers and small producers — delivering fresh produce with transparency and fair pricing.
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ height: moderateScale(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
    paddingTop: Platform.OS === 'android' ? moderateScale(6) : 0,
  },

  header: {
    height: scale(60),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#e6edf3',
    backgroundColor: '#ffffff',
    paddingVertical: moderateScale(6),
  },

  backButton: {
    padding: moderateScale(8),
    marginRight: moderateScale(6),
    zIndex: 2,
  },

  headerTitle: {
    position: 'absolute',
    left: moderateScale(0),
    right: moderateScale(0),
    textAlign: 'center',
    fontSize: normalizeFont(16),
    color: '#0f172a',
    alignSelf: 'center',
    zIndex: 1,
    fontWeight: '700',
  },

  headerRightSpacer: {
    width: moderateScale(36),
  },

  contentContainer: {
    padding: moderateScale(16),
    paddingBottom: moderateScale(40),
  },

  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(12),
    shadowOffset: { width: 0, height: scale(6) },
    // Android elevation
    elevation: 4,
  },

  accentBar: {
    height: moderateScale(6),
    backgroundColor: '#16a34a', // soft green accent
    width: '100%',
  },

  heroContent: {
    padding: moderateScale(20),
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },

  loadingText: {
    marginLeft: moderateScale(10),
    color: '#64748b',
    fontSize: normalizeFont(13),
  },

  errorBlock: {
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },

  errorTitle: {
    fontSize: normalizeFont(16),
    color: '#dc2626',
    fontWeight: '700',
    marginBottom: moderateScale(6),
  },

  errorMessage: {
    textAlign: 'center',
    color: '#7f1d1d',
    marginBottom: moderateScale(12),
    fontSize: normalizeFont(13),
  },

  retryButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },

  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalizeFont(13),
  },

  title: {
    fontSize: normalizeFont(20),
    color: '#06203a',
    fontWeight: '800',
    marginBottom: moderateScale(8),
    textAlign: 'left',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },

  badge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(10),
  },

  badgeText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: normalizeFont(12),
  },

  smallText: {
    color: '#475569',
    fontSize: normalizeFont(12),
  },

  contentSection: {
    marginTop: moderateScale(6),
  },

  contentText: {
    color: '#334155',
    fontSize: normalizeFont(14),
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(12),
    textAlign: 'left',
  },
});
