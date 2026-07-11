import "./PrivacySection.css";

import PublicNav from "../components/PublicNav";

const PRIVACY_SECTIONS = [
  {
    id: 'intro',
    paragraphs: [
      `1. The terms "AgilaPost," "we," "us," "our," or any grammatical variations 
      of the preceding words refer to AgilaPost Inc. The terms "you" or 
      "your" refer to the client, customer, or users of any of the interfaces 
      (including but not limited to websites, applications, and emails) provided by AgilaPost.`,
    ]
  },
  {
    id: 'applicability',
    paragraphs: [
      `2. AgilaPost’s Privacy Policy shall apply to the information obtained via our website(s), applications, emails, and through information obtained through third parties, and shall govern our behavior related to all services offered by us.`,
      `This document shall not curtail AgilaPost’s right to publish privacy policies specifically corresponding to one or more services.`
    ]
  },
  {
    id: 'queries',
    paragraphs: [
      `3. Queries regarding our Privacy Policy can be sent through any mode of communication specified by us in any of our interfaces.`
    ]
  },
  {
    id: 'information-collection-1',
    title: 'Information Collection and Usage',
    paragraphs: [
      `1. You shall be required to give certain information while accessing our website, communicating with us through other means, or making use of our services. Owing to the nature of our service, it shall be mandatory on your part to provide some specific details. Not providing us with certain information might act to your detriment. We might choose not to provide you our offering in case you fail or refuse to provide us with the information we need.`  
    ]
  },
  {
    id: 'information-collection-2',
    paragraphs: [
      `The information includes, but is not limited to, your name, your email ID(s), phone number(s), user ID for other websites and corresponding passwords, credit card details, and any other information required to provide you with our assistance efficiently.`
    ]
  },
  {
    id: 'information-collection-3',
    paragraphs: [
      `For the purpose of this Privacy Policy, "Personal Information" 
      means any information relating to an identified or identifiable individual. 
      We obtain Personal Information relating to you from various sources described below.`
    ]
  },
  {
    id: 'information-collection-4',
    paragraphs: [
      `Where applicable, we indicate whether and why you must provide us with your Personal Information, as well as the consequences of failing to do so. 
      If you do not provide Personal Information when requested, you may not be able to benefit from our 
      Service if that information is necessary to provide you with the service or if we are legally required to collect it.`
    ]
  },
  {
    id: 'personal-info-tiktok',
    subTitle: 'TikTok',
    paragraphs: [
      `AgilaPost allows you to connect specific social media accounts to facilitate automated scheduling, publishing, and analytics monitoring. By connecting these accounts, you authorize AgilaPost to access specific information in accordance with the authorization procedures provided by those platforms. 
      AgilaPost integrates strictly with TikTok, LinkedIn, and Meta (Facebook and Instagram).`,
    ]
  },
  {
    id: 'personal-info-linkedin',
    subTitle: 'LinkedIn',
    paragraphs: [
      `AgilaPost may allow you to connect a LinkedIn profile or company page to your AgilaPost account via the LinkedIn API. When connected, we collect registration details, authorized access tokens, profile identifiers, display names, and organization data necessary to publish posts, articles, and media content on your behalf, as well as retrieve authorized engagement analytics.`,
    ]
  },
  {
    id: 'personal-info-meta',
    subTitle: 'Meta (Facebook & Instagram)',
    paragraphs: [
      `AgilaPost may allow you to connect Facebook Pages and Instagram Professional/Business accounts via the Meta Graph API. When you authorize this connection, we collect access tokens, page/profile names, identifiers, and profile pictures. This information, along with the media files you upload, is used solely to publish scheduled posts, Reels, and stories, and to aggregate performance metrics (such as reach, impressions, and engagement data) for your internal review.`,
    ]
  },
  {
    id: 'how-we-share-1',
    title: 'How We Share and Protect Your Personal Information',
    subTitle: 'No Sale of Personal Data',
    paragraphs: [
      `We do not sell, trade, or rent any personal data to third-party vendors or external entities. Your information is used solely for providing and improving our services, in accordance with this privacy policy.`,
    ]
  },
  {
    id: 'how-we-share-2',
    subTitle: 'Sharing Platform Developer Data',
    paragraphs: [
      `AgilaPost will NOT use, sell, or share user data obtained via TikTok, LinkedIn, or Meta APIs with any other third-party services, data brokers, or advertising platforms. The stored developer platform data will be used exclusively to maintain and improve AgilaPost application functionality.`,
      `All other transfers, uses, or sales of user data are strictly prohibited, including: transferring, selling, or using user data for serving advertisements, including retargeting, personalized, or interest-based advertising.`
    ]
  },
  {
    id: 'how-we-share-3',
    subTitle: 'Limited Data Sharing for Infrastructure',
    paragraphs: [
      `Any data sharing is strictly limited to trusted third-party cloud infrastructure services required to operate our platform (e.g., secure cloud storage or database hosting). These providers are contractually obligated to handle your information with the highest level of security and confidentiality and are prohibited from using it for any purpose other than supporting our infrastructure.`
    ]
  },
  {
    id: 'data-retention',
    title: 'Data Retention for Active Customers',
    paragraphs: [
      `When you use our Service, you are permitted to upload content to the Service, including social media posts and other content which may include messages, reviews, photos, video, images, data, text, and other types of works (“User Content”). We store User Content indefinitely to support your historical logs and recurring schedules. This includes User Content stored for planning purposes in AgilaPost (but not yet published), 
      as well as User Content used in publishing social media posts, generating analytics, and historical logs.`,
      `Please note that when you delete your AgilaPost account, your User Content is deleted from our Service; however, this does not mean that the Content is deleted from your connected networks. User Content already published will continue to exist on TikTok, LinkedIn, or Meta platforms, and you will need to contact or log into the relevant platform directly if you want to remove that content.`
    ]
  },
  {
    id: 'compliance-tiktok',
    title: 'Platform Specific Compliance Policies',
    subTitle: `TikTok API Services`,
    paragraphs: [
      `AgilaPost utilizes TikTok API Services to handle video publishing. Users can manage or revoke access permissions at any time through their TikTok account security settings.`,
    ]
  },
  {
    id: 'compliance-meta-linkedin',
    subTitle: `Meta & LinkedIn APIs`,
    paragraphs: [
      `AgilaPost utilizes official developer tools for Meta and LinkedIn to deliver scheduling capabilities. Access can be managed or unlinked at any time via Facebook Business Integrations, Instagram settings, or LinkedIn permitted applications lists.`
    ]
  },
  {
    id: 'compliance-ai',
    subTitle: `AI/ML Restrictions`,
    paragraphs: [
      `Platform APIs and connected social media data are strictly not used to develop, improve, or train generalized Artificial Intelligence (AI) and/or Machine Learning (ML) models.`
    ]
  },
  {
    id: 'data-deletion',
    title: 'Data Deletion Requests',
    paragraphs: [
      `You have the right to request that all your personal information and stored account data be permanently deleted from our servers at any time. To initiate a data deletion request, please contact us via email at: help@agilapostapp.io (or your preferred support email). Requests will be processed securely within standard legal timeframes.`
    ]
  },    
  {
    id: 'security-info',
    title: 'Security of Information',
    paragraphs: [
      `AgilaPost makes use of industry-standard sound practices like data encryption (in transit and at rest), secure access controls, and firewalls to ensure that customer information is not misused or accessed without authority. Steps shall be undertaken by AgilaPost to ensure that customer information is not altered or destroyed to the detriment of its clients. While we implement rigorous safeguards, AgilaPost shall not be held liable for unforeseen loss of data resulting from unauthorized malicious access beyond reasonable security controls.`
    ]
  },    
  {
    id: 'changes-policy',
    title: 'Changes to the Privacy Policy',
    paragraphs: [
      `We might make suitable amendments to this Privacy Policy to maintain compliance with changing developer policies (such as TikTok, Meta, or LinkedIn updates). We shall endeavor to make our users and clients aware of these amendments. It is expected that users of our web pages or our clients read our Privacy Policy regularly to make themselves aware of any amendments made. AgilaPost shall not be liable for any delay in the publication of an amended Privacy Policy.`
    ]
  }    
];

function PrivacySection() {
  return (
    <div>
      <PublicNav />
      <div className="privacy-page">
        <div className="privacy-container">
          <h1 className="privacy-header">Privacy Policy</h1>
          {PRIVACY_SECTIONS.map((section) => (
            <div key={section.id} className="privacy-section">
              {section.title && <h2>{section.title}</h2>}
              {section.subTitle && <h4>{section.subTitle}</h4>}
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>
                  {paragraph}
                  <br />
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrivacySection;