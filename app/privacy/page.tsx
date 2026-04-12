import LegalPage from "@/components/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="12 April 2026">
      <p>This Privacy Policy describes how SkillMap (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your personal information when you use our platform at ashpranix.in (&quot;Platform&quot;).</p>

      <h2>1. Information We Collect</h2>
      <h3>1.1 Information You Provide</h3>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, phone number, password, role (Student/HR/Organisation/Mentor).</li>
        <li><strong>Profile Information:</strong> College name, degree, graduation year, field of interest, skills, work experience, certifications, bio, academic scores, resume, GitHub/LinkedIn URLs.</li>
        <li><strong>Payment Information:</strong> Payment details are processed by Razorpay. We do not store your card numbers or bank details. We store transaction IDs, amounts, and payment status.</li>
        <li><strong>Form Submissions:</strong> Information submitted through contact, partner, hire-from-us, mentor onboarding, and company onboarding forms.</li>
      </ul>

      <h3>1.2 Information Collected Automatically</h3>
      <ul>
        <li>Browser type and version</li>
        <li>IP address</li>
        <li>Pages visited and time spent</li>
        <li>Device information</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account</li>
        <li>To match students with relevant job openings</li>
        <li>To provide AI-powered career guidance</li>
        <li>To enable HR teams to search for and connect with candidates</li>
        <li>To process payments and manage subscriptions</li>
        <li>To verify mentor and company identities</li>
        <li>To send important notifications about your account, applications, and job matches</li>
        <li>To improve our Platform and services</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>We do <strong>not</strong> sell your personal information. We share your information only in the following cases:</p>
      <ul>
        <li><strong>With HR/Employers:</strong> When you apply for a job or your profile is searchable, HR users can view your profile information (name, skills, education, profile score). Your email is hidden from non-owners.</li>
        <li><strong>With Mentors:</strong> When you book a mentorship session, the mentor can see your name and domain interest.</li>
        <li><strong>Payment Processors:</strong> Razorpay processes your payments. Their privacy policy applies to payment data.</li>
        <li><strong>Legal Requirements:</strong> When required by law, court order, or government request.</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>We implement industry-standard security measures including:</p>
      <ul>
        <li>Passwords are hashed using bcrypt (never stored in plain text)</li>
        <li>HTTPS encryption for all data in transit</li>
        <li>Database access restricted to authorised personnel</li>
        <li>Razorpay PCI-DSS compliance for payment processing</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>We retain your data for as long as your account is active. You can request deletion of your account and data by contacting us at <strong>support@skillmap.com</strong>. Payment records are retained for 7 years as required by Indian tax law.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Update or correct your information</li>
        <li>Delete your account</li>
        <li>Withdraw consent for data processing</li>
        <li>Request a copy of your data</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies.</p>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting a notice on the Platform.</p>

      <h2>9. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, contact us at:</p>
      <p><strong>Email:</strong> support@skillmap.com</p>
      <p><strong>Address:</strong> SkillMap, India</p>
    </LegalPage>
  );
}
