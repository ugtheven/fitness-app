import { type ReactNode, useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	type SharedValue,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { palette } from "../lib/palette";

export type RenderItemInfo<T> = {
	item: T;
	index: number;
	isDragging: boolean;
};

type SortableListProps<T> = {
	data: T[];
	keyExtractor: (item: T) => string;
	renderItem: (info: RenderItemInfo<T>) => ReactNode;
	onReorder: (newData: T[]) => void;
	estimatedItemHeight: number;
	itemGap?: number;
	contentContainerStyle?: object;
};

type SortableItemProps = {
	index: number;
	count: number;
	activeIndex: SharedValue<number>;
	dragY: SharedValue<number>;
	step: number;
	itemGap: number;
	onDragStart: () => void;
	onDragEnd: (from: number, to: number) => void;
	children: ReactNode;
};

function SortableItem({
	index,
	count,
	activeIndex,
	dragY,
	step,
	itemGap,
	onDragStart,
	onDragEnd,
	children,
}: SortableItemProps) {
	const gesture = Gesture.Pan()
		.activateAfterLongPress(150)
		.onStart(() => {
			activeIndex.value = index;
			dragY.value = 0;
			runOnJS(onDragStart)();
		})
		.onUpdate((e) => {
			dragY.value = e.translationY;
		})
		.onEnd((e) => {
			const target = Math.max(0, Math.min(count - 1, Math.round(index + e.translationY / step)));
			runOnJS(onDragEnd)(index, target);
			activeIndex.value = -1;
			dragY.value = 0;
		})
		.onFinalize(() => {
			activeIndex.value = -1;
			dragY.value = 0;
		});

	const animatedStyle = useAnimatedStyle(() => {
		const from = activeIndex.value;

		if (from === -1) {
			return {
				transform: [{ translateY: withTiming(0, { duration: 200 }) }, { scale: withTiming(1, { duration: 200 }) }],
				zIndex: 0,
				shadowOpacity: withTiming(0, { duration: 200 }),
				elevation: withTiming(0, { duration: 200 }),
			};
		}

		if (from === index) {
			return {
				transform: [{ translateY: dragY.value }, { scale: withSpring(1.03, { damping: 15, stiffness: 300 }) }],
				zIndex: 100,
				shadowColor: palette.shadow,
				shadowOpacity: withSpring(0.2, { damping: 15, stiffness: 300 }),
				shadowRadius: 12,
				elevation: withSpring(12, { damping: 15, stiffness: 300 }),
			};
		}

		const target = Math.max(0, Math.min(count - 1, Math.round(from + dragY.value / step)));
		let shift = 0;
		if (from < target && index > from && index <= target) shift = -step;
		else if (from > target && index >= target && index < from) shift = step;

		return {
			transform: [{ translateY: withSpring(shift, { damping: 20, stiffness: 250 }) }, { scale: 1 }],
			zIndex: 0,
			shadowOpacity: 0,
			elevation: 0,
		};
	});

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View style={[animatedStyle, { marginBottom: itemGap }]}>{children}</Animated.View>
		</GestureDetector>
	);
}

export function SortableList<T>({
	data,
	keyExtractor,
	renderItem,
	onReorder,
	estimatedItemHeight,
	itemGap = 0,
	contentContainerStyle,
}: SortableListProps<T>) {
	const activeIndex = useSharedValue(-1);
	const dragY = useSharedValue(0);
	const [draggingIndex, setDraggingIndex] = useState(-1);

	const step = estimatedItemHeight + itemGap;

	const handleDragEnd = useCallback(
		(from: number, to: number) => {
			setDraggingIndex(-1);
			if (from === to) return;
			const newData = [...data];
			const [item] = newData.splice(from, 1);
			newData.splice(to, 0, item);
			onReorder(newData);
		},
		[data, onReorder],
	);

	return (
		<ScrollView
			scrollEnabled={draggingIndex === -1}
			contentContainerStyle={contentContainerStyle}
			showsVerticalScrollIndicator={false}
		>
			{data.map((item, index) => (
				<SortableItem
					key={keyExtractor(item)}
					index={index}
					count={data.length}
					activeIndex={activeIndex}
					dragY={dragY}
					step={step}
					itemGap={index < data.length - 1 ? itemGap : 0}
					onDragStart={() => setDraggingIndex(index)}
					onDragEnd={handleDragEnd}
				>
					{renderItem({ item, index, isDragging: draggingIndex === index })}
				</SortableItem>
			))}
		</ScrollView>
	);
}
