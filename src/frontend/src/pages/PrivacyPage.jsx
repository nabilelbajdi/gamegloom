import React from "react";
import PageMeta from "../components/common/PageMeta";

const PrivacyPage = () => {
  return (
    <>
      <PageMeta
        title="Privacy Policy"
        description="How GameGloom collects, uses, and protects your data."
        url="https://gamegloom.com/privacy"
      />
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-16 text-gray-300 leading-relaxed">
        <h1 className="text-white text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: June 1, 2026</p>

        <section className="space-y-4">
          <p>
            This Privacy Policy explains how GameGloom ("we", "us", "our") collects,
            uses, and protects information about you when you use our website and
            services (the "Service"). By using GameGloom, you agree to the practices
            described below.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">1. Who We Are</h2>
          <p>
            GameGloom is an independent game tracking and discovery platform operated
            from Sweden. The data controller for the purposes of the EU General Data
            Protection Regulation (GDPR) is the operator of GameGloom, reachable at{" "}
            <a className="text-primary underline" href="mailto:support@gamegloom.com">
              support@gamegloom.com
            </a>
            .
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">2. Information We Collect</h2>
          <p>We collect only the data we need to operate the Service:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Account data:</strong> username, email address, and a hashed password.
              Email verification status.
            </li>
            <li>
              <strong>Profile data:</strong> avatar image (optional), bio (optional), and
              linked Steam ID or PlayStation Network ID if you choose to connect them.
            </li>
            <li>
              <strong>Activity data:</strong> games you track, reviews you write, lists
              you create, and likes you give to public lists.
            </li>
            <li>
              <strong>Technical data:</strong> your IP address (used only for rate
              limiting and abuse prevention) and standard browser/request metadata
              recorded in server logs.
            </li>
          </ul>

          <h2 className="text-white text-2xl font-semibold mt-8">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To create and maintain your account and authenticate you</li>
            <li>To send transactional emails (verification, password reset)</li>
            <li>To provide features such as game tracking, reviews, lists, and discovery</li>
            <li>To protect against abuse, fraud, and unauthorized access</li>
            <li>To improve the Service and fix bugs</li>
          </ul>
          <p>
            We do not sell your personal data. We do not use advertising tracking or
            third-party marketing cookies. We do not engage in automated decision-making
            or profiling that produces legal or similarly significant effects on you.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">4. Legal Basis for Processing (EU/EEA Users)</h2>
          <p>Under the GDPR, our legal bases for processing your data are:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Contract:</strong> to provide the Service you signed up for
              (account, tracking, reviews).
            </li>
            <li>
              <strong>Legitimate interests:</strong> to keep the Service secure
              (rate limiting, abuse prevention).
            </li>
            <li>
              <strong>Consent:</strong> for optional integrations such as Steam or
              PlayStation library sync, which you can disconnect at any time.
            </li>
          </ul>

          <h2 className="text-white text-2xl font-semibold mt-8">5. Third-Party Services</h2>
          <p>
            We use the following third-party processors to operate GameGloom. Each
            handles your data only as needed to provide their service to us:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Neon</strong> — PostgreSQL database hosting</li>
            <li><strong>Render</strong> — backend application hosting</li>
            <li><strong>Vercel</strong> — frontend application hosting</li>
            <li><strong>Cloudinary</strong> — storage and delivery of your uploaded avatar</li>
            <li><strong>Resend</strong> — sending transactional emails</li>
            <li><strong>IGDB (Twitch/Amazon)</strong> — game metadata and cover images (read-only)</li>
            <li>
              <strong>Steam &amp; PlayStation Network APIs</strong> — only when you
              opt in to library sync
            </li>
          </ul>

          <h2 className="text-white text-2xl font-semibold mt-8">6. Cookies and Local Storage</h2>
          <p>
            We do not use third-party tracking cookies or analytics. We use browser
            local storage strictly to keep you signed in (authentication token) and to
            remember small UI preferences such as recently viewed games. You can clear
            this data at any time through your browser settings.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">7. Data Retention</h2>
          <p>
            We retain your account data for as long as your account exists. Server
            logs are retained for a short period for security and debugging purposes.
            If you delete your account, your personal data is removed or anonymized
            within 30 days, except where we are legally required to retain it.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data (editable in your account settings)</li>
            <li>Export your data in a machine-readable format</li>
            <li>Delete your account and associated data</li>
            <li>Object to or restrict certain processing</li>
            <li>Withdraw consent for optional integrations at any time</li>
          </ul>
          <p>
            You can exercise most of these rights directly from your account settings.
            For anything you can't do yourself, email us at the address below. EU/EEA
            users also have the right to lodge a complaint with their national data
            protection authority.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">9. Security</h2>
          <p>
            We use industry-standard measures to protect your data, including TLS
            encryption in transit, bcrypt password hashing, and strict access controls.
            No system is perfectly secure, so we encourage you to use a strong, unique
            password and to report any suspected breach to us promptly.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">10. Children's Privacy</h2>
          <p>
            GameGloom is not intended for children under 13, and we do not knowingly
            collect personal data from anyone under 13. If you believe a child has
            provided us with personal data, please contact us so we can delete it.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">11. International Data Transfers</h2>
          <p>
            Some of our third-party processors (such as Render, Vercel, and Cloudinary)
            may process data outside the EU/EEA. Where this occurs, we rely on
            appropriate safeguards (such as the EU Standard Contractual Clauses
            published by those providers).
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will
            update the "Last updated" date above. Material changes will be communicated
            through the Service.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">13. Contact</h2>
          <p>
            For any questions about this Privacy Policy or how we handle your data,
            contact us at{" "}
            <a className="text-primary underline" href="mailto:support@gamegloom.com">
              support@gamegloom.com
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
};

export default PrivacyPage;
