import { Link } from 'react-router-dom';
import './InfoPage.css';

const pageContent = {
  // Static content gives the deployed app complete footer pages.
  about: {
    title: 'About Us',
    subtitle: 'Helping businesses stay on top of inventory and orders.',
    sections: [
      {
        heading: 'Our Mission',
        body: 'StockTrack was built to give small and growing businesses a simple, reliable way to manage products, customers, and orders without complex enterprise software.',
      },
      {
        heading: 'What We Offer',
        body: 'Real-time inventory tracking, automatic stock updates when orders are placed, customer management, and a clear dashboard so you always know what needs attention.',
      },
      {
        heading: 'Built for You',
        body: 'Whether you run a retail shop, warehouse, or online store, StockTrack keeps your operations organized with a clean interface and smart business rules.',
      },
    ],
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'We would love to hear from you.',
    sections: [
      {
        heading: 'Support Email',
        body: 'For technical support or account questions, email us at support@stocktrack.app. We typically respond within one business day.',
      },
      {
        heading: 'Phone',
        body: 'Call us at +91 99585 27919, Monday through Friday, 9:00 AM to 6:00 PM IST.',
      },
      {
        heading: 'Office',
        body: 'StockTrack HQ, India. Remote-first team serving businesses worldwide.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we handle your data.',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We store business data you enter into StockTrack, including product details, customer records, and order history. This data is used solely to provide the inventory management service.',
      },
      {
        heading: 'Data Security',
        body: 'We use industry-standard practices to protect your data, including encrypted connections and secure hosting environments. Access to your data is restricted to authorized systems only.',
      },
      {
        heading: 'Your Rights',
        body: 'You may request access to, correction of, or deletion of your data by contacting support@stocktrack.app. We do not sell your personal information to third parties.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Please read these terms before using StockTrack.',
    sections: [
      {
        heading: 'Acceptance of Terms',
        body: 'By using StockTrack, you agree to these terms. If you do not agree, please do not use the service.',
      },
      {
        heading: 'Use of Service',
        body: 'You are responsible for the accuracy of data you enter and for maintaining the confidentiality of your account credentials. Misuse of the platform may result in suspension of access.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'StockTrack is provided as-is. We are not liable for indirect damages arising from use of the service. Inventory and order decisions remain your responsibility.',
      },
    ],
  },
};

export default function InfoPage({ pageKey }) {
  // Pick the correct information page from the route key.
  const content = pageContent[pageKey];

  if (!content) {
    return (
      <div className="info-page">
        <p className="empty-state">Page not found.</p>
        <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="info-page">
      <header className="page-header">
        <Link to="/" className="btn btn-ghost btn-sm info-back">← Back to Dashboard</Link>
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
      </header>

      <div className="info-sections">
        {content.sections.map((section) => (
          <section key={section.heading} className="card info-card">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
