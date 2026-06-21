import { formatListingPrice, formatLocationShort } from '../../lib/productFormat'
import { getImageUrl } from '../../lib/productsApi'

export default function ProductListingCard({ product, onClick }) {
  const sellerName = product.seller?.name || 'Seller'

  return (
    <button type="button" className="product-card" onClick={onClick}>
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
  )
}
