import React from 'react';
import PolicyLayout from '../components/PolicyLayout';
import { termsAndConditionsData } from '../data/legalDocuments';

const TermsAndConditions: React.FC = () => {
  return <PolicyLayout document={termsAndConditionsData} />;
};

export default TermsAndConditions;
