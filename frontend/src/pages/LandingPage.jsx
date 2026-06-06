import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Problem from '../components/Problem'
import HowItWorks from '../components/HowItWorks'
import Categories from '../components/Categories'
import Features from '../components/Features'
import Testimonials from '../components/Testimonials'
import CtaSection from '../components/CtaSection'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Categories />
      <Features />
      <Testimonials />
      <CtaSection />
      <Footer />
    </>
  )
}
