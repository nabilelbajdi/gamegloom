import React from "react";
import PageMeta from "../components/common/PageMeta";

const TermsPage = () => {
  return (
    <>
      <PageMeta
        title="Terms of Service"
        description="The terms that govern your use of GameGloom."
        url="https://gamegloom.com/terms"
      />
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-16 text-gray-300 leading-relaxed">
        <h1 className="text-white text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: June 1, 2026</p>

        <section className="space-y-4">
          <p>
            Welcome to GameGloom. These Terms of Service ("Terms") govern your access
            to and use of the GameGloom website and services (the "Service"), operated
            from Sweden. By creating an account or using the Service, you agree to
            these Terms. If you do not agree, please do not use the Service.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">1. Eligibility</h2>
          <p>
            You must be at least 13 years old to use GameGloom. By using the Service,
            you confirm that you meet this age requirement. If you are under the age
            of majority in your jurisdiction, you should review these Terms with a
            parent or guardian.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">2. Your Account</h2>
          <p>
            You are responsible for keeping your account credentials secure and for
            all activity that occurs under your account. You agree to provide accurate
            information when registering and to keep it up to date. Please notify us
            promptly if you believe your account has been compromised.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">3. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Post content that is unlawful, harassing, hateful, threatening, or infringing</li>
            <li>Impersonate any person or misrepresent your affiliation with anyone</li>
            <li>Attempt to access accounts, data, or systems you are not authorized to use</li>
            <li>Use automated tools to scrape, spam, or otherwise overload the Service</li>
            <li>Reverse engineer, probe, or interfere with the security of the Service</li>
            <li>Use the Service to distribute malware or to facilitate illegal activity</li>
          </ul>
          <p>
            We may remove content or suspend accounts that violate these Terms, with
            or without prior notice.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">4. User Content</h2>
          <p>
            You retain ownership of the reviews, lists, comments, and other content
            you post ("User Content"). By posting User Content, you grant GameGloom a
            non-exclusive, worldwide, royalty-free license to host, display, and
            distribute that content within the Service for the purpose of operating
            and promoting it.
          </p>
          <p>
            You are solely responsible for your User Content and represent that you
            have the necessary rights to post it. We do not endorse User Content and
            are not responsible for its accuracy.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">5. Third-Party Content and Services</h2>
          <p>
            Game metadata, cover art, screenshots, videos, and related materials are
            provided by IGDB and respective rights holders. GameGloom does not claim
            ownership of this content. Optional integrations such as Steam and
            PlayStation Network library sync are subject to those providers' own
            terms of service.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">6. Intellectual Property</h2>
          <p>
            The GameGloom name, logo, design, and original code are the property of
            the operator. You may not copy, modify, or distribute them without
            permission, except as permitted under the open-source license of any
            published source code.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">7. Termination</h2>
          <p>
            You may delete your account at any time from your account settings. We
            may suspend or terminate your access to the Service if you violate these
            Terms or if we discontinue the Service. Provisions that by their nature
            should survive termination (such as ownership, disclaimers, and
            limitations of liability) will continue to apply.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">8. Disclaimer</h2>
          <p>
            The Service is provided "as is" and "as available", without warranties
            of any kind, whether express or implied, including warranties of
            merchantability, fitness for a particular purpose, or non-infringement.
            We do not guarantee that the Service will be uninterrupted, secure, or
            free from errors, and we make no warranty regarding the accuracy of
            third-party game data.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, GameGloom and its operator will
            not be liable for any indirect, incidental, special, consequential, or
            punitive damages, or for any loss of data, profits, or goodwill arising
            out of or related to your use of the Service. Nothing in these Terms
            excludes liability that cannot be excluded under applicable law.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Sweden, without regard to its
            conflict of laws provisions. If you are a consumer in the EU/EEA, you
            retain the protection of any mandatory consumer law of your country of
            residence.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">11. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. When we do, we will update
            the "Last updated" date above. Continued use of the Service after changes
            become effective constitutes your acceptance of the new Terms.
          </p>

          <h2 className="text-white text-2xl font-semibold mt-8">12. Contact</h2>
          <p>
            For any questions about these Terms, contact us at{" "}
            <a className="text-primary underline" href="mailto:nabilelbajdi@hotmail.com">
              nabilelbajdi@hotmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
};

export default TermsPage;
