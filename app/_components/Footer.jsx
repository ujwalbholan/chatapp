import '../_style/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} MyWebsite. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
