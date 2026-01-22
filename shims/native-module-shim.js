/**
 * Shim for native modules that aren't available in Expo Go
 * This allows the app to run in Expo Go (with limited functionality)
 * while still supporting full native features in development builds
 */

// Export empty implementations
module.exports = {
  // RTCPeerConnection shims
  RTCPeerConnection: class RTCPeerConnection {
    constructor() {
      console.warn('RTCPeerConnection not available in Expo Go');
    }
  },
  RTCSessionDescription: class RTCSessionDescription {},
  RTCIceCandidate: class RTCIceCandidate {},
  MediaStream: class MediaStream {},
  MediaStreamTrack: class MediaStreamTrack {},
  mediaDevices: {
    getUserMedia: () => Promise.reject(new Error('Not available in Expo Go')),
    enumerateDevices: () => Promise.resolve([]),
  },
  // Default export for ES modules
  default: {},
};
