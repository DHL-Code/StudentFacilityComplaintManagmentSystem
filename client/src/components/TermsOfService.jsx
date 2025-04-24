import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/TermsOfService.css';

const TermsOfService = () => {
	return (
		<div className="terms-container">
			<div className="terms-content">
				<h1>Terms of Service</h1>
				<p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

				<section className="terms-section">
					<h2>1. Acceptance of Terms</h2>
					<p>
						By accessing and using the Wolkite University Facility Complaint Management System, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the system.
					</p>
				</section>

				<section className="terms-section">
					<h2>2. User Responsibilities</h2>
					<ul>
						<li>Provide accurate and truthful information when submitting complaints</li>
						<li>Use the system only for legitimate facility-related concerns</li>
						<li>Maintain the confidentiality of your account credentials</li>
						<li>Report any unauthorized access to your account immediately</li>
						<li>Respect the privacy and rights of other users</li>
					</ul>
				</section>

				<section className="terms-section">
					<h2>3. Complaint Submission Guidelines</h2>
					<ul>
						<li>Complaints must be related to university facilities</li>
						<li>Provide clear and detailed descriptions of issues</li>
						<li>Include relevant photos or documentation when possible</li>
						<li>Do not submit false or misleading information</li>
						<li>Maintain appropriate language and tone in all communications</li>
					</ul>
				</section>

				<section className="terms-section">
					<h2>4. Privacy and Data Protection</h2>
					<p>
						We are committed to protecting your privacy. Your personal information will be:
					</p>
					<ul>
						<li>Used only for the purpose of processing and resolving complaints</li>
						<li>Stored securely and accessed only by authorized personnel</li>
						<li>Not shared with third parties without your consent, except as required by law</li>
					</ul>
				</section>

				<section className="terms-section">
					<h2>5. System Usage</h2>
					<ul>
						<li>The system is available 24/7, but maintenance may occur periodically</li>
						<li>We reserve the right to modify or discontinue any feature</li>
						<li>Users are responsible for maintaining their own internet connection</li>
						<li>System performance may vary based on network conditions</li>
					</ul>
				</section>

				<section className="terms-section">
					<h2>6. Resolution Process</h2>
					<p>
						The university will:
					</p>
					<ul>
						<li>Review all complaints in a timely manner</li>
						<li>Assign appropriate staff to address issues</li>
						<li>Provide updates on complaint status</li>
						<li>Work towards resolution based on available resources</li>
					</ul>
				</section>

				<section className="terms-section">
					<h2>7. Prohibited Activities</h2>
					<p>
						Users are prohibited from:
					</p>
					<ul>
						<li>Submitting false or malicious complaints</li>
						<li>Using the system for non-facility related purposes</li>
						<li>Attempting to access unauthorized areas of the system</li>
						<li>Engaging in any form of harassment or abuse</li>
						<li>Violating any university policies or regulations</li>
					</ul>
				</section>

				<section className="terms-section">
					<h2>8. Modifications to Terms</h2>
					<p>
						We reserve the right to modify these terms at any time. Users will be notified of significant changes. Continued use of the system after changes constitutes acceptance of the modified terms.
					</p>
				</section>

				<section className="terms-section">
					<h2>9. Contact Information</h2>
					<p>
						For questions about these Terms of Service, please contact:
					</p>
					<p>
						Email: support@wku.edu.et<br />
						Phone: +251 912 345 678<br />
						Office: Main Campus, Administration Building
					</p>
				</section>

				<div className="terms-footer">
					<Link to="/contactus" className="back-link">Back to Contact Page</Link>
				</div>
			</div>
		</div>
	);
};

export default TermsOfService; 