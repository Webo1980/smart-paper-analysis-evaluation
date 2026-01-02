// src/components/evaluation/metadata/constants/metadataFields.js
export const FIELD_MAPPINGS = {
  title: { orkgKey: 'title', evalKey: 'title' },
  authors: { orkgKey: 'authors', evalKey: 'authors' },
  doi: { orkgKey: 'doi', evalKey: 'doi' },
  publication_year: { orkgKey: 'publication_year', evalKey: 'publicationDate' },
  venue: { orkgKey: 'venue', evalKey: 'venue' }
};

export const metadataFieldsData = [
  {
    id: 'title',
    label: 'Title Extraction',
    description: 'Evaluate the accuracy and quality of the title extraction from the document.'
  },
  {
    id: 'authors',
    label: 'Authors Extraction',
    description: 'Assess how well the system identified and extracted all author names.'
  },
  {
    id: 'doi',
    label: 'DOI Extraction',
    description: 'Evaluate the accuracy of the DOI (Digital Object Identifier) extraction.'
  },
  {
    id: 'publication_year',
    label: 'Publication Year',
    description: 'Assess the accuracy of the extracted publication year.'
  },
  {
    id: 'venue',
    label: 'Venue/Journal',
    description: 'Evaluate how well the system identified the publication venue or journal name.'
  }
];