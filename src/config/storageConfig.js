// ALAGA Image Storage Configuration (ImgBB)
// Free image hosting without credit cards or billing plans
// 1. Get your free API key at: https://api.imgbb.com/
// 2. Paste your 32-character key below:

export const IMGBB_API_KEY = "b0ed7e4f7c4b45b65885e3a75a9289cb";

export const isMockStorage = () => {
  return !IMGBB_API_KEY || IMGBB_API_KEY === "b0ed7e4f7c4b45b65885e3a75a9289cb" || IMGBB_API_KEY.length < 15;
};
