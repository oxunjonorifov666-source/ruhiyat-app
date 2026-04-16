import { createNavigationContainerRef, CommonActions } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

/** Push `data` (Expo string maydalari) bo‘yicha ekranga o‘tish */
export function navigateFromNotification(data: Record<string, unknown>): void {
  if (!navigationRef.isReady()) return;
  const type = typeof data.type === "string" ? data.type : "";
  if (type === "chat" && data.chatId != null) {
    const chatId = Number(data.chatId);
    if (Number.isFinite(chatId)) {
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "ChatRoom",
          params: { chatId },
        }),
      );
    }
    return;
  }
  if (type === "article" && data.articleId != null) {
    const id = Number(data.articleId);
    if (Number.isFinite(id)) {
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "ArticleDetail",
          params: { id },
        }),
      );
    }
    return;
  }
  if (type === "test" && data.testId != null) {
    const testId = Number(data.testId);
    if (Number.isFinite(testId)) {
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "TestPass",
          params: { testId, title: typeof data.title === "string" ? data.title : undefined },
        }),
      );
    }
    return;
  }
  if (type === "videos" || type === "videokutubxona") {
    navigationRef.dispatch(CommonActions.navigate({ name: "VideoLessons" }));
    return;
  }
  if (type === "trainings") {
    navigationRef.dispatch(CommonActions.navigate({ name: "Trainings" }));
    return;
  }
}
