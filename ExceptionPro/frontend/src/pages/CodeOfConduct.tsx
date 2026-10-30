import React from 'react';
import PolicyLayout from '../components/PolicyLayout';
import { codeOfConductData } from '../data/legalDocuments';

const CodeOfConduct: React.FC = () => {
  return <PolicyLayout document={codeOfConductData} />;
};

export default CodeOfConduct;
