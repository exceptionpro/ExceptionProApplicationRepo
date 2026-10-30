export interface LegalSection {
  number?: string;
  title: string;
  content: string[];
}

export interface LegalContactInfo {
  platform?: string;
  entity?: string;
  address?: string;
  email?: string;
  website?: string;
  notice?: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  badge: string;
  lastUpdated: string;
  intro: string[];
  sections: LegalSection[];
  contactInfo?: LegalContactInfo;
  conclusion?: string[];
}

export const termsAndConditionsData: LegalDocument = {
  id: 'terms-and-conditions',
  title: 'Terms and Conditions',
  badge: 'Platform Terms',
  lastUpdated: 'October 2026',
  intro: [
    'Welcome to ExceptionPro. ExceptionPro is a business networking platform that connects Buyers and Suppliers so they can discover one another, communicate, and explore business opportunities. These Terms and Conditions explain the rules for accessing and using the ExceptionPro platform.',
    'By registering for, accessing, or using ExceptionPro, you confirm that you have read and agree to these Terms and Conditions. If you do not agree, do not use the platform.'
  ],
  sections: [
    {
      number: '1',
      title: 'The Services We Provide',
      content: [
        'ExceptionPro provides an online platform where Buyers and Suppliers can register, find potential business contacts, share relevant business information, and connect with one another.',
        'The purpose of ExceptionPro is to make it easier for Buyers and Suppliers to identify potential business partners. Buyers and Suppliers may become business partners and conduct business only if they independently decide to do so based on their mutual understanding and agreement.',
        'ExceptionPro provides the connection platform. Unless separately agreed in writing, ExceptionPro is not a buyer, supplier, broker, agent, guarantor, or party to any transaction between platform users.'
      ]
    },
    {
      number: '2',
      title: 'Free Access and Platform Charges',
      content: [
        'ExceptionPro currently provides its Buyer–Supplier connection services free of charge. ExceptionPro does not charge Buyers or Suppliers a registration fee, licence fee, or platform connection fee for the services covered by this free offering.',
        'Buyers and Suppliers remain responsible for costs arising from their own business activities, including product or service prices, taxes, delivery, transport, banking, insurance, and other expenses agreed between them.',
        'If ExceptionPro introduces any paid or additional services in the future, the applicable charges and terms will be communicated separately before those services are used. Nothing in this section waives fees, taxes, or other amounts payable by users to third parties.'
      ]
    },
    {
      number: '3',
      title: 'How ExceptionPro Is Funded',
      content: [
        'ExceptionPro does not use Buyers’ or Suppliers’ business details or data to target advertising, and does not sell such details or data for advertising purposes.',
        'ExceptionPro may review operational information as reasonably necessary to maintain, secure, troubleshoot, and improve the platform, subject to its Privacy Policy and applicable law. Any future change to the platform’s funding or data-use practices will be communicated transparently and handled in accordance with applicable law.'
      ]
    },
    {
      number: '4',
      title: 'Privacy and Protection of Business Information',
      content: [
        'ExceptionPro recognises that business contact details, supplier information, buyer requirements, commercial discussions, and other business information may be confidential or commercially sensitive.',
        'ExceptionPro will not sell or disclose a Buyer’s or Supplier’s confidential business information to that user’s competitors for competitive or commercial advantage. ExceptionPro will not use Buyer or Supplier details or data for advertising purposes.',
        'Information may be processed or shared where necessary to operate a feature requested by a user, provide hosting and technical services under appropriate confidentiality and security obligations, protect the platform and its users, or comply with applicable law, a valid court order, or a lawful request from a competent authority.',
        'Information that users choose to publish or share with other users may be visible to those users. Users should not post confidential information unless they are authorised to do so and understand the audience and purpose of the relevant feature.',
        'More information about the collection, use, retention, security, and handling of personal information should be set out in the ExceptionPro Privacy Policy. These Terms should be read together with that policy.'
      ]
    },
    {
      number: '5',
      title: 'Registration and User Accounts',
      content: [
        'Buyers and Suppliers must provide accurate, current, and complete information during registration and keep their account information reasonably up to date.',
        'Users must be authorised to register and act on behalf of the business they represent, where applicable. Users must keep their passwords and access credentials secure, must not impersonate another person or business, and must promptly report suspected unauthorised account access.',
        'Each user is responsible for activity carried out through their account, except to the extent that applicable law provides otherwise. Users must not sell, transfer, or provide access to their accounts to another person without ExceptionPro’s authorisation.'
      ]
    },
    {
      number: '6',
      title: 'Business Partnerships and Due Diligence',
      content: [
        'Registration on ExceptionPro does not automatically make one user the business partner of another. A business relationship is created only when the relevant Buyer and Supplier mutually agree to establish it.',
        'Before entering into a business relationship, each party should independently verify the other party’s identity, business credentials, authorisations, product or service details, quality, price, payment terms, delivery commitments, and other relevant matters.',
        'ExceptionPro does not guarantee the identity, legitimacy, creditworthiness, quality, performance, reliability, or conduct of any Buyer or Supplier unless ExceptionPro expressly states otherwise in writing.'
      ]
    },
    {
      number: '7',
      title: 'Transactions and Commercial Responsibilities',
      content: [
        'Buyers and Suppliers are solely responsible for negotiating, documenting, and performing their own transactions and agreements. This includes quotations, purchase orders, contracts, payments, deliveries, taxes, warranties, refunds, returns, product compliance, and applicable legal requirements.',
        'ExceptionPro does not control or guarantee the products or services offered by users, the accuracy of user-provided information, the availability of goods, payment completion, or the performance of either party.',
        'Users should exercise appropriate caution before making payments, sharing sensitive information, or entering into a transaction. Users are encouraged to document their agreements in writing.'
      ]
    },
    {
      number: '8',
      title: 'Disputes Between Buyers and Suppliers',
      content: [
        'ExceptionPro is a platform that connects Buyers and Suppliers. ExceptionPro is not responsible for resolving disputes or conflicts between Buyers and Suppliers arising from their business relationships or transactions.',
        'Examples include disputes concerning non-payment, delayed payment, non-delivery, delayed delivery, product quality, quantity, specifications, warranties, cancellations, refunds, misrepresentation, or breach of contract.',
        'The parties concerned are responsible for attempting to resolve their disputes directly or through mutually agreed mediation, arbitration, legal proceedings, or other appropriate channels. This section does not exclude any responsibility that ExceptionPro cannot lawfully exclude.'
      ]
    },
    {
      number: '9',
      title: 'User Content and Responsibilities',
      content: [
        'Users are responsible for the information, messages, product descriptions, images, documents, and other content they upload, submit, or share through ExceptionPro.',
        'Users must ensure that they have the necessary rights and permissions to share such content. Content must not be unlawful, fraudulent, misleading, defamatory, abusive, discriminatory, threatening, infringing, or otherwise prohibited by applicable law.',
        'Users must not upload malware, attempt unauthorised access, interfere with platform operations, collect data through unauthorised automated means, or access information they are not permitted to access.',
        'ExceptionPro may review reported content and may remove content, restrict access, or suspend an account where reasonably necessary to enforce these Terms, protect users or the platform, or comply with law.'
      ]
    },
    {
      number: '10',
      title: 'Permission to Use Submitted Content',
      content: [
        'Users retain their rights in content they create and submit, subject to the rights of third parties and applicable law.',
        'By submitting content, a user grants ExceptionPro a limited, non-exclusive permission to host, store, reproduce, display, and process that content only as reasonably necessary to operate, secure, maintain, and provide the platform’s features, or as otherwise permitted by the user or applicable law.',
        'This permission does not transfer ownership of a user’s content to ExceptionPro. Users should not submit confidential or third-party content unless they are authorised to do so.'
      ]
    },
    {
      number: '11',
      title: 'Intellectual Property',
      content: [
        'ExceptionPro’s name, logo, software, website, design, and platform materials are owned by or licensed to their respective rights holders and may be protected by intellectual property laws.',
        'Users may not copy, modify, distribute, reverse engineer, or commercially exploit ExceptionPro’s protected materials except where permitted by law or with the necessary written permission. Users must respect the intellectual property rights of other users and third parties.'
      ]
    },
    {
      number: '12',
      title: 'Platform Availability and No Guarantee of Results',
      content: [
        'ExceptionPro will make reasonable efforts to maintain the platform, but does not guarantee that it will always be available, uninterrupted, error-free, or compatible with every device or system.',
        'ExceptionPro does not guarantee that users will find a business partner, receive enquiries, obtain orders, complete transactions, or achieve any particular commercial result. Users make their own business decisions and are responsible for assessing the risks.'
      ]
    },
    {
      number: '13',
      title: 'Suspension and Termination',
      content: [
        'ExceptionPro may suspend, restrict, or terminate an account where it reasonably believes that a user has materially or repeatedly breached these Terms, engaged in fraudulent or unlawful activity, threatened platform security, infringed others’ rights, or where action is required by law.',
        'Where appropriate and legally permitted, ExceptionPro may notify the user of the action and provide an opportunity to respond. Users may stop using the platform and request account closure through the available account settings or support channel.',
        'Any retention or deletion of information following account closure will be handled in accordance with the Privacy Policy and applicable legal requirements.'
      ]
    },
    {
      number: '14',
      title: 'Limitation of Liability',
      content: [
        'To the extent permitted by applicable law, ExceptionPro is not responsible for losses arising from transactions, agreements, acts, omissions, products, services, or disputes between Buyers and Suppliers, or from reliance on information supplied by users.',
        'To the extent permitted by law, ExceptionPro will not be liable for indirect, incidental, special, or consequential losses arising from use of, or inability to use, the platform.',
        'Nothing in these Terms excludes or limits any liability or legal right that cannot lawfully be excluded or limited under applicable law.'
      ]
    },
    {
      number: '15',
      title: 'Changes to These Terms',
      content: [
        'ExceptionPro may update these Terms to reflect changes to the platform, its services, operational practices, or applicable law. The updated version will be published with a revised effective date.',
        'Where reasonably practicable, material changes will be communicated through the platform or by email in advance. Where required by law, ExceptionPro will obtain any necessary notice, consent, or acceptance. If a user does not agree to the updated Terms, the user should stop using the platform and may request account closure.'
      ]
    },
    {
      number: '16',
      title: 'Governing Law and Disputes Concerning These Terms',
      content: [
        'These Terms are governed by the laws of India, subject to applicable mandatory legal protections.',
        'Any dispute between a user and ExceptionPro concerning these Terms will be addressed under applicable law. The competent courts and any other dispute-resolution mechanism will be determined in accordance with applicable law and any valid agreement between the parties.'
      ]
    },
    {
      number: '17',
      title: 'General Provisions',
      content: [
        'These Terms, together with any applicable policies referenced in them, form the terms governing a user’s use of ExceptionPro and replace prior terms concerning the same subject matter, to the extent permitted by law.',
        'If any provision is found unenforceable, the remaining provisions will continue to apply to the extent legally possible. A failure to enforce a provision is not a waiver of the right to enforce it later.',
        'Users may not transfer their rights or obligations under these Terms without ExceptionPro’s prior written consent, except where permitted by law. ExceptionPro may transfer its rights and obligations as part of a lawful restructuring, merger, or transfer of the relevant business, subject to applicable law.'
      ]
    },
    {
      number: '18',
      title: 'Contact Information',
      content: [
        'Questions, concerns, or complaints about ExceptionPro may be directed to the contact details below:'
      ]
    },
    {
      number: '19',
      title: 'Acceptance',
      content: [
        'By registering for or using ExceptionPro, you acknowledge that you have read and understood these Terms and Conditions and agree to be bound by them, subject to applicable law.',
        'ExceptionPro — Connecting Buyers and Suppliers.'
      ]
    }
  ],
  contactInfo: {
    platform: 'ExceptionPro',
    entity: 'Gowri Software Solutions Pvt Ltd',
    address: 'Bengaluru, Karnataka 560040',
    email: 'support@exceptionpro.com',
    website: 'www.exceptionpro.com'
  }
};

export const privacyPolicyData: LegalDocument = {
  id: 'privacy-policy',
  title: 'Privacy Policy',
  badge: 'Privacy & Data Protection',
  lastUpdated: 'October 2026',
  intro: [
    'This Privacy Policy explains how ExceptionPro (“ExceptionPro,” “we,” “us,” or “our”) collects, uses, stores, and protects information when buyers, suppliers, and other users access or use our website, application, and related services (collectively, the “Platform”). By registering for or using the Platform, you acknowledge that you have read this Policy.'
  ],
  sections: [
    {
      number: '1',
      title: 'About ExceptionPro',
      content: [
        'ExceptionPro provides an online platform that helps buyers and suppliers discover one another, connect, establish business-partner relationships by mutual agreement, and conduct their own business activities. ExceptionPro acts as a platform provider; it is not a party to transactions or commercial agreements entered into directly between buyers and suppliers unless a separate written agreement expressly states otherwise.',
        'Use of the Platform to connect buyers and suppliers is free of charge. ExceptionPro does not charge buyers or suppliers a platform licence fee or connection fee under this policy. Any future change to this arrangement will be communicated clearly before it takes effect.'
      ]
    },
    {
      number: '2',
      title: 'Information We May Collect',
      content: [
        'Depending on how you use the Platform, we may collect the following categories of information:',
        '• Registration and account information: name, business or organisation name, role (buyer, supplier, or both), username, email address, telephone number, business address, and account credentials.',
        '• Business profile information: products or services offered or purchased, business descriptions, industry, business contact details, and information you choose to add to your profile.',
        '• Platform activity and business records: business-partner requests and status, messages or collaboration details where supported, requisitions, purchase orders, receipts, invoices, reconciliation records, payment-status information, and other information you submit or generate through the Platform.',
        '• Technical and usage information: IP address, device and browser information, log data, access times, and information about how you use the Platform, where collected by the application or its hosting and security services.',
        '• Support communications: information you provide when contacting us for assistance, reporting an issue, or submitting feedback.',
        'Please provide only information you are authorised to share. Do not submit another person’s personal information or confidential business information unless you have an appropriate basis to do so.'
      ]
    },
    {
      number: '3',
      title: 'How We Use Information',
      content: [
        'We may use information to:',
        '• Create and administer user accounts and authenticate users;',
        '• Enable buyers and suppliers to find, connect with, and manage business-partner relationships;',
        '• Provide the Platform’s procurement and supplier-related features, including requisitions, purchase orders, receipts, invoices, reconciliation, and payment-status displays;',
        '• Communicate service notices, security alerts, and responses to support requests;',
        '• Maintain, secure, troubleshoot, and improve the Platform and prevent misuse or fraud;',
        '• Meet applicable legal obligations and enforce our terms and policies.'
      ]
    },
    {
      number: '4',
      title: 'No Advertising Use; No Sale of Business Data',
      content: [
        'ExceptionPro does not use buyer or supplier information submitted to the Platform to target advertising. We do not sell, rent, or disclose buyer or supplier details to competitors for their marketing or competitive purposes. We do not share such information with competitors in order to help them solicit your customers, suppliers, or business.',
        'We use information to operate and support the Platform as described in this Policy. This commitment does not prevent information from being visible to the buyer or supplier with whom you choose to connect, to users you authorise, or to service providers that help us operate the Platform under appropriate confidentiality and security obligations. It also does not prevent disclosures required by law or necessary to protect the rights, safety, and security of users or the Platform.'
      ]
    },
    {
      number: '5',
      title: 'When Information May Be Shared',
      content: [
        'We do not disclose buyer or supplier information to competitors for advertising or competitive use. Information may be shared only as reasonably necessary in the following circumstances:',
        '• With your chosen business partners: information you submit or make available in the Platform may be visible to a buyer or supplier with whom you establish or request a business relationship, or to users you authorise, depending on the Platform’s features and your actions.',
        '• With service providers: hosting, storage, security, communication, maintenance, and technical-support providers may process information on our behalf and subject to appropriate safeguards.',
        '• For legal and safety reasons: we may disclose information when required by applicable law, regulation, court order, or lawful government request, or where reasonably necessary to investigate fraud, protect rights, or address security incidents.',
        '• For business continuity: if the Platform or its business is reorganised or transferred, information may be handled as part of that process subject to appropriate confidentiality and legal protections.'
      ]
    },
    {
      number: '6',
      title: 'Buyer–Supplier Relationships and Business Transactions',
      content: [
        'Buyers and suppliers decide independently whether to connect, become business partners, negotiate terms, place orders, deliver goods or services, issue invoices, reconcile records, and make or receive payments. You are responsible for assessing the other party and ensuring that your business dealings comply with your agreements and applicable laws.',
        'ExceptionPro provides the connection and workflow platform only. To the extent permitted by law, ExceptionPro is not responsible for disputes, disagreements, non-performance, defective goods or services, delayed delivery, invoice differences, non-payment, or other conflicts between buyers and suppliers. The parties are responsible for resolving disputes directly between themselves. Nothing in this section excludes liability that cannot legally be excluded.'
      ]
    },
    {
      number: '7',
      title: 'Data Security',
      content: [
        'We use reasonable technical and organisational measures designed to protect information against unauthorised access, loss, misuse, alteration, or disclosure. No website, application, or electronic storage method can be guaranteed to be completely secure. Users should keep their credentials confidential and notify us promptly if they suspect unauthorised access to their accounts.'
      ]
    },
    {
      number: '8',
      title: 'Data Retention',
      content: [
        'We retain information for as long as reasonably necessary to provide the Platform, maintain accounts and business records, resolve support or security issues, comply with legal obligations, and enforce our agreements. Retention periods may vary depending on the type of information and applicable law. Deleting an account may not immediately remove records that we are legally required or permitted to retain.'
      ]
    },
    {
      number: '9',
      title: 'Your Choices and Rights',
      content: [
        'Subject to applicable law and the Platform’s functionality, you may be able to access and update account or business-profile information. You may also request a copy, correction, or deletion of your personal information, or raise an objection or concern about its processing, by contacting us using the details below. We may need to verify your identity and may retain certain information where required or permitted by law.'
      ]
    },
    {
      number: '10',
      title: 'Cookies and Similar Technologies',
      content: [
        'The website or application may use cookies, local storage, or similar technologies where needed for login sessions, security, preferences, and basic functionality. If analytics or other optional technologies are used, this Policy may be supplemented with details about those tools and any choices available to you. You can manage cookies through your browser settings, although disabling them may affect some features.'
      ]
    },
    {
      number: '11',
      title: 'Third-Party Services and Links',
      content: [
        'The Platform may rely on third-party infrastructure or contain links to external services. Those services may process information under their own terms and privacy policies. We encourage you to review their policies. ExceptionPro is not responsible for the independent privacy practices of third-party services that it does not control.'
      ]
    },
    {
      number: '12',
      title: 'Children',
      content: [
        'The Platform is intended for business use by individuals acting for themselves or on behalf of an organisation, not for children. If you believe a child has provided personal information to us, please contact us so we can review the matter and take appropriate steps.'
      ]
    },
    {
      number: '13',
      title: 'Changes to This Privacy Policy',
      content: [
        'We may update this Policy from time to time to reflect changes in the Platform, our practices, or applicable law. We will post the updated version on the Platform and revise the “Last updated” date. Where required by law, we will provide additional notice or seek consent.'
      ]
    },
    {
      number: '14',
      title: 'Contact and Privacy Requests',
      content: [
        'For questions, complaints, or requests concerning this Privacy Policy or your information, please contact ExceptionPro using the details below:'
      ]
    }
  ],
  contactInfo: {
    platform: 'ExceptionPro',
    entity: 'Gowri Software Solutions Pvt Ltd',
    address: 'Bangalore, Karnataka',
    email: 'support@exceptionpro.com'
  }
};

export const codeOfConductData: LegalDocument = {
  id: 'code-of-conduct',
  title: 'Code of Conduct',
  badge: 'Community & Ethics',
  lastUpdated: 'October 2026',
  intro: [
    'ExceptionPro provides a platform for buyers and suppliers to connect, establish business-partner relationships by mutual agreement, and manage procurement-related activities. This Code of Conduct sets out the standards expected of all users when accessing or using ExceptionPro, including when creating profiles, sending business-partner requests, communicating, sharing content, or using the Platform’s procurement workflows.',
    'By registering for or using ExceptionPro, you agree to comply with this Code of Conduct and any applicable Platform terms and policies. If you do not agree, do not use the Platform.'
  ],
  sections: [
    {
      number: '1',
      title: 'Our Platform Principles',
      content: [
        '• Professionalism and respect: treat buyers, suppliers, their employees, and other users respectfully and fairly.',
        '• Honesty and accuracy: provide truthful business, product, service, order, receipt, invoice, reconciliation, and payment-status information.',
        '• Fair dealing: conduct business honestly and do not use the Platform to mislead, exploit, or unfairly disadvantage another party.',
        '• Confidentiality: protect confidential business information and use information received through ExceptionPro only for legitimate, authorised purposes.',
        '• Accountability: take responsibility for your account activity, communications, submissions, and business decisions.',
        '• Compliance: comply with applicable laws, regulations, contracts, and the Platform’s terms and policies.'
      ]
    },
    {
      number: '2',
      title: 'Accurate Registration and Business Profiles',
      content: [
        '• Provide accurate, current, and complete registration and business-profile information.',
        '• Do not impersonate another person or organisation, misrepresent your identity, or falsely claim an affiliation, certification, authorisation, or business capability.',
        '• Keep your login credentials secure and do not access another user’s account without permission.',
        '• Update material business or contact details when they change.',
        '• Register and act only for a business or organisation that you are authorised to represent.'
      ]
    },
    {
      number: '3',
      title: 'Business-Partner Relationships',
      content: [
        '• Business-partner relationships are voluntary and must be established by mutual agreement between the buyer and supplier.',
        '• Do not send repeated, deceptive, coercive, or unwanted business-partner requests.',
        '• Respect another user’s decision to decline, end, or limit a business relationship.',
        '• Before sharing sensitive commercial information, confirm that you are authorised to share it and that the receiving party is entitled to receive it.',
        '• Evaluate prospective business partners independently and make your own decisions about whether to transact with them.'
      ]
    },
    {
      number: '4',
      title: 'Honest and Responsible Use of P2P Features',
      content: [
        '• Submit accurate and authorised requisitions, purchase orders, receipt records, invoices, reconciliation details, and payment-status information.',
        '• Do not fabricate, alter, duplicate, or deliberately misrepresent purchase, delivery, invoice, reconciliation, or payment records.',
        '• Do not falsely claim that goods or services have been delivered, accepted, invoiced, reconciled, paid for, or refunded.',
        '• Do not use the Platform to facilitate fraud, bribery, kickbacks, money laundering, collusion, price-fixing, or other unlawful or deceptive conduct.',
        '• Do not attempt to bypass access controls, manipulate records, interfere with another user’s account, or disrupt the Platform.',
        '• Use the Platform’s workflows in good faith and promptly communicate material discrepancies to the relevant business partner.'
      ]
    },
    {
      number: '5',
      title: 'Communications and User Content',
      content: [
        'Any text, images, documents, messages, profile information, or other material you submit must:',
        '• Be lawful, relevant, professional, and not knowingly false or misleading;',
        '• Not contain threats, harassment, hate speech, discriminatory abuse, obscene content, or defamatory statements;',
        '• Not infringe copyright, trademarks, trade secrets, privacy, or other rights of any person or organisation;',
        '• Not contain malware, malicious links, phishing attempts, or instructions intended to compromise systems or accounts;',
        '• Not impersonate another person or misrepresent the origin of content;',
        '• Not be spam, repetitive unsolicited solicitation, chain messages, pyramid schemes, or unauthorised advertising;',
        '• Not disclose personal data or confidential information unless you have authority and a legitimate reason to share it.'
      ]
    },
    {
      number: '6',
      title: 'Confidentiality and Protection of Business Information',
      content: [
        '• Treat non-public pricing, quotations, product plans, supplier or customer details, contracts, purchase records, and other confidential business information as confidential.',
        '• Do not disclose a business partner’s confidential information to competitors or other unauthorised parties.',
        '• Do not collect, copy, export, scrape, or use information from the Platform for unauthorised competitive, solicitation, or marketing purposes.',
        '• Use personal and business information only for the purpose for which it was legitimately provided and in accordance with applicable law and the Platform’s Privacy Policy.',
        '• If you receive information in error, do not use or distribute it; notify the relevant party or ExceptionPro support where appropriate.'
      ]
    },
    {
      number: '7',
      title: 'No Unauthorised Advertising or Misuse',
      content: [
        'ExceptionPro is intended to facilitate buyer–supplier connections and business workflows. Users must not use the Platform to send spam, mass unsolicited messages, deceptive promotions, or advertisements unrelated to legitimate business use. Users must not sell, license, or distribute another user’s information without proper authorisation.'
      ]
    },
    {
      number: '8',
      title: 'Disputes Between Buyers and Suppliers',
      content: [
        'Buyers and suppliers are independent parties. They are responsible for their own negotiations, contracts, orders, deliveries, product or service quality, invoices, reconciliation, payment, and compliance obligations. ExceptionPro provides the platform and related workflow tools; it does not act as a party to buyer–supplier agreements and does not undertake to resolve commercial disputes between users. Users should communicate directly and seek appropriate professional or legal advice where necessary. This section does not exclude any responsibility that cannot lawfully be excluded.'
      ]
    },
    {
      number: '9',
      title: 'Security and Prohibited Activities',
      content: [
        '• Do not attempt unauthorised access to the Platform, its systems, or another user’s data.',
        '• Do not upload viruses, malicious code, or files designed to damage, monitor, or interfere with systems.',
        '• Do not reverse engineer, probe, overload, disrupt, or bypass security controls except where expressly authorised by law or by ExceptionPro in writing.',
        '• Do not use the Platform for unlawful activity or to facilitate conduct that violates applicable sanctions, trade, anti-corruption, competition, or other laws.',
        '• Report suspected account compromise, security vulnerabilities, fraudulent activity, or serious Code violations through the designated support channel.'
      ]
    },
    {
      number: '10',
      title: 'Reporting a Concern',
      content: [
        'If you believe that a user has breached this Code of Conduct, misused confidential information, submitted fraudulent records, or engaged in abusive or unsafe behaviour, report the concern through ExceptionPro’s Support and Feedback feature or the official contact details listed on the Platform. Where possible, include relevant details and supporting evidence. Do not include unnecessary sensitive personal information in your report.'
      ]
    },
    {
      number: '11',
      title: 'Review and Enforcement',
      content: [
        'To the extent permitted by law, ExceptionPro may review reports and take reasonable action when it believes this Code of Conduct or applicable Platform terms have been breached. Depending on the circumstances, actions may include:',
        '• Issuing a warning or requesting corrective action;',
        '• Removing, restricting, or disabling access to content or records where appropriate;',
        '• Temporarily suspending or permanently restricting an account or Platform access;',
        '• Preserving relevant records or disclosing information where legally required or reasonably necessary to address security, fraud, or legal concerns;',
        '• Pursuing other remedies available under applicable terms or law.',
        'ExceptionPro may consider the nature, severity, frequency, and potential impact of the conduct when deciding what action is appropriate. We do not guarantee that every report will result in action or that we will be able to investigate every dispute.'
      ]
    },
    {
      number: '12',
      title: 'No Guarantee or Endorsement',
      content: [
        'A user’s presence on ExceptionPro or a business-partner connection does not, by itself, mean that ExceptionPro has verified, certified, endorsed, or guaranteed that user, its products or services, its creditworthiness, or its performance. Buyers and suppliers should conduct their own due diligence.'
      ]
    },
    {
      number: '13',
      title: 'Changes to This Code',
      content: [
        'We may update this Code of Conduct from time to time. The updated version will be posted on the Platform with a revised “Last updated” date. Where required by law, we will provide notice of material changes. Continued use of the Platform after changes take effect is subject to the revised Code, to the extent permitted by law.'
      ]
    },
    {
      number: '14',
      title: 'Contact Details',
      content: [
        'For questions or reports relating to this Code of Conduct, contact ExceptionPro using the details below:'
      ]
    }
  ],
  contactInfo: {
    platform: 'ExceptionPro',
    entity: 'Gowri Software Solutions Pvt Ltd',
    address: 'Bengaluru, Karnataka 560040',
    email: 'support@exceptionpro.com',
    notice: 'Important Notice: This Code of Conduct sets out general expectations and standards for using ExceptionPro. Users should review and comply with all applicable terms, contractual requirements, and laws.'
  }
};

export const disclaimerData: LegalDocument = {
  id: 'disclaimer',
  title: 'Disclaimer',
  badge: 'Legal Disclaimer',
  lastUpdated: 'October 2026',
  intro: [
    '1. Introduction and Purpose of the Platform',
    'ExceptionPro (the “Platform”) is a digital platform designed to connect buyers and suppliers and facilitate business networking between them. The Platform enables buyers and suppliers to discover potential business partners, communicate with one another, and explore business opportunities based on their individual requirements, own evaluation, and mutual understanding.',
    'ExceptionPro acts solely as a connecting platform. It does not directly participate in, control, or guarantee any business relationships or transactions between buyers and suppliers.'
  ],
  sections: [
    {
      number: '2',
      title: 'Free Platform Access and Connection Service',
      content: [
        'ExceptionPro provides its platform and buyer–supplier connection service free of charge.',
        'ExceptionPro does not charge buyers or suppliers platform access, connection, registration, or platform licence fees for using the Platform, unless otherwise expressly communicated through official terms and conditions.',
        'ExceptionPro does not impose additional licence fees or transaction costs on buyers or suppliers for connecting through the Platform.',
        'Buyers and suppliers are responsible for independent business expenses, statutory charges, taxes, and other costs arising from their own business activities or agreements. Any commercial terms, costs, taxes, or expenses arising from business conducted between a buyer and supplier are matters for those parties to agree upon directly.'
      ]
    },
    {
      number: '3',
      title: 'Acceptable Use and User Content',
      content: [
        'Users must not post, upload, transmit, or share any abusive, defamatory, infringing, obscene, indecent, discriminatory, fraudulent, unlawful, or spam content through ExceptionPro.',
        'ExceptionPro reserves the right, where appropriate and permitted by applicable law, to restrict, suspend, or block user access, or remove such content, without prior notice.'
      ]
    },
    {
      number: '4',
      title: 'Confidentiality and Protection of Business Information',
      content: [
        'ExceptionPro respects the confidentiality of business information shared by buyers and suppliers through the Platform.',
        'ExceptionPro will not sell or share buyers’ or suppliers’ confidential business details or information with their competitors for competitive or commercial advantage.',
        'ExceptionPro will not use buyers’ or suppliers’ business details, information, or data for advertising or promotional purposes without appropriate authorization.',
        'Information may be processed or disclosed where necessary to operate the Platform, with appropriate authorization, where permitted by the applicable Privacy Policy, or where required or permitted by applicable law, a lawful order, or a legitimate operational requirement.',
        'Business information will be handled in accordance with ExceptionPro’s applicable Privacy Policy and relevant data protection laws.',
        'ExceptionPro takes reasonable measures to protect information entrusted to the Platform. However, no digital platform can guarantee absolute security against every possible unauthorized access, technical failure, or security incident.',
        'Users should review the applicable Privacy Policy for further information about how personal and business information is collected, used, processed, stored, disclosed, and protected.'
      ]
    },
    {
      number: '5',
      title: 'Independent Business Relationships and Transactions',
      content: [
        'Buyers and suppliers may independently register on ExceptionPro and, based on their own evaluation and mutual understanding, choose to establish business relationships and conduct transactions.',
        'Registration on the Platform does not automatically create a business partnership, agency, joint venture, employment relationship, or other legal relationship with ExceptionPro.',
        'All commercial terms, including pricing, payment, delivery, quality standards, warranties, and service obligations, must be agreed upon directly between the relevant buyer and supplier.',
        'Buyers and suppliers are responsible for conducting their own due diligence before entering into any business relationship or transaction, including independently verifying the identity, credentials, capabilities, and information of prospective business partners.'
      ]
    },
    {
      number: '6',
      title: 'Limitation of Responsibility and Disputes',
      content: [
        'ExceptionPro functions solely as a platform connecting buyers and suppliers. It is not a party to any agreement, purchase order, contract, payment arrangement, or transaction entered into directly between them.',
        'ExceptionPro is not responsible for resolving disputes, conflicts, disagreements, claims, or other issues arising between buyers and suppliers.',
        'ExceptionPro is not responsible for payment defaults, delayed deliveries, defective goods, service deficiencies, contractual breaches, fraud, misrepresentation, or other actions or omissions of buyers or suppliers.',
        'ExceptionPro does not guarantee the conduct, products, services, performance, credibility, or reliability of any buyer or supplier, or that any buyer or supplier will enter into a business relationship, fulfil an obligation, or successfully complete a transaction.',
        'Buyers and suppliers are responsible for resolving disputes directly or through appropriate legal, mediation, arbitration, or other dispute-resolution mechanisms available to them.'
      ]
    },
    {
      number: '7',
      title: 'Disclaimer of Warranties and Platform Availability',
      content: [
        'To the extent permitted by applicable law, the Platform and the information, names, images, logos, icons, and other materials available through ExceptionPro are provided on an “AS IS” and “AS AVAILABLE” basis, without warranties or representations of any kind, whether express or implied.',
        'ExceptionPro does not warrant that the Platform will be uninterrupted or error-free, that defects will be corrected, or that the Platform or its servers will always be free from viruses, bugs, or other harmful components. ExceptionPro also does not guarantee the accuracy, completeness, reliability, suitability, or availability of information provided by users.',
        'ExceptionPro endeavours to maintain the availability and functionality of the Platform. However, uninterrupted access, error-free operation, and continuous availability cannot be guaranteed. Access may be temporarily suspended or restricted for maintenance, security, technical issues, or other operational reasons.'
      ]
    },
    {
      number: '8',
      title: 'User Responsibilities',
      content: [
        'All users of ExceptionPro agree to:',
        '• Provide accurate and lawful registration and business information.',
        '• Use the Platform for legitimate business networking and commercial purposes.',
        '• Respect the confidentiality and intellectual property rights of other users.',
        '• Independently verify the identity, credentials, capabilities, and information of prospective business partners.',
        '• Comply with applicable laws and regulations when conducting business through connections established on the Platform.',
        'Users are responsible for their own decisions, communications, agreements, and transactions.'
      ]
    },
    {
      number: '9',
      title: 'Data Usage and Privacy',
      content: [
        'ExceptionPro will handle personal information and business data in accordance with its Privacy Policy and applicable laws.',
        'The Platform does not intend to use buyer or supplier data for advertising purposes or to provide confidential business information to competitors for commercial advantage. Any collection, processing, storage, or disclosure of information will be subject to the applicable Privacy Policy, user permissions where required, and legal obligations.',
        'Users are encouraged to review the Privacy Policy to understand how their information is collected, used, stored, and protected.'
      ]
    },
    {
      number: '10',
      title: 'Amendments to This Disclaimer',
      content: [
        'ExceptionPro reserves the right to update or modify this Disclaimer from time to time to reflect changes in its services, operational practices, or applicable legal requirements. Any updated version may be published on the Platform with a revised effective date, where appropriate.',
        'Users are encouraged to review this Disclaimer periodically.'
      ]
    },
    {
      number: '11',
      title: 'Limitation under Applicable Law',
      content: [
        'Nothing in this Disclaimer excludes or limits any liability that cannot lawfully be excluded or limited under applicable law. This Disclaimer should be read together with ExceptionPro’s applicable Terms and Conditions and Privacy Policy.'
      ]
    },
    {
      number: '12',
      title: 'Acceptance of Disclaimer',
      content: [
        'By registering for, accessing, or using ExceptionPro, users acknowledge that they have read and understood this Disclaimer and agree to use the Platform in accordance with its terms and applicable policies.'
      ]
    },
    {
      number: '13',
      title: 'Contact Information',
      content: [
        'For questions or concerns regarding this Disclaimer, data confidentiality, or the operation of ExceptionPro, please contact ExceptionPro through the official contact details published on the Platform, or use the following details:'
      ]
    }
  ],
  contactInfo: {
    platform: 'ExceptionPro',
    entity: 'Gowri Software Solutions Pvt Ltd',
    address: 'Bengaluru, Karnataka 560040',
    email: 'support@exceptionpro.com',
    notice: 'Important Notice: This Disclaimer is intended to explain the general operating principles and responsibilities associated with ExceptionPro. It should be read together with the Platform’s Terms and Conditions and Privacy Policy. It is not a substitute for legal advice.'
  }
};
