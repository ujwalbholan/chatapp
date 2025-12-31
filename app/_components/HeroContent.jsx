import "../_style/heroContent.css";
import Link from "next/link";

const HeroContent = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Connect with anyone, anytime with our Chat App
        </h1>
        <p className="hero-subtitle">
          Experience seamless messaging with real-time updates, AI suggestions,
          and an intuitive interface. Start chatting with your friends and team
          instantly.
        </p>
        <Link href="/chat">
        <button className="navbar-btn">Chat Now</button>
      </Link>
      </div>
    </section>
  );
};

export default HeroContent;
