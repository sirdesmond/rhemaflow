import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, FONTS } from "../constants/theme";

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = [0, 15, 30, 45];
const PERIODS = ["AM", "PM"] as const;

interface ScrollWheelTimePickerProps {
  value: string; // "HH:MM" in 24h format
  onChange: (time: string) => void;
}

/**
 * Convert 24h "HH:MM" to 12h components.
 */
function parse24h(time: string): {
  hour12: number;
  minute: number;
  period: "AM" | "PM";
} {
  const [h, m] = time.split(":").map(Number);
  const hour24 = h || 0;
  const minute = m || 0;
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  // Snap minute to nearest 15
  const snappedMinute =
    MINUTES.reduce((prev, curr) =>
      Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev
    );
  return { hour12, minute: snappedMinute, period };
}

/**
 * Convert 12h components back to 24h "HH:MM".
 */
function to24h(hour12: number, minute: number, period: "AM" | "PM"): string {
  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function WheelColumn({
  data,
  selectedIndex,
  onSelect,
  formatItem,
}: {
  data: readonly (number | string)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (item: number | string) => string;
}) {
  const flatListRef = useRef<FlatList>(null);
  const isUserScroll = useRef(false);
  const lastReportedIndex = useRef(selectedIndex);

  useEffect(() => {
    // Only scroll programmatically if the index actually changed externally
    if (lastReportedIndex.current !== selectedIndex) {
      lastReportedIndex.current = selectedIndex;
      flatListRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      if (clamped !== lastReportedIndex.current) {
        lastReportedIndex.current = clamped;
        Haptics.selectionAsync();
        onSelect(clamped);
      }
      isUserScroll.current = false;
    },
    [data.length, onSelect]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isUserScroll.current = true;
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: number | string; index: number }) => {
      const isSelected = index === selectedIndex;
      return (
        <View style={[wheelStyles.item, { height: ITEM_HEIGHT }]}>
          <Text
            style={[
              wheelStyles.itemText,
              isSelected && wheelStyles.itemTextSelected,
              !isSelected && wheelStyles.itemTextFaded,
            ]}
          >
            {formatItem(item)}
          </Text>
        </View>
      );
    },
    [selectedIndex, formatItem]
  );

  return (
    <View style={{ height: PICKER_HEIGHT, overflow: "hidden" }}>
      <FlatList
        ref={flatListRef}
        data={data as any}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT, // one empty slot above
          paddingBottom: ITEM_HEIGHT, // one empty slot below
        }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={selectedIndex}
      />
      {/* Center highlight band */}
      <View style={wheelStyles.highlight} pointerEvents="none" />
    </View>
  );
}

export function ScrollWheelTimePicker({
  value,
  onChange,
}: ScrollWheelTimePickerProps) {
  const { hour12, minute, period } = parse24h(value);

  const hourIndex = HOURS.indexOf(hour12);
  const minuteIndex = MINUTES.indexOf(minute);
  const periodIndex = PERIODS.indexOf(period);

  const handleHourSelect = useCallback(
    (index: number) => {
      onChange(to24h(HOURS[index], minute, period));
    },
    [minute, period, onChange]
  );

  const handleMinuteSelect = useCallback(
    (index: number) => {
      onChange(to24h(hour12, MINUTES[index], period));
    },
    [hour12, period, onChange]
  );

  const handlePeriodToggle = () => {
    Haptics.selectionAsync();
    const newPeriod = period === "AM" ? "PM" : "AM";
    onChange(to24h(hour12, minute, newPeriod));
  };

  return (
    <View style={styles.container}>
      <WheelColumn
        data={HOURS}
        selectedIndex={hourIndex >= 0 ? hourIndex : 0}
        onSelect={handleHourSelect}
        formatItem={(item) => String(item)}
      />
      <Text style={styles.colon}>:</Text>
      <WheelColumn
        data={MINUTES}
        selectedIndex={minuteIndex >= 0 ? minuteIndex : 0}
        onSelect={handleMinuteSelect}
        formatItem={(item) => String(item).padStart(2, "0")}
      />
      <Pressable onPress={handlePeriodToggle} style={styles.periodButton}>
        <Text style={styles.periodText}>{period}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  colon: {
    fontFamily: FONTS.bodyBold,
    fontSize: 28,
    color: COLORS.divineGold,
    marginBottom: 2,
  },
  periodButton: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  periodText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: COLORS.divineGold,
  },
});

const wheelStyles = StyleSheet.create({
  item: {
    justifyContent: "center",
    alignItems: "center",
    width: 64,
  },
  itemText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 28,
    color: COLORS.slate700,
  },
  itemTextSelected: {
    color: COLORS.divineGold,
    fontSize: 32,
  },
  itemTextFaded: {
    opacity: 0.4,
  },
  highlight: {
    position: "absolute",
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.divineGold + "40",
    backgroundColor: COLORS.divineGold + "08",
  },
});
