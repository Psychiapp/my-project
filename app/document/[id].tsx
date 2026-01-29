import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ArrowLeftIcon, DownloadIcon } from '@/components/icons';
import * as Sharing from 'expo-sharing';

// Document metadata
const documentInfo: Record<string, { title: string; asset: any }> = {
  handbook: {
    title: 'Supporter Handbook',
    asset: require('@/assets/documents/Supporter Handbook.pdf'),
  },
  diversion: {
    title: 'Diversion Advice',
    asset: require('@/assets/documents/Supporter Diversion Advice.pdf'),
  },
  conduct: {
    title: 'Code of Conduct',
    asset: require('@/assets/documents/Supporter Code of Conduct.pdf'),
  },
  'client-disclaimer': {
    title: 'Client Disclaimer',
    asset: require('@/assets/documents/Client Disclaimer.pdf'),
  },
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DocumentViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const document = id ? documentInfo[id] : null;

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    if (!document) {
      setError('Document not found');
      setIsLoading(false);
      return;
    }

    try {
      // Load the asset
      const asset = Asset.fromModule(document.asset);
      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error('Failed to load document');
      }

      setLocalUri(asset.localUri);

      // Read file as base64 for WebView
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: 'base64',
      });

      setPdfBase64(base64);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load document');
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!localUri) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: document?.title || 'Document',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (err) {
      console.error('Error sharing document:', err);
    }
  };

  // HTML template with PDF.js for rendering PDF
  const htmlContent = pdfBase64
    ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background-color: #F5F5F0;
          overflow-x: hidden;
        }
        #pdf-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
          padding-bottom: 50px;
        }
        canvas {
          margin-bottom: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          background: white;
          max-width: 100%;
          height: auto !important;
        }
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          color: #666;
        }
        .error {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          color: #ef4444;
          text-align: center;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <div id="pdf-container">
        <div class="loading" id="loading">Loading document...</div>
      </div>
      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const pdfData = atob('${pdfBase64}');
        const pdfArray = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
          pdfArray[i] = pdfData.charCodeAt(i);
        }

        const container = document.getElementById('pdf-container');
        const loadingEl = document.getElementById('loading');

        pdfjsLib.getDocument({ data: pdfArray }).promise.then(function(pdf) {
          loadingEl.style.display = 'none';

          const scale = ${Platform.OS === 'ios' ? 2.0 : 1.5};

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            pdf.getPage(pageNum).then(function(page) {
              const viewport = page.getViewport({ scale: scale });

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              canvas.style.width = '100%';

              container.appendChild(canvas);

              page.render({
                canvasContext: context,
                viewport: viewport
              });
            });
          }
        }).catch(function(error) {
          loadingEl.innerHTML = '<div class="error">Failed to load PDF: ' + error.message + '</div>';
        });
      </script>
    </body>
    </html>
  `
    : '';

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeftIcon size={20} color={PsychiColors.azure} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Not Found</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>The requested document could not be found.</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeftIcon size={20} color={PsychiColors.azure} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {document.title}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <DownloadIcon size={20} color={PsychiColors.azure} />
        </TouchableOpacity>
      </View>

      {/* PDF Viewer */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          style={styles.webview}
          source={{ html: htmlContent }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          bounces={true}
          showsVerticalScrollIndicator={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={PsychiColors.azure} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...Shadows.soft,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.midnight,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  headerRight: {
    width: 40,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PsychiColors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: PsychiColors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: PsychiColors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  goBackButton: {
    backgroundColor: PsychiColors.azure,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  goBackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
