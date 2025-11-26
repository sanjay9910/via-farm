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
const API_ENDPOINT = '/api/admin/manage-app/privacy-policy';

const TermsAndConditions = ({ navigation }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTermsAndConditions();
  }, []);

  const fetchTermsAndConditions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_URL}${API_ENDPOINT}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData && responseData.success && responseData.data && responseData.data.content) {
        const parsedSections = parseApiContent(responseData.data.content);

        if (parsedSections && parsedSections.length) {
          // Use parsed structured sections from API
          setSections(parsedSections);
        } else {
          // If parsing fails, still show API content as a single section (not a static fallback)
          setSections([
            {
              number: '1',
              title: 'Privacy & Policy',
              content: responseData.data.content.trim(),
              points: [],
            },
          ]);
          setError('Loaded content but could not structure into sections; showing raw content from server.');
        }
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching terms:', err);
      setError(err.message || 'Failed to load content from server');
      setSections([]); // no static fallback — remain empty
    } finally {
      setLoading(false);
    }
  };
  const parseApiContent = (content) => {
    if (!content || typeof content !== 'string') return null;
    const text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    const allLines = text.split('\n');

    const sections = [];
    let current = null;

    const headingRegex = /^\s*(\d+)\.\s+(.+?)\s*$/; 
    const bulletRegex = /^\s*[-*+]\s+(.+)$/;
    const numberedPointRegex = /^\s*\d+\.\s+(.+)$/;

    for (let i = 0; i < allLines.length; i++) {
      const rawLine = allLines[i];
      const line = rawLine.replace(/\u2019/g, "'").replace(/\u2018/g, "'").trim();

      if (!line) {
        if (current && current._accumParagraph && current._accumParagraph.length) {
          current._accumParagraph.push(''); 
        }
        continue;
      }

      const hMatch = line.match(headingRegex);
      if (hMatch) {
        if (current) {
          const contentText = finalizeParagraphs(current._accumParagraph);
          current.content = contentText;
          delete current._accumParagraph;
          sections.push(current);
        }
        current = {
          number: hMatch[1],
          title: hMatch[2].trim(),
          content: '',
          points: [],
          _accumParagraph: [],
        };
        continue;
      }
      if (!current) {
        current = {
          number: '1',
          title: 'Privacy & Policy',
          content: '',
          points: [],
          _accumParagraph: [],
        };
      }

      const bulletMatch = line.match(bulletRegex);
      const numPointMatch = line.match(numberedPointRegex);

      if (bulletMatch) {
        if (current._accumParagraph && current._accumParagraph.length) {
          current._accumParagraph.push(''); 
        }
        current.points.push(bulletMatch[1].trim());
      } else if (numPointMatch) {
        if (current._accumParagraph && current._accumParagraph.length) {
          current._accumParagraph.push('');
        }
        current.points.push(numPointMatch[1].trim());
      } else {
        current._accumParagraph.push(line);
      }
    }

    // push last section if present
    if (current) {
      const contentText = finalizeParagraphs(current._accumParagraph);
      current.content = contentText;
      delete current._accumParagraph;
      sections.push(current);
    }

    return sections;
  };
  const finalizeParagraphs = (arr) => {
    if (!arr || !arr.length) return '';
    const paragraphs = [];
    let current = [];
    for (let token of arr) {
      if (token === '') {
        if (current.length) {
          paragraphs.push(current.join(' '));
          current = [];
        }
      } else {
        current.push(token);
      }
    }
    if (current.length) paragraphs.push(current.join(' '));
    return paragraphs.join('\n\n'); 
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ padding: moderateScale(20), alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={{ marginTop: moderateScale(8), color: '#64748b' }}>Loading Privacy & Policy...</Text>
        </View>
      );
    }

    return (
      <>
        {error ? (
          <View style={[styles.footerNote, { marginBottom: moderateScale(12) }]}>
            <Text style={styles.footerText}>{error}</Text>
            <TouchableOpacity onPress={fetchTermsAndConditions}>
              <Text style={{ color: '#1e40af', marginTop: moderateScale(6) }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* If API returned no sections (e.g., empty), show a friendly message */}
        {(!sections || sections.length === 0) ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>No terms available</Text>
            <Text style={styles.errorMessage}>The server returned no content. Please try again later.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTermsAndConditions}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Intro Card */}
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>ViaFarm Privacy & Policy</Text>
              <Text style={styles.introSubtitle}>
                Please read these terms carefully. By using ViaFarm, you agree to all terms and conditions outlined below.
              </Text>
            </View>

            {/* Sections */}
            {sections.map((section, index) => (
              <View key={index} style={styles.sectionCard}>
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionNumberBadge}>
                    <Text style={styles.sectionNumber}>{section.number}</Text>
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>

                {/* Section Content */}
                <View style={styles.sectionContent}>
                  {section.content ? (
                    <Text style={styles.sectionText}>{section.content}</Text>
                  ) : null}

                  {section.points && section.points.length > 0 ? (
                    <View style={styles.pointsList}>
                      {section.points.map((point, idx) => (
                        <View key={idx} style={styles.pointItem}>
                          <View style={styles.bulletPoint} />
                          <Text style={styles.pointText}>{point}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            ))}

            <View style={{ height: moderateScale(40) }} />
          </>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
        >
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>

        <Text numberOfLines={1} style={styles.headerTitle}>
          Privacy & Policy
        </Text>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};
export default TermsAndConditions;

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
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingVertical: moderateScale(6),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    fontSize: normalizeFont(13),
    fontWeight: '700',
    color: '#1e293b',
    alignSelf: 'center',
    zIndex: 1,
  },

  headerRightSpacer: {
    width: moderateScale(36),
  },

  contentContainer: {
    padding: moderateScale(14),
    paddingBottom: moderateScale(40),
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: scale(400),
    paddingHorizontal: moderateScale(20),
  },

  loadingText: {
    marginTop: moderateScale(16),
    fontSize: normalizeFont(11),
    color: '#64748b',
    fontWeight: '500',
  },

  errorText: {
    fontSize: normalizeFont(12),
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: moderateScale(8),
  },

  errorMessage: {
    fontSize: normalizeFont(11),
    color: '#7f1d1d',
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },

  retryButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },

  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: normalizeFont(11),
  },

  introCard: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    padding: moderateScale(18),
    marginBottom: moderateScale(16),
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b35',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  introTitle: {
    fontSize: normalizeFont(11),
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: moderateScale(8),
  },

  introSubtitle: {
    fontSize: normalizeFont(11),
    color: '#64748b',
    lineHeight: moderateScale(20),
    fontWeight: '500',
  },

  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  sectionNumberBadge: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#ff6b35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },

  sectionNumber: {
    fontSize: normalizeFont(12),
    fontWeight: '700',
    color: '#ffffff',
  },

  sectionTitle: {
    flex: 1,
    fontSize: normalizeFont(12),
    fontWeight: '700',
    color: '#1e293b',
  },

  sectionContent: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
  },

  sectionText: {
    fontSize: normalizeFont(13),
    color: '#475569',
    lineHeight: moderateScale(21),
    fontWeight: '500',
    textAlign: 'justify',
  },

  pointsList: {
    marginTop: moderateScale(8),
  },

  pointItem: {
    flexDirection: 'row',
    marginBottom: moderateScale(11),
    alignItems: 'flex-start',
  },

  bulletPoint: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#ff6b35',
    marginRight: moderateScale(10),
    marginTop: moderateScale(7),
    flexShrink: 0,
  },

  pointText: {
    flex: 1,
    fontSize: normalizeFont(11),
    color: '#475569',
    lineHeight: moderateScale(21),
    fontWeight: '500',
    textAlign: 'justify',
  },
});