// src/components/evaluation/research-problem/utils/highlightDifferences.js

/**
 * Highlights differences between two text strings by comparing words
 * 
 * @param {string} original - The original text
 * @param {string} edited - The edited text
 * @returns {Object} Object containing highlighted versions of both texts
 */
export const highlightDifferences = (original, edited) => {
    if (!original || !edited) return { originalHighlighted: original, editedHighlighted: edited };
    
    const originalWords = original.split(/\s+/);
    const editedWords = edited.split(/\s+/);
    
    const originalHighlighted = originalWords.map(word => 
      editedWords.includes(word) ? 
        `<span class="text-green-700">${word}</span>` : 
        `<span class="text-red-700">${word}</span>`
    ).join(' ');
    
    const editedHighlighted = editedWords.map(word => 
      originalWords.includes(word) ? 
        `<span class="text-green-700">${word}</span>` : 
        `<span class="text-blue-700">${word}</span>`
    ).join(' ');
    
    return { originalHighlighted, editedHighlighted };
  };