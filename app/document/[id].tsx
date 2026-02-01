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

// Import PDF assets
const handbookPdf = require('@/assets/documents/Supporter Handbook.pdf');
const diversionPdf = require('@/assets/documents/Supporter Diversion Advice.pdf');
const conductPdf = require('@/assets/documents/Supporter Code of Conduct.pdf');
const clientDisclaimerPdf = require('@/assets/documents/Client Disclaimer.pdf');

// Document metadata
const documentInfo: Record<string, { title: string; asset: number }> = {
  handbook: {
    title: 'Supporter Handbook',
    asset: handbookPdf,
  },
  diversion: {
    title: 'Diversion Advice',
    asset: diversionPdf,
  },
  conduct: {
    title: 'Code of Conduct',
    asset: conductPdf,
  },
  'client-disclaimer': {
    title: 'Client Disclaimer',
    asset: clientDisclaimerPdf,
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
      console.log('Loading document:', id, 'asset:', document.asset);

      // Load the asset
      const asset = Asset.fromModule(document.asset);
      console.log('Asset created:', asset.name, asset.type);

      await asset.downloadAsync();
      console.log('Asset downloaded, localUri:', asset.localUri);

      if (!asset.localUri) {
        throw new Error('Failed to get local URI for document');
      }

      setLocalUri(asset.localUri);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(asset.localUri);
      console.log('File info:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('Document file does not exist at path');
      }

      // Read file as base64 for WebView
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: 'base64',
      });

      console.log('Base64 length:', base64.length);

      if (!base64 || base64.length === 0) {
        throw new Error('Failed to read document content');
      }

      setPdfBase64(base64);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(`Failed to load document: ${err.message || 'Unknown error'}`);
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
  // Using jsdelivr CDN which is more reliable
  const htmlContent = pdfBase64
    ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background-color: #F5F5F0; overflow-x: hidden; }
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
        .loading, .error {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          text-align: center;
          padding: 20px;
        }
        .loading { color: #666; }
        .error { color: #ef4444; flex-direction: column; }
        .retry-btn {
          margin-top: 20px;
          padding: 10px 20px;
          background: #4A90E2;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div id="pdf-container">
        <div class="loading" id="loading">Loading document...</div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
      <script>
        (function() {
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

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

              // Render pages sequentially to maintain order
              let currentPage = 1;
              function renderPage(pageNum) {
                if (pageNum > pdf.numPages) return;
                pdf.getPage(pageNum).then(function(page) {
                  const viewport = page.getViewport({ scale: scale });
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  canvas.style.width = '100%';
                  canvas.dataset.pageNum = pageNum;
                  container.appendChild(canvas);

                  page.render({ canvasContext: context, viewport: viewport }).promise.then(function() {
                    renderPage(pageNum + 1);
                  });
                });
              }
              renderPage(1);
            }).catch(function(error) {
              loadingEl.innerHTML = '<div class="error">Failed to load PDF<br/><small>' + error.message + '</small></div>';
            });
          } catch (e) {
            document.getElementById('loading').innerHTML = '<div class="error">Error: ' + e.message + '</div>';
          }
        })();
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
          {localUri && (
            <TouchableOpacity style={styles.openExternalButton} onPress={handleShare}>
              <Text style={styles.openExternalButtonText}>Open in External Viewer</Text>
            </TouchableOpacity>
          )}
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
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setError(`WebView error: ${nativeEvent.description}`);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error:', nativeEvent);
          }}
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
  openExternalButton: {
    backgroundColor: PsychiColors.success,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  openExternalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
