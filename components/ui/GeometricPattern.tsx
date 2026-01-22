/**
 * GeometricPattern Component
 * Decorative geometric elements inspired by the LETTERING DESIGN reference
 * Use as subtle background decorations, corner accents, or section dividers
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Rect, Line, G, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GeometricPatternProps {
  variant?: 'snowflake' | 'dots' | 'cross' | 'grid' | 'star';
  size?: number;
  color?: string;
  opacity?: number;
  style?: any;
}

// Snowflake/Star pattern (like the main decorative elements)
const SnowflakePattern: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill={color}>
      {/* Center cross */}
      <Rect x="46" y="20" width="8" height="60" />
      <Rect x="20" y="46" width="60" height="8" />
      {/* Diagonal lines */}
      <Line x1="25" y1="25" x2="75" y2="75" stroke={color} strokeWidth="6" />
      <Line x1="75" y1="25" x2="25" y2="75" stroke={color} strokeWidth="6" />
      {/* Corner dots */}
      <Circle cx="20" cy="20" r="4" />
      <Circle cx="80" cy="20" r="4" />
      <Circle cx="20" cy="80" r="4" />
      <Circle cx="80" cy="80" r="4" />
      {/* Edge dots */}
      <Circle cx="50" cy="10" r="3" />
      <Circle cx="50" cy="90" r="3" />
      <Circle cx="10" cy="50" r="3" />
      <Circle cx="90" cy="50" r="3" />
    </G>
  </Svg>
);

// Dot cluster pattern
const DotsPattern: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill={color}>
      {/* Diamond arrangement of dots */}
      <Circle cx="50" cy="20" r="4" />
      <Circle cx="35" cy="35" r="3" />
      <Circle cx="65" cy="35" r="3" />
      <Circle cx="20" cy="50" r="4" />
      <Circle cx="50" cy="50" r="5" />
      <Circle cx="80" cy="50" r="4" />
      <Circle cx="35" cy="65" r="3" />
      <Circle cx="65" cy="65" r="3" />
      <Circle cx="50" cy="80" r="4" />
      {/* Smaller accent dots */}
      <Circle cx="30" cy="25" r="2" />
      <Circle cx="70" cy="25" r="2" />
      <Circle cx="25" cy="75" r="2" />
      <Circle cx="75" cy="75" r="2" />
    </G>
  </Svg>
);

// Cross/Plus pattern
const CrossPattern: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G fill={color}>
      {/* Main cross */}
      <Rect x="42" y="10" width="16" height="80" rx="2" />
      <Rect x="10" y="42" width="80" height="16" rx="2" />
      {/* Corner squares */}
      <Rect x="15" y="15" width="12" height="12" />
      <Rect x="73" y="15" width="12" height="12" />
      <Rect x="15" y="73" width="12" height="12" />
      <Rect x="73" y="73" width="12" height="12" />
    </G>
  </Svg>
);

// Grid lines pattern (Golden Suisse style)
const GridPattern: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G stroke={color} strokeWidth="0.5" fill="none">
      {/* Vertical lines */}
      <Line x1="25" y1="0" x2="25" y2="100" />
      <Line x1="50" y1="0" x2="50" y2="100" />
      <Line x1="75" y1="0" x2="75" y2="100" />
      {/* Horizontal lines */}
      <Line x1="0" y1="25" x2="100" y2="25" />
      <Line x1="0" y1="50" x2="100" y2="50" />
      <Line x1="0" y1="75" x2="100" y2="75" />
    </G>
  </Svg>
);

// Eight-pointed star (Golden Suisse main element)
const StarPattern: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G stroke={color} strokeWidth="2" fill="none">
      {/* Main asterisk lines */}
      <Line x1="50" y1="10" x2="50" y2="90" />
      <Line x1="10" y1="50" x2="90" y2="50" />
      <Line x1="22" y1="22" x2="78" y2="78" />
      <Line x1="78" y1="22" x2="22" y2="78" />
      {/* Center circle */}
      <Circle cx="50" cy="50" r="4" fill={color} />
    </G>
  </Svg>
);

export const GeometricPattern: React.FC<GeometricPatternProps> = ({
  variant = 'snowflake',
  size = 80,
  color = 'rgba(255, 255, 255, 0.08)',
  opacity = 1,
  style,
}) => {
  const Pattern = {
    snowflake: SnowflakePattern,
    dots: DotsPattern,
    cross: CrossPattern,
    grid: GridPattern,
    star: StarPattern,
  }[variant];

  return (
    <View style={[{ opacity }, style]}>
      <Pattern size={size} color={color} />
    </View>
  );
};

// Full-screen grid overlay (Golden Suisse style)
export const GridOverlay: React.FC<{
  color?: string;
  lineWidth?: number;
  spacing?: number;
}> = ({
  color = 'rgba(255, 255, 255, 0.04)',
  lineWidth = 1,
  spacing = 80,
}) => {
  const numVerticalLines = Math.ceil(SCREEN_WIDTH / spacing);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Vertical lines */}
      {Array.from({ length: numVerticalLines }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={[
            styles.gridLine,
            {
              left: i * spacing,
              width: lineWidth,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Corner decoration component
export const CornerDecoration: React.FC<{
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  size?: number;
  color?: string;
}> = ({
  position,
  size = 60,
  color = 'rgba(255, 255, 255, 0.06)',
}) => {
  const positionStyles = {
    topLeft: { top: 20, left: 20 },
    topRight: { top: 20, right: 20 },
    bottomLeft: { bottom: 20, left: 20 },
    bottomRight: { bottom: 20, right: 20 },
  };

  return (
    <View style={[styles.cornerDecoration, positionStyles[position]]}>
      <GeometricPattern variant="dots" size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  cornerDecoration: {
    position: 'absolute',
    zIndex: 0,
  },
});

export default GeometricPattern;
