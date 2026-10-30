import React from 'react';
import PolicyLayout from '../components/PolicyLayout';
import { privacyPolicyData } from '../data/legalDocuments';

const PrivacyPolicy: React.FC = () => {
  return <PolicyLayout document={privacyPolicyData} />;
};

export default PrivacyPolicy;
