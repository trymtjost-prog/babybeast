import { View } from 'react-native';

/** A soft, simple curled-up baby, drawn with plain shapes so it stays cute at any size. */
export function BabyFigure({ size }: { size: number }) {
  const skin = '#F2B8A8';
  const shade = '#E29A88';
  return (
    <View style={{ width: size, height: size }} accessibilityLabel="Baby" accessible>
      <View
        style={{
          position: 'absolute',
          left: size * 0.12,
          top: size * 0.32,
          width: size * 0.58,
          height: size * 0.62,
          borderRadius: size * 0.3,
          backgroundColor: skin,
          transform: [{ rotate: '-25deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.38,
          top: size * 0.04,
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: skin,
        }}
      />
      {/* closed eye */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.62,
          top: size * 0.26,
          width: size * 0.1,
          height: size * 0.05,
          borderBottomWidth: 2,
          borderColor: '#8A5548',
          borderRadius: size * 0.05,
        }}
      />
      {/* arm */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.46,
          top: size * 0.5,
          width: size * 0.26,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: shade,
          transform: [{ rotate: '-35deg' }],
        }}
      />
      {/* leg */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.3,
          top: size * 0.78,
          width: size * 0.36,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: shade,
        }}
      />
    </View>
  );
}
