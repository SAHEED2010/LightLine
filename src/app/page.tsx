import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Headphones,
  ShieldCheck,
  Zap,
} from "lucide-react";
import styles from "./public.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="LightLine home">
          <span className={styles.brandMark}>
            <Zap size={18} fill="currentColor" />
          </span>
          lightline<span className={styles.brandDot}>.</span>
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#what-to-expect">What to expect</a>
          <Link href="/operator/login" className={styles.navAction}>
            Operator sign in <ArrowRight size={15} />
          </Link>
        </nav>
      </header>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span /> ELECTRICITY COMPLAINTS, MADE TRACKABLE
          </p>
          <h1>
            Tell us what’s happening.
            <br />
            <span>Get a ticket you can follow.</span>
          </h1>
          <p className={styles.lede}>
            LightLine turns your electricity complaint into a clear record for
            the people who need to review it. Start with a phone conversation;
            leave with a reference number.
          </p>
          <a className={styles.primaryAction} href="#how-it-works">
            See how it works <ArrowDownRight size={17} />
          </a>
          <div className={styles.trust}>
            <ShieldCheck size={17} />
            <span>
              Your details are collected only to record and follow up on your
              complaint.
            </span>
          </div>
        </div>
        <div
          className={styles.traceCard}
          role="img"
          aria-label="Illustration: a caller describes a prepaid meter issue in Yaba, and LightLine turns it into a complaint record with a reference issued after saving."
        >
          <div className={styles.traceTop}>
            <span>FROM CALL TO RECORD</span>
            <span className={styles.traceSignal}>
              <i /> CALL-BASED INTAKE
            </span>
          </div>
          <div className={styles.traceBody}>
            <div className={styles.voiceNode}>
              <span className={styles.headphone}>
                <Headphones size={19} />
              </span>
              <div>
                <b>Your words</b>
                <small>
                  “My meter stopped
                  <br />
                  accepting tokens.”
                </small>
              </div>
            </div>
            <div className={styles.signal}>
              <span className={styles.signalLine} />
              <span className={styles.signalWave}>▂▅▃▇▄▂▆▃▅▂</span>
              <span className={styles.signalLine} />
            </div>
            <div className={styles.ticket}>
              <div className={styles.ticketCap}>
                COMPLAINT RECORD <span>01</span>
              </div>
              <b>Prepaid meter issue</b>
              <div className={styles.ticketMeta}>
                <span>Yaba, Lagos</span>
                <span className={styles.openPip}>● Open</span>
              </div>
              <div className={styles.ticketRule} />
              <small>REFERENCE</small>
              <strong>LL-••••</strong>
              <em>Issued after a complaint is saved</em>
            </div>
          </div>
          <div className={styles.traceFoot}>
            <span>LISTEN</span>
            <span>CLARIFY</span>
            <span>RECORD</span>
            <span>REFERENCE</span>
          </div>
        </div>
      </section>
      <section id="how-it-works" className={styles.process}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>A CLEARER WAY FORWARD</p>
          <h2>
            One conversation.
            <br />A record you can refer to.
          </h2>
        </div>
        <div className={styles.steps}>
          <article>
            <span className={styles.stepNo}>01</span>
            <h3>Explain the issue</h3>
            <p>
              Call and describe what’s happening in your own words. Share the
              area and meter or account details if you have them.
            </p>
          </article>
          <article>
            <span className={styles.stepNo}>02</span>
            <h3>We make a clear record</h3>
            <p>
              LightLine organizes the details into a complaint for an operator
              to review. We’ll ask when a useful detail is missing.
            </p>
          </article>
          <article>
            <span className={styles.stepNo}>03</span>
            <h3>Keep your reference</h3>
            <p>
              Once the complaint is saved, you receive its ticket reference.
              Operators can use that record to review and update its status.
            </p>
          </article>
        </div>
      </section>
      <section id="what-to-expect" className={styles.bottomBand}>
        <div>
          <p className={styles.eyebrow}>GOOD TO KNOW</p>
          <h2>Only share what helps us identify the complaint.</h2>
          <p>
            LightLine does not need your PIN, password, or one-time code. A
            reference is provided only after your complaint has been recorded.
          </p>
        </div>
        <Link href="/operator/login" className={styles.secondaryAction}>
          Operator access <ArrowRight size={16} />
        </Link>
      </section>
      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <Zap size={15} fill="currentColor" />
          </span>
          lightline<span className={styles.brandDot}>.</span>
        </Link>
        <span>Clear records for electricity complaints.</span>
        <span>© LightLine</span>
      </footer>
    </main>
  );
}
