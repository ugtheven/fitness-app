import { useEffect, useRef, useState } from "react";

export function useSessionTimer(startedAt: string | null | undefined, status?: string): string {
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!startedAt || status === "completed") return;

		const startMs = new Date(startedAt).getTime();
		setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));

		intervalRef.current = setInterval(() => {
			setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
		}, 1000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [startedAt, status]);

	const hours = Math.floor(elapsedSeconds / 3600);
	const minutes = Math.floor((elapsedSeconds % 3600) / 60);
	const seconds = elapsedSeconds % 60;

	return hours > 0
		? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
		: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
