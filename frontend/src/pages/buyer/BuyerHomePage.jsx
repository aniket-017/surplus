import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  const abortRef = useRef(null)
  const requestIdRef = useRef(0)
  const hasLoadedOnceRef = useRef(false)

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

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await getCategories()
      setCategories(categoriesData.categories)
    } catch {
      // Categories are non-blocking; feed can still load.
    }
  }, [])

  const loadFeed = useCallback(
    async ({ full = false } = {}) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const requestId = ++requestIdRef.current

      const useFullLoading = full || !hasLoadedOnceRef.current
      if (useFullLoading) {
        setLoading(true)
      } else {
        setUpdating(true)
      }
      setError('')

      try {
        const productsData = await browseProducts(
          {
            search: debouncedSearch || undefined,
            category: activeCategory || undefined,
            sort,
            city: activeFilter === 'near' && nearMeCity ? nearMeCity : undefined,
            limit: 40,
          },
          { signal: controller.signal },
        )

        if (requestId !== requestIdRef.current) return

        setProducts(productsData.products)
        hasLoadedOnceRef.current = true

        if (activeFilter === 'near' && !nearMeCity) {
          setError('Choose a location above so "Near Me" can filter listings near you.')
        }
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (requestId !== requestIdRef.current) return
        setError(err.message || 'Failed to load listings')
        setProducts([])
        hasLoadedOnceRef.current = true
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setUpdating(false)
        }
      }
    },
    [debouncedSearch, activeCategory, sort, activeFilter, nearMeCity],
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadFeed()
    return () => {
      abortRef.current?.abort()
    }
  }, [loadFeed])

  function handleFilterChange(filterId, nextSort) {
    setActiveFilter(filterId)
    setSort(nextSort)
  }

  function handleSearchSubmit(value) {
    const next = (value ?? search).trim()
    setSearch(next)
    setDebouncedSearch(next)
  }

  function handleSearchClear() {
    setSearch('')
    setDebouncedSearch('')
  }

  const searchStatus = debouncedSearch
    ? products.length === 0 && !loading && !updating
      ? `No results for “${debouncedSearch}”`
      : `Showing ${products.length} result${products.length === 1 ? '' : 's'} for “${debouncedSearch}”`
    : ''

  return (
    <AppShell role="buyer" title="Browse">
      <div className="buyer-home-header">
        <div className="buyer-home-header-text">
          <h2>Discover surplus</h2>
          <p>Find materials and equipment from verified sellers</p>
        </div>
        <BuyerLocationHeader />
      </div>

      <BuyerSearchBar
        value={search}
        onChange={setSearch}
        onSubmit={handleSearchSubmit}
        onClear={handleSearchClear}
      />

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
        {searchStatus ? (
          <p className="buyer-search-status">
            {searchStatus}
            {updating ? <span className="buyer-search-updating"> Updating…</span> : null}
            <button type="button" className="buyer-search-status-clear" onClick={handleSearchClear}>
              Clear
            </button>
          </p>
        ) : updating ? (
          <p className="buyer-search-status">Updating…</p>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            loadCategories()
            loadFeed({ full: true })
          }}
          disabled={loading || updating}
        >
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
          <p>
            {debouncedSearch
              ? `No listings match “${debouncedSearch}”. Try a different term or clear your filters.`
              : 'Try adjusting your search or filters to discover more surplus materials.'}
          </p>
        </div>
      ) : (
        <div className={`product-grid${updating ? ' is-updating' : ''}`}>
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
