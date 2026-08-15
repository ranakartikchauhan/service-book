export default function Home() {
  const categories = [
    { icon: '🧹', name: 'Cleaning' },
    { icon: '🍳', name: 'Cooking' },
    { icon: '🫧', name: 'Kitchen Deep Clean' },
    { icon: '🌿', name: 'Gardening' },
    { icon: '👕', name: 'Laundry' },
    { icon: '🤝', name: 'General Help' },
  ];

  const steps = [
    { icon: '📝', title: 'Post a Job', desc: 'Describe what you need done, set a budget, pick a date. Takes 2 minutes.' },
    { icon: '👀', title: 'Review Applicants', desc: 'See worker profiles, ratings, verification badges, and proposed rates.' },
    { icon: '💬', title: 'Chat & Hire', desc: 'Message workers directly in the app. Hire with one tap.' },
    { icon: '✅', title: 'Pay Safely', desc: 'Payment is held in escrow and released only after you confirm the job is done.' },
  ];

  const trust = [
    { icon: '🪪', title: 'ID Verified Workers', desc: 'Every worker on the platform has submitted a government-issued ID verified by our team before they can take any jobs.' },
    { icon: '💰', title: 'Escrow Payments', desc: 'Your money is held safely until you confirm the work is done. No cash, no risk, no awkward conversations.' },
    { icon: '⭐', title: 'Two-Way Ratings', desc: 'Both workers and posters rate each other. Bad actors get flagged fast — in both directions.' },
    { icon: '🆘', title: 'In-App SOS', desc: 'A safety button is always visible during active jobs. One tap shares your location and flags our team immediately.' },
  ];

  return (
    <>
      {/* Navigation */}
      <nav>
        <div className="container nav-inner">
          <div className="nav-logo">WorkMarket</div>
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#categories">Categories</a>
            <a href="#pricing">Pricing</a>
            <a href="#safety">Safety</a>
            <a href="#download">Download</a>
          </div>
          <a href="#download" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
            Get the App
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <div className="hero-badge">
              🇮🇳 Made for India's local service economy
            </div>
            <h1>
              Find trusted local workers,{' '}
              <span>right near you</span>
            </h1>
            <p>
              WorkMarket connects households with verified workers for cleaning, cooking, gardening, kitchen deep-cleans, and any local help you need — with safe in-app payments.
            </p>
            <div className="hero-ctas">
              <a href="#download" className="btn btn-primary">📱 Download App</a>
              <a href="#how-it-works" className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                How it works →
              </a>
            </div>
          </div>

          {/* Fake app preview cards */}
          <div className="hero-visual">
            <div className="app-card">
              <div className="app-card-header">
                <div className="app-card-avatar">🧹</div>
                <div>
                  <div className="app-card-title">Kitchen Deep Clean</div>
                  <div className="app-card-sub">📍 2.3 km away · ₹800 fixed</div>
                </div>
                <span className="app-card-badge badge-open">OPEN</span>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Need thorough kitchen cleaning before Diwali guests arrive. Today preferred.</div>
            </div>

            <div className="app-card">
              <div className="app-card-header">
                <div className="app-card-avatar">🌿</div>
                <div>
                  <div className="app-card-title">Garden Maintenance</div>
                  <div className="app-card-sub">📍 0.8 km away · ₹500/hr</div>
                </div>
                <span className="app-card-badge badge-hired">HIRED ✓</span>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Monthly garden upkeep — weeding, pruning, watering. Regular work available.</div>
            </div>

            <div className="app-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 28 }}>⭐⭐⭐⭐⭐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>"Excellent work, very professional"</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Priya R. reviewed Ravi K. · Kitchen cleaning</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Simple Process</span>
            <h2>Get work done in 4 easy steps</h2>
            <p>Post a job, pick a worker, pay safely. The whole thing happens inside the app.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={i} className="step">
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section section-dark" id="categories">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Categories</span>
            <h2>Any work. Any category.</h2>
            <p>From one-time deep cleans to regular gardening — post any local job and find help fast.</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <div key={cat.name} className="category-card">
                <div className="icon">{cat.icon}</div>
                <h3>{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="section" id="safety">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Trust & Safety</span>
            <h2>Built for safety — not just convenience</h2>
            <p>These workers will be entering your home. We take that seriously.</p>
          </div>
          <div className="trust-grid">
            {trust.map((item) => (
              <div key={item.title} className="trust-card">
                <div className="trust-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Worker CTA */}
      <section className="section section-dark">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <span className="section-tag">For Workers</span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '16px 0' }}>
              Get paid for your skills — on your schedule
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Set your own hours, choose the jobs that suit you, and get paid directly through the app. No middlemen, no chasing payments.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Find jobs near you in real time', 'Set your own rate and availability', 'Secure payments to your UPI/bank', 'Build a rated profile that gets you more work'].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
            borderRadius: 24, padding: 40, color: 'white', textAlign: 'center',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💼</div>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>₹15,000+</div>
            <div style={{ fontSize: 16, opacity: 0.8 }}>Average monthly earnings for active workers</div>
          </div>
        </div>
      </section>

      {/* Pricing & Subscriptions (V2) */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Simple & Transparent</span>
            <h2>Fair plans for workers & households</h2>
            <p>Start 100% free. Upgrade only when you want superpowers.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 40 }}>
            {/* Free Tier */}
            <div className="trust-card" style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Free Forever
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>Basic Plan</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-main)', marginBottom: 16 }}>₹0</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, padding: 0, marginBottom: 24 }}>
                <li style={{ color: 'var(--text-secondary)', fontSize: 14 }}>✓ 10 Job Applications / mo (Workers)</li>
                <li style={{ color: 'var(--text-secondary)', fontSize: 14 }}>✓ 3 Job Postings / mo (Posters)</li>
                <li style={{ color: 'var(--text-secondary)', fontSize: 14 }}>✓ Secure Razorpay Escrow Protection</li>
                <li style={{ color: 'var(--text-secondary)', fontSize: 14 }}>✓ Standard GPS Search & Chat</li>
              </ul>
              <a href="#download" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                Get Started Free
              </a>
            </div>

            {/* Worker Pro */}
            <div className="trust-card" style={{ border: '2px solid var(--primary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, right: 24, backgroundColor: 'var(--primary)', color: 'white', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999 }}>
                WORKER FAVORITE
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 8 }}>
                Worker Pro
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>Unlimited Earning</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>
                ₹299<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}> / month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, padding: 0, marginBottom: 24 }}>
                <li style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 600 }}>✓ Unlimited Job Applications</li>
                <li style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 600 }}>✓ ⚡ Top Profile Boost in Nearby Searches</li>
                <li style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 600 }}>✓ 💰 5% Lower Platform Commission</li>
                <li style={{ color: 'var(--text-secondary)', fontSize: 14 }}>✓ Instant Match Urgent Job Push Alerts</li>
              </ul>
              <a href="#download" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                Upgrade to Pro
              </a>
            </div>

            {/* Poster Business */}
            <div className="trust-card" style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Poster Business
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>Power Households</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-main)', marginBottom: 16 }}>
                ₹499<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}> / month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, padding: 0, marginBottom: 24 }}>
                <li style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 600 }}>✓ Unlimited Job Postings</li>
                <li style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 600 }}>✓ ⚡ Priority Matching with Top Workers</li>
                <li style={{ color: 'var(--text-secondary)', fontSize: 14 }}>✓ Recurring Weekly/Monthly Cleaning Scheduler</li>
                <li style={{ color: 'var(--text-secondary)', fontSize: 14 }}>✓ Dedicated Priority Support</li>
              </ul>
              <a href="#download" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                Join as Business
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="cta-section" id="download">
        <div className="container">
          <h2>Ready to get started?</h2>
          <p>Download the app and post your first job in under 2 minutes.</p>
          <div className="download-btns">
            <a href="#" className="store-btn">
              <span className="store-icon">🍎</span>
              <div className="store-text">
                <small>Download on the</small>
                <strong>App Store</strong>
              </div>
            </a>
            <a href="#" className="store-btn">
              <span className="store-icon">▶️</span>
              <div className="store-text">
                <small>Get it on</small>
                <strong>Google Play</strong>
              </div>
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 14, color: '#64748b' }}>
            App launching soon · Register interest by downloading
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-logo">WorkMarket</div>
          <p>Connecting local workers with people who need help — safely and simply.</p>
          <div className="footer-links">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Contact Us</a>
            <a href="#">For Workers</a>
            <a href="#">For Posters</a>
          </div>
          <p style={{ marginTop: 24, fontSize: 12 }}>© 2025 WorkMarket. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
