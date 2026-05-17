import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * TermsPage Component
 * Renders a static glassmorphic document card containing FretFlow's official service terms and user responsibilities.
 */
const TermsPage: React.FC = () => {
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
            Terms of Service
          </h1>

          {/* Service terms content */}
          <div className="space-y-6 text-base text-gray-300 leading-relaxed relative z-10">
            <p className="text-gray-400 text-xs">Last updated: May 18, 2026</p>
            
            <h2 className="text-xl font-bold text-white mt-8">1. Acceptance of Terms</h2>
            <p>
              Welcome to FretFlow ("we," "our," "us"). By accessing or using our website, services, lessons, interactive game modes, and tools (collectively, the "Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must immediately discontinue your use of the Platform.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">2. Intellectual Property Rights</h2>
            <p>
              The Platform and its entire contents, features, and functionality—including but not limited to all source code, software, algorithms, lesson curricula, song sheets, designs, audios, animations, logos, and graphics—are the exclusive intellectual property of the co-founders: Ravan Aliyev, Emirhan Alptekin, and Hüseyin Poyraz Küçükarslan. They are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws. No part of the Platform may be copied, modified, distributed, or republished without prior written authorization.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">3. User Accounts</h2>
            <p>
              To access certain features of the Platform, including progress tracking, duels, and leaderboards, you must register for an account. You agree to provide accurate, current, and complete information during registration. You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">4. Acceptable Use</h2>
            <p>
              You agree to use the Platform only for lawful purposes. You must not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use any automated device, script, spider, or manual process to monitor or copy our web content.</li>
              <li>Introduce any viruses, trojan horses, worms, logic bombs, or other malicious or technologically harmful materials.</li>
              <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Platform or the hosting database.</li>
              <li>Sublicense, lease, sell, or commercially exploit your account or the curriculum access.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">5. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided on an "as-is" and "as-available" basis. We make no representations or warranties of any kind, express or implied, regarding the accuracy, completeness, availability, security, or reliability of the services, audio algorithms, or materials provided.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall FretFlow, its founders, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of or inability to use the Platform.
            </p>
          </div>
        </div>
      </main>

      {/* Global Landing Footer */}
      <Footer />
    </div>
  );
};

export default TermsPage;
