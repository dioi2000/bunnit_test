import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import dayjs from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { runOnJS } from 'react-native-worklets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 20;
const DAY_SIZE = (SCREEN_WIDTH - CONTAINER_PADDING * 2) / 7;
const ANIMATION_DURATION = 2000;
const CALENDAR_HEIGHT = { month: DAY_SIZE * 6, week: DAY_SIZE };

type DayData = {
  date: dayjs.Dayjs;
  type: 'curr' | 'adj';
};

type MonthData = {
  id: string;
  base: dayjs.Dayjs;
  weeks: Array<Array<DayData>>;
};
type WeekData = {
  id: string;
  base: dayjs.Dayjs;
  days: Array<DayData>;
};

// TODO: 필요시 전/다음 이동 기능을 FlatList로 스크롤 하는 방식이 아닌 gesture 이벤트로 핸들링
// 현재는 자연스러운 스크롤 처리를 위해 FlatList의 스크롤 기능을 그대로 두고있는데,
// 현재 랜더링된 범위 밖으로 scroll 할수 없고 onMomentumScrollEnd이벤트로 처리하고 있어
// 이벤트가 제대로 발생 안하면 스크롤이 일시적으로 막힐 수 있는 단점이 있다
// gesture로 처리시, 좌우 1개만 미리 만들어 두거나 혹은 필요한 추가 화면을 1개만 랜더링해서 이동시키면 되고
// 모든 작동이 관리되어 crollend를 체크할 필요도 없고 로직도 훨씬 깔끔해진다
// 다만 조작성이 아쉬울 수 있음
// ++ onMomentumScrollEnd가 Android에서는 작동하지 않아서 수정 필요
const MAX_OTHER = 3;
export default function Calendar() {
  const [currentRow, setCurrentRow] = useState<number>(-1);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [monthBase, setMonthBase] = useState<dayjs.Dayjs>(
    dayjs().startOf('month'),
  );
  const [weekBase, setWeekBase] = useState<dayjs.Dayjs>(
    dayjs().startOf('month'),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [monthPages, setMonthPages] = useState<MonthData[]>([]);
  const monthRef = useRef<FlatList<MonthData>>(null);

  const [weekPages, setWeekPages] = useState<WeekData[]>([]);
  const weekRef = useRef<FlatList<WeekData>>(null);

  const calendarHeight = useSharedValue(CALENDAR_HEIGHT.month);
  const calendarOffsetY = useSharedValue(0);
  const animatedOpacity = useSharedValue(1);

  const animatedContainer = useAnimatedStyle(() => ({
    height: calendarHeight.value,
  }));
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: calendarOffsetY.value }],
  }));
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
  }));

  // TODO: 현재 방식은 pages 변경으로 인한 flatlist UI와 scrollindex 변경 사이에 delay 발생시 UI 튐이 발생하는것을 잡아야함
  // 상단에 임시 화면을 잠깐 비췄다가 감추는 등 여러 방법이 있지만 일단은 해결하지 않고 둠
  useEffect(() => {
    const pages = [];
    for (let i = -MAX_OTHER; i <= MAX_OTHER; i++) {
      pages.push(buildMonth(monthBase.add(i, 'month')));
    }
    setMonthPages(pages);
    setTimeout(
      () =>
        monthRef.current?.scrollToIndex({ index: MAX_OTHER, animated: false }),
      0,
    );
  }, [monthBase]);

  useEffect(() => {
    const pages = [];
    for (let i = -MAX_OTHER; i <= MAX_OTHER; i++) {
      pages.push(buildWeek(weekBase.add(i, 'week')));
    }
    setWeekPages(pages);
    setTimeout(
      () =>
        weekRef.current?.scrollToIndex({ index: MAX_OTHER, animated: false }),
      0,
    );
  }, [weekBase]);

  const goPrev = useCallback(() => {
    const ref = mode === 'month' ? monthRef : weekRef;
    ref.current?.scrollToIndex({ index: MAX_OTHER - 1, animated: false });
  }, [mode]);

  const goNext = useCallback(() => {
    const ref = mode === 'month' ? monthRef : weekRef;
    ref.current?.scrollToIndex({ index: MAX_OTHER + 1, animated: false });
  }, [mode]);

  const onMonthScrollEnd = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setMonthBase(prev => prev.add(page - MAX_OTHER, 'month'));
  };
  const onWeekScrollEnd = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const base = weekPages[page].base;
    setWeekBase(base);
    if (!base.isSame(monthBase, 'month')) setMonthBase(base.startOf('month'));
  };

  const changeMode = useCallback(
    (nextMode: 'month' | 'week') => {
      if (isMoving || nextMode === mode) return;
      setIsMoving(true);
      const weeks = monthPages[MAX_OTHER].weeks;
      const currentWeek = nextMode === 'month' ? weekBase : dayjs(selectedDate);

      const isSelected = (day: any) => day.date.isSame(currentWeek);
      let weekIndex = weeks.findIndex(week => week.some(isSelected));
      if (weekIndex < 0) weekIndex = 0;
      setCurrentRow(weekIndex);

      calendarHeight.value = withTiming(CALENDAR_HEIGHT[nextMode], {
        duration: ANIMATION_DURATION,
      });
      animatedOpacity.value = withTiming(nextMode === 'month' ? 1 : 0, {
        duration: ANIMATION_DURATION,
      });

      if (nextMode === 'week') {
        calendarOffsetY.value = withTiming(-weekIndex * DAY_SIZE, {
          duration: ANIMATION_DURATION,
        });
        setTimeout(() => {
          const selectedDay = weeks[weekIndex].find(isSelected);
          const newWeek = selectedDay ? selectedDay.date : monthBase;
          setWeekBase(newWeek);
          setTimeout(() => {
            setMode(nextMode);
          }, 0);
        }, ANIMATION_DURATION);
      } else {
        setMode(nextMode);
        calendarOffsetY.value = -weekIndex * DAY_SIZE;
        calendarOffsetY.value = withTiming(0, {
          duration: ANIMATION_DURATION,
        });
      }
      setIsMoving(false);
    },
    [isMoving, mode, monthPages, weekBase, selectedDate, monthBase],
  );

  const pan = Gesture.Pan().onEnd(e => {
    const absX = Math.abs(e.translationX),
      absY = Math.abs(e.translationY);
    if (absY > absX && absY > 40) {
      const nextMode = e.translationY < 0 ? 'week' : 'month';
      runOnJS(changeMode)(nextMode);
    } else if (absX > 40) {
      runOnJS(e.translationX > 0 ? goPrev : goNext)();
    }
  });

  const onSelect = useCallback((d: dayjs.Dayjs) => {
    setSelectedDate(d.format('YYYY-MM-DD'));
  }, []);

  const renderMonth = ({ item }: ListRenderItemInfo<MonthData>) => (
    <Animated.View
      key={JSON.stringify(item)}
      style={[styles.page, animatedContainer]}
    >
      <Animated.View key={JSON.stringify(item) + '1'} style={slideStyle}>
        {item.weeks.map((week, i) => (
          <Animated.View
            key={i}
            style={[styles.weekRow, currentRow === i ? undefined : fadeStyle]}
          >
            {week.map((day, j) => (
              <DayCell
                key={j}
                day={day}
                index={j}
                selectedDate={selectedDate}
                onSelect={onSelect}
              />
            ))}
          </Animated.View>
        ))}
      </Animated.View>
    </Animated.View>
  );
  const renderWeek = ({ item }: ListRenderItemInfo<WeekData>) => (
    <View style={[styles.page, { height: DAY_SIZE }]}>
      <View style={styles.weekRow}>
        {item.days.map((day, i) => (
          <DayCell
            key={i}
            day={day}
            index={i}
            selectedDate={selectedDate}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={goPrev} style={styles.navButton}>
          <Ionicons name="chevron-back-outline" size={26} color="#468DFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{monthBase.format('YYYY년 MM월')}</Text>
        <TouchableOpacity onPress={goNext} style={styles.navButton}>
          <Ionicons name="chevron-forward-outline" size={26} color="#468DFF" />
        </TouchableOpacity>
      </View>

      <DayRow />

      <GestureDetector gesture={pan}>
        {mode === 'month' ? (
          <FlatList
            ref={monthRef}
            scrollEnabled={!isMoving}
            data={monthPages}
            keyExtractor={i => i.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={renderMonth}
            onMomentumScrollEnd={onMonthScrollEnd}
            getItemLayout={(_, idx) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * idx,
              index: idx,
            })}
          />
        ) : (
          <FlatList
            ref={weekRef}
            scrollEnabled={!isMoving}
            data={weekPages}
            keyExtractor={i => i.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={renderWeek}
            onMomentumScrollEnd={onWeekScrollEnd}
            getItemLayout={(_, idx) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * idx,
              index: idx,
            })}
          />
        )}
      </GestureDetector>
    </SafeAreaView>
  );
}

const DayRow = () => {
  return (
    <View style={styles.weekDays}>
      {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
        <View key={i} style={styles.cell}>
          <Text style={styles.dayText}>{day}</Text>
        </View>
      ))}
    </View>
  );
};

type DayCellProps = {
  day: DayData;
  index: number;
  selectedDate: string | null;
  onSelect: (date: dayjs.Dayjs) => void;
};

const DayCell: React.FC<DayCellProps> = ({
  day,
  index,
  selectedDate,
  onSelect,
}) => {
  const selected = day.date.format('YYYY-MM-DD') === selectedDate;

  return (
    <TouchableOpacity
      key={index}
      style={styles.cell}
      onPress={() => onSelect(day.date)}
    >
      <View style={[selected && styles.selCircle, styles.circle]}>
        <Text
          style={[
            styles.cellText,
            day.type === 'adj' && styles.adjText,
            selected && styles.selText,
          ]}
        >
          {day.date.date()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const buildMonth = (base: dayjs.Dayjs): MonthData => {
  const weeksArr: MonthData['weeks'] = [];
  const baseDay = base.day();
  const daysInMonth = base.daysInMonth();
  const prev = base.subtract(1, 'month');
  const arr: any[] = [];

  // 저번달 날짜를 채운다
  for (let i = baseDay - 1; i >= 0; i--) {
    arr.push({ date: prev.date(prev.daysInMonth() - i), type: 'adj' });
  }

  // 이번달 날짜를 채운다
  for (let i = 1; i <= daysInMonth; i++) {
    arr.push({ date: base.date(i), type: 'curr' });
  }

  // 다음달 날짜를 채운다
  const next = base.add(1, 'month');
  let addDay = 1;
  while (arr.length < 42) {
    arr.push({ date: next.date(addDay++), type: 'adj' });
  }
  for (let i = 0; i < 42; i += 7) {
    weeksArr.push(arr.slice(i, i + 7));
  }
  return { id: base.format('YYYY-MM'), base, weeks: weeksArr };
};

const buildWeek = (base: dayjs.Dayjs): WeekData => {
  const start = base.startOf('week');
  const days: WeekData['days'] = [];
  for (let i = 0; i < 7; i++) {
    const day = start.add(i, 'day');
    days.push({
      date: day,
      type: 'curr',
    });
  }
  return { id: base.format('YYYY-MM-DD'), base, days };
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  navButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '600', color: '#222' },
  weekDays: { flexDirection: 'row', paddingHorizontal: CONTAINER_PADDING },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CONTAINER_PADDING,
    overflow: 'hidden',
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    color: '#BBB',
    fontSize: 14,
    fontWeight: '600',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: { fontSize: 16, color: '#222' },
  adjText: { color: '#BBB' },
  selCircle: { backgroundColor: '#468DFF' },
  selText: { color: '#fff', fontWeight: '700' },
});
