import React from 'react';
import PolicyLayout from '../components/PolicyLayout';
import { disclaimerData } from '../data/legalDocuments';

const Disclaimer: React.FC = () => {
  return <PolicyLayout document={disclaimerData} />;
};

export default Disclaimer;
