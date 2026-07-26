// Source of truth for the Privacy Policy shown at /privacy-policy.
// Edit THIS file to change the policy text - no component/layout code
// needs to change. Keep the '**Last Updated: ...**' line current whenever
// the content meaningfully changes.
const privacyPolicyContent = `# Privacy Policy

**Last Updated: July 27, 2026**

## 1. Introduction

Justice Genie ("we," "us," "our," or the "App") is an AI-powered legal information platform operated by Yaganti Subhash and Vemula Siri Mahalaxmi ("we," "us," or "the operators"), currently offered as an independent academic and portfolio project, not through a registered company.

This Privacy Policy explains what information we collect when you use Justice Genie, how we use it, who we share it with, and the choices you have. By creating an account or using the App, you agree to the practices described here.

If you do not agree with this Policy, please do not use Justice Genie.

## 2. Information We Collect

**Account information you provide directly:**
- Username, email address, and password (stored securely as an irreversible hash — we never store or can see your actual password)
- Your selected profession (e.g., lawyer, student, general public)
- If you sign in with Google: your name, email address, and profile picture, as shared with us by Google

**Information generated through your use of the App:**
- The legal questions you ask and the AI's responses (your "chat history")
- Case-strength analysis requests and results
- Quiz activity, scores, and leaderboard ranking
- Feedback you submit
- A display "game name," if you choose to set one for the leaderboard

**Information collected automatically:**
- Session/login cookies, used solely to keep you logged in — not for advertising or tracking across other websites
- Basic technical information such as IP address and browser type, primarily for security, rate-limiting, and diagnosing errors

**Information we do *not* require:** we do not require your phone number or date of birth to create an account.

## 3. How We Use Your Information

We use your information to:
- Create and manage your account, and verify your identity at signup
- Provide the core functionality of the App: answering your legal questions, running case-strength analysis, and tracking quiz progress
- Send you transactional emails (e.g., email verification codes, password reset codes, welcome emails) — we do not send marketing emails
- Maintain the security of the platform, including detecting and preventing abuse (such as repeated incorrect login or verification attempts)
- Improve the App's reliability and features
- Respond to feedback or support requests you send us

## 4. How Your Questions Are Processed by AI (Important)

When you ask Justice Genie a legal question, your question text is sent to **Google's Gemini AI API** to generate a response. Google processes this text under its own API terms and data-handling practices, separate from ours. We do not control how Google's infrastructure processes this data beyond what their API commits to.

**We strongly recommend you avoid entering highly sensitive personal information** in your questions — such as Aadhaar or other government ID numbers, full names of other individuals involved in a dispute, exact financial account details, or anything you would not want processed by a third-party AI system. Ask your question in a way that describes your legal situation without including this level of identifying detail.

## 5. Third-Party Services We Use

We rely on the following third-party providers to operate Justice Genie. Each has its own privacy practices, which we encourage you to review:

| Provider | Purpose |
|---|---|
| **Google (Gemini API & Sign-In)** | Generates AI responses to your questions; provides the "Sign in with Google" option |
| **MongoDB Atlas** | Stores your account and chat data securely |
| **Cloudinary** | Hosts profile pictures and law reference PDF documents |
| **Brevo** | Sends verification codes, password reset emails, and welcome emails |
| **Vercel** | Hosts the website you interact with |
| **Render** | Hosts the backend service that powers the App |

We do not sell your personal information to anyone, for any purpose.

## 6. Cookies and Sessions

Justice Genie uses a single essential cookie to keep you logged in during your session. We do not use third-party advertising or cross-site tracking cookies.

## 7. How Long We Keep Your Information

- **Account data** is kept for as long as your account exists.
- **Chat history** is kept until you clear it yourself (via "Clear Chat") or delete your account.
- **Verification codes** (for signup or password reset) automatically expire after 10 minutes and are removed shortly after.
- If you delete your account, your personal data is permanently removed from our active database.

## 8. Data Security

We take reasonable technical measures to protect your data, including:
- Passwords stored as irreversible hashes, never in plain text
- All personal data and every account action are checked against your logged-in session — no page or feature can access another user's data
- Rate-limiting and attempt-limiting on sensitive actions like login and password reset, to reduce the risk of automated attacks

No system can guarantee absolute security, but we actively work to identify and fix vulnerabilities as we find them.

## 9. Your Rights and Choices

You can, at any time:
- **View and edit** your account details from the My Account page
- **Clear your chat history** at any point
- **Delete your account entirely**, which permanently removes your personal data from our systems
- **Contact us** (below) with any question, correction request, or concern about your data

## 10. Children's Privacy

Justice Genie is intended for users aged 18 and older. We do not knowingly collect information from anyone under 18. If you believe a minor has created an account, please contact us and we will remove it.

## 11. International Data Transfers

Some of our service providers (Google, Cloudinary, MongoDB Atlas, Vercel, Render) may store or process data on servers located outside India. By using the App, you consent to this transfer, which is necessary for us to provide the service.

## 12. Changes to This Policy

We may update this Privacy Policy from time to time as the App evolves. We will update the "Last Updated" date above when we do. Continued use of the App after changes means you accept the updated Policy.

## 13. Contact Us

If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:

**justicegenie2.0@gmail.com**
`;

export default privacyPolicyContent;
