export default function BuyerSearchBar({ value, onChange }) {
  return (
    <input
      type="search"
      className="buyer-search"
      placeholder="Search surplus materials..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
