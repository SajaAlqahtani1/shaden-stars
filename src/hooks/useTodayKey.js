import { useEffect, useState } from "react";
import { getLocalDateKey } from "../utils/date.js";

// Returns today's date key and updates it when a new day starts (at 3:00 AM),
// so a page left open overnight moves to the new day by itself.
export function useTodayKey() {
  const [todayKey, setTodayKey] = useState(getLocalDateKey());

  useEffect(() => {
    const intervalId = setInterval(() => setTodayKey(getLocalDateKey()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  return todayKey;
}
