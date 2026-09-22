import { Link } from "react-router-dom";
import BrandMark from "../../components/common/BrandMark.jsx";
import ServiceIcon from "../../components/common/ServiceIcon.jsx";

const steps = [
  { number: "01", title: "Tell us what you need", text: "A leaking tap? A garden that needs some love? Start in your own words.", icon: "plumbing" },
  { number: "02", title: "Make the details clear", text: "Review your request and add the little things that matter.", icon: "cleaning" },
  { number: "03", title: "Find your kind of help", text: "Compare local providers by service, rating and price.", icon: "gardening" },
];

export default function Welcome() {
  return (
    <div className="welcome-page">
      <div className="welcome-shell">
        <header className="welcome-header">
          <BrandMark />
          <Link to="/login" className="welcome-login">Log in <span aria-hidden="true">↗</span></Link>
        </header>

        <main className="welcome-main">
          <section className="welcome-copy">
            <p className="welcome-eyebrow"><span aria-hidden="true" /> GOOD PEOPLE. LOCAL HELP.</p>
            <h1>A little help.<br /><span>A lighter day.</span></h1>
            <p className="welcome-intro">Life comes with a to-do list. Find the local skills to take something off yours, from everyday fixes to a fresh start.</p>
            <div className="welcome-actions">
              <Link to="/register" className="welcome-primary interactive-sheen">Find local help <span aria-hidden="true">→</span></Link>
              <a href="#how-it-works" className="welcome-secondary">How it works <span aria-hidden="true">↓</span></a>
            </div>
            <p className="welcome-reassurance"><span aria-hidden="true">✓</span> Review your request before it’s saved.</p>
            <div className="welcome-services" aria-label="Examples of local services">
              {['Plumbing', 'Cleaning', 'Gardening'].map((name) => <span key={name}><ServiceIcon name={name} />{name}</span>)}
            </div>
          </section>

          <section id="how-it-works" aria-labelledby="welcome-steps-title" className="welcome-story">
            <div className="welcome-story-orbit" aria-hidden="true" />
            <div className="welcome-story-heading">
              <p>LESS ADMIN. MORE LIVING.</p>
              <h2 id="welcome-steps-title">From “I need a hand”<br />to a plan.</h2>
            </div>
            <ol className="welcome-steps">
              {steps.map(({number,title,text,icon}, index) => (
                <li key={number} style={{'--step-delay': `${index * 65}ms`}}>
                  <div className="welcome-step-icon"><ServiceIcon name={icon} /></div>
                  <div className="welcome-step-copy"><h3>{title}</h3><p>{text}</p></div>
                  <span className="welcome-step-number" aria-hidden="true">{number}</span>
                </li>
              ))}
            </ol>
            <p className="welcome-story-note"><span aria-hidden="true">✦</span> A little technology. A human connection.</p>
          </section>
        </main>

        <footer className="welcome-footer"><span>Local skills. Shared possibilities.</span><span>Made for the everyday.</span></footer>
      </div>
    </div>
  );
}
