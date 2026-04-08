/**
 * Merged in `request.ts` into `messages.library` so remove-resource UI strings
 * always resolve even if locale JSON is cached or tree-shaken incorrectly in dev.
 */
export type LibraryRemoveUiPatch = {
  removeResourceDialogTitle: string;
  removeResourceDialogDescription: string;
  removeResourceDialogButton: string;
  removeResourceDialogUntitled: string;
  actionRemoveResource: string;
  toastResourceRemoved: string;
};

export const libraryRemoveUiByLocale: Record<string, LibraryRemoveUiPatch> = {
  en: {
    removeResourceDialogTitle: "Remove resource",
    removeResourceDialogDescription:
      'Remove "{title}" from this collection? This only removes it from the collection; you can add it again from search.',
    removeResourceDialogButton: "Remove",
    removeResourceDialogUntitled: "Untitled resource",
    actionRemoveResource: "Remove from collection",
    toastResourceRemoved: "Resource removed from collection",
  },
  ko: {
    removeResourceDialogTitle: "리소스 제거",
    removeResourceDialogDescription:
      "“{title}”을(를) 이 컬렉션에서 제거할까요? 컬렉션에서만 제거되며, 검색에서 다시 추가할 수 있습니다.",
    removeResourceDialogButton: "제거",
    removeResourceDialogUntitled: "제목 없는 리소스",
    actionRemoveResource: "컬렉션에서 제거",
    toastResourceRemoved: "컬렉션에서 제거되었습니다",
  },
  th: {
    removeResourceDialogTitle: "นำทรัพยากรออก",
    removeResourceDialogDescription:
      "นำ “{title}” ออกจากคอลเลกชันนี้หรือไม่? จะออกจากคอลเลกชันเท่านั้น คุณสามารถเพิ่มกลับจากการค้นหาได้",
    removeResourceDialogButton: "นำออก",
    removeResourceDialogUntitled: "ทรัพยากรไม่มีชื่อ",
    actionRemoveResource: "นำออกจากคอลเลกชัน",
    toastResourceRemoved: "นำสื่อออกจากคอลเลกชันแล้ว",
  },
  vi: {
    removeResourceDialogTitle: "Gỡ tài nguyên",
    removeResourceDialogDescription:
      'Gỡ "{title}" khỏi bộ sưu tập này? Chỉ gỡ khỏi bộ sưu tập; bạn có thể thêm lại từ tìm kiếm.',
    removeResourceDialogButton: "Gỡ",
    removeResourceDialogUntitled: "Tài nguyên không có tiêu đề",
    actionRemoveResource: "Gỡ khỏi bộ sưu tập",
    toastResourceRemoved: "Đã gỡ tài nguyên khỏi bộ sưu tập",
  },
  zh: {
    removeResourceDialogTitle: "移除资源",
    removeResourceDialogDescription:
      "从该收藏集中移除「{title}」？仅从收藏集中移除，您仍可在搜索中再次添加。",
    removeResourceDialogButton: "移除",
    removeResourceDialogUntitled: "无标题资源",
    actionRemoveResource: "从收藏集移除",
    toastResourceRemoved: "已从收藏集移除资源",
  },
};
