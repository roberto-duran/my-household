import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  showPercentage?: boolean;
}

export default function ProgressBar({ 
  progress, 
  color = '#2563EB', 
  backgroundColor = '#E5E7EB',
  height = 8,
  showPercentage = false 
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={styles.container}>
      <View style={[styles.background, { backgroundColor, height }]}>
        <View 
          style={[
            styles.fill, 
            { 
              backgroundColor: color, 
              width: `${clampedProgress}%`,
              height 
            }
          ]} 
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  background: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 32,
    textAlign: 'right',
  },
});