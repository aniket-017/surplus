import surplusLogo from '../assets/logo/surplus.png'

export default function Navbar() {
  return (
    <nav>
      <a href="#" className="logo nav-logo">
        <img
          src={surplusLogo}
          alt="Surplus — Buy, Sell, Recover Value"
          className="logo-img"
        />
      </a>
      <ul className="nav-links">
        <li>
          <a href="#problem">Problem</a>
        </li>
        <li>
          <a href="#how">How it Works</a>
        </li>
        <li>
          <a href="#categories">Categories</a>
        </li>
        <li>
          <a href="#why">Why Surplus</a>
        </li>
      </ul>
      <div className="nav-cta">
        <a href="#" className="btn btn-outline">
          Sign In
        </a>
        <a href="#" className="btn btn-primary">
          Get the App ↗
        </a>
      </div>
      <button type="button" className="hamburger btn btn-outline" aria-label="Menu">
        ☰
      </button>
    </nav>
  )
}
