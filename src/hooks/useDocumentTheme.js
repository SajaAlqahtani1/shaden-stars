import { useEffect } from "react";

const DEFAULT_THEME_COLOR = "#f5f0ff";
const BOY_THEME_COLOR = "#fff9e6";

// Applies the boy theme to the whole document (not just the page wrapper), so the
// background behind iPad bounce scrolling and the browser bar color match the child.
export function useDocumentTheme(isBoy) {
  useEffect(() => {
    const root = document.documentElement;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    if (isBoy) {
      root.dataset.theme = "boy";
    } else {
      delete root.dataset.theme;
    }
    themeColorMeta?.setAttribute("content", isBoy ? BOY_THEME_COLOR : DEFAULT_THEME_COLOR);

    return () => {
      delete root.dataset.theme;
      themeColorMeta?.setAttribute("content", DEFAULT_THEME_COLOR);
    };
  }, [isBoy]);
}
