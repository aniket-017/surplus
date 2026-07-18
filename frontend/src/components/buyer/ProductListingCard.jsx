import { formatListingPrice, formatLocationShort } from '../../lib/productFormat'
import { getImageUrl } from '../../lib/productsApi'

export default function ProductListingCard({ product, onClick, saved = false, onToggleSave }) {
  const sellerName = product.seller?.name || 'Seller'

  return (
    <div className="product-card">
      <button type="button" className="product-card-main" onClick={onClick}>
        <div className="product-card-image">
          {product.images[0] ? (
            <img src={getImageUrl(product.images[0])} alt={product.title} />
          ) : null}
          <span className="product-card-location">{formatLocationShort(product.location)}</span>
        </div>
        <div className="product-card-body">
          <div className="product-card-title">{product.title}</div>
          <div className="product-card-category">{product.category}</div>
          <div className="product-card-price">{formatListingPrice(product)}</div>
          <div className="product-card-seller">
            <span className="product-card-seller-avatar">{sellerName[0]?.toUpperCase()}</span>
            <span>{sellerName}</span>
          </div>
        </div>
      </button>

      {onToggleSave ? (
        <button
          type="button"
          className={`product-card-save${saved ? ' is-saved' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            onToggleSave()
          }}
          aria-label={saved ? 'Remove from saved' : 'Save listing'}
          aria-pressed={saved}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {saved ? (
              <path
                fill="currentColor"
                d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5v16.2a.75.75 0 0 1-1.2.6L12 17.25l-4.8 4.05A.75.75 0 0 1 6 20.7V4.5Z"
              />
            ) : (
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                d="M7.5 4h9A1.5 1.5 0 0 1 18 5.5v14.2a.75.75 0 0 1-1.2.6L12 16.75l-4.8 3.55A.75.75 0 0 1 6 19.7V5.5A1.5 1.5 0 0 1 7.5 4Z"
              />
            )}
          </svg>
        </button>
      ) : null}
    </div>
  )
}
