const STORAGE_KEY = 'tgf_application_draft';

export const localStorageUtils = {
  saveDraft: (data: Record<string, string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  },

  loadDraft: (): Record<string, string> | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  },

  clearDraft: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  },
};
