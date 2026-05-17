import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * PrivacyPage Component
 * Renders a static glassmorphic document card containing FretFlow's official privacy policies and data regulations.
 */
const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative flex flex-col">
      {/* Decorative backdrop graphics */}
      <AnimatedBackground />
      
      {/* Global Landing Navbar */}
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 flex-grow w-full">
        {/* Document Card panel */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden group hover:border-primary-500/30 transition-all duration-500">
          
          {/* Radiant auroral glow overlay */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

          {/* Page Heading */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
            Privacy Policy
          </h1>

          {/* Privacy statement content */}
          <div className="space-y-6 text-base text-gray-300 leading-relaxed relative z-10">
            <p className="text-gray-400 text-xs">Last updated: May 18, 2026</p>

            <p>
              At FretFlow, we are committed to protecting your privacy. This Privacy Policy describes how we collect, use, store, and share your personal information when you utilize our interactive guitar learning platform.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">1. Information We Collect</h2>
            <p>
              To provide a fully personalized learning experience, we collect certain details, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Account Credentials:</strong> Your username, email address, and encrypted passwords used for authentication.</li>
              <li><strong>Progress & Performance Data:</strong> Completed lessons, daily streak logs, song practice high scores, challenge histories, and leaderboard statistics.</li>
              <li><strong>Technical Metadata:</strong> Device parameters, basic connection data, and browser cookies used strictly to sustain active user login sessions.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">2. How We Use Your Information</h2>
            <p>
              The data collected is utilized solely to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Manage your active credentials, restore your account state, and sync your level progression.</li>
              <li>Calculate and rank your XP score on the global live leaderboard.</li>
              <li>Facilitate real-time competitive guitar duels and match-ups with other users.</li>
              <li>Send system notifications regarding milestone achievements, friend requests, or system updates.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">3. Data Sharing & Disclosure</h2>
            <p>
              Your personal information is secure. <strong>We do not sell, lease, trade, or share your data with any third-party marketing companies.</strong> Data is only disclosed when legally required or when essential to operate our secure database systems.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">4. Data Security</h2>
            <p>
              We implement strict industry-standard security and hashing protocols (such as bcrypt for password storage) to defend against unauthorized access, loss, or manipulation of user data. However, no database or network is 100% secure, and we urge you to use strong password protocols.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">5. Cookies and Session Storage</h2>
            <p>
              We use secure localStorage and cookie-like session stores exclusively to verify authentication states and automatically restore your user progress on app page refreshes.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">6. Your Rights</h2>
            <p>
              You have the right to request deletion of your account and clear all stored lesson history and score logs at any time. To execute account deletion or ask questions about our data policies, you can interact with our founders via the contact forms in the dashboard profile menu.
            </p>
          </div>
        </div>
      </main>

      {/* Global Landing Footer */}
      <Footer />
    </div>
  );
};

export default PrivacyPage;
