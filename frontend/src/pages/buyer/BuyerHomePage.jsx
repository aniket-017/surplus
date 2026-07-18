import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import BuyerLocationHeader from '../../components/buyer/BuyerLocationHeader'
import BuyerSearchBar from '../../components/buyer/BuyerSearchBar'
import CategoryCarousel from '../../components/buyer/CategoryCarousel'
import ListingFilterChips from '../../components/buyer/ListingFilterChips'
import ProductListingCard from '../../components/buyer/ProductListingCard'
import { useAuth } from '../../context/AuthContext'
import { useBuyerLocation } from '../../context/LocationContext'
import { browseProducts, getCategories } from '../../lib/productsApi'

export default function BuyerHomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location } = useBuyerLocation()
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') || ''

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(categoryParam)
  const [activeFilter, setActiveFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const nearMeCity = location?.city || user?.address?.city || ''

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam)
    }
  }, [categoryParam])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [categoriesData, productsData] = await Promise.all([
        getCategories(),
        browseProducts({
          search: debouncedSearch || undefined,
          category: activeCategory || undefined,
          sort,
          city: activeFilter === 'near' && nearMeCity ? nearMeCity : undefined,
          limit: 40,
        }),
      ])

      setCategories(categoriesData.categories)
      setProducts(productsData.products)

      if (activeFilter === 'near' && !nearMeCity) {
        setError('Choose a location above so "Near Me" can filter listings near you.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load listings')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, activeCategory, sort, activeFilter, nearMeCity])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  function handleFilterChange(filterId, nextSort) {
    setActiveFilter(filterId)
    setSort(nextSort)
  }

  return (
    <AppShell role="buyer" title="Browse">
      <div className="buyer-home-header">
        <div className="buyer-home-header-text">
          <h2>Discover surplus</h2>
          <p>Find materials and equipment from verified sellers</p>
        </div>
        <BuyerLocationHeader />
      </div>

      <BuyerSearchBar value={search} onChange={setSearch} />

      <div className="buyer-banner">
        <h3>Turn surplus into value</h3>
        <p>Browse verified listings across metals, plastics, machinery, and more.</p>
      </div>

      <CategoryCarousel
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <ListingFilterChips activeFilter={activeFilter} onChangeFilter={handleFilterChange} />

      <div className="refresh-row">
        <button type="button" className="btn btn-outline" onClick={loadFeed} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <p className="dash-error">{error}</p> : null}

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>No listings found</h3>
          <p>Try adjusting your search or filters to discover more surplus materials.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductListingCard
              key={product.id}
              product={product}
              onClick={() => navigate(`/buyer/products/${product.id}`)}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
