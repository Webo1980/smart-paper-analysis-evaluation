// src\components\evaluation\template\utils\stringUtils.js
export const calculateStringSimilarity = (str1, str2) => {
    if (!str1 && !str2) return 1;
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    const set1 = new Set(s1.split(/\s+/));
    const set2 = new Set(s2.split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  };